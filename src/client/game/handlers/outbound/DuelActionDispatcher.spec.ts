import { TestBed } from '@angular/core/testing';

import {
  MechanicsActions,
  WaterPUPActions,
  FirePUPActions,
  WoodPUPActions,
  EarthPUPActions,
  MetalPUPActions,
  type PlayerActions
} from '@shared/types/enums/actions/';
import pupConfig from '@config/shared/pup.json';
import sharedConfig from '@config/shared/base.json';
import GameStateManager from '../../GameStateManager';
import NetworkService from '../../../app/services/network';
import DuelActionDispatcher from './DuelActionDispatcher';

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type { IPUPSlotState } from '@shared/types/gamestate/powerups';
import type { OmitBaseAttrs } from '../../../types/OmitAttrs';


describe('DuelActionDispatcher', () => {
  let dispatcher: DuelActionDispatcher;
  let networkServiceSpy: jasmine.SpyObj<NetworkService>;
  let gameState: GameStateManager;

  const setSlot = (slotIndex: number, slot: IPUPSlotState): void => {
    const playerState = gameState.getPlayerState(gameState.myID).gameState;
    if (!playerState) {
      throw new Error('Missing player gameState in test setup.');
    }

    const powerups = [...playerState.powerups] as unknown as IPUPSlotState[];
    powerups[slotIndex] = slot;
    playerState.powerups = powerups as unknown as typeof playerState.powerups;
  };

  const setAccessContexts = (options: {
    mySelected: () => number | null;
    enemySelected: () => number | null;
    getMyCellValue?: (cellIndex: number) => number | null;
    getEnemyCellValue?: (cellIndex: number) => number | null;
    shakeSlot?: (slotIndex: number) => void;
  }): void => {
    dispatcher.setAccessContexts(
      {
        selected: options.mySelected,
        getCellValue: options.getMyCellValue ?? (() => null),
      },
      {
        selected: options.enemySelected,
        getCellValue: options.getEnemyCellValue ?? (() => null),
      },
      options.shakeSlot
    );
  };

  beforeEach(() => {
    networkServiceSpy = jasmine.createSpyObj('NetworkService', ['send']);

    TestBed.configureTestingModule({
      providers: [
        DuelActionDispatcher,
        { provide: NetworkService, useValue: networkServiceSpy },
      ]
    });

    dispatcher = TestBed.inject(DuelActionDispatcher);

    gameState = new GameStateManager(2);
    (gameState as typeof gameState & { myID: number }).myID = 0;
    gameState.matchState.phase = 0;

    dispatcher.gameInit(gameState);

    setAccessContexts({
      mySelected: () => null,
      enemySelected: () => null,
    });
  });

  it('dispatch stores pending action and sends packet', () => {
    spyOn(performance, 'now').and.returnValue(1000);

    const request: OmitBaseAttrs<AugmentAction<PlayerActions>> = {
      action: MechanicsActions.SET_CELL,
      cellIndex: 10,
      value: 3,
    };

    dispatcher.dispatch(request);

    expect(gameState.pendingActions.size).toBe(1);
    const pendingAction = [...gameState.pendingActions.values()][0];

    expect(pendingAction.action).toBe(MechanicsActions.SET_CELL);
    expect(pendingAction.actionID).toBe(0);
    expect(pendingAction.clientTime).toBe(1000);

    expect(networkServiceSpy.send).toHaveBeenCalledWith(
      MechanicsActions.SET_CELL,
      jasmine.objectContaining({
        cellIndex: 10,
        value: 3,
        actionID: 0,
        clientTime: 1000,
      })
    );
  });

  it('tryUsePUP shakes and returns false when slot is empty', () => {
    spyOn(performance, 'now').and.returnValue(1000);

    const shakeSlot = jasmine.createSpy('shakeSlot');
    setAccessContexts({
      mySelected: () => null,
      enemySelected: () => null,
      shakeSlot,
    });

    setSlot(0, { slotIndex: 0, lastCooldownEnd: 0, locked: false });

    const didDispatch = dispatcher.tryUsePUP(0);
    expect(didDispatch).toBe(false);
    expect(shakeSlot).toHaveBeenCalledWith(0);
  });

  it('tryUsePUP shakes (no dispatch) when pup config exists but handler is missing', () => {
    spyOn(performance, 'now').and.returnValue(1000);

    const shakeSlot = jasmine.createSpy('shakeSlot');
    setAccessContexts({
      mySelected: () => null,
      enemySelected: () => null,
      shakeSlot,
    });

    const pupIndex = 999;
    const pupConfigArray = pupConfig as unknown as Array<{ offensive: boolean } | undefined>;
    const original = pupConfigArray[pupIndex];
    pupConfigArray[pupIndex] = { offensive: false };

    try {
      setSlot(0, {
        slotIndex: 0,
        lastCooldownEnd: 0,
        locked: false,
        pup: { pupID: 9999, type: pupIndex, level: 0 }
      });

      const didDispatch = dispatcher.tryUsePUP(0);
      expect(didDispatch).toBe(false);
      expect(networkServiceSpy.send).not.toHaveBeenCalled();
      expect(shakeSlot).toHaveBeenCalledWith(0);
    } finally {
      if (typeof original === 'undefined') {
        delete pupConfigArray[pupIndex];
      } else {
        pupConfigArray[pupIndex] = original;
      }
    }
  });

  it('tryUsePUP dispatches correct action for each mapped pup type', () => {
    spyOn(performance, 'now').and.returnValue(1000);

    const shakeSlot = jasmine.createSpy('shakeSlot');

    const mySelectedValue = 3;
    const enemySelectedValue = 10;

    const mySelected = jasmine.createSpy('mySelected').and.returnValue(mySelectedValue);
    const enemySelected = jasmine.createSpy('enemySelected').and.returnValue(enemySelectedValue);

    setAccessContexts({
      mySelected,
      enemySelected,
      getMyCellValue: () => 7,
      getEnemyCellValue: () => 7,
      shakeSlot,
    });

    type Expectation = {
      action: PlayerActions;
      includes: Record<string, unknown>;
    };

    const expectations: Array<Expectation | undefined> = [];
    expectations[0] = {
      action: WaterPUPActions.USE_CRYO,
      includes: { targetID: 1, cellIndex: enemySelectedValue },
    };
    expectations[1] = {
      action: WaterPUPActions.USE_PURITY,
      includes: {},
    };
    expectations[2] = {
      action: FirePUPActions.USE_INFERNO,
      includes: { targetID: 1, cellIndex: enemySelectedValue },
    };
    expectations[3] = {
      action: FirePUPActions.USE_METABOLIC,
      includes: {},
    };
    expectations[4] = {
      action: WoodPUPActions.USE_ENTANGLE,
      includes: { targetID: 1 },
    };
    expectations[5] = {
      action: WoodPUPActions.USE_WISDOM,
      includes: {},
    };
    expectations[6] = {
      action: EarthPUPActions.USE_LANDSLIDE,
      includes: { targetID: 1 },
    };
    expectations[7] = {
      action: EarthPUPActions.USE_EXCAVATE,
      includes: { cellIndex: mySelectedValue },
    };
    expectations[8] = {
      action: MetalPUPActions.USE_LOCK,
      includes: { targetID: 1, value: 7 },
    };
    expectations[9] = {
      action: MetalPUPActions.USE_FORGE,
      includes: {},
    };

    for (let type = 0; type < expectations.length; type++) {
      const expectation = expectations[type];
      if (!expectation) {
        continue;
      }

      const pupID = 1000 + type;

      networkServiceSpy.send.calls.reset();
      shakeSlot.calls.reset();

      setSlot(0, {
        slotIndex: 0,
        lastCooldownEnd: 0,
        locked: false,
        pup: { pupID, type, level: 0 }
      });

      const didDispatch = dispatcher.tryUsePUP(0);
      expect(didDispatch).toBe(true);

      expect(networkServiceSpy.send).toHaveBeenCalledWith(
        expectation.action,
        jasmine.objectContaining({
          pupID,
          ...expectation.includes,
        })
      );
    }

    expect(shakeSlot).not.toHaveBeenCalled();
  });

  it('tryUsePUP applies optimistic cooldown only for yang pups', () => {
    spyOn(performance, 'now').and.returnValue(1000);

    const duration = sharedConfig.game.challenge.duration[gameState.matchState.phase];

    const yinType = pupConfig.find(p => p.offensive === false)?.type;
    const yangType = pupConfig.find(p => p.offensive === true)?.type;

    if (typeof yinType !== 'number' || typeof yangType !== 'number') {
      throw new Error('Missing yin/yang types in pupConfig for test.');
    }

    setAccessContexts({
      mySelected: () => 3,
      enemySelected: () => 10,
      getEnemyCellValue: () => 7,
    });

    // Yin
    setSlot(0, {
      slotIndex: 0,
      lastCooldownEnd: 0,
      locked: false,
      pup: { pupID: 1111, type: yinType, level: 0 }
    });

    dispatcher.tryUsePUP(0);

    const yinSlot = gameState.getPlayerState(gameState.myID).gameState?.powerups[0];
    expect(yinSlot?.pendingCooldownEnd).toBeUndefined();

    // Yang
    setSlot(0, {
      slotIndex: 0,
      lastCooldownEnd: 0,
      locked: false,
      pup: { pupID: 2222, type: yangType, level: 0 }
    });

    dispatcher.tryUsePUP(0);

    const yangSlot = gameState.getPlayerState(gameState.myID).gameState?.powerups[0];
    expect(yangSlot?.pendingCooldownEnd).toBe(1000 + duration);
  });

  it('tryUsePUP shakes and returns false when required selection is missing (Inferno)', () => {
    spyOn(performance, 'now').and.returnValue(1000);

    const shakeSlot = jasmine.createSpy('shakeSlot');

    setAccessContexts({
      mySelected: () => null,
      enemySelected: () => null,
      shakeSlot,
    });

    setSlot(0, {
      slotIndex: 0,
      lastCooldownEnd: 0,
      locked: false,
      pup: { pupID: 2000, type: 2, level: 0 }
    });

    const didDispatch = dispatcher.tryUsePUP(0);
    expect(didDispatch).toBe(false);
    expect(networkServiceSpy.send).not.toHaveBeenCalled();
    expect(shakeSlot).toHaveBeenCalledWith(0);

    const slot = gameState.getPlayerState(gameState.myID).gameState?.powerups[0];
    expect(slot?.pendingCooldownEnd).toBeUndefined();
  });

  it('tryUsePUP shakes and returns false when required selection is missing (Cryo)', () => {
    spyOn(performance, 'now').and.returnValue(1000);

    const shakeSlot = jasmine.createSpy('shakeSlot');

    setAccessContexts({
      mySelected: () => null,
      enemySelected: () => null,
      shakeSlot,
    });

    setSlot(0, {
      slotIndex: 0,
      lastCooldownEnd: 0,
      locked: false,
      pup: { pupID: 2000, type: 0, level: 0 }
    });

    const didDispatch = dispatcher.tryUsePUP(0);
    expect(didDispatch).toBe(false);
    expect(networkServiceSpy.send).not.toHaveBeenCalled();
    expect(shakeSlot).toHaveBeenCalledWith(0);

    const slot = gameState.getPlayerState(gameState.myID).gameState?.powerups[0];
    expect(slot?.pendingCooldownEnd).toBeUndefined();
  });

  it('tryUsePUP shakes and returns false when required selection is missing (Excavate)', () => {
    spyOn(performance, 'now').and.returnValue(1000);

    const shakeSlot = jasmine.createSpy('shakeSlot');

    setAccessContexts({
      mySelected: () => null,
      enemySelected: () => null,
      shakeSlot,
    });

    setSlot(0, {
      slotIndex: 0,
      lastCooldownEnd: 0,
      locked: false,
      pup: { pupID: 7000, type: 7, level: 0 }
    });

    const didDispatch = dispatcher.tryUsePUP(0);
    expect(didDispatch).toBe(false);
    expect(networkServiceSpy.send).not.toHaveBeenCalled();
    expect(shakeSlot).toHaveBeenCalledWith(0);

    const slot = gameState.getPlayerState(gameState.myID).gameState?.powerups[0];
    expect(slot?.pendingCooldownEnd).toBeUndefined();
  });

  it('tryUsePUP shakes and returns false when Lock has no positive selected value', () => {
    spyOn(performance, 'now').and.returnValue(1000);

    const shakeSlot = jasmine.createSpy('shakeSlot');

    setAccessContexts({
      mySelected: () => 0,
      enemySelected: () => null,
      getMyCellValue: () => 0,
      shakeSlot,
    });

    setSlot(0, {
      slotIndex: 0,
      lastCooldownEnd: 0,
      locked: false,
      pup: { pupID: 8000, type: 8, level: 0 }
    });

    const didDispatch = dispatcher.tryUsePUP(0);
    expect(didDispatch).toBe(false);
    expect(networkServiceSpy.send).not.toHaveBeenCalled();
    expect(shakeSlot).toHaveBeenCalledWith(0);
  });

  it('drawPup dispatches DRAW_PUP', () => {
    spyOn(performance, 'now').and.returnValue(1000);

    dispatcher.drawPup();

    expect(networkServiceSpy.send).toHaveBeenCalledWith(
      MechanicsActions.DRAW_PUP,
      jasmine.objectContaining({
        actionID: 0,
        clientTime: 1000,
      })
    );
  });

  it('tryUsePUP returns false when player gameState is missing', () => {
    const playerState = gameState.getPlayerState(gameState.myID);
    playerState.gameState = undefined;

    const didDispatch = dispatcher.tryUsePUP(0);
    expect(didDispatch).toBe(false);
  });

  it('throws when my board access is not set and a pup requires it', () => {
    const dispatcherWithoutAccess = new DuelActionDispatcher(networkServiceSpy);
    dispatcherWithoutAccess.gameInit(gameState);

    setSlot(0, {
      slotIndex: 0,
      lastCooldownEnd: 0,
      locked: false,
      pup: { pupID: 7000, type: 7, level: 0 }
    });

    expect(() => {
      dispatcherWithoutAccess.tryUsePUP(0);
    }).toThrowError('DuelActionDispatcher: my board access not set.');
  });

  it('throws when enemy board access is not set and a pup requires it', () => {
    const dispatcherWithoutAccess = new DuelActionDispatcher(networkServiceSpy);
    dispatcherWithoutAccess.gameInit(gameState);

    setSlot(0, {
      slotIndex: 0,
      lastCooldownEnd: 0,
      locked: false,
      pup: { pupID: 1000, type: 0, level: 0 }
    });

    expect(() => {
      dispatcherWithoutAccess.tryUsePUP(0);
    }).toThrowError('DuelActionDispatcher: enemy board access not set.');
  });

  it('Lock uses enemy selected value when my selection is null', () => {
    spyOn(performance, 'now').and.returnValue(1000);

    const shakeSlot = jasmine.createSpy('shakeSlot');
    setAccessContexts({
      mySelected: () => null,
      enemySelected: () => 10,
      getEnemyCellValue: () => 7,
      shakeSlot,
    });

    setSlot(0, {
      slotIndex: 0,
      lastCooldownEnd: 0,
      locked: false,
      pup: { pupID: 8000, type: 8, level: 0 }
    });

    const didDispatch = dispatcher.tryUsePUP(0);
    expect(didDispatch).toBe(true);
    expect(networkServiceSpy.send).toHaveBeenCalledWith(
      MetalPUPActions.USE_LOCK,
      jasmine.objectContaining({ pupID: 8000, targetID: 1, value: 7 })
    );
    expect(shakeSlot).not.toHaveBeenCalled();
  });

  it('Lock shakes when neither board has a selected value', () => {
    spyOn(performance, 'now').and.returnValue(1000);

    const shakeSlot = jasmine.createSpy('shakeSlot');
    setAccessContexts({
      mySelected: () => null,
      enemySelected: () => null,
      shakeSlot,
    });

    setSlot(0, {
      slotIndex: 0,
      lastCooldownEnd: 0,
      locked: false,
      pup: { pupID: 8000, type: 8, level: 0 }
    });

    const didDispatch = dispatcher.tryUsePUP(0);
    expect(didDispatch).toBe(false);
    expect(networkServiceSpy.send).not.toHaveBeenCalled();
    expect(shakeSlot).toHaveBeenCalled();
  });

  it('throws when dispatch is called before gameInit()', () => {
    const uninitialized = new DuelActionDispatcher(networkServiceSpy);

    expect(() => {
      uninitialized.dispatch({
        action: MechanicsActions.SET_CELL,
        cellIndex: 0,
        value: 1,
      });
    }).toThrowError('MatchActionDispatcher not initialized with a GameStateManager.');
  });

  it('getMyPupID throws when player gameState is missing', () => {
    type PrivateApi = {
      getMyPupID(slotIndex: number): number;
    };

    const playerState = gameState.getPlayerState(gameState.myID);
    playerState.gameState = undefined;

    const privateApi = dispatcher as unknown as PrivateApi;

    expect(() => {
      privateApi.getMyPupID(0);
    }).toThrowError('Player game state missing while using a PUP.');
  });

  it('getMyPupID throws when slot is empty', () => {
    type PrivateApi = {
      getMyPupID(slotIndex: number): number;
    };

    setSlot(0, { slotIndex: 0, lastCooldownEnd: 0, locked: false });

    const privateApi = dispatcher as unknown as PrivateApi;

    expect(() => {
      privateApi.getMyPupID(0);
    }).toThrowError('Attempted to use a PUP from an empty slot.');
  });
});
