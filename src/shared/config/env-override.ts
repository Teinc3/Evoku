import prod from '@config/shared/prod.json' with { type: 'json' };
import dev from '@config/shared/dev.json' with { type: 'json' };


/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// Process defined on server, so ts-expect-error will fail

// @ts-ignore
const isServer = typeof process !== 'undefined' && typeof (process as any).env !== 'undefined';
const env = isServer 
  // @ts-ignore
  ? String((process as any).env.NODE_ENV ?? 'development').toLowerCase() 
  : 'development';
const chosenOverride = env.includes('prod') ? prod : dev;

export default chosenOverride;