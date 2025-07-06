import type ICodec from "@shared/types/networking/ICodec";

/**
 * Abstract base class for codecs that handle encoding and decoding of data contracts.
 */
export default abstract class AbstractCodec<DType> implements ICodec<DType> {

    _buffer: ArrayBuffer;

    constructor(buffer: ArrayBuffer = new ArrayBuffer(0)) {
        this._buffer = buffer;
    }

    /**
     * Encodes the provided data into an ArrayBuffer that can be sent over the network.
     * 
     * @param {ArrayBuffer} buffer - The buffer to encode data into. If not provided, a new ArrayBuffer will be created.
     * @param {DType} [data] - Optional: The data to encode.
     * @return {number} The number of bytes written to the buffer.
     */
    abstract encode(buffer: ArrayBuffer, data?: DType): number;

    /**
     * Decodes the provided ArrayBuffer into the original data type.
     * 
     * @param {ArrayBuffer} buffer - The ArrayBuffer to decode.
     * @return {DType} The decoded data.
     */
    abstract decode(buffer: ArrayBuffer): DType;

}