import type AugmentAction from "../AugmentAction";
import type SystemActions from "../../enums/actions/system";
import type PUPActions from "../../enums/actions/match/player/powerups";
import type PlayerActions from "../../enums/actions/match/player";
import type MatchActions from "../../enums/actions/match";
import type ActionEnum from "../../enums/actions";
import type SessionActions from "../../enums/actions/system/session";
import type LobbyActions from "../../enums/actions/system/lobby";
import type ProtocolActions from "../../enums/actions/match/protocol";
import type LifecycleActions from "../../enums/actions/match/lifecycle";
import type MechanicsActions from "../../enums/actions/match/player/mechanics";
import type FirePUPActions from "../../enums/actions/match/player/powerups/fire";
import type WaterPUPActions from "../../enums/actions/match/player/powerups/water";
import type WoodPUPActions from "../../enums/actions/match/player/powerups/wood";
import type MetalPUPActions from "../../enums/actions/match/player/powerups/metal";
import type EarthPUPActions from "../../enums/actions/match/player/powerups/earth";


// --- Optimized Range-Based Action Type System ---
// Instead of multiple Sets, use range checks for better performance and memory efficiency.
// Each enum category uses distinct, non-overlapping numeric ranges.

interface ActionRange {
  readonly min: number;
  readonly max: number;
}

const ACTION_RANGES = {
  PROTOCOL: { min: -12, max: -10 } as ActionRange,      // PING, PONG, REJECT_ACTION
  SESSION: { min: -20, max: -20 } as ActionRange,       // HEARTBEAT
  LOBBY: { min: -53, max: -50 } as ActionRange,         // JOIN_QUEUE, LEAVE_QUEUE, QUEUE_UPDATE, MATCH_FOUND
  LIFECYCLE: { min: -61, max: -60 } as ActionRange,     // GAME_INIT, GAME_OVER
  MECHANICS: { min: -4, max: -1 } as ActionRange,       // SET_CELL, CELL_SET, DRAW_PUP, PUP_DRAWN
  WATER_PUP: { min: 10, max: 13 } as ActionRange,       // USE_CRYO, CRYO_USED, USE_CASCADE, CASCADE_USED
  FIRE_PUP: { min: 20, max: 23 } as ActionRange,        // USE_INFERNO, INFERNO_USED, USE_METABOLIC, METABOLIC_USED
  WOOD_PUP: { min: 30, max: 33 } as ActionRange,        // USE_ENTANGLE, ENTANGLE_USED, USE_WISDOM, WISDOM_USED
  METAL_PUP: { min: 40, max: 43 } as ActionRange,       // USE_LOCK, LOCK_USED, USE_FORGE, FORGE_USED
  EARTH_PUP: { min: 50, max: 53 } as ActionRange,       // USE_LANDSLIDE, LANDSLIDE_USED, USE_EXCAVATE, EXCAVATE_USED
} as const;

/**
 * Fast range check utility - single comparison for each bound
 */
function inRange(value: number, range: ActionRange): boolean {
  return value >= range.min && value <= range.max;
}


// --- High-Performance Range-Based Type Guards ---
// Optimized version that eliminates multiple function calls

export function isActionEnum(action: number): action is ActionEnum {
  // Single comprehensive check - avoid hierarchical calls for performance
  return (action >= -61 && action <= -60) ||  // Lifecycle
         (action >= -53 && action <= -50) ||  // Lobby  
         (action === -20) ||                  // Session
         (action >= -12 && action <= -10) ||  // Protocol
         (action >= -4 && action <= -1) ||    // Mechanics
         (action >= 10 && action <= 13) ||    // Water PUP
         (action >= 20 && action <= 23) ||    // Fire PUP
         (action >= 30 && action <= 33) ||    // Wood PUP
         (action >= 40 && action <= 43) ||    // Metal PUP
         (action >= 50 && action <= 53);      // Earth PUP
}

export function isSystemActions(action: number): action is SystemActions {
  return (action >= -53 && action <= -50) ||  // Lobby
         (action === -20);                     // Session
}

export function isLobbyActions(action: number): action is LobbyActions {
  return inRange(action, ACTION_RANGES.LOBBY);
}

export function isSessionActions(action: number): action is SessionActions {
  return inRange(action, ACTION_RANGES.SESSION);
}

export function isMatchActions(action: number): action is MatchActions {
  return (action >= -61 && action <= -60) ||  // Lifecycle
         (action >= -12 && action <= -10) ||  // Protocol
         (action >= -4 && action <= -1) ||    // Mechanics
         (action >= 10 && action <= 13) ||    // Water PUP
         (action >= 20 && action <= 23) ||    // Fire PUP
         (action >= 30 && action <= 33) ||    // Wood PUP
         (action >= 40 && action <= 43) ||    // Metal PUP
         (action >= 50 && action <= 53);      // Earth PUP
}

export function isPlayerActions(action: number): action is PlayerActions {
  return (action >= -4 && action <= -1) ||    // Mechanics
         (action >= 10 && action <= 13) ||    // Water PUP
         (action >= 20 && action <= 23) ||    // Fire PUP
         (action >= 30 && action <= 33) ||    // Wood PUP
         (action >= 40 && action <= 43) ||    // Metal PUP
         (action >= 50 && action <= 53);      // Earth PUP
}

export function isMechanicsActions(action: number): action is MechanicsActions {
  return inRange(action, ACTION_RANGES.MECHANICS);
}

export function isPUPActions(action: number): action is PUPActions {
  return (action >= 10 && action <= 13) ||    // Water PUP
         (action >= 20 && action <= 23) ||    // Fire PUP
         (action >= 30 && action <= 33) ||    // Wood PUP
         (action >= 40 && action <= 43) ||    // Metal PUP
         (action >= 50 && action <= 53);      // Earth PUP
}

export function isFirePUPActions(action: number): action is FirePUPActions {
  return inRange(action, ACTION_RANGES.FIRE_PUP);
}

export function isWaterPUPActions(action: number): action is WaterPUPActions {
  return inRange(action, ACTION_RANGES.WATER_PUP);
}

export function isWoodPUPActions(action: number): action is WoodPUPActions {
  return inRange(action, ACTION_RANGES.WOOD_PUP);
}

export function isMetalPUPActions(action: number): action is MetalPUPActions {
  return inRange(action, ACTION_RANGES.METAL_PUP);
}

export function isEarthPUPActions(action: number): action is EarthPUPActions {
  return inRange(action, ACTION_RANGES.EARTH_PUP);
}

export function isProtocolActions(action: number): action is ProtocolActions {
  return inRange(action, ACTION_RANGES.PROTOCOL);
}

export function isLifecycleActions(action: number): action is LifecycleActions {
  return inRange(action, ACTION_RANGES.LIFECYCLE);
}

// --- Generic Wrapper to Create Data-Level Guards ---

/**
 * A higher-order function that takes a simple enum type guard and returns a new
 * type guard that operates on the full packet object (`AugmentAction`).
 *
 * @param enumGuard The simple type guard for the action enum (e.g., `isSystemActions`).
 * @returns A new type guard that narrows the type of the entire packet object.
 */
function createDataGuard<GenericActionOrType extends ActionEnum>(
  enumGuard: (action: number) => action is GenericActionOrType
): (packet: { action: number }) => packet is AugmentAction<GenericActionOrType> {
  return (packet: { action: number }): packet is AugmentAction<GenericActionOrType> => {
    return enumGuard(packet.action);
  };
}


// --- Exported Data-Level Guards for Use in Application Code ---

export const isSystemActionsData = createDataGuard(isSystemActions);
export const isLobbyActionsData = createDataGuard(isLobbyActions);
export const isSessionActionsData = createDataGuard(isSessionActions);

export const isMatchActionsData = createDataGuard(isMatchActions);
export const isPlayerActionsData = createDataGuard(isPlayerActions);
export const isMechanicsActionsData = createDataGuard(isMechanicsActions);
export const isPUPActionsData = createDataGuard(isPUPActions);
export const isProtocolActionsData = createDataGuard(isProtocolActions);
export const isLifecycleActionsData = createDataGuard(isLifecycleActions);

export const isFirePUPActionsData = createDataGuard(isFirePUPActions);
export const isWaterPUPActionsData = createDataGuard(isWaterPUPActions);
export const isWoodPUPActionsData = createDataGuard(isWoodPUPActions);
export const isMetalPUPActionsData = createDataGuard(isMetalPUPActions);
export const isEarthPUPActionsData = createDataGuard(isEarthPUPActions);