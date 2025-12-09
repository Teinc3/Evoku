import { By } from '@angular/platform-browser';
import { TestBed, type ComponentFixture } from '@angular/core/testing';

import SudokuCellComponent from './cell.component';

import type ClientCellModel from '../../../../models/Cell';


// Minimal mock for the ClientCellModel interface used by the component
class MockCellModel {
  value = 0;
  fixed = false;
  notes: number[] = [];
  pendingCellState?: { pendingValue?: number; pendingCooldownEnd?: number };
  lastCooldownEnd = 0;
  hasPending() {
    return !!this.pendingCellState;
  }
  getDisplayValue() {
    return this.pendingCellState?.pendingValue ?? this.value;
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
    component.isMe = true;
    fixture.detectChanges();

    const span = fixture.debugElement.query(By.css('.v'))!.nativeElement as HTMLElement;
    expect(span.textContent!.trim()).toBe('5');
  });

  it('shows pending value when pending present', () => {
    const m = new MockCellModel();
    m.pendingCellState = { pendingValue: 7 };
    component.model = m as unknown as ClientCellModel;
    component.isMe = true;
    fixture.detectChanges();

    const span = fixture.debugElement.query(By.css('.v'))!.nativeElement as HTMLElement;
    expect(span.textContent!.trim()).toBe('7');
    expect(fixture.debugElement.query(By.css('.cell')).nativeElement.classList)
      .toContain('pending');
  });

  it('noteDigit returns empty string when digit not noted', () => {
    const m = new MockCellModel();
    m.notes = [2, 5];
    component.model = m as unknown as ClientCellModel;
    fixture.detectChanges();

    expect(component.noteDigit(1)).toBe('');
    expect(component.noteDigit(2)).toBe('2');
  });

  it('pendingValue getter exposes pendingCellState value', () => {
    const m = new MockCellModel();
    m.pendingCellState = { pendingValue: 3 };
    component.model = m as unknown as ClientCellModel;
    component.isMe = true;
    fixture.detectChanges();
    expect(component.pendingValue).toBe(3);
  });

  it('renders notes grid when no value and notes present', () => {
    const m = new MockCellModel();
    m.value = 0;
    m.notes = [1, 3, 9];
    component.model = m as unknown as ClientCellModel;
    component.isMe = true;
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

  it('emits selected on click', () => {
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
  });

  it('cooldown helper is properly instantiated', () => {
    const m = new MockCellModel();
    component.model = m as unknown as ClientCellModel;
    fixture.detectChanges();

    expect(component.cooldownHelper).toBeDefined();
    expect(component.cooldownHelper.currentAngle).toBeDefined();
    expect(component.cooldownHelper.transitionDuration).toBeDefined();
  });

  it('passes cooldown values to helper on check', () => {
    const m = new MockCellModel();
    const now = performance.now();
    m.pendingCellState = { pendingCooldownEnd: now + 5000 };
    m.lastCooldownEnd = now + 10000;
    component.model = m as unknown as ClientCellModel;

    const helperSpy = spyOn(component.cooldownHelper, 'checkCooldownChanges');
    component.ngDoCheck();

    expect(helperSpy).toHaveBeenCalledWith(now + 5000, now + 10000);
  });

  it('calls helper destroy on component destroy', () => {
    const m = new MockCellModel();
    component.model = m as unknown as ClientCellModel;
    fixture.detectChanges();

    const destroySpy = spyOn(component.cooldownHelper, 'reset');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
  });

  describe('Note Highlighting', () => {
    it('identifies notes that should be highlighted when selectedValue matches', () => {
      const m = new MockCellModel();
      m.notes = [5, 3]; // Add notes to the model
      component.model = m as unknown as ClientCellModel;
      component.selectedValue = 5;
      fixture.detectChanges();

      expect(component.shouldHighlightNote(5)).toBeTrue();
      expect(component.shouldHighlightNote(3)).toBeFalse(); // Note exists but doesn't match
      expect(component.shouldHighlightNote(7)).toBeFalse(); // Note doesn't exist
    });

    it('does not highlight notes when selectedValue is 0', () => {
      const m = new MockCellModel();
      m.notes = [1, 2, 3];
      component.model = m as unknown as ClientCellModel;
      component.selectedValue = 0;
      fixture.detectChanges();

      for (let i = 1; i <= 9; i++) {
        expect(component.shouldHighlightNote(i)).toBeFalse();
      }
    });

    it('applies highlight-note class to matching notes in template', () => {
      const m = new MockCellModel();
      m.value = 0;
      m.notes = [1, 5, 9];
      component.model = m as unknown as ClientCellModel;
      component.selectedValue = 5;
      component.isMe = true;
      fixture.detectChanges();

      const noteElements = fixture.debugElement.queryAll(By.css('.note'));
      
      // Note at index 4 (5th position, digit 5) should have highlight-note class
      expect(noteElements[4].nativeElement.classList.contains('highlight-note')).toBeTrue();
      
      // Other notes should not have highlight-note class
      expect(noteElements[0].nativeElement.classList.contains('highlight-note')).toBeFalse();
      expect(noteElements[8].nativeElement.classList.contains('highlight-note')).toBeFalse();
    });
  });
});
