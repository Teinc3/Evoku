import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';

import { createEmptySlotState } from '../../../../types/pup';
import PupSlotComponent from './pup-slot.component';

import type { PupSlotState } from '../../../../types/pup';


describe('PupSlotComponent', () => {
  let component: PupSlotComponent;
  let fixture: ComponentFixture<PupSlotComponent>;
  let debugElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PupSlotComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PupSlotComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('empty slot state', () => {
    it('should render without pup when slotState is null', () => {
      component.slotState = null;
      fixture.detectChanges();

      const icon = debugElement.nativeElement.querySelector('.pup-icon');
      const level = debugElement.nativeElement.querySelector('.level');
      expect(icon).toBeFalsy();
      expect(level).toBeFalsy();
    });

    it('should render without pup when slotState has null pupID', () => {
      component.slotState = createEmptySlotState();
      fixture.detectChanges();

      const icon = debugElement.nativeElement.querySelector('.pup-icon');
      const level = debugElement.nativeElement.querySelector('.level');
      expect(icon).toBeFalsy();
      expect(level).toBeFalsy();
    });
  });

  describe('slot with PUP', () => {
    const occupiedSlotState: PupSlotState = {
      pupID: 0, // Cryo Freeze
      level: 2,
      onCooldown: false,
      cooldownEnd: null
    };

    it('should render pup icon when slot has a pup', () => {
      component.slotState = occupiedSlotState;
      fixture.detectChanges();

      const icon = debugElement.nativeElement.querySelector('.pup-icon') as HTMLImageElement;
      expect(icon).toBeTruthy();
      expect(icon.src).toContain('cryo.svg');
    });

    it('should render level when slot has a pup', () => {
      component.slotState = occupiedSlotState;
      fixture.detectChanges();

      const level = debugElement.nativeElement.querySelector('.level');
      expect(level).toBeTruthy();
      expect(level.textContent.trim()).toBe('2');
    });

    it('should apply occupied class when slot has a pup', () => {
      component.slotState = occupiedSlotState;
      fixture.detectChanges();

      const slot = debugElement.nativeElement.querySelector('.slot');
      expect(slot.classList.contains('occupied')).toBe(true);
    });
  });

  describe('template rendering', () => {
    it('should render slot wrapper', () => {
      fixture.detectChanges();
      const wrapper = debugElement.nativeElement.querySelector('.slot-wrapper');
      expect(wrapper).toBeTruthy();
    });

    it('should render slot element', () => {
      fixture.detectChanges();
      const slot = debugElement.nativeElement.querySelector('.slot');
      expect(slot).toBeTruthy();
    });

    it('should not apply occupied class when empty', () => {
      component.slotState = createEmptySlotState();
      fixture.detectChanges();

      const slot = debugElement.nativeElement.querySelector('.slot');
      expect(slot.classList.contains('occupied')).toBe(false);
    });
  });

  describe('computed properties', () => {
    it('should return null for pupIcon when no pup', () => {
      component.slotState = createEmptySlotState();
      expect(component.pupIcon).toBeNull();
    });

    it('should return icon path from config when pup exists', () => {
      component.slotState = { pupID: 2, level: 1, onCooldown: false, cooldownEnd: null };
      expect(component.pupIcon).toContain('inferno.svg');
    });

    it('should return null for level when no pup', () => {
      component.slotState = createEmptySlotState();
      expect(component.level).toBeNull();
    });

    it('should return level from state when pup exists', () => {
      component.slotState = { pupID: 0, level: 3, onCooldown: false, cooldownEnd: null };
      expect(component.level).toBe(3);
    });

    it('should return isOccupied as false when no pup', () => {
      component.slotState = createEmptySlotState();
      expect(component.isOccupied).toBeFalse();
    });

    it('should return isOccupied as true when pup exists', () => {
      component.slotState = { pupID: 0, level: 1, onCooldown: false, cooldownEnd: null };
      expect(component.isOccupied).toBeTrue();
    });

    it('should return isOnCooldown from state', () => {
      component.slotState = {
        pupID: 0, level: 1, onCooldown: true, cooldownEnd: Date.now() + 5000
      };
      expect(component.isOnCooldown).toBeTrue();
    });

    it('should return canUse as false when on cooldown', () => {
      component.slotState = {
        pupID: 0, level: 1, onCooldown: true, cooldownEnd: Date.now() + 5000
      };
      expect(component.canUse).toBeFalse();
    });

    it('should return canUse as true when occupied and not on cooldown', () => {
      component.slotState = { pupID: 0, level: 1, onCooldown: false, cooldownEnd: null };
      expect(component.canUse).toBeTrue();
    });

    it('should return pupName from config', () => {
      component.slotState = { pupID: 0, level: 1, onCooldown: false, cooldownEnd: null };
      expect(component.pupName).toBe('Cryo');
    });

    it('should return null for pupName when no pup', () => {
      component.slotState = createEmptySlotState();
      expect(component.pupName).toBeNull();
    });
  });

  describe('host bindings', () => {
    it('should have occupied class when occupied', () => {
      component.slotState = { pupID: 0, level: 1, onCooldown: false, cooldownEnd: null };
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('occupied')).toBeTrue();
    });

    it('should have cooldown class when on cooldown', () => {
      component.slotState = {
        pupID: 0, level: 1, onCooldown: true, cooldownEnd: Date.now() + 5000
      };
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('cooldown')).toBeTrue();
    });

    it('should have usable class when can use', () => {
      component.slotState = { pupID: 0, level: 1, onCooldown: false, cooldownEnd: null };
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('usable')).toBeTrue();
    });
  });

  describe('click behavior', () => {
    it('should emit usePup with slotIndex when clicked and can use', () => {
      const usePupSpy = jasmine.createSpy('usePup');
      component.usePup.subscribe(usePupSpy);
      component.slotState = { pupID: 0, level: 1, onCooldown: false, cooldownEnd: null };
      component.slotIndex = 1;
      fixture.detectChanges();

      debugElement.triggerEventHandler('click', {});

      expect(usePupSpy).toHaveBeenCalledWith(1);
    });

    it('should not emit usePup when cannot use (empty)', () => {
      const usePupSpy = jasmine.createSpy('usePup');
      component.usePup.subscribe(usePupSpy);
      component.slotState = createEmptySlotState();
      fixture.detectChanges();

      debugElement.triggerEventHandler('click', {});

      expect(usePupSpy).not.toHaveBeenCalled();
    });

    it('should not emit usePup when cannot use (on cooldown)', () => {
      const usePupSpy = jasmine.createSpy('usePup');
      component.usePup.subscribe(usePupSpy);
      component.slotState = {
        pupID: 0, level: 1, onCooldown: true, cooldownEnd: Date.now() + 5000
      };
      fixture.detectChanges();

      debugElement.triggerEventHandler('click', {});

      expect(usePupSpy).not.toHaveBeenCalled();
    });
  });

  describe('different PUP types', () => {
    it('should display correct icons for different PUPs', () => {
      const pupTestCases = [
        { pupID: 0, expectedIcon: 'cryo' },
        { pupID: 1, expectedIcon: 'purity' },
        { pupID: 2, expectedIcon: 'inferno' },
        { pupID: 3, expectedIcon: 'metabolic' },
        { pupID: 4, expectedIcon: 'entangle' },
        { pupID: 5, expectedIcon: 'wisdom' },
        { pupID: 6, expectedIcon: 'landslide' },
        { pupID: 7, expectedIcon: 'excavate' },
        { pupID: 8, expectedIcon: 'lock' },
        { pupID: 9, expectedIcon: 'forge' }
      ];

      for (const testCase of pupTestCases) {
        component.slotState = {
          pupID: testCase.pupID,
          level: 1,
          onCooldown: false,
          cooldownEnd: null
        };
        expect(component.pupIcon).toContain(testCase.expectedIcon);
      }
    });
  });
});
