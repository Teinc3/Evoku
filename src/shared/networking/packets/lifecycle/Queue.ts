import createPacket from "../../factory/createPacket";
import Lifecycle from "../../../types/enums/actions/lifecycle";
import { BoolCodec, StringCodec } from "../../codecs/primitive";


export const JoinQueue = createPacket(Lifecycle.JOIN_QUEUE, {
    username: StringCodec
})

export const LeaveQueue = createPacket(Lifecycle.LEAVE_QUEUE, {});

export const QueueUpdate = createPacket(Lifecycle.QUEUE_UPDATE, {
    inQueue: BoolCodec
})