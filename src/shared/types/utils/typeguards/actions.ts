import * as Actions from "../../enums/actions";

import type AugmentAction from "../AugmentAction";


/**
 * ActionGuard
 *
 * Centralized type guards for Action enums and packet-level guards.
 *
 * - Provides fast runtime Set-based checks for a variety of action unions.
 * - Uses a small compile-time helper `composeExhaustive` to assert that
 *   composite arrays are exhaustively composed from leaf arrays (so you
 *   get a compile error when a subgroup is accidentally omitted).
 */
export default class ActionGuard {
  /**
   * Small generic helper used at declaration sites to compose arrays while
   * asserting exhaustiveness of the resulting union.
   *
   * Type-level behaviour
   * - Whole: the union type we expect to cover (e.g. MatchActions)
   * - Parts: a tuple of readonly arrays whose element types should together
   *   cover Whole.
   *
   * The conditional type forces a compile-time error on the call site when
   * some members of `Whole` are not present in the union of `Parts`.
   *
   * Runtime behaviour: returns a flat readonly array of the provided parts.
   * No runtime checks or allocations beyond the single flat() call.
   *
   * Example:
   *   ActionGuard.composeExhaustive<MatchActions>()(
   *     ActionGuard.playerActionsArr,
   *     ActionGuard.protocolActionsArr,
   *     ActionGuard.lifecycleActionsArr
   *   );
   */
  private static readonly composeExhaustive = <Whole>() =>
    <Parts extends readonly (readonly Whole[])[]>(
      ...parts: Parts & (
        [Whole] extends [Parts[number][number]]
          ? unknown
          : ["Missing union members", Exclude<Whole, Parts[number][number]>]
      )
    ) => parts.flat() as readonly Whole[];

  // --- Leaf arrays (preserve literal members) ---
  private static readonly lobbyActionsArr = Object.values(Actions.LobbyActions)
    .filter((v): v is Actions.LobbyActions => typeof v === 'number');
  private static readonly sessionActionsArr = Object.values(Actions.SessionActions)
    .filter((v): v is Actions.SessionActions => typeof v === 'number');
  private static readonly mechanicsActionsArr = Object.values(Actions.MechanicsActions)
    .filter((v): v is Actions.MechanicsActions => typeof v === 'number');
  private static readonly firePUPActionsArr = Object.values(Actions.FirePUPActions)
    .filter((v): v is Actions.FirePUPActions => typeof v === 'number');
  private static readonly waterPUPActionsArr = Object.values(Actions.WaterPUPActions)
    .filter((v): v is Actions.WaterPUPActions => typeof v === 'number');
  private static readonly woodPUPActionsArr = Object.values(Actions.WoodPUPActions)
    .filter((v): v is Actions.WoodPUPActions => typeof v === 'number');
  private static readonly metalPUPActionsArr = Object.values(Actions.MetalPUPActions)
    .filter((v): v is Actions.MetalPUPActions => typeof v === 'number');
  private static readonly earthPUPActionsArr = Object.values(Actions.EarthPUPActions)
    .filter((v): v is Actions.EarthPUPActions => typeof v === 'number');
  private static readonly protocolActionsArr = Object.values(Actions.ProtocolActions)
    .filter((v): v is Actions.ProtocolActions => typeof v === 'number');
  private static readonly lifecycleActionsArr = Object.values(Actions.LifecycleActions)
    .filter((v): v is Actions.LifecycleActions => typeof v === 'number');

  // --- Composite arrays with inline exhaustiveness checking ---
  private static readonly pupActionsArr = ActionGuard.composeExhaustive<Actions.PUPActions>()(
    ActionGuard.firePUPActionsArr,
    ActionGuard.waterPUPActionsArr,
    ActionGuard.woodPUPActionsArr,
    ActionGuard.metalPUPActionsArr,
    ActionGuard.earthPUPActionsArr,
  );
  private static readonly playerActionsArr = ActionGuard.composeExhaustive<Actions.PlayerActions>()(
    ActionGuard.mechanicsActionsArr,
    ActionGuard.pupActionsArr,
  );
  private static readonly matchActionsArr = ActionGuard.composeExhaustive<Actions.MatchActions>()(
    ActionGuard.playerActionsArr,
    ActionGuard.protocolActionsArr,
    ActionGuard.lifecycleActionsArr, // remove one to trigger error here
  );
  private static readonly systemActionsArr = ActionGuard.composeExhaustive<Actions.SystemActions>()(
    ActionGuard.lobbyActionsArr,
    ActionGuard.sessionActionsArr,
  );
  private static readonly actionEnumArr = ActionGuard.composeExhaustive<Actions.ActionEnum>()(
    ActionGuard.systemActionsArr,
    ActionGuard.matchActionsArr,
  );

  // --- Runtime Sets (O(1) lookups) built from arrays ---
  private static readonly lobbyActionValues = new Set(ActionGuard.lobbyActionsArr);
  private static readonly sessionActionValues = new Set(ActionGuard.sessionActionsArr);
  private static readonly mechanicsActionValues = new Set(ActionGuard.mechanicsActionsArr);
  private static readonly firePUPActionValues = new Set(ActionGuard.firePUPActionsArr);
  private static readonly waterPUPActionValues = new Set(ActionGuard.waterPUPActionsArr);
  private static readonly woodPUPActionValues = new Set(ActionGuard.woodPUPActionsArr);
  private static readonly metalPUPActionValues = new Set(ActionGuard.metalPUPActionsArr);
  private static readonly earthPUPActionValues = new Set(ActionGuard.earthPUPActionsArr);
  private static readonly protocolActionValues = new Set(ActionGuard.protocolActionsArr);
  private static readonly lifecycleActionValues = new Set(ActionGuard.lifecycleActionsArr);
  private static readonly pupActionValues = new Set(ActionGuard.pupActionsArr);
  private static readonly playerActionValues = new Set(ActionGuard.playerActionsArr);
  private static readonly matchActionValues = new Set(ActionGuard.matchActionsArr);
  private static readonly systemActionValues = new Set(ActionGuard.systemActionsArr);
  private static readonly actionEnumValues = new Set(ActionGuard.actionEnumArr);

  // --- Type Guard Methods ---

  static isActionEnum(action: number): action is Actions.ActionEnum {
    return ActionGuard.actionEnumValues.has(action);
  }

  static isSystemActions(action: number): action is Actions.SystemActions {
    return ActionGuard.systemActionValues.has(action);
  }

  static isLobbyActions(action: number): action is Actions.LobbyActions {
    return ActionGuard.lobbyActionValues.has(action);
  }

  static isSessionActions(action: number): action is Actions.SessionActions {
    return ActionGuard.sessionActionValues.has(action);
  }

  static isMatchActions(action: number): action is Actions.MatchActions {
    return ActionGuard.matchActionValues.has(action);
  }

  static isPlayerActions(action: number): action is Actions.PlayerActions {
    return ActionGuard.playerActionValues.has(action);
  }

  static isMechanicsActions(action: number): action is Actions.MechanicsActions {
    return ActionGuard.mechanicsActionValues.has(action);
  }

  static isPUPActions(action: number): action is Actions.PUPActions {
    return ActionGuard.pupActionValues.has(action);
  }

  static isFirePUPActions(action: number): action is Actions.FirePUPActions {
    return ActionGuard.firePUPActionValues.has(action);
  }

  static isWaterPUPActions(action: number): action is Actions.WaterPUPActions {
    return ActionGuard.waterPUPActionValues.has(action);
  }

  static isWoodPUPActions(action: number): action is Actions.WoodPUPActions {
    return ActionGuard.woodPUPActionValues.has(action);
  }

  static isMetalPUPActions(action: number): action is Actions.MetalPUPActions {
    return ActionGuard.metalPUPActionValues.has(action);
  }

  static isEarthPUPActions(action: number): action is Actions.EarthPUPActions {
    return ActionGuard.earthPUPActionValues.has(action);
  }

  static isProtocolActions(action: number): action is Actions.ProtocolActions {
    return ActionGuard.protocolActionValues.has(action);
  }

  static isLifecycleActions(action: number): action is Actions.LifecycleActions {
    return ActionGuard.lifecycleActionValues.has(action);
  }

  // --- Data-Level Guards for Operating on Packet Objects ---

  /**
   * A generic helper that creates a type guard for packet objects (`AugmentAction`).
   * 
   * @param enumGuard The simple type guard for the action enum.
   * @returns A new type guard that narrows the type of the entire packet object.
   */
  private static createDataGuard<GenericActionOrType extends Actions.ActionEnum>(
    enumGuard: (action: number) => action is GenericActionOrType
  ): (packet: { action: number }) => packet is AugmentAction<GenericActionOrType> {
    return (packet: { action: number }): packet is AugmentAction<GenericActionOrType> => {
      return enumGuard(packet.action);
    };
  }

  // Data-level guards using the helper
  static isSystemActionsData = ActionGuard.createDataGuard(ActionGuard.isSystemActions);
  static isLobbyActionsData = ActionGuard.createDataGuard(ActionGuard.isLobbyActions);
  static isSessionActionsData = ActionGuard.createDataGuard(ActionGuard.isSessionActions);

  static isMatchActionsData = ActionGuard.createDataGuard(ActionGuard.isMatchActions);
  static isPlayerActionsData = ActionGuard.createDataGuard(ActionGuard.isPlayerActions);
  static isMechanicsActionsData = ActionGuard.createDataGuard(ActionGuard.isMechanicsActions);
  static isPUPActionsData = ActionGuard.createDataGuard(ActionGuard.isPUPActions);
  static isProtocolActionsData = ActionGuard.createDataGuard(ActionGuard.isProtocolActions);
  static isLifecycleActionsData = ActionGuard.createDataGuard(ActionGuard.isLifecycleActions);

  static isFirePUPActionsData = ActionGuard.createDataGuard(ActionGuard.isFirePUPActions);
  static isWaterPUPActionsData = ActionGuard.createDataGuard(ActionGuard.isWaterPUPActions);
  static isWoodPUPActionsData = ActionGuard.createDataGuard(ActionGuard.isWoodPUPActions);
  static isMetalPUPActionsData = ActionGuard.createDataGuard(ActionGuard.isMetalPUPActions);
  static isEarthPUPActionsData = ActionGuard.createDataGuard(ActionGuard.isEarthPUPActions);

  
  // Generic Contract guard
  public static isActionContract<GenericAction extends Actions.ActionEnum>(
    action: GenericAction, data: object
  ): data is AugmentAction<GenericAction> {
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    
    return Object.prototype.hasOwnProperty.call(data, 'action')
      && (data as { action: number }).action === action;
  }
}
