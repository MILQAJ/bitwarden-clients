import { PasswordInputResult } from "@bitwarden/auth/angular";
import { Account } from "@bitwarden/common/auth/abstractions/account.service";
import { MasterPasswordApiService } from "@bitwarden/common/auth/abstractions/master-password-api.service.abstraction";
import { PasswordRequest } from "@bitwarden/common/auth/models/request/password.request";
import { InternalMasterPasswordServiceAbstraction } from "@bitwarden/common/key-management/master-password/abstractions/master-password.service.abstraction";
import { UserId } from "@bitwarden/common/types/guid";
import { KeyService } from "@bitwarden/key-management";

import { ChangePasswordService } from "../../abstractions";

export class DefaultChangePasswordService implements ChangePasswordService {
  constructor(
    private keyService: KeyService,
    private masterPasswordApiService: MasterPasswordApiService,
    private masterPasswordService: InternalMasterPasswordServiceAbstraction,
  ) {}

  async rotateUserKeyMasterPasswordAndEncryptedData(
    currentPassword: string,
    newPassword: string,
    user: Account,
    hint: string,
  ): Promise<void | null> {
    return null; // implemented in Web
  }

  async rotateUserKeyAndEncryptedDataLegacy(
    newPassword: string,
    user: Account,
  ): Promise<void | null> {
    return null; // implemented in Web
  }

  async changePassword(passwordInputResult: PasswordInputResult, userId: UserId) {
    if (!userId) {
      throw new Error("userId not found");
    }
    if (!passwordInputResult.currentMasterKey || !passwordInputResult.currentServerMasterKeyHash) {
      throw new Error("currentMasterKey or currentServerMasterKeyHash not found");
    }

    const decryptedUserKey = await this.masterPasswordService.decryptUserKeyWithMasterKey(
      passwordInputResult.currentMasterKey,
      userId,
    );

    if (decryptedUserKey == null) {
      throw new Error("Could not decrypt user key");
    }

    const newMasterKeyEncryptedUserKey = await this.keyService.encryptUserKeyWithMasterKey(
      passwordInputResult.newMasterKey,
      decryptedUserKey,
    );

    const request = new PasswordRequest();
    request.masterPasswordHash = passwordInputResult.currentServerMasterKeyHash;
    request.newMasterPasswordHash = passwordInputResult.newServerMasterKeyHash;
    request.masterPasswordHint = passwordInputResult.newPasswordHint;
    request.key = newMasterKeyEncryptedUserKey[1].encryptedString as string;

    try {
      await this.masterPasswordApiService.postPassword(request);
    } catch {
      throw new Error("Could not change password");
    }
  }
}
