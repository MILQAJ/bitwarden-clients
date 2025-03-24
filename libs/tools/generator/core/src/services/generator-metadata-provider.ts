import {
  Observable,
  combineLatestWith,
  distinctUntilChanged,
  map,
  shareReplay,
  switchMap,
  takeUntil,
} from "rxjs";

import { PolicyType } from "@bitwarden/common/admin-console/enums";
import { Account } from "@bitwarden/common/auth/abstractions/account.service";
import { BoundDependency } from "@bitwarden/common/tools/dependencies";
import { ExtensionSite } from "@bitwarden/common/tools/extension";
import { SemanticLogger } from "@bitwarden/common/tools/log";
import { SystemServiceProvider } from "@bitwarden/common/tools/providers";
import { anyComplete, pin } from "@bitwarden/common/tools/rx";
import { UserStateSubject } from "@bitwarden/common/tools/state/user-state-subject";
import { UserStateSubjectDependencyProvider } from "@bitwarden/common/tools/state/user-state-subject-dependency-provider";

import {
  GeneratorMetadata,
  AlgorithmsByType,
  CredentialAlgorithm,
  CredentialType,
  isForwarderExtensionId,
  toForwarderMetadata,
  Type,
  Algorithms,
  Types,
} from "../metadata";
import { availableAlgorithms_vNext } from "../policies/available-algorithms-policy";
import { CredentialPreference } from "../types";

import { PREFERENCES } from "./credential-preferences";

type AlgorithmRequest = { algorithm: CredentialAlgorithm };
type TypeRequest = { type: CredentialType };
type MetadataRequest = Partial<AlgorithmRequest & TypeRequest>;

/** Surfaces contextual information to credential generators */
export class GeneratorMetadataProvider {
  /** Instantiates the context provider
   *  @param system dependency providers for user state subjects
   *  @param application dependency providers for system services
   */
  constructor(
    private readonly system: UserStateSubjectDependencyProvider,
    private readonly application: SystemServiceProvider,
    algorithms: ReadonlyArray<GeneratorMetadata<object>>,
  ) {
    this.log = system.log({ type: "GeneratorMetadataProvider" });

    const site = application.extension.site("forwarder");
    if (!site) {
      this.log.panic("forwarder extension site not found");
    }
    this.site = site;

    this._metadata = new Map(algorithms.map((a) => [a.id, a] as const));
  }

  private readonly site: ExtensionSite;
  private readonly log: SemanticLogger;

  private _metadata: Map<CredentialAlgorithm, GeneratorMetadata<unknown & object>>;

  /** Retrieve an algorithm's generator metadata
   *  @param algorithm identifies the algorithm
   *  @returns the algorithm's generator metadata
   *  @throws when the algorithm doesn't identify a known metadata entry
   */
  metadata(algorithm: CredentialAlgorithm) {
    let result = null;
    if (isForwarderExtensionId(algorithm)) {
      const extension = this.site.extensions.get(algorithm.forwarder);
      if (!extension) {
        this.log.panic(algorithm, "extension not found");
      }

      result = toForwarderMetadata(extension);
    } else {
      result = this._metadata.get(algorithm);
    }

    if (!result) {
      this.log.panic({ algorithm }, "metadata not found");
    }

    return result;
  }

  /** retrieve credential types */
  types(): ReadonlyArray<CredentialType> {
    return Types;
  }

  /** Retrieve the credential algorithm ids that match the request.
   *  @param requested when this has a `category` property, the method
   *   returns all algorithms in the category. When this has an `algorithm`
   *   property, the method returns 0 or 1 matching algorithms.
   *  @returns the matching algorithms. This method always returns an array;
   *   the array is empty when no algorithms match the input criteria.
   *  @throws when neither `requested.algorithm` nor `requested.category` contains
   *    a value.
   *  @remarks this method enforces technical requirements only.
   *    If you want these algorithms with policy controls applied, use `algorithms$`.
   */
  algorithms(requested: AlgorithmRequest): CredentialAlgorithm[];
  algorithms(requested: TypeRequest): CredentialAlgorithm[];
  algorithms(requested: MetadataRequest): CredentialAlgorithm[] {
    let algorithms: CredentialAlgorithm[];
    if (requested.type) {
      let forwarders: CredentialAlgorithm[] = [];
      if (requested.type === Type.email) {
        forwarders = Array.from(this.site.extensions.keys()).map((forwarder) => ({ forwarder }));
      }

      algorithms = AlgorithmsByType[requested.type].concat(forwarders);
    } else if (requested.algorithm && isForwarderExtensionId(requested.algorithm)) {
      algorithms = this.site.extensions.has(requested.algorithm.forwarder)
        ? [requested.algorithm]
        : [];
    } else if (requested.algorithm) {
      algorithms = Algorithms.includes(requested.algorithm) ? [requested.algorithm] : [];
    } else {
      this.log.panic(requested, "algorithm or category required");
    }

    return algorithms;
  }

  // emits a function that returns `true` when the input algorithm is available
  private isAvailable$(
    dependencies: BoundDependency<"account", Account>,
  ): Observable<(a: CredentialAlgorithm) => boolean> {
    const id$ = dependencies.account$.pipe(
      map((account) => account.id),
      pin(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    const available$ = id$.pipe(
      switchMap((id) => {
        const policies$ = this.application.policy.getAll$(PolicyType.PasswordGenerator, id).pipe(
          map((p) => availableAlgorithms_vNext(p).filter((a) => this._metadata.has(a))),
          map((p) => new Set(p)),
          // complete policy emissions otherwise `switchMap` holds `available$` open indefinitely
          takeUntil(anyComplete(id$)),
        );
        return policies$;
      }),
      map(
        (available) =>
          function (a: CredentialAlgorithm) {
            return isForwarderExtensionId(a) || available.has(a);
          },
      ),
    );

    return available$;
  }

  /** Retrieve credential algorithms filtered by the user's active policy.
   *  @param requested when this has a `category` property, the method
   *   returns all algorithms in the category. When this has an `algorithm`
   *   property, the method returns 0 or 1 matching algorithms.
   *  @param dependencies.account the account requesting algorithm access;
   *    this parameter controls which policy, if any, is applied.
   *  @returns an observable that emits matching algorithms. When no algorithms
   *    match the request, an empty array is emitted.
   *  @throws when neither `requested.algorithm` nor `requested.category` contains
   *    a value.
   *  @remarks this method applies policy controls. In particular, it excludes
   *    algorithms prohibited by a policy control. If you want lists of algorithms
   *    supported by the client, use `algorithms`.
   */
  algorithms$(
    requested: AlgorithmRequest,
    dependencies: BoundDependency<"account", Account>,
  ): Observable<CredentialAlgorithm[]>;
  algorithms$(
    requested: TypeRequest,
    dependencies: BoundDependency<"account", Account>,
  ): Observable<CredentialAlgorithm[]>;
  algorithms$(
    requested: MetadataRequest,
    dependencies: BoundDependency<"account", Account>,
  ): Observable<CredentialAlgorithm[]> {
    if (requested.type) {
      const { type: category } = requested;

      return this.isAvailable$(dependencies).pipe(
        map((isAvailable) => this.algorithms({ type: category }).filter(isAvailable)),
      );
    } else if (requested.algorithm) {
      const { algorithm } = requested;
      return this.isAvailable$(dependencies).pipe(
        map((isAvailable) => (isAvailable(algorithm) ? [algorithm] : [])),
      );
    } else {
      this.log.panic(requested, "algorithm or category required");
    }
  }

  preference$(type: CredentialType, dependencies: BoundDependency<"account", Account>) {
    const account$ = dependencies.account$.pipe(shareReplay({ bufferSize: 1, refCount: true }));

    const algorithm$ = this.preferences({ account$ }).pipe(
      combineLatestWith(this.isAvailable$({ account$ })),
      map(([preferences, isAvailable]) => {
        const algorithm: CredentialAlgorithm = preferences[type].algorithm;
        if (isAvailable(algorithm)) {
          return algorithm;
        }

        const algorithms = this.algorithms({ type: type });
        // `?? null` because logging types must be `Jsonify<T>`
        const defaultAlgorithm = algorithms.find(isAvailable) ?? null;
        this.log.debug(
          { algorithm, defaultAlgorithm, credentialType: type },
          "preference not available; defaulting the generator algorithm",
        );

        // `?? undefined` so that interface is ADR-14 compliant
        return defaultAlgorithm ?? undefined;
      }),
      distinctUntilChanged(),
    );

    return algorithm$;
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
    // FIXME: enforce policy
    const subject = new UserStateSubject(PREFERENCES, this.system, dependencies);

    return subject;
  }
}
