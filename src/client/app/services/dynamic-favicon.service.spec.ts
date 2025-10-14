import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import DynamicFaviconService from './dynamic-favicon.service';


describe('DynamicFaviconService', () => {
  let service: DynamicFaviconService | null;
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

  const removeAllFavicons = (): void => {
    document.querySelectorAll('link[rel~="icon"]').forEach(el => el.remove());
  };

  beforeEach(() => {
    // Clean any existing favicon state before each test
    removeAllFavicons();
    spyOn(console, 'warn').and.stub();
    spyOn(console, 'log').and.stub();
    
    // Mock fetch to return our test SVG
    fetchSpy = spyOn(window, 'fetch').and.returnValue(
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(mockSvg),
      } as Response)
    );
    
    service = null;
  });

  afterEach(() => {
    // Ensure timers/listeners from a test don't leak into the next one
    try {
      jasmine.clock().uninstall();
    } catch {}
    
    if (service) {
      service.stop();
      service = null;
    }
    removeAllFavicons();
  });


  it('injects static PNG favicon on SVG-unfriendly browsers (iOS Safari < 18.6)', () => {
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
    );
    const setIntervalSpy = spyOn(window, 'setInterval');
    const addListenerSpy = spyOn(document, 'addEventListener');

    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicFaviconService);

    const link = getFaviconEl();
    expect(link).not.toBeNull();
    expect(link!.rel).toContain('icon');
    expect(link!.type).toBe('image/png');
    expect(link!.href).toContain('/favicon.ico');

    expect(setIntervalSpy).not.toHaveBeenCalled();
    expect(addListenerSpy).not.toHaveBeenCalledWith('visibilitychange', jasmine.any(Function));
    expect(fetchSpy).not.toHaveBeenCalled();
  });


  it('fetches and animates SVG on SVG-friendly browsers', fakeAsync(() => {
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
    );

    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicFaviconService);

    // Resolve microtasks (fetch .then) and initial update
    tick();
    expect(fetchSpy).toHaveBeenCalledWith('/icon.svg');

    const link = getFaviconEl();
    expect(link).not.toBeNull();
    expect(link!.type).toBe('image/svg+xml');
    expect(link!.href).toContain('data:image/svg+xml;base64,');

    const initialHref = link!.href;

    // Advance time for first interval
    tick(400);
    const hrefAfterFrame = getFaviconEl()!.href;
    expect(hrefAfterFrame).toContain('data:image/svg+xml;base64,');
    expect(hrefAfterFrame).not.toBe(initialHref);
  }));


  it('registers visibility listener and updates icon on visibilitychange', fakeAsync(() => {
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue('Chrome/128.0');
    const addListenerSpy = spyOn(document, 'addEventListener').and.callThrough();

    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicFaviconService);

    // Resolve microtasks (fetch .then) and initial update
    tick();
    expect(addListenerSpy).toHaveBeenCalledWith('visibilitychange', jasmine.any(Function));

    const link = getFaviconEl();
    expect(link).not.toBeNull();

    spyOnProperty(document, 'hidden', 'get').and.returnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(link).not.toBeNull();
    expect(link!.href).toContain('data:image/svg+xml;base64,');
  }));

  it('stop() clears interval, removes listener, and resets to initial SVG', fakeAsync(() => {
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue('Chrome/128.0');
    const removeListenerSpy = spyOn(document, 'removeEventListener').and.callThrough();

    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicFaviconService);

    // Resolve microtasks (fetch .then) and initial update
    tick();
    const link = getFaviconEl();
    expect(link).not.toBeNull();

    const hrefAfterStart = link!.href;

    // Advance a few frames
    tick(800);
    const hrefAfterMutation = getFaviconEl()!.href;
    expect(hrefAfterMutation).not.toBe(hrefAfterStart);

    service!.stop();
    expect(removeListenerSpy).toHaveBeenCalledWith('visibilitychange', jasmine.any(Function));

    const hrefAfterStop = getFaviconEl()!.href;
    expect(hrefAfterStop).toContain('data:image/svg+xml;base64,');

    service!.start();
    tick();
    const linkAfterRestart = getFaviconEl();
    expect(linkAfterRestart).not.toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(linkAfterRestart!.href).toBe(hrefAfterStart);
  }));


  it('falls back to static icon if fetch fails', fakeAsync(() => {
    fetchSpy.and.returnValue(
      Promise.resolve({
        ok: false,
        status: 404,
      } as Response)
    );
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue('Chrome/128.0');

    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicFaviconService);

    tick();
    expect(fetchSpy).toHaveBeenCalledWith('/icon.svg');
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to fetch icon.svg, falling back to static icon.',
      jasmine.any(Error)
    );

    const link = getFaviconEl();
    expect(link).not.toBeNull();
    expect(link!.type).toBe('image/png');
    expect(link!.href).toContain('/favicon.ico');
  }));
});
