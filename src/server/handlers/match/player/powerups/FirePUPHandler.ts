import FirePUPActions from "@shared/types/enums/actions/match/player/powerups/fire";
import EnumHandler from "../../../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type SessionModel from "../../../../models/Session";


export default class FirePUPHandler extends EnumHandler<FirePUPActions> {
  constructor() {
    super();

    const handlerMap = {
      [FirePUPActions.USE_INFERNO]: this.handleUseInferno,
      [FirePUPActions.USE_METABOLIC]: this.handleUseMetabolic
    };

    this.setHandlerMap(handlerMap);
  }

  private handleUseInferno(_session: SessionModel, _data: AugmentAction<FirePUPActions>): void {
    // Logic for handling use inferno action
  }

  private handleUseMetabolic(_session: SessionModel, _data: AugmentAction<FirePUPActions>): void {
    // Logic for handling use metabolic action
  }
}