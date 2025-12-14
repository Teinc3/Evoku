import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import PupSlotComponent from '../pup-slot/pup-slot.component';
import PupSlotsHolderComponent from './pup-slots-holder';

import type { PupSlotState } from '../../../../types/pup';


describe('PupSlotsHolderComponent', () => {
  let fixture: ComponentFixture<PupSlotsHolderComponent>;
  let component: PupSlotsHolderComponent;

  const sampleSlots: PupSlotState[] = [
    { pupID: 1, name: 'Cryo', icon: '/assets/pup/icons/cryo.svg', status: 'ready' },
    { pupID: null, name: null, icon: null, status: 'empty' },
    { pupID: 3, name: 'Inferno', icon: '/assets/pup/icons/inferno.svg', status: 'cooldown' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PupSlotsHolderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PupSlotsHolderComponent);
    component = fixture.componentInstance;
  });

  it('should render one pup-slot per slot input', () => {
    component.slots = sampleSlots;
    fixture.detectChanges();

    const slots = fixture.debugElement.queryAll(By.directive(PupSlotComponent));
    expect(slots.length).toBe(sampleSlots.length);
  });

  it('should emit usePup with slot index when child emits', () => {
    component.slots = sampleSlots;
    fixture.detectChanges();

    const useSpy = jasmine.createSpy('usePup');
    component.usePup.subscribe(useSpy);

    const slotDebug = fixture.debugElement.queryAll(By.directive(PupSlotComponent))[0];
    slotDebug.triggerEventHandler('use', undefined);

    expect(useSpy).toHaveBeenCalledWith(0);
  });
});
