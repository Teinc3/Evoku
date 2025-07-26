import type ActionEnum from "@shared/types/enums/actions";
import type { HandleDataFn } from "../types/handler";
import type IDataHandler from "../types/handler";


export default abstract class DataHandler<
  SpecificActionEnum extends ActionEnum
> implements IDataHandler {
  abstract packetMap: {
    [key in SpecificActionEnum]: HandleDataFn<key>;
  };
  abstract handleData: HandleDataFn<SpecificActionEnum>;

  constructor() {
    // Bind all packetMap handlers to the current instance
    for (const [action, handlerFn] of Object.entries(this.packetMap)) {
      this.packetMap[action] = handlerFn.bind(this);
    }
  }
}