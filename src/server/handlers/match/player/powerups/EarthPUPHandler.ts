import EarthPUPActions from "@shared/types/enums/actions/match/player/powerups/earth";
import EnumHandler from "../../../EnumHandler";
import reject from "../../../../utils/reject";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type { IMatchEnumHandler } from "../../../../types/handler";
import type { RoomModel } from "../../../../models/networking";
import type { SessionModel } from "../../../../models/networking";


export default class EarthPUPHandler extends EnumHandler<EarthPUPActions>
  implements IMatchEnumHandler<EarthPUPActions> {

  constructor(public readonly room: RoomModel) {
    super();

    const handlerMap = {
      [EarthPUPActions.USE_LANDSLIDE]: this.handleUseLandslide,
      [EarthPUPActions.USE_EXCAVATE]: this.handleUseExcavate
    };

    this.setHandlerMap(handlerMap);
  }

  private handleUseLandslide(
    session: SessionModel,
    data: AugmentAction<EarthPUPActions.USE_LANDSLIDE>
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

    // Random cell index to apply landslide to
    // This is just a placeholder until the actual logic is implemented
    const cellIndex = Math.floor(Math.random() * 81);

    const timeoutID = this.room.setTrackedTimeout(() => {
      this.room.lifecycle.onThreatExpired(playerID, data.pupID, timeoutID);
    }, this.room.stateController.currentChallengeDuration);

    this.room.stateController.setPUPPendingEffect(playerID, data.pupID, {
      targetID: data.targetID,
      cellIndex,
      serverTimeoutID: timeoutID,
    });

    this.room.broadcast(EarthPUPActions.LANDSLIDE_USED, {
      serverTime: result,
      playerID,
      ...payload,
      cellIndex
    });

    return true;
  }

  private handleUseExcavate(
    session: SessionModel,
    data: AugmentAction<EarthPUPActions.USE_EXCAVATE>
  ): boolean {
    const playerID = this.room.getPlayerID(session);
    if (playerID === undefined || data.cellIndex < 0 || data.cellIndex >= 81) {
      return false;
    }

    const { action, clientTime, ...payload } = data;
    const result = this.room.stateController.consumePUP(action, playerID, data.pupID, clientTime);

    if (result === false) {
      reject(this.room, session, data.actionID);
      return true;
    }

    this.room.broadcast(EarthPUPActions.EXCAVATE_USED, {
      serverTime: result,
      playerID,
      ...payload
    });

    return true;
  }

}
