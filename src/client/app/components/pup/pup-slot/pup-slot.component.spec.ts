import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';

import PupSlotComponent from './pup-slot.component';


describe('PupSlotComponent', () => {
  let component: PupSlotComponent;
  let fixture: ComponentFixture<PupSlotComponent>;
  let debugElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PupSlotComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PupSlotComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;

    // Reset component state after automatic ngOnInit call
    component['pupIcon'] = null;
    component['level'] = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should generate a pup when Math.random returns < 0.7', () => {
      // < 0.7 for generation, then values for selection and level
      spyOn(Math, 'random').and.returnValues(0.5, 0.1, 0.2);
      component.ngOnInit();
      fixture.detectChanges();

      const icon = debugElement.nativeElement.querySelector('.pup-icon');
      const level = debugElement.nativeElement.querySelector('.level');
      expect(icon).toBeTruthy();
      expect(level).toBeTruthy();
      expect(level.textContent.trim()).toMatch(/^[1-5]$/);
    });

    it('should not generate a pup when Math.random returns >= 0.7', () => {
      spyOn(Math, 'random').and.returnValue(0.8);
      component.ngOnInit();
      fixture.detectChanges();

      const icon = debugElement.nativeElement.querySelector('.pup-icon');
      const level = debugElement.nativeElement.querySelector('.level');
      expect(icon).toBeFalsy();
      expect(level).toBeFalsy();
    });
  });

  describe('template rendering', () => {

    it('should render slot wrapper', () => {
      fixture.detectChanges();
      const wrapper = debugElement.nativeElement.querySelector('.slot-wrapper');
      expect(wrapper).toBeTruthy();
    });

    it('should render slot element', () => {
      fixture.detectChanges();
      const slot = debugElement.nativeElement.querySelector('.slot');
      expect(slot).toBeTruthy();
    });

    it('should apply occupied class when pupIcon is present', () => {
      // Create a fresh component instance that generates a pup
      spyOn(Math, 'random').and.returnValues(0.5, 0.1, 0.2);
      const freshFixture = TestBed.createComponent(PupSlotComponent);
      freshFixture.componentInstance.ngOnInit();
      freshFixture.detectChanges();

      const slot = freshFixture.nativeElement.querySelector('.slot');
      expect(slot.classList.contains('occupied')).toBe(true);
    });

    it('should not apply occupied class when pupIcon is null', () => {
      // Create a fresh component instance that doesn't generate a pup
      spyOn(Math, 'random').and.returnValue(0.8);
      const freshFixture = TestBed.createComponent(PupSlotComponent);
      freshFixture.componentInstance.ngOnInit();
      freshFixture.detectChanges();

      const slot = freshFixture.nativeElement.querySelector('.slot');
      expect(slot.classList.contains('occupied')).toBe(false);
    });

    it('should render pup icon when present', () => {
      // Create a fresh component instance that generates a pup
      spyOn(Math, 'random').and.returnValues(0.5, 0.1, 0.2);
      const freshFixture = TestBed.createComponent(PupSlotComponent);
      freshFixture.componentInstance.ngOnInit();
      freshFixture.detectChanges();

      const icon = freshFixture.nativeElement.querySelector('.pup-icon') as HTMLImageElement;
      expect(icon).toBeTruthy();
      expect(icon.src).toMatch(/\.svg$/);
    });

    it('should not render pup icon when null', () => {
      // Create a fresh component instance that doesn't generate a pup
      spyOn(Math, 'random').and.returnValue(0.8);
      const freshFixture = TestBed.createComponent(PupSlotComponent);
      freshFixture.componentInstance.ngOnInit();
      freshFixture.detectChanges();

      const icon = freshFixture.nativeElement.querySelector('.pup-icon');
      expect(icon).toBeFalsy();
    });

    it('should render level when present', () => {
      // Create a fresh component instance that generates a pup
      spyOn(Math, 'random').and.returnValues(0.5, 0.1, 0.2);
      const freshFixture = TestBed.createComponent(PupSlotComponent);
      freshFixture.componentInstance.ngOnInit();
      freshFixture.detectChanges();

      const level = freshFixture.nativeElement.querySelector('.level');
      expect(level).toBeTruthy();
      expect(level.textContent.trim()).toMatch(/^[1-5]$/);
    });

    it('should not render level when null', () => {
      // Create a fresh component instance that doesn't generate a pup
      spyOn(Math, 'random').and.returnValue(0.8);
      const freshFixture = TestBed.createComponent(PupSlotComponent);
      freshFixture.componentInstance.ngOnInit();
      freshFixture.detectChanges();

      const level = freshFixture.nativeElement.querySelector('.level');
      expect(level).toBeFalsy();
    });
  });

  describe('random pup generation integration', () => {
    it('should generate different pups on multiple instantiations', () => {
      const instances: ComponentFixture<PupSlotComponent>[] = [];

      // Test with controlled random values to ensure some generate pups, some don't
      spyOn(Math, 'random').and.returnValues(
        0.5,  // Instance 1: < 0.7 -> generates pup
        0.8   // Instance 2: >= 0.7 -> no pup
      );

      // Create 2 instances with controlled randomness
      for (let i = 0; i < 2; i++) {
        const newFixture = TestBed.createComponent(PupSlotComponent);
        const newComponent = newFixture.componentInstance;
        newComponent.ngOnInit();
        newFixture.detectChanges();
        instances.push(newFixture);
      }

      // Check that we have one with pup and one without
      const withPups = instances.filter(fixture =>
        fixture.nativeElement.querySelector('.pup-icon') !== null
      );
      const withoutPups = instances.filter(fixture =>
        fixture.nativeElement.querySelector('.pup-icon') === null
      );

      expect(withPups.length).toBe(1);
      expect(withoutPups.length).toBe(1);
    });

    it('should generate valid pup icons from config', () => {
      // Force pup generation: < 0.7 for generation, then values for pup selection and level
      spyOn(Math, 'random').and.returnValues(0.5, 0.1, 0.2);
      component.ngOnInit();
      fixture.detectChanges();

      const icon = debugElement.nativeElement.querySelector('.pup-icon') as HTMLImageElement;
      expect(icon).toBeTruthy();
      expect(icon.src).toMatch(/\.svg$/);
      // Check that it's one of the expected icons from config
      const expectedIcons = [
        '/assets/pup/icons/cryo.svg',
        '/assets/pup/icons/purity.svg',
        '/assets/pup/icons/inferno.svg',
        '/assets/pup/icons/metabolic.svg',
        '/assets/pup/icons/entangle.svg',
        '/assets/pup/icons/wisdom.svg',
        '/assets/pup/icons/landslide.svg',
        '/assets/pup/icons/excavate.svg',
        '/assets/pup/icons/lock.svg',
        '/assets/pup/icons/forge.svg'
      ];
      expect(expectedIcons.some(expectedIcon => icon.src.includes(expectedIcon))).toBe(true);
    });
  });
});