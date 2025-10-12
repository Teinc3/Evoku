import override from '@config/shared/override.json' with { type: 'json' };
import base from '@config/shared/base.json' with { type: 'json' };
import deepFreeze from '../utils/deepFreeze';

import type ClientConfigType from '../types/config/types';


export type JsonObject = Record<string, unknown>;

export function isObject(v: unknown): v is JsonObject {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** 
 * Function to recursively deep merge for plain objects.
 * Override wins; arrays are replaced.
 */
export function deepMerge(a: JsonObject, b: JsonObject): JsonObject {
  const out: JsonObject = { ...a };
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

const merged = deepMerge(base as JsonObject, override as JsonObject) as ClientConfigType;
const ClientConfig = deepFreeze(merged);

export default ClientConfig;