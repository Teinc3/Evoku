import {
  ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick,
} from '@angular/core/testing';
import { ElementRef } from '@angular/core';

import PUPElements from '@shared/types/enums/elements';
import { PUPOrbState } from '../../../../types/enums';
import PupSpinnerComponent from './pup-spinner';


type FetchResponseLike = {
  ok: boolean;
  text: () => Promise<string>;
};

function makeFetchOkResponse(svg: string): FetchResponseLike {
  return {
    ok: true,
    text: async () => svg,
  };
}

function makeFetchNotOkResponse(): FetchResponseLike {
  return {
    ok: false,
    text: async () => '',
  };
}

const MINIMAL_SVG_WITH_SIZE = [
  '<svg width="467" height="467">',
  '<g id="p0" fill="a" stroke="b"></g>',
  '<g id="p4" fill="c" stroke="d"></g>',
  '</svg>',
].join('');

const MINIMAL_SVG_WITH_VIEWBOX = [
  '<svg viewBox="0 0 467 467" width="467" height="467">',
  '<g id="p0" fill="a" stroke="b"></g>',
  '<g id="p4" fill="c" stroke="d"></g>',
  '<!-- keep width/height so initSvg removes them -->',
  '</svg>',
].join('');
const SVG_WITHOUT_SVG_TAG = '<div>No svg here</div>';


describe('PupSpinnerComponent', () => {
  let fixture: ComponentFixture<PupSpinnerComponent>;
  let component: PupSpinnerComponent;

  let fetchSpy: jasmine.Spy;

  beforeEach(() => {
    fetchSpy = spyOn(window, 'fetch').and.resolveTo(
      makeFetchOkResponse(MINIMAL_SVG_WITH_SIZE) as unknown as Response,
    );
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PupSpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PupSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have role="button" and tabindex=0 for accessibility', () => {
    const hostEl: HTMLElement = fixture.nativeElement;
    expect(hostEl.getAttribute('role')).toBe('button');
    expect(hostEl.getAttribute('tabindex')).toBe('0');
  });

  it('should expose aria-busy=true while spinning/settling', () => {
    component['state'] = PUPOrbState.SPINNING;
    fixture.detectChanges();
    expect(component.ariaBusy).toBe('true');

    component['state'] = PUPOrbState.SETTLING;
    fixture.detectChanges();
    expect(component.ariaBusy).toBe('true');

    component['state'] = PUPOrbState.IDLE;
    fixture.detectChanges();
    expect(component.ariaBusy).toBe('false');
  });

  it('should reflect settling type via data-type host attribute', () => {
    const hostEl: HTMLElement = fixture.nativeElement;

    component['settlingType'] = PUPElements.WOOD;
    fixture.detectChanges();
    expect(hostEl.getAttribute('data-type')).toBe('wood');

    component['settlingType'] = null;
    fixture.detectChanges();
    expect(hostEl.hasAttribute('data-type')).toBeFalse();
  });

  it('should emit roll when transitioning from READY to SPINNING via click', () => {
    const hostDe = fixture.debugElement;
    const rollSpy = jasmine.createSpy('roll');
    component.roll.subscribe(rollSpy);

    component['state'] = PUPOrbState.READY;
    fixture.detectChanges();

    hostDe.triggerEventHandler('click', {});
    fixture.detectChanges();

    // Widen enum type for Jasmine matcher generics
    expect(component['state'] as PUPOrbState).toBe(PUPOrbState.SPINNING);
    expect(rollSpy).toHaveBeenCalled();
  });

  it('should ignore clicks when not in READY state', () => {
    const hostDe = fixture.debugElement;
    const rollSpy = jasmine.createSpy('roll');
    component.roll.subscribe(rollSpy);

    component.disabled = false;

    component['state'] = PUPOrbState.IDLE;
    fixture.detectChanges();
    hostDe.triggerEventHandler('click', {});
    expect(component['state'] as PUPOrbState).toBe(PUPOrbState.IDLE);

    component['state'] = PUPOrbState.SPINNING;
    fixture.detectChanges();
    hostDe.triggerEventHandler('click', {});
    expect(component['state'] as PUPOrbState).toBe(PUPOrbState.SPINNING);

    component['state'] = PUPOrbState.SETTLING;
    fixture.detectChanges();
    hostDe.triggerEventHandler('click', {});
    expect(component['state'] as PUPOrbState).toBe(PUPOrbState.SETTLING);

    expect(rollSpy).not.toHaveBeenCalled();
  });

  it('should not change state or emit when disabled', () => {
    const hostDe = fixture.debugElement;
    const rollSpy = jasmine.createSpy('roll');
    component.roll.subscribe(rollSpy);

    component.disabled = true;
    component['state'] = PUPOrbState.READY;
    fixture.detectChanges();

    hostDe.triggerEventHandler('click', {});

    expect(component['state']).toBe(PUPOrbState.READY);
    expect(rollSpy).not.toHaveBeenCalled();
  });

  it('should shake and not spin when canSpin is false', fakeAsync(() => {
    const hostDe = fixture.debugElement;
    const hostEl: HTMLElement = fixture.nativeElement;
    const rollSpy = jasmine.createSpy('roll');
    component.roll.subscribe(rollSpy);

    component.disabled = false;
    component.canSpin = false;
    component['state'] = PUPOrbState.READY;
    fixture.detectChanges();

    hostDe.triggerEventHandler('click', {});
    fixture.detectChanges();

    expect(component['state'] as PUPOrbState).toBe(PUPOrbState.READY);
    expect(rollSpy).not.toHaveBeenCalled();
    expect(hostEl.classList.contains('shake')).toBeTrue();

    tick(350);
    fixture.detectChanges();
    expect(hostEl.classList.contains('shake')).toBeFalse();
  }));

  it('should update idle contrast when pupProgress changes (not spinning/settling)', () => {
    component['state'] = PUPOrbState.IDLE;

    component.pupProgress = 25;
    fixture.detectChanges();

    const value = component.iconContainer.nativeElement.style
      .getPropertyValue('--yy-contrast');
    expect(Number.parseFloat(value)).toBeCloseTo(0.3 + (0.7 * 0.25), 6);
  });

  it('should not update idle contrast while SPINNING or SETTLING', () => {
    component['state'] = PUPOrbState.IDLE;
    component.pupProgress = 10;
    fixture.detectChanges();

    const before = component.iconContainer.nativeElement.style
      .getPropertyValue('--yy-contrast');

    component['state'] = PUPOrbState.SPINNING;
    component.pupProgress = 50;
    fixture.detectChanges();
    const afterSpinning = component.iconContainer.nativeElement.style
      .getPropertyValue('--yy-contrast');
    expect(afterSpinning).toBe(before);

    component['state'] = PUPOrbState.SETTLING;
    component.pupProgress = 80;
    fixture.detectChanges();
    const afterSettling = component.iconContainer.nativeElement.style
      .getPropertyValue('--yy-contrast');
    expect(afterSettling).toBe(before);
  });

  it('should auto-transition IDLE->READY when pupProgress reaches 100', () => {
    component['state'] = PUPOrbState.IDLE;
    component.pupProgress = 100;
    expect(component['state'] as PUPOrbState).toBe(PUPOrbState.READY);
  });

  it('pickFlipInterval should return correct interval for each state and progress', () => {
    const pick = (component as unknown as { pickFlipInterval: () => number })
      .pickFlipInterval
      .bind(component);

    component['state'] = PUPOrbState.SPINNING;
    expect(pick()).toBe(250);

    component['state'] = PUPOrbState.SETTLING;
    expect(pick()).toBe(750);

    component['state'] = PUPOrbState.READY;
    expect(pick()).toBe(500);

    component['state'] = PUPOrbState.IDLE;
    component.pupProgress = 100;
    expect(pick()).toBe(500);

    component['state'] = PUPOrbState.IDLE;
    component.pupProgress = 0;
    expect(pick()).toBe(1000);
  });

  it('pickFlipInterval should return READY interval for progress>=100 edge case', () => {
    const pick = (component as unknown as { pickFlipInterval: () => number })
      .pickFlipInterval
      .bind(component);

    // Setting pupProgress while SPINNING avoids the IDLE->READY auto-transition in the setter.
    component['state'] = PUPOrbState.SPINNING;
    component.pupProgress = 100;

    // Now force IDLE with progress still at 100 to hit the `pupProgress >= 100` branch.
    component['state'] = PUPOrbState.IDLE;

    expect(pick()).toBe(500);
  });

  it('beginSettling should clear timeout and return to IDLE', fakeAsync(() => {
    const clearSpy = spyOn(window, 'clearTimeout').and.callThrough();
    const contrastSpy = spyOn(
      component as unknown as { updateIdleContrast: () => void },
      'updateIdleContrast',
    );

    component.setSettlingType(PUPElements.FIRE);
    component['settlingTimeoutId'] = 999;
    component.beginSettling();

    expect(component['state'] as PUPOrbState).toBe(PUPOrbState.SETTLING);
    expect(clearSpy).toHaveBeenCalled();
    expect(component['settlingType']).toBe(PUPElements.FIRE);

    tick(2000);
    expect(component['state'] as PUPOrbState).toBe(PUPOrbState.IDLE);
    expect(component['settlingType']).toBeNull();
    expect(component['settlingTimeoutId']).toBeNull();
    expect(contrastSpy).toHaveBeenCalled();
  }));

  it('startAnimation should schedule flips based on pickFlipInterval', fakeAsync(() => {
    const flipSpy = spyOn(
      component as unknown as { flipIcon: () => void },
      'flipIcon',
    );
    const pickSpy = spyOn(
      component as unknown as { pickFlipInterval: () => number },
      'pickFlipInterval',
    ).and.returnValue(1);

    (component as unknown as { startAnimation: () => void }).startAnimation();
    expect(pickSpy).toHaveBeenCalled();

    tick(1);
    expect(flipSpy).toHaveBeenCalled();

    tick(1);
    expect(flipSpy.calls.count()).toBeGreaterThanOrEqual(2);
  }));

  it('loadSvg should call initSvg and startAnimation on success', fakeAsync(() => {
    const initSpy = spyOn(
      component as unknown as { initSvg: () => void },
      'initSvg',
    );
    const startSpy = spyOn(
      component as unknown as { startAnimation: () => void },
      'startAnimation',
    );

    fetchSpy.and.resolveTo(
      makeFetchOkResponse(MINIMAL_SVG_WITH_SIZE) as unknown as Response,
    );

    (component as unknown as { loadSvg: () => Promise<void> }).loadSvg();
    flushMicrotasks();

    expect(initSpy).toHaveBeenCalled();
    expect(startSpy).toHaveBeenCalled();
  }));

  it('loadSvg should handle non-ok response and log an error', fakeAsync(() => {
    fetchSpy.and.resolveTo(makeFetchNotOkResponse() as unknown as Response);
    const consoleSpy = spyOn(console, 'error');

    (component as unknown as { loadSvg: () => Promise<void> }).loadSvg();
    flushMicrotasks();
    expect(consoleSpy).toHaveBeenCalled();
  }));

  it('initSvg should early return when cachedSvg or iconContainer is missing', () => {
    component['cachedSvg'] = null;
    (component as unknown as { initSvg: () => void }).initSvg();

    component['cachedSvg'] = MINIMAL_SVG_WITH_SIZE;
    const nullIconContainer = null as unknown as ElementRef<HTMLDivElement>;
    component['iconContainer'] = nullIconContainer;
    (component as unknown as { initSvg: () => void }).initSvg();
  });

  it('initSvg should set viewBox when missing and remove width/height', () => {
    const contrastSpy = spyOn(
      component as unknown as { updateIdleContrast: () => void },
      'updateIdleContrast',
    );

    component['cachedSvg'] = MINIMAL_SVG_WITH_SIZE;
    (component as unknown as { initSvg: () => void }).initSvg();
    const svg = component.iconContainer.nativeElement.querySelector('svg');

    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 467 467');
    expect(svg?.getAttribute('width')).toBeNull();
    expect(svg?.getAttribute('height')).toBeNull();
    expect(contrastSpy).toHaveBeenCalled();
  });

  it('initSvg should not overwrite viewBox when it already exists', () => {
    component['cachedSvg'] = MINIMAL_SVG_WITH_VIEWBOX;
    (component as unknown as { initSvg: () => void }).initSvg();
    const svg = component.iconContainer.nativeElement.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 467 467');
  });

  it('initSvg should be safe when cachedSvg has no <svg>', () => {
    component['svgElement'] = null;
    component['cachedSvg'] = SVG_WITHOUT_SVG_TAG;
    (component as unknown as { initSvg: () => void }).initSvg();
    expect(component['svgElement']).toBeNull();
  });

  it('updateIdleContrast should early return if iconContainer is missing', () => {
    const nullIconContainer = null as unknown as ElementRef<HTMLDivElement>;
    component['iconContainer'] = nullIconContainer;
    (component as unknown as { updateIdleContrast: () => void }).updateIdleContrast();
  });

  it('flipIcon should early return if svgElement is missing', () => {
    component['svgElement'] = null;
    (component as unknown as { flipIcon: () => void }).flipIcon();
  });

  it('flipIcon should handle missing element ids and still advance the frame index', () => {
    component['cachedSvg'] = [
      '<svg viewBox="0 0 1 1">',
      '<g id="p0" fill="a" stroke="b"></g>',
      '</svg>',
    ].join('');
    (component as unknown as { initSvg: () => void }).initSvg();

    component['frameIndex'] = 3;
    (component as unknown as { flipIcon: () => void }).flipIcon();
    expect(component['frameIndex']).toBe(0);
  });

  it('flipIcon should toggle fill for the active frame ids', () => {
    component['cachedSvg'] = MINIMAL_SVG_WITH_VIEWBOX;
    (component as unknown as { initSvg: () => void }).initSvg();
    component['frameIndex'] = 0;

    const svg = component.iconContainer.nativeElement.querySelector('svg');
    const p0 = svg?.querySelector('[id="p0"]') as SVGElement | null;
    const p4 = svg?.querySelector('[id="p4"]') as SVGElement | null;
    expect(p0).toBeTruthy();
    expect(p4).toBeTruthy();
    expect(p0?.getAttribute('fill')).toBe('a');
    expect(p0?.getAttribute('stroke')).toBeNull();

    (component as unknown as { flipIcon: () => void }).flipIcon();
    expect(component['frameIndex']).toBe(1);
    expect(p0?.getAttribute('fill')).toBe('#fff');
    expect(p0?.getAttribute('stroke')).toBeNull();
    expect(p4?.getAttribute('fill')).toBe('#fff');
    expect(p4?.getAttribute('stroke')).toBeNull();
  });

  it('ngOnDestroy should clear any scheduled timeouts', () => {
    const clearSpy = spyOn(window, 'clearTimeout').and.callThrough();
    component['animationTimeoutId'] = 1;
    component['settlingTimeoutId'] = 2;
    component.ngOnDestroy();
    expect(clearSpy).toHaveBeenCalled();
    expect(component['animationTimeoutId']).toBeNull();
    expect(component['settlingTimeoutId']).toBeNull();
  });
});
