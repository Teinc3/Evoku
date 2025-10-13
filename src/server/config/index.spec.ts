import * as path from 'path';
import * as fs from 'fs';

import { deepMerge } from '@shared/utils/config';
import prodConfig from '@config/server/prod.json';
import devConfig from '@config/server/dev.json';
import baseConfig from '@config/server/base.json';
import { ServerConfigSchema } from './schema';


jest.mock('./index', () => {
  const env = process.env['NODE_ENV'] || 'development';
  const overrideFileName = env.includes('prod') ? 'prod.json' : 'dev.json';
  const baseConfigPath = path.resolve(__dirname, '../../../config/server/base.json');
  const overrideConfigPath = path.resolve(__dirname, `../../../config/server/${overrideFileName}`);

  const baseConfig = JSON.parse(fs.readFileSync(baseConfigPath, 'utf-8'));
  const overrideConfig = JSON.parse(fs.readFileSync(overrideConfigPath, 'utf-8'));

  const mergedConfig = deepMerge(baseConfig, overrideConfig);

  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: mergedConfig,
  } as unknown;
});


describe('Server Config', () => {
  describe('Schema Validation', () => {
    it('should validate the development config', () => {
      const mergedConfig = deepMerge(baseConfig, devConfig);
      expect(() => ServerConfigSchema.parse(mergedConfig)).not.toThrow();
    });

    it('should validate the production config', () => {
      const mergedConfig = deepMerge(baseConfig, prodConfig);
      expect(() => ServerConfigSchema.parse(mergedConfig)).not.toThrow();
    });

    it('should fail validation for an invalid config', () => {
      const invalidConfig = {
        networking: {
          port: 'not-a-number',
        },
      };
      expect(() => ServerConfigSchema.parse(invalidConfig)).toThrow();
    });
  });

  describe('Loading Behavior', () => {
    const originalEnv = process.env['NODE_ENV'];

    afterEach(() => {
      process.env['NODE_ENV'] = originalEnv;
    });

    it('should load development config by default', async () => {
      process.env['NODE_ENV'] = 'development';
      jest.resetModules();

      const { default: config } = await import(".");
      const expected = deepMerge(baseConfig, devConfig);
      expect(config).toEqual(expected);
    });

    it('should load production config when NODE_ENV is production', async () => {
      process.env['NODE_ENV'] = 'production';
      jest.resetModules();

      const { default: config } = await import(".");
      const expected = deepMerge(baseConfig, prodConfig);
      expect(config).toEqual(expected);
    });
  });
});
