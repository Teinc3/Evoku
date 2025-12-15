import { TestBed } from '@angular/core/testing';

import { PUPOrbState } from '../../../types/enums';
import PupStateService from './pup-state.service';


describe('PupStateService', () => {
  let service: PupStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PupStateService]
    });
    service = TestBed.inject(PupStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should start with IDLE orb state', () => {
      expect(service.orbState()).toBe(PUPOrbState.IDLE);
    });

    it('should start with 3 empty slots', () => {
      const slots = service.slots();
      expect(slots.length).toBe(3);
      expect(slots.every(slot => slot.pupID === null)).toBeTrue();
    });

    it('should not have all slots occupied initially', () => {
      expect(service.allSlotsOccupied()).toBeFalse();
    });

    it('should not be able to roll initially (IDLE state)', () => {
      expect(service.canRoll()).toBeFalse();
    });
  });

  describe('setReady', () => {
    it('should transition from IDLE to READY', () => {
      service.setReady();
      expect(service.orbState()).toBe(PUPOrbState.READY);
    });

    it('should not transition if already READY', () => {
      service.setReady();
      service.setReady();
      expect(service.orbState()).toBe(PUPOrbState.READY);
    });

    it('should not transition if all slots are occupied', () => {
      // Fill all slots
      service.setReady();
      service.startRoll(1);
      service.onPupDrawn(1, 0);
      service.setReady();
      service.startRoll(2);
      service.onPupDrawn(2, 1);
      service.setReady();
      service.startRoll(3);
      service.onPupDrawn(3, 2);

      service.setIdle();
      service.setReady();
      expect(service.orbState()).toBe(PUPOrbState.IDLE);
    });

    it('should not transition from SPINNING', () => {
      service.setReady();
      service.startRoll(1);
      service.setReady();
      expect(service.orbState()).toBe(PUPOrbState.SPINNING);
    });
  });

  describe('setIdle', () => {
    it('should transition to IDLE from any state', () => {
      service.setReady();
      service.setIdle();
      expect(service.orbState()).toBe(PUPOrbState.IDLE);
    });

    it('should clear pending draw action ID', () => {
      service.setReady();
      service.startRoll(1);
      service.setIdle();
      // Now onPupDrawn should not work
      service.onPupDrawn(1, 0);
      expect(service.slots().every(s => s.pupID === null)).toBeTrue();
    });
  });

  describe('startRoll', () => {
    it('should return actionID when can roll', () => {
      service.setReady();
      const result = service.startRoll(42);
      expect(result).toBe(42);
    });

    it('should transition to SPINNING when starting roll', () => {
      service.setReady();
      service.startRoll(1);
      expect(service.orbState()).toBe(PUPOrbState.SPINNING);
    });

    it('should return null when cannot roll (IDLE)', () => {
      const result = service.startRoll(1);
      expect(result).toBeNull();
    });

    it('should return null when cannot roll (SPINNING)', () => {
      service.setReady();
      service.startRoll(1);
      const result = service.startRoll(2);
      expect(result).toBeNull();
    });

    it('should return null when all slots occupied', () => {
      // Fill all slots
      service.setReady();
      service.startRoll(1);
      service.onPupDrawn(1, 0);
      service.setReady();
      service.startRoll(2);
      service.onPupDrawn(2, 1);
      service.setReady();
      service.startRoll(3);
      service.onPupDrawn(3, 2);

      // Try to roll again
      service.orbState.set(PUPOrbState.READY);
      const result = service.startRoll(4);
      expect(result).toBeNull();
    });
  });

  describe('onPupDrawn', () => {
    it('should add PUP to first empty slot', () => {
      service.setReady();
      service.startRoll(1);
      service.onPupDrawn(1, 5);

      const slots = service.slots();
      expect(slots[0].pupID).toBe(5);
      expect(slots[0].level).toBe(1);
      expect(slots[0].onCooldown).toBeFalse();
    });

    it('should add PUP to second slot when first is occupied', () => {
      service.setReady();
      service.startRoll(1);
      service.onPupDrawn(1, 0);

      service.setReady();
      service.startRoll(2);
      service.onPupDrawn(2, 1);

      const slots = service.slots();
      expect(slots[0].pupID).toBe(0);
      expect(slots[1].pupID).toBe(1);
      expect(slots[2].pupID).toBeNull();
    });

    it('should ignore if actionID does not match', () => {
      service.setReady();
      service.startRoll(1);
      service.onPupDrawn(999, 5);

      expect(service.slots().every(s => s.pupID === null)).toBeTrue();
    });

    it('should ignore if no pending action', () => {
      service.onPupDrawn(1, 5);
      expect(service.slots().every(s => s.pupID === null)).toBeTrue();
    });

    it('should transition to IDLE after drawing', () => {
      service.setReady();
      service.startRoll(1);
      service.onPupDrawn(1, 5);

      expect(service.orbState()).toBe(PUPOrbState.IDLE);
    });
  });

  describe('onDrawRejected', () => {
    it('should return to READY state when draw is rejected', () => {
      service.setReady();
      service.startRoll(1);
      service.onDrawRejected(1);

      expect(service.orbState()).toBe(PUPOrbState.READY);
    });

    it('should ignore if actionID does not match', () => {
      service.setReady();
      service.startRoll(1);
      service.onDrawRejected(999);

      expect(service.orbState()).toBe(PUPOrbState.SPINNING);
    });

    it('should ignore if no pending action', () => {
      service.setReady();
      service.onDrawRejected(1);
      expect(service.orbState()).toBe(PUPOrbState.READY);
    });
  });

  describe('usePup', () => {
    beforeEach(() => {
      // Set up a slot with a PUP
      service.setReady();
      service.startRoll(1);
      service.onPupDrawn(1, 5);
    });

    it('should return pupID when slot has usable PUP', () => {
      const result = service.usePup(0);
      expect(result).toBe(5);
    });

    it('should return null for empty slot', () => {
      const result = service.usePup(1);
      expect(result).toBeNull();
    });

    it('should return null for slot on cooldown', () => {
      service.startCooldown(0, 5000);
      const result = service.usePup(0);
      expect(result).toBeNull();
    });

    it('should return null for invalid slot index', () => {
      const result = service.usePup(10);
      expect(result).toBeNull();
    });

    it('should return null for negative slot index', () => {
      const result = service.usePup(-1);
      expect(result).toBeNull();
    });
  });

  describe('startCooldown', () => {
    beforeEach(() => {
      service.setReady();
      service.startRoll(1);
      service.onPupDrawn(1, 5);
    });

    it('should mark slot as on cooldown', () => {
      service.startCooldown(0, 5000);
      expect(service.slots()[0].onCooldown).toBeTrue();
    });

    it('should set cooldown end time', () => {
      const before = Date.now();
      service.startCooldown(0, 5000);
      const after = Date.now();

      const cooldownEnd = service.slots()[0].cooldownEnd!;
      expect(cooldownEnd).toBeGreaterThanOrEqual(before + 5000);
      expect(cooldownEnd).toBeLessThanOrEqual(after + 5000);
    });

    it('should ignore invalid slot index', () => {
      service.startCooldown(10, 5000);
      expect(service.slots()[0].onCooldown).toBeFalse();
    });

    it('should ignore negative slot index', () => {
      service.startCooldown(-1, 5000);
      expect(service.slots()[0].onCooldown).toBeFalse();
    });
  });

  describe('clearSlot', () => {
    beforeEach(() => {
      service.setReady();
      service.startRoll(1);
      service.onPupDrawn(1, 5);
    });

    it('should clear the slot to empty state', () => {
      service.clearSlot(0);
      const slot = service.slots()[0];
      expect(slot.pupID).toBeNull();
      expect(slot.level).toBeNull();
      expect(slot.onCooldown).toBeFalse();
      expect(slot.cooldownEnd).toBeNull();
    });

    it('should ignore invalid slot index', () => {
      service.clearSlot(10);
      expect(service.slots()[0].pupID).toBe(5);
    });

    it('should ignore negative slot index', () => {
      service.clearSlot(-1);
      expect(service.slots()[0].pupID).toBe(5);
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      // Fill all slots
      service.setReady();
      service.startRoll(1);
      service.onPupDrawn(1, 0);
      service.setReady();
      service.startRoll(2);
      service.onPupDrawn(2, 1);
      service.setReady();
      service.startRoll(3);
      service.onPupDrawn(3, 2);
    });

    it('should reset orb state to IDLE', () => {
      service.reset();
      expect(service.orbState()).toBe(PUPOrbState.IDLE);
    });

    it('should reset all slots to empty', () => {
      service.reset();
      expect(service.slots().every(s => s.pupID === null)).toBeTrue();
    });

    it('should reset allSlotsOccupied to false', () => {
      expect(service.allSlotsOccupied()).toBeTrue();
      service.reset();
      expect(service.allSlotsOccupied()).toBeFalse();
    });
  });

  describe('allSlotsOccupied', () => {
    it('should return false when no slots occupied', () => {
      expect(service.allSlotsOccupied()).toBeFalse();
    });

    it('should return false when some slots occupied', () => {
      service.setReady();
      service.startRoll(1);
      service.onPupDrawn(1, 0);

      expect(service.allSlotsOccupied()).toBeFalse();
    });

    it('should return true when all slots occupied', () => {
      service.setReady();
      service.startRoll(1);
      service.onPupDrawn(1, 0);
      service.setReady();
      service.startRoll(2);
      service.onPupDrawn(2, 1);
      service.setReady();
      service.startRoll(3);
      service.onPupDrawn(3, 2);

      expect(service.allSlotsOccupied()).toBeTrue();
    });
  });

  describe('canRoll', () => {
    it('should return false when IDLE', () => {
      expect(service.canRoll()).toBeFalse();
    });

    it('should return true when READY and slots available', () => {
      service.setReady();
      expect(service.canRoll()).toBeTrue();
    });

    it('should return false when READY but all slots occupied', () => {
      // Fill all slots
      service.setReady();
      service.startRoll(1);
      service.onPupDrawn(1, 0);
      service.setReady();
      service.startRoll(2);
      service.onPupDrawn(2, 1);
      service.setReady();
      service.startRoll(3);
      service.onPupDrawn(3, 2);

      // Force ready state
      service.orbState.set(PUPOrbState.READY);
      expect(service.canRoll()).toBeFalse();
    });

    it('should return false when SPINNING', () => {
      service.setReady();
      service.startRoll(1);
      expect(service.canRoll()).toBeFalse();
    });
  });
});
