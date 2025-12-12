import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import FloatingTextType from '../../../types/enums/floating-text-type';
import FloatingTextComponent from './floating-text.component';

import type { FloatingTextData } from '../../../types/combat';


describe('FloatingTextComponent', () => {
  let component: FloatingTextComponent;
  let fixture: ComponentFixture<FloatingTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingTextComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FloatingTextComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display correct text for each type', () => {
    const types = [
      FloatingTextType.REFLECTED,
      FloatingTextType.SHATTERED,
      FloatingTextType.FROZEN,
      FloatingTextType.LOCKED
    ];

    types.forEach(type => {
      component.data = { type, id: 1 };
      expect(component.displayText).toBe(type + '!');
    });
  });

  it('should apply success class for REFLECTED and SHATTERED', () => {
    component.data = { type: FloatingTextType.REFLECTED, id: 1 };
    expect(component.textClass).toBe('success');

    component.data = { type: FloatingTextType.SHATTERED, id: 1 };
    expect(component.textClass).toBe('success');
  });

  it('should apply danger class for FROZEN and LOCKED', () => {
    component.data = { type: FloatingTextType.FROZEN, id: 1 };
    expect(component.textClass).toBe('danger');

    component.data = { type: FloatingTextType.LOCKED, id: 1 };
    expect(component.textClass).toBe('danger');
  });

  it('should call onComplete after animation duration', fakeAsync(() => {
    const onCompleteSpy = jasmine.createSpy('onComplete');
    component.data = { type: FloatingTextType.REFLECTED, id: 42 };
    component.onComplete = onCompleteSpy;

    component.ngOnInit();
    
    // Before animation completes
    tick(1000);
    expect(onCompleteSpy).not.toHaveBeenCalled();
    
    // After animation completes
    tick(1000);
    expect(onCompleteSpy).toHaveBeenCalledWith(42);
  }));

  it('should cleanup timer on destroy', fakeAsync(() => {
    const onCompleteSpy = jasmine.createSpy('onComplete');
    component.data = { type: FloatingTextType.REFLECTED, id: 1 };
    component.onComplete = onCompleteSpy;

    component.ngOnInit();
    component.ngOnDestroy();
    
    // Should not call onComplete after destroy
    tick(2000);
    expect(onCompleteSpy).not.toHaveBeenCalled();
  }));

  it('should handle missing inputs gracefully', () => {
    // Should not throw even without data/onComplete
    expect(() => component.ngOnInit()).not.toThrow();
  });
});
