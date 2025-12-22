import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefuseType } from '../../../../types/enums';
import CombatOverlayComponent from './combat-overlay.component';


describe('CombatOverlayComponent', () => {
  let component: CombatOverlayComponent;
  let fixture: ComponentFixture<CombatOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CombatOverlayComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CombatOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('cellIndices', () => {
    it('should have 81 cell indices', () => {
      expect(component.cellIndices.length).toBe(81);
    });

    it('should have indices from 0 to 80', () => {
      expect(component.cellIndices[0]).toBe(0);
      expect(component.cellIndices[80]).toBe(80);
    });
  });

  describe('activeRows', () => {
    it('should return empty array when no combatState', () => {
      component.combatState = null;
      expect(component.activeRows()).toEqual([]);
    });

    it('should return empty array when defuseType is not ROW', () => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.COL,
        defuseIndex: 3,
        endTime: Date.now() + 10000
      };
      expect(component.activeRows()).toEqual([]);
    });

    it('should return defuseIndex when defuseType is ROW', () => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.ROW,
        defuseIndex: 5,
        endTime: Date.now() + 10000
      };
      expect(component.activeRows()).toEqual([5]);
    });
  });

  describe('activeCols', () => {
    it('should return empty array when no combatState', () => {
      component.combatState = null;
      expect(component.activeCols()).toEqual([]);
    });

    it('should return empty array when defuseType is not COL', () => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.BOX,
        defuseIndex: 3,
        endTime: Date.now() + 10000
      };
      expect(component.activeCols()).toEqual([]);
    });

    it('should return defuseIndex when defuseType is COL', () => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.COL,
        defuseIndex: 7,
        endTime: Date.now() + 10000
      };
      expect(component.activeCols()).toEqual([7]);
    });
  });

  describe('activeBoxes', () => {
    it('should return empty array when no combatState', () => {
      component.combatState = null;
      expect(component.activeBoxes()).toEqual([]);
    });

    it('should return empty array when defuseType is not BOX', () => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.ROW,
        defuseIndex: 3,
        endTime: Date.now() + 10000
      };
      expect(component.activeBoxes()).toEqual([]);
    });

    it('should return defuseIndex when defuseType is BOX', () => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.BOX,
        defuseIndex: 4,
        endTime: Date.now() + 10000
      };
      expect(component.activeBoxes()).toEqual([4]);
    });
  });

  describe('isInActiveRow', () => {
    beforeEach(() => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.ROW,
        defuseIndex: 2, // Row 2 (indices 18-26)
        endTime: Date.now() + 10000
      };
    });

    it('should return true for cells in active row', () => {
      expect(component.isInActiveRow(18)).toBeTrue(); // Row 2, Col 0
      expect(component.isInActiveRow(22)).toBeTrue(); // Row 2, Col 4
      expect(component.isInActiveRow(26)).toBeTrue(); // Row 2, Col 8
    });

    it('should return false for cells not in active row', () => {
      expect(component.isInActiveRow(0)).toBeFalse(); // Row 0
      expect(component.isInActiveRow(9)).toBeFalse(); // Row 1
      expect(component.isInActiveRow(27)).toBeFalse(); // Row 3
    });
  });

  describe('isInActiveCol', () => {
    beforeEach(() => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.COL,
        defuseIndex: 3, // Column 3 (indices 3, 12, 21, 30, 39, 48, 57, 66, 75)
        endTime: Date.now() + 10000
      };
    });

    it('should return true for cells in active column', () => {
      expect(component.isInActiveCol(3)).toBeTrue(); // Row 0, Col 3
      expect(component.isInActiveCol(30)).toBeTrue(); // Row 3, Col 3
      expect(component.isInActiveCol(75)).toBeTrue(); // Row 8, Col 3
    });

    it('should return false for cells not in active column', () => {
      expect(component.isInActiveCol(0)).toBeFalse(); // Col 0
      expect(component.isInActiveCol(4)).toBeFalse(); // Col 4
      expect(component.isInActiveCol(80)).toBeFalse(); // Col 8
    });
  });

  describe('isInActiveBox', () => {
    beforeEach(() => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.BOX,
        defuseIndex: 4, // Center box (rows 3-5, cols 3-5)
        endTime: Date.now() + 10000
      };
    });

    it('should return true for cells in active box', () => {
      // Center box: rows 3-5, cols 3-5
      expect(component.isInActiveBox(30)).toBeTrue(); // Row 3, Col 3
      expect(component.isInActiveBox(40)).toBeTrue(); // Row 4, Col 4
      expect(component.isInActiveBox(50)).toBeTrue(); // Row 5, Col 5
    });

    it('should return false for cells not in active box', () => {
      expect(component.isInActiveBox(0)).toBeFalse(); // Box 0
      expect(component.isInActiveBox(8)).toBeFalse(); // Box 2
      expect(component.isInActiveBox(80)).toBeFalse(); // Box 8
    });
  });

  describe('isGhostTarget', () => {
    it('should return false when no combatState', () => {
      component.combatState = null;
      expect(component.isGhostTarget(0)).toBeFalse();
    });

    it('should return false when no targetCells', () => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.ROW,
        defuseIndex: 0,
        endTime: Date.now() + 10000
      };
      expect(component.isGhostTarget(0)).toBeFalse();
    });

    it('should return true when cell is in targetCells', () => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.ROW,
        defuseIndex: 0,
        endTime: Date.now() + 10000,
        targetCells: [5, 10, 15]
      };
      expect(component.isGhostTarget(5)).toBeTrue();
      expect(component.isGhostTarget(10)).toBeTrue();
      expect(component.isGhostTarget(15)).toBeTrue();
    });

    it('should return false when cell is not in targetCells', () => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.ROW,
        defuseIndex: 0,
        endTime: Date.now() + 10000,
        targetCells: [5, 10, 15]
      };
      expect(component.isGhostTarget(0)).toBeFalse();
      expect(component.isGhostTarget(20)).toBeFalse();
    });
  });

  describe('getCellClasses', () => {
    it('should return empty string when no active states', () => {
      component.combatState = null;
      expect(component.getCellClasses(0)).toBe('');
    });

    it('should include "pulse-row" when cell is in active row', () => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.ROW,
        defuseIndex: 0,
        endTime: Date.now() + 10000
      };
      expect(component.getCellClasses(0)).toContain('pulse-row');
    });

    it('should include "pulse-col" when cell is in active column', () => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.COL,
        defuseIndex: 0,
        endTime: Date.now() + 10000
      };
      expect(component.getCellClasses(0)).toContain('pulse-col');
    });

    it('should include "pulse-box" when cell is in active box', () => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.BOX,
        defuseIndex: 0,
        endTime: Date.now() + 10000
      };
      expect(component.getCellClasses(0)).toContain('pulse-box');
    });

    it('should include "ghost-target" when cell is a ghost target', () => {
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.ROW,
        defuseIndex: 0,
        endTime: Date.now() + 10000,
        targetCells: [0]
      };
      expect(component.getCellClasses(0)).toContain('ghost-target');
    });
  });

  describe('hasThreat', () => {
    it('should return false when showThreat is false', () => {
      component.showThreat = false;
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.ROW,
        defuseIndex: 0,
        endTime: Date.now() + 10000
      };
      expect(component.hasThreat).toBeFalse();
    });

    it('should return false when combatState is null', () => {
      component.showThreat = true;
      component.combatState = null;
      expect(component.hasThreat).toBeFalse();
    });

    it('should return true when showThreat is true and combatState exists', () => {
      component.showThreat = true;
      component.combatState = {
        pupType: 1,
        defuseType: DefuseType.ROW,
        defuseIndex: 0,
        endTime: Date.now() + 10000
      };
      expect(component.hasThreat).toBeTrue();
    });
  });
});
