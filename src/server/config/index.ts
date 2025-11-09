import path from 'node:path';
import fs from 'node:fs';

import { deepFreeze, deepMerge } from '@shared/utils/config';
import baseServerConfig from '@config/server/base.json' with { type: 'json' };

import type { JsonObj as JsonObject } from '@shared/utils/config';
import type ServerConfigType from './schema';


function readJsonIfExists(p: string): JsonObject {
  if (!fs.existsSync(p)) {
    throw new Error(`Config file not found: ${p}`);
  }
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw) as JsonObject;
}

let overrideConfig: JsonObject = {};

try {
  const configPath = path.join(process.cwd(), 'config', 'server');

  switch (process.env['NODE_ENV']) {
    case 'production':
    case 'prod':
      overrideConfig = readJsonIfExists(path.join(configPath, 'prod.json'));
      console.log('Using production configuration');
      break;
    // Add staging in the future
    case 'dev':
    case 'development':
    default:
      overrideConfig = readJsonIfExists(path.join(configPath, 'dev.json'));
      break;
  }
} catch (e) {
  console.error(
    `There was an issue loading the config for the environment ${process.env['NODE_ENV']}:`,
    e
  );
  // Fail fast to avoid running with a partial or missing config
  process.exit(1);
}

const serverConfig = deepFreeze(deepMerge(
  baseServerConfig as JsonObject,
  overrideConfig as JsonObject
)) as ServerConfigType;

export default serverConfig;
