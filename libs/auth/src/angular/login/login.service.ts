import { UrlTree } from "@angular/router";

import { MasterPasswordPolicyOptions } from "@bitwarden/common/admin-console/models/domain/master-password-policy-options";
import { Policy } from "@bitwarden/common/admin-console/models/domain/policy";

export interface PasswordPolicies {
  policies: Policy[];
  isPolicyAndAutoEnrollEnabled: boolean;
  enforcedPasswordPolicyOptions: MasterPasswordPolicyOptions;
}

export abstract class LoginService {
  // Browser/Desktop
  launchSsoBrowserWindow: (email: string) => Promise<void>;

  // Web
  getShowPasswordlessFlag: () => boolean;
  getOrgPolicies: () => Promise<PasswordPolicies | null>;
  setPreviousUrl: (route: UrlTree) => void | null;
}
