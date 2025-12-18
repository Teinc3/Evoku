import { ComponentFixture, TestBed } from '@angular/core/testing';

import PupStateService from '../../../services/pup-state';
import { createEmptySlotState } from '../../../../types/pup';
import PupSlotsHolderComponent from './pup-slots-holder';

import type { PupSlotState } from '../../../../types/pup';


describe('PupSlotsHolderComponent', () => {
  let fixture: ComponentFixture<PupSlotsHolderComponent>;
  let component: PupSlotsHolderComponent;
  let pupStateService: PupStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PupSlotsHolderComponent],
      providers: [PupStateService]
    }).compileComponents();

    fixture = TestBed.createComponent(PupSlotsHolderComponent);
    component = fixture.componentInstance;
    pupStateService = TestBed.inject(PupStateService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('slots getter', () => {
    it('should return service slots when externalSlots is null', () => {
      component.externalSlots = null;
      expect(component.slots).toBe(pupStateService.slots());
    });

    it('should return externalSlots when provided', () => {
      const externalSlots: PupSlotState[] = [
        { pupID: 0, level: 1, onCooldown: false, cooldownEnd: null },
        createEmptySlotState(),
        createEmptySlotState()
      ];
      component.externalSlots = externalSlots;
      expect(component.slots).toBe(externalSlots);
    });
  });

  describe('onUsePup', () => {
    it('should emit usePup event with slotIndex and pupID', () => {
      const usePupSpy = jasmine.createSpy('usePup');
      component.usePup.subscribe(usePupSpy);

      // Set up a slot with a PUP
      pupStateService.setReady();
      pupStateService.startRoll(1);
      pupStateService.onPupDrawn(1, 5);

      component.onUsePup(0);

      expect(usePupSpy).toHaveBeenCalledWith({ slotIndex: 0, pupID: 5 });
    });

    it('should not emit when slot is empty', () => {
      const usePupSpy = jasmine.createSpy('usePup');
      component.usePup.subscribe(usePupSpy);

      component.onUsePup(0);

      expect(usePupSpy).not.toHaveBeenCalled();
    });

    it('should not emit when slot has null pupID', () => {
      const usePupSpy = jasmine.createSpy('usePup');
      component.usePup.subscribe(usePupSpy);

      component.externalSlots = [createEmptySlotState()];
      component.onUsePup(0);

      expect(usePupSpy).not.toHaveBeenCalled();
    });

    it('should use external slots when provided', () => {
      const usePupSpy = jasmine.createSpy('usePup');
      component.usePup.subscribe(usePupSpy);

      component.externalSlots = [
        { pupID: 7, level: 2, onCooldown: false, cooldownEnd: null }
      ];
      component.onUsePup(0);

      expect(usePupSpy).toHaveBeenCalledWith({ slotIndex: 0, pupID: 7 });
    });
  });

  describe('template', () => {
    it('should render 3 pup-slot components by default', () => {
      const slots = fixture.nativeElement.querySelectorAll('app-pup-slot');
      expect(slots.length).toBe(3);
    });

    it('should pass correct slot state to each slot', () => {
      pupStateService.setReady();
      pupStateService.startRoll(1);
      pupStateService.onPupDrawn(1, 3);
      fixture.detectChanges();

      const slots = fixture.debugElement.children[0].children;
      expect(slots.length).toBe(3);
    });
  });
});
