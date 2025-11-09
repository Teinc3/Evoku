import ActionGuard from "@shared/types/utils/typeguards/actions";
import UnionHandler from "../../../UnionHandler";
import WoodPUPHandler from "./WoodPUPHandler";
import WaterPUPHandler from "./WaterPUPHandler";
import MetalPUPHandler from "./MetalPUPHandler";
import FirePUPHandler from "./FirePUPHandler";
import EarthPUPHandler from "./EarthPUPHandler";

import type PUPActions from "@shared/types/enums/actions/match/player/powerups/";
import type { SomeHandlerMapEntry } from "../../../../types/handler";
import type { RoomModel } from "../../../../models/networking";


export default class PUPHandler extends UnionHandler<PUPActions> {
  constructor(room: RoomModel) {
    const firePUPHandler = new FirePUPHandler(room);
    const waterPUPHandler = new WaterPUPHandler(room);
    const woodPUPHandler = new WoodPUPHandler(room);
    const metalPUPHandler = new MetalPUPHandler(room);
    const earthPUPHandler = new EarthPUPHandler(room);

    super([
      [ActionGuard.isFirePUPActionsData, firePUPHandler],
      [ActionGuard.isWaterPUPActionsData, waterPUPHandler],
      [ActionGuard.isWoodPUPActionsData, woodPUPHandler],
      [ActionGuard.isMetalPUPActionsData, metalPUPHandler],
      [ActionGuard.isEarthPUPActionsData, earthPUPHandler]
    ] as SomeHandlerMapEntry<PUPActions>[]);
  }
}
