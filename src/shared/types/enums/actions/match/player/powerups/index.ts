import type WoodPUPActions from "./wood";
import type WaterPUPActions from "./water";
import type MetalPUPActions from "./metal";
import type FirePUPActions from "./fire";
import type EarthPUPActions from "./earth";


type PUPActions = EarthPUPActions | FirePUPActions | WaterPUPActions | MetalPUPActions | WoodPUPActions;

export default PUPActions;