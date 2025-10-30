import WaterPUPActions from "@shared/types/enums/actions/match/player/powerups/water";
import EnumHandler from "../../../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type { IMatchEnumHandler } from "../../../../types/handler";
import type SessionModel from "../../../../models/networking/Session";
import type RoomModel from "../../../../models/networking/Room";


export default class WaterPUPHandler extends EnumHandler<WaterPUPActions>
  implements IMatchEnumHandler<WaterPUPActions> {

  constructor(public readonly room: RoomModel) {
    super();

    const handlerMap = {
      [WaterPUPActions.USE_CRYO]: this.handleUseCryo,
      [WaterPUPActions.USE_PURITY]: this.handleUsePurity
    };

    this.setHandlerMap(handlerMap);
  }

  private handleUseCryo(_session: SessionModel, _data: AugmentAction<WaterPUPActions>): boolean {
    return true;
  }

  private handleUsePurity(_session: SessionModel, _data: AugmentAction<WaterPUPActions>): boolean {
    return true;
  }
  
}