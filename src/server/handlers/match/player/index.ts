import { 
  isMechanicsActionsData, isPUPActionsData
} from "@shared/types/utils/typeguards/actions";
import UnionHandler from "../../UnionHandler";
import PUPHandler from "./powerups";
import MechanicsHandler from "./MechanicsHandler";

import type PlayerActions from "@shared/types/enums/actions/match/player";
import type { SomeHandlerMapEntry } from "../../../types/handler";
import type RoomModel from "../../../models/Room";


export default class PlayerHandler extends UnionHandler<PlayerActions> {
  constructor(room: RoomModel) {
    const mechanicsHandler = new MechanicsHandler(room);
    const pupHandler = new PUPHandler(room);
    
    super([
      [isMechanicsActionsData, mechanicsHandler],
      [isPUPActionsData, pupHandler]
    ] as SomeHandlerMapEntry<PlayerActions>[]);
  }
}