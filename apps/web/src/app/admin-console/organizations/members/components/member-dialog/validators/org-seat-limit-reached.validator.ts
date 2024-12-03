import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { ProductTierType } from "@bitwarden/common/billing/enums";

/**
 * If the organization doesn't allow additional seat options, this checks if the seat limit has been reached when adding
 * new users
 * @param organization An object representing the organization
 * @param allOrganizationUserEmails An array of strings with existing user email addresses
 * @param errorMessage A localized string to display if validation fails
 * @param activeUserCount The current count of active users occupying the organization's seats.
 * @returns A function that validates an `AbstractControl` and returns `ValidationErrors` or `null`
 */
export function orgSeatLimitReachedValidator(
  organization: Organization,
  allOrganizationUserEmails: string[],
  errorMessage: string,
  activeUserCount?: number,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === "" || !control.value) {
      return null;
    }

    const productHasAdditionalSeatsOption =
      organization.productTierType !== ProductTierType.Free &&
      organization.productTierType !== ProductTierType.Families &&
      organization.productTierType !== ProductTierType.TeamsStarter;

    if (productHasAdditionalSeatsOption || !activeUserCount) {
      return null;
    }

    const newTotalUserCount =
      activeUserCount + getUniqueNewEmailCount(allOrganizationUserEmails, control);

    if (newTotalUserCount > organization.seats) {
      return { seatLimitReached: { message: errorMessage } };
    }

    return null;
  };
}

function getUniqueNewEmailCount(
  allOrganizationUserEmails: string[],
  control: AbstractControl,
): number {
  const newEmailsToAdd = Array.from(
    new Set(
      control.value
        .split(",")
        .filter(
          (newEmailToAdd: string) =>
            newEmailToAdd &&
            newEmailToAdd.trim() !== "" &&
            !allOrganizationUserEmails.some(
              (existingEmail) => existingEmail === newEmailToAdd.trim(),
            ),
        ),
    ),
  );

  return newEmailsToAdd.length;
}
