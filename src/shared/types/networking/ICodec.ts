import type IDataContract from '../contracts/base/IDataContract';
import type IPacketBuffer from '../utils/IPacketBuffer';


export default interface ICodec<DataType> {
    decode: (buffer: IPacketBuffer) => DataType;
    encode: (buffer: IPacketBuffer, data: DataType) => number;
}

export type CodecConstructor<DType> = new () => ICodec<DType>;

export type CustomCodecMap<GenericContract extends IDataContract> = {
    [ContractKey in keyof GenericContract]: CodecConstructor<GenericContract[ContractKey]>
};

export interface ICustomCodec<GenericContract extends IDataContract> extends ICodec<GenericContract> {
    readonly codecMap: CustomCodecMap<GenericContract>;
}