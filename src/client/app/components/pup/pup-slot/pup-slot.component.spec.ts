import { ComponentFixture, TestBed } from '@angular/core/testing';
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
