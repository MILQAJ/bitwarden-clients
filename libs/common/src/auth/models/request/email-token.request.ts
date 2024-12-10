// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { SecretVerificationRequest } from "./secret-verification.request";

export class EmailTokenRequest extends SecretVerificationRequest {
  newEmail: string;
  masterPasswordHash: string;
}
