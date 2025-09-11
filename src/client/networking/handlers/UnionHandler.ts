import type AugmentAction from "@shared/types/utils/AugmentAction";
import type ActionEnum from "@shared/types/enums/actions";
import type { 
  default as IClientDataHandler, SomeClientHandlerMapEntry 
} from "../../types/networking";


/**
 * An abstract class for handlers that routes data to specialized sub-handlers
 * based on a type guard.
 */
export default abstract class ClientUnionHandler<GenericActionUnion extends ActionEnum> 
implements IClientDataHandler<GenericActionUnion> {

  /**
   * A map of type guards and their corresponding handlers.
   * Each entry is a tuple where the first element is a type guard function
   * and the second element is an IClientDataHandler instance.
   */
  private handlerMap: SomeClientHandlerMapEntry<GenericActionUnion>[];

  constructor(handlerMap: SomeClientHandlerMapEntry<GenericActionUnion>[]) {
    this.handlerMap = handlerMap;
  }

  /**
   * Iterates through the handler map and routes the data to the first matching handler.
   * @param data The augmented data packet.
   */
  public handleData(data: AugmentAction<GenericActionUnion>): void {
    for (const [typeGuard, handler] of this.handlerMap) {
      if (typeGuard(data)) {
        // The type guard has narrowed the type of 'data', so we can safely pass it.
        try {
          handler.handleData(data);
          return; // Stop at first match
        } catch (error) {
          console.error(`Error in client union handler for action ${String(data.action)}:`, error);
          return;
        }
      }
    }
    console.warn(`No client handler found for action ${String(data.action)}`);
  }
}
