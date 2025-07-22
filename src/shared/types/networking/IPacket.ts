import type IPacketBuffer from '../utils/IPacketBuffer';
import type AugmentAction from '../utils/AugmentAction';
import type ActionEnum from '../enums/actions';
import type { CustomCodecConstructor } from './ICodec';


export default interface IPacket<GenericAction extends ActionEnum> {

  _data: AugmentAction<GenericAction>;

  readonly id: GenericAction;
  readonly Codec: CustomCodecConstructor<AugmentAction<GenericAction>>;

  get data(): AugmentAction<GenericAction>;
  set data(value: AugmentAction<GenericAction>);

  wrap: (data?: AugmentAction<GenericAction>) => IPacketBuffer;
  unwrap: (buffer: IPacketBuffer) => AugmentAction<GenericAction>;

}

/**
 * An extended constructor type for packets,
 * containing static properties for accessing the packet's ID and Codec.
 */
export type PacketConstructor<GenericAction extends ActionEnum> = {

  readonly id: GenericAction;
  readonly Codec: CustomCodecConstructor<AugmentAction<GenericAction>>;

  new (data?: AugmentAction<GenericAction>): IPacket<GenericAction>;

}
