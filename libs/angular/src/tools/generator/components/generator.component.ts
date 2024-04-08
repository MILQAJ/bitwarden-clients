import { Directive, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { debounceTime, first, map } from "rxjs/operators";

import { PasswordGeneratorPolicyOptions } from "@bitwarden/common/admin-console/models/domain/password-generator-policy-options";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { GeneratorOptions } from "@bitwarden/common/tools/generator/generator-options";
import {
  PasswordGenerationServiceAbstraction,
  PasswordGeneratorOptions,
} from "@bitwarden/common/tools/generator/password";
import { DefaultBoundaries } from "@bitwarden/common/tools/generator/password/password-generator-options-evaluator";
import {
  UsernameGenerationServiceAbstraction,
  UsernameGeneratorOptions,
} from "@bitwarden/common/tools/generator/username";
import { EmailForwarderOptions } from "@bitwarden/common/tools/models/domain/email-forwarder-options";

@Directive()
export class GeneratorComponent implements OnInit {
  @Input() comingFromAddEdit = false;
  @Input() type: string;
  @Output() onSelected = new EventEmitter<string>();

  usernameGeneratingPromise: Promise<string>;
  typeOptions: any[];
  passTypeOptions: any[];
  usernameTypeOptions: any[];
  subaddressOptions: any[];
  catchallOptions: any[];
  forwardOptions: EmailForwarderOptions[];
  usernameOptions: UsernameGeneratorOptions = { website: null };
  passwordOptions: PasswordGeneratorOptions = {};
  username = "-";
  password = "-";
  showOptions = false;
  avoidAmbiguous = false;
  enforcedPasswordPolicyOptions: PasswordGeneratorPolicyOptions;
  usernameWebsite: string = null;

  // update screen reader minimum password length with 500ms debounce
  // so that the user isn't flooded with status updates
  private _passwordOptionsMinLengthForReader = new BehaviorSubject<number>(
    DefaultBoundaries.length.min,
  );
  protected passwordOptionsMinLengthForReader$ = this._passwordOptionsMinLengthForReader.pipe(
    map((val) => val || DefaultBoundaries.length.min),
    debounceTime(500),
  );

  constructor(
    protected passwordGenerationService: PasswordGenerationServiceAbstraction,
    protected usernameGenerationService: UsernameGenerationServiceAbstraction,
    protected platformUtilsService: PlatformUtilsService,
    protected stateService: StateService,
    protected i18nService: I18nService,
    protected logService: LogService,
    protected route: ActivatedRoute,
    private win: Window,
  ) {
    this.typeOptions = [
      { name: i18nService.t("password"), value: "password" },
      { name: i18nService.t("username"), value: "username" },
    ];
    this.passTypeOptions = [
      { name: i18nService.t("password"), value: "password" },
      { name: i18nService.t("passphrase"), value: "passphrase" },
    ];
    this.usernameTypeOptions = [
      {
        name: i18nService.t("plusAddressedEmail"),
        value: "subaddress",
        desc: i18nService.t("plusAddressedEmailDesc"),
      },
      {
        name: i18nService.t("catchallEmail"),
        value: "catchall",
        desc: i18nService.t("catchallEmailDesc"),
      },
      {
        name: i18nService.t("forwardedEmail"),
        value: "forwarded",
        desc: i18nService.t("forwardedEmailDesc"),
      },
      { name: i18nService.t("randomWord"), value: "word" },
    ];
    this.subaddressOptions = [{ name: i18nService.t("random"), value: "random" }];
    this.catchallOptions = [{ name: i18nService.t("random"), value: "random" }];
    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.initForwardOptions();
  }

  async ngOnInit() {
    // eslint-disable-next-line rxjs/no-async-subscribe
    this.route.queryParams.pipe(first()).subscribe(async (qParams) => {
      const passwordOptionsResponse = await this.passwordGenerationService.getOptions();
      this.passwordOptions = passwordOptionsResponse[0];
      this.enforcedPasswordPolicyOptions = passwordOptionsResponse[1];
      this.avoidAmbiguous = !this.passwordOptions.ambiguous;
      this.passwordOptions.type =
        this.passwordOptions.type === "passphrase" ? "passphrase" : "password";

      this.usernameOptions = await this.usernameGenerationService.getOptions();
      if (this.usernameOptions.type == null) {
        this.usernameOptions.type = "word";
      }
      if (
        this.usernameOptions.subaddressEmail == null ||
        this.usernameOptions.subaddressEmail === ""
      ) {
        this.usernameOptions.subaddressEmail = await this.stateService.getEmail();
      }
      if (this.usernameWebsite == null) {
        this.usernameOptions.subaddressType = this.usernameOptions.catchallType = "random";
      } else {
        this.usernameOptions.website = this.usernameWebsite;
        const websiteOption = { name: this.i18nService.t("websiteName"), value: "website-name" };
        this.subaddressOptions.push(websiteOption);
        this.catchallOptions.push(websiteOption);
      }

      if (this.type !== "username" && this.type !== "password") {
        if (qParams.type === "username" || qParams.type === "password") {
          this.type = qParams.type;
        } else {
          const generatorOptions = await this.stateService.getGeneratorOptions();
          this.type = generatorOptions?.type ?? "password";
        }
      }
      if (this.regenerateWithoutButtonPress()) {
        await this.regenerate();
      }
    });
  }

  async typeChanged() {
    await this.stateService.setGeneratorOptions({ type: this.type } as GeneratorOptions);
    if (this.regenerateWithoutButtonPress()) {
      await this.regenerate();
    }
  }

  async regenerate() {
    if (this.type === "password") {
      await this.regeneratePassword();
    } else if (this.type === "username") {
      await this.regenerateUsername();
    }
  }

  async sliderChanged() {
    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.savePasswordOptions(false);
    await this.passwordGenerationService.addHistory(this.password);
  }

  async onPasswordOptionsMinNumberInput($event: Event) {
    // `savePasswordOptions()` replaces the null
    this.passwordOptions.number = null;

    await this.savePasswordOptions();

    // fixes UI desync that occurs when minNumber has a fixed value
    // that is reset through normalization
    ($event.target as HTMLInputElement).value = `${this.passwordOptions.minNumber}`;
  }

  async setPasswordOptionsNumber($event: boolean) {
    this.passwordOptions.number = $event;
    // `savePasswordOptions()` replaces the null
    this.passwordOptions.minNumber = null;

    await this.savePasswordOptions();
  }

  async onPasswordOptionsMinSpecialInput($event: Event) {
    // `savePasswordOptions()` replaces the null
    this.passwordOptions.special = null;

    await this.savePasswordOptions();

    // fixes UI desync that occurs when minSpecial has a fixed value
    // that is reset through normalization
    ($event.target as HTMLInputElement).value = `${this.passwordOptions.minSpecial}`;
  }

  async setPasswordOptionsSpecial($event: boolean) {
    this.passwordOptions.special = $event;
    // `savePasswordOptions()` replaces the null
    this.passwordOptions.minSpecial = null;

    await this.savePasswordOptions();
  }

  async sliderInput() {
    await this.normalizePasswordOptions();
    this.password = await this.passwordGenerationService.generatePassword(this.passwordOptions);
  }

  async savePasswordOptions(regenerate = true) {
    await this.normalizePasswordOptions();
    await this.passwordGenerationService.saveOptions(this.passwordOptions);

    if (regenerate && this.regenerateWithoutButtonPress()) {
      await this.regeneratePassword();
    }
  }

  async saveUsernameOptions(regenerate = true) {
    await this.usernameGenerationService.saveOptions(this.usernameOptions);
    if (this.usernameOptions.type === "forwarded") {
      this.username = "-";
    }
    if (regenerate && this.regenerateWithoutButtonPress()) {
      await this.regenerateUsername();
    }
  }

  async regeneratePassword() {
    this.password = await this.passwordGenerationService.generatePassword(this.passwordOptions);
    await this.passwordGenerationService.addHistory(this.password);
  }

  regenerateUsername() {
    return this.generateUsername();
  }

  async generateUsername() {
    try {
      this.usernameGeneratingPromise = this.usernameGenerationService.generateUsername(
        this.usernameOptions,
      );
      this.username = await this.usernameGeneratingPromise;
      if (this.username === "" || this.username === null) {
        this.username = "-";
      }
    } catch (e) {
      this.logService.error(e);
    }
  }

  copy() {
    const password = this.type === "password";
    const copyOptions = this.win != null ? { window: this.win } : null;
    this.platformUtilsService.copyToClipboard(
      password ? this.password : this.username,
      copyOptions,
    );
    this.platformUtilsService.showToast(
      "info",
      null,
      this.i18nService.t("valueCopied", this.i18nService.t(password ? "password" : "username")),
    );
  }

  select() {
    this.onSelected.emit(this.type === "password" ? this.password : this.username);
  }

  toggleOptions() {
    this.showOptions = !this.showOptions;
  }

  regenerateWithoutButtonPress() {
    return this.type !== "username" || this.usernameOptions.type !== "forwarded";
  }

  private async normalizePasswordOptions() {
    // Application level normalize options dependent on class variables
    this.passwordOptions.ambiguous = !this.avoidAmbiguous;

    if (
      !this.passwordOptions.uppercase &&
      !this.passwordOptions.lowercase &&
      !this.passwordOptions.number &&
      !this.passwordOptions.special
    ) {
      this.passwordOptions.lowercase = true;
      if (this.win != null) {
        const lowercase = this.win.document.querySelector("#lowercase") as HTMLInputElement;
        if (lowercase) {
          lowercase.checked = true;
        }
      }
    }

    await this.passwordGenerationService.enforcePasswordGeneratorPoliciesOnOptions(
      this.passwordOptions,
    );

    this._passwordOptionsMinLengthForReader.next(this.passwordOptions.minLength);
  }

  private async initForwardOptions() {
    this.forwardOptions = [
      { name: "addy.io", value: "anonaddy", validForSelfHosted: true },
      { name: "DuckDuckGo", value: "duckduckgo", validForSelfHosted: false },
      { name: "Fastmail", value: "fastmail", validForSelfHosted: true },
      { name: "Firefox Relay", value: "firefoxrelay", validForSelfHosted: false },
      { name: "SimpleLogin", value: "simplelogin", validForSelfHosted: true },
      { name: "Forward Email", value: "forwardemail", validForSelfHosted: true },
    ];

    this.usernameOptions = await this.usernameGenerationService.getOptions();
    if (
      this.usernameOptions.forwardedService == null ||
      this.usernameOptions.forwardedService === ""
    ) {
      this.forwardOptions.push({ name: "", value: null, validForSelfHosted: false });
    }

    this.forwardOptions = this.forwardOptions.sort((a, b) => a.name.localeCompare(b.name));
  }
}
