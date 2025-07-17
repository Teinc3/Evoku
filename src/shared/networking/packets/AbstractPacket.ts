import PacketBuffer from '../../utils/PacketBuffer';

import type IPacket from '../../types/networking/IPacket';
import type IPacketBuffer from '../../types/utils/IPacketBuffer';
import type { CodecConstructor } from '../../types/networking/ICodec';
import type ActionEnum from '../../types/enums/ActionEnum';
import type ActionMap from '../../types/actionmap';


/**
 * Abstract class representing a packet.
 * @template IDataContract - Interface contract type for internal data structure.
 * 
 * This class serves as a base for all packet types, providing a method to retrieve the packet ID.
 * It is intended to be extended by specific packet implementations that define their own ID.
 */
export default abstract class AbstractPacket<GenericAction extends ActionEnum> implements IPacket<GenericAction> { 

    _data: ActionMap[GenericAction];

    /**
     * The unique identifier for the packet type.
     * This should be defined in subclasses to specify the packet's action type.
     * 
     * @type {GenericAction}
     * @abstract
     * @readonly
     */
    abstract readonly id: GenericAction;

    /**
     * The codec used for encoding and decoding the packet's data.
     * 
     * @type {CodecConstructor<ActionMap[GenericAction]>}
     * @abstract
     * @readonly
     */
    abstract readonly Codec: CodecConstructor<ActionMap[GenericAction]>;

    constructor(data?: ActionMap[GenericAction]) {
        this._data = data ?? {} as ActionMap[GenericAction];
    }

    get data(): ActionMap[GenericAction] {
        return this._data;
    }

    set data(value: ActionMap[GenericAction]) {
        this._data = value;
    }

    /**
     * Unwraps the provided packet buffer into Data bound by the packet's contract.
     * 
     * @param buffer 
     * @returns {ActionMap[GenericAction]} The data decoded from the packet buffer.
     */
    unwrap(buffer: IPacketBuffer): ActionMap[GenericAction] {
        const codecInstance = new this.Codec();
        this.data = codecInstance.decode(buffer);
        return this.data;
    }

    /**
     * Wraps the provided data, bound by the packet's contract, into a packet buffer.
     * 
     * @param {ActionMap[GenericAction]} data - The data to be wrapped in the packet.
     * @return {IPacketBuffer} The packet buffer containing the encoded data.
     */
    wrap(data?: ActionMap[GenericAction]): IPacketBuffer {

        if (!data && !this.data) {
            throw new Error('No data provided to wrap in packet buffer.');
        }

        const dataBuffer = new PacketBuffer();
        const codecInstance = new this.Codec();
        // Codec also has an `action` property that is used to encode the packet ID
        // So we can just pass it in directly, no problem
        codecInstance.encode(dataBuffer, data ?? this.data);

        return dataBuffer;

    }

}