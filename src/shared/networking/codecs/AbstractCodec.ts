import type IPacketBuffer from "../../types/utils/IPacketBuffer";
import type ICodec from "../../types/networking/ICodec";


/**
 * Abstract base class for codecs that handle encoding and decoding of data contracts.
 */
export default abstract class AbstractCodec<DType> 
implements ICodec<DType> {

  /**
     * Encodes the provided data into an PacketBuffer that can be sent over the network.
     * 
     * @param {IPacketBuffer} buffer - The buffer to encode data into.
     * If not provided, a new PacketBuffer will be created.
     * @param {DType} [data] - Optional: The data to encode.
     * @return {number} The number of bytes written to the buffer.
     */
  abstract encode(buffer: IPacketBuffer, data: DType): number;

  /**
     * Decodes the provided PacketBuffer into the original data type.
     * 
     * @param {IPacketBuffer} buffer - The PacketBuffer to decode.
     * @return {DType} The decoded data.
     */
  abstract decode(buffer: IPacketBuffer): DType;

}