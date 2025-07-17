import AbstractCodec from "./AbstractCodec";

import type { CustomCodecMap, ICustomCodec } from "../../types/networking/ICodec";
import type IDataContract from "../../types/contracts/base/IDataContract";
import type IPacketBuffer from "../../types/utils/IPacketBuffer";


/**
 * Abstract class representing a custom codec for encoding and decoding data contracts.
 * 
 * @template GenericContract - The type of the data contract that this codec will handle.
 * @extends AbstractCodec<GenericContract>
 * @implements {ICustomCodec<GenericContract>}
 */
export default abstract class CustomCodec<GenericContract extends IDataContract>
    extends AbstractCodec<GenericContract> implements ICustomCodec<GenericContract> {
    
    /**
     * A map of codecs used for encoding and decoding the packet's data.
     * Each key corresponds to a property in the data contract, and the value is a codec constructor.
     * 
     * @type {CustomCodecMap<GenericContract>}
     * @abstract
     * @readonly
     */
    abstract readonly codecMap: CustomCodecMap<GenericContract>;

    /**
     * Encodes the provided data (or if no data is provided from the packet's
     * data storage) into an PacketBuffer that can be sent over the network.
     * 
     * @param {IPacketBuffer} [buffer] - The buffer to encode data into.
     * @param {GenericContract} [data] - The data to encode. If not provided, uses the packet's internal data.
     * @return {number} The number of bytes
     */
    encode(buffer: IPacketBuffer, data: GenericContract): number {

        let dataLength: number = 0;

        for (const key in this.codecMap) {
            const Codec = this.codecMap[key];
            const codecInstance = new Codec();
            dataLength += codecInstance.encode(buffer, data[key]);
        }

        return dataLength;
    }

    /**
     * Decodes the provided PacketBuffer into the original data type.
     * 
     * @param {IPacketBuffer} buffer - The PacketBuffer to decode.
     * @return {IDataContract} The decoded data.
     */
    decode(buffer: IPacketBuffer): GenericContract {

        const data = {} as GenericContract; // Reset internal data

        for (const key in this.codecMap) {
            // Do not decode the action key
            // It is already decoded initially to determine the packet type
            if (key === "action") {
                continue;
            }

            const Codec = this.codecMap[key];
            const codecInstance = new Codec();
            data[key] = codecInstance.decode(buffer);
        }

        return data;
    }

}