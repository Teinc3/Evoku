import { ComponentFixture, TestBed } from '@angular/core/testing';

import UtilityAction from '../../../types/utility';
import BoardModelComponent from './board.component';


describe('BoardModelComponent (utility actions)', () => {
  let fixture: ComponentFixture<BoardModelComponent>;
  let component: BoardModelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardModelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('toggles note mode when NOTE action invoked', () => {
    expect(component.isNoteMode).toBeFalse();
    component.onUtilityAction(UtilityAction.NOTE);
    expect(component.isNoteMode).toBeTrue();
    component.onUtilityAction(UtilityAction.NOTE);
    expect(component.isNoteMode).toBeFalse();
  });

  it('clears selected cell when CLEAR action invoked (pending value path)', () => {
    component.initBoard([]);
    component.onCellSelected(0);
    const time = performance.now();
    component.setPendingSelected(5, time);
    // Simulate server confirming value so that CLEAR meaningfully changes it back to 0
    component.model.confirmCellSet(0, 5, time);
    expect(component.getCellModel(0).value).toBe(5);
    const spy = spyOn(component.model, 'setPendingCell').and.callThrough();
    component.onUtilityAction(UtilityAction.CLEAR); // parseNumberKey(0) -> setPendingSelected(0)
    expect(spy).toHaveBeenCalledWith(0, 0, jasmine.any(Number));
  });
});

