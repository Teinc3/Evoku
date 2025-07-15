import createPacket from "@shared/networking/factory/createPacket";
import IntCodec from "../codecs/primitive/IntCodec";
import ByteCodec from "../codecs/primitive/ByteCodec";

import type { ActionContractS2C, ActionContractC2S } from "@shared/types/contracts/mechanics/ActionContract";
import type { CodecMap } from "@shared/types/networking/ICodec";
import type { OmitAction } from "@shared/types/contracts/IDataContract";
import type IDataContract from "@shared/types/contracts/IDataContract";


export const BASE_ACTION_S2C_CODECS = {
    serverTime: IntCodec,
    playerID: ByteCodec
} as const;

export const BASE_ACTION_C2S_CODECS = {
    clientTime: IntCodec
} as const;


/**
 * Creates a pair of packets for a specific action, 
 * one for S2C (Server to Client) and one for C2S (Client to Server).
 * 
 * @param action 
 * @param codecMap 
 * @returns A list of [S2C packet, C2S packet]
 */

export default function createActionPackets<SpecificBaseActionContract extends IDataContract>(
    action: SpecificBaseActionContract['action'],
    // Only the attributes within SpecificBaseActionContract that are not part of PlayerActionContract
    codecMap: OmitAction<CodecMap<SpecificBaseActionContract>>
) {
    type SpecificActionContractS2C = SpecificBaseActionContract & ActionContractS2C;
    type SpecificActionContractC2S = SpecificBaseActionContract & ActionContractC2S;

    return [
        createPacket<SpecificActionContractS2C>(action, {
            ...BASE_ACTION_S2C_CODECS,
            ...codecMap
        } as OmitAction<CodecMap<SpecificActionContractS2C>>),
        createPacket<SpecificActionContractC2S>(action, {
            ...BASE_ACTION_C2S_CODECS,
            ...codecMap
        } as OmitAction<CodecMap<SpecificActionContractC2S>>)
    ] as const
}