import { DatePipe, Location } from "@angular/common";
import { ChangeDetectorRef, Component, NgZone, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, firstValueFrom, takeUntil, Subscription } from "rxjs";
import { first, map } from "rxjs/operators";

import { ViewComponent as BaseViewComponent } from "@bitwarden/angular/vault/components/view.component";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { AuditService } from "@bitwarden/common/abstractions/audit.service";
import { EventCollectionService } from "@bitwarden/common/abstractions/event/event-collection.service";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { TokenService } from "@bitwarden/common/auth/abstractions/token.service";
import { BillingAccountProfileStateService } from "@bitwarden/common/billing/abstractions/account/billing-account-profile-state.service";
import { BroadcasterService } from "@bitwarden/common/platform/abstractions/broadcaster.service";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { FileDownloadService } from "@bitwarden/common/platform/abstractions/file-download/file-download.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { FolderService } from "@bitwarden/common/vault/abstractions/folder/folder.service.abstraction";
import { TotpService as TotpServiceAbstraction } from "@bitwarden/common/vault/abstractions/totp.service";
import { CipherType } from "@bitwarden/common/vault/enums";
import { Cipher } from "@bitwarden/common/vault/models/domain/cipher";
import { LoginUriView } from "@bitwarden/common/vault/models/view/login-uri.view";
import { CipherAuthorizationService } from "@bitwarden/common/vault/services/cipher-authorization.service";
import { DialogService } from "@bitwarden/components";
import { PasswordRepromptService } from "@bitwarden/vault";

import { BrowserFido2UserInterfaceSession } from "../../../../autofill/fido2/services/browser-fido2-user-interface.service";
import { AutofillService } from "../../../../autofill/services/abstractions/autofill.service";
import { BrowserApi } from "../../../../platform/browser/browser-api";
import BrowserPopupUtils from "../../../../platform/popup/browser-popup-utils";
import { fido2PopoutSessionData$ } from "../../utils/fido2-popout-session-data";
import { closeViewVaultItemPopout, VaultPopoutType } from "../../utils/vault-popout-window";

const BroadcasterSubscriptionId = "ChildViewComponent";

export const AUTOFILL_ID = "autofill";
export const SHOW_AUTOFILL_BUTTON = "show-autofill-button";
export const COPY_USERNAME_ID = "copy-username";
export const COPY_PASSWORD_ID = "copy-password";
export const COPY_VERIFICATION_CODE_ID = "copy-totp";

type CopyAction =
  | typeof COPY_USERNAME_ID
  | typeof COPY_PASSWORD_ID
  | typeof COPY_VERIFICATION_CODE_ID;
type LoadAction = typeof AUTOFILL_ID | typeof SHOW_AUTOFILL_BUTTON | CopyAction;

@Component({
  selector: "app-vault-view",
  templateUrl: "view.component.html",
})
export class ViewComponent extends BaseViewComponent implements OnInit, OnDestroy {
  showAttachments = true;
  pageDetails: any[] = [];
  tab: any;
  senderTabId?: number;
  loadAction?: LoadAction;
  private static readonly copyActions = new Set([
    COPY_USERNAME_ID,
    COPY_PASSWORD_ID,
    COPY_VERIFICATION_CODE_ID,
  ]);
  uilocation?: "popout" | "popup" | "sidebar" | "tab";
  loadPageDetailsTimeout: number;
  inPopout = false;
  cipherType = CipherType;
  private fido2PopoutSessionData$ = fido2PopoutSessionData$();
  private collectPageDetailsSubscription: Subscription;

  private destroy$ = new Subject<void>();

  constructor(
    cipherService: CipherService,
    folderService: FolderService,
    totpService: TotpServiceAbstraction,
    tokenService: TokenService,
    i18nService: I18nService,
    cryptoService: CryptoService,
    encryptService: EncryptService,
    platformUtilsService: PlatformUtilsService,
    auditService: AuditService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    broadcasterService: BroadcasterService,
    ngZone: NgZone,
    changeDetectorRef: ChangeDetectorRef,
    stateService: StateService,
    eventCollectionService: EventCollectionService,
    private autofillService: AutofillService,
    private messagingService: MessagingService,
    apiService: ApiService,
    passwordRepromptService: PasswordRepromptService,
    logService: LogService,
    fileDownloadService: FileDownloadService,
    dialogService: DialogService,
    datePipe: DatePipe,
    accountService: AccountService,
    billingAccountProfileStateService: BillingAccountProfileStateService,
    cipherAuthorizationService: CipherAuthorizationService,
  ) {
    super(
      cipherService,
      folderService,
      totpService,
      tokenService,
      i18nService,
      cryptoService,
      encryptService,
      platformUtilsService,
      auditService,
      window,
      broadcasterService,
      ngZone,
      changeDetectorRef,
      eventCollectionService,
      apiService,
      passwordRepromptService,
      logService,
      stateService,
      fileDownloadService,
      dialogService,
      datePipe,
      accountService,
      billingAccountProfileStateService,
      cipherAuthorizationService,
    );
  }

  ngOnInit() {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.loadAction = value?.action;
      this.senderTabId = parseInt(value?.senderTabId, 10) || undefined;
      this.uilocation = value?.uilocation;
    });

    this.inPopout = this.uilocation === "popout" || BrowserPopupUtils.inPopout(window);

    // eslint-disable-next-line rxjs-angular/prefer-takeuntil, rxjs/no-async-subscribe
    this.route.queryParams.pipe(first()).subscribe(async (params) => {
      if (params.cipherId) {
        this.cipherId = params.cipherId;
      }

      if (params.collectionId) {
        this.collectionId = params.collectionId;
      }

      if (!params.cipherId) {
        // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.close();
      }

      await this.load();
    });

    super.ngOnInit();

    this.broadcasterService.subscribe(BroadcasterSubscriptionId, (message: any) => {
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.ngZone.run(async () => {
        switch (message.command) {
          case "tabChanged":
          case "windowChanged":
            if (this.loadPageDetailsTimeout != null) {
              window.clearTimeout(this.loadPageDetailsTimeout);
            }
            this.loadPageDetailsTimeout = window.setTimeout(() => this.loadPageDetails(), 500);
            break;
          default:
            break;
        }
      });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    super.ngOnDestroy();
    this.broadcasterService.unsubscribe(BroadcasterSubscriptionId);
  }

  async load() {
    await super.load();
    await this.loadPageDetails();
    await this.handleLoadAction();
  }

  async edit() {
    if (this.cipher.isDeleted) {
      return false;
    }
    if (!(await super.edit())) {
      return false;
    }

    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.router.navigate(["/edit-cipher"], {
      queryParams: {
        cipherId: this.cipher.id,
        type: this.cipher.type,
        isNew: false,
        collectionId: this.collectionId,
      },
    });
    return true;
  }

  async clone() {
    if (this.cipher.isDeleted) {
      return false;
    }

    if (!(await super.clone())) {
      return false;
    }

    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.router.navigate(["/clone-cipher"], {
      queryParams: {
        cloneMode: true,
        cipherId: this.cipher.id,
      },
    });
    return true;
  }

  async share() {
    if (!(await super.share())) {
      return false;
    }

    if (this.cipher.organizationId == null) {
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.router.navigate(["/share-cipher"], {
        replaceUrl: true,
        queryParams: { cipherId: this.cipher.id },
      });
    }
    return true;
  }

  async fillCipher() {
    const didAutofill = await this.doAutofill();
    if (didAutofill) {
      this.platformUtilsService.showToast("success", null, this.i18nService.t("autoFillSuccess"));
    }

    return didAutofill;
  }

  async fillCipherAndSave() {
    const didAutofill = await this.doAutofill();

    if (didAutofill) {
      if (this.tab == null) {
        throw new Error("No tab found.");
      }

      if (this.cipher.login.uris == null) {
        this.cipher.login.uris = [];
      } else {
        if (this.cipher.login.uris.some((uri) => uri.uri === this.tab.url)) {
          this.platformUtilsService.showToast(
            "success",
            null,
            this.i18nService.t("autoFillSuccessAndSavedUri"),
          );
          return;
        }
      }

      const loginUri = new LoginUriView();
      loginUri.uri = this.tab.url;
      this.cipher.login.uris.push(loginUri);

      try {
        const activeUserId = await firstValueFrom(
          this.accountService.activeAccount$.pipe(map((a) => a?.id)),
        );
        const cipher: Cipher = await this.cipherService.encrypt(this.cipher, activeUserId);
        await this.cipherService.updateWithServer(cipher);
        this.platformUtilsService.showToast(
          "success",
          null,
          this.i18nService.t("autoFillSuccessAndSavedUri"),
        );
        this.messagingService.send("editedCipher");
      } catch {
        this.platformUtilsService.showToast("error", null, this.i18nService.t("unexpectedError"));
      }
    }
  }

  async restore() {
    if (!this.cipher.isDeleted) {
      return false;
    }
    if (await super.restore()) {
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.close();
      return true;
    }
    return false;
  }

  async delete() {
    if (await super.delete()) {
      this.messagingService.send("deletedCipher");
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.close();
      return true;
    }
    return false;
  }

  async close() {
    const sessionData = await firstValueFrom(this.fido2PopoutSessionData$);
    if (this.inPopout && sessionData.isFido2Session) {
      BrowserFido2UserInterfaceSession.abortPopout(sessionData.sessionId);
      return;
    }

    if (
      BrowserPopupUtils.inSingleActionPopout(window, VaultPopoutType.viewVaultItem) &&
      this.senderTabId
    ) {
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      BrowserApi.focusTab(this.senderTabId);
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      closeViewVaultItemPopout(`${VaultPopoutType.viewVaultItem}_${this.cipher.id}`);
      return;
    }

    this.location.back();
  }

  private async loadPageDetails() {
    this.collectPageDetailsSubscription?.unsubscribe();
    this.pageDetails = [];
    this.tab = this.senderTabId
      ? await BrowserApi.getTab(this.senderTabId)
      : await BrowserApi.getTabFromCurrentWindow();

    if (!this.tab) {
      return;
    }

    this.collectPageDetailsSubscription = this.autofillService
      .collectPageDetailsFromTab$(this.tab)
      .pipe(takeUntil(this.destroy$))
      .subscribe((pageDetails) => (this.pageDetails = pageDetails));
  }

  private async doAutofill() {
    const originalTabURL = this.tab.url?.length && new URL(this.tab.url);

    if (!(await this.promptPassword())) {
      return false;
    }

    const currentTabURL = this.tab.url?.length && new URL(this.tab.url);

    const originalTabHostPath =
      originalTabURL && `${originalTabURL.origin}${originalTabURL.pathname}`;
    const currentTabHostPath = currentTabURL && `${currentTabURL.origin}${currentTabURL.pathname}`;

    const tabUrlChanged = originalTabHostPath !== currentTabHostPath;

    if (this.pageDetails == null || this.pageDetails.length === 0 || tabUrlChanged) {
      this.platformUtilsService.showToast("error", null, this.i18nService.t("autofillError"));
      return false;
    }

    try {
      this.totpCode = await this.autofillService.doAutoFill({
        tab: this.tab,
        cipher: this.cipher,
        pageDetails: this.pageDetails,
        doc: window.document,
        fillNewPassword: true,
        allowTotpAutofill: true,
      });
      if (this.totpCode != null) {
        this.platformUtilsService.copyToClipboard(this.totpCode, { window: window });
      }
    } catch {
      this.platformUtilsService.showToast("error", null, this.i18nService.t("autofillError"));
      this.changeDetectorRef.detectChanges();
      return false;
    }

    return true;
  }

  private async handleLoadAction() {
    if (!this.loadAction || this.loadAction === SHOW_AUTOFILL_BUTTON) {
      return;
    }

    let loadActionSuccess = false;
    if (this.loadAction === AUTOFILL_ID) {
      loadActionSuccess = await this.fillCipher();
    }

    if (ViewComponent.copyActions.has(this.loadAction)) {
      const { username, password } = this.cipher.login;
      const copyParams: Record<CopyAction, Record<string, string>> = {
        [COPY_USERNAME_ID]: { value: username, type: "username", name: "Username" },
        [COPY_PASSWORD_ID]: { value: password, type: "password", name: "Password" },
        [COPY_VERIFICATION_CODE_ID]: {
          value: this.totpCode,
          type: "verificationCodeTotp",
          name: "TOTP",
        },
      };
      const { value, type, name } = copyParams[this.loadAction as CopyAction];
      loadActionSuccess = await this.copy(value, type, name);
    }

    if (this.inPopout) {
      setTimeout(() => this.close(), loadActionSuccess ? 1000 : 0);
    }
  }
}
