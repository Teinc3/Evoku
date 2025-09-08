import { 
  isLifecycleActionsData, isPlayerActionsData, isProtocolActionsData
} from "@shared/types/utils/typeguards/actions";
import UnionHandler from "../UnionHandler";
import ProtocolHandler from "./ProtocolHandler";
import PlayerHandler from "./player";
import LifecycleHandler from "./LifecycleHandler";

import type MatchActions from "@shared/types/enums/actions/match";
import type WebSocketService from "../../services/WebSocketService";
import type { SomeClientHandlerMapEntry } from "../../../types/networking";


export default class MatchHandler extends UnionHandler<MatchActions> {
  constructor(networkService: WebSocketService) {
    const lifecycleHandler = new LifecycleHandler();
    const playerHandler = new PlayerHandler();
    const protocolHandler = new ProtocolHandler(networkService);

    super([
      [isLifecycleActionsData, lifecycleHandler],
      [isPlayerActionsData, playerHandler],
      [isProtocolActionsData, protocolHandler]
    ] as SomeClientHandlerMapEntry<MatchActions>[]);
  }
}
