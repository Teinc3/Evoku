export default interface IByteArray {

    get index(): number;
    set index(newIndex: number);

    readBool(): boolean;
    readByte(): number;
    readShort(): number;
    readInt(): number;
    readFloat(): number;
    readString(): string;

    writeBool(value: boolean, offset?: number): void;
    writeByte(value: number, offset?: number): void;
    writeShort(value: number, offset?: number): void;
    writeInt(value: number, offset?: number): void;
    writeFloat(value: number, offset?: number): void;
    writeString(value: string, offset?: number): void;

}