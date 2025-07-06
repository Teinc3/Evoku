import type IDataContract from '@shared/types/contracts/IDataContract';


export default interface ICodec<DataType> {
    _buffer: ArrayBuffer;

    decode: (buffer: ArrayBuffer) => DataType;
    encode: (buffer: ArrayBuffer, data: DataType) => number;
}


export type CodecConstructor<DType> = new (buffer?: ArrayBuffer) => ICodec<DType>;


export type CodecMap<GenericContract extends IDataContract> = {
    [ContractKey in keyof GenericContract]: CodecConstructor<GenericContract[ContractKey]>
};


export interface ICustomCodec<GenericContract extends IDataContract> extends ICodec<GenericContract> {
    readonly codecMap: CodecMap<GenericContract>;
}