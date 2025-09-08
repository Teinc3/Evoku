import { 
  isSystemActionsData, isMatchActionsData
} from "@shared/types/utils/typeguards/actions";
import UnionHandler from "./UnionHandler";
import SystemHandler from "./system";
import MatchHandler from "./match";

import type ActionEnum from "@shared/types/enums/actions";
import type WebSocketService from "../services/WebSocketService";
import type { SomeClientHandlerMapEntry } from "../../types/networking";


/**
 * Root packet handler for the client that routes all incoming packets
 * to the appropriate sub-handlers based on action type.
 */
export default class ClientPacketHandler extends UnionHandler<ActionEnum> {
  constructor(networkService: WebSocketService) {
    const systemHandler = new SystemHandler();
    const matchHandler = new MatchHandler(networkService);

    super([
      [isSystemActionsData, systemHandler],
      [isMatchActionsData, matchHandler]
    ] as SomeClientHandlerMapEntry<ActionEnum>[]);
  }
}
