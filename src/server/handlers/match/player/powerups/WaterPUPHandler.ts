import WaterPUPActions from "@shared/types/enums/actions/match/player/powerups/water";
import EnumHandler from "../../../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type SessionModel from "../../../../models/networking/Session";
import type RoomModel from "../../../../models/networking/Room";


export default class WaterPUPHandler extends EnumHandler<WaterPUPActions> {
  constructor(private readonly _room: RoomModel) {
    super();

    const handlerMap = {
      [WaterPUPActions.USE_CRYO]: this.handleUseCryo,
      [WaterPUPActions.USE_CASCADE]: this.handleUseCascade
    };

    this.setHandlerMap(handlerMap);
  }

  private handleUseCryo(_session: SessionModel, _data: AugmentAction<WaterPUPActions>): boolean {
    return true;
  }

  private handleUseCascade(_session: SessionModel, _data: AugmentAction<WaterPUPActions>): boolean {
    return true;
  }
}