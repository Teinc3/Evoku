import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import FloatingTextComponent, { type FloatingTextData } from './floating-text.component';


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

  it('should emit animationComplete after ANIMATION_DURATION_MS when data is provided', fakeAsync(() => {
    const data: FloatingTextData = {
      text: 'REFLECTED!',
      type: 'reflected'
    };
    component.data = data;

    let emitted = false;
    component.animationComplete.subscribe(() => {
      emitted = true;
    });

    component.ngOnInit();
    expect(emitted).toBe(false);

    tick(FloatingTextComponent.ANIMATION_DURATION_MS);
    expect(emitted).toBe(true);
  }));

  it('should not emit animationComplete when data is null', fakeAsync(() => {
    component.data = null;

    let emitted = false;
    component.animationComplete.subscribe(() => {
      emitted = true;
    });

    component.ngOnInit();
    tick(FloatingTextComponent.ANIMATION_DURATION_MS);
    expect(emitted).toBe(false);
  }));
});
