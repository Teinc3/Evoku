import { By } from '@angular/platform-browser';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import SudokuCellComponent from './cell.component';

import type { ComponentFixture } from '@angular/core/testing';
import type ClientCellModel from 'src/client/models/Cell';


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
    fixture.detectChanges();
    expect(component.pendingValue).toBe(3);
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

  it('shows cooldown overlay when on cooldown', fakeAsync(() => {
    const m = new MockCellModel();
    m.lastCooldownEnd = performance.now() + 5000; // 5 seconds from now
    component.model = m as unknown as ClientCellModel;
    fixture.detectChanges();

    // Wait for interval to update
    tick(1100);
    fixture.detectChanges();
    const overlay = fixture.debugElement.query(By.css('.cooldown-overlay'));
    expect(overlay).toBeTruthy();
    expect(component.cooldownPercentage()).toBeGreaterThan(0);
  }));

  it('hides cooldown overlay when not on cooldown', fakeAsync(() => {
    const m = new MockCellModel();
    m.lastCooldownEnd = performance.now() - 1000; // Expired
    component.model = m as unknown as ClientCellModel;
    fixture.detectChanges();

    tick(1100);
    fixture.detectChanges();
    const overlay = fixture.debugElement.query(By.css('.cooldown-overlay'));
    expect(overlay).toBeFalsy();
    expect(component.cooldownPercentage()).toBeNull();
  }));

  it('calculates cooldown percentage correctly', () => {
    const m = new MockCellModel();
    const now = 1000;
    m.lastCooldownEnd = now + 10000; // Full cooldown
    component.model = m as unknown as ClientCellModel;
    // Mock performance.now
    const spy = spyOn(performance, 'now').and.returnValue(now);
    expect(component['calculateCooldownPercentage']()).toBe(1);

    // Half way
    spy.and.returnValue(now + 5000);
    expect(component['calculateCooldownPercentage']()).toBe(0.5);

    // Expired
    spy.and.returnValue(now + 11000);
    expect(component['calculateCooldownPercentage']()).toBeNull();
  });
});
