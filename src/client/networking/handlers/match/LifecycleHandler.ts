import LifecycleActions from "@shared/types/enums/actions/match/lifecycle";
import EnumHandler from "../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";


export default class LifecycleHandler extends EnumHandler<LifecycleActions> {
  constructor() {
    super();

    const handlerMap = {
      [LifecycleActions.GAME_INIT]: this.handleGameInit,
      [LifecycleActions.GAME_OVER]: this.handleGameOver,
    };

    this.setHandlerMap(handlerMap);
  }

  private handleGameInit(_data: AugmentAction<LifecycleActions.GAME_INIT>): void {
    // Handle game initialization
    console.debug('Game initialized');
  }

  private handleGameOver(_data: AugmentAction<LifecycleActions.GAME_OVER>): void {
    // Handle game over
    console.debug('Game over');
  }
}
