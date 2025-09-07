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


// --- High-Performance Type Guards ---
export function isActionEnum(action: number): action is ActionEnum {
  return isMatchActions(action) || isSystemActions(action);
}

export function isSystemActions(action: number): action is SystemActions {
  return isLobbyActions(action) || isSessionActions(action);
}

export function isLobbyActions(action: number): action is LobbyActions {
  return lobbyActionValues.has(action as LobbyActions);
}

export function isSessionActions(action: number): action is SessionActions {
  return sessionActionValues.has(action as SessionActions);
}

export function isMatchActions(action: number): action is MatchActions {
  return isPlayerActions(action) || isProtocolActions(action) || isLifecycleActions(action);
}

export function isPlayerActions(action: number): action is PlayerActions {
  return isMechanicsActions(action) || isPUPActions(action);
}

export function isMechanicsActions(action: number): action is MechanicsActions {
  return mechanicsActionValues.has(action as MechanicsActions);
}

export function isPUPActions(action: number): action is PUPActions {
  return isFirePUPActions(action)
      || isWaterPUPActions(action)
      || isWoodPUPActions(action)
      || isMetalPUPActions(action)
      || isEarthPUPActions(action);
}

export function isFirePUPActions(action: number): action is FirePUPActions {
  return firePUPActionValues.has(action as FirePUPActions);
}

export function isWaterPUPActions(action: number): action is WaterPUPActions {
  return waterPUPActionValues.has(action as WaterPUPActions);
}

export function isWoodPUPActions(action: number): action is WoodPUPActions {
  return woodPUPActionValues.has(action as WoodPUPActions);
}

export function isMetalPUPActions(action: number): action is MetalPUPActions {
  return metalPUPActionValues.has(action as MetalPUPActions);
}

export function isEarthPUPActions(action: number): action is EarthPUPActions {
  return earthPUPActionValues.has(action as EarthPUPActions);
}

export function isProtocolActions(action: number): action is ProtocolActions {
  return protocolActionValues.has(action as ProtocolActions);
}

export function isLifecycleActions(action: number): action is LifecycleActions {
  return lifecycleActionValues.has(action as LifecycleActions);
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