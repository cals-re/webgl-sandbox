export function assert<T>(value: T | null | undefined): T {
  if (value == null || value == undefined)
    throw new Error("Value didn't exist. :(");
  return value;
}
export const range = (n: number) => new Array(n).fill(0).map((_, i) => i)

/** A cache for values, which can be invalidated when its inputs change.
  * 
  * `build` should be a pure function of its captures
  */
export class Cached<T> {
  constructor(private build: () => T) {}
  private value: T | undefined;
  public get(): T {
    if (this.value === undefined) this.value = this.build();
    return this.value;
  }
  public invalidate() {
    this.value = undefined;
  }
}
