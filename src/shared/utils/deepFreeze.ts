/** Recursively freeze an object to enforce immutability of configuration */
export default function deepFreeze<GenericObject extends object>(
  obj: GenericObject
): GenericObject {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    for (const key of Object.getOwnPropertyNames(obj)) {
      const value = obj[key as keyof GenericObject];
      if (value && (typeof value === 'object' || typeof value === 'function')) {
        deepFreeze(value);
      }
    }
  }
  return obj;
}