export type Freeable = { free: () => void };

type UseReturnValue<T> = T extends (value: any) => Promise<unknown> ? Promise<void> : void;

/**
 * Reference counted disposable value.
 * This class is used to manage the lifetime of a value that needs to be
 * freed of at a specific time but might still be in-use when that happens.
 */
export class Rc<T extends Freeable> {
  private markedForDisposal = false;
  private refCount = 0;
  private value: T;

  constructor(value: T) {
    this.value = value;
  }

  /**
   * Use the value in a callback.
   * The callback will be called immediately if the value is not marked for disposal.
   * If the callback returns a promise, the promise will be awaited.
   *
   * @example
   * ```typescript
   * function someFunction(rc: Rc<SomeValue>) {
   *   using reference = rc.use((value) => {
   *     value.doSomething();
   *   });
   * }
   * ```
   *
   * @param fn The callback to call with the value.
   */
  use<Callback extends (value: T) => unknown>(fn: Callback): UseReturnValue<Callback> {
    if (this.markedForDisposal) {
      throw new Error("Cannot use a value marked for disposal");
    }

    this.refCount++;
    const maybePromise = fn(this.value);

    if (maybePromise instanceof Promise) {
      return maybePromise.then(() => {
        this.release();
      }) as UseReturnValue<Callback>;
    } else {
      this.release();
    }
  }

  /**
   * Mark this Rc for disposal. When the refCount reaches 0, the value
   * will be freed.
   */
  markForDisposal() {
    this.markedForDisposal = true;
    this.freeIfPossible();
  }

  private release() {
    this.refCount--;
    this.freeIfPossible();
  }

  private freeIfPossible() {
    if (this.refCount === 0 && this.markedForDisposal) {
      this.value.free();
    }
  }
}
