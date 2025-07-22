import type WoodPUPActionMap from "./wood";
import type WaterPUPActionMap from "./water";
import type MetalPUPActionMap from "./metal";
import type FirePUPActionMap from "./fire";
import type EarthPUPActionMap from "./earth";


export default interface PUPActionMap extends
  EarthPUPActionMap,
  FirePUPActionMap,
  WaterPUPActionMap,
  WoodPUPActionMap,
  MetalPUPActionMap {}