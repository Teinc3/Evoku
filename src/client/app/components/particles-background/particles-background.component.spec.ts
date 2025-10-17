import { ComponentFixture, TestBed } from '@angular/core/testing';

import ParticlesBackgroundComponent from './particles-background.component';


describe('ParticlesBackgroundComponent', () => {
  let fixture: ComponentFixture<ParticlesBackgroundComponent>;
  let component: ParticlesBackgroundComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParticlesBackgroundComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ParticlesBackgroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have particles options configured', () => {
    expect(component['particlesOptions']).toBeDefined();
    expect(component['particlesOptions'].fpsLimit).toBe(60);
    expect(component['particlesOptions'].detectRetina).toBe(true);
  });

  it('should have Neon Yin-Yang theme colors', () => {
    const colors = component['particlesOptions'].particles?.color?.value;
    expect(colors).toEqual(['#00ffff', '#ff00ff', '#ffffff']);
  });

  it('should have subtle opacity and speed settings', () => {
    expect(component['particlesOptions'].particles?.opacity?.value).toBe(0.5);
    expect(component['particlesOptions'].particles?.move?.speed).toBe(1);
  });

  it('should have hover repulse interaction enabled', () => {
    expect(component['particlesOptions'].interactivity?.events?.onHover?.enable).toBe(true);
    expect(component['particlesOptions'].interactivity?.events?.onHover?.mode).toBe('repulse');
  });

  it('should have particles configuration defined', () => {
    const particlesOptions = component['particlesOptions'];
    expect(particlesOptions.particles).toBeDefined();
  });

  it('should have particlesInit method', () => {
    expect(typeof component['particlesInit']).toBe('function');
  });
});
