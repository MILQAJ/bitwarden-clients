import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { DeviceType } from "@bitwarden/common/enums";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { MessageSender } from "@bitwarden/common/platform/messaging";
import { DialogService } from "@bitwarden/components";

import { BrowserApi } from "../../../../platform/browser/browser-api";
import { PopOutComponent } from "../../../../platform/popup/components/pop-out.component";
import { AboutDialogComponent } from "../about-dialog/about-dialog.component";

const RateUrls = {
  [DeviceType.ChromeExtension]:
    "https://chromewebstore.google.com/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb/reviews",
  [DeviceType.FirefoxExtension]:
    "https://addons.mozilla.org/en-US/firefox/addon/bitwarden-password-manager/#reviews",
  [DeviceType.OperaExtension]:
    "https://addons.opera.com/en/extensions/details/bitwarden-free-password-manager/#feedback-container",
  [DeviceType.EdgeExtension]:
    "https://microsoftedge.microsoft.com/addons/detail/jbkfoedolllekgbhcbcoahefnbanhhlh",
  [DeviceType.VivaldiExtension]:
    "https://chromewebstore.google.com/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb/reviews",
  [DeviceType.SafariExtension]: "https://apps.apple.com/app/bitwarden/id1352778147",
};

@Component({
  templateUrl: "about-page.component.html",
  standalone: true,
  imports: [CommonModule, JslibModule, RouterModule, PopOutComponent],
})
export class AboutPageComponent {
  constructor(
    private dialogService: DialogService,
    private environmentService: EnvironmentService,
    private platformUtilsService: PlatformUtilsService,
    private logService: LogService,
    private messageSender: MessageSender,
  ) {}

  about() {
    this.dialogService.open(AboutDialogComponent);
  }

  async launchHelp() {
    const confirmed = await this.dialogService.openSimpleDialog({
      title: { key: "continueToHelpCenter" },
      content: { key: "continueToHelpCenterDesc" },
      type: "info",
      acceptButtonText: { key: "continue" },
    });
    if (confirmed) {
      await BrowserApi.createNewTab("https://bitwarden.com/help/");
    }
  }

  async openWebVault() {
    const confirmed = await this.dialogService.openSimpleDialog({
      title: { key: "continueToWebApp" },
      content: { key: "continueToWebAppDesc" },
      type: "info",
      acceptButtonText: { key: "continue" },
    });
    if (confirmed) {
      const env = await firstValueFrom(this.environmentService.environment$);
      const url = env.getWebVaultUrl();
      await BrowserApi.createNewTab(url);
    }
  }

  async rate() {
    const confirmed = await this.dialogService.openSimpleDialog({
      title: { key: "continueToBrowserExtensionStore" },
      content: { key: "continueToBrowserExtensionStoreDesc" },
      type: "info",
      acceptButtonText: { key: "continue" },
    });
    if (confirmed) {
      const deviceType = this.platformUtilsService.getDevice();
      await BrowserApi.createNewTab((RateUrls as any)[deviceType]);
    }
  }

  async onLogLevelUpdated(e) {
    this.logService.updateFilter((level) => level >= e.level);
    this.messageSender.send("logLevelUpdated", { level: e.level });
  }
}
