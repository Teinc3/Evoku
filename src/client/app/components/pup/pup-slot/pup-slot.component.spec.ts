import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';

import PupSlotComponent from './pup-slot.component';


describe('PupSlotComponent', () => {
  let component: PupSlotComponent;
  let fixture: ComponentFixture<PupSlotComponent>;
  let debugElement: DebugElement;

  beforeEach(async () => {
    // Spy on Math.random globally for all tests
    spyOn(Math, 'random');

    await TestBed.configureTestingModule({
      imports: [PupSlotComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PupSlotComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;

    // Reset component state for each test (ngOnInit may have run during creation)
    component['pupIcon'] = null;
    component['level'] = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should generate a pup when Math.random returns < 0.7', () => {
      (Math.random as jasmine.Spy).and.returnValue(0.5);
      component.ngOnInit();

      expect(component['pupIcon']).toBeTruthy();
      expect(component['level']).toBeGreaterThanOrEqual(1);
      expect(component['level']).toBeLessThanOrEqual(5);
    });

    it('should not generate a pup when Math.random returns >= 0.7', () => {
      (Math.random as jasmine.Spy).and.returnValue(0.8);
      component.ngOnInit();

      expect(component['pupIcon']).toBeNull();
      expect(component['level']).toBeNull();
    });
  });

  describe('template rendering', () => {
    beforeEach(() => {
      // Reset component state for each test
      component['pupIcon'] = null;
      component['level'] = null;
    });

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
      component['pupIcon'] = 'test-icon.svg';
      fixture.detectChanges();

      const slot = debugElement.nativeElement.querySelector('.slot');
      expect(slot.classList.contains('occupied')).toBe(true);
    });

    it('should not apply occupied class when pupIcon is null', () => {
      component['pupIcon'] = null;
      fixture.detectChanges();

      const slot = debugElement.nativeElement.querySelector('.slot');
      expect(slot.classList.contains('occupied')).toBe(false);
    });

    it('should render pup icon when present', () => {
      component['pupIcon'] = 'test-icon.svg';
      fixture.detectChanges();

      const icon = debugElement.nativeElement.querySelector('.pup-icon');
      expect(icon).toBeTruthy();
      expect(icon.src).toContain('test-icon.svg');
    });

    it('should not render pup icon when null', () => {
      component['pupIcon'] = null;
      fixture.detectChanges();

      const icon = debugElement.nativeElement.querySelector('.pup-icon');
      expect(icon).toBeFalsy();
    });

    it('should render level when present', () => {
      component['level'] = 3;
      fixture.detectChanges();

      const level = debugElement.nativeElement.querySelector('.level');
      expect(level).toBeTruthy();
      expect(level.textContent.trim()).toBe('3');
    });

    it('should not render level when null', () => {
      component['level'] = null;
      fixture.detectChanges();

      const level = debugElement.nativeElement.querySelector('.level');
      expect(level).toBeFalsy();
    });
  });

  describe('random pup generation integration', () => {
    beforeEach(() => {
      // Reset component state
      component['pupIcon'] = null;
      component['level'] = null;
    });

    it('should generate different pups on multiple instantiations', () => {
      const instances: PupSlotComponent[] = [];

      // Create multiple instances with different random values
      const randomValues = [0.3, 0.8, 0.2, 0.9, 0.1, 0.7, 0.4, 0.6, 0.5, 0.85];
      let valueIndex = 0;

      (Math.random as jasmine.Spy).and.callFake(
        () => randomValues[valueIndex++ % randomValues.length]
      );

      // Create multiple instances
      for (let i = 0; i < 10; i++) {
        const newFixture = TestBed.createComponent(PupSlotComponent);
        const newComponent = newFixture.componentInstance;
        newComponent.ngOnInit();
        instances.push(newComponent);
      }

      // Check for variety (some have pups, some don't)
      const withPups = instances.filter(inst => inst['pupIcon'] !== null);
      const withoutPups = instances.filter(inst => inst['pupIcon'] === null);

      expect(withPups.length).toBeGreaterThan(0);
      expect(withoutPups.length).toBeGreaterThan(0);
    });

    it('should generate valid pup icons from config', () => {
      // Force pup generation
      (Math.random as jasmine.Spy).and.returnValue(0.5);
      component.ngOnInit();

      expect(component['pupIcon']).toMatch(/\.svg$/);
      expect(component['pupIcon']).toBeTruthy();
      // Check that it's one of the expected icons from config
      const expectedIcons = [
        '/assets/pup/icons/cryo.svg',
        '/assets/pup/icons/cascade.svg',
        '/assets/pup/icons/inferno.svg',
        '/assets/pup/icons/metabolic.svg',
        '/assets/pup/icons/entangle.svg',
        '/assets/pup/icons/wisdom.svg',
        '/assets/pup/icons/landslide.svg',
        '/assets/pup/icons/excavate.svg',
        '/assets/pup/icons/lock.svg',
        '/assets/pup/icons/forge.svg'
      ];
      expect(expectedIcons).toContain(component['pupIcon']!);
    });
  });
});