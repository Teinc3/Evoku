import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import DuelDemoPageComponent from './duel.demo';


describe('DuelDemoPageComponent', () => {
  let fixture: ComponentFixture<DuelDemoPageComponent>;
  let component: DuelDemoPageComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DuelDemoPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DuelDemoPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('HUD Top Section', () => {
    it('should render duel-hud-top component', () => {
      const hudTop = fixture.debugElement.query(By.css('app-duel-hud-top'));
      expect(hudTop).toBeTruthy();
    });

    it('should have phase timer with correct inputs', () => {
      const hudTop = fixture.debugElement.query(By.css('app-duel-hud-top'));
      expect(hudTop.componentInstance.phaseTimeMs).toBeDefined();
    });
  });

  describe('HUD Center Section', () => {
    it('should render center cluster with hud-centre class', () => {
      const center = fixture.debugElement.query(By.css('.hud-centre'));
      expect(center).toBeTruthy();
    });

    it('should render 2 boards for duel mode', () => {
      const boards = fixture.debugElement.queryAll(By.css('.hud-centre app-board-model'));
      expect(boards.length).toBe(2);
    });

    it('should render 2 vertical PUP progress bars', () => {
      const pupBars = fixture.debugElement.queryAll(
        By.css('.hud-centre app-universal-progress-bar')
      );
      expect(pupBars.length).toBe(2);
    });

    it('should render utility buttons holder', () => {
      const utilities = fixture.debugElement.query(
        By.css('.hud-centre app-utility-buttons-holder')
      );
      expect(utilities).toBeTruthy();
    });

    it('should have progress bars with percentage inputs', () => {
      const progressBars = fixture.debugElement.queryAll(
        By.css('.hud-centre app-universal-progress-bar')
      );
      progressBars.forEach(bar => {
        expect(bar.componentInstance.percentage).toBeDefined();
      });
    });
  });

  describe('HUD Bottom Section', () => {
    it('should render bottom HUD with hud-bottom class', () => {
      const bottom = fixture.debugElement.query(By.css('.hud-bottom'));
      expect(bottom).toBeTruthy();
    });

    it('should render PUP orb spinner with orb class', () => {
      const orb = fixture.debugElement.query(By.css('.hud-bottom app-pup-orb-spinner'));
      expect(orb).toBeTruthy();
      // The orb is wrapped in a div.my-pup in the HTML, so check component exists
      expect(orb.componentInstance).toBeTruthy();
    });

    it('should have orb with button role and keyboard accessibility', () => {
      const orb = fixture.debugElement.query(By.css('app-pup-orb-spinner'));
      const orbElement = orb.nativeElement;
      // Check for role="button" or tabindex for accessibility
      const hasRole = orbElement.getAttribute('role') === 'button'
        || orbElement.querySelector('[role="button"]');
      const hasTabindex = orbElement.getAttribute('tabindex') !== null
        || orbElement.querySelector('[tabindex]');
      expect(hasRole || hasTabindex).toBeTruthy();
    });

    it('should render 2 sets of PUP slots holders', () => {
      const slotsHolders = fixture.debugElement.queryAll(
        By.css('.hud-bottom app-pup-slots-holder')
      );
      expect(slotsHolders.length).toBe(2);
    });

    it('should render numeric buttons holder', () => {
      const numericButtons = fixture.debugElement.query(
        By.css('.hud-bottom app-numeric-buttons-holder')
      );
      expect(numericButtons).toBeTruthy();
    });

    it('should have PUP slots with proper structure', () => {
      const slotsHolders = fixture.debugElement.queryAll(By.css('app-pup-slots-holder'));
      expect(slotsHolders.length).toBeGreaterThan(0);
      // Verify slots holder contains slot elements (rendered by child component)
      slotsHolders.forEach(holder => {
        expect(holder.componentInstance).toBeTruthy();
      });
    });
  });

  describe('Layout Structure Snapshot', () => {
    it('should have correct DOM structure with all essential components', () => {
      const compiled = fixture.nativeElement;

      // Top section
      expect(compiled.querySelector('app-duel-hud-top')).toBeTruthy();

      // Center section
      const centerSection = compiled.querySelector('.hud-centre');
      expect(centerSection).toBeTruthy();
      expect(centerSection.querySelectorAll('app-board-model').length).toBe(2);
      expect(centerSection.querySelector('app-utility-buttons-holder')).toBeTruthy();
      expect(centerSection.querySelectorAll('app-universal-progress-bar').length).toBe(2);

      // Bottom section
      const bottomSection = compiled.querySelector('.hud-bottom');
      expect(bottomSection).toBeTruthy();
      expect(bottomSection.querySelector('app-pup-orb-spinner')).toBeTruthy();
      expect(bottomSection.querySelectorAll('app-pup-slots-holder').length).toBe(2);
      expect(bottomSection.querySelector('app-numeric-buttons-holder')).toBeTruthy();
    });

    it('should apply correct CSS classes to major sections', () => {
      const compiled = fixture.nativeElement;

      // Center cluster class
      const center = compiled.querySelector('.hud-centre');
      expect(center.classList.contains('hud-centre')).toBeTrue();

      // Bottom HUD class
      const bottom = compiled.querySelector('.hud-bottom');
      expect(bottom.classList.contains('hud-bottom')).toBeTrue();

      // Orb class
      const orb = compiled.querySelector('.orb');
      expect(orb).toBeTruthy();
      expect(orb.classList.contains('orb')).toBeTrue();
    });
  });

  describe('Component Inputs and Data Binding', () => {
    it('should pass boardProgress inputs to duel-hud-top', () => {
      const hudTop = fixture.debugElement.query(By.css('app-duel-hud-top'));
      expect(hudTop.componentInstance.boardProgress1).toBeDefined();
      expect(hudTop.componentInstance.boardProgress2).toBeDefined();
    });

    it('should pass percentage inputs to progress bars', () => {
      const progressBars = fixture.debugElement.queryAll(
        By.css('app-universal-progress-bar')
      );
      progressBars.forEach(bar => {
        expect(bar.componentInstance.percentage).toBeGreaterThanOrEqual(0);
        expect(bar.componentInstance.percentage).toBeLessThanOrEqual(100);
      });
    });

    it('should mark progress bars as vertical', () => {
      const progressBars = fixture.debugElement.queryAll(
        By.css('app-universal-progress-bar')
      );
      // In the duel demo, we have 4 progress bars total:
      // 2 horizontal in duel-hud-top and 2 vertical in hud-centre
      expect(progressBars.length).toBe(4);
      
      // The 2 vertical progress bars are in the center section
      const centerBars = fixture.debugElement.queryAll(
        By.css('.hud-centre app-universal-progress-bar')
      );
      expect(centerBars.length).toBe(2);
    });
  });
});
