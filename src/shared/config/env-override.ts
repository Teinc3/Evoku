import prod from '@config/shared/prod.json' with { type: 'json' };
import dev from '@config/shared/dev.json' with { type: 'json' };


// This module is isomorphic: on the server we read from `process.env.NODE_ENV`.
// On the client, Angular's `fileReplacements` will swap the dev/prod JSON at
// build time so the runtime environment is implied by the bundle.

declare const process: {
  env?: Record<string, string | undefined>;
};

const isServer = typeof process !== 'undefined' && typeof process.env !== 'undefined';

const env = isServer
  ? String(process.env?.['NODE_ENV'] ?? 'development').toLowerCase()
  : 'development';

const chosenOverride = env.includes('prod') ? prod : dev;

export default chosenOverride;