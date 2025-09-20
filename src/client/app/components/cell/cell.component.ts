import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import type ClientCellModel from '../../../models/Cell';


@Component({
  selector: 'app-sudoku-cell',
  standalone: true,
  templateUrl: './cell.component.html',
  styleUrl: './cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class SudokuCellComponent {
  @Input({ required: true }) 
  model!: ClientCellModel;
  @Input()
  index!: number;
  @Output()
  selected = new EventEmitter<number>();
  
  readonly noteGrid: number[];

  constructor() {
    this.noteGrid = Array.from({ length: 9 }, (_, i) => i + 1);
  }

  onClick(): void {
    this.selected.emit(this.index);
  }

  get hasPending(): boolean {
    return this.model.hasPending();
  }

  get showNotes(): boolean {
    // Show notes when empty value and notes present
    const notes = this.model.notes;
    return this.model.value === 0 && Array.isArray(notes) && notes.length > 0;
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

}
