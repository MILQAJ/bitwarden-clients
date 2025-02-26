import { EXTENSION_DISK } from "../../platform/state";
import { PrivateClassifier } from "../private-classifier";
import { Classifier } from "../state/classifier";
import { ObjectKey } from "../state/object-key";

import { ExtensionMetadata, ExtensionProfileMetadata, SiteId } from "./type";

/** Binds an extension profile to an extension site */
export function toObjectKey<Settings extends object, Site extends SiteId>(
  profile: ExtensionProfileMetadata<Settings, Site>,
  extension: ExtensionMetadata,
) {
  // FIXME: eliminate this cast
  const classifier = new PrivateClassifier<Settings>() as Classifier<
    Settings,
    Record<string, never>,
    Settings
  >;

  const result: ObjectKey<Settings> = {
    // copy storage to retain extensibility
    ...profile.storage,

    // fields controlled by the extension system override those in the profile
    target: "object",
    key: `${extension.site.id}.${extension.product.vendor.id}.${profile.storage.key}`,
    state: EXTENSION_DISK,
    classifier,
    format: "classified",
  };

  return result;
}
