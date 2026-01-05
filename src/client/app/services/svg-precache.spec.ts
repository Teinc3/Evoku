import SvgPrecacheService from './svg-precache';


type RequestIdleCallback = (
  callback: () => void,
  options?: {
    timeout?: number;
  }
) => number;

describe('SvgPrecacheService', () => {
  let service: SvgPrecacheService;

  const globalWithRic = globalThis as unknown as {
    requestIdleCallback?: RequestIdleCallback;
  };

  beforeEach(() => {
    service = new SvgPrecacheService();
  });

  afterEach(() => {
    delete globalWithRic.requestIdleCallback;
  });

  describe('schedule', () => {
    it('should be idempotent and only schedule once', () => {
      const ricSpy = jasmine.createSpy<RequestIdleCallback>('requestIdleCallback').and.callFake(
        (callback: () => void): number => {
          callback();
          return 0;
        },
      );
      globalWithRic.requestIdleCallback = ricSpy;

      spyOn(service as unknown as { precacheAllSvgs: () => Promise<void> }, 'precacheAllSvgs')
        .and.resolveTo();

      service.schedule();
      service.schedule();

      expect(ricSpy).toHaveBeenCalledTimes(1);
    });

    it('should use requestIdleCallback when available', () => {
      const ricSpy = jasmine.createSpy<RequestIdleCallback>('requestIdleCallback').and.callFake(
        (callback: () => void, options?: { timeout?: number }): number => {
          expect(options?.timeout).toBe(250);
          callback();
          return 0;
        },
      );
      globalWithRic.requestIdleCallback = ricSpy;

      spyOn(service as unknown as { precacheAllSvgs: () => Promise<void> }, 'precacheAllSvgs')
        .and.resolveTo();

      service.schedule();

      expect(ricSpy).toHaveBeenCalledTimes(1);
    });

    it('should fall back to setTimeout when requestIdleCallback is not available', () => {
      delete globalWithRic.requestIdleCallback;

      const setTimeoutSpy = spyOn(globalThis, 'setTimeout').and.callFake(
        (handler: TimerHandler, delay?: number): number => {
          expect(delay).toBe(250);
          if (typeof handler === 'function') {
            (handler as () => void)();
          }
          return 0;
        },
      );

      spyOn(service as unknown as { precacheAllSvgs: () => Promise<void> }, 'precacheAllSvgs')
        .and.resolveTo();

      service.schedule();

      expect(setTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('loadManifest', () => {
    it('should return null when fetch is not ok', async () => {
      spyOn(window, 'fetch').and.resolveTo({
        ok: false,
        json: async () => [],
      } as unknown as Response);

      const manifest = await (service as unknown as {
        loadManifest: () => Promise<readonly string[] | null>;
      }).loadManifest();

      expect(manifest).toBeNull();
    });

    it('should return null when response json is not an array', async () => {
      spyOn(window, 'fetch').and.resolveTo({
        ok: true,
        json: async () => ({ a: 1 }),
      } as unknown as Response);

      const manifest = await (service as unknown as {
        loadManifest: () => Promise<readonly string[] | null>;
      }).loadManifest();

      expect(manifest).toBeNull();
    });

    it('should filter to only non-empty string entries', async () => {
      spyOn(window, 'fetch').and.resolveTo({
        ok: true,
        json: async () => ['a.svg', '', 1, null, 'b.svg'],
      } as unknown as Response);

      const manifest = await (service as unknown as {
        loadManifest: () => Promise<readonly string[] | null>;
      }).loadManifest();

      expect(manifest).toEqual(['a.svg', 'b.svg']);
    });

    it('should return null on fetch error', async () => {
      spyOn(window, 'fetch').and.rejectWith(new Error('network'));

      const manifest = await (service as unknown as {
        loadManifest: () => Promise<readonly string[] | null>;
      }).loadManifest();

      expect(manifest).toBeNull();
    });
  });

  describe('preloadImage', () => {
    it('should return existing promise when same url is in-flight', async () => {
      const originalImage = window.Image;
      let createdCount = 0;

      const imageCtor = function imageStub(): HTMLImageElement {
        createdCount += 1;
        const img = {
          onload: null as null | (() => void),
          onerror: null as null | (() => void),
          complete: false,
          set src(_value: string) {
            setTimeout(() => {
              img.onload?.();
            }, 0);
          },
        };

        return img as unknown as HTMLImageElement;
      };

      window.Image = imageCtor as unknown as typeof Image;

      try {
        const url = '/assets/x.svg';
        const serviceWithPreloadImage = service as unknown as {
          preloadImage: (u: string) => Promise<void>;
        };

        const p1 = serviceWithPreloadImage.preloadImage(url);
        const p2 = serviceWithPreloadImage.preloadImage(url);

        expect(p2).toBe(p1);
        await Promise.all([p1, p2]);
        expect(createdCount).toBe(1);
      } finally {
        window.Image = originalImage;
      }
    });

    it('should resolve immediately when image is already complete', async () => {
      const url = '/assets/complete.svg';

      const preloadedImages = (service as unknown as {
        preloadedImages: Map<string, HTMLImageElement>;
      }).preloadedImages;

      preloadedImages.set(url, { complete: true } as unknown as HTMLImageElement);

      const serviceWithPreloadImage = service as unknown as {
        preloadImage: (u: string) => Promise<void>;
      };
      await serviceWithPreloadImage.preloadImage(url);

      expect(preloadedImages.get(url)?.complete).toBeTrue();
    });
  });

  describe('precacheAllSvgs', () => {
    it('should swallow individual preload failures', async () => {
      const loadManifestSpy = spyOn(
        service as unknown as { loadManifest: () => Promise<readonly string[] | null> },
        'loadManifest',
      )
        .and.resolveTo(['/a.svg']);
      const preloadImageSpy = spyOn(
        service as unknown as { preloadImage: (u: string) => Promise<void> },
        'preloadImage',
      )
        .and.rejectWith(new Error('fail'));

      const serviceWithPrecacheAllSvgs = service as unknown as {
        precacheAllSvgs: () => Promise<void>;
      };
      await serviceWithPrecacheAllSvgs.precacheAllSvgs();

      expect(loadManifestSpy).toHaveBeenCalled();
      expect(preloadImageSpy).toHaveBeenCalledWith('/a.svg');
    });

    it('should early return when manifest is null', async () => {
      const loadManifestSpy = spyOn(
        service as unknown as { loadManifest: () => Promise<readonly string[] | null> },
        'loadManifest',
      )
        .and.resolveTo(null);

      const serviceWithPrecacheAllSvgs = service as unknown as {
        precacheAllSvgs: () => Promise<void>;
      };
      await serviceWithPrecacheAllSvgs.precacheAllSvgs();

      expect(loadManifestSpy).toHaveBeenCalled();
    });
  });
});
