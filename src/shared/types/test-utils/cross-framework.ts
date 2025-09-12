/**
 * Cross-framework test utilities for Jest and Jasmine compatibility
 * 
 * This module provides utility functions to enable shared unit tests to run
 * in both Jest (server) and Jasmine (client) test environments by abstracting
 * framework-specific APIs like jest.fn() vs jasmine.createSpy().
 */

import type { SpyFunction, Constructor, JestGlobal, JasmineGlobal } from './types';


/**
 * Check if we're running in Jest environment
 */
export function isJestEnvironment(): boolean {
  // Check multiple ways Jest might be available
  try {
    return typeof (globalThis as JestGlobal).jest !== 'undefined' ||
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
  return typeof (globalThis as JasmineGlobal).jasmine !== 'undefined';
}

/**
 * Create a spy function that works in both Jest and Jasmine
 */
export function createSpy<T extends (...args: unknown[]) => unknown>(
  name?: string
): SpyFunction<T> {
  if (isJestEnvironment()) {
    const jestGlobal = globalThis as JestGlobal;
    if (jestGlobal.jest?.fn) {
      return jestGlobal.jest.fn() as SpyFunction<T>;
    }
    throw new Error('Jest fn not available');
  } else if (isJasmineEnvironment()) {
    const jasmineGlobal = globalThis as JasmineGlobal;
    return jasmineGlobal.jasmine!.createSpy(name || 'spy') as SpyFunction<T>;
  }
  throw new Error('Unsupported test environment');
}

/**
 * Create a spy on an object method that works in both Jest and Jasmine
 */
export function spyOnMethod<T extends Record<string, unknown>, K extends keyof T>(
  object: T,
  method: K
): SpyFunction {
  if (isJestEnvironment()) {
    const jestGlobal = globalThis as JestGlobal;
    if (jestGlobal.jest?.spyOn) {
      return jestGlobal.jest.spyOn(object, method) as SpyFunction;
    }
    throw new Error('Jest spyOn not available');
  } else if (isJasmineEnvironment()) {
    const jasmineGlobal = globalThis as JasmineGlobal;
    return jasmineGlobal.spyOn!(object, method) as SpyFunction;
  }
  throw new Error('Unsupported test environment');
}

/**
 * Mock a module (Jest only - no-op in Jasmine)
 */
export function doMock(moduleName: string, factory: () => unknown, options?: { virtual?: boolean }): void {
  if (isJestEnvironment()) {
    const jestGlobal = globalThis as JestGlobal;
    jestGlobal.jest?.doMock(moduleName, factory, options);
  }
  // Jasmine doesn't support dynamic module mocking - this is a no-op
}

/**
 * Reset modules (Jest only - no-op in Jasmine)
 */
export function resetModules(): void {
  if (isJestEnvironment()) {
    const jestGlobal = globalThis as JestGlobal;
    jestGlobal.jest?.resetModules();
  }
  // Jasmine doesn't support module resetting - this is a no-op
}

/**
 * Require a module (Jest only - returns module or throws in Jasmine)
 */
export function requireModule(moduleName: string): unknown {
  if (isJestEnvironment()) {
    const jestGlobal = globalThis as JestGlobal;
    if (jestGlobal.require) {
      return jestGlobal.require(moduleName);
    }
  }
  // In Jasmine, we can't dynamically require modules, throw error
  throw new Error(`Cannot require module '${moduleName}' in Jasmine environment`);
}

/**
 * Clear all mocks (Jest) or no-op (Jasmine)
 */
export function clearAllMocks(): void {
  if (isJestEnvironment()) {
    const jestGlobal = globalThis as JestGlobal;
    jestGlobal.jest?.clearAllMocks();
  }
  // Jasmine doesn't have a global clear, individual spy clearing is needed
}

/**
 * Restore all mocks/spies
 */
export function restoreAllMocks(): void {
  if (isJestEnvironment()) {
    const jestGlobal = globalThis as JestGlobal;
    jestGlobal.jest?.restoreAllMocks();
  }
  // Jasmine handles restoration automatically after each test
}

/**
 * Cross-framework type matcher
 */
export function anyOfType(type: Constructor): unknown {
  if (isJestEnvironment()) {
    const expectGlobal = globalThis as { expect?: { any: (constructor: Constructor) => unknown } };
    return expectGlobal.expect?.any(type);
  } else if (isJasmineEnvironment()) {
    const jasmineGlobal = globalThis as JasmineGlobal;
    return jasmineGlobal.jasmine?.any(type);
  }
  throw new Error('Unsupported test environment');
}

/**
 * Cross-framework negation matcher - expect(actual).not.toEqual(expected)
 */
export function expectNotToEqual(actual: unknown, expected: unknown): void {
  expect(actual).not.toEqual(expected);
}

/**
 * Cross-framework negation matcher - expect(actual).not.toBe(expected)
 */
export function expectNotToBe(actual: unknown, expected: unknown): void {
  expect(actual).not.toBe(expected);
}

/**
 * Cross-framework deep object/array equality matcher
 */
export function expectToDeepEqual(actual: unknown, expected: unknown): void {
  if (isJestEnvironment()) {
    // Jest has toEqual for deep equality
    expect(actual).toEqual(expected);
  } else if (isJasmineEnvironment()) {
    // Jasmine also has toEqual for deep equality
    expect(actual).toEqual(expected);
  } else {
    // Fallback to JSON comparison
    expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
  }
}

/**
 * Cross-framework deep object/array inequality matcher  
 */
export function expectNotToDeepEqual(actual: unknown, expected: unknown): void {
  if (isJestEnvironment()) {
    // Jest has toEqual for deep equality
    expect(actual).not.toEqual(expected);
  } else if (isJasmineEnvironment()) {
    // Jasmine also has toEqual for deep equality
    expect(actual).not.toEqual(expected);
  } else {
    // Fallback to JSON comparison
    expect(JSON.stringify(actual)).not.toBe(JSON.stringify(expected));
  }
}

/**
 * Cross-framework array/object containing matcher
 */
export function expectToContain(actual: unknown[], expected: unknown): void {
  expect(actual).toContain(expected);
}

/**
 * Cross-framework array/object not containing matcher
 */
export function expectNotToContain(actual: unknown[], expected: unknown): void {
  expect(actual).not.toContain(expected);
}

/**
 * Cross-framework length assertion with negation option
 */
export function expectToHaveLength(
  actual: { length: number }, 
  expectedLength: number,
  negate = false
): void {
  if (negate) {
    expect(actual.length).not.toBe(expectedLength);
  } else {
    expect(actual.length).toBe(expectedLength);
  }
}

/**
 * Cross-framework property existence matcher
 */
export function expectToHaveProperty(
  actual: Record<string, unknown>,
  propertyName: string,
  negate = false
): void {
  if (negate) {
    expect(propertyName in actual).toBe(false);
  } else {
    expect(propertyName in actual).toBe(true);
  }
}

/**
 * Type assertion helper with negation option
 */
export function expectToBeOfType(
  actual: unknown, 
  type: Constructor,
  negate = false
): void {
  if (isJestEnvironment()) {
    const expectGlobal = globalThis as { expect?: { any: (constructor: Constructor) => unknown } };
    if (negate) {
      expect(actual).not.toEqual(expectGlobal.expect?.any(type));
    } else {
      expect(actual).toEqual(expectGlobal.expect?.any(type));
    }
  } else if (isJasmineEnvironment()) {
    const jasmineGlobal = globalThis as JasmineGlobal;
    if (negate) {
      expect(actual).not.toEqual(jasmineGlobal.jasmine?.any(type));
    } else {
      expect(actual).toEqual(jasmineGlobal.jasmine?.any(type));
    }
  } else {
    // Fallback to typeof check
    if (type === Number) {
      if (negate) {
        expect(typeof actual).not.toBe('number');
      } else {
        expect(typeof actual).toBe('number');
      }
    } else if (type === String) {
      if (negate) {
        expect(typeof actual).not.toBe('string');
      } else {
        expect(typeof actual).toBe('string');
      }
    } else if (type === Boolean) {
      if (negate) {
        expect(typeof actual).not.toBe('boolean');
      } else {
        expect(typeof actual).toBe('boolean');
      }
    } else {
      if (negate) {
        expect(actual).not.toBeInstanceOf(type);
      } else {
        expect(actual).toBeInstanceOf(type);
      }
    }
  }
}