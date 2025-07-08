import PacketBuffer from '@shared/utils/PacketBuffer';
import IntCodec from '@shared/networking/codecs/primitive/IntCodec';

import type IPacket from '@shared/types/networking/IPacket';
import type IPacketBuffer from '@shared/types/utils/IPacketBuffer';
import type ActionType from '@shared/types/contracts/ActionType';
import type IDataContract from '@shared/types/contracts/IDataContract';
import type { CodecConstructor } from '@shared/types/networking/ICodec';


/**
 * Abstract class representing a packet.
 * @template IDataContract - Interface contract type for internal data structure.
 * 
 * This class serves as a base for all packet types, providing a method to retrieve the packet ID.
 * It is intended to be extended by specific packet implementations that define their own ID.
 */
export default abstract class AbstractPacket<GenericContract extends IDataContract> implements IPacket<GenericContract> { 

    _data: GenericContract;

    /**
     * The unique identifier for the packet type.
     * This should be defined in subclasses to specify the packet's action type.
     * 
     * @type {ActionType}
     * @abstract
     * @readonly
     */
    abstract readonly id: GenericContract['action'];

    /**
     * The codec used for encoding and decoding the packet's data.
     * 
     * @type {CodecConstructor<GenericContract>}
     * @abstract
     * @readonly
     */
    abstract readonly Codec: CodecConstructor<GenericContract>;

    constructor(data?: GenericContract) {
        this._data = data ?? {} as GenericContract;
    }

    get data(): GenericContract {
        return this._data;
    }

    set data(value: GenericContract) {
        this._data = value;
    }

    /**
     * Unwraps the provided packet buffer into Data bound by the packet's contract.
     * 
     * @param buffer 
     * @returns {GenericContract} The data decoded from the packet buffer.
     */
    unwrap(buffer: IPacketBuffer): GenericContract {
        const codecInstance = new this.Codec();
        this.data = codecInstance.decode(buffer);
        return this.data;
    }

    /**
     * Wraps the provided data, bound by the packet's contract, into a packet buffer.
     * 
     * @param {GenericContract} data - The data to be wrapped in the packet.
     * @return {IPacketBuffer} The packet buffer containing the encoded data.
     */
    wrap(data?: GenericContract): IPacketBuffer {

        if (!data && !this.data) {
            throw new Error('No data provided to wrap in packet buffer.');
        }

        const dataBuffer = new PacketBuffer();
        const intCodecInstance = new IntCodec();
        const codecInstance = new this.Codec();

        // Encode packetID and data
        intCodecInstance.encode(dataBuffer, this.id);
        codecInstance.encode(dataBuffer, data ?? this.data);

        return dataBuffer;

    }

}