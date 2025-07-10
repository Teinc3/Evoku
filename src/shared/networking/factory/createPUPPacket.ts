import createPacket from "@shared/networking/factory/createPacket";
import IntCodec from "../codecs/primitive/IntCodec";
import ByteCodec from "../codecs/primitive/ByteCodec";
import ShortCodec from "../codecs/primitive/ShortCodec";

import type UsePUPContract from "@shared/types/contracts/mechanics/UsePUPContract";
import type { CodecMap } from "@shared/types/networking/ICodec";
import type { OmitAction } from "@shared/types/contracts/IDataContract";


export const BASE_PUP_CODECS = {
    time: IntCodec,
    playerID: ByteCodec,
    targetID: ByteCodec,
    index: ShortCodec,
    value: ByteCodec
} as const;


/**
 * Creates a specific UsePUP packet with the default codecs 
 * and parameters that are all shared by the base UsePUP packet.
 * @param action 
 * @param codecMap 
 * @returns A packet class that extends the base packet with the specific codecs.
 */
export default function createPUPPacket<SpecificPUPContract extends UsePUPContract>(
    action: SpecificPUPContract['action'],
    // Only the attributes within SpecificPUPContract that are not part of UsePUPContract
    codecMap: Omit<CodecMap<SpecificPUPContract>, keyof UsePUPContract>
) {
    return createPacket<SpecificPUPContract>(action, {
        ...BASE_PUP_CODECS,
        ...codecMap
    } as OmitAction<CodecMap<SpecificPUPContract>>); // Still no action field here!
}