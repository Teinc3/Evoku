import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import ViewStateService from '../../../../services/view-state.service';
import NetworkService from '../../../../services/network.service';
import DuelDemoPageComponent from './duel.demo';

import type MatchFoundContract from '@shared/types/contracts/system/lobby/MatchFoundContract';


describe('DuelDemoPageComponent', () => {
  let fixture: ComponentFixture<DuelDemoPageComponent>;
  let component: DuelDemoPageComponent;
  let viewStateServiceSpy: jasmine.SpyObj<ViewStateService>;
  let networkServiceSpy: jasmine.SpyObj<NetworkService>;

  beforeEach(async () => {
    const viewStateSpy = jasmine.createSpyObj('ViewStateService', [], {
      getNavigationData: jasmine.createSpy('getNavigationData')
    });
    const networkSpy = jasmine.createSpyObj('NetworkService', [], {
      onDisconnect: jasmine.createSpy('onDisconnect').and.returnValue({
        subscribe: jasmine.createSpy('subscribe')
      })
    });

    await TestBed.configureTestingModule({
      imports: [DuelDemoPageComponent],
      providers: [
        { provide: ViewStateService, useValue: viewStateSpy },
        { provide: NetworkService, useValue: networkSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DuelDemoPageComponent);
    component = fixture.componentInstance;
    viewStateServiceSpy = TestBed.inject(ViewStateService) as jasmine.SpyObj<ViewStateService>;
    networkServiceSpy = TestBed.inject(NetworkService) as jasmine.SpyObj<NetworkService>;
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

  // Layout assertions: prefer presence and wiring checks (avoid brittle exact DOM snapshots)
  describe('Layout sanity checks', () => {
    it('should render top, center and bottom sections and main components', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-duel-hud-top')).toBeTruthy();
      expect(compiled.querySelector('.hud-centre')).toBeTruthy();
      expect(compiled.querySelector('.hud-bottom')).toBeTruthy();

      // essential children are present
      expect(compiled.querySelectorAll('app-board-model').length).toBeGreaterThanOrEqual(2);
      expect(compiled.querySelector('app-pup-orb-spinner')).toBeTruthy();
      expect(compiled.querySelector('app-numeric-buttons-holder')).toBeTruthy();
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
      
      // Verify that center bars have isVertical = true
      centerBars.forEach(bar => {
        expect(bar.componentInstance.isVertical).toBe(true);
      });
    });
  });

  describe('Component Lifecycle and Navigation Data', () => {
    it('should load match data from navigation service when available', () => {
      const mockMatchData: MatchFoundContract = {
        myID: 1,
        players: [
          { playerID: 1, username: 'Player1' },
          { playerID: 2, username: 'Player2' }
        ]
      };

      // Mock the service to return navigation data
      (viewStateServiceSpy.getNavigationData as jasmine.Spy).and.returnValue(mockMatchData);

      // Create a new component instance to test ngOnInit
      const newComponent = new DuelDemoPageComponent(viewStateServiceSpy, networkServiceSpy);
      spyOn(newComponent['matchState'], 'setMatchData');

      newComponent.ngOnInit();

      expect(viewStateServiceSpy.getNavigationData).toHaveBeenCalled();
      expect(newComponent['matchState'].setMatchData).toHaveBeenCalledWith(mockMatchData);
    });

    it('should not set match data when navigation data is null', () => {
      // Mock the service to return null
      (viewStateServiceSpy.getNavigationData as jasmine.Spy).and.returnValue(null);

      // Create a new component instance to test ngOnInit
      const newComponent = new DuelDemoPageComponent(viewStateServiceSpy, networkServiceSpy);
      spyOn(newComponent['matchState'], 'setMatchData');

      newComponent.ngOnInit();

      expect(viewStateServiceSpy.getNavigationData).toHaveBeenCalled();
      expect(newComponent['matchState'].setMatchData).not.toHaveBeenCalled();
    });

    it('should clear match data on destroy', () => {
      const newComponent = new DuelDemoPageComponent(viewStateServiceSpy, networkServiceSpy);
      spyOn(newComponent['matchState'], 'clearMatchData');

      newComponent.ngOnDestroy();

      expect(newComponent['matchState'].clearMatchData).toHaveBeenCalled();
    });
  });
});
