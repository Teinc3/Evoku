import WoodPUPActions from "@shared/types/enums/actions/match/player/powerups/wood";
import EnumHandler from "../../../EnumHandler";

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

  private handleUseEntangle(_session: SessionModel, _data: AugmentAction<WoodPUPActions>): boolean {
    return true;
  }

  private handleUseWisdom(_session: SessionModel, _data: AugmentAction<WoodPUPActions>): boolean {
    return true;
  }
  
}