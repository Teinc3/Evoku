import ActionEnum from "@shared/types/enums/actions";
import SystemActions from "@shared/types/enums/actions/system";
import type MatchActions from "@shared/types/enums/actions/match";
import LobbyActions from "@shared/types/enums/actions/system/lobby";
import SessionActions from "@shared/types/enums/actions/system/session";


/**
 * Type guard for system actions.
 * @param action The action to check.
 * @returns True if the action is a system action, false otherwise.
 */
export function isSystemActions(action: ActionEnum): action is SystemActions {
    // Fake assertion but helps with types
    return Object.values(LobbyActions).includes(action as LobbyActions)
        || Object.values(SessionActions).includes(action as SessionActions)
}

/**
 * Type guard for match actions.
 * @param action The action to check.
 * @returns True if the action is a match action, false otherwise.
 */
export function isMatchActions(action: ActionEnum): action is MatchActions {
    return !isSystemActions(action)
}