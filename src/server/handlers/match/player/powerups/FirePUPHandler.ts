import FirePUPActions from "@shared/types/enums/actions/match/player/powerups/fire";
import EnumHandler from "../../../EnumHandler";
import reject from "../../../../utils/reject";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type { IMatchEnumHandler } from "../../../../types/handler";
import type { RoomModel } from "../../../../models/networking";
import type { SessionModel } from "../../../../models/networking";


export default class FirePUPHandler extends EnumHandler<FirePUPActions>
  implements IMatchEnumHandler<FirePUPActions> {

  constructor(public readonly room: RoomModel) {
    super();

    const handlerMap = {
      [FirePUPActions.USE_INFERNO]: this.handleUseInferno,
      [FirePUPActions.USE_METABOLIC]: this.handleUseMetabolic
    };

    this.setHandlerMap(handlerMap);
  }

  private handleUseInferno(
    session: SessionModel,
    data: AugmentAction<FirePUPActions.USE_INFERNO>
  ): boolean {
    const playerID = this.room.getPlayerID(session);
    if (playerID === undefined) {
      return false;
    } else if (data.cellIndex < 0 || data.cellIndex >= 81 || data.targetID !== 1 - playerID) {
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
      cellIndex: data.cellIndex,
      serverTimeoutID: timeoutID,
    });

    this.room.broadcast(FirePUPActions.INFERNO_USED, {
      serverTime: result,
      playerID,
      ...payload
    });

    return true;
  }

  private handleUseMetabolic(
    session: SessionModel,
    data: AugmentAction<FirePUPActions.USE_METABOLIC>
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

    this.room.broadcast(FirePUPActions.METABOLIC_USED, {
      serverTime: result,
      playerID,
      ...payload
    });

    return true;
  }
  
}
