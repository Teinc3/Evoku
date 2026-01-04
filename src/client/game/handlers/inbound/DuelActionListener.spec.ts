import { Observable, Subject } from 'rxjs';

import MatchStatus from '@shared/types/enums/matchstatus';
import PUPElements from '@shared/types/enums/elements';
import {
  MechanicsActions,
  LifecycleActions,
  ProtocolActions,
} from '@shared/types/enums/actions/';
import GameStateManager from '../../GameStateManager';
import DuelActionListener from './DuelActionListener';

import type ActionEnum from '@shared/types/enums/actions/';
import type {
  SetCellContract
} from '@shared/types/contracts/match/player/mechanics/SetCellContract';
import type { PingContract, PongContract } from '@shared/types/contracts';
import type ActionMap from '@shared/types/actionmap';
import type NetworkService from '../../../app/services/network';


describe('DuelActionListener', () => {
  let listener: DuelActionListener;
  let networkServiceSpy: jasmine.SpyObj<NetworkService>;
  let gameState: GameStateManager;

  let disconnectSubject: Subject<void>;
  let packetSubjects: Map<ActionEnum, Subject<unknown>>;

  beforeEach(() => {
    disconnectSubject = new Subject<void>();
    packetSubjects = new Map<ActionEnum, Subject<unknown>>();

    networkServiceSpy = jasmine.createSpyObj<NetworkService>(
      'NetworkService',
      ['send', 'onDisconnect', 'onPacket']
    );

    networkServiceSpy.onDisconnect.and.returnValue(disconnectSubject.asObservable());
    function onPacketFake<GenericAction extends ActionEnum>(
      action: GenericAction
    ): Observable<ActionMap[GenericAction]> {
      if (!packetSubjects.has(action)) {
        packetSubjects.set(action, new Subject<unknown>());
      }

      const observable = packetSubjects.get(action)!.asObservable();
      return observable as unknown as Observable<ActionMap[GenericAction]>;
    }

    networkServiceSpy.onPacket.and.callFake(onPacketFake);

    listener = new DuelActionListener(networkServiceSpy);
    gameState = new GameStateManager(2);

    listener.gameInit(gameState);
  });

  afterEach(() => {
    disconnectSubject.complete();
    for (const subject of packetSubjects.values()) {
      subject.complete();
    }
  });

  it('calls onDisconnect context callback', () => {
    const onDisconnect = jasmine.createSpy('onDisconnect');

    listener.setContext({
      onDisconnect
    });

    const subscription = listener.bind();

    disconnectSubject.next();
    expect(onDisconnect).toHaveBeenCalled();

    subscription.unsubscribe();
  });

  it('handles GAME_INIT by initializing state and setting ONGOING', () => {
    const initData = { cellValues: Array(81).fill(0) };

    spyOn(gameState, 'initGameStates');
    spyOn(gameState.timeCoordinator, 'onGameInit');

    const subscription = listener.bind();

    const subject = packetSubjects.get(LifecycleActions.GAME_INIT);
    if (!subject) {
      throw new Error('Missing subject for GAME_INIT');
    }

    subject.next(initData);

    expect(gameState.initGameStates).toHaveBeenCalledWith(initData.cellValues);
    expect(gameState.timeCoordinator.onGameInit).toHaveBeenCalled();
    expect(gameState.matchState.status).toBe(MatchStatus.ONGOING);

    subscription.unsubscribe();
  });

  it('handles PHASE_TRANSITION by updating match phase', () => {
    const subscription = listener.bind();

    const subject = packetSubjects.get(LifecycleActions.PHASE_TRANSITION);
    if (!subject) {
      throw new Error('Missing subject for PHASE_TRANSITION');
    }

    subject.next({ newPhase: 2 });

    expect(gameState.matchState.phase).toBe(2);

    subscription.unsubscribe();
  });

  it('handles UPDATE_PROGRESS for board and pup progress', () => {
    const subscription = listener.bind();

    const subject = packetSubjects.get(ProtocolActions.UPDATE_PROGRESS);
    if (!subject) {
      throw new Error('Missing subject for UPDATE_PROGRESS');
    }

    gameState.getPlayerState(0).gameState!.boardState.progress = 0;
    gameState.getPlayerState(0).gameState!.pupProgress = 0;

    subject.next({ playerID: 0, isBoard: true, progress: 50 });
    expect(gameState.getPlayerState(0).gameState!.boardState.progress).toBe(50);

    subject.next({ playerID: 0, isBoard: false, progress: 75 });
    expect(gameState.getPlayerState(0).gameState!.pupProgress).toBe(75);

    subscription.unsubscribe();
  });

  it('handles CELL_SET using pending action clientTime when available', () => {
    const subscription = listener.bind();

    gameState.myID = 0;

    const pendingSetCell: SetCellContract & { action: typeof MechanicsActions.SET_CELL } = {
      action: MechanicsActions.SET_CELL,
      actionID: 123,
      clientTime: 500,
      cellIndex: 0,
      value: 5
    };

    gameState.pendingActions.set(123, pendingSetCell);

    const board = gameState.getPlayerBoard(0);
    spyOn(board, 'confirmCellSet');

    const subject = packetSubjects.get(MechanicsActions.CELL_SET);
    if (!subject) {
      throw new Error('Missing subject for CELL_SET');
    }

    subject.next({
      playerID: 0,
      actionID: 123,
      serverTime: 1000,
      cellIndex: 0,
      value: 5
    });

    expect(board.confirmCellSet).toHaveBeenCalledWith(0, 5, 500);
    expect(gameState.pendingActions.has(123)).toBeFalse();

    subscription.unsubscribe();
  });

  it('handles REJECT_ACTION by removing pending SET_CELL and calling onCellRejection', () => {
    const onCellRejection = jasmine.createSpy('onCellRejection');

    listener.setContext({
      onCellRejection
    });

    const subscription = listener.bind();

    const pendingSetCell: SetCellContract & { action: typeof MechanicsActions.SET_CELL } = {
      action: MechanicsActions.SET_CELL,
      actionID: 123,
      clientTime: 500,
      cellIndex: 7,
      value: 9
    };

    gameState.pendingActions.set(123, pendingSetCell);

    const subject = packetSubjects.get(ProtocolActions.REJECT_ACTION);
    if (!subject) {
      throw new Error('Missing subject for REJECT_ACTION');
    }

    subject.next({ actionID: 123 });

    expect(gameState.pendingActions.has(123)).toBeFalse();
    expect(onCellRejection).toHaveBeenCalledWith(7, 9);

    subscription.unsubscribe();
  });

  it('handles PING by delegating to gameState.timeCoordinator.handlePing and sending PONG', () => {
    const subscription = listener.bind();

    const pingData: PingContract = {
      serverTime: 2000,
      clientPing: 100
    };

    const expectedPong: PongContract = {
      clientTime: 123,
      serverTime: 2000
    };

    spyOn(gameState.timeCoordinator, 'handlePing').and.returnValue(expectedPong);

    const subject = packetSubjects.get(ProtocolActions.PING);
    if (!subject) {
      throw new Error('Missing subject for PING');
    }

    subject.next(pingData);

    expect(gameState.timeCoordinator.handlePing).toHaveBeenCalledWith(pingData);
    expect(networkServiceSpy.send).toHaveBeenCalledWith(ProtocolActions.PONG, expectedPong);

    subscription.unsubscribe();
  });

  it('handles PUP_DRAWN and triggers settling for own player', () => {
    const onBeginPupSettling = jasmine.createSpy('onBeginPupSettling');

    listener.setContext({
      onBeginPupSettling
    });

    const subscription = listener.bind();

    gameState.myID = 0;

    const subject = packetSubjects.get(MechanicsActions.PUP_DRAWN);
    if (!subject) {
      throw new Error('Missing subject for PUP_DRAWN');
    }

    subject.next({
      playerID: 0,
      slotIndex: 0,
      pupID: 999,
      type: 1,
      level: 2
    });

    const slot = gameState.getPlayerState(0).gameState!.powerups[0];
    expect(slot.pup?.pupID).toBe(999);
    expect(slot.locked).toBeFalse();
    expect(slot.pendingCooldownEnd).toBeUndefined();

    expect(onBeginPupSettling).toHaveBeenCalled();

    subscription.unsubscribe();
  });

  it('handles PUP_SPUN by locking slot and setting settling element', () => {
    const onSetPupSettlingType = jasmine.createSpy('onSetPupSettlingType');

    listener.setContext({
      onSetPupSettlingType
    });

    const subscription = listener.bind();

    gameState.myID = 0;

    const subject = packetSubjects.get(MechanicsActions.PUP_SPUN);
    if (!subject) {
      throw new Error('Missing subject for PUP_SPUN');
    }

    subject.next({
      slotIndex: 0,
      element: PUPElements.WATER
    });

    const slot = gameState.getPlayerState(0).gameState!.powerups[0];
    expect(slot.locked).toBeTrue();
    expect(onSetPupSettlingType).toHaveBeenCalledWith(PUPElements.WATER);

    subscription.unsubscribe();
  });
});
