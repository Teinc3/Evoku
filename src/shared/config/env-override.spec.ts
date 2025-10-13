import prod from '@config/shared/prod.json';
import dev from '@config/shared/dev.json';


describe('env-override isomorphic loader', () => {
  const originalProcess = (global as unknown as { process?: NodeJS.Process }).process;

  afterEach(() => {
    // Restore process after each test
    (global as unknown as { process?: NodeJS.Process }).process = originalProcess;
    jest.resetModules();
  });

  it('should pick production override when NODE_ENV=production (server)', async () => {
    (global as unknown as { process?: { env: Record<string, string | undefined> } }).process = {
      env: { ['NODE_ENV']: 'production' },
    };
    jest.resetModules();

    const mod = await import('./env-override');
    expect(mod.default).toEqual(prod);
  });

  it('should default to development override when no process exists (client)', async () => {
    // Simulate browser environment without a global process
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - intentionally delete process to simulate browser env
    delete (global as unknown as { process?: NodeJS.Process }).process;
    jest.resetModules();

    const mod = await import('./env-override');
    expect(mod.default).toEqual(dev);
  });
});
