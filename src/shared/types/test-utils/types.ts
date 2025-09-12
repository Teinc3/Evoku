/**
 * Type definitions for cross-framework test utilities
 */

/** Generic spy function interface */
export interface SpyFunction<
  T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown
> {
  (...args: Parameters<T>): ReturnType<T>;
  /** Jest specific properties */
  mockRestore?: () => void;
  mockClear?: () => void;
  mockReset?: () => void;
  /** Jasmine specific properties */
  and?: {
    returnValue: (value: ReturnType<T>) => void;
    throwError: (error: Error) => void;
    stub: () => void;
  };
  calls?: {
    count: () => number;
    argsFor: (index: number) => Parameters<T>;
    allArgs: () => Parameters<T>[];
  };
}

/** Type for constructor functions */
export type Constructor<T = unknown> = new (...args: unknown[]) => T;