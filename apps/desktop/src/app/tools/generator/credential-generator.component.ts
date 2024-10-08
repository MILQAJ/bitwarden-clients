import { Component } from "@angular/core";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { ButtonModule, DialogModule } from "@bitwarden/components";
import { PasswordGeneratorComponent } from "@bitwarden/generator-components";

@Component({
  standalone: true,
  selector: "credential-generator",
  templateUrl: "credential-generator.component.html",
  imports: [DialogModule, ButtonModule, JslibModule, PasswordGeneratorComponent],
})
export class CredentialGeneratorComponent {}
