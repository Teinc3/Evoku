import { readFileSync } from 'fs';
import esbuild from 'esbuild';


const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const externals = Object.keys(pkg.dependencies);

esbuild.build({
  entryPoints: ['src/server/index.ts'],
  format: 'esm',
  bundle: true,
  platform: 'node',
  outfile: 'dist/server/index.js',
  external: externals,
  tsconfig: 'tsconfig.server.json',
}).catch(() => process.exit(1));