export default interface IPacketBuffer {

    get buffer(): ArrayBuffer;
    get dataView(): DataView;
    get index(): number;
    set index(newIndex: number);

    read(length: number): Uint8Array;
    readBool(): boolean;
    readByte(): number;
    readShort(): number;
    readInt(): number;
    readFloat(): number;
    readString(): string;

    write(data: ArrayBuffer | Uint8Array, offset?: number): number;
    writeBool(value: boolean, offset?: number): number;
    writeByte(value: number, offset?: number): number;
    writeShort(value: number, offset?: number): number;
    writeInt(value: number, offset?: number): number;
    writeFloat(value: number, offset?: number): number;
    writeString(value: string, offset?: number): number;

    clone(): IPacketBuffer;

}