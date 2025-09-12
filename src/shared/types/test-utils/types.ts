/**
 * Type definitions for cross-framework test utilities
 */

/**
 * Generic constructor type
 */
export interface Constructor<T = object> {
  new (...args: unknown[]): T;
}

/**
 * Jest global interface
 */
export interface JestGlobal {
  jest?: {
    fn: <T extends (...args: unknown[]) => unknown>(implementation?: T) => SpyFunction<T>;
    spyOn: <T extends Record<string, unknown>, K extends keyof T>(obj: T, method: K) => SpyFunction;
    clearAllMocks: () => void;
    restoreAllMocks: () => void;
    resetAllMocks: () => void;
    resetModules: () => void;
    doMock: (moduleName: string, factory: () => unknown, options?: { virtual?: boolean }) => void;
  };
  require?: (moduleName: string) => unknown;
}

/**
 * Jasmine global interface
 */
export interface JasmineGlobal {
  jasmine?: {
    createSpy: (name?: string) => SpyFunction;
    createSpyObj: (baseName: string, methodNames: string[]) => Record<string, SpyFunction>;
    any: (constructor: Constructor) => unknown;
  };
  spyOn?: <T extends Record<string, unknown>, K extends keyof T>(obj: T, method: K) => SpyFunction;
}

/**
 * Generic spy function interface that works for both Jest and Jasmine
 */
export interface SpyFunction<T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): ReturnType<T>;
  
  // Jest-specific methods
  mockReturnValue?: (value: ReturnType<T>) => SpyFunction<T>;
  mockImplementation?: (implementation?: T) => SpyFunction<T>;
  mockResolvedValue?: (value: ReturnType<T>) => SpyFunction<T>;
  mockRejectedValue?: (value: unknown) => SpyFunction<T>;
  mockClear?: () => SpyFunction<T>;
  mockReset?: () => SpyFunction<T>;
  mockRestore?: () => SpyFunction<T>;
  
  // Jasmine-specific methods
  and?: {
    returnValue: (value: ReturnType<T>) => SpyFunction<T>;
    callFake: (implementation: T) => SpyFunction<T>;
    resolveTo: (value: ReturnType<T>) => SpyFunction<T>;
    rejectWith: (value: unknown) => SpyFunction<T>;
    stub: () => SpyFunction<T>;
  };
  calls?: {
    reset: () => void;
    count: () => number;
    argsFor: (index: number) => Parameters<T>;
    allArgs: () => Parameters<T>[];
  };
  
  // Common assertion methods
  toHaveBeenCalled?: () => void;
  toHaveBeenCalledWith?: (...args: Parameters<T>) => void;
  toHaveBeenCalledTimes?: (times: number) => void;
}