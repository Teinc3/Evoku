import SessionActions from "../../enums/actions/system/session";
import LobbyActions from "../../enums/actions/system/lobby";
import ProtocolActions from "../../enums/actions/match/protocol";
import WoodPUPActions from "../../enums/actions/match/player/powerups/wood";
import WaterPUPActions from "../../enums/actions/match/player/powerups/water";
import MetalPUPActions from "../../enums/actions/match/player/powerups/metal";
import FirePUPActions from "../../enums/actions/match/player/powerups/fire";
import EarthPUPActions from "../../enums/actions/match/player/powerups/earth";
import MechanicsActions from "../../enums/actions/match/player/mechanics";
import LifecycleActions from "../../enums/actions/match/lifecycle";

import type AugmentAction from "../AugmentAction";
import type SystemActions from "../../enums/actions/system";
import type PUPActions from "../../enums/actions/match/player/powerups";
import type PlayerActions from "../../enums/actions/match/player";
import type MatchActions from "../../enums/actions/match";
import type ActionEnum from "../../enums/actions";


// --- Pre-computed Sets for O(1) Lookups ---
// This work is done only once when the module is loaded.
// Creating sets for ALL levels of the hierarchy for efficient lookup

// Leaf-level sets (lowest level enums)
const lobbyActionValues = new Set(Object.values(LobbyActions));
const sessionActionValues = new Set(Object.values(SessionActions));
const mechanicsActionValues = new Set(Object.values(MechanicsActions));
const firePUPActionValues = new Set(Object.values(FirePUPActions));
const waterPUPActionValues = new Set(Object.values(WaterPUPActions));
const woodPUPActionValues = new Set(Object.values(WoodPUPActions));
const metalPUPActionValues = new Set(Object.values(MetalPUPActions));
const earthPUPActionValues = new Set(Object.values(EarthPUPActions));
const protocolActionValues = new Set(Object.values(ProtocolActions));
const lifecycleActionValues = new Set(Object.values(LifecycleActions));

// Higher-level composite sets (union of child sets)
const pupActionValues = new Set([
  ...firePUPActionValues,
  ...waterPUPActionValues,
  ...woodPUPActionValues,
  ...metalPUPActionValues,
  ...earthPUPActionValues
]);

const playerActionValues = new Set([
  ...mechanicsActionValues,
  ...pupActionValues
]);

const matchActionValues = new Set([
  ...playerActionValues,
  ...protocolActionValues,
  ...lifecycleActionValues
]);

const systemActionValues = new Set([
  ...lobbyActionValues,
  ...sessionActionValues
]);

const actionEnumValues = new Set([
  ...systemActionValues,
  ...matchActionValues
]);


// --- Type Guard Mapping System ---
// Maps action types to their corresponding sets for generic type checking

const typeGuardMap = new Map<string, Set<number>>([
  ['ActionEnum', actionEnumValues as Set<number>],
  ['SystemActions', systemActionValues as Set<number>], 
  ['LobbyActions', lobbyActionValues as Set<number>],
  ['SessionActions', sessionActionValues as Set<number>],
  ['MatchActions', matchActionValues as Set<number>],
  ['PlayerActions', playerActionValues as Set<number>],
  ['MechanicsActions', mechanicsActionValues as Set<number>],
  ['PUPActions', pupActionValues as Set<number>],
  ['FirePUPActions', firePUPActionValues as Set<number>],
  ['WaterPUPActions', waterPUPActionValues as Set<number>],
  ['WoodPUPActions', woodPUPActionValues as Set<number>],
  ['MetalPUPActions', metalPUPActionValues as Set<number>],
  ['EarthPUPActions', earthPUPActionValues as Set<number>],
  ['ProtocolActions', protocolActionValues as Set<number>],
  ['LifecycleActions', lifecycleActionValues as Set<number>]
]);

/**
 * Generic type guard function that checks if an action belongs to a specific type.
 * Since Union Types aren't available at runtime, we use string keys to identify types.
 * 
 * @param action The action number to check
 * @param typeName String identifier for the action type
 * @returns True if the action belongs to the specified type
 */
export function isActionOfType(action: number, typeName: string): boolean {
  const actionSet = typeGuardMap.get(typeName);
  return actionSet ? actionSet.has(action) : false;
}

/**
 * Get all available type names for use with isActionOfType.
 * @returns Array of available type name strings
 */
export function getAvailableActionTypes(): string[] {
  return Array.from(typeGuardMap.keys());
}


// --- Optimized Type Guards (Direct Set Lookups) ---
// Each function performs a single O(1) Set lookup instead of hierarchical function calls

export function isActionEnum(action: number): action is ActionEnum {
  return actionEnumValues.has(action);
}

export function isSystemActions(action: number): action is SystemActions {
  return systemActionValues.has(action);
}

export function isLobbyActions(action: number): action is LobbyActions {
  return lobbyActionValues.has(action);
}

export function isSessionActions(action: number): action is SessionActions {
  return sessionActionValues.has(action);
}

export function isMatchActions(action: number): action is MatchActions {
  return matchActionValues.has(action);
}

export function isPlayerActions(action: number): action is PlayerActions {
  return playerActionValues.has(action);
}

export function isMechanicsActions(action: number): action is MechanicsActions {
  return mechanicsActionValues.has(action);
}

export function isPUPActions(action: number): action is PUPActions {
  return pupActionValues.has(action);
}

export function isFirePUPActions(action: number): action is FirePUPActions {
  return firePUPActionValues.has(action);
}

export function isWaterPUPActions(action: number): action is WaterPUPActions {
  return waterPUPActionValues.has(action);
}

export function isWoodPUPActions(action: number): action is WoodPUPActions {
  return woodPUPActionValues.has(action);
}

export function isMetalPUPActions(action: number): action is MetalPUPActions {
  return metalPUPActionValues.has(action);
}

export function isEarthPUPActions(action: number): action is EarthPUPActions {
  return earthPUPActionValues.has(action);
}

export function isProtocolActions(action: number): action is ProtocolActions {
  return protocolActionValues.has(action);
}

export function isLifecycleActions(action: number): action is LifecycleActions {
  return lifecycleActionValues.has(action);
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