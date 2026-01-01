import { ProtocolActions } from "@shared/types/enums/actions";

import type { RoomModel, SessionModel } from "../models/networking";


/**
 * Rejects a player action by broadcasting a REJECT_ACTION packet to the specific session.
 * Includes the current game state hash for synchronization.
 * 
 * @param room The room where the action occurred
 * @param session The session that initiated the action
 * @param actionID The ID of the action being rejected
 */
export default function reject(room: RoomModel, session: SessionModel, actionID: number): void {
  room.broadcast(
    ProtocolActions.REJECT_ACTION,
    {
      actionID,
      gameStateHash: room.stateController.computeHash()
    },
    { to: [session.uuid] }
  );
}
