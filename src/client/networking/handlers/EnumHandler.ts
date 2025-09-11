import type AugmentAction from "@shared/types/utils/AugmentAction";
import type ActionEnum from "@shared/types/enums/actions";
import type { default as IClientDataHandler, ClientHandlerMap } from "../../types/networking";


export default abstract class ClientEnumHandler<GenericEnum extends ActionEnum>
implements IClientDataHandler<GenericEnum> {

  /**
   * A map of action handlers for the enum.
   * Each key is an action from the enum, and each value is a corresponding handler fn.
   * 
   * @abstract
   */
  private handlerMap!: ClientHandlerMap<GenericEnum>;

  public setHandlerMap(handlerMap: ClientHandlerMap<GenericEnum>): void {
    this.handlerMap = handlerMap;

    // Bind "this" context to every handle function
    for (const key in this.handlerMap) {
      if (!this.handlerMap[key]) {
        continue; // Typeguard
      }
      this.handlerMap[key] = this.handlerMap[key]!.bind(this);
    }
  }

  public handleData(data: AugmentAction<GenericEnum>): void {
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
