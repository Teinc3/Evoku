import createPacket from "./createPacket";
import { IntCodec, ByteCodec } from "../codecs/primitive";
import { isActionContractC2S, isActionContractS2C } from "../..//types/utils/typeguards/actioncontract";

import type { CodecMap } from "../../types/networking/ICodec";
import type ActionEnum from "../../types/enums/ActionEnum";
import type ActionMap from "../../types/actionmap/"
import type OmitBaseActionFields from "../../types/utils/OmitActionContractFields";


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
 * Creates a packet for a specific GenericAction.
 * 
 * @param action - The action identifier for the packets.
 * @param codecMap - A map of codecs for the specific action, excluding PlayerActionContract attributes.
 * @returns A packet
 */
export default function createActionPacket<GenericAction extends ActionEnum>(
    action: GenericAction,
    codecMap: CodecMap<OmitBaseActionFields<ActionMap[GenericAction]>>
) {
    // Determine if it is a C2S or S2C action by using typeguards        
    return createPacket(action, {
        ...(
            isActionContractS2C(codecMap) ? BASE_ACTION_S2C_CODECS
            : isActionContractC2S(codecMap) ? BASE_ACTION_C2S_CODECS : {}
        ),
        ...codecMap
    } as CodecMap<ActionMap[GenericAction]>);
}