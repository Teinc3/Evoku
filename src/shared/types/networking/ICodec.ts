import type IDataContract from '@shared/types/contracts/base/IDataContract';
import type IPacketBuffer from '@shared/types/utils/IPacketBuffer';


export default interface ICodec<DataType> {
    decode: (buffer: IPacketBuffer) => DataType;
    encode: (buffer: IPacketBuffer, data: DataType) => number;
}

export type CodecConstructor<DType> = new () => ICodec<DType>;

export type CodecMap<GenericContract extends IDataContract> = {
    [ContractKey in keyof GenericContract]: CodecConstructor<GenericContract[ContractKey]>
};

export interface ICustomCodec<GenericContract extends IDataContract> extends ICodec<GenericContract> {
    readonly codecMap: CodecMap<GenericContract>;
}