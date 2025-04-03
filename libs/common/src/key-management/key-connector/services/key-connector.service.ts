// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { combineLatest, filter, firstValueFrom, Observable, of, switchMap } from "rxjs";

import { LogoutReason } from "@bitwarden/auth/common";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import {
  Argon2KdfConfig,
  KdfConfig,
  PBKDF2KdfConfig,
  KeyService,
  KdfType,
} from "@bitwarden/key-management";

import { ApiService } from "../../../abstractions/api.service";
import { OrganizationService } from "../../../admin-console/abstractions/organization/organization.service.abstraction";
import { OrganizationUserType } from "../../../admin-console/enums";
import { Organization } from "../../../admin-console/models/domain/organization";
import { TokenService } from "../../../auth/abstractions/token.service";
import { KeysRequest } from "../../../models/request/keys.request";
import { KeyGenerationService } from "../../../platform/abstractions/key-generation.service";
import { LogService } from "../../../platform/abstractions/log.service";
import { Utils } from "../../../platform/misc/utils";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { KEY_CONNECTOR_DISK, StateProvider, UserKeyDefinition } from "../../../platform/state";
import { UserId } from "../../../types/guid";
import { MasterKey } from "../../../types/key";
import { InternalMasterPasswordServiceAbstraction } from "../../master-password/abstractions/master-password.service.abstraction";
import { KeyConnectorService as KeyConnectorServiceAbstraction } from "../abstractions/key-connector.service";
import { KeyConnectorUserKeyRequest } from "../models/key-connector-user-key.request";
import { SetKeyConnectorKeyRequest } from "../models/set-key-connector-key.request";

export const USES_KEY_CONNECTOR = new UserKeyDefinition<boolean | null>(
  KEY_CONNECTOR_DISK,
  "usesKeyConnector",
  {
    deserializer: (usesKeyConnector) => usesKeyConnector,
    clearOn: ["logout"],
    cleanupDelayMs: 0,
  },
);

export class KeyConnectorService implements KeyConnectorServiceAbstraction {
  readonly convertAccountRequired$: Observable<boolean>;

  constructor(
    accountService: AccountService,
    private masterPasswordService: InternalMasterPasswordServiceAbstraction,
    private keyService: KeyService,
    private apiService: ApiService,
    private tokenService: TokenService,
    private logService: LogService,
    private organizationService: OrganizationService,
    private keyGenerationService: KeyGenerationService,
    private logoutCallback: (logoutReason: LogoutReason, userId?: string) => Promise<void>,
    private stateProvider: StateProvider,
  ) {
    this.convertAccountRequired$ = accountService.activeAccount$.pipe(
      filter((account) => account != null),
      switchMap((account) =>
        combineLatest([
          of(account.id),
          this.organizationService
            .organizations$(account.id)
            .pipe(filter((organizations) => organizations != null)),
          this.stateProvider
            .getUserState$(USES_KEY_CONNECTOR, account.id)
            .pipe(filter((usesKeyConnector) => usesKeyConnector != null)),
          tokenService.hasAccessToken$(account.id).pipe(filter((hasToken) => hasToken)),
        ]),
      ),
      switchMap(async ([userId, organizations, usesKeyConnector]) => {
        const loggedInUsingSso = await this.tokenService.getIsExternal(userId);
        const requiredByOrganization = this.findManagingOrganization(organizations) != null;
        const userIsNotUsingKeyConnector = !usesKeyConnector;

        return loggedInUsingSso && requiredByOrganization && userIsNotUsingKeyConnector;
      }),
    );
  }

  async setUsesKeyConnector(usesKeyConnector: boolean, userId: UserId) {
    await this.stateProvider.getUser(userId, USES_KEY_CONNECTOR).update(() => usesKeyConnector);
  }

  async getUsesKeyConnector(userId: UserId): Promise<boolean> {
    return (
      (await firstValueFrom(this.stateProvider.getUserState$(USES_KEY_CONNECTOR, userId))) ?? false
    );
  }

  async migrateUser(userId: UserId) {
    const organization = await this.getManagingOrganization(userId);
    if (organization == null) {
      throw new Error(
        "[Key Connector service] No key connector enabled organization found, aborting user migration to key connector.",
      );
    }

    const masterKey = await firstValueFrom(this.masterPasswordService.masterKey$(userId));
    const keyConnectorRequest = new KeyConnectorUserKeyRequest(masterKey.encKeyB64);

    try {
      await this.apiService.postUserKeyToKeyConnector(
        organization.keyConnectorUrl,
        keyConnectorRequest,
      );
    } catch (e) {
      this.handleKeyConnectorError(e);
    }

    await this.apiService.postConvertToKeyConnector();

    await this.setUsesKeyConnector(true, userId);
  }

  // TODO: UserKey should be renamed to MasterKey and typed accordingly
  async setMasterKeyFromUrl(url: string, userId: UserId) {
    try {
      const masterKeyResponse = await this.apiService.getMasterKeyFromKeyConnector(url);
      const keyArr = Utils.fromB64ToArray(masterKeyResponse.key);
      const masterKey = new SymmetricCryptoKey(keyArr) as MasterKey;
      await this.masterPasswordService.setMasterKey(masterKey, userId);
    } catch (e) {
      this.handleKeyConnectorError(e);
    }
  }

  async getManagingOrganization(userId: UserId): Promise<Organization> {
    const organizations = await firstValueFrom(this.organizationService.organizations$(userId));
    return this.findManagingOrganization(organizations);
  }

  async convertNewSsoUserToKeyConnector(
    orgId: string,
    userId: UserId,
    keyConnectorUrl: string,
    kdf: KdfType,
    kdfIterations: number,
    kdfMemory?: number,
    kdfParallelism?: number,
  ) {
    const password = await this.keyGenerationService.createKey(512);
    const kdfConfig: KdfConfig =
      kdf === KdfType.PBKDF2_SHA256
        ? new PBKDF2KdfConfig(kdfIterations)
        : new Argon2KdfConfig(kdfIterations, kdfMemory, kdfParallelism);

    const masterKey = await this.keyService.makeMasterKey(
      password.keyB64,
      await this.tokenService.getEmail(),
      kdfConfig,
    );
    const keyConnectorRequest = new KeyConnectorUserKeyRequest(masterKey.encKeyB64);
    await this.masterPasswordService.setMasterKey(masterKey, userId);

    const userKey = await this.keyService.makeUserKey(masterKey);
    await this.keyService.setUserKey(userKey[0], userId);
    await this.keyService.setMasterKeyEncryptedUserKey(userKey[1].encryptedString, userId);

    const [pubKey, privKey] = await this.keyService.makeKeyPair(userKey[0]);

    try {
      await this.apiService.postUserKeyToKeyConnector(keyConnectorUrl, keyConnectorRequest);
    } catch (e) {
      this.handleKeyConnectorError(e);
    }

    const keys = new KeysRequest(pubKey, privKey.encryptedString);
    const setPasswordRequest = new SetKeyConnectorKeyRequest(
      userKey[1].encryptedString,
      kdfConfig,
      orgId,
      keys,
    );
    await this.apiService.postSetKeyConnectorKey(setPasswordRequest);
  }

  private handleKeyConnectorError(e: any) {
    this.logService.error(e);
    if (this.logoutCallback != null) {
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.logoutCallback("keyConnectorError");
    }
    throw new Error("Key Connector error");
  }

  private findManagingOrganization(organizations: Organization[]): Organization | undefined {
    return organizations.find(
      (o) =>
        o.keyConnectorEnabled &&
        o.type !== OrganizationUserType.Admin &&
        o.type !== OrganizationUserType.Owner &&
        !o.isProviderUser,
    );
  }
}
