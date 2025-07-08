import type IPacketBuffer from "@shared/types/utils/IPacketBuffer";


/**
 * A packet buffer optimized for network communication.
 * Auto-extends when writing beyond capacity.
 * Little-endian byte order for consistency.
 * 
 * @implements {IPacketBuffer}
 */
export default class PacketBuffer implements IPacketBuffer {
    
    private _buffer: ArrayBuffer;
    private _dataView: DataView;
    private _index: number = 0;


    constructor(initialSize: number = 255) {
        this._buffer = new ArrayBuffer(initialSize, { maxByteLength: (2**16 - 1) });
        this._dataView = new DataView(this._buffer);
    }


    private _ensureCapacity(requiredSize: number): void {
        if (requiredSize <= this._buffer.byteLength) {
            return
        }

        const newSize = Math.min(Math.max(this._buffer.byteLength * 2, requiredSize), this._buffer.maxByteLength!);
        this._buffer.resize(newSize);
        this._dataView = new DataView(this._buffer); // Recreate DataView to reflect new buffer size
    }

    clone(): IPacketBuffer {
        const clone = new PacketBuffer(this._buffer.byteLength);
        clone.write(this.buffer);
        clone.index = this.index; // Copy current index
        return clone;
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
        if (newIndex < 0 || newIndex >= this._buffer.byteLength) {
            throw new RangeError("Index is out of bounds!");
        }
        this._index = newIndex;
    }

    
    // Read Methods
    read(length: number): Uint8Array {
        const result = new Uint8Array(this._buffer, this._index, length);
        this._index += length;
        return result;
    }

    readBool(): boolean {
        return this.readByte() !== 0;
    }

    readByte(): number {
        return this._dataView.getInt8(this._index++);
    }

    readShort(): number {
        const value = this._dataView.getInt16(this._index, true);
        this._index += 2;
        return value;
    }

    readInt(): number {
        const value = this._dataView.getInt32(this._index, true);
        this._index += 4;
        return value;
    }

    readFloat(): number {
        const value = this._dataView.getFloat32(this._index, true);
        this._index += 4;
        return value;
    }

    readString(): string {
        const length = this.readInt();
        const bytes = new Uint8Array(this._buffer, this._index, length);
        this._index += length;
        return new TextDecoder().decode(bytes);
    }

    // Write Methods
    write(data: ArrayBuffer | Uint8Array, offset?: number): number {
        const pos = offset ?? this._index;
        if (data instanceof ArrayBuffer) {
            // If data is an ArrayBuffer, convert to byte array for simple handling
            data = new Uint8Array(data);
        }
                
        this._ensureCapacity(pos + data.length);

        const targetView = new Uint8Array(this._buffer, pos, data.length);
        targetView.set(data);
                
        if (offset === undefined) {
            this._index += data.length;
        }
        return data.length;
    }

    writeBool(value: boolean, offset?: number): number {
        return this.writeByte(value ? 1 : 0, offset);
    }

    writeByte(value: number, offset?: number): number {
        const pos = offset ?? this._index;
        this._ensureCapacity(pos + 1);
        this._dataView.setInt8(pos, value);
        if (offset === undefined) {
            this._index++;
        }
        return 1;
    }

    writeShort(value: number, offset?: number): number {
        const pos = offset ?? this._index;
        this._ensureCapacity(pos + 2);
        this._dataView.setInt16(pos, value, true);
        if (offset === undefined) {
            this._index += 2;
        }
        return 2;
    }

    writeInt(value: number, offset?: number): number {
        const pos = offset ?? this._index;
        this._ensureCapacity(pos + 4);
        this._dataView.setInt32(pos, value, true);
        if (offset === undefined) {
            this._index += 4;
        }
        return 4;
    }

    writeFloat(value: number, offset?: number): number {
        const pos = offset ?? this._index;
        this._ensureCapacity(pos + 4);
        this._dataView.setFloat32(pos, value, true);
        if (offset === undefined) {
            this._index += 4;
        }
        return 4;
    }

    writeString(value: string, offset?: number): number {
        const pos = offset ?? this._index;
        const stringBytes = new TextEncoder().encode(value);
        const totalSize = 4 + stringBytes.length;
        this._ensureCapacity(pos + totalSize);

        // Write length and string bytes
        this._dataView.setInt32(pos, stringBytes.length, true);        
        const targetView = new Uint8Array(this._buffer, pos + 4, stringBytes.length);
        targetView.set(stringBytes);
                
        if (offset === undefined) {
            this._index += totalSize;
        }
        return totalSize;
    }
}