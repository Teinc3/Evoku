import type IByteArray from "@shared/types/utils/IByteArray";

/**
 * An extension of the Int8Array class that provides
 * methods for reading and writing various data types.
 * 
 * Little-endian byte order is used for reading and writing.
 */
export default class ByteArray extends Int8Array implements IByteArray {

    private _index: number = 0;

    /**
     * Returns the current index of the buffer.
     * 
     * @return {number} The current index of the buffer.
     */
    public get index(): number {
        return this._index;
    }

    /**
     * Sets the current index of the buffer.
     * 
     * @param {number} newIndex - The new index to set.
     */
    public set index(newIndex: number) {
        if (newIndex < 0 || newIndex >= this.length) {
            throw new RangeError("Index out of bounds");
        }
        this._index = newIndex;
    }

    /**
     * Reads a specified number of bytes from the buffer
     */
    read(length: number, signed: boolean = true): ByteArray | Uint8Array {
        // Use subarray for zero-copy slicing, then copy if needed
        const slice = this.subarray(this.index, this.index + length);
        this.index += length;
        
        // Return the appropriate type
        return signed ? new ByteArray(slice) : new Uint8Array(slice);
    }

    /**
     * Reads a single byte from the buffer and
     * returns it as a signed integer (-128 to 127).
     * 
     * @returns {number} The byte value read from the buffer.
     */
    readByte(): number {
        return this[this.index++];
    }

    /**
     * Reads 1 single byte from the buffer and returns it as a boolean.
     * 
     * @returns {boolean} The boolean value read from the buffer.
     */
    readBool(): boolean {
        return this.readByte() !== 0;
    }

    /**
     * Reads a 16-bit signed integer from the buffer (-32768 to 32767).
     * 
     * @returns {number} The short value read from the buffer.
     */
    readShort(): number {
        const byte1 = this[this.index++] & 0xFF;
        const byte2 = this[this.index++] & 0xFF;
        
        // Combine bytes (little-endian)
        const value = byte1 | (byte2 << 8);
        
        // Convert to signed 16-bit integer
        return value > 32767 ? value - 65536 : value;
    }
    
    /**
     * Reads a 32-bit signed integer from the buffer (-2147483648 to 2147483647).
     * 
     * @returns {number} The 32-bit signed integer read from the buffer.
     */
    readInt(): number {
        const byte1 = this[this.index++] & 0xFF;
        const byte2 = this[this.index++] & 0xFF;
        const byte3 = this[this.index++] & 0xFF;
        const byte4 = this[this.index++] & 0xFF;
        
        // Combine bytes (little-endian)
        return byte1 | (byte2 << 8) | (byte3 << 16) | (byte4 << 24);
    }

    /**
     * Reads a 32-bit floating point number from the buffer.
     * 
     * @returns {number} The float value read from the buffer.
     */
    readFloat(): number {
        const bytes = new Uint8Array(4);
        for (let i = 0; i < 4; i++) {
            bytes[i] = this[this.index++] & 0xFF;
        }
        
        return new DataView(bytes.buffer).getFloat32(0, true);
    }

    /**
     * Reads a UTF-8 string from the buffer.
     * 
     * @returns {string} The string read from the buffer.
     */
    readString(): string {
        const length = this.readInt();
        const stringBytes = new Uint8Array(length);
        
        for (let i = 0; i < length; i++) {
            stringBytes[i] = this[this.index++] & 0xFF;
        }
        
        return new TextDecoder().decode(stringBytes);
    }


    /**
     * Writes the provided ByteArray to this buffer at the given offset
     * (or current index) and advances the index accordingly.
     * 
     * @param {ByteArray} bytes - The ByteArray to copy from.
     * @param {number} [offset] - The offset at which to write the data.
     * If not provided, writes at current index and advances it.
     * Otherwise, overrides the data starting at the specified offset.
     */
    write(bytes: ByteArray, offset?: number): void {

        // Check if offset is provided
        const pos = offset ?? this.index;
        
        // Write the bytes to the current buffer
        this.set(bytes, pos);
        
        // Advance index if we're writing at default position
        if (offset === undefined) {
            this.index += bytes.length;
        }
    }

    /**
     * Writes a single byte to the buffer.
     * 
     * @param {number} value - The byte value to write (-128 to 127).
     * @param {number} [offset] - The offset at which to write the data.
     */
    writeByte(value: number, offset?: number): void {
        const pos = offset ?? this.index;
        this[pos] = value;
        
        if (offset === undefined) {
            this.index++;
        }
    }

    /**
     * Writes a boolean as a single byte to the buffer.
     * 
     * @param {boolean} value - The boolean value to write.
     * @param {number} [offset] - The offset at which to write the data.
     */
    writeBool(value: boolean, offset?: number): void {
        this.writeByte(value ? 1 : 0, offset);
    }

    /**
     * Writes a 16-bit signed integer to the buffer (little-endian).
     * 
     * @param {number} value - The short value to write (-32768 to 32767).
     * @param {number} [offset] - The offset at which to write the data.
     */
    writeShort(value: number, offset?: number): void {
        const pos = offset ?? this.index;
        
        // Write bytes in little-endian order
        this[pos] = value & 0xFF;
        this[pos + 1] = (value >> 8) & 0xFF;
        
        if (offset === undefined) {
            this.index += 2;
        }
    }

    /**
     * Writes a 32-bit signed integer to the buffer (little-endian).
     * 
     * @param {number} value - The integer value to write (-2147483648 to 2147483647).
     * @param {number} [offset] - The offset at which to write the data.
     */
    writeInt(value: number, offset?: number): void {
        const pos = offset ?? this.index;
        
        // Write bytes in little-endian order
        this[pos] = value & 0xFF;
        this[pos + 1] = (value >> 8) & 0xFF;
        this[pos + 2] = (value >> 16) & 0xFF;
        this[pos + 3] = (value >> 24) & 0xFF;
        
        if (offset === undefined) {
            this.index += 4;
        }
    }

    /**
     * Writes a 32-bit floating point number to the buffer (little-endian).
     * 
     * @param {number} value - The float value to write.
     * @param {number} [offset] - The offset at which to write the data.
     */
    writeFloat(value: number, offset?: number): void {
        const pos = offset ?? this.index;
        
        // Create a temporary buffer for the float
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setFloat32(0, value, true); // true for little-endian
        
        // Copy the bytes to our buffer
        const bytes = new Uint8Array(buffer);
        this.set(bytes, pos);
        
        if (offset === undefined) {
            this.index += 4;
        }
    }

    /**
     * Writes a UTF-8 string to the buffer with length prefix.
     * 
     * @param {string} value - The string value to write.
     * @param {number} [offset] - The offset at which to write the data.
     */
    writeString(value: string, offset?: number): void {
        const pos = offset ?? this.index;
        
        // Encode the string to UTF-8 bytes
        const encoder = new TextEncoder();
        const stringBytes = encoder.encode(value);
        
        // Write length first (4 bytes)
        this.writeInt(stringBytes.length, pos);
        
        // Then write string bytes
        this.set(stringBytes, pos + 4);
        
        if (offset === undefined) {
            this.index += 4 + stringBytes.length;
        }
    }

}