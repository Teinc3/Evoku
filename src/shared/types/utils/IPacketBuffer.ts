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

    write(data: ArrayBuffer | Uint8Array, offset?: number): void;
    writeBool(value: boolean, offset?: number): void;
    writeByte(value: number, offset?: number): void;
    writeShort(value: number, offset?: number): void;
    writeInt(value: number, offset?: number): void;
    writeFloat(value: number, offset?: number): void;
    writeString(value: string, offset?: number): void;

    clone(): IPacketBuffer;

}