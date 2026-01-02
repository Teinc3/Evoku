import { Subject, type Observable } from 'rxjs';
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import MatchStatus from '@shared/types/enums/matchstatus';
import PUPElements from '@shared/types/enums/elements';
import ActionEnum, {
  MechanicsActions,
  LifecycleActions,
  ProtocolActions,
  WaterPUPActions,
  type PlayerActions
} from '@shared/types/enums/actions/';
import pupConfig from '@config/shared/pup.json';
import sharedConfig from '@config/shared/base.json';
import ViewStateService from '../../../../services/view-state';
import NetworkService from '../../../../services/network';
import { AppView } from '../../../../../types/enums';
import DuelDemoPageComponent from './duel.demo';

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type { IPlayerState } from '@shared/types/gamestate';
import type { ActionContractC2S }
  from '@shared/types/contracts/components/extendables/ActionContract';
import type { MatchFoundContract, PingContract } from '@shared/types/contracts';
import type BoardModelComponent from '../../../../components/board/board.component';
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

    it('should cancel optimistic PUP cooldown on REJECT_ACTION for PUP usage', () => {
      component.ngOnInit();

      const pupID = 999;
      const myID = 0;
      (component.gameState as typeof component.gameState & { myID: number }).myID = myID;

      const slot = {
        pup: { pupID, type: 1 },
        locked: false,
        lastCooldownEnd: 0,
        pendingCooldownEnd: 1234,
      };
      const playerGameState = {
        powerups: [slot]
      };

      spyOn(component.gameState, 'getPlayerState').and.callFake((playerID: number) => {
        if (playerID === myID) {
          return { gameState: playerGameState } as unknown as IPlayerState<ClientBoardModel>;
        }

        return { gameState: null } as unknown as IPlayerState<ClientBoardModel>;
      });

      const pendingAction: ActionContractC2S & {
        action: PlayerActions;
        pupID: number;
      } = {
        action: WaterPUPActions.USE_PURITY,
        actionID: 123,
        pupID,
        clientTime: 0,
      };
      component.gameState.pendingActions.set(123, pendingAction);

      const rejectData = { actionID: 123 };
      const action = ProtocolActions.REJECT_ACTION;
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }

      packetSubjects.get(action)!.next(rejectData as unknown as ActionEnum);
      expect(slot.pendingCooldownEnd).toBeUndefined();
    });

    it('should return early for UPDATE_PROGRESS when player gameState is missing', () => {
      component.ngOnInit();

      spyOn(component.gameState, 'getPlayerState').and.returnValue({
        gameState: null
      } as unknown as IPlayerState<ClientBoardModel>);

      const action = ProtocolActions.UPDATE_PROGRESS;
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }

      packetSubjects.get(action)!.next({
        playerID: 0,
        isBoard: true,
        progress: 50,
      } as unknown as ActionEnum);

      expect(component.gameState.getPlayerState).toHaveBeenCalled();
    });

    it('should confirm CELL_SET for opponent using estimated client time', () => {
      component.ngOnInit();

      (component.gameState as typeof component.gameState & { myID: number }).myID = 0;

      const confirmCellSet = jasmine.createSpy('confirmCellSet');
      spyOn(component.gameState, 'getPlayerBoard').and.returnValue({
        confirmCellSet
      } as unknown as ClientBoardModel);

      const estimateSpy = spyOn(component.gameState.timeCoordinator, 'estimateClientTime')
        .and.returnValue(123456);

      const action = MechanicsActions.CELL_SET;
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }

      packetSubjects.get(action)!.next({
        playerID: 1,
        actionID: 99,
        serverTime: 777,
        cellIndex: 10,
        value: 3,
      } as unknown as ActionEnum);

      expect(estimateSpy).toHaveBeenCalledWith(777);
      expect(confirmCellSet).toHaveBeenCalledWith(10, 3, 123456);
    });

    it('should handle REJECT_ACTION for PUP usage even when my gameState is missing', () => {
      component.ngOnInit();

      (component.gameState as typeof component.gameState & { myID: number }).myID = 0;
      spyOn(component.gameState, 'getPlayerBoard')
        .and.returnValue(null as unknown as ClientBoardModel);
      spyOn(component.gameState, 'getPlayerState').and.returnValue({
        gameState: null
      } as unknown as IPlayerState<ClientBoardModel>);

      const pendingAction: ActionContractC2S & {
        action: PlayerActions;
        pupID: number;
      } = {
        action: WaterPUPActions.USE_PURITY,
        actionID: 123,
        pupID: 999,
        clientTime: 0,
      };
      component.gameState.pendingActions.set(123, pendingAction);

      const action = ProtocolActions.REJECT_ACTION;
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }

      packetSubjects.get(action)!.next({ actionID: 123 } as unknown as ActionEnum);

      expect(component.gameState.pendingActions.has(123)).toBeFalse();
    });

    it('should ignore PUP_DRAWN when player gameState is missing', () => {
      component.ngOnInit();

      spyOn(component.gameState, 'getPlayerState').and.returnValue({
        gameState: null
      } as unknown as IPlayerState<ClientBoardModel>);

      const action = MechanicsActions.PUP_DRAWN;
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }

      packetSubjects.get(action)!.next({
        playerID: 0,
        slotIndex: 0,
        pupID: 1,
        type: 1,
        level: 0,
      } as unknown as ActionEnum);

      expect(component.gameState.getPlayerState).toHaveBeenCalled();
    });

    it('should ignore PUP_SPUN when player gameState is missing', () => {
      component.ngOnInit();

      (component.gameState as typeof component.gameState & { myID: number }).myID = 0;
      spyOn(component.gameState, 'getPlayerState').and.returnValue({
        gameState: null
      } as unknown as IPlayerState<ClientBoardModel>);

      const action = MechanicsActions.PUP_SPUN;
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }

      packetSubjects.get(action)!.next({
        slotIndex: 0,
        element: PUPElements.WATER,
      } as unknown as ActionEnum);

      expect(component.gameState.getPlayerState).toHaveBeenCalled();
    });

    it('should ignore PUP_SPUN when slot index is invalid', () => {
      component.ngOnInit();

      (component.gameState as typeof component.gameState & { myID: number }).myID = 0;
      spyOn(component.gameState, 'getPlayerState').and.returnValue({
        gameState: {
          powerups: []
        }
      } as unknown as IPlayerState<ClientBoardModel>);

      const setSettlingType = jasmine.createSpy('setSettlingType');
      component.pupSpinner = { setSettlingType } as unknown as
        DuelDemoPageComponent['pupSpinner'];

      const action = MechanicsActions.PUP_SPUN;
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }

      packetSubjects.get(action)!.next({
        slotIndex: 0,
        element: PUPElements.WATER,
      } as unknown as ActionEnum);

      expect(setSettlingType).not.toHaveBeenCalled();
    });

    it('canSpinPupSpinner returns true when no powerups exist', () => {
      (component.gameState as typeof component.gameState & { myID: number }).myID = 0;
      spyOn(component.gameState, 'getPlayerState').and.returnValue({
        gameState: null
      } as unknown as IPlayerState<ClientBoardModel>);

      const canSpin = (component as unknown as { canSpinPupSpinner: boolean })
        .canSpinPupSpinner;
      expect(canSpin).toBe(true);
    });

    it('canSpinPupSpinner returns true when any slot is available and cooled down', () => {
      spyOn(performance, 'now').and.returnValue(1000);
      (component.gameState as typeof component.gameState & { myID: number }).myID = 0;

      const playerGameState = {
        powerups: [
          {
            pup: null,
            locked: false,
            lastCooldownEnd: 0,
            pendingCooldownEnd: undefined
          },
          {
            pup: { pupID: 1, type: 1 },
            locked: false,
            lastCooldownEnd: 0,
            pendingCooldownEnd: undefined
          },
        ]
      };
      spyOn(component.gameState, 'getPlayerState').and.returnValue({
        gameState: playerGameState
      } as unknown as IPlayerState<ClientBoardModel>);

      const canSpin = (component as unknown as { canSpinPupSpinner: boolean })
        .canSpinPupSpinner;
      expect(canSpin).toBe(true);
    });

    it('canSpinPupSpinner returns false when no slot is available', () => {
      spyOn(performance, 'now').and.returnValue(1000);
      (component.gameState as typeof component.gameState & { myID: number }).myID = 0;

      const playerGameState = {
        powerups: [
          {
            pup: { pupID: 1, type: 1 },
            locked: true,
            lastCooldownEnd: 0,
            pendingCooldownEnd: undefined
          },
          {
            pup: { pupID: 2, type: 1 },
            locked: false,
            lastCooldownEnd: 2000,
            pendingCooldownEnd: undefined
          },
        ]
      };
      spyOn(component.gameState, 'getPlayerState').and.returnValue({
        gameState: playerGameState
      } as unknown as IPlayerState<ClientBoardModel>);

      const canSpin = (component as unknown as { canSpinPupSpinner: boolean })
        .canSpinPupSpinner;
      expect(canSpin).toBe(false);
    });

    it('should handle PUP_DRAWN and begin settling for self', () => {
      component.ngOnInit();

      const myID = 0;
      (component.gameState as typeof component.gameState & { myID: number }).myID = myID;

      const slot = { pup: null, locked: true, lastCooldownEnd: 0, pendingCooldownEnd: 123 };
      const playerGameState = { powerups: [slot] };
      spyOn(component.gameState, 'getPlayerState').and.returnValue({
        gameState: playerGameState
      } as unknown as IPlayerState<ClientBoardModel>);

      const pupSpinner = jasmine.createSpyObj('PupSpinnerComponent', ['beginSettling']);
      component.pupSpinner = pupSpinner as unknown as
        DuelDemoPageComponent['pupSpinner'];

      const action = MechanicsActions.PUP_DRAWN;
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }

      packetSubjects.get(action)!.next({
        playerID: myID,
        slotIndex: 0,
        pupID: 555,
        type: 1,
        level: 0,
      } as unknown as ActionEnum);

      expect(slot.locked).toBe(false);
      expect(slot.pendingCooldownEnd).toBeUndefined();
      expect(pupSpinner.beginSettling).toHaveBeenCalled();
    });

    it('should handle PUP_SPUN and lock the slot', () => {
      component.ngOnInit();

      const myID = 0;
      (component.gameState as typeof component.gameState & { myID: number }).myID = myID;

      const slot = {
        pup: { pupID: 1, type: 1 },
        locked: false,
        lastCooldownEnd: 0,
        pendingCooldownEnd: undefined
      };
      const playerGameState = { powerups: [slot] };
      spyOn(component.gameState, 'getPlayerState').and.returnValue({
        gameState: playerGameState
      } as unknown as IPlayerState<ClientBoardModel>);

      const pupSpinner = jasmine.createSpyObj('PupSpinnerComponent', ['setSettlingType']);
      component.pupSpinner = pupSpinner as unknown as
        DuelDemoPageComponent['pupSpinner'];

      const action = MechanicsActions.PUP_SPUN;
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<ActionEnum>());
      }

      packetSubjects.get(action)!.next({
        slotIndex: 0,
        element: PUPElements.WATER,
      } as unknown as ActionEnum);

      expect(slot.locked).toBe(true);
      expect(pupSpinner.setSettlingType).toHaveBeenCalledWith(PUPElements.WATER);
    });

    it('onMyPupSlotClicked shakes when slot is unusable', () => {
      spyOn(performance, 'now').and.returnValue(1000);
      const shakeSlot = jasmine.createSpy('shakeSlot');
      component.myPupSlots = { shakeSlot } as unknown as
        DuelDemoPageComponent['myPupSlots'];

      (component.gameState as typeof component.gameState & { myID: number }).myID = 0;

      const playerGameState = {
        powerups: [{ pup: null, locked: false, lastCooldownEnd: 0, pendingCooldownEnd: undefined }]
      };
      spyOn(component.gameState, 'getPlayerState').and.returnValue({
        gameState: playerGameState
      } as unknown as IPlayerState<ClientBoardModel>);

      component.onMyPupSlotClicked(0);
      expect(shakeSlot).toHaveBeenCalledWith(0);
    });

    it('onMyPupSlotClicked sends correct PUP actions for each type (covers switch cases)', () => {
      spyOn(performance, 'now').and.returnValue(1000);
      (component.gameState as typeof component.gameState & { myID: number }).myID = 0;
      component.gameState.matchState.phase = 0;

      const shakeSlot = jasmine.createSpy('shakeSlot');
      component.myPupSlots = { shakeSlot } as unknown as DuelDemoPageComponent['myPupSlots'];

      const board1Selected = signal<number | null>(3);
      const board2Selected = signal<number | null>(10);
      const board1 = {
        selected: board1Selected,
        model: { board: Array.from({ length: 81 }, () => ({ value: 0 })) },
      };
      const board2 = {
        selected: board2Selected,
        model: { board: Array.from({ length: 81 }, () => ({ value: 0 })) },
      };
      board2.model.board[10].value = 7;

      component.board1 = board1 as unknown as BoardModelComponent;
      component.board2 = board2 as unknown as BoardModelComponent;

      const makeSlot = (type: number) => ({
        pup: { pupID: 1000 + type, type },
        locked: false,
        lastCooldownEnd: 0,
        pendingCooldownEnd: undefined as number | undefined,
      });

      const slots = Array.from({ length: 10 }, (_, i) => makeSlot(i));
      const playerGameState = { powerups: slots };
      spyOn(component.gameState, 'getPlayerState').and.returnValue({
        gameState: playerGameState
      } as unknown as IPlayerState<ClientBoardModel>);

      // Cryo requires enemy selection; cover the "missing selection" shake branch once
      board2Selected.set(null);
      component.onMyPupSlotClicked(0);
      expect(shakeSlot).toHaveBeenCalledWith(0);
      board2Selected.set(10);

      // Purity
      component.onMyPupSlotClicked(1);
      expect(networkServiceSpy.send).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.objectContaining({ pupID: 1001 })
      );

      // Inferno
      component.onMyPupSlotClicked(2);
      expect(networkServiceSpy.send).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.objectContaining({ pupID: 1002, targetID: 1, cellIndex: 10 })
      );

      // Metabolic
      component.onMyPupSlotClicked(3);
      expect(networkServiceSpy.send).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.objectContaining({ pupID: 1003 })
      );

      // Entangle
      component.onMyPupSlotClicked(4);
      expect(networkServiceSpy.send).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.objectContaining({ pupID: 1004, targetID: 1 })
      );

      // Wisdom
      component.onMyPupSlotClicked(5);
      expect(networkServiceSpy.send).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.objectContaining({ pupID: 1005 })
      );

      // Landslide
      component.onMyPupSlotClicked(6);
      expect(networkServiceSpy.send).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.objectContaining({ pupID: 1006, targetID: 1 })
      );

      // Excavate requires my selection
      component.onMyPupSlotClicked(7);
      expect(networkServiceSpy.send).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.objectContaining({ pupID: 1007, cellIndex: 3 })
      );

      // Lock uses selected cell value
      board1Selected.set(null);
      board2Selected.set(10);
      component.onMyPupSlotClicked(8);
      expect(networkServiceSpy.send).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.objectContaining({ pupID: 1008, targetID: 1, value: 7 })
      );

      // Forge
      component.onMyPupSlotClicked(9);
      expect(networkServiceSpy.send).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.objectContaining({ pupID: 1009 })
      );

      // Ensure optimistic cooldown is applied only for Yang PUPs (theme === true)
      const duration = sharedConfig.game.challenge.duration[
        component.gameState.matchState.phase
      ];
      const yangTypes = pupConfig
        .filter(p => p.theme === true)
        .map(p => p.type);
      for (const t of yangTypes) {
        expect(slots[t].pendingCooldownEnd).toBe(1000 + duration);
      }
      const yinTypes = pupConfig
        .filter(p => p.theme === false)
        .map(p => p.type);
      for (const t of yinTypes) {
        expect(slots[t].pendingCooldownEnd).toBeUndefined();
      }
    });

    it('onMyPupSlotClicked throws for unknown PUP type (not in pup config)', () => {
      spyOn(performance, 'now').and.returnValue(1000);
      (component.gameState as typeof component.gameState & { myID: number }).myID = 0;
      component.gameState.matchState.phase = 0;

      const shakeSlot = jasmine.createSpy('shakeSlot');
      component.myPupSlots = { shakeSlot } as unknown as
        DuelDemoPageComponent['myPupSlots'];

      component.board1 = { selected: signal<number | null>(null) } as unknown as
        BoardModelComponent;
      component.board2 = { selected: signal<number | null>(null) } as unknown as
        BoardModelComponent;

      const playerGameState = {
        powerups: [
          {
            pup: { pupID: 999, type: 999 },
            locked: false,
            lastCooldownEnd: 0,
            pendingCooldownEnd: undefined
          }
        ]
      };
      spyOn(component.gameState, 'getPlayerState').and.returnValue({
        gameState: playerGameState
      } as unknown as IPlayerState<ClientBoardModel>);

      expect(() => {
        component.onMyPupSlotClicked(0);
      }).toThrow();
    });

    it('onMyPupSlotClicked returns early when player gameState is missing', () => {
      (component.gameState as typeof component.gameState & { myID: number }).myID = 0;
      spyOn(component.gameState, 'getPlayerState').and.returnValue({
        gameState: null
      } as unknown as IPlayerState<ClientBoardModel>);

      const shakeSlot = jasmine.createSpy('shakeSlot');
      component.myPupSlots = { shakeSlot } as unknown as
        DuelDemoPageComponent['myPupSlots'];

      expect(() => {
        component.onMyPupSlotClicked(0);
      }).not.toThrow();

      expect(shakeSlot).not.toHaveBeenCalled();
    });

    it('onMyPupSlotClicked shakes when Inferno has no enemy selection', () => {
      spyOn(performance, 'now').and.returnValue(1000);
      (component.gameState as typeof component.gameState & { myID: number }).myID = 0;

      const shakeSlot = jasmine.createSpy('shakeSlot');
      component.myPupSlots = { shakeSlot } as unknown as
        DuelDemoPageComponent['myPupSlots'];

      component.board1 = { selected: signal<number | null>(null) } as unknown as
        BoardModelComponent;
      component.board2 = { selected: signal<number | null>(null) } as unknown as
        BoardModelComponent;

      const playerGameState = {
        powerups: [
          {
            pup: { pupID: 2000, type: 2 },
            locked: false,
            lastCooldownEnd: 0,
            pendingCooldownEnd: undefined
          }
        ]
      };
      spyOn(component.gameState, 'getPlayerState').and.returnValue({
        gameState: playerGameState
      } as unknown as IPlayerState<ClientBoardModel>);

      component.onMyPupSlotClicked(0);
      expect(networkServiceSpy.send).not.toHaveBeenCalled();
      expect(shakeSlot).toHaveBeenCalledWith(0);
    });

    it('onMyPupSlotClicked shakes when Excavate has no my selection', () => {
      spyOn(performance, 'now').and.returnValue(1000);
      (component.gameState as typeof component.gameState & { myID: number }).myID = 0;

      const shakeSlot = jasmine.createSpy('shakeSlot');
      component.myPupSlots = { shakeSlot } as unknown as
        DuelDemoPageComponent['myPupSlots'];

      component.board1 = { selected: signal<number | null>(null) } as unknown as
        BoardModelComponent;
      component.board2 = { selected: signal<number | null>(null) } as unknown as
        BoardModelComponent;

      const playerGameState = {
        powerups: [
          {
            pup: { pupID: 7000, type: 7 },
            locked: false,
            lastCooldownEnd: 0,
            pendingCooldownEnd: undefined
          }
        ]
      };
      spyOn(component.gameState, 'getPlayerState').and.returnValue({
        gameState: playerGameState
      } as unknown as IPlayerState<ClientBoardModel>);

      component.onMyPupSlotClicked(0);
      expect(networkServiceSpy.send).not.toHaveBeenCalled();
      expect(shakeSlot).toHaveBeenCalledWith(0);
    });

    it('onMyPupSlotClicked shakes when Lock has no selection on either board', () => {
      spyOn(performance, 'now').and.returnValue(1000);
      (component.gameState as typeof component.gameState & { myID: number }).myID = 0;

      const shakeSlot = jasmine.createSpy('shakeSlot');
      component.myPupSlots = { shakeSlot } as unknown as
        DuelDemoPageComponent['myPupSlots'];

      component.board1 = {
        selected: signal<number | null>(null),
        model: { board: [] },
      } as unknown as BoardModelComponent;
      component.board2 = {
        selected: signal<number | null>(null),
        model: { board: [] },
      } as unknown as BoardModelComponent;

      const playerGameState = {
        powerups: [
          {
            pup: { pupID: 8000, type: 8 },
            locked: false,
            lastCooldownEnd: 0,
            pendingCooldownEnd: undefined
          }
        ]
      };
      spyOn(component.gameState, 'getPlayerState').and.returnValue({
        gameState: playerGameState
      } as unknown as IPlayerState<ClientBoardModel>);

      component.onMyPupSlotClicked(0);
      expect(networkServiceSpy.send).not.toHaveBeenCalled();
      expect(shakeSlot).toHaveBeenCalledWith(0);
    });

    it('onMyPupSlotClicked shakes for unknown PUP type when pupConfig contains an entry', () => {
      spyOn(performance, 'now').and.returnValue(1000);
      (component.gameState as typeof component.gameState & { myID: number }).myID = 0;
      component.gameState.matchState.phase = 0;

      const shakeSlot = jasmine.createSpy('shakeSlot');
      component.myPupSlots = { shakeSlot } as unknown as
        DuelDemoPageComponent['myPupSlots'];

      component.board1 = { selected: signal<number | null>(null) } as unknown as
        BoardModelComponent;
      component.board2 = { selected: signal<number | null>(null) } as unknown as
        BoardModelComponent;

      const pupIndex = 999;
      const pupConfigArray = pupConfig as unknown as
        Array<{ theme: boolean } | undefined>;
      const original = pupConfigArray[pupIndex];
      pupConfigArray[pupIndex] = { theme: false };

      try {
        const playerGameState = {
          powerups: [
            {
              pup: { pupID: 9999, type: pupIndex },
              locked: false,
              lastCooldownEnd: 0,
              pendingCooldownEnd: undefined
            }
          ]
        };
        spyOn(component.gameState, 'getPlayerState').and.returnValue({
          gameState: playerGameState
        } as unknown as IPlayerState<ClientBoardModel>);

        component.onMyPupSlotClicked(0);
        expect(shakeSlot).toHaveBeenCalledWith(0);
      } finally {
        if (typeof original === 'undefined') {
          delete pupConfigArray[pupIndex];
        } else {
          pupConfigArray[pupIndex] = original;
        }
      }
    });

    it('onMyPupSlotClicked sends Cryo when enemy cell is selected', () => {
      spyOn(performance, 'now').and.returnValue(1000);
      (component.gameState as typeof component.gameState & { myID: number }).myID = 0;

      const shakeSlot = jasmine.createSpy('shakeSlot');
      component.myPupSlots = { shakeSlot } as unknown as
        DuelDemoPageComponent['myPupSlots'];

      component.board1 = { selected: signal<number | null>(null) } as unknown as
        BoardModelComponent;
      component.board2 = { selected: signal<number | null>(10) } as unknown as
        BoardModelComponent;

      const playerGameState = {
        powerups: [
          {
            pup: { pupID: 1000, type: 0 },
            locked: false,
            lastCooldownEnd: 0,
            pendingCooldownEnd: undefined
          }
        ]
      };
      spyOn(component.gameState, 'getPlayerState').and.returnValue({
        gameState: playerGameState
      } as unknown as IPlayerState<ClientBoardModel>);

      component.onMyPupSlotClicked(0);
      expect(networkServiceSpy.send).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.objectContaining({ pupID: 1000, targetID: 1, cellIndex: 10 })
      );
    });

    it('onMyPupSlotClicked shakes when Lock has no positive selected value', () => {
      spyOn(performance, 'now').and.returnValue(1000);
      (component.gameState as typeof component.gameState & { myID: number }).myID = 0;

      const shakeSlot = jasmine.createSpy('shakeSlot');
      component.myPupSlots = { shakeSlot } as unknown as DuelDemoPageComponent['myPupSlots'];

      const board1Selected = signal<number | null>(0);
      const board1 = {
        selected: board1Selected,
        model: { board: Array.from({ length: 81 }, () => ({ value: 0 })) },
      };
      component.board1 = board1 as unknown as BoardModelComponent;
      component.board2 = {
        selected: signal<number | null>(null),
        model: { board: [] }
      } as unknown as BoardModelComponent;

      const playerGameState = {
        powerups: [
          {
            pup: { pupID: 1008, type: 8 },
            locked: false,
            lastCooldownEnd: 0,
            pendingCooldownEnd: undefined
          }
        ]
      };
      spyOn(component.gameState, 'getPlayerState').and.returnValue({
        gameState: playerGameState
      } as unknown as IPlayerState<ClientBoardModel>);

      component.onMyPupSlotClicked(0);
      expect(shakeSlot).toHaveBeenCalledWith(0);
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
      const orb = fixture.debugElement.query(By.css('.hud-bottom app-pup-spinner'));
      expect(orb).toBeTruthy();
      // The orb is wrapped in a div.my-pup in the HTML, so check component exists
      expect(orb.componentInstance).toBeTruthy();
    });

    it('should have orb with button role and keyboard accessibility', () => {
      const orb = fixture.debugElement.query(By.css('app-pup-spinner'));
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
      expect(compiled.querySelector('app-pup-spinner')).toBeTruthy();
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
});
