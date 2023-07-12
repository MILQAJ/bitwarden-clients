import { Directive, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormControl } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import {
  firstValueFrom,
  map,
  switchMap,
  Subject,
  catchError,
  forkJoin,
  from,
  of,
  finalize,
  takeUntil,
} from "rxjs";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { DevicesServiceAbstraction } from "@bitwarden/common/abstractions/devices/devices.service.abstraction";
import { OrganizationUserService } from "@bitwarden/common/abstractions/organization-user/organization-user.service";
import { OrganizationUserResetPasswordEnrollmentRequest } from "@bitwarden/common/abstractions/organization-user/requests";
import { OrganizationApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/organization/organization-api.service.abstraction";
import { DeviceTrustCryptoServiceAbstraction } from "@bitwarden/common/auth/abstractions/device-trust-crypto.service.abstraction";
import { LoginService } from "@bitwarden/common/auth/abstractions/login.service";
import { TokenService } from "@bitwarden/common/auth/abstractions/token.service";
import {
  DesktopDeviceTypes,
  DeviceType,
  MobileDeviceTypes,
} from "@bitwarden/common/enums/device-type.enum";
import { KeysRequest } from "@bitwarden/common/models/request/keys.request";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { ValidationService } from "@bitwarden/common/platform/abstractions/validation.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { AccountDecryptionOptions } from "@bitwarden/common/platform/models/domain/account";
import { EncString } from "@bitwarden/common/platform/models/domain/enc-string";
import { UserKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";

enum State {
  NewUser,
  ExistingUserUntrustedDevice,
}

type NewUserData = {
  readonly state: State.NewUser;
  readonly organizationId: string;
  readonly userEmail: string;
};

type ExistingUserUntrustedDeviceData = {
  readonly state: State.ExistingUserUntrustedDevice;
  readonly showApproveFromOtherDeviceBtn: boolean;
  readonly showReqAdminApprovalBtn: boolean;
  readonly showApproveWithMasterPasswordBtn: boolean;
  readonly userEmail: string;
};

type Data = NewUserData | ExistingUserUntrustedDeviceData;

@Directive()
export class BaseLoginDecryptionOptionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  protected State = State;

  protected data?: Data;
  protected loading = true;

  // Remember device means for the user to trust the device
  rememberDeviceForm = this.formBuilder.group({
    rememberDevice: [true],
  });

  get rememberDevice(): FormControl<boolean> {
    return this.rememberDeviceForm?.controls.rememberDevice;
  }

  constructor(
    protected formBuilder: FormBuilder,
    protected devicesService: DevicesServiceAbstraction,
    protected stateService: StateService,
    protected router: Router,
    protected activatedRoute: ActivatedRoute,
    protected messagingService: MessagingService,
    protected tokenService: TokenService,
    protected loginService: LoginService,
    protected organizationApiService: OrganizationApiServiceAbstraction,
    protected cryptoService: CryptoService,
    protected organizationUserService: OrganizationUserService,
    protected apiService: ApiService,
    protected i18nService: I18nService,
    protected validationService: ValidationService,
    protected deviceTrustCryptoService: DeviceTrustCryptoServiceAbstraction
  ) {}

  async ngOnInit() {
    this.loading = true;

    try {
      const accountDecryptionOptions: AccountDecryptionOptions =
        await this.stateService.getAccountDecryptionOptions();

      // TODO: verify that this doesn't also pick up key connector users... can key connector users even get here?
      // see sso-login.strategy - to determine if a user is new or not it just checks if there is a key on the token response..
      // can we check if they have a user key or master key in crypto service? Would that be sufficient?
      if (
        !accountDecryptionOptions?.trustedDeviceOption?.hasAdminApproval &&
        !accountDecryptionOptions?.hasMasterPassword
      ) {
        // We are dealing with a new account if:
        //  - User does not have admin approval (i.e. has not enrolled into admin reset)
        //  - AND does not have a master password
        this.loadNewUserData();
      } else {
        this.loadUntrustedDeviceData(accountDecryptionOptions);
      }

      // Note: this is probably not a comprehensive write up of all scenarios:

      // If the TDE feature flag is enabled and TDE is configured for the org that the user is a member of,
      // then new and existing users can be redirected here after completing the SSO flow (and 2FA if enabled).

      // First we must determine user type (new or existing):

      // New User
      // - present user with option to remember the device or not (trust the device)
      // - present a continue button to proceed to the vault
      //  - loadNewUserData() --> will need to load enrollment status and user email address.

      // Existing User
      // - Determine if user is an admin with access to account recovery in admin console
      //  - Determine if user has a MP or not, if not, they must be redirected to set one (see PM-1035)
      // - Determine if device is trusted or not via device crypto service (method not yet written)
      //  - If not trusted, present user with login decryption options (approve from other device, approve with master password, request admin approval)
      //    - loadUntrustedDeviceData()
    } catch (err) {
      this.validationService.showError(err);
    }
  }

  async loadNewUserData() {
    const autoEnrollStatus$ = this.activatedRoute.queryParamMap.pipe(
      map((params) => params.get("identifier")),
      switchMap((identifier) => {
        if (identifier == null) {
          return of(null);
        }

        return from(this.organizationApiService.getAutoEnrollStatus(identifier));
      })
    );

    const email$ = from(this.stateService.getEmail()).pipe(
      catchError((err: unknown) => {
        this.validationService.showError(err);
        return of(undefined);
      }),
      takeUntil(this.destroy$)
    );

    const autoEnrollStatus = await firstValueFrom(autoEnrollStatus$);
    const email = await firstValueFrom(email$);

    this.data = { state: State.NewUser, organizationId: autoEnrollStatus.id, userEmail: email };
    this.loading = false;
  }

  loadUntrustedDeviceData(accountDecryptionOptions: AccountDecryptionOptions) {
    this.loading = true;

    const mobileAndDesktopDeviceTypes: DeviceType[] = Array.from(MobileDeviceTypes).concat(
      Array.from(DesktopDeviceTypes)
    );

    // Note: Each obs must handle error here and protect inner observable b/c we are using forkJoin below
    // as per RxJs docs: if any given observable errors at some point, then
    // forkJoin will error as well and immediately unsubscribe from the other observables.
    const mobileOrDesktopDevicesExistence$ = this.devicesService
      .getDevicesExistenceByTypes$(mobileAndDesktopDeviceTypes)
      .pipe(
        catchError((err: unknown) => {
          this.validationService.showError(err);
          return of(undefined);
        }),
        takeUntil(this.destroy$)
      );

    const email$ = from(this.stateService.getEmail()).pipe(
      catchError((err: unknown) => {
        this.validationService.showError(err);
        return of(undefined);
      }),
      takeUntil(this.destroy$)
    );

    forkJoin({
      mobileOrDesktopDevicesExistence: mobileOrDesktopDevicesExistence$,
      email: email$,
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(({ mobileOrDesktopDevicesExistence, email }) => {
        const showApproveFromOtherDeviceBtn = mobileOrDesktopDevicesExistence || false;

        const showReqAdminApprovalBtn =
          !!accountDecryptionOptions?.trustedDeviceOption?.hasAdminApproval || false;

        const showApproveWithMasterPasswordBtn =
          accountDecryptionOptions?.hasMasterPassword || false;

        const userEmail = email;

        this.data = {
          state: State.ExistingUserUntrustedDevice,
          showApproveFromOtherDeviceBtn,
          showReqAdminApprovalBtn,
          showApproveWithMasterPasswordBtn,
          userEmail,
        };
      });
  }

  approveFromOtherDevice() {
    // TODO: plan is to re-use existing login-with-device component but rework it to have two flows
    // (1) Standard flow for unauthN user based on AuthService status
    // (2) New flow for authN user based on AuthService status b/c they have just authenticated w/ SSO
    if (this.data.state !== State.ExistingUserUntrustedDevice) {
      return;
    }

    this.loginService.setEmail(this.data.userEmail);
    this.router.navigate(["/login-with-device"]);
  }

  requestAdminApproval() {
    // this.router.navigate(["/admin-approval-requested"]); // new component that doesn't exist yet
    // Idea: extract logic from the existing login-with-device component into a base-auth-request-component that
    // the new admin-approval-requested component and the existing login-with-device component can extend
    // TODO: how to do:
    // add create admin approval request on new OrganizationAuthRequestsController on the server
    // once https://github.com/bitwarden/server/pull/2993 is merged
    // Client will create an AuthRequest of type AdminAuthRequest WITHOUT orgId and send it to the server
    // Server will look up the org id(s) based on the user id and create the AdminAuthRequest(s)
    // Note: must lookup if the user has an account recovery key (resetPasswordKey) set in the org
    // (means they've opted into the Admin Acct Recovery feature)
    // Per discussion with Micah, fire out requests to all admins in any orgs the user is a member of
    // UNTIL the Admin Console team finishes their work to turn on Single Org policy when Admin Acct Recovery is enabled.
  }

  async approveWithMasterPassword() {
    await this.deviceTrustCryptoService.setShouldTrustDevice(this.rememberDevice.value);
    this.router.navigate(["/lock"]);
  }

  createUser = async () => {
    if (this.data.state !== State.NewUser) {
      return;
    }

    // this.loading to support clients without async-actions-support
    this.loading = true;
    try {
      const { userKey, publicKey, privateKey } = await this.cryptoService.initAccount();
      const keysRequest = new KeysRequest(publicKey, privateKey.encryptedString);
      await this.apiService.postAccountKeys(keysRequest);

      await this.passwordResetEnroll(userKey, publicKey, privateKey);

      if (this.rememberDeviceForm.value.rememberDevice) {
        await this.deviceTrustCryptoService.trustDevice();
      }
    } catch (error) {
      this.validationService.showError(error);
    } finally {
      this.loading = false;
    }
  };

  passwordResetEnroll = async (userKey: UserKey, publicKey: string, privateKey: EncString) => {
    if (this.data.state !== State.NewUser) {
      return;
    }

    // this.loading to support clients without async-actions-support
    this.loading = true;
    try {
      const orgKeyResponse = await this.organizationApiService.getKeys(this.data.organizationId);
      if (orgKeyResponse == null) {
        throw new Error(this.i18nService.t("resetPasswordOrgKeysError"));
      }

      const orgPublicKey = Utils.fromB64ToArray(orgKeyResponse.publicKey);

      // RSA Encrypt user's userKey.key with organization public key
      const userId = await this.stateService.getUserId();
      const encryptedKey = await this.cryptoService.rsaEncrypt(userKey.key, orgPublicKey.buffer);

      const resetRequest = new OrganizationUserResetPasswordEnrollmentRequest();
      resetRequest.resetPasswordKey = encryptedKey.encryptedString;

      await this.organizationUserService.putOrganizationUserResetPasswordEnrollment(
        this.data.organizationId,
        userId,
        resetRequest
      );

      // TODO: On browser this should close the window. But since we might extract
      // this logic into a service I'm gonna leaves this as-is untill that
      // refactor is done
      await this.router.navigate(["/vault"]);
    } catch (error) {
      this.validationService.showError(error);
    } finally {
      this.loading = false;
    }
  };

  logOut() {
    this.loading = true; // to avoid an awkward delay in browser extension
    this.messagingService.send("logout");
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
