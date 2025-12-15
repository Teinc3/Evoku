import { Component, Input } from '@angular/core';

import { DefuseType } from '../../../../types/enums';

import type { CombatState } from '../../../../types/combat';


/**
 * CombatOverlayComponent renders dynamic visual feedback for combat on the board.
 * Includes:
 * - Grid line pulsing (row/col/box defuse indicators)
 * - Threat border (red pulsing border when under attack)
 * - Ghost target (semi-transparent PUP icons over targeted cells)
 */
@Component({
  selector: 'app-combat-overlay',
  standalone: true,
  templateUrl: './combat-overlay.component.html',
  styleUrl: './combat-overlay.component.scss'
})
export default class CombatOverlayComponent {
  @Input()
  combatState: CombatState | null = null;

  @Input()
  pupIconPath: string = '';

  /** Whether to show threat indication */
  @Input()
  showThreat: boolean = false;

  /** Array of 81 indices for iterating over board cells */
  readonly cellIndices = Array.from({ length: 81 }, (_, i) => i);

  /** Gets the list of row indices that should pulse (0-8) */
  activeRows(): number[] {
    if (!this.combatState || this.combatState.defuseType !== DefuseType.ROW) {
      return [];
    }
    return [this.combatState.defuseIndex];
  }

  /** Gets the list of column indices that should pulse (0-8) */
  activeCols(): number[] {
    if (!this.combatState || this.combatState.defuseType !== DefuseType.COL) {
      return [];
    }
    return [this.combatState.defuseIndex];
  }

  /** Gets the list of box indices that should pulse (0-8) */
  activeBoxes(): number[] {
    if (!this.combatState || this.combatState.defuseType !== DefuseType.BOX) {
      return [];
    }
    return [this.combatState.defuseIndex];
  }

  /**
   * Checks if a cell is part of an active row.
   */
  isInActiveRow(cellIndex: number): boolean {
    const row = Math.floor(cellIndex / 9);
    return this.activeRows().includes(row);
  }

  /**
   * Checks if a cell is part of an active column.
   */
  isInActiveCol(cellIndex: number): boolean {
    const col = cellIndex % 9;
    return this.activeCols().includes(col);
  }

  /**
   * Checks if a cell is part of an active 3x3 box.
   */
  isInActiveBox(cellIndex: number): boolean {
    const row = Math.floor(cellIndex / 9);
    const col = cellIndex % 9;
    const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
    return this.activeBoxes().includes(boxIndex);
  }

  /**
   * Checks if a cell is a ghost target (for rendering PUP icon overlay).
   */
  isGhostTarget(cellIndex: number): boolean {
    if (!this.combatState?.targetCells) {
      return false;
    }
    return this.combatState.targetCells.includes(cellIndex);
  }

  /**
   * Gets the CSS classes for a cell based on combat state.
   */
  getCellClasses(cellIndex: number): string {
    const classes: string[] = [];

    if (this.isInActiveRow(cellIndex)) {
      classes.push('pulse-row');
    }
    if (this.isInActiveCol(cellIndex)) {
      classes.push('pulse-col');
    }
    if (this.isInActiveBox(cellIndex)) {
      classes.push('pulse-box');
    }
    if (this.isGhostTarget(cellIndex)) {
      classes.push('ghost-target');
    }

    return classes.join(' ');
  }

  /**
   * Checks if the board should show the threat border.
   */
  get hasThreat(): boolean {
    return this.showThreat && this.combatState !== null;
  }
}
