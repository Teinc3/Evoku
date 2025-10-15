import { deepMerge } from '@shared/utils/config';
import prodConfig from '@config/server/prod.json';
import devConfig from '@config/server/dev.json';
import baseConfig from '@config/server/base.json';
import { ServerConfigSchema } from './schema';


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

    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      process.env['NODE_ENV'] = originalEnv;
      jest.restoreAllMocks();
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
