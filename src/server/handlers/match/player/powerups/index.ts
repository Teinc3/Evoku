import { 
  isMechanicsActionsData, isPUPActionsData
} from "@shared/types/utils/typeguards/actions";
import UnionHandler from "../../../UnionHandler";
import WoodPUPHandler from "./WoodPUPHandler";
import WaterPUPHandler from "./WaterPUPHandler";
import MetalPUPHandler from "./MetalPUPHandler";
import FirePUPHandler from "./FirePUPHandler";
import EarthPUPHandler from "./EarthPUPHandler";

import type RoomModel from "src/server/models/Room";
import type PUPActions from "@shared/types/enums/actions/match/player/powerups/";
import type { SomeHandlerMapEntry } from "../../../../types/handler";


export default class PUPHandler extends UnionHandler<PUPActions> {
  constructor(room: RoomModel) {
    const firePUPHandler = new FirePUPHandler(room);
    const waterPUPHandler = new WaterPUPHandler(room);
    const woodPUPHandler = new WoodPUPHandler(room);
    const metalPUPHandler = new MetalPUPHandler(room);
    const earthPUPHandler = new EarthPUPHandler(room);

    super([
      [isMechanicsActionsData, firePUPHandler],
      [isPUPActionsData, waterPUPHandler],
      [isPUPActionsData, woodPUPHandler],
      [isPUPActionsData, metalPUPHandler],
      [isPUPActionsData, earthPUPHandler]
    ] as SomeHandlerMapEntry<PUPActions>[]);
  }
}