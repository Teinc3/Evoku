import prodConfig from '@config/shared/prod.json';
import devConfig from '@config/shared/dev.json';
import baseConfig from '@config/shared/base.json';
import { deepMerge } from '../utils/config';
import { SharedConfigSchema } from './schema';


describe('Shared Config', () => {
  describe('Schema Validation', () => {
    it('should validate the development config', () => {
      const mergedConfig = deepMerge(baseConfig, devConfig);
      expect(() => SharedConfigSchema.parse(mergedConfig)).not.toThrow();
    });

    it('should validate the production config', () => {
      const mergedConfig = deepMerge(baseConfig, prodConfig);
      expect(() => SharedConfigSchema.parse(mergedConfig)).not.toThrow();
    });

    it('should fail validation for an invalid config', () => {
      const invalidConfig = {
        networking: {
          ws: {
            uri: 'not-a-url',
          },
        },
      };
      expect(() => SharedConfigSchema.parse(invalidConfig)).toThrow();
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
