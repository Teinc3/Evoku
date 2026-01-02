import { ComponentFixture, TestBed } from '@angular/core/testing';

import NumericButtonsHolderComponent from './numeric-buttons-holder.component';


describe('NumericButtonsHolderComponent', () => {
  let fixture: ComponentFixture<NumericButtonsHolderComponent>;
  let component: NumericButtonsHolderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumericButtonsHolderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NumericButtonsHolderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should expose numbers 1..9', () => {
    expect(component['numbers']).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('should emit numberClick when a number is clicked', () => {
    const spy = jasmine.createSpy('numberClick');
    component.numberClick.subscribe(spy);

    component.onNumberClick(7);

    expect(spy).toHaveBeenCalledOnceWith(7);
  });
});
