import createPacket from "./createPacket";
import { IntCodec, ByteCodec, ShortCodec } from "../codecs/primitive";

import type { CustomCodecMap } from "../../types/networking/ICodec";
import type ActionEnum from "../../types/enums/actions";
import type ActionMap from "../../types/actionmap/"
import type { ExtendableContractKeys, InjectableCodecMap,
    RequiredInjectableKeys, ValidateInclude
} from "../../types/utils/CodecExtensionHelpers";


export const INJECTABLE_CODECS: InjectableCodecMap = {
    serverTime: IntCodec,
    clientTime: IntCodec,
    actionID: ByteCodec,
    pupID: ShortCodec,
    playerID: ByteCodec,
    targetID: ByteCodec,
    cellIndex: ShortCodec,
    value: ByteCodec
} as const;


/**
 * A utility function to pick specific keys from a mapping of codecs.
 * 
 * @param all - A mapping of all codecs.
 * @param include - An array of keys to include from the mapping.
 * @returns A new object containing only the specified keys from the mapping.
 */
export function pickInjectables<
    Mapping extends Record<string, any>,
    IncludeArray extends readonly (keyof Mapping)[]
>(
    all: Mapping,
    include: IncludeArray
): Pick<Mapping, IncludeArray[number]> {
    const out = {} as Pick<Mapping, IncludeArray[number]>;
    // Object.keys(all) comes back in the same order you wrote `all`’s properties.
    for (const key of Object.keys(all) as (keyof Mapping)[]) {
        if (include.includes(key)) {
            out[key] = all[key];
        }
    }
    return out;
}


/**
 * Creates a packet for a specific GenericAction, allowing for the injection of common extendable codecs.
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
    include: ValidateInclude<IncludeKeys, RequiredInjectableKeys<ActionMap[GenericAction]>>,
    specificCodecMap: SpecificMap & { 
        [K in keyof SpecificMap]: 
            K extends keyof Omit<ActionMap[GenericAction], IncludeKeys[number]> 
                ? SpecificMap[K] : never
    }
) {

    const injected = pickInjectables(
        INJECTABLE_CODECS,
        include as readonly (keyof ExtendableContractKeys)[]
    ) as CustomCodecMap<Pick<ActionMap[GenericAction], IncludeKeys[number]>>;
    
    const fullCodecMap = {
        ...injected,
        ...specificCodecMap
    } as CustomCodecMap<ActionMap[GenericAction]>;

    return createPacket(action, fullCodecMap);

}