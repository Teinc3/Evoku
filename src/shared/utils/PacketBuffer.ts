import type IPacketBuffer from "../types/utils/IPacketBuffer";


/**
 * A packet buffer optimized for network communication.
 * Auto-extends when writing beyond capacity.
 * Big-endian byte order for network compatibility.
 * 
 * @implements {IPacketBuffer}
 */
export default class PacketBuffer implements IPacketBuffer {
    
    private _buffer: ArrayBuffer;
    private _dataView: DataView;
    private _index: number;
    private _maxWritten: number;


    constructor(initialSize: number = 255) {
        this._buffer = new ArrayBuffer(initialSize, { maxByteLength: (2**16 - 1) });
        this._dataView = new DataView(this._buffer);
        this._index = 0;
        this._maxWritten = 0; // Track the maximum index written to
    }

    // Getters and Setters
    get buffer(): ArrayBuffer {
        return this._buffer
    }

    get dataView(): DataView {
        return this._dataView;
    }

    get index(): number {
        return this._index;
    }

    set index(newIndex: number) {
        // Allow seeking over maxWritten but not beyond current buffer size
        if (newIndex < 0 || newIndex >= this._buffer.byteLength) {
            throw new RangeError("Index is out of bounds!");
        }
        this._index = newIndex;
    }

    get maxWritten(): number {
        return this._maxWritten;
    }

    set maxWritten(value: number) {
        // Monotonically increases
        this._maxWritten = Math.max(this._maxWritten, value);
    }

    // Private methods
    private _checkReadBounds(bytes: number): void {
        if (this._index + bytes > this.maxWritten) {
            throw new RangeError("Read index out of bounds!");
        }
    }

    private _ensureCapacity(requiredSize: number): void {
        if (requiredSize <= this._buffer.byteLength) {
            return
        }

        const newSize = Math.min(Math.max(this._buffer.byteLength * 2, requiredSize), this._buffer.maxByteLength!);
        this._buffer.resize(newSize);
        this._dataView = new DataView(this._buffer); // Recreate DataView to reflect new buffer size
    }

    private _performRead<DType>(
        bytesToRead: number,
        readFn: (pos: number) => DType
    ): DType {

        this._checkReadBounds(bytesToRead);
        const value = readFn(this._index);
        this._index += bytesToRead;
        return value;

    }

    private _performWrite<DType>(
        bytesToWrite: number,
        writeFn: (pos: number, value: DType) => void,
        value: DType,
        offset?: number
    ): number {

        const pos = offset ?? this._index;
        this._ensureCapacity(pos + bytesToWrite);
        
        writeFn(pos, value);
        
        if (offset === undefined) {
            this._index += bytesToWrite;
            this.maxWritten = this._index;
        } else {
            this.maxWritten = pos + bytesToWrite;
        }
        return bytesToWrite;

    }

    private _writeBytes(pos: number, data: Uint8Array): void {
        const targetView = new Uint8Array(this._buffer, pos, data.length);
        targetView.set(data);
    }


    // Public methods
    clone(): IPacketBuffer {
        const clone = new PacketBuffer(this._buffer.byteLength);
        clone.write(this.buffer.slice(0, this.maxWritten));
        clone.index = this.index; // Copy current index
        return clone;
    }

    // Read Methods
    read(length: number): Uint8Array {
        return this._performRead(length, (pos) => new Uint8Array(this._buffer, pos, length));
    }

    readBool(): boolean {
        return this.readByte() !== 0;
    }

    readByte(): number {
        return this._performRead(1, this._dataView.getInt8.bind(this._dataView));
    }

    readShort(): number {
        return this._performRead(2, this._dataView.getInt16.bind(this._dataView));
    }

    readInt(): number {
        return this._performRead(4, this._dataView.getInt32.bind(this._dataView));
    }

    readFloat(): number {
        return this._performRead(4, this._dataView.getFloat32.bind(this._dataView));
    }

    readString(): string {
        return new TextDecoder().decode(this.read(this.readInt()));
    }

    // Write Methods
    write(data: ArrayBuffer | Uint8Array, offset?: number): number {
        if (data instanceof ArrayBuffer) {
            data = new Uint8Array(data);
        }
        return this._performWrite(data.length, this._writeBytes.bind(this), data, offset);
    }

    writeBool(value: boolean, offset?: number): number {
        return this.writeByte(value ? 1 : 0, offset);
    }

    writeByte(value: number, offset?: number): number {
        return this._performWrite(1, this._dataView.setInt8.bind(this._dataView), value, offset);
    }

    writeShort(value: number, offset?: number): number {
        return this._performWrite(2, this._dataView.setInt16.bind(this._dataView), value, offset);
    }

    writeInt(value: number, offset?: number): number {
        return this._performWrite(4, this._dataView.setInt32.bind(this._dataView), value, offset);
    }

    writeFloat(value: number, offset?: number): number {
        return this._performWrite(4, this._dataView.setFloat32.bind(this._dataView), value, offset);
    }

    writeString(value: string, offset?: number): number {
        const stringBytes = new TextEncoder().encode(value);
        this.writeInt(stringBytes.length, offset); // Write length
        return 4 + this.write(stringBytes, offset !== undefined ? offset + 4 : undefined);
    }
}