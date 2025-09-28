import { ComponentFixture, TestBed } from '@angular/core/testing';

import UtilityAction from '../../../../types/utility';
import UtilityButtonsHolderComponent from './utility-buttons-holder.component';


describe('UtilityButtonsHolderComponent', () => {
  let fixture: ComponentFixture<UtilityButtonsHolderComponent>;
  let component: UtilityButtonsHolderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UtilityButtonsHolderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UtilityButtonsHolderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should emit utilityClick for non-quit actions', () => {
    const spy = jasmine.createSpy('utility');
    component['utilityClick'].subscribe(spy);
    component.onUtilityAction(UtilityAction.CLEAR);
    expect(spy).toHaveBeenCalledOnceWith(UtilityAction.CLEAR);
  });

  it('should emit quitClick for quit action', () => {
    const spy = jasmine.createSpy('quit');
    component['quitClick'].subscribe(spy);
    component.onUtilityAction(UtilityAction.QUIT);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
