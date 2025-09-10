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
 * This ensures compile-time safety by restricting the set to only contain values of type T
 */
type UnionSetValues<T> = Set<T> & {
  // Brand the set to prevent cross-assignment between different action type sets
  readonly actionType: T;
};


// --- ActionGuard Static Class ---
// Groups all type guards and pre-computed sets into a single import for better organization

export default class ActionGuard {
  // --- Pre-computed Sets for O(1) Lookups ---
  // This work is done only once when the module is loaded.
  // Creating sets for ALL levels of the hierarchy for efficient lookup

  // Leaf-level sets (lowest level enums)
  private static readonly lobbyActionValues: UnionSetValues<LobbyActions> = new Set(
    Object.values(LobbyActionsEnum).filter(value => typeof value === 'number')
  ) as UnionSetValues<LobbyActions>;
  
  private static readonly sessionActionValues: UnionSetValues<SessionActions> = new Set(
    Object.values(SessionActionsEnum).filter(value => typeof value === 'number')
  ) as UnionSetValues<SessionActions>;
  
  private static readonly mechanicsActionValues: UnionSetValues<MechanicsActions> = new Set(
    Object.values(MechanicsActionsEnum).filter(value => typeof value === 'number')
  ) as UnionSetValues<MechanicsActions>;
  
  private static readonly firePUPActionValues: UnionSetValues<FirePUPActions> = new Set(
    Object.values(FirePUPActionsEnum).filter(value => typeof value === 'number')
  ) as UnionSetValues<FirePUPActions>;
  
  private static readonly waterPUPActionValues: UnionSetValues<WaterPUPActions> = new Set(
    Object.values(WaterPUPActionsEnum).filter(value => typeof value === 'number')
  ) as UnionSetValues<WaterPUPActions>;
  
  private static readonly woodPUPActionValues: UnionSetValues<WoodPUPActions> = new Set(
    Object.values(WoodPUPActionsEnum).filter(value => typeof value === 'number')
  ) as UnionSetValues<WoodPUPActions>;
  
  private static readonly metalPUPActionValues: UnionSetValues<MetalPUPActions> = new Set(
    Object.values(MetalPUPActionsEnum).filter(value => typeof value === 'number')
  ) as UnionSetValues<MetalPUPActions>;
  
  private static readonly earthPUPActionValues: UnionSetValues<EarthPUPActions> = new Set(
    Object.values(EarthPUPActionsEnum).filter(value => typeof value === 'number')
  ) as UnionSetValues<EarthPUPActions>;
  
  private static readonly protocolActionValues: UnionSetValues<ProtocolActions> = new Set(
    Object.values(ProtocolActionsEnum).filter(value => typeof value === 'number')
  ) as UnionSetValues<ProtocolActions>;
  
  private static readonly lifecycleActionValues: UnionSetValues<LifecycleActions> = new Set(
    Object.values(LifecycleActionsEnum).filter(value => typeof value === 'number')
  ) as UnionSetValues<LifecycleActions>;

  // Higher-level composite sets (union of child sets)
  private static readonly pupActionValues: UnionSetValues<PUPActions> = new Set([
    ...ActionGuard.firePUPActionValues,
    ...ActionGuard.waterPUPActionValues,
    ...ActionGuard.woodPUPActionValues,
    ...ActionGuard.metalPUPActionValues,
    ...ActionGuard.earthPUPActionValues
  ]) as UnionSetValues<PUPActions>;

  private static readonly playerActionValues: UnionSetValues<PlayerActions> = new Set([
    ...ActionGuard.mechanicsActionValues,
    ...ActionGuard.pupActionValues
  ]) as UnionSetValues<PlayerActions>;

  private static readonly matchActionValues: UnionSetValues<MatchActions> = new Set([
    ...ActionGuard.playerActionValues,
    ...ActionGuard.protocolActionValues,
    ...ActionGuard.lifecycleActionValues
  ]) as UnionSetValues<MatchActions>;

  private static readonly systemActionValues: UnionSetValues<SystemActions> = new Set([
    ...ActionGuard.lobbyActionValues,
    ...ActionGuard.sessionActionValues
  ]) as UnionSetValues<SystemActions>;

  private static readonly actionEnumValues: UnionSetValues<ActionEnum> = new Set([
    ...ActionGuard.systemActionValues,
    ...ActionGuard.matchActionValues
  ]) as UnionSetValues<ActionEnum>;

  // --- Type Guard Methods ---

  static isActionEnum(action: number): action is ActionEnum {
    return ActionGuard.actionEnumValues.has(action);
  }

  static isSystemActions(action: number): action is SystemActions {
    return ActionGuard.systemActionValues.has(action);
  }

  static isLobbyActions(action: number): action is LobbyActions {
    return ActionGuard.lobbyActionValues.has(action);
  }

  static isSessionActions(action: number): action is SessionActions {
    return ActionGuard.sessionActionValues.has(action);
  }

  static isMatchActions(action: number): action is MatchActions {
    return ActionGuard.matchActionValues.has(action);
  }

  static isPlayerActions(action: number): action is PlayerActions {
    return ActionGuard.playerActionValues.has(action);
  }

  static isMechanicsActions(action: number): action is MechanicsActions {
    return ActionGuard.mechanicsActionValues.has(action);
  }

  static isPUPActions(action: number): action is PUPActions {
    return ActionGuard.pupActionValues.has(action);
  }

  static isFirePUPActions(action: number): action is FirePUPActions {
    return ActionGuard.firePUPActionValues.has(action);
  }

  static isWaterPUPActions(action: number): action is WaterPUPActions {
    return ActionGuard.waterPUPActionValues.has(action);
  }

  static isWoodPUPActions(action: number): action is WoodPUPActions {
    return ActionGuard.woodPUPActionValues.has(action);
  }

  static isMetalPUPActions(action: number): action is MetalPUPActions {
    return ActionGuard.metalPUPActionValues.has(action);
  }

  static isEarthPUPActions(action: number): action is EarthPUPActions {
    return ActionGuard.earthPUPActionValues.has(action);
  }

  static isProtocolActions(action: number): action is ProtocolActions {
    return ActionGuard.protocolActionValues.has(action);
  }

  static isLifecycleActions(action: number): action is LifecycleActions {
    return ActionGuard.lifecycleActionValues.has(action);
  }
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