import { deepFreeze, deepMerge, isObject } from './config';


describe('Config Utils', () => {
  describe('isObject', () => {
    it('should return true for objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
    });

    it('should return false for non-objects', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(true)).toBe(false);
      expect(isObject([])).toBe(false);
      expect(isObject(() => {})).toBe(false);
    });
  });

  describe('deepMerge', () => {
    it('should merge two objects', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { b: { d: 3 }, e: 4 };
      const expected = { a: 1, b: { c: 2, d: 3 }, e: 4 };
      expect(deepMerge(obj1, obj2)).toEqual(expected);
    });

    it('should override properties from the first object', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      const expected = { a: 1, b: 3, c: 4 };
      expect(deepMerge(obj1, obj2)).toEqual(expected);
    });

    it('should handle empty objects', () => {
      const obj1 = { a: 1 };
      const obj2 = {};
      expect(deepMerge(obj1, obj2)).toEqual(obj1);
      expect(deepMerge(obj2, obj1)).toEqual(obj1);
    });

    it('should replace arrays instead of merging them', () => {
      const obj1 = { a: [1, 2] };
      const obj2 = { a: [3, 4] };
      expect(deepMerge(obj1, obj2)).toEqual({ a: [3, 4] });
    });
  });

  describe('deepFreeze', () => {
    it('should freeze an object and its nested properties', () => {
      const obj = { a: 1, b: { c: 2 } };
      const frozenObj = deepFreeze(obj);

      expect(Object.isFrozen(frozenObj)).toBe(true);
      expect(Object.isFrozen(frozenObj.b)).toBe(true);

      expect(() => {
        frozenObj.a = 10;
      }).toThrow();

      expect(() => {
        frozenObj.b.c = 20;
      }).toThrow();
    });

    it('should not throw on already frozen objects', () => {
      const obj = { a: 1 };
      Object.freeze(obj);
      expect(() => deepFreeze(obj)).not.toThrow();
    });
  });
});
