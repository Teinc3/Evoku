import type IDataContract from '@shared/types/contracts/base/IDataContract';
import type { CodecConstructor } from '@shared/types/networking/ICodec';
import type IPacketBuffer from '@shared/types/utils/IPacketBuffer';


export default interface IPacket<GenericContract extends IDataContract> {

    _data: GenericContract;

    readonly id: GenericContract['action']
    readonly Codec: CodecConstructor<GenericContract>;

    get data(): GenericContract;
    set data(value: GenericContract);

    wrap: (data: GenericContract) => IPacketBuffer;
    unwrap: (buffer: IPacketBuffer) => GenericContract;
    
}

export type PacketConstructor = new <GenericContract extends IDataContract>(data?: GenericContract) => IPacket<GenericContract>;
