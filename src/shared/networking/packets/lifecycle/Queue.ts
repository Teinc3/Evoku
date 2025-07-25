import createPacket from "../factory/createPacket";
import { BoolCodec, StringCodec } from "../../codecs/primitive";
import LifecycleActions from "../../../types/enums/actions/match/lifecycle";


export const JoinQueue = createPacket(LifecycleActions.JOIN_QUEUE, {
  username: StringCodec
})

export const LeaveQueue = createPacket(LifecycleActions.LEAVE_QUEUE, {});

export const QueueUpdate = createPacket(LifecycleActions.QUEUE_UPDATE, {
  inQueue: BoolCodec
})