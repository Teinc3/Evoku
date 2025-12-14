import { ComponentFixture, TestBed } from '@angular/core/testing';

import PupSlotComponent from './pup-slot.component';


describe('PupSlotComponent', () => {
  let component: PupSlotComponent;
  let fixture: ComponentFixture<PupSlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PupSlotComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PupSlotComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit use when slot is ready and clicked', () => {
    const useSpy = jasmine.createSpy('use');
    component.use.subscribe(useSpy);
    component.pup = {
      pupID: 1,
      name: 'Cryo',
      icon: '/assets/pup/icons/cryo.svg',
      status: 'ready'
    };

    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.slot');
    button.click();

    expect(useSpy).toHaveBeenCalled();
  });

  it('should not emit when disabled or empty', () => {
    const useSpy = jasmine.createSpy('use');
    component.use.subscribe(useSpy);
    component.disabled = true;
    component.pup = {
      pupID: null,
      name: null,
      icon: null,
      status: 'empty'
    };

    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.slot');
    button.click();

    expect(useSpy).not.toHaveBeenCalled();
  });

  it('should render icon and name when provided', () => {
    component.pup = {
      pupID: 2,
      name: 'Purity',
      icon: '/assets/pup/icons/purity.svg',
      status: 'ready'
    };

    fixture.detectChanges();

    const icon = fixture.nativeElement.querySelector('.pup-icon') as HTMLImageElement;
    const name = fixture.nativeElement.querySelector('.pup-name') as HTMLElement;
    expect(icon).toBeTruthy();
    expect(icon.src).toContain('purity.svg');
    expect(name.textContent?.trim()).toBe('Purity');
  });

  it('should show cooldown badge when cooling down', () => {
    component.pup = {
      pupID: 3,
      name: 'Inferno',
      icon: '/assets/pup/icons/inferno.svg',
      status: 'cooldown',
      cooldownRemainingMs: 4200
    };

    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.cooldown-badge') as HTMLElement;
    expect(badge).toBeTruthy();
    expect(badge.textContent?.trim()).toContain('s');
  });
});
