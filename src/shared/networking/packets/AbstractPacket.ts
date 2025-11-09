import PacketBuffer from '../utils/PacketBuffer';

import type AugmentAction from '../../types/utils/AugmentAction';
import type IPacketBuffer from '../../types/networking/IPacketBuffer';
import type IPacket from '../../types/networking/IPacket';
import type { CustomCodecConstructor } from '../../types/networking/ICodec';
import type ActionEnum from '../../types/enums/actions';


/**
 * Abstract class representing a packet.
 * @template IDataContract - Interface contract type for internal data structure.
 * 
 * This class serves as a base for all packet types, providing a method to retrieve the packet ID.
 * It is intended to be extended by specific packet implementations that define their own ID.
 */
export default abstract class AbstractPacket<GenericAction extends ActionEnum>
implements IPacket<GenericAction> { 

  _data: AugmentAction<GenericAction>;

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
   * @type {CustomCodecConstructor<AugmentAction<GenericAction>>}
   * @abstract
   * @readonly
   */
  abstract readonly Codec: CustomCodecConstructor<AugmentAction<GenericAction>>;

  constructor(data?: AugmentAction<GenericAction>) {
    this._data = data ?? {} as AugmentAction<GenericAction>;
  }

  get data(): AugmentAction<GenericAction> {
    return this._data;
  }

  set data(value: AugmentAction<GenericAction>) {
    this._data = value;
  }

  /**
   * Unwraps the provided packet buffer into Data bound by the packet's contract.
   * 
   * @param buffer 
   * @returns {AugmentAction<GenericAction>} The data decoded from the packet buffer.
   */
  unwrap(buffer: IPacketBuffer): AugmentAction<GenericAction> {
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
  wrap(data?: AugmentAction<GenericAction>): IPacketBuffer {

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
