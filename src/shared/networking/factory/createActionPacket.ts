import createPacket from "./createPacket";
import { IntCodec, ByteCodec, ShortCodec } from "../codecs/primitive";

import type { CustomCodecMap } from "../../types/networking/ICodec";
import type ActionEnum from "../../types/enums/ActionEnum";
import type ActionMap from "../../types/actionmap/"
import type { ExtendableContractKeys, HasDuplicates, 
    InjectableCodecMap, IsSameKeySet, RequiredInjectableKeys
} from "../../types/utils/CodecExtensionHelpers";


export const INJECTABLE_CODECS: InjectableCodecMap = {
    serverTime: IntCodec,
    clientTime: IntCodec,
    moveID: ByteCodec,
    pupID: ShortCodec,
    playerID: ByteCodec,
    targetID: ByteCodec,
    cellIndex: ShortCodec,
    value: ByteCodec
} as const;

/**
 * Creates a packet for a specific GenericAction.
 * 
 * @param action - The action identifier for the packets.
 * @param include - An array of keys, indexing extendable fields of codecs to include in the packet.
 * @param specificCodecMap - A map of remaining codecs for the specific action, excluding any extendable fields.
 * @returns A packet
 */
export default function createActionPacket<
    GenericAction extends ActionEnum,
    const IncludeKeys extends ReadonlyArray<keyof ActionMap[GenericAction]
        & keyof ExtendableContractKeys>,
    SpecificMap extends CustomCodecMap<Omit<ActionMap[GenericAction], IncludeKeys[number]>>
>(
    action: GenericAction,
    include: IncludeKeys & (
        IsSameKeySet<
            IncludeKeys[number], // The union of keys the user provided
            RequiredInjectableKeys<ActionMap[GenericAction]> // The union of keys that are required
        > extends true
            ? HasDuplicates<IncludeKeys> extends false
                ? IncludeKeys // If they match, the type is valid.
                : "Error: The 'include' array must not contain duplicate keys."
            : "Error: The 'include' array must contain all required injectable keys exactly once."
    ),
    specificCodecMap: SpecificMap & { 
        [K in keyof SpecificMap]: 
            K extends keyof Omit<ActionMap[GenericAction], IncludeKeys[number]> 
                ? SpecificMap[K] : never
    }
) {

    const injectedCodecs: CustomCodecMap<Pick<ActionMap[GenericAction], IncludeKeys[number]>>
        = Object.entries(INJECTABLE_CODECS)
            .filter(([key]) => include.includes(key as IncludeKeys[number]))
            .reduce((acc, [key, codec]) => {
                acc[key as IncludeKeys[number]] = codec;
                return acc;
            }, {} as CustomCodecMap<Pick<ActionMap[GenericAction], IncludeKeys[number]>>
        );
    
    const fullCodecMap = {
        ...injectedCodecs,
        ...specificCodecMap as CustomCodecMap<Omit<ActionMap[GenericAction], IncludeKeys[number]>>
    };

    return createPacket(action, fullCodecMap as CustomCodecMap<ActionMap[GenericAction]>);

}