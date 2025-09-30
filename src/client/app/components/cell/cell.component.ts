import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, signal } from '@angular/core';

import type ClientCellModel from '../../../models/Cell';


@Component({
  selector: 'app-cell-model',
  standalone: true,
  templateUrl: './cell.component.html',
  styleUrl: './cell.component.scss',
})
export default class SudokuCellComponent implements OnInit, OnDestroy {
  @Input({ required: true }) 
  model!: ClientCellModel;
  @Input()
  index!: number;
  @Output()
  selected = new EventEmitter<number>();
  
  readonly noteGrid: number[];
  readonly cooldownPercentage = signal<number | null>(null);
  private updateInterval?: number;

  constructor() {
    this.noteGrid = Array.from({ length: 9 }, (_, i) => i + 1);
  }

  ngOnInit(): void {
    // Update cooldown percentage every 200ms for smoother animation
    this.updateInterval = window.setInterval(() => {
      this.cooldownPercentage.set(this.calculateCooldownPercentage());
    }, 20);
    // Initial update
    this.cooldownPercentage.set(this.calculateCooldownPercentage());
  }

  ngOnDestroy(): void {
    if (this.updateInterval !== undefined) {
      clearInterval(this.updateInterval);
    }
  }

  private calculateCooldownPercentage(): number | null {
    const endTime = this.model.pendingCellState?.pendingCooldownEnd ?? this.model.lastCooldownEnd;
    if (!endTime || endTime <= performance.now()) {
      return null;
    }
    const remaining = endTime - performance.now();
    const total = 10000; // BaseCellModel.CELL_COOLDOWN_DURATION
    return Math.max(0, Math.min(1, remaining / total));
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

}
