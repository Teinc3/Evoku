import FirePUPActions from "@shared/types/enums/actions/match/player/powerups/fire";
import EnumHandler from "../../../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type { IMatchEnumHandler } from "../../../../types/handler";
import type SessionModel from "../../../../models/networking/Session";
import type RoomModel from "../../../../models/networking/Room";


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

  private handleUseInferno(_session: SessionModel, _data: AugmentAction<FirePUPActions>): boolean {
    return true;
  }

  private handleUseMetabolic(
    _session: SessionModel,
    _data: AugmentAction<FirePUPActions>
  ): boolean {
    return true;
  }
  
}