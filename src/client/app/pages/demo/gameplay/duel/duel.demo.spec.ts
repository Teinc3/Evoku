import { Subject, type Observable } from 'rxjs';
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import MatchStatus from '@shared/types/enums/matchstatus';
import ActionEnum, {
  MechanicsActions,
  LifecycleActions,
  ProtocolActions,
  type PlayerActions,
  WaterPUPActions,
  FirePUPActions,
  WoodPUPActions,
  MetalPUPActions,
  EarthPUPActions
} from '@shared/types/enums/actions/';
import ViewStateService from '../../../../services/view-state';
import NetworkService from '../../../../services/network';
import { AppView } from '../../../../../types/enums';
import DuelDemoPageComponent from './duel.demo';

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type { IPlayerState } from '@shared/types/gamestate';
import type { MatchFoundContract, PingContract } from '@shared/types/contracts';
import type BoardModelComponent from '../../../../components/board/board.component';
import type { PupSlotState } from '../../../../../types/pup';
import type { OmitBaseAttrs } from '../../../../../types/OmitAttrs';
import type ClientBoardModel from '../../../../../models/Board';


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

    it('should handle PHASE_TRANSITION packet', () => {
      const mockData = { newPhase: 1 };
      const action = LifecycleActions.PHASE_TRANSITION;
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }

      packetSubjects.get(action)!.next(mockData as unknown as ActionEnum);

      expect(component.gameState.matchState.phase).toBe(1);
    });

    it('should handle UPDATE_PROGRESS packet for board progress', () => {
      const mockData = { playerID: 0, isBoard: true, progress: 50 };
      const action = ProtocolActions.UPDATE_PROGRESS;
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }

      // Mock player state
      const mockBoardState = { progress: 0 };
      const mockPlayerState = { gameState: { boardState: mockBoardState } };
      spyOn(component.gameState, 'getPlayerState').and.returnValue(
        mockPlayerState as unknown as IPlayerState<ClientBoardModel>
      );

      packetSubjects.get(action)!.next(mockData as unknown as ActionEnum);

      expect(mockBoardState.progress).toBe(50);
    });

    it('should handle UPDATE_PROGRESS packet for PUP progress', () => {
      const mockData = { playerID: 0, isBoard: false, progress: 75 };
      const action = ProtocolActions.UPDATE_PROGRESS;
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }

      // Mock player state
      const mockPlayerState = { gameState: { pupProgress: 0 } };
      spyOn(component.gameState, 'getPlayerState').and.returnValue(
        mockPlayerState as unknown as IPlayerState<ClientBoardModel>
      );

      packetSubjects.get(action)!.next(mockData as unknown as ActionEnum);

      expect(mockPlayerState.gameState.pupProgress).toBe(75);
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

    it('should handle CELL_SET packet for own actions using pending time', () => {
      // Initialize component subscriptions
      component.ngOnInit();

      // Prevent gameState.handlePacket from triggering again
      (component.gameState as unknown as { handlePacket: jasmine.Spy }).handlePacket =
        jasmine.createSpy('handlePacket').and.callFake(() => {});

      const cellSetData = {
        playerID: 1, // Own player
        cellIndex: 0,
        value: 5,
        serverTime: 1000,
        actionID: 123
      };

      // Mock pending action
      const mockPendingAction = {
        action: MechanicsActions.SET_CELL,
        actionID: 123,
        cellIndex: 0,
        value: 5,
        clientTime: 500
      };

      // Mock pendingActions Map
      const mockMap = jasmine.createSpyObj('Map', ['set', 'get', 'has', 'delete', 'clear']);
      mockMap.get.and.returnValue(mockPendingAction);
      mockMap.has.and.returnValue(true);
      Object.defineProperty(component.gameState, 'pendingActions',
        { value: mockMap, writable: true });
      (component.gameState as typeof component.gameState & { myID: number }).myID = 1;

      // Mock getPlayerBoard to return a spy object
      const mockBoard = jasmine.createSpyObj('Board', ['confirmCellSet']);
      spyOn(component.gameState, 'getPlayerBoard').and.returnValue(mockBoard);

      const action = MechanicsActions.CELL_SET;
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }

      packetSubjects.get(action)!.next(cellSetData as unknown as ActionEnum);

      expect(component.gameState.getPlayerBoard).toHaveBeenCalledWith(1);
      expect(mockBoard.confirmCellSet).toHaveBeenCalledWith(0, 5, 500);
      expect(mockMap.delete).toHaveBeenCalledWith(123);
    });

    it('should handle PHASE_TRANSITION packet', () => {
      const phaseData = { newPhase: 1 };
      const action = LifecycleActions.PHASE_TRANSITION;
      
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }
      
      packetSubjects.get(action)!.next(phaseData as unknown as ActionEnum);
      
      expect(component.gameState.matchState.phase).toBe(1);
    });

    it('should handle UPDATE_PROGRESS packet for board', () => {
      const progressData = {
        playerID: 0,
        isBoard: true,
        progress: 50
      };
      const action = ProtocolActions.UPDATE_PROGRESS;
      
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }
      
      // Mock getPlayerState
      const mockBoardState = { progress: 0 };
      const mockGameState = { boardState: mockBoardState };
      spyOn(component.gameState, 'getPlayerState').and.returnValue({ 
        gameState: mockGameState 
      } as unknown as IPlayerState<ClientBoardModel>);
      
      packetSubjects.get(action)!.next(progressData as unknown as ActionEnum);
      
      expect(mockBoardState.progress).toBe(50);
    });

    it('should handle UPDATE_PROGRESS packet for PUP', () => {
      const progressData = {
        playerID: 0,
        isBoard: false,
        progress: 75
      };
      const action = ProtocolActions.UPDATE_PROGRESS;
      
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }
      
      // Mock getPlayerState
      const mockGameState = { pupProgress: 0 };
      spyOn(component.gameState, 'getPlayerState').and.returnValue({ 
        gameState: mockGameState 
      } as unknown as IPlayerState<ClientBoardModel>);
      
      packetSubjects.get(action)!.next(progressData as unknown as ActionEnum);
      
      expect(mockGameState.pupProgress).toBe(75);
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
        OmitBaseAttrs<AugmentAction<PlayerActions>>;
      
      component.onPacketRequest(request);
      
      expect(networkServiceSpy.send).toHaveBeenCalledWith(action, jasmine.objectContaining(data));
    });

    it('should load match data from navigation service on init', () => {
      const mockMatchData: MatchFoundContract = {
        myID: 1,
        players: [
          { playerID: 1, username: 'Player1', elo: 1000 },
          { playerID: 2, username: 'Player2', elo: 1000 }
        ]
      };

      (viewStateServiceSpy.getNavigationData as jasmine.Spy).and.returnValue(mockMatchData);
      
      // Re-init component to trigger ngOnInit
      component.ngOnInit();

      expect(viewStateServiceSpy.getNavigationData).toHaveBeenCalled();
      expect(component.gameState.myID).toBe(1);
    });

    it('should handle REJECT_ACTION packet and remove pending action', () => {
      // Initialize component subscriptions
      component.ngOnInit();

      const rejectData = {
        actionID: 123
      };

      // Mock pending action
      const mockAction = {
        action: MechanicsActions.SET_CELL,
        actionID: 123,
        cellIndex: 5,
        value: 7,
        clientTime: Date.now()
      };
      component.gameState.pendingActions.set(123, mockAction);

      // Mock board1 component
      const mockBoard1 = jasmine.createSpyObj('BoardModelComponent', ['handleCellRejection']);
      component.board1 = mockBoard1 as unknown as BoardModelComponent;

      const action = ProtocolActions.REJECT_ACTION;
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }

      packetSubjects.get(action)!.next(rejectData as unknown as ActionEnum);

      expect(component.gameState.pendingActions.has(123)).toBeFalse();
      expect(mockBoard1.handleCellRejection).toHaveBeenCalledWith(5, 7);
    });

    it('onBoardSelectionChanged clears selection on other board for mutual exclusivity', () => {
      // Mock board components
      const board1Spy = jasmine.createSpyObj('BoardModelComponent', [], { selected: signal(5) });
      const board2Spy = jasmine.createSpyObj('BoardModelComponent', [], { selected: signal(null) });
      
      // Access private properties
      component.board1 = board1Spy as unknown as BoardModelComponent;
      component.board2 = board2Spy as unknown as BoardModelComponent;

      // Select on board 0, should clear board 1
      component.onBoardSelectionChanged(0);
      expect(board2Spy.selected()).toBeNull();

      // Reset
      board1Spy.selected.set(null);
      board2Spy.selected.set(10);

      // Select on board 1, should clear board 0
      component.onBoardSelectionChanged(1);
      expect(board1Spy.selected()).toBeNull();
    });

    it('should handle GAME_OVER packet and set match status to ENDED', () => {
      const mockData = { winnerID: 0, reason: 0, eloChange: 40 };
      const action = LifecycleActions.GAME_OVER;
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }

      // Set initial status to ONGOING
      component.gameState.matchState.status = MatchStatus.ONGOING;

      packetSubjects.get(action)!.next(mockData as unknown as ActionEnum);

      expect(component.gameState.matchState.status as MatchStatus).toBe(MatchStatus.ENDED);
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
      expect(hudTop.componentInstance.startTime).toBeDefined();
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
          { playerID: 1, username: 'Player1', elo: 1000 },
          { playerID: 2, username: 'Player2', elo: 1000 }
        ]
      };

      // Mock the service to return navigation data
      (viewStateServiceSpy.getNavigationData as jasmine.Spy).and.returnValue(mockMatchData);

      // Create a new component instance to test ngOnInit
      const newComponent = new DuelDemoPageComponent(viewStateServiceSpy, networkServiceSpy);
      spyOn(newComponent['gameState'], 'createGame');

      newComponent.ngOnInit();

      expect(viewStateServiceSpy.getNavigationData).toHaveBeenCalled();
      expect(newComponent['gameState'].createGame).toHaveBeenCalledWith(mockMatchData);
    });

    it('should not set match data when navigation data is null', () => {
      // Mock the service to return null
      (viewStateServiceSpy.getNavigationData as jasmine.Spy).and.returnValue(null);

      // Create a new component instance to test ngOnInit
      const newComponent = new DuelDemoPageComponent(viewStateServiceSpy, networkServiceSpy);
      spyOn(newComponent['gameState'], 'createGame');

      newComponent.ngOnInit();

      expect(viewStateServiceSpy.getNavigationData).toHaveBeenCalled();
      expect(newComponent['gameState'].createGame).not.toHaveBeenCalled();
    });

    it('should subscribe to disconnection events on init', () => {
      // Create a new component instance to test ngOnInit
      const newComponent = new DuelDemoPageComponent(viewStateServiceSpy, networkServiceSpy);
      const subscribeSpy = jasmine.createSpy('subscribe');

      // Mock onDisconnect to return an observable with subscribe spy
      networkServiceSpy.onDisconnect.and.returnValue({
        subscribe: subscribeSpy
      } as unknown as Observable<void>);

      newComponent.ngOnInit();

      expect(networkServiceSpy.onDisconnect).toHaveBeenCalled();
      expect(subscribeSpy).toHaveBeenCalled();
    });

    it('should navigate to catalogue when disconnection occurs', () => {
      // Create a new component instance
      const newComponent = new DuelDemoPageComponent(viewStateServiceSpy, networkServiceSpy);
      let disconnectCallback: () => void;

      // Mock onDisconnect to capture the callback
      networkServiceSpy.onDisconnect.and.returnValue({
        subscribe: (callback: () => void) => {
          disconnectCallback = callback;
          return { unsubscribe: jasmine.createSpy('unsubscribe') };
        }
      } as unknown as Observable<void>);

      newComponent.ngOnInit();

      // Trigger disconnect
      disconnectCallback!();

      expect(viewStateServiceSpy.navigateToView).toHaveBeenCalledWith(AppView.CATALOGUE);
    });

    it('should clear match data on destroy', () => {
      const newComponent = new DuelDemoPageComponent(viewStateServiceSpy, networkServiceSpy);
      spyOn(newComponent['gameState'], 'clearMatchData');

      newComponent.ngOnDestroy();

      expect(newComponent['gameState'].clearMatchData).toHaveBeenCalled();
    });

    it('should unsubscribe from disconnection events on destroy', () => {
      const newComponent = new DuelDemoPageComponent(viewStateServiceSpy, networkServiceSpy);
      const unsubscribeSpy = jasmine.createSpy('unsubscribe');

      // Mock onDisconnect to return subscription with unsubscribe spy
      networkServiceSpy.onDisconnect.and.returnValue({
        subscribe: () => ({ unsubscribe: unsubscribeSpy })
      } as unknown as Observable<void>);

      newComponent.ngOnInit();
      newComponent.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  describe('PUP logic', () => {
    afterEach(() => {
      try {
        jasmine.clock().uninstall();
      } catch {
        // clock not installed for some tests
      }
    });

    it('should resolve PUP names to actions', () => {
      const resolve = component['resolveUseAction'].bind(component);

      expect(resolve('Cryo')).toBe(WaterPUPActions.USE_CRYO);
      expect(resolve('Forge')).toBe(MetalPUPActions.USE_FORGE);
      expect(resolve(null)).toBeNull();
      expect(resolve('Unknown')).toBeNull();
    });

    it('should build use payloads for each PUP action type', () => {
      const build = component['buildUsePayload'].bind(component);
      component['gameState']['myID'] = 0;

      type PayloadCase = {
        action: PlayerActions;
        verify: (payload: Record<string, unknown>) => void;
      };

      const cases: PayloadCase[] = [
        {
          action: WaterPUPActions.USE_CRYO,
          verify: payload => {
            expect(payload['targetID'] as number).toBe(1);
            expect(payload['cellIndex'] as number).toBe(0);
          }
        },
        {
          action: FirePUPActions.USE_INFERNO,
          verify: payload => {
            expect(payload['targetID'] as number).toBe(1);
            expect(payload['cellIndex'] as number).toBe(0);
          }
        },
        {
          action: MetalPUPActions.USE_LOCK,
          verify: payload => {
            expect(payload['targetID'] as number).toBe(1);
            expect(payload['value'] as number).toBe(0);
          }
        },
        {
          action: WoodPUPActions.USE_ENTANGLE,
          verify: payload => {
            expect(payload['targetID'] as number).toBe(1);
            expect(payload['cellIndex']).toBeUndefined();
          }
        },
        {
          action: EarthPUPActions.USE_LANDSLIDE,
          verify: payload => {
            expect(payload['targetID'] as number).toBe(1);
          }
        },
        {
          action: EarthPUPActions.USE_EXCAVATE,
          verify: payload => {
            expect(payload['cellIndex'] as number).toBe(0);
            expect(payload['targetID']).toBeUndefined();
          }
        },
        {
          action: WoodPUPActions.USE_WISDOM,
          verify: payload => {
            expect(payload['targetID']).toBeUndefined();
            expect(payload['cellIndex']).toBeUndefined();
          }
        },
        {
          action: FirePUPActions.USE_METABOLIC,
          verify: payload => {
            expect(payload['targetID']).toBeUndefined();
          }
        },
        {
          action: MetalPUPActions.USE_FORGE,
          verify: payload => {
            expect(payload['value']).toBeUndefined();
          }
        },
        {
          action: WaterPUPActions.USE_PURITY,
          verify: payload => {
            expect(payload['targetID']).toBeUndefined();
          }
        }
      ];

      cases.forEach(({ action, verify }) => {
        const payload = build(action, 7);
        expect(payload).toBeTruthy();
        if (!payload) {
          fail('Expected payload to be built');
          return;
        }

        const typedPayload = payload as Record<string, unknown>;
        expect(typedPayload['action']).toBe(action);
        expect(typedPayload['pupID']).toBe(7);
        verify(typedPayload);
      });
    });

    it('should send use action and clear cooldown lifecycle for a ready slot', () => {
      jasmine.clock().install();
      networkServiceSpy.send.calls.reset();
      component['gameState']['myID'] = 0;

      spyOn(component.gameState, 'getPlayerState').and.returnValue({
        gameState: { pupProgress: 0, boardState: null }
      } as unknown as IPlayerState<ClientBoardModel>);

      const slots: PupSlotState[] = [
        { pupID: 1, name: 'Cryo', icon: '/assets/pup/icons/cryo.svg', status: 'ready' },
        { pupID: null, name: null, icon: null, status: 'empty' },
        { pupID: null, name: null, icon: null, status: 'empty' }
      ];

      component.myPupSlots = slots;

      component.onUsePup(0);

      const [actionSent, rawPayload] = networkServiceSpy.send.calls.mostRecent().args;
      const payload = rawPayload as Record<string, unknown>;
      expect(actionSent).toBe(WaterPUPActions.USE_CRYO);
      expect(payload['pupID']).toBe(1);
      expect(payload['targetID']).toBe(1);

      expect(component.myPupSlots[0].status).toBe('cooldown');
      component['clearCooldownIntervals']();
      component.myPupSlots[0].cooldownExpiresAt = Date.now();
      component['scheduleCooldownTick'](0);

      jasmine.clock().tick(250);

      expect(component.myPupSlots[0].status).toBe('empty');

      component['clearCooldownIntervals']();
    });
  });
});
