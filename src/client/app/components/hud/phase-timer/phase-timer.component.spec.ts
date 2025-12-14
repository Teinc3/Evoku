import { ComponentFixture, TestBed } from '@angular/core/testing';

import PhaseTimerComponent from './phase-timer.component';


describe('PhaseTimerComponent', () => {
  let fixture: ComponentFixture<PhaseTimerComponent>;
  let component: PhaseTimerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhaseTimerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PhaseTimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute timeText as mm:ss for given startTime', () => {
    const now = 200000;
    spyOn(performance, 'now').and.returnValue(now);

    // Elapsed = 200000 - 80000 = 120000 (2 mins)
    component.startTime = 80000;
    fixture.detectChanges();
    expect(component['timeText']()).toBe('02:00');

    // Elapsed = 200000 - 138500 = 61500 (1:01)
    component.startTime = 138500;
    fixture.detectChanges();
    expect(component['timeText']()).toBe('01:01');
  });

  it('should clamp percentage to [0, 100] and compute dashOffset correctly', () => {
    component.percentage = 50;
    fixture.detectChanges();
    expect(component['dashOffset']()).toBe(50);

    component.percentage = -10;
    fixture.detectChanges();
    expect(component['dashOffset']()).toBe(100);

    component.percentage = 150;
    fixture.detectChanges();
    expect(component['dashOffset']()).toBe(0);
  });

  it('should compute marker transforms as strings', () => {
    // Sanity: ensure transform strings are non-empty
    expect(typeof component['markerLeftTransform']()).toBe('string');
    expect(component['markerLeftTransform']().length).toBeGreaterThan(0);
    expect(typeof component['markerRightTransform']()).toBe('string');
    expect(component['markerRightTransform']().length).toBeGreaterThan(0);
  });

  it('should render time text and arc attributes in the template', () => {
    const now = 200000;
    spyOn(performance, 'now').and.returnValue(now);

    // Elapsed = 90000 (1:30) -> startTime = 200000 - 90000 = 110000
    component.startTime = 110000;
    component.percentage = 25;
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    const timeEl = compiled.querySelector('.time');
    expect(timeEl).toBeTruthy();
    expect(timeEl?.textContent?.trim()).toBe('01:30');

    const arc = compiled.querySelector('.arc-progress');
    expect(arc).toBeTruthy();
    const attr = arc?.getAttribute('stroke-dashoffset');
    // attribute is bound to dashOffset(); ensure it matches
    expect(Number(attr)).toBe(component['dashOffset']());
  });

  it('should clamp non-finite inputs to fallbacks (increase branch coverage)', () => {
    // startTime null -> fallback 0 => 00:00
    component.startTime = null;
    fixture.detectChanges();
    expect(component['timeText']()).toBe('00:00');

    // percentage non-finite -> fallback 0 => dashOffset 100
    component.percentage = NaN as unknown as number;
    fixture.detectChanges();
    expect(component['dashOffset']()).toBe(100);

    // percentage Infinity should be clamped to [0,100] via Number.isFinite -> fallback
    component.percentage = Infinity as unknown as number;
    fixture.detectChanges();
    expect(component['dashOffset']()).toBe(100);
  });
});
