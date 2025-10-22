import {
  Component, EventEmitter, Input, Output, DoCheck, type OnDestroy,
} from '@angular/core';

import CooldownAnimationHelper from '../../../utils/cooldown-animation-helper';

import type ClientCellModel from '../../../../models/Cell';


@Component({
  selector: 'app-cell-model',
  standalone: true,
  templateUrl: './cell.component.html',
  styleUrl: './cell.component.scss',
})
export default class SudokuCellComponent implements DoCheck, OnDestroy {
  @Input({ required: true }) 
  model!: ClientCellModel;
  @Input()
  index!: number;
  @Input()
  selectedValue: number = 0;
  @Output()
  selected = new EventEmitter<number>();
  
  readonly noteGrid: number[];
  public readonly cooldownHelper: CooldownAnimationHelper;

  constructor() {
    this.noteGrid = Array.from({ length: 9 }, (_, i) => i + 1);
    this.cooldownHelper = new CooldownAnimationHelper();
  }

  ngDoCheck(): void {
    this.cooldownHelper.checkCooldownChanges(
      this.model.pendingCellState?.pendingCooldownEnd,
      this.model.lastCooldownEnd
    );
  }

  ngOnDestroy(): void {
    this.cooldownHelper.destroy();
  }

  onClick(): void {
    this.selected.emit(this.index);
  }

  get hasPending(): boolean {
    return this.model.hasPending();
  }

  get showNotes(): boolean {
    // Show notes when empty value, no pending, and notes present
    const notes = this.model.notes;
    return this.model.value === 0 && !this.model.hasPending()
      && Array.isArray(notes) && notes.length > 0;
  }

  get value(): number {
    return this.model.getDisplayValue();
  }

  get pendingValue(): number | undefined {
    return this.model.pendingCellState?.pendingValue;
  }

  noteDigit(digit: number): string {
    const notes = this.model.notes;
    const has = !!notes?.includes(digit);
    return has ? String(digit) : '';
  }

  /** Checks if a note should be highlighted (matches selected value) */
  shouldHighlightNote(noteDigit: number): boolean {
    // Don't highlight notes for value 0
    if (this.selectedValue === 0) {
      return false;
    }
    // Only highlight if the note actually exists in the cell
    const notes = this.model.notes;
    const hasNote = !!notes?.includes(noteDigit);
    return hasNote && noteDigit === this.selectedValue;
  }

}
