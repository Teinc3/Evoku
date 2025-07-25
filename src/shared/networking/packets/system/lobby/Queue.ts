import createPacket from "../../factory/createPacket";
import { BoolCodec, StringCodec } from "../../../codecs/primitive";
import LobbyActions from "../../../../types/enums/actions/system/lobby";


export const JoinQueue = createPacket(LobbyActions.JOIN_QUEUE, {
  username: StringCodec
})

export const LeaveQueue = createPacket(LobbyActions.LEAVE_QUEUE, {});

export const QueueUpdate = createPacket(LobbyActions.QUEUE_UPDATE, {
  inQueue: BoolCodec
})