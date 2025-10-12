import path from 'node:path';
import fs from 'node:fs';

import deepFreeze from '@shared/utils/deepFreeze';
import { deepMerge } from '@shared/config';
import base from '@config/server/base.json' with { type: 'json' };

import type { JsonObject } from '@shared/config';
import type ServerConfigType from './schema';


const root = path.resolve(__dirname, '../../..');

function readJsonIfExists(p: string): JsonObject {
  if (!fs.existsSync(p)) {
    throw new Error(`Config file not found: ${p}`);
  }
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw) as JsonObject;
}

let overrideConfig: JsonObject = {};

try {
  const serverConfigPath = path.join(root, 'config', 'server');

  switch (process.env['NODE_ENV']) {
    case 'production':
    case 'prod':
      overrideConfig = readJsonIfExists(path.join(serverConfigPath, 'prod.json'));
      break;
    case 'dev':
    case 'development':
      overrideConfig = readJsonIfExists(path.join(serverConfigPath, 'dev.json'));
      break;
    default:
      throw new Error(`Unrecognized NODE_ENV "${process.env['NODE_ENV']}"`);
  }
} catch (e) {
  console.error('There was an issue loading the override config for the current environment: ', e);
}

const merged = deepMerge(base as JsonObject, overrideConfig as JsonObject) as ServerConfigType;
const ServerConfig = deepFreeze(merged);

export default ServerConfig;