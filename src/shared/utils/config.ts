export type JsonObj = Record<string, unknown>;
export type JsonObject = JsonObj;

export function isObject(v: unknown): v is JsonObj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Deep merge plain JSON-like objects. Override wins; arrays are replaced. */
export function deepMerge(a: JsonObj, b: JsonObj): JsonObj {
  const out: JsonObj = { ...a };
  for (const k of Object.keys(b)) {
    const av = out[k];
    const bv = b[k];
    if (isObject(av) && isObject(bv)) {
      out[k] = deepMerge(av, bv);
    } else {
      out[k] = bv;
    }
  }
  return out;
}

/** Recursively freeze an object to enforce immutability of configuration */
export function deepFreeze<GenericObject extends object>(
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
