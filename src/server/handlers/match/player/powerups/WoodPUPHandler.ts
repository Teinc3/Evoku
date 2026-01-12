import WoodPUPActions from "@shared/types/enums/actions/match/player/powerups/wood";
import EnumHandler from "../../../EnumHandler";
import reject from "../../../../utils/reject";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type { IMatchEnumHandler } from "../../../../types/handler";
import type { RoomModel } from "../../../../models/networking";
import type { SessionModel } from "../../../../models/networking";


export default class WoodPUPHandler extends EnumHandler<WoodPUPActions>
  implements IMatchEnumHandler<WoodPUPActions> {

  constructor(public readonly room: RoomModel) {
    super();

    const handlerMap = {
      [WoodPUPActions.USE_ENTANGLE]: this.handleUseEntangle,
      [WoodPUPActions.USE_WISDOM]: this.handleUseWisdom
    };

    this.setHandlerMap(handlerMap);
  }

  private handleUseEntangle(
    session: SessionModel,
    data: AugmentAction<WoodPUPActions.USE_ENTANGLE>
  ): boolean {
    const playerID = this.room.getPlayerID(session);
    if (playerID === undefined || data.targetID !== 1 - playerID) {
      return false;
    }

    const { action, clientTime, ...payload } = data;
    const result = this.room.stateController.consumePUP(action, playerID, data.pupID, clientTime);

    if (result === false) {
      reject(this.room, session, data.actionID);
      return true;
    }

    const newTime = result + this.room.stateController.currentChallengeDuration;
    const timeoutID = this.room.setTrackedTimeout(() => {
      this.room.lifecycle.onThreatExpired(playerID, data.pupID, newTime, timeoutID);
    }, this.room.stateController.currentChallengeDuration);

    this.room.stateController.setPUPPendingEffect(playerID, data.pupID, {
      targetID: data.targetID,
      serverTimeoutID: timeoutID,
    });

    this.room.broadcast(WoodPUPActions.ENTANGLE_USED, {
      serverTime: result,
      playerID,
      ...payload
    });

    return true;
  }

  private handleUseWisdom(
    session: SessionModel,
    data: AugmentAction<WoodPUPActions.USE_WISDOM>
  ): boolean {
    const playerID = this.room.getPlayerID(session);
    if (playerID === undefined) {
      return false;
    }

    const { action, clientTime, ...payload } = data;
    const result = this.room.stateController.consumePUP(action, playerID, data.pupID, clientTime);

    if (result === false) {
      reject(this.room, session, data.actionID);
      return true;
    }

    // Randomly generate a cell index and reveal it's "solution"
    const cellIndex = Math.floor(Math.random() * 81);
    const value = this.room.stateController.getSolution(playerID, cellIndex);
    if (!value) {
      return false; // Internal error...
    }

    this.room.broadcast(WoodPUPActions.WISDOM_USED, {
      serverTime: result,
      playerID,
      cellIndex,
      value,
      ...payload
    });

    return true;
  }
}
