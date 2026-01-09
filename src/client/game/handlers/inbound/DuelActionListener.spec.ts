import { Observable, Subject } from 'rxjs';

import MatchStatus from '@shared/types/enums/matchstatus';
import PUPElements from '@shared/types/enums/elements';
import {
  MechanicsActions,
  LifecycleActions,
  ProtocolActions,
  WaterPUPActions,
  MetalPUPActions,
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

  it('ignores UPDATE_PROGRESS when player gameState is missing', () => {
    const subscription = listener.bind();

    const subject = packetSubjects.get(ProtocolActions.UPDATE_PROGRESS);
    if (!subject) {
      throw new Error('Expected UPDATE_PROGRESS subject to be registered.');
    }

    const packet: ActionMap[ProtocolActions.UPDATE_PROGRESS] = {
      playerID: 0,
      isBoard: true,
      progress: 10,
    };

    expect(() => {
      subject.next(packet);
    }).not.toThrow();

    subscription.unsubscribe();
  });

  it('sets match status to ENDED on GAME_OVER', () => {
    const subscription = listener.bind();

    const subject = packetSubjects.get(LifecycleActions.GAME_OVER);
    if (!subject) {
      throw new Error('Expected GAME_OVER subject to be registered.');
    }

    expect(gameState.matchState.status).not.toBe(MatchStatus.ENDED);

    const packet: ActionMap[LifecycleActions.GAME_OVER] = {
      winnerID: 0,
      reason: 0,
      eloChange: 0,
    };

    subject.next(packet);
    expect(gameState.matchState.status).toBe(MatchStatus.ENDED);

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

  it('handles CELL_SET using estimated clientTime when pending action is missing', () => {
    const subscription = listener.bind();

    gameState.myID = 0;

    const board = gameState.getPlayerBoard(1);
    const confirmSpy = spyOn(board, 'confirmCellSet');
    const estimateSpy = spyOn(gameState.timeCoordinator, 'estimateClientTime')
      .and.returnValue(1234);

    const subject = packetSubjects.get(MechanicsActions.CELL_SET);
    if (!subject) {
      throw new Error('Missing subject for CELL_SET');
    }

    subject.next({
      playerID: 1,
      actionID: 999,
      serverTime: 777,
      cellIndex: 10,
      value: 3,
    });

    expect(confirmSpy).toHaveBeenCalledWith(10, 3, 1234);
    expect(estimateSpy).toHaveBeenCalledWith(777);

    subscription.unsubscribe();
  });

  it('ignores CELL_SET when board is missing', () => {
    const subscription = listener.bind();

    type PlayerBoard = ReturnType<typeof gameState.getPlayerBoard>;
    spyOn(gameState, 'getPlayerBoard').and.returnValue(null as unknown as PlayerBoard);

    const subject = packetSubjects.get(MechanicsActions.CELL_SET);
    if (!subject) {
      throw new Error('Missing subject for CELL_SET');
    }

    subject.next({
      playerID: 0,
      actionID: 1,
      serverTime: 0,
      cellIndex: 0,
      value: 1,
    });

    expect(gameState.getPlayerBoard).toHaveBeenCalledWith(0);

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

  it('ignores REJECT_ACTION when pending action is missing', () => {
    const subscription = listener.bind();

    const subject = packetSubjects.get(ProtocolActions.REJECT_ACTION);
    if (!subject) {
      throw new Error('Missing subject for REJECT_ACTION');
    }

    subject.next({ actionID: 123 });

    expect(gameState.pendingActions.has(123)).toBeFalse();

    subscription.unsubscribe();
  });

  it('clears optimistic pup cooldown on REJECT_ACTION for pup usage', () => {
    const subscription = listener.bind();

    gameState.myID = 0;

    const slot = gameState.getPlayerState(0).gameState!.powerups[0];
    slot.pup = { pupID: 999, type: 1, level: 0 };
    slot.pendingCooldownEnd = 1234;

    type PendingAction = (typeof gameState)['pendingActions'] extends Map<number, infer T>
      ? T
      : never;

    const pendingAction = {
      action: WaterPUPActions.USE_PURITY,
      actionID: 123,
      clientTime: 0,
      pupID: 999,
    } as unknown as PendingAction;

    gameState.pendingActions.set(123, pendingAction);

    const subject = packetSubjects.get(ProtocolActions.REJECT_ACTION);
    if (!subject) {
      throw new Error('Missing subject for REJECT_ACTION');
    }

    subject.next({ actionID: 123 });

    expect(slot.pendingCooldownEnd).toBeUndefined();

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

  it('ignores PUP_DRAWN when player gameState is missing', () => {
    const onBeginPupSettling = jasmine.createSpy('onBeginPupSettling');

    listener.setContext({
      onBeginPupSettling
    });

    const subscription = listener.bind();

    gameState.getPlayerState(0).gameState = undefined;

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

    expect(onBeginPupSettling).not.toHaveBeenCalled();

    subscription.unsubscribe();
  });

  it('does not trigger settling for opponent PUP_DRAWN', () => {
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
      playerID: 1,
      slotIndex: 0,
      pupID: 999,
      type: 1,
      level: 2
    });

    expect(onBeginPupSettling).not.toHaveBeenCalled();

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

  it('throws when getGameState is called before gameInit()', () => {
    type PrivateApi = {
      getGameState(): GameStateManager;
    };

    const listenerWithoutInit = new DuelActionListener(networkServiceSpy);
    const privateApi = listenerWithoutInit as unknown as PrivateApi;

    expect(() => {
      privateApi.getGameState();
    }).toThrowError('MatchActionListener not initialized with a GameStateManager.');
  });

  it('handles CRYO_USED by setting pendingEffect on the used pup', () => {
    const subscription = listener.bind();

    gameState.myID = 0;

    const enemySlot = gameState.getPlayerState(1).gameState!.powerups[0];
    enemySlot.pup = { pupID: 111, type: 0, level: 0 };

    const subject = packetSubjects.get(WaterPUPActions.CRYO_USED);
    if (!subject) {
      throw new Error('Missing subject for CRYO_USED');
    }

    subject.next({
      playerID: 1,
      actionID: 1,
      serverTime: 100,
      pupID: 111,
      targetID: 0,
      cellIndex: 5,
    });

    expect(enemySlot.pup.pendingEffect).toEqual({
      targetID: 0,
      cellIndex: 5,
    });

    subscription.unsubscribe();
  });

  it('handles LOCK_USED by setting pendingEffect with targetID and value', () => {
    const subscription = listener.bind();

    gameState.myID = 0;

    const enemySlot = gameState.getPlayerState(1).gameState!.powerups[0];
    enemySlot.pup = { pupID: 222, type: 8, level: 0 };

    const subject = packetSubjects.get(MetalPUPActions.LOCK_USED);
    if (!subject) {
      throw new Error('Missing subject for LOCK_USED');
    }

    subject.next({
      playerID: 1,
      actionID: 2,
      serverTime: 100,
      pupID: 222,
      targetID: 0,
      value: 7,
    });

    expect(enemySlot.pup.pendingEffect).toEqual({
      targetID: 0,
      value: 7,
    });

    subscription.unsubscribe();
  });

  it('consumes pup on YIN PUP used action (PURITY_USED)', () => {
    const subscription = listener.bind();

    gameState.myID = 0;

    const enemySlot = gameState.getPlayerState(1).gameState!.powerups[0];
    enemySlot.pup = { pupID: 333, type: 1, level: 0 };

    const subject = packetSubjects.get(WaterPUPActions.PURITY_USED);
    if (!subject) {
      throw new Error('Missing subject for PURITY_USED');
    }

    subject.next({
      playerID: 1,
      actionID: 3,
      serverTime: 100,
      pupID: 333,
    });

    expect(enemySlot.pup).toBeUndefined();

    subscription.unsubscribe();
  });
});
