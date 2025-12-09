import { Subject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import ActionEnum, {
  MechanicsActions, LifecycleActions, ProtocolActions
} from '@shared/types/enums/actions/';
import ViewStateService from '../../../../services/view-state';
import NetworkService from '../../../../services/network';
import { AppView } from '../../../../../types/enums';
import DuelDemoPageComponent from './duel.demo';

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type { MatchFoundContract, PingContract } from '@shared/types/contracts';
import type { OmitBaseAttrs } from '../../../../../types/OmitAttrs';


describe('DuelDemoPageComponent', () => {
  let fixture: ComponentFixture<DuelDemoPageComponent>;
  let component: DuelDemoPageComponent;
  let viewStateServiceSpy: jasmine.SpyObj<ViewStateService>;
  let networkServiceSpy: jasmine.SpyObj<NetworkService>;
  
  // Subjects to trigger events
  let disconnectSubject: Subject<void>;
  let packetSubjects: Map<ActionEnum, Subject<ActionEnum>>;

  beforeEach(async () => {
    disconnectSubject = new Subject<void>();
    packetSubjects = new Map();

    const viewStateSpy = jasmine.createSpyObj('ViewStateService', ['navigateToView'], {
      getNavigationData: jasmine.createSpy('getNavigationData')
    });
    
    const networkSpy = jasmine.createSpyObj('NetworkService', ['send', 'onDisconnect', 'onPacket']);
    networkSpy.onDisconnect.and.returnValue(disconnectSubject.asObservable());
    networkSpy.onPacket.and.callFake((action: ActionEnum) => {
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }
      return packetSubjects.get(action)!.asObservable();
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

  describe('Game Logic', () => {
    it('should navigate to catalogue on disconnect', () => {
      disconnectSubject.next();
      expect(viewStateServiceSpy.navigateToView).toHaveBeenCalledWith(AppView.CATALOGUE);
    });

    it('should handle GAME_INIT packet', () => {
      const mockInitData = {
        cellValues: Array(81).fill(0)
      };

      // Trigger GAME_INIT
      const action = LifecycleActions.GAME_INIT;
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }
      
      spyOn(component.gameState, 'initGameStates');
      packetSubjects.get(action)!.next(mockInitData as unknown as ActionEnum);

      expect(component.gameState.initGameStates).toHaveBeenCalledWith(mockInitData.cellValues);
    });

    it('should handle CELL_SET packet', () => {
      // Trigger CELL_SET
      const cellSetData = {
        playerID: 0,
        cellIndex: 0,
        value: 5,
        serverTime: 1000
      };
      
      const action = MechanicsActions.CELL_SET;
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }
      
      // Mock getPlayerBoard to return a spy object
      const mockBoard = jasmine.createSpyObj('Board', ['confirmCellSet']);
      spyOn(component.gameState, 'getPlayerBoard').and.returnValue(mockBoard);

      packetSubjects.get(action)!.next(cellSetData as unknown as ActionEnum);

      expect(component.gameState.getPlayerBoard).toHaveBeenCalledWith(0);
      expect(mockBoard.confirmCellSet).toHaveBeenCalledWith(0, 5, 1000);
    });

    it('should handle PING packet', () => {
      const pingData: PingContract = {
        serverTime: 2000,
        clientPing: 100
      };

      const action = ProtocolActions.PING;
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }

      spyOn(component.gameState, 'handlePing').and.callThrough();
      packetSubjects.get(action)!.next(pingData as unknown as ActionEnum);

      expect(component.gameState.handlePing).toHaveBeenCalled();
    });

    it('should send packet on request', () => {
      const action = MechanicsActions.CELL_SET;
      const data = { cellIndex: 0, value: 5 };
      
      const request = { action, ...data } as unknown as 
        OmitBaseAttrs<AugmentAction<MechanicsActions>>;
      
      component.onPacketRequest(request);
      
      expect(networkServiceSpy.send).toHaveBeenCalledWith(action, jasmine.objectContaining(data));
    });

    it('should load match data from navigation service on init', () => {
      const mockMatchData: MatchFoundContract = {
        myID: 1,
        players: [
          { playerID: 1, username: 'Player1' },
          { playerID: 2, username: 'Player2' }
        ]
      };

      (viewStateServiceSpy.getNavigationData as jasmine.Spy).and.returnValue(mockMatchData);
      
      // Re-init component to trigger ngOnInit
      component.ngOnInit();

      expect(viewStateServiceSpy.getNavigationData).toHaveBeenCalled();
      expect(component.gameState.myID).toBe(1);
    });

    it('should clear match data on destroy', () => {
      spyOn(component.gameState, 'clearMatchData');
      component.ngOnDestroy();
      expect(component.gameState.clearMatchData).toHaveBeenCalled();
    });
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


});
