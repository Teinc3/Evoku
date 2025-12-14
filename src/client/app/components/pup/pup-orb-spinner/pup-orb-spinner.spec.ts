import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PUPOrbState } from '../../../../types/enums';
import PupOrbSpinnerComponent from './pup-orb-spinner';


describe('PupOrbSpinnerComponent', () => {
  let fixture: ComponentFixture<PupOrbSpinnerComponent>;
  let component: PupOrbSpinnerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PupOrbSpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PupOrbSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have role="button" and tabindex=0 for accessibility', () => {
    const hostEl: HTMLElement = fixture.nativeElement;
    expect(hostEl.getAttribute('role')).toBe('button');
    expect(hostEl.getAttribute('tabindex')).toBe('0');
  });

  it('should reflect state classes and aria-busy correctly', () => {
    const hostEl: HTMLElement = fixture.nativeElement;

    // IDLE initial
    component.state = PUPOrbState.IDLE;
    fixture.detectChanges();
    expect(hostEl.classList.contains('ready')).toBeFalse();
    expect(hostEl.classList.contains('spinning')).toBeFalse();
    expect(hostEl.classList.contains('equipped')).toBeFalse();
    expect(hostEl.getAttribute('aria-busy')).toBe('false');

    // READY
    component.state = PUPOrbState.READY;
    fixture.detectChanges();
    expect(hostEl.classList.contains('ready')).toBeTrue();
    expect(hostEl.classList.contains('spinning')).toBeFalse();
    expect(hostEl.getAttribute('aria-busy')).toBe('false');

    // SPINNING
    component.state = PUPOrbState.SPINNING;
    fixture.detectChanges();
    expect(hostEl.classList.contains('ready')).toBeFalse();
    expect(hostEl.classList.contains('spinning')).toBeTrue();
    expect(hostEl.classList.contains('equipped')).toBeFalse();
    expect(hostEl.getAttribute('aria-busy')).toBe('true');

    component.state = PUPOrbState.EQUIPPED;
    fixture.detectChanges();
    expect(hostEl.classList.contains('equipped')).toBeTrue();
  });

  it('should emit roll when transitioning from READY to SPINNING via click', () => {
    const hostDe = fixture.debugElement;
    const rollSpy = jasmine.createSpy('roll');
    component.roll.subscribe(rollSpy);

    component.state = PUPOrbState.READY;
    fixture.detectChanges();

    hostDe.triggerEventHandler('click', {});
    fixture.detectChanges();

    // Widen enum type for Jasmine matcher generics
    expect(component.state as PUPOrbState).toBe(PUPOrbState.SPINNING);
    expect(rollSpy).toHaveBeenCalled();
  });

  it('should not change state or emit when disabled', () => {
    const hostDe = fixture.debugElement;
    const rollSpy = jasmine.createSpy('roll');
    component.roll.subscribe(rollSpy);

    component.disabled = true;
    component.state = PUPOrbState.READY;
    fixture.detectChanges();

    hostDe.triggerEventHandler('click', {});

    expect(component.state).toBe(PUPOrbState.READY);
    expect(rollSpy).not.toHaveBeenCalled();
  });

  it('should ignore clicks when not ready', () => {
    const hostDe = fixture.debugElement;
    const rollSpy = jasmine.createSpy('roll');
    component.roll.subscribe(rollSpy);

    component.state = PUPOrbState.IDLE;
    fixture.detectChanges();

    hostDe.triggerEventHandler('click', {});
    expect(component.state).toBe(PUPOrbState.IDLE);
    expect(rollSpy).not.toHaveBeenCalled();
  });
});
