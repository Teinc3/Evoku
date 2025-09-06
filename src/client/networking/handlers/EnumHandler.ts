import type AugmentAction from "@shared/types/utils/AugmentAction";
import type ActionEnum from "@shared/types/enums/actions";
import type { IClientDataHandler, ClientHandlerMap } from "../../types/networking";


/**
 * An abstract class for handlers that route data to specialized sub-handlers
 * based on enum action types.
 */
export default abstract class EnumHandler<GenericActionEnum extends ActionEnum> 
implements IClientDataHandler<GenericActionEnum> {

  /**
   * A map of action handlers for the enum.
   * Each key is an action from the enum, and each value is a corresponding handler fn.
   * 
   * @abstract
   */
  private handlerMap!: ClientHandlerMap<GenericActionEnum>;

  public setHandlerMap(handlerMap: ClientHandlerMap<GenericActionEnum>): void {
    this.handlerMap = handlerMap;

    // Bind "this" context to every handle function
    for (const key in this.handlerMap) {
      if (!this.handlerMap[key]) {
        continue; // Typeguard
      }
      this.handlerMap[key] = this.handlerMap[key]!.bind(this);
    }
  }

  public handleData(data: AugmentAction<GenericActionEnum>): void {
    const handler = this.handlerMap[data.action];

    if (handler) {
      // The data type is correctly inferred here because of how `action` and `handlerMap` are typed
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in client handler for action ${String(data.action)}:`, error);
      }
    } else {
      console.warn(`No client handler registered for action ${String(data.action)}`);
    }
  }
}
