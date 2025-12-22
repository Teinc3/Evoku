import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PUPOrbState } from '../../../../types/enums';
import PupSpinnerComponent from './pup-spinner';


describe('PupSpinnerComponent', () => {
  let fixture: ComponentFixture<PupSpinnerComponent>;
  let component: PupSpinnerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PupSpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PupSpinnerComponent);
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

  it('should cycle through states on click when not disabled', () => {
    const hostDe = fixture.debugElement;

    component.disabled = false;
    component.state = PUPOrbState.IDLE;
    fixture.detectChanges();

    hostDe.triggerEventHandler('click', {});
    expect(component.state as PUPOrbState).toBe(PUPOrbState.READY);

    hostDe.triggerEventHandler('click', {});
    expect(component.state as PUPOrbState).toBe(PUPOrbState.SPINNING);

    hostDe.triggerEventHandler('click', {});
    expect(component.state as PUPOrbState).toBe(PUPOrbState.SETTLING);
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
});
