import type AugmentAction from "@shared/types/utils/AugmentAction";
import type ActionEnum from "@shared/types/enums/actions";
import type { default as IDataHandler, HandlerMap } from "../types/handler";
import type SessionModel from "../models/networking/Session";


export default abstract class EnumHandler<GenericEnum extends ActionEnum>
implements IDataHandler<GenericEnum> {

  /**
   * A map of action handlers for the enum.
   * Each key is an action from the enum, and each value is a corresponding handler fn.
   * 
   * @abstract
   */
  private handlerMap!: HandlerMap<GenericEnum>;

  public setHandlerMap(handlerMap: HandlerMap<GenericEnum>): void {
    this.handlerMap = handlerMap;

    // Bind "this" context to every handle function
    for (const key in this.handlerMap) {
      if (!this.handlerMap[key]) {
        continue; // Typeguard
      }
      this.handlerMap[key] = this.handlerMap[key].bind(this);
    }
  }

  public async handleData(
    session: SessionModel, 
    data: AugmentAction<GenericEnum>
  ): Promise<boolean> {
    const handler = this.handlerMap[data.action];

    if (handler) {
      // The data type is correctly inferred here because of how `action` and `handlerMap` are typed
      return await handler(session, data);
    } else {
      return false;
    }
  }
    
}