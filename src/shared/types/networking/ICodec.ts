import type IDataContract from '../contracts/IDataContract';
import type IPacketBuffer from './IPacketBuffer';


export default interface ICodec<DataType> {
  decode: (buffer: IPacketBuffer) => DataType;
  encode: (buffer: IPacketBuffer, data: DataType) => number;
}

export type CodecConstructor<DType> = new () => ICodec<DType>;

export type CustomCodecConstructor<GenericContract extends IDataContract>
  = new () => ICustomCodec<GenericContract>;

export type CustomCodecMap<GenericContract extends IDataContract> = {
  [ContractKey in keyof GenericContract]: CodecConstructor<GenericContract[ContractKey]>
};

export interface ICustomCodec<GenericContract extends IDataContract>
  extends ICodec<GenericContract> {
  readonly codecMap: CustomCodecMap<GenericContract>;
}