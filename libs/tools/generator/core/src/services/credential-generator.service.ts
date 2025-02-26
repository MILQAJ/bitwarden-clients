// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import {
  concatMap,
  distinctUntilChanged,
  map,
  Observable,
  shareReplay,
  switchMap,
  takeUntil,
  tap,
} from "rxjs";
import { Simplify } from "type-fest";

import { PolicyType } from "@bitwarden/common/admin-console/enums";
import { Account } from "@bitwarden/common/auth/abstractions/account.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { BoundDependency, OnDependency } from "@bitwarden/common/tools/dependencies";
import { IntegrationMetadata } from "@bitwarden/common/tools/integration";
import { RestClient } from "@bitwarden/common/tools/integration/rpc";
import { SemanticLogger } from "@bitwarden/common/tools/log";
import { SystemServiceProvider } from "@bitwarden/common/tools/providers";
import { anyComplete, withLatestReady } from "@bitwarden/common/tools/rx";
import { UserStateSubject } from "@bitwarden/common/tools/state/user-state-subject";
import { UserStateSubjectDependencyProvider } from "@bitwarden/common/tools/state/user-state-subject-dependency-provider";

import { Randomizer } from "../abstractions";
import {
  Generators,
  getForwarderConfiguration,
  Integrations,
  toCredentialGeneratorConfiguration,
} from "../data";
import {
  Profile,
  GeneratorMetadata,
  GeneratorProfile,
  isForwarderProfile,
  toVendorId,
} from "../metadata";
import { availableAlgorithms } from "../policies/available-algorithms-policy";
import {
  CredentialAlgorithm,
  CredentialCategories,
  CredentialCategory,
  AlgorithmInfo,
  CredentialPreference,
  isForwarderIntegration,
  ForwarderIntegration,
  GenerateRequest,
} from "../types";
import {
  CredentialGeneratorInfo,
  GeneratorDependencyProvider,
} from "../types/credential-generator-configuration";
import { GeneratorConstraints } from "../types/generator-constraints";

import { GeneratorMetadataProvider } from "./generator-metadata-provider";
import { GeneratorProfileProvider } from "./generator-profile-provider";

type Generate$Dependencies = Simplify<
  OnDependency<GenerateRequest> & BoundDependency<"account", Account>
>;

type CredentialGeneratorServiceProvider = UserStateSubjectDependencyProvider & {
  readonly random: Randomizer;
  readonly rest: RestClient; // = new RestClient(this.apiService, this.i18nService)
  // FIXME: introduce "may require translation" types into metadata
  //        structures and remove this dependency
  readonly i18n: I18nService;
  readonly profile: GeneratorProfileProvider;
  readonly metadata: GeneratorMetadataProvider;
};

export class CredentialGeneratorService {
  constructor(
    private readonly service: CredentialGeneratorServiceProvider,
    private readonly system: SystemServiceProvider,
  ) {
    this.log = system.log({ type: "CredentialGeneratorService" });
  }

  private readonly log: SemanticLogger;

  private getEngineDependencies(): GeneratorDependencyProvider {
    return {
      client: this.service.rest,
      i18nService: this.service.i18n,
      randomizer: this.service.random,
    };
  }

  /** Generates a stream of credentials
   * @param configuration determines which generator's settings are loaded
   * @param dependencies.on$ Required. A new credential is emitted when this emits.
   */
  generate$(dependencies: Generate$Dependencies) {
    // `on$` is partitioned into several streams so that the generator
    // engine and settings refresh only when their respective inputs change
    const on$ = dependencies.on$.pipe(shareReplay({ refCount: true, bufferSize: 1 }));
    const account$ = dependencies.account$.pipe(shareReplay({ refCount: true, bufferSize: 1 }));

    // load algorithm metadata
    const algorithm$ = on$.pipe(
      switchMap((requested) => {
        if (requested.category || requested.algorithm) {
          return this.service.metadata.algorithm$(requested, { account$ });
        } else {
          this.log.panic(requested, "algorithm or category required");
        }
      }),
      distinctUntilChanged((previous, current) => previous.id === current.id),
    );

    // load the active profile's algorithm settings
    const settings$ = on$.pipe(
      map((request) => request.profile ?? Profile.account),
      distinctUntilChanged(),
      withLatestReady(algorithm$),
      switchMap(([profile, meta]) => this.settings(meta, { account$ }, profile)),
    );

    // load the algorithm's engine
    const engine$ = algorithm$.pipe(
      tap((meta) => this.log.info({ algorithm: meta.id }, "engine selected")),
      map((meta) => meta.engine.create(this.getEngineDependencies())),
    );

    // generation proper
    const generate$ = on$.pipe(
      withLatestReady(engine$),
      withLatestReady(settings$),
      concatMap(([[request, engine], settings]) => engine.generate(request, settings)),
      takeUntil(anyComplete([settings$])),
    );

    return generate$;
  }

  /** Emits metadata concerning the provided generation algorithms
   *  @param category the category or categories of interest
   *  @param dependences.account$ algorithms are filtered to only
   *   those matching the provided account's policy.
   *  @returns An observable that emits algorithm metadata.
   */
  algorithms$(
    category: CredentialCategory,
    dependencies: BoundDependency<"account", Account>,
  ): Observable<AlgorithmInfo[]>;
  algorithms$(
    category: CredentialCategory[],
    dependencies: BoundDependency<"account", Account>,
  ): Observable<AlgorithmInfo[]>;
  algorithms$(
    category: CredentialCategory | CredentialCategory[],
    dependencies: BoundDependency<"account", Account>,
  ) {
    // any cast required here because TypeScript fails to bind `category`
    // to the union-typed overload of `algorithms`.
    const algorithms = this.algorithms(category as any);

    // apply policy
    const algorithms$ = dependencies.account$.pipe(
      distinctUntilChanged(),
      switchMap((account) => {
        const policies$ = this.system.policy.getAll$(PolicyType.PasswordGenerator, account.id).pipe(
          map((p) => new Set(availableAlgorithms(p))),
          // complete policy emissions otherwise `switchMap` holds `algorithms$` open indefinitely
          takeUntil(anyComplete(dependencies.account$)),
        );
        return policies$;
      }),
      map((available) => {
        const filtered = algorithms.filter(
          (c) => isForwarderIntegration(c.id) || available.has(c.id),
        );
        return filtered;
      }),
    );

    return algorithms$;
  }

  /** Lists metadata for the algorithms in a credential category
   *  @param category the category or categories of interest
   *  @returns A list containing the requested metadata.
   */
  algorithms(category: CredentialCategory): AlgorithmInfo[];
  algorithms(category: CredentialCategory[]): AlgorithmInfo[];
  algorithms(category: CredentialCategory | CredentialCategory[]): AlgorithmInfo[] {
    const categories: CredentialCategory[] = Array.isArray(category) ? category : [category];

    const algorithms = categories
      .flatMap((c) => CredentialCategories[c] as CredentialAlgorithm[])
      .map((id) => this.algorithm(id))
      .filter((info) => info !== null);

    const forwarders = Object.keys(Integrations)
      .map((key: keyof typeof Integrations) => {
        const forwarder: ForwarderIntegration = { forwarder: Integrations[key].id };
        return this.algorithm(forwarder);
      })
      .filter((forwarder) => categories.includes(forwarder.category));

    return algorithms.concat(forwarders);
  }

  /** Look up the metadata for a specific generator algorithm
   *  @param id identifies the algorithm
   *  @returns the requested metadata, or `null` if the metadata wasn't found.
   */
  algorithm(id: CredentialAlgorithm): AlgorithmInfo {
    let generator: CredentialGeneratorInfo = null;
    let integration: IntegrationMetadata = null;

    if (isForwarderIntegration(id)) {
      const forwarderConfig = getForwarderConfiguration(id.forwarder);
      integration = forwarderConfig;

      if (forwarderConfig) {
        generator = toCredentialGeneratorConfiguration(forwarderConfig);
      }
    } else {
      generator = Generators[id];
    }

    if (!generator) {
      throw new Error(`Invalid credential algorithm: ${JSON.stringify(id)}`);
    }

    const info: AlgorithmInfo = {
      id: generator.id,
      category: generator.category,
      name: integration ? integration.name : this.service.i18n.t(generator.nameKey),
      generate: this.service.i18n.t(generator.generateKey),
      onGeneratedMessage: this.service.i18n.t(generator.onGeneratedMessageKey),
      credentialType: this.service.i18n.t(generator.credentialTypeKey),
      copy: this.service.i18n.t(generator.copyKey),
      useGeneratedValue: this.service.i18n.t(generator.useGeneratedValueKey),
      onlyOnRequest: generator.onlyOnRequest,
      request: generator.request,
    };

    if (generator.descriptionKey) {
      info.description = this.service.i18n.t(generator.descriptionKey);
    }

    return info;
  }

  /** Get the settings for the provided configuration
   * @param configuration determines which generator's settings are loaded
   * @param dependencies.account$ identifies the account to which the settings are bound.
   * @returns an observable that emits settings
   * @deprecated use `settings` instead.
   */
  settings$<Settings extends object>(
    metadata: Readonly<GeneratorMetadata<Settings>>,
    dependencies: BoundDependency<"account", Account>,
    profile: GeneratorProfile = Profile.account,
  ): Observable<Settings> {
    return this.settings(metadata, dependencies, profile);
  }

  /** Get a subject bound to credential generator preferences.
   *  @param dependencies.account$ identifies the account to which the preferences are bound
   *  @returns a subject bound to the user's preferences
   *  @remarks Preferences determine which algorithms are used when generating a
   *   credential from a credential category (e.g. `PassX` or `Username`). Preferences
   *   should not be used to hold navigation history. Use @bitwarden/generator-navigation
   *   instead.
   */
  preferences(
    dependencies: BoundDependency<"account", Account>,
  ): UserStateSubject<CredentialPreference> {
    return this.service.metadata.preferences(dependencies);
  }

  /** Get a subject bound to a specific user's settings
   * @param configuration determines which generator's settings are loaded
   * @param dependencies.account$ identifies the account to which the settings are bound
   * @returns a subject bound to the requested user's generator settings
   * @remarks the subject enforces policy for the settings
   */
  settings<Settings extends object>(
    metadata: Readonly<GeneratorMetadata<Settings>>,
    dependencies: BoundDependency<"account", Account>,
    profile: GeneratorProfile = Profile.account,
  ): UserStateSubject<Settings> {
    const activeProfile = metadata.profiles[profile];

    let settings: UserStateSubject<Settings>;
    if (isForwarderProfile(activeProfile)) {
      const vendor = toVendorId(metadata.id);
      if (!vendor) {
        this.log.panic("failed to load extension profile; vendor not specified");
      }

      this.log.info({ profile, vendor, site: activeProfile.site }, "loading extension profile");
      settings = this.system.extension.settings(activeProfile, vendor, dependencies);
    } else {
      this.log.info({ profile, algorithm: metadata.id }, "loading generator profile");
      settings = this.service.profile.settings(activeProfile, dependencies);
    }

    return settings;
  }

  /** Get the policy constraints for the provided configuration
   *  @param dependencies.account$ determines which user's policy is loaded
   *  @returns an observable that emits the policy once `dependencies.account$`
   *   and the policy become available.
   */
  policy$<Settings>(
    metadata: Readonly<GeneratorMetadata<Settings>>,
    dependencies: BoundDependency<"account", Account>,
    profile: GeneratorProfile = Profile.account,
  ): Observable<GeneratorConstraints<Settings>> {
    const activeProfile = metadata.profiles[profile];
    return this.service.profile.constraints$(activeProfile, dependencies);
  }
}
