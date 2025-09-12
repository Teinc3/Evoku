/**
 * Cross-framework test utilities for Jest and Jasmine compatibility
 * 
 * This module provides utility functions to enable shared unit tests to run
 * in both Jest (server) and Jasmine (client) test environments by abstracting
 * framework-specific APIs like jest.fn() vs jasmine.createSpy().
 */

import type { SpyFunction, Constructor } from './types';


/**
 * Check if we're running in Jest environment
 */
export function isJestEnvironment(): boolean {
  // Check multiple ways Jest might be available
  try {
    return typeof (globalThis as { jest?: unknown }).jest !== 'undefined' ||
           (typeof window === 'undefined' && 
            typeof (globalThis as { 
              // eslint-disable-next-line @typescript-eslint/naming-convention
              process?: { env?: { JEST_WORKER_ID?: string } } 
            }).process?.env?.JEST_WORKER_ID !== 'undefined');
  } catch {
    return false;
  }
}

/**
 * Check if we're running in Jasmine environment  
 */
export function isJasmineEnvironment(): boolean {
  return typeof (globalThis as { jasmine?: unknown }).jasmine !== 'undefined';
}

/**
 * Create a spy function that works in both Jest and Jasmine
 */
export function createSpy<T extends (...args: unknown[]) => unknown>(
  name?: string
): SpyFunction<T> {
  if (isJestEnvironment()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jestGlobal = (globalThis as any).jest || 
                       eval('typeof jest !== "undefined" ? jest : undefined');
    
    if (jestGlobal && jestGlobal.fn) {
      return jestGlobal.fn() as SpyFunction<T>;
    }
    
    throw new Error('Jest fn not available');
  } else if (isJasmineEnvironment()) {
    return ((globalThis as { jasmine?: unknown }).jasmine as unknown as { 
      createSpy: (name?: string) => SpyFunction<T> 
    }).createSpy(name || 'spy');
  }
  throw new Error('Unsupported test environment');
}

/**
 * Create a spy on an object method that works in both Jest and Jasmine
 */
/**
 * Create a spy on an object method that works in both Jest and Jasmine
 */
export function spyOnMethod(
  object: Record<string, unknown>,
  method: string
): SpyFunction {
  if (isJestEnvironment()) {
    // In Jest, we need to access the global jest object
    // Try different ways to access it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jestGlobal = (globalThis as any).jest || 
                       eval('typeof jest !== "undefined" ? jest : undefined');
    
    if (jestGlobal && jestGlobal.spyOn) {
      return jestGlobal.spyOn(object, method) as SpyFunction;
    }
    
    throw new Error('Jest spyOn not available');
  } else if (isJasmineEnvironment()) {
    return ((globalThis as { spyOn?: unknown }).spyOn as unknown as (
      obj: Record<string, unknown>, method: string
    ) => SpyFunction)(object, method);
  }
  throw new Error('Unsupported test environment');
}

/**
 * Cross-framework type matcher
 */
export function anyOfType(type: Constructor): unknown {
  if (isJestEnvironment()) {
    return ((globalThis as { expect?: unknown }).expect as unknown as { 
      any: (constructor: unknown) => unknown 
    }).any(type);
  } else if (isJasmineEnvironment()) {
    return ((globalThis as { jasmine?: unknown }).jasmine as unknown as { 
      any: (constructor: unknown) => unknown 
    }).any(type);
  }
  throw new Error('Unsupported test environment');
}

/**
 * Length assertion helper
 */
export function expectToHaveLength(
  actual: { length: number }, 
  expectedLength: number
): void {
  expect(actual.length).toBe(expectedLength);
}

/**
 * Type assertion helper  
 */
export function expectToBeOfType(actual: unknown, type: Constructor): void {
  if (isJestEnvironment()) {
    expect(actual).toEqual(((globalThis as { expect?: unknown }).expect as unknown as { 
      any: (constructor: unknown) => unknown 
    }).any(type));
  } else if (isJasmineEnvironment()) {
    expect(actual).toEqual(((globalThis as { jasmine?: unknown }).jasmine as unknown as { 
      any: (constructor: unknown) => unknown 
    }).any(type));
  } else {
    // Fallback to typeof check
    if (type === Number) {
      expect(typeof actual).toBe('number');
    } else if (type === String) {
      expect(typeof actual).toBe('string');
    } else if (type === Boolean) {
      expect(typeof actual).toBe('boolean');
    } else {
      expect(actual).toBeInstanceOf(type);
    }
  }
}