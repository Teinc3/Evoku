import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';

import SudokuCellComponent from './cell.component';

import type { ComponentFixture } from '@angular/core/testing';
import type ClientCellModel from 'src/client/models/Cell';


// Minimal mock for the ClientCellModel interface used by the component
class MockCellModel {
  value = 0;
  fixed = false;
  notes: number[] = [];
  pendingCellState?: { pendingValue: number };
  hasPending() {
    return !!this.pendingCellState;
  }
  getDisplayValue() {
    return this.value;
  }
}

describe('SudokuCellComponent', () => {
  let fixture: ComponentFixture<SudokuCellComponent>;
  let component: SudokuCellComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SudokuCellComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SudokuCellComponent);
    component = fixture.componentInstance;
  });

  it('renders a value when present and not fixed/pending/notes', () => {
    const m = new MockCellModel();
    m.value = 5;
    component.model = m as unknown as ClientCellModel;
    fixture.detectChanges();

    const span = fixture.debugElement.query(By.css('.v'))!.nativeElement as HTMLElement;
    expect(span.textContent!.trim()).toBe('5');
  });

  it('shows pending value when pending present', () => {
    const m = new MockCellModel();
    m.pendingCellState = { pendingValue: 7 };
    component.model = m as unknown as ClientCellModel;
    fixture.detectChanges();

    const span = fixture.debugElement.query(By.css('.v'))!.nativeElement as HTMLElement;
    expect(span.textContent!.trim()).toBe('7');
    expect(fixture.debugElement.query(By.css('.cell')).nativeElement.classList)
      .toContain('pending');
  });

  it('renders notes grid when no value and notes present', () => {
    const m = new MockCellModel();
    m.value = 0;
    m.notes = [1, 3, 9];
    component.model = m as unknown as ClientCellModel;
    fixture.detectChanges();

    const notes = fixture.debugElement.queryAll(By.css('.note'));
    expect(notes.length).toBe(9);
    // check that some notes are present at their positions
    const texts = notes.map(n => (n.nativeElement as HTMLElement).textContent!.trim());
    expect(texts[0]).toBe('1');
    expect(texts[2]).toBe('3');
    expect(texts[8]).toBe('9');
  });

  it('applies fixed styling when model.fixed is true', () => {
    const m = new MockCellModel();
    m.value = 4;
    m.fixed = true;
    component.model = m as unknown as ClientCellModel;
    fixture.detectChanges();

    // color checks cannot rely on computed styles in this unit test without rendering to browser,
    // but we can check that the host has class 'fixed' applied
    expect(fixture.debugElement.query(By.css('.cell')).nativeElement.classList).toContain('fixed');
  });

  it('emits selected and toggles selected class on click', () => {
    const m = new MockCellModel();
    component.model = m as unknown as ClientCellModel;
    component.index = 42;
    fixture.detectChanges();

    const btn = fixture.debugElement.query(By.css('.cell'));
    const spy = jasmine.createSpy('selected');
    component.selected.subscribe(spy);

    btn.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith(42);
    expect(component.isSelected).toBeTrue();
    expect(fixture.debugElement.query(By.css(':host(.selected)'))).toBeNull();
  });
});
