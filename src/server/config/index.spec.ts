import fs from 'node:fs';


describe('server config loader', () => {
  const originalEnv = process.env['NODE_ENV'];

  afterEach(() => {
    process.env['NODE_ENV'] = originalEnv;
    jest.resetModules();
    jest.restoreAllMocks();
  });

  test('loads development override when NODE_ENV=development', async () => {
    jest.resetModules();
    process.env['NODE_ENV'] = 'development';

    jest.doMock('@config/server/base.json', () => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      __esModule: true,
      default: {
        networking: { port: 1000 }
      }
    }), { virtual: true });

    // The loader reads overrides from the filesystem. Mock fs to supply dev.json
    const realExists = fs.existsSync.bind(fs);
    const realRead = fs.readFileSync.bind(fs);
    const existsImpl: typeof fs.existsSync = (p: fs.PathLike) => {
      const s = String(p);
      if (s.includes('config/server/dev.json')) return true;
      return realExists(p);
    };
    jest.spyOn(fs, 'existsSync').mockImplementation(existsImpl);

    type ReadSync = (
      path: fs.PathOrFileDescriptor, 
      options?: { encoding?: BufferEncoding | null } | BufferEncoding | null
    ) => string | Buffer;
    const readImpl: ReadSync = (p, opts?) => {
      const s = String(p);
      if (s.includes('config/server/dev.json')) {
        return JSON.stringify({ networking: { port: 2000 } });
      }
      return realRead(p as fs.PathOrFileDescriptor, opts);
    };
    jest.spyOn(fs, 'readFileSync').mockImplementation(
      readImpl as unknown as typeof fs.readFileSync
    );

    // import AFTER mocks are in place
    const cfg = (await import(".")).default;

    expect(cfg.networking.port).toBe(2000);
  });

  test('loads production override when NODE_ENV=production', async () => {
    jest.resetModules();
    process.env['NODE_ENV'] = 'production';

    jest.doMock('@config/server/base.json', () => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      __esModule: true,
      default: {
        networking: { port: 1000 }
      }
    }), { virtual: true });

    // Mock filesystem override for prod.json
    const realExists2 = fs.existsSync.bind(fs);
    const realRead2 = fs.readFileSync.bind(fs);
    const existsImpl2: typeof fs.existsSync = (p: fs.PathLike) => {
      const s = String(p);
      if (s.includes('config/server/prod.json')) return true;
      return realExists2(p);
    };
    jest.spyOn(fs, 'existsSync').mockImplementation(existsImpl2);

    type ReadSync2 = (
      path: fs.PathOrFileDescriptor, 
      options?: { encoding?: BufferEncoding | null } | BufferEncoding | null
    ) => string | Buffer;
    const readImpl2: ReadSync2 = (p, opts?) => {
      const s = String(p);
      if (s.includes('config/server/prod.json')) {
        return JSON.stringify({ networking: { port: 3000 } });
      }
      return realRead2(p as fs.PathOrFileDescriptor, opts);
    };
    jest.spyOn(fs, 'readFileSync').mockImplementation(
      readImpl2 as unknown as typeof fs.readFileSync
    );

    const cfg = (await import(".")).default;

    expect(cfg.networking.port).toBe(3000);
  });

  test('unknown NODE_ENV falls back to base and logs error', async () => {
    jest.resetModules();
    process.env['NODE_ENV'] = 'weird-env';

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    jest.doMock('@config/server/base.json', () => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      __esModule: true,
      default: {
        networking: { port: 7000 }
      }
    }), { virtual: true });

    // Do NOT mock any override file - simulate missing override by making existsSync false
    const realExists3 = fs.existsSync.bind(fs);
    const existsImpl3: typeof fs.existsSync = (p: fs.PathLike) => {
      const s = String(p);
      if (s.includes('config/server/base.json')) {
        return true; // base still present
      }
      if (s.includes('config/server/dev.json') || s.includes('config/server/prod.json')) {
        return false;
      }
      return realExists3(p);
    };
    jest.spyOn(fs, 'existsSync').mockImplementation(existsImpl3);

    const cfg = (await import(".")).default;

    expect(cfg.networking.port).toBe(7000);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
