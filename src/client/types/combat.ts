import type DefuseType from "./enums/defuse-type";
import type FloatingTextType from "./enums/floating-text-type";


/** Data structure for active threat/combat state */
export interface ThreatData {
  /** Icon path for the incoming powerup */
  pupIcon: string;
  /** Defuse pattern required */
  defuseType: DefuseType;
  /** Countdown in milliseconds */
  timeRemainingMs: number;
  /** Target indices for ghost effect */
  targetIndices?: number[];
}

/** Data structure for floating text notification */
export interface FloatingTextData {
  /** Type of outcome text to display */
  type: FloatingTextType;
  /** Unique ID for tracking lifecycle */
  id: number;
}
