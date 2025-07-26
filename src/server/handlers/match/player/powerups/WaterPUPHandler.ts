import WaterPUPActions from "@shared/types/enums/actions/match/player/powerups/water";
import EnumHandler from "../../../EnumHandler";

import type RoomModel from "src/server/models/Room";
import type AugmentAction from "@shared/types/utils/AugmentAction";
import type SessionModel from "../../../../models/Session";


export default class WaterPUPHandler extends EnumHandler<WaterPUPActions> {
  constructor(private readonly _room: RoomModel) {
    super();

    const handlerMap = {
      [WaterPUPActions.USE_CRYO]: this.handleUseCryo,
      [WaterPUPActions.USE_CASCADE]: this.handleUseCascade
    };

    this.setHandlerMap(handlerMap);
  }

  private handleUseCryo(_session: SessionModel, _data: AugmentAction<WaterPUPActions>): void {
    // Logic for handling use cryo action
  }

  private handleUseCascade(_session: SessionModel, _data: AugmentAction<WaterPUPActions>): void {
    // Logic for handling use cascade action
  }
}