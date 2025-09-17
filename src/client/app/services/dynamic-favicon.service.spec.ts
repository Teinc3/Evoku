import { TestBed } from '@angular/core/testing';

import DynamicFaviconService from './dynamic-favicon.service';


describe('DynamicFaviconService', () => {
  let service: DynamicFaviconService | null;
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

  it('injects animated GIF on GIF-friendly browsers (no timers, no listeners)', () => {
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue('Firefox/123.0');
    const setIntervalSpy = spyOn(window, 'setInterval');
    const addListenerSpy = spyOn(document, 'addEventListener');

    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicFaviconService); // constructor auto-starts

    const link = getFaviconEl();
    expect(link).not.toBeNull();
    expect(link!.rel).toContain('icon');
    expect(link!.type).toBe('image/gif');
    expect(link!.href).toContain('/animated-icon.gif');

    expect(setIntervalSpy).not.toHaveBeenCalled();
    // No visibility listener added in the GIF path
    expect(addListenerSpy).not.toHaveBeenCalledWith('visibilitychange', jasmine.any(Function));
  });

  it('cycles PNG frames on non-GIF browsers and registers visibility listener', () => {
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue('Chrome/128.0');
    jasmine.clock().install();
    const addListenerSpy = spyOn(document, 'addEventListener').and.callThrough();

    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicFaviconService);

    let link = getFaviconEl();
    expect(link).not.toBeNull();
    expect(link!.type).toBe('image/png');
    expect(link!.href).toContain('/animation/Evoku-0.png');

    // Advance one frame (400ms)
    jasmine.clock().tick(400);
    link = getFaviconEl();
    expect(link!.href).toContain('/animation/Evoku-1.png');

    // Visibility listener should be registered
    expect(addListenerSpy).toHaveBeenCalledWith('visibilitychange', jasmine.any(Function));
  });

  it('re-applies current frame on visibilitychange when visible', () => {
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue('Chrome/128.0');
    jasmine.clock().install();
    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicFaviconService);

    const link = getFaviconEl();
    expect(link).not.toBeNull();
    // Current frame should be 0 initially
    expect(link!.href).toContain('/animation/Evoku-0.png');

    // Tamper the href and ensure the handler restores it
    link!.href = '/bogus.png';
    spyOnProperty(document, 'hidden', 'get').and.returnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(getFaviconEl()!.href).toContain('/animation/Evoku-0.png');
  });

  it('stop() clears the interval and removes the visibility listener', () => {
    spyOnProperty(navigator, 'userAgent', 'get').and.returnValue('Chrome/128.0');
    jasmine.clock().install();
    const removeListenerSpy = spyOn(document, 'removeEventListener').and.callThrough();

    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicFaviconService);

    const link = getFaviconEl();
    expect(link).not.toBeNull();
    const before = link!.href;

    service.stop();
    // After stopping, advancing time should not change the favicon
    jasmine.clock().tick(1200);
    expect(getFaviconEl()!.href).toBe(before);

    expect(removeListenerSpy).toHaveBeenCalledWith('visibilitychange', jasmine.any(Function));
  });
});
