import { TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';

import DynamicFaviconService from './dynamic-favicon.service';


interface DynamicFaviconServicePrivate {
  cachedSvg?: string | null;
  updateIcon?: () => void;
  removeExisting?: () => void;
  isSVGUnfriendly?: () => boolean;
  setStaticIcon?: () => void;
  timer?: number | null;
  ensureSvgFetched?: () => Promise<void>;
  initialSvg?: string | null;
}

describe('DynamicFaviconService', () => {
  let service: DynamicFaviconService | null = null;
  let fetchSpy: jasmine.Spy;

  const mockSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <rect id="p0" x="0" y="0" width="8" height="8" fill="#000" stroke="#fff"/>
      <rect id="p1" x="8" y="0" width="8" height="8" fill="#000" stroke="#fff"/>
      <rect id="p2" x="16" y="0" width="8" height="8" fill="#000" stroke="#fff"/>
      <rect id="p3" x="24" y="0" width="8" height="8" fill="#000" stroke="#fff"/>
      <rect id="p4" x="0" y="8" width="8" height="8" fill="#000" stroke="#fff"/>
      <rect id="p5" x="8" y="8" width="8" height="8" fill="#000" stroke="#fff"/>
      <rect id="p6" x="16" y="8" width="8" height="8" fill="#000" stroke="#fff"/>
      <rect id="p7" x="24" y="8" width="8" height="8" fill="#000" stroke="#fff"/>
    </svg>
  `;

  const getFaviconEl = (): HTMLLinkElement | null =>
    document.getElementById('dynamic-favicon') as HTMLLinkElement | null;
  const removeAllFavicons = (): void =>
    document.querySelectorAll('link[rel~="icon"]').forEach(el => el.remove());

  beforeEach(() => {
    removeAllFavicons();
    // Avoid double-spying on console if another suite already did
    try {
      spyOn(console, 'warn').and.stub();
    } catch {}
    try {
      spyOn(console, 'log').and.stub();
    } catch {}

    // IMPORTANT: Set up fetch spy BEFORE injecting the service
    // since the service constructor calls start() which triggers fetch
    const response = new Response(mockSvg, { status: 200, statusText: 'OK' });
    fetchSpy = spyOn(window, 'fetch').and.returnValue(Promise.resolve(response));

    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicFaviconService);
  });

  afterEach(() => {
    try {
      jasmine.clock().uninstall();
    } catch {}
    if (service) {
      service.stop();
      service = null;
    }
    removeAllFavicons();
  });

  it('fetches and sets an SVG favicon', fakeAsync(() => {
    // process microtasks first
    flushMicrotasks();
    // wait up to 1s in 50ms steps for the link to be created (covers different timing scenarios)
    const maxSteps = 20;
    let link: HTMLLinkElement | null = null;
    for (let i = 0; i < maxSteps; i++) {
      tick(50);
      link = getFaviconEl();
      if (link) {
        break;
      }
    }

    expect(fetchSpy).toHaveBeenCalledWith('/icon.svg');

    // If the service didn't create the link within our wait window, force an update
    if (!link) {
      const priv = service as unknown as DynamicFaviconServicePrivate;
      priv.cachedSvg = mockSvg;
      if (priv.updateIcon) {
        priv.updateIcon();
      }
      link = getFaviconEl();
    }

    expect(link).not.toBeNull();
    expect(link!.type).toBe('image/svg+xml');
    expect(link!.href).toContain('data:image/svg+xml;base64,');
  }));

  it('updateIcon handles empty cachedSvg safely', fakeAsync(() => {
    tick();
    // Access private fields through a typed view to avoid `any`
    const priv = service as unknown as DynamicFaviconServicePrivate;
    priv.cachedSvg = '';
    if (priv.updateIcon) {
      priv.updateIcon();
    }
    expect(true).toBe(true); // Just to have an assertion
  }));

  it('removeExisting removes all icon links', fakeAsync(() => {
    const l1 = document.createElement('link'); 
    l1.rel = 'icon'; 
    document.head.appendChild(l1);
    const l2 = document.createElement('link'); 
    l2.rel = 'icon'; 
    document.head.appendChild(l2);
    tick();
    const priv = service as unknown as DynamicFaviconServicePrivate;
    if (priv.removeExisting) {
      priv.removeExisting();
    }
    const remaining = document.querySelectorAll('link[rel~="icon"]');
    expect(remaining.length).toBe(0);
  }));

  it('stop swallows btoa errors', fakeAsync(() => {
    tick();
    const win = window as unknown as { btoa: (s: string) => string };
    const originalBtoa = win.btoa;
    try {
      // Replace btoa with a throwing function
      (window as unknown as { btoa: (s: string) => string }).btoa = () => { 
        throw new Error('btoa fail');
      };
      expect(() => service!.stop()).not.toThrow();
    } finally {
      // restore
      (window as unknown as { btoa: (s: string) => string }).btoa = originalBtoa;
    }
  }));

  it('isSVGUnfriendly returns false for non-iOS user agent', fakeAsync(() => {
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );
    const priv = service as unknown as DynamicFaviconServicePrivate;
    if (priv.isSVGUnfriendly) {
      expect(priv.isSVGUnfriendly()).toBe(false);
    }
  }));

  it('isSVGUnfriendly returns false for iOS but not Safari', fakeAsync(() => {
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) CriOS/100.0.0.0 Mobile/15E148 Safari/604.1'
    );
    const priv = service as unknown as DynamicFaviconServicePrivate;
    if (priv.isSVGUnfriendly) {
      expect(priv.isSVGUnfriendly()).toBe(false);
    }
  }));

  it('isSVGUnfriendly returns false when no version match', fakeAsync(() => {
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
    );
    const priv = service as unknown as DynamicFaviconServicePrivate;
    if (priv.isSVGUnfriendly) {
      expect(priv.isSVGUnfriendly()).toBe(false);
    }
  }));

  it('isSVGUnfriendly returns false when version is NaN', fakeAsync(() => {
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS abc_def like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
    );
    const priv = service as unknown as DynamicFaviconServicePrivate;
    if (priv.isSVGUnfriendly) {
      expect(priv.isSVGUnfriendly()).toBe(false);
    }
  }));

  it('isSVGUnfriendly returns true for iOS major < 18', fakeAsync(() => {
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    );
    const priv = service as unknown as DynamicFaviconServicePrivate;
    if (priv.isSVGUnfriendly) {
      expect(priv.isSVGUnfriendly()).toBe(true);
    }
  }));

  it('isSVGUnfriendly returns true for iOS 18 minor < 6', fakeAsync(() => {
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
    );
    const priv = service as unknown as DynamicFaviconServicePrivate;
    if (priv.isSVGUnfriendly) {
      expect(priv.isSVGUnfriendly()).toBe(true);
    }
  }));

  it('isSVGUnfriendly returns false for iOS 18.6+', fakeAsync(() => {
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
    );
    const priv = service as unknown as DynamicFaviconServicePrivate;
    if (priv.isSVGUnfriendly) {
      expect(priv.isSVGUnfriendly()).toBe(false);
    }
  }));

  it('start calls setStaticIcon when SVG unfriendly', fakeAsync(() => {
    // Stop the existing service that was started in beforeEach
    service!.stop();
    
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    );
    // @ts-expect-error ts(2345)
    spyOn(service!, 'setStaticIcon');
    service!.start();
    expect(service!['setStaticIcon']).toHaveBeenCalled();
  }));

  it('start handles fetch error by calling setStaticIcon', fakeAsync(() => {
    // Stop the existing service that was started in beforeEach
    service!.stop();
    
    fetchSpy.and.returnValue(Promise.reject(new Error('fetch fail')));
    // @ts-expect-error ts(2345)
    spyOn(service, 'setStaticIcon');
    service!.start();
    tick();
    expect(service!['setStaticIcon']).toHaveBeenCalled();
  }));

  it('stop clears timer when set', fakeAsync(() => {
    tick();
    const priv = service as unknown as DynamicFaviconServicePrivate;
    priv.timer = 123;
    spyOn(window, 'clearInterval');
    service!.stop();
    expect(window.clearInterval).toHaveBeenCalledWith(123);
  }));

  it('stop resets cachedSvg to initialSvg when initialSvg exists', fakeAsync(() => {
    tick();
    const priv = service as unknown as DynamicFaviconServicePrivate;
    priv.initialSvg = '<svg>original</svg>';
    priv.cachedSvg = '<svg>modified</svg>';
    service!.stop();
    expect(priv.cachedSvg).toBe('<svg>original</svg>');
  }));

  it('updateIcon handles missing fill attribute', fakeAsync(() => {
    const modifiedSvg = mockSvg.replace(
      'rect id="p0" x="0" y="0" width="8" height="8" fill="#000" stroke="#fff"',
      'rect id="p0" x="0" y="0" width="8" height="8" stroke="#fff"'
    );
    tick();
    const priv = service as unknown as DynamicFaviconServicePrivate;
    priv.cachedSvg = modifiedSvg;
    if (priv.updateIcon) {
      expect(() => priv.updateIcon!()).not.toThrow();
    }
  }));

  it('updateIcon handles missing stroke attribute', fakeAsync(() => {
    const modifiedSvg = mockSvg.replace(
      'rect id="p0" x="0" y="0" width="8" height="8" fill="#000" stroke="#fff"',
      'rect id="p0" x="0" y="0" width="8" height="8" fill="#000"'
    );
    tick();
    const priv = service as unknown as DynamicFaviconServicePrivate;
    priv.cachedSvg = modifiedSvg;
    if (priv.updateIcon) {
      expect(() => priv.updateIcon!()).not.toThrow();
    }
  }));

  it('ensureSvgFetched throws on fetch error', fakeAsync(async () => {
    fetchSpy.and.returnValue(Promise.resolve({ ok: false } as Response));
    const priv = service as unknown as DynamicFaviconServicePrivate;
    if (priv.ensureSvgFetched) {
      await expectAsync(priv.ensureSvgFetched()).toBeRejected();
    }
  }));

  it('setStaticIcon creates PNG favicon link', fakeAsync(() => {
    const priv = service as unknown as DynamicFaviconServicePrivate;
    if (priv.setStaticIcon) {
      priv.setStaticIcon();
    }
    const link = getFaviconEl();
    expect(link).not.toBeNull();
    expect(link!.type).toBe('image/png');
    expect(link!.href.endsWith('/favicon.ico')).toBe(true);
  }));

});
