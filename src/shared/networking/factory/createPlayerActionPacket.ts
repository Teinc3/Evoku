import createPacket from "@shared/networking/factory/createPacket";
import IntCodec from "../codecs/primitive/IntCodec";
import ByteCodec from "../codecs/primitive/ByteCodec";

import type PlayerActionContract from "@shared/types/contracts/mechanics/PlayerActionContract";
import type { CodecMap } from "@shared/types/networking/ICodec";
import type { OmitAction } from "@shared/types/contracts/IDataContract";


export const BASE_ACTION_CODECS = {
    time: IntCodec,
    playerID: ByteCodec
} as const;


/**
 * Creates a game action packet class that extends the base UsePUP packet.
 * and parameters that are all shared by the base UsePUP packet.
 * @param action 
 * @param codecMap 
 * @returns A packet class that extends the base packet with the specific codecs.
 */

export default function createPlayerActionPacket<SpecificActionContract extends PlayerActionContract>(
    action: SpecificActionContract['action'],
    // Only the attributes within SpecificActionContract that are not part of PlayerActionContract
    codecMap: Omit<CodecMap<SpecificActionContract>, keyof PlayerActionContract>
) {
    return createPacket<SpecificActionContract>(action, {
        ...BASE_ACTION_CODECS,
        ...codecMap
    } as OmitAction<CodecMap<SpecificActionContract>>); // Still no action field here!
}