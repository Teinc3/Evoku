import type AugmentAction from "@shared/types/utils/AugmentAction";
import type ActionEnum from "@shared/types/enums/actions";
import type IDataHandler from "../types/handler";
import type { SomeHandlerMapEntry } from "../types/handler";
import type { SessionModel } from "../models/networking";


/**
 * An abstract class for handlers that route data to specialized sub-handlers
 * based on a type guard.
 */
export default abstract class UnionHandler<GenericActionUnion extends ActionEnum> 
implements IDataHandler<GenericActionUnion> {

  /**
   * A map of type guards and their corresponding handlers.
   * Each entry is a tuple where the first element is a type guard function
   * and the second element is an IDataHandler instance.
   */
  private handlerMap: SomeHandlerMapEntry<GenericActionUnion>[];

  constructor(handlerMap: SomeHandlerMapEntry<GenericActionUnion>[]) {
    this.handlerMap = handlerMap;
  }

  /**
   * Iterates through the handler map and routes the data to the first matching handler.
   * @param session The session object of the player.
   * @param data The augmented data packet.
   */
  public async handleData(
    session: SessionModel, 
    data: AugmentAction<GenericActionUnion>
  ): Promise<boolean> {
    for (const [typeGuard, handler] of this.handlerMap) {
      if (typeGuard(data)) {
        // The type guard has narrowed the type of 'data', so we can safely pass it.
        return await handler.handleData(session, data);
      }
    }
    return false;
  }
}
