import { ComponentFixture, TestBed } from '@angular/core/testing';

import PupStateService from '../../../services/pup-state';
import PupOrbSpinnerComponent from './pup-orb-spinner';


describe('PupOrbSpinnerComponent', () => {
  let fixture: ComponentFixture<PupOrbSpinnerComponent>;
  let component: PupOrbSpinnerComponent;
  let pupStateService: PupStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PupOrbSpinnerComponent],
      providers: [PupStateService]
    }).compileComponents();

    fixture = TestBed.createComponent(PupOrbSpinnerComponent);
    component = fixture.componentInstance;
    pupStateService = TestBed.inject(PupStateService);
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

  describe('state classes and aria-busy', () => {
    it('should have idle class when state is IDLE', () => {
      const hostEl: HTMLElement = fixture.nativeElement;
      pupStateService.setIdle();
      fixture.detectChanges();
      expect(hostEl.classList.contains('idle')).toBeTrue();
      expect(hostEl.classList.contains('ready')).toBeFalse();
      expect(hostEl.classList.contains('spinning')).toBeFalse();
      expect(hostEl.getAttribute('aria-busy')).toBe('false');
    });

    it('should have ready class when state is READY', () => {
      const hostEl: HTMLElement = fixture.nativeElement;
      pupStateService.setReady();
      fixture.detectChanges();
      expect(hostEl.classList.contains('idle')).toBeFalse();
      expect(hostEl.classList.contains('ready')).toBeTrue();
      expect(hostEl.classList.contains('spinning')).toBeFalse();
      expect(hostEl.getAttribute('aria-busy')).toBe('false');
    });

    it('should have spinning class when state is SPINNING', () => {
      const hostEl: HTMLElement = fixture.nativeElement;
      pupStateService.setReady();
      pupStateService.startRoll(1);
      fixture.detectChanges();
      expect(hostEl.classList.contains('idle')).toBeFalse();
      expect(hostEl.classList.contains('ready')).toBeFalse();
      expect(hostEl.classList.contains('spinning')).toBeTrue();
      expect(hostEl.getAttribute('aria-busy')).toBe('true');
    });
  });

  describe('click behavior', () => {
    it('should emit roll when clicked in READY state', () => {
      const hostDe = fixture.debugElement;
      const rollSpy = jasmine.createSpy('roll');
      component.roll.subscribe(rollSpy);

      pupStateService.setReady();
      fixture.detectChanges();

      hostDe.triggerEventHandler('click', {});
      fixture.detectChanges();

      expect(rollSpy).toHaveBeenCalled();
    });

    it('should not emit roll when clicked in IDLE state', () => {
      const hostDe = fixture.debugElement;
      const rollSpy = jasmine.createSpy('roll');
      component.roll.subscribe(rollSpy);

      pupStateService.setIdle();
      fixture.detectChanges();

      hostDe.triggerEventHandler('click', {});
      fixture.detectChanges();

      expect(rollSpy).not.toHaveBeenCalled();
    });

    it('should not emit roll when clicked in SPINNING state', () => {
      const hostDe = fixture.debugElement;
      const rollSpy = jasmine.createSpy('roll');
      component.roll.subscribe(rollSpy);

      pupStateService.setReady();
      pupStateService.startRoll(1);
      fixture.detectChanges();

      hostDe.triggerEventHandler('click', {});
      fixture.detectChanges();

      expect(rollSpy).not.toHaveBeenCalled();
    });

    it('should not emit roll when disabled', () => {
      const hostDe = fixture.debugElement;
      const rollSpy = jasmine.createSpy('roll');
      component.roll.subscribe(rollSpy);

      component.disabled = true;
      pupStateService.setReady();
      fixture.detectChanges();

      hostDe.triggerEventHandler('click', {});

      expect(rollSpy).not.toHaveBeenCalled();
    });

    it('should not emit roll when all slots are occupied', () => {
      const hostDe = fixture.debugElement;
      const rollSpy = jasmine.createSpy('roll');
      component.roll.subscribe(rollSpy);

      // Fill all slots
      pupStateService.setReady();
      pupStateService.startRoll(1);
      pupStateService.onPupDrawn(1, 0);
      pupStateService.setReady();
      pupStateService.startRoll(2);
      pupStateService.onPupDrawn(2, 1);
      pupStateService.setReady();
      pupStateService.startRoll(3);
      pupStateService.onPupDrawn(3, 2);
      
      pupStateService.setReady();
      fixture.detectChanges();

      hostDe.triggerEventHandler('click', {});

      expect(rollSpy).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('should have disabled class when disabled input is true', () => {
      const hostEl: HTMLElement = fixture.nativeElement;
      component.disabled = true;
      fixture.detectChanges();
      expect(hostEl.classList.contains('disabled')).toBeTrue();
    });

    it('should have disabled class when all slots occupied', () => {
      const hostEl: HTMLElement = fixture.nativeElement;
      
      // Fill all slots
      pupStateService.setReady();
      pupStateService.startRoll(1);
      pupStateService.onPupDrawn(1, 0);
      pupStateService.setReady();
      pupStateService.startRoll(2);
      pupStateService.onPupDrawn(2, 1);
      pupStateService.setReady();
      pupStateService.startRoll(3);
      pupStateService.onPupDrawn(3, 2);

      fixture.detectChanges();
      expect(hostEl.classList.contains('disabled')).toBeTrue();
    });
  });
});
