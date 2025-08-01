import AbstractCodec from "../AbstractCodec";

import type IPacketBuffer from "../../../types/networking/IPacketBuffer";
import type { CodecConstructor } from "../../../types/networking/ICodec";


/**
 * Factory function to create an ArrayCodec class with a specific element codec.
 */
export default function createArrayCodec<DType>(elementCodec: CodecConstructor<DType>) {
  return class ArrayCodec extends AbstractCodec<DType[]> {
    public readonly Codec = elementCodec;
    public readonly elementCodec: AbstractCodec<DType>;

    constructor() {
      super();
      this.elementCodec = new elementCodec();
    }

    encode(buffer: IPacketBuffer, data: DType[]): number {
      let bytes = buffer.writeInt(data.length); // Write array length
      for (const item of data) {
        bytes += this.elementCodec.encode(buffer, item);
      }
      return bytes;
    }

    decode(buffer: IPacketBuffer): DType[] {
      const length = buffer.readInt();
      const arr: DType[] = [];
      for (let i = 0; i < length; i++) {
        arr.push(this.elementCodec.decode(buffer));
      }
      return arr;
    }
  };
}