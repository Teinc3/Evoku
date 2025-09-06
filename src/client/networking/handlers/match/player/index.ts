import { 
  isMechanicsActionsData, isPUPActionsData
} from "@shared/types/utils/typeguards/actions";
import UnionHandler from "../../UnionHandler";
import PUPHandler from "./powerups";
import MechanicsHandler from "./MechanicsHandler";

import type PlayerActions from "@shared/types/enums/actions/match/player";
import type { SomeClientHandlerMapEntry } from "../../../../types/networking";


export default class PlayerHandler extends UnionHandler<PlayerActions> {
  constructor() {
    const mechanicsHandler = new MechanicsHandler();
    const pupHandler = new PUPHandler();
    
    super([
      [isMechanicsActionsData, mechanicsHandler],
      [isPUPActionsData, pupHandler]
    ] as SomeClientHandlerMapEntry<PlayerActions>[]);
  }
}
