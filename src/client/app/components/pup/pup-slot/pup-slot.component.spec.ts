import {
  ComponentFixture, TestBed, fakeAsync, tick,
} from '@angular/core/testing';
import { DebugElement } from '@angular/core';

import PupSlotComponent from './pup-slot.component';

import type { IPUPSlotState } from '@shared/types/gamestate/powerups';


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

  describe('ngDoCheck', () => {
    it('should prefer pending cooldown when it is later than the normal cooldown', () => {
      component.slot = {
        slotIndex: 0,
        lastCooldownEnd: 100,
        pendingCooldownEnd: 200,
        locked: false,
      };

      const spy = spyOn(component.countdownHelper, 'checkCooldownChanges');

      component.ngDoCheck();

      expect(spy).toHaveBeenCalledWith(200, 100);
    });

    it('should not use pending cooldown when it is not later than normal cooldown', () => {
      component.slot = {
        slotIndex: 0,
        lastCooldownEnd: 200,
        pendingCooldownEnd: 100,
        locked: false,
      };

      const spy = spyOn(component.countdownHelper, 'checkCooldownChanges');

      component.ngDoCheck();

      expect(spy).toHaveBeenCalledWith(undefined, 200);
    });
  });

  describe('click handling', () => {
    it('should not emit when slot is null', () => {
      const emitSpy = spyOn(component.slotClicked, 'emit');
      component.slot = null;

      (component as unknown as { onClick: () => void }).onClick();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit slotIndex when slot is set', () => {
      const emitSpy = spyOn(component.slotClicked, 'emit');
      component.slot = { slotIndex: 2, lastCooldownEnd: 0, locked: false };

      (component as unknown as { onClick: () => void }).onClick();

      expect(emitSpy).toHaveBeenCalledWith(2);
    });
  });

  describe('icon helpers', () => {
    it('should return box icon for slotIndex 2', () => {
      component.slot = { slotIndex: 2, lastCooldownEnd: 0, locked: false };

      const icon = (component as unknown as { slotIcon: string | null }).slotIcon;
      expect(icon).toBe('/assets/slots/icons/box-diffuse.svg');
      expect((component as unknown as { isBoxIcon: boolean }).isBoxIcon).toBe(true);
    });

    it('should return diffuse icon for non-box slots', () => {
      component.slot = { slotIndex: 0, lastCooldownEnd: 0, locked: false };

      const icon = (component as unknown as { slotIcon: string | null }).slotIcon;
      expect(icon).toBe('/assets/slots/icons/diffuse.svg');
      expect((component as unknown as { isColumnIcon: boolean }).isColumnIcon).toBe(false);
    });

    it('should return null for pupIcon when there is no pup', () => {
      component.slot = { slotIndex: 0, lastCooldownEnd: 0, locked: false };
      const icon = (component as unknown as { pupIcon: string | null }).pupIcon;
      expect(icon).toBeNull();
    });
  });

  describe('shake lifecycle', () => {
    it('should apply shake class then clear it after timeout', fakeAsync(() => {
      expect(component.shakeClass).toBe(false);

      component.beginShake();
      expect(component.shakeClass).toBe(true);

      tick(350);
      expect(component.shakeClass).toBe(false);
    }));

    it('should clear shake timeout on destroy', fakeAsync(() => {
      component.beginShake();
      expect(component.shakeClass).toBe(true);

      component.ngOnDestroy();
      tick(350);

      expect(component.shakeClass).toBe(true);
    }));
  });

  describe('glow lifecycle', () => {

    it('should apply glow class then clear it after timeout', fakeAsync(() => {
      const comp = component as unknown as { glowClass: boolean };
      expect(comp.glowClass).toBe(false);

      component.beginGlow();
      expect(comp.glowClass).toBe(true);

      tick(1750);
      expect(comp.glowClass).toBe(false);
    }));

    it('should clear glow timeout on destroy', fakeAsync(() => {
      const comp = component as unknown as { glowClass: boolean };

      component.beginGlow();
      expect(comp.glowClass).toBe(true);

      component.ngOnDestroy();
      tick(550);

      // should remain glowing because the timeout was cleared
      expect(comp.glowClass).toBe(true);
    }));
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

    it('should render empty slot when slot has no pup', () => {
      const slotState: IPUPSlotState = { slotIndex: 0, lastCooldownEnd: 0, locked: false };
      component.slot = slotState;
      fixture.detectChanges();

      const icon = debugElement.nativeElement.querySelector('.pup-icon');
      const level = debugElement.nativeElement.querySelector('.level');
      const slot = debugElement.nativeElement.querySelector('.slot');

      expect(slot.classList.contains('occupied')).toBe(false);
      expect(icon).toBeFalsy();
      expect(level).toBeFalsy();
    });

    it('should render pup icon and level when slot has a pup', () => {
      const slotState: IPUPSlotState = {
        slotIndex: 0,
        lastCooldownEnd: 0,
        locked: false,
        pup: { pupID: 123, type: 0, level: 3 }
      };
      component.slot = slotState;
      fixture.detectChanges();

      const icon = debugElement.nativeElement.querySelector('.pup-icon') as HTMLImageElement;
      const level = debugElement.nativeElement.querySelector('.level') as HTMLDivElement;
      const slot = debugElement.nativeElement.querySelector('.slot') as HTMLDivElement;

      expect(slot.classList.contains('occupied')).toBe(true);
      expect(icon).toBeTruthy();
      expect(icon.src).toContain('/assets/pup/icons/cryo.svg');
      expect(level.textContent?.trim()).toBe('3');
    });
  });
});
