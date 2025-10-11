import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import TimeAttackDemoPageComponent from './time-attack.demo';


describe('TimeAttackDemoPageComponent', () => {
  let fixture: ComponentFixture<TimeAttackDemoPageComponent>;
  let component: TimeAttackDemoPageComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeAttackDemoPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeAttackDemoPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Phase Timer Section', () => {
    it('should render phase timer at the top', () => {
      const phaseTimer = fixture.debugElement.query(By.css('app-phase-timer'));
      expect(phaseTimer).toBeTruthy();
    });

    it('should set time and progress correctly on phase timer', () => {
      const phaseTimer = fixture.debugElement.query(By.css('app-phase-timer'));
      expect(phaseTimer.componentInstance).toBeTruthy();

      // Verify computed values from inputs [timeMs]="120000" and [percentage]="50"
      // Access protected members in tests via bracket indexing
      const timeText = phaseTimer.componentInstance['timeText']();
      const dashOffset = phaseTimer.componentInstance['dashOffset']();
      expect(timeText).toBe('02:00');
      expect(dashOffset).toBe(50);
    });
  });

  describe('Center Section - Board and Progress Bars', () => {
    it('should render center section with board-and-utilities class', () => {
      const center = fixture.debugElement.query(By.css('.board-and-utilities'));
      expect(center).toBeTruthy();
    });

    it('should render single board for time attack mode', () => {
      const boards = fixture.debugElement.queryAll(
        By.css('.board-and-utilities app-board-model')
      );
      expect(boards.length).toBe(1);
    });

    it('should render exactly 2 vertical progress bars in the center', () => {
      const progressBars = fixture.debugElement.queryAll(
        By.css('.board-and-utilities app-universal-progress-bar')
      );
      expect(progressBars.length).toBe(2);
      progressBars.forEach(bar => {
        expect(bar.componentInstance.isVertical).toBeTrue();
      });
    });

    it('should set expected percentages on both progress bars', () => {
      const pupBar = fixture.debugElement.query(By.css('.board-and-utilities .pup-bar'));
      const boardBar = fixture.debugElement.query(By.css('.board-and-utilities .board-bar'));
      expect(pupBar.componentInstance.percentage).toBe(60);
      expect(boardBar.componentInstance.percentage).toBe(45);
    });

    it('should render in order: PUP bar, board, board bar, utilities', () => {
      const center = fixture.debugElement.query(By.css('.board-and-utilities'));
      const children = Array.from(center.nativeElement.children) as Element[];
      expect(children.length).toBe(4);

      // 1. PUP bar
      expect(children[0].tagName.toLowerCase()).toBe('app-universal-progress-bar');
      expect(children[0].classList.contains('pup-bar')).toBeTrue();
      // 2. Board
      expect(children[1].tagName.toLowerCase()).toBe('app-board-model');
      // 3. Board progress bar
      expect(children[2].tagName.toLowerCase()).toBe('app-universal-progress-bar');
      expect(children[2].classList.contains('board-bar')).toBeTrue();
      // 4. Utilities holder
      expect(children[3].tagName.toLowerCase()).toBe('app-utility-buttons-holder');
    });
  });

  describe('Bottom HUD Section', () => {
    it('should render bottom HUD with bottom-hud class', () => {
      const bottom = fixture.debugElement.query(By.css('.bottom-hud'));
      expect(bottom).toBeTruthy();
    });

    it('should render PUP orb spinner with orb class', () => {
      const orb = fixture.debugElement.query(By.css('.bottom-hud .orb'));
      expect(orb).toBeTruthy();
      expect(orb.nativeElement.tagName.toLowerCase()).toBe('app-pup-orb-spinner');
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

    it('should render in order: orb, slots, numeric buttons', () => {
      const bottom = fixture.debugElement.query(By.css('.bottom-hud'));
      const children = Array.from(bottom.nativeElement.children) as Element[];
      const tagNames = children.map(el => el.tagName.toLowerCase());

      expect(tagNames[0]).toBe('app-pup-orb-spinner'); // orb
      expect(tagNames[1]).toBe('app-pup-slots-holder'); // slots
      expect(tagNames[2]).toBe('app-numeric-buttons-holder'); // numeric buttons
    });
  });

  describe('Component Integration', () => {
    it('should initialize board with puzzle on ngOnInit', () => {
      expect(component.board).toBeTruthy();
      expect(component.board.model).toBeTruthy();
      expect(component.board.model.board.length).toBe(81);
    });

    it('should have auto-accept pending enabled for demo mode', () => {
      expect(component.board.model.autoAcceptPending).toBeTrue();
    });

    it('should connect numeric buttons to board parseNumberKey', () => {
      const numericButtons = fixture.debugElement.query(
        By.css('app-numeric-buttons-holder')
      );
      const spy = spyOn(component.board, 'parseNumberKey');

      // Simulate number click event
      numericButtons.componentInstance.numberClick.emit(5);
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith(5);
    });

    it('should connect utility buttons to board actions', () => {
      const utilities = fixture.debugElement.query(By.css('app-utility-buttons-holder'));
      const spy = spyOn(component.board, 'onUtilityAction');

      // Simulate utility action
      utilities.componentInstance.utilityClick.emit(0); // arbitrary action
      fixture.detectChanges();

      expect(spy).toHaveBeenCalled();
    });
  });
});
