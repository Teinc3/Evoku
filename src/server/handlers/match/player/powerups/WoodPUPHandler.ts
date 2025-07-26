import WoodPUPActions from "@shared/types/enums/actions/match/player/powerups/wood";
import EnumHandler from "../../../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type SessionModel from "../../../../models/Session";


export default class WoodPUPHandler extends EnumHandler<WoodPUPActions> {
  constructor() {
    super();

    const handlerMap = {
      [WoodPUPActions.USE_ENTANGLE]: this.handleUseEntangle,
      [WoodPUPActions.USE_WISDOM]: this.handleUseWisdom
    };

    this.setHandlerMap(handlerMap);
  }

  private handleUseEntangle(_session: SessionModel, _data: AugmentAction<WoodPUPActions>): void {
    // Logic for handling use entangle action
  }

  private handleUseWisdom(_session: SessionModel, _data: AugmentAction<WoodPUPActions>): void {
    // Logic for handling use wisdom action
  }
}