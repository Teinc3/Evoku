import type IPacket from '@shared/types/networking/IPacket';
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
    abstract readonly id: ActionType;

    /**
     * The codec used for encoding and decoding the packet's data.
     * 
     * @type {CodecConstructor<GenericContract>}
     * @abstract
     * @readonly
     */
    abstract readonly Codec: CodecConstructor<GenericContract>;

    constructor() {
        this._data = {} as GenericContract; // Initialize with an empty object of type IDataContract
    }

    unwrap(buffer: ArrayBuffer): GenericContract {
        const codecInstance = new this.Codec(buffer);
        return codecInstance.decode(buffer);
    }

    wrap(data: GenericContract): ArrayBuffer {

        const dataBuffer = new ArrayBuffer();
        // TODO: Write packet ID as integer

        const codecInstance = new this.Codec();
        const numberOfBytes = codecInstance.encode(new ArrayBuffer(), data);

        // Finally copy the encoded data into the dataBuffer

        return dataBuffer;
    }

}