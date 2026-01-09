import {
  ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks
} from '@angular/core/testing';

import { DefuseType } from '../../../../types/enums';
import CombatBadgeComponent from './combat-badge';

import type { CombatState } from '../../../../types/combat';


describe('CombatBadgeComponent', () => {
  let component: CombatBadgeComponent;
  let fixture: ComponentFixture<CombatBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CombatBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CombatBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Clean up any intervals
    component.ngOnDestroy();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('visibility', () => {
    it('should not be visible when combatState is null', () => {
      component.combatState = null;
      fixture.detectChanges();
      expect(component.isVisible()).toBeFalse();
    });

    it('should not be visible when remainingTime is 0', () => {
      const combatState: CombatState = {
        pupType: 1,
        defuseType: DefuseType.ROW,
        defuseIndex: 0,
        endTime: Date.now() - 1000 // Already ended
      };
      component.combatState = combatState;
      component.ngOnChanges({
        combatState: {
          currentValue: combatState,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });
      fixture.detectChanges();
      expect(component.isVisible()).toBeFalse();
    });

    it('should be visible when combatState exists and time remains', fakeAsync(() => {
      const combatState: CombatState = {
        pupType: 1,
        defuseType: DefuseType.ROW,
        defuseIndex: 0,
        endTime: Date.now() + 10000
      };
      component.combatState = combatState;
      component.ngOnChanges({
        combatState: {
          currentValue: combatState,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });
      fixture.detectChanges();
      expect(component.isVisible()).toBeTrue();
      discardPeriodicTasks();
    }));
  });

  describe('countdownDisplay', () => {
    it('should return "00:00" when no time remains', () => {
      component.remainingTime.set(0);
      expect(component.countdownDisplay()).toBe('00:00');
    });

    it('should format seconds correctly', () => {
      component.remainingTime.set(5000); // 5 seconds
      expect(component.countdownDisplay()).toBe('00:05');
    });

    it('should format minutes and seconds correctly', () => {
      component.remainingTime.set(65000); // 1 min 5 seconds
      expect(component.countdownDisplay()).toBe('01:05');
    });

    it('should round up partial seconds', () => {
      component.remainingTime.set(5500); // 5.5 seconds
      expect(component.countdownDisplay()).toBe('00:06');
    });
  });

  describe('isCritical', () => {
    it('should be false when remainingTime is 0', () => {
      component.remainingTime.set(0);
      expect(component.isCritical()).toBeFalse();
    });

    it('should be false when remainingTime is >= 3000ms', () => {
      component.remainingTime.set(3000);
      expect(component.isCritical()).toBeFalse();
    });

    it('should be true when remainingTime is < 3000ms and > 0', () => {
      component.remainingTime.set(2999);
      expect(component.isCritical()).toBeTrue();
    });
  });

  describe('getDefuseTypeLabel', () => {
    it('should return empty string when no combatState', () => {
      component.combatState = null;
      expect(component.getDefuseTypeLabel()).toBe('');
    });

    it('should return "Row" for ROW defuse type', () => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.ROW,
        defuseIndex: 0,
        endTime: Date.now() + 10000
      };
      expect(component.getDefuseTypeLabel()).toBe('Row');
    });

    it('should return "Col" for COL defuse type', () => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.COL,
        defuseIndex: 0,
        endTime: Date.now() + 10000
      };
      expect(component.getDefuseTypeLabel()).toBe('Col');
    });

    it('should return "Box" for BOX defuse type', () => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.BOX,
        defuseIndex: 0,
        endTime: Date.now() + 10000
      };
      expect(component.getDefuseTypeLabel()).toBe('Box');
    });

    it('should return empty string for unknown defuse type', () => {
      component.combatState = {
        pupType: 1,
        defuseType: 999 as unknown as DefuseType, // Unknown type
        defuseIndex: 0,
        endTime: Date.now() + 10000
      };
      expect(component.getDefuseTypeLabel()).toBe('');
    });
  });

  describe('getDefuseTypeIcon', () => {
    it('should return empty string when no combatState', () => {
      component.combatState = null;
      expect(component.getDefuseTypeIcon()).toBe('');
    });

    it('should return correct path for ROW defuse type', () => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.ROW,
        defuseIndex: 0,
        endTime: Date.now() + 10000
      };
      expect(component.getDefuseTypeIcon()).toBe('/assets/icons/row-icon.svg');
    });

    it('should return correct path for COL defuse type', () => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.COL,
        defuseIndex: 0,
        endTime: Date.now() + 10000
      };
      expect(component.getDefuseTypeIcon()).toBe('/assets/icons/col-icon.svg');
    });

    it('should return correct path for BOX defuse type', () => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.BOX,
        defuseIndex: 0,
        endTime: Date.now() + 10000
      };
      expect(component.getDefuseTypeIcon()).toBe('/assets/icons/box-icon.svg');
    });

    it('should return empty string for unknown defuse type', () => {
      component.combatState = {
        pupType: 1,
        defuseType: 999 as unknown as DefuseType, // Unknown type
        defuseIndex: 0,
        endTime: Date.now() + 10000
      };
      expect(component.getDefuseTypeIcon()).toBe('');
    });
  });

  describe('timer functionality', () => {
    it('should update remaining time when combatState changes', fakeAsync(() => {
      const endTime = Date.now() + 10000;
      const combatState: CombatState = {
        pupType: 1,
        defuseType: DefuseType.ROW,
        defuseIndex: 0,
        endTime
      };
      component.combatState = combatState;
      component.ngOnChanges({
        combatState: {
          currentValue: combatState,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });
      
      expect(component.remainingTime()).toBeGreaterThan(0);
      discardPeriodicTasks();
    }));

    it('should clear timer on destroy', fakeAsync(() => {
      const combatState: CombatState = {
        pupType: 1,
        defuseType: DefuseType.ROW,
        defuseIndex: 0,
        endTime: Date.now() + 10000
      };
      component.combatState = combatState;
      component.ngOnChanges({
        combatState: {
          currentValue: combatState,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.ngOnDestroy();
      
      // Timer should be cleared, no periodic tasks remaining
      tick(200);
    }));

    it('should reset remainingTime when combatState becomes null', () => {
      component.combatState = null;
      component.ngOnChanges({
        combatState: {
          currentValue: null,
          previousValue: { pupType: 1 } as CombatState,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      
      expect(component.remainingTime()).toBe(0);
    });
  });
});
