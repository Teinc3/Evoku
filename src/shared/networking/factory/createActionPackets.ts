import createPacket from "./createPacket";
import { IntCodec, ByteCodec } from "../codecs/primitive";

import type { ActionContractS2C, ActionContractC2S } from "../../types/contracts/base/ActionContract";
import type { CodecMap } from "../../types/networking/ICodec";
import type IDataContract from "../../types/contracts/base/IDataContract";


export const BASE_ACTION_S2C_CODECS = {
    moveID: ByteCodec,
    serverTime: IntCodec,
    playerID: ByteCodec
} as const;

export const BASE_ACTION_C2S_CODECS = {
    moveID: ByteCodec,
    clientTime: IntCodec
} as const;


/**
 * Creates a pair of packets for a specific action, 
 * one for S2C (Server to Client) and one for C2S (Client to Server).
 * 
 * @template SpecificBaseActionContract - The base action contract type.
 * @template SpecificActionContractS2C - The S2C action contract type, extending the base action contract.
 * @param action - The action identifier for the packets.
 * @param codecMap - A map of codecs for the specific action, excluding PlayerActionContract attributes.
 * @returns A fixed-size tuple containing [S2C packet, C2S packet]
 */
export default function createActionPackets<
    SpecificBaseActionContract extends IDataContract,
    SpecificActionContractS2C extends SpecificBaseActionContract & ActionContractS2C
        = SpecificBaseActionContract & ActionContractS2C
>(
    action: SpecificBaseActionContract['action'],
    // Only the attributes within SpecificBaseActionContract that are not part of PlayerActionContract
    codecMap: OmitAction<CodecMap<SpecificBaseActionContract>>,
    // Additional S2C codecs that are not part of the base action S2C codecs
    additionalS2CCodecs: Partial<OmitAction<CodecMap<SpecificActionContractS2C>>> = {}
) {
    // We probably don't need a custom C2S generic type so we just declare the bare-bones one here.
    type SpecificActionContractC2S = SpecificBaseActionContract & ActionContractC2S

    return [
        createPacket<SpecificActionContractS2C>(action, {
            ...BASE_ACTION_S2C_CODECS,
            ...additionalS2CCodecs,
            ...codecMap
        } as OmitAction<CodecMap<SpecificActionContractS2C>>),
        createPacket<SpecificActionContractC2S>(action, {
            ...BASE_ACTION_C2S_CODECS,
            ...codecMap
        } as OmitAction<CodecMap<SpecificActionContractC2S>>)
    ] as const
}