import SessionActionsEnum from "../../enums/actions/system/session";
import LobbyActionsEnum from "../../enums/actions/system/lobby";
import ProtocolActionsEnum from "../../enums/actions/match/protocol";
import WoodPUPActionsEnum from "../../enums/actions/match/player/powerups/wood";
import WaterPUPActionsEnum from "../../enums/actions/match/player/powerups/water";
import MetalPUPActionsEnum from "../../enums/actions/match/player/powerups/metal";
import FirePUPActionsEnum from "../../enums/actions/match/player/powerups/fire";
import EarthPUPActionsEnum from "../../enums/actions/match/player/powerups/earth";
import MechanicsActionsEnum from "../../enums/actions/match/player/mechanics";
import LifecycleActionsEnum from "../../enums/actions/match/lifecycle";

import type AugmentAction from "../AugmentAction";
import type SessionActions from "../../enums/actions/system/session";
import type LobbyActions from "../../enums/actions/system/lobby";
import type SystemActions from "../../enums/actions/system";
import type ProtocolActions from "../../enums/actions/match/protocol";
import type WoodPUPActions from "../../enums/actions/match/player/powerups/wood";
import type WaterPUPActions from "../../enums/actions/match/player/powerups/water";
import type MetalPUPActions from "../../enums/actions/match/player/powerups/metal";
import type FirePUPActions from "../../enums/actions/match/player/powerups/fire";
import type EarthPUPActions from "../../enums/actions/match/player/powerups/earth";
import type PUPActions from "../../enums/actions/match/player/powerups";
import type MechanicsActions from "../../enums/actions/match/player/mechanics";
import type PlayerActions from "../../enums/actions/match/player";
import type LifecycleActions from "../../enums/actions/match/lifecycle";
import type MatchActions from "../../enums/actions/match";
import type ActionEnum from "../../enums/actions";


/**
 * Type-safe set that can only contain values from the specified union action type
 */
type UnionSetValues<T extends number> = Set<T>;

// --- Pre-computed Sets for O(1) Lookups ---
// This work is done only once when the module is loaded.
// Creating sets for ALL levels of the hierarchy for efficient lookup

// Leaf-level sets (lowest level enums)
const lobbyActionValues: UnionSetValues<LobbyActions> = new Set(
  Object.values(LobbyActionsEnum).filter(value => typeof value === 'number') as LobbyActions[]
);
const sessionActionValues: UnionSetValues<SessionActions> = new Set(
  Object.values(SessionActionsEnum).filter(value => typeof value === 'number') as SessionActions[]
);
const mechanicsActionValues: UnionSetValues<MechanicsActions> = new Set(
  Object.values(MechanicsActionsEnum).filter(
    value => typeof value === 'number'
  ) as MechanicsActions[]
);
const firePUPActionValues: UnionSetValues<FirePUPActions> = new Set(
  Object.values(FirePUPActionsEnum).filter(value => typeof value === 'number') as FirePUPActions[]
);
const waterPUPActionValues: UnionSetValues<WaterPUPActions> = new Set(
  Object.values(WaterPUPActionsEnum).filter(value => typeof value === 'number') as WaterPUPActions[]
);
const woodPUPActionValues: UnionSetValues<WoodPUPActions> = new Set(
  Object.values(WoodPUPActionsEnum).filter(value => typeof value === 'number') as WoodPUPActions[]
);
const metalPUPActionValues: UnionSetValues<MetalPUPActions> = new Set(
  Object.values(MetalPUPActionsEnum).filter(value => typeof value === 'number') as MetalPUPActions[]
);
const earthPUPActionValues: UnionSetValues<EarthPUPActions> = new Set(
  Object.values(EarthPUPActionsEnum).filter(value => typeof value === 'number') as EarthPUPActions[]
);
const protocolActionValues: UnionSetValues<ProtocolActions> = new Set(
  Object.values(ProtocolActionsEnum).filter(value => typeof value === 'number') as ProtocolActions[]
);
const lifecycleActionValues: UnionSetValues<LifecycleActions> = new Set(
  Object.values(LifecycleActionsEnum).filter(
    value => typeof value === 'number'
  ) as LifecycleActions[]
);

// Higher-level composite sets (union of child sets)
const pupActionValues: UnionSetValues<PUPActions> = new Set([
  ...firePUPActionValues,
  ...waterPUPActionValues,
  ...woodPUPActionValues,
  ...metalPUPActionValues,
  ...earthPUPActionValues
]);

const playerActionValues: UnionSetValues<PlayerActions> = new Set([
  ...mechanicsActionValues,
  ...pupActionValues
]);

const matchActionValues: UnionSetValues<MatchActions> = new Set([
  ...playerActionValues,
  ...protocolActionValues,
  ...lifecycleActionValues
]);

const systemActionValues: UnionSetValues<SystemActions> = new Set([
  ...lobbyActionValues,
  ...sessionActionValues
]);

const actionEnumValues: UnionSetValues<ActionEnum> = new Set([
  ...systemActionValues,
  ...matchActionValues
]);


// --- ActionGuard Static Class ---
// Groups all type guards into a single import for better organization

export class ActionGuard {
  static isActionEnum(action: number): action is ActionEnum {
    return actionEnumValues.has(action);
  }

  static isSystemActions(action: number): action is SystemActions {
    return systemActionValues.has(action);
  }

  static isLobbyActions(action: number): action is LobbyActions {
    return lobbyActionValues.has(action);
  }

  static isSessionActions(action: number): action is SessionActions {
    return sessionActionValues.has(action);
  }

  static isMatchActions(action: number): action is MatchActions {
    return matchActionValues.has(action);
  }

  static isPlayerActions(action: number): action is PlayerActions {
    return playerActionValues.has(action);
  }

  static isMechanicsActions(action: number): action is MechanicsActions {
    return mechanicsActionValues.has(action);
  }

  static isPUPActions(action: number): action is PUPActions {
    return pupActionValues.has(action);
  }

  static isFirePUPActions(action: number): action is FirePUPActions {
    return firePUPActionValues.has(action);
  }

  static isWaterPUPActions(action: number): action is WaterPUPActions {
    return waterPUPActionValues.has(action);
  }

  static isWoodPUPActions(action: number): action is WoodPUPActions {
    return woodPUPActionValues.has(action);
  }

  static isMetalPUPActions(action: number): action is MetalPUPActions {
    return metalPUPActionValues.has(action);
  }

  static isEarthPUPActions(action: number): action is EarthPUPActions {
    return earthPUPActionValues.has(action);
  }

  static isProtocolActions(action: number): action is ProtocolActions {
    return protocolActionValues.has(action);
  }

  static isLifecycleActions(action: number): action is LifecycleActions {
    return lifecycleActionValues.has(action);
  }
}

// --- Legacy Individual Functions (for backward compatibility) ---
// These call the static class methods to maintain existing imports

export function isActionEnum(action: number): action is ActionEnum {
  return ActionGuard.isActionEnum(action);
}

export function isSystemActions(action: number): action is SystemActions {
  return ActionGuard.isSystemActions(action);
}

export function isLobbyActions(action: number): action is LobbyActions {
  return ActionGuard.isLobbyActions(action);
}

export function isSessionActions(action: number): action is SessionActions {
  return ActionGuard.isSessionActions(action);
}

export function isMatchActions(action: number): action is MatchActions {
  return ActionGuard.isMatchActions(action);
}

export function isPlayerActions(action: number): action is PlayerActions {
  return ActionGuard.isPlayerActions(action);
}

export function isMechanicsActions(action: number): action is MechanicsActions {
  return ActionGuard.isMechanicsActions(action);
}

export function isPUPActions(action: number): action is PUPActions {
  return ActionGuard.isPUPActions(action);
}

export function isFirePUPActions(action: number): action is FirePUPActions {
  return ActionGuard.isFirePUPActions(action);
}

export function isWaterPUPActions(action: number): action is WaterPUPActions {
  return ActionGuard.isWaterPUPActions(action);
}

export function isWoodPUPActions(action: number): action is WoodPUPActions {
  return ActionGuard.isWoodPUPActions(action);
}

export function isMetalPUPActions(action: number): action is MetalPUPActions {
  return ActionGuard.isMetalPUPActions(action);
}

export function isEarthPUPActions(action: number): action is EarthPUPActions {
  return ActionGuard.isEarthPUPActions(action);
}

export function isProtocolActions(action: number): action is ProtocolActions {
  return ActionGuard.isProtocolActions(action);
}

export function isLifecycleActions(action: number): action is LifecycleActions {
  return ActionGuard.isLifecycleActions(action);
}

// --- Generic Wrapper to Create Data-Level Guards ---

/**
 * A higher-order function that takes a simple enum type guard and returns a new
 * type guard that operates on the full packet object (`AugmentAction`).
 *
 * @param enumGuard The simple type guard for the action enum (e.g., `ActionGuard.isSystemActions`).
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

export const isSystemActionsData = createDataGuard(ActionGuard.isSystemActions);
export const isLobbyActionsData = createDataGuard(ActionGuard.isLobbyActions);
export const isSessionActionsData = createDataGuard(ActionGuard.isSessionActions);

export const isMatchActionsData = createDataGuard(ActionGuard.isMatchActions);
export const isPlayerActionsData = createDataGuard(ActionGuard.isPlayerActions);
export const isMechanicsActionsData = createDataGuard(ActionGuard.isMechanicsActions);
export const isPUPActionsData = createDataGuard(ActionGuard.isPUPActions);
export const isProtocolActionsData = createDataGuard(ActionGuard.isProtocolActions);
export const isLifecycleActionsData = createDataGuard(ActionGuard.isLifecycleActions);

export const isFirePUPActionsData = createDataGuard(ActionGuard.isFirePUPActions);
export const isWaterPUPActionsData = createDataGuard(ActionGuard.isWaterPUPActions);
export const isWoodPUPActionsData = createDataGuard(ActionGuard.isWoodPUPActions);
export const isMetalPUPActionsData = createDataGuard(ActionGuard.isMetalPUPActions);
export const isEarthPUPActionsData = createDataGuard(ActionGuard.isEarthPUPActions);