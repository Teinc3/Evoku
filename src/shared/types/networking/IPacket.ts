import type ActionType from '@shared/types/contracts/ActionType';
import type IDataContract from '@shared/types/contracts/IDataContract';
import type { CodecConstructor } from '@shared/types/networking/ICodec';


export default interface IPacket<GenericContract extends IDataContract> {

    _data: GenericContract;

    readonly id: ActionType
    readonly Codec: CodecConstructor<GenericContract>;

    wrap: (data: GenericContract) => ArrayBuffer;
    unwrap: (buffer: ArrayBuffer) => GenericContract;
    
}