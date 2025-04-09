import { CommonModule } from "@angular/common";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { RouterModule, Router } from "@angular/router";
import { firstValueFrom, map, BehaviorSubject, Observable, Subject, takeUntil } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { BitwardenShield } from "@bitwarden/auth/angular";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import {
  compareCredentialIds,
  parseCredentialId,
} from "@bitwarden/common/platform/services/fido2/credential-id-utils";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherRepromptType } from "@bitwarden/common/vault/enums";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import {
  BadgeModule,
  ButtonModule,
  DialogModule,
  IconModule,
  ItemModule,
  SectionComponent,
  TableModule,
  BitIconButtonComponent,
  SectionHeaderComponent,
} from "@bitwarden/components";
import { PasswordRepromptService } from "@bitwarden/vault";

import { DesktopAutofillService } from "../../autofill/services/desktop-autofill.service";
import {
  DesktopFido2UserInterfaceService,
  DesktopFido2UserInterfaceSession,
} from "../../autofill/services/desktop-fido2-user-interface.service";
import { DesktopSettingsService } from "../../platform/services/desktop-settings.service";

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SectionHeaderComponent,
    BitIconButtonComponent,
    TableModule,
    JslibModule,
    IconModule,
    ButtonModule,
    DialogModule,
    SectionComponent,
    ItemModule,
    BadgeModule,
  ],
  templateUrl: "fido2-vault.component.html",
})
export class Fido2VaultComponent implements OnInit, OnDestroy {
  session?: DesktopFido2UserInterfaceSession = null;
  private destroy$ = new Subject<void>();
  private ciphersSubject = new BehaviorSubject<CipherView[]>([]);
  ciphers$: Observable<CipherView[]> = this.ciphersSubject.asObservable();
  private cipherIdsSubject = new BehaviorSubject<string[]>([]);
  protected containsExcludedCiphers: boolean = false;
  cipherIds$: Observable<string[]>;
  readonly Icons = { BitwardenShield };

  constructor(
    private readonly desktopSettingsService: DesktopSettingsService,
    private readonly fido2UserInterfaceService: DesktopFido2UserInterfaceService,
    private readonly cipherService: CipherService,
    private readonly accountService: AccountService,
    private readonly desktopAutofillService: DesktopAutofillService,
    private readonly logService: LogService,
    private readonly passwordRepromptService: PasswordRepromptService,
    private readonly router: Router,
  ) {}

  async ngOnInit() {
    const lastRegistrationRequest = this.desktopAutofillService.lastRegistrationRequest;
    await this.accountService.setShowHeader(false);
    const activeUserId = await firstValueFrom(
      this.accountService.activeAccount$.pipe(map((a) => a?.id)),
    );

    this.session = this.fido2UserInterfaceService.getCurrentSession();
    this.cipherIds$ = this.session?.availableCipherIds$;

    this.cipherIds$.pipe(takeUntil(this.destroy$)).subscribe((cipherIds) => {
      this.cipherService
        .getAllDecryptedForIds(activeUserId, cipherIds || [])
        .then((ciphers) => {
          if (lastRegistrationRequest) {
            const excludedCiphers = ciphers.filter((cipher) => {
              const credentialId = cipher.login.hasFido2Credentials
                ? parseCredentialId(cipher.login.fido2Credentials[0]?.credentialId)
                : new Uint8Array();
              if (!cipher.login || !cipher.login.hasUris) {
                return false;
              }

              return compareCredentialIds(
                credentialId,
                new Uint8Array(lastRegistrationRequest.excludedCredentials[0]),
              );
            });

            this.containsExcludedCiphers = excludedCiphers.length > 0;

            this.ciphersSubject.next(excludedCiphers || ciphers);
          } else {
            this.ciphersSubject.next(ciphers);
          }
        })
        .catch((error) => this.logService.error(error));
    });
  }

  async ngOnDestroy() {
    await this.accountService.setShowHeader(true);
    this.cipherIdsSubject.complete(); // Clean up the BehaviorSubject
  }

  async chooseCipher(cipher: CipherView) {
    if (this.containsExcludedCiphers) {
      this.session?.confirmChosenCipher(cipher.id, false);
    } else if (
      cipher.reprompt !== CipherRepromptType.None &&
      !(await this.passwordRepromptService.showPasswordPrompt())
    ) {
      this.session?.confirmChosenCipher(cipher.id, false);
    } else {
      this.session?.confirmChosenCipher(cipher.id, true);
    }

    await this.router.navigate(["/"]);
    await this.desktopSettingsService.setModalMode(false);
  }

  async closeModal() {
    await this.router.navigate(["/"]);
    await this.desktopSettingsService.setModalMode(false);

    this.session.notifyConfirmCreateCredential(false);
    this.session.confirmChosenCipher(null);
  }
}
