import { join } from 'path';
import { readFileSync } from 'fs';

import ClientConfigSchema from '../types/config/schema';
import { deepMerge, type JsonObject } from '.';


function readJson(p: string): JsonObject {
  const raw = readFileSync(p, 'utf8');
  return JSON.parse(raw) as JsonObject;
}

describe('config overrides validate against Zod schema', () => {
  const root = join(__dirname, '..', '..', '..', 'config', 'shared');

  test.each(['dev.json', 'prod.json'])('merged %s should pass validation', file => {
    const base = readJson(join(root, 'base.json'));
    const over = readJson(join(root, file));
    const merged = deepMerge(base, over);
    expect(() => ClientConfigSchema.parse(merged)).not.toThrow();
  });

  test('sanity: broken override fails validation', () => {
    const base = readJson(join(root, 'base.json'));
    const badOver: JsonObject = {
      networking: {
        ws: {
          uri: 'not-a-valid-url'
        },
        service: {
          backoffMs: -100
        }
      },
      security: {
        packetScramblerSeed: ''
      }
    };
    const merged = deepMerge(base, badOver);
    expect(() => ClientConfigSchema.parse(merged)).toThrow();
  });

  test('sanity: extra fields in override fail validation', () => {
    const base = readJson(join(root, 'base.json'));
    const badOver: JsonObject = {
      networking: {
        ws: {
          extraField: 'not-allowed'
        }
      }
    };
    const merged = deepMerge(base, badOver);
    expect(() => ClientConfigSchema.parse(merged)).toThrow();
  });
});