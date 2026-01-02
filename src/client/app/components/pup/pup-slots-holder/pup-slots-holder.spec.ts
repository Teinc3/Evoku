import { ComponentFixture, TestBed } from '@angular/core/testing';

import PupSlotsHolderComponent from './pup-slots-holder';

import type { QueryList } from '@angular/core';
import type { IPUPSlotState } from '@shared/types/gamestate/powerups';
import type PupSlotComponent from '../pup-slot/pup-slot.component';


describe('PupSlotsHolderComponent', () => {
  let fixture: ComponentFixture<PupSlotsHolderComponent>;
  let component: PupSlotsHolderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PupSlotsHolderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PupSlotsHolderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit slotClicked when a slot is clicked', () => {
    const slotClickedSpy = jasmine.createSpy('slotClicked');
    component.slotClicked.subscribe(slotClickedSpy);

    const componentWithOnSlotClicked = component as unknown as {
      onSlotClicked: (slotIndex: number) => void;
    };
    componentWithOnSlotClicked.onSlotClicked(2);

    expect(slotClickedSpy).toHaveBeenCalledWith(2);
  });

  it('should do nothing when shakeSlot is called before ViewChildren is available', () => {
    const componentWithSlotComponents = component as unknown as {
      slotComponents?: QueryList<PupSlotComponent>;
    };
    componentWithSlotComponents.slotComponents = undefined;

    expect(() => {
      component.shakeSlot(0);
    }).not.toThrow();
  });

  it('should call beginShake on the matching slot component', () => {
    const beginShakeSpy = jasmine.createSpy('beginShake');

    const slot0: IPUPSlotState = { slotIndex: 0, lastCooldownEnd: 0, locked: false };
    const slot1: IPUPSlotState = { slotIndex: 1, lastCooldownEnd: 0, locked: false };

    const slotComp0 = {
      slot: slot0,
      beginShake: jasmine.createSpy('beginShake0'),
    } as unknown as PupSlotComponent;

    const slotComp1 = {
      slot: slot1,
      beginShake: beginShakeSpy,
    } as unknown as PupSlotComponent;

    const listLike = {
      find: (predicate: (comp: PupSlotComponent) => boolean) => {
        return [slotComp0, slotComp1].find(predicate);
      },
    } as unknown as QueryList<PupSlotComponent>;

    const componentWithSlotComponents = component as unknown as {
      slotComponents?: QueryList<PupSlotComponent>;
    };
    componentWithSlotComponents.slotComponents = listLike;

    component.shakeSlot(1);

    expect(beginShakeSpy).toHaveBeenCalled();
  });

  it('should not call beginShake when slot index does not match', () => {
    const slot0: IPUPSlotState = { slotIndex: 0, lastCooldownEnd: 0, locked: false };

    const slotComp0 = {
      slot: slot0,
      beginShake: jasmine.createSpy('beginShake0'),
    } as unknown as PupSlotComponent;

    const listLike = {
      find: (predicate: (comp: PupSlotComponent) => boolean) => {
        return [slotComp0].find(predicate);
      },
    } as unknown as QueryList<PupSlotComponent>;

    const componentWithSlotComponents = component as unknown as {
      slotComponents?: QueryList<PupSlotComponent>;
    };
    componentWithSlotComponents.slotComponents = listLike;

    component.shakeSlot(2);

    const slotComp0WithBeginShake = slotComp0 as unknown as {
      beginShake: jasmine.Spy;
    };
    expect(slotComp0WithBeginShake.beginShake).not.toHaveBeenCalled();
  });

  it('should render 3 slots when slots input is provided', () => {
    component.slots = [
      { slotIndex: 0, lastCooldownEnd: 0, locked: false },
      { slotIndex: 1, lastCooldownEnd: 0, locked: false },
      { slotIndex: 2, lastCooldownEnd: 0, locked: false },
    ];

    fixture.detectChanges();

    const hostEl: HTMLElement = fixture.nativeElement;
    expect(hostEl.querySelectorAll('app-pup-slot').length).toBe(3);
  });
});
