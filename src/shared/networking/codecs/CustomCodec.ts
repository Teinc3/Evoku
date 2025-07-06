import AbstractCodec from "@shared/networking/codecs/AbstractCodec";

import type { CodecMap, ICustomCodec } from "@shared/types/networking/ICodec";
import type IDataContract from "@shared/types/contracts/IDataContract";


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
     * @type {CodecMap<GenericContract>}
     * @abstract
     * @readonly
     */
    abstract readonly codecMap: CodecMap<GenericContract>;

    /**
     * Encodes the provided data (or if no data is provided from the packet's
     * data storage) into an ArrayBuffer that can be sent over the network.
     * 
     * @param {ArrayBuffer} [buffer=new ArrayBuffer] - The buffer to encode data into.
     * @param {GenericContract} [data] - The data to encode. If not provided, uses the packet's internal data.
     * @return {number} The number of bytes
     */
    encode(buffer: ArrayBuffer = new ArrayBuffer(), data: GenericContract): number {

        let dataLength: number = 0;

        for (const key in this.codecMap) {
            const Codec = this.codecMap[key];
            const codecInstance = new Codec(buffer);
            dataLength += codecInstance.encode(buffer, data[key]);
        }

        return dataLength;
    }

    /**
     * Decodes the provided ArrayBuffer into the original data type.
     * 
     * @param {ArrayBuffer} buffer - The ArrayBuffer to decode.
     * @return {IDataContract} The decoded data.
     */
    decode(buffer: ArrayBuffer): GenericContract {

        const data = {} as GenericContract; // Reset internal data

        for (const key in this.codecMap) {
            const Codec = this.codecMap[key];
            const codecInstance = new Codec(buffer);
            data[key] = codecInstance.decode(buffer);
        }

        return data;
    }

}