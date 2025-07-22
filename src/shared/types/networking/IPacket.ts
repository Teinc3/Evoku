import type IPacketBuffer from '../utils/IPacketBuffer';
import type ActionEnum from '../enums/actions';
import type ActionMap from '../actionmap';
import type { CodecConstructor } from './ICodec';


export default interface IPacket<GenericAction extends ActionEnum> {
    
  _data: ActionMap[GenericAction];

  readonly id: GenericAction;
  readonly Codec: CodecConstructor<ActionMap[GenericAction]>;

  get data(): ActionMap[GenericAction];
  set data(value: ActionMap[GenericAction]);

    wrap: (data?: ActionMap[GenericAction]) => IPacketBuffer;
    unwrap: (buffer: IPacketBuffer) => ActionMap[GenericAction];
    
}

/**
 * An extended constructor type for packets,
 * containing static properties for accessing the packet's ID and Codec.
 */
export type PacketConstructor<GenericAction extends ActionEnum> = {

  readonly id: GenericAction;
  readonly Codec: CodecConstructor<ActionMap[GenericAction]>;

  new (data?: ActionMap[GenericAction]): IPacket<GenericAction>;

}
