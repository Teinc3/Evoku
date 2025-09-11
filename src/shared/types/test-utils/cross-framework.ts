/**
 * Cross-framework test utilities for Jest and Jasmine compatibility
 * 
 * This module provides utility functions to enable shared unit tests to run
 * in both Jest (server) and Jasmine (client) test environments by abstracting
 * framework-specific APIs like jest.fn() vs jasmine.createSpy().
 */

declare const jasmine: any;
declare const jest: any;

/**
 * Check if we're running in Jest environment
 */
export function isJestEnvironment(): boolean {
  return typeof jest !== 'undefined';
}

/**
 * Check if we're running in Jasmine environment  
 */
export function isJasmineEnvironment(): boolean {
  return typeof jasmine !== 'undefined';
}

/**
 * Create a spy function that works in both Jest and Jasmine
 */
export function createSpy(name?: string): any {
  if (isJestEnvironment()) {
    return jest.fn();
  } else if (isJasmineEnvironment()) {
    return jasmine.createSpy(name || 'spy');
  }
  throw new Error('Unsupported test environment');
}

/**
 * Create a spy on an object method that works in both Jest and Jasmine
 */
export function spyOnMethod(object: any, method: string): any {
  if (isJestEnvironment()) {
    return jest.spyOn(object, method);
  } else if (isJasmineEnvironment()) {
    return spyOn(object, method);
  }
  throw new Error('Unsupported test environment');
}

/**
 * Cross-framework type matcher
 */
export function anyOfType(type: any): any {
  if (isJestEnvironment()) {
    // Use dynamic access to avoid TypeScript errors in Jasmine environment
    return (expect as any).any(type);
  } else if (isJasmineEnvironment()) {
    return jasmine.any(type);
  }
  throw new Error('Unsupported test environment');
}

/**
 * Length assertion helper
 */
export function expectToHaveLength(actual: any, expectedLength: number): void {
  expect(actual.length).toBe(expectedLength);
}

/**
 * Type assertion helper  
 */
export function expectToBeOfType(actual: any, type: any): void {
  if (isJestEnvironment()) {
    expect(actual).toEqual((expect as any).any(type));
  } else if (isJasmineEnvironment()) {
    expect(actual).toEqual(jasmine.any(type));
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