import AbstractCodec from "../AbstractCodec";


/**
 * Integer codec for encoding and decoding 4-byte integers (signed by default).
 * 
 * @extends AbstractCodec<number>
 */
export default class IntCodec extends AbstractCodec<number> {
    
    encode(buffer: ArrayBuffer, data?: number): number {
        const view = new DataView(buffer);
        const bytesWritten = 4; // 4 bytes for a 32-bit integer
        view.setInt32(0, data ?? 0, true); // true for little-endian
        return bytesWritten;
    }

    decode(buffer: ArrayBuffer): number {
        const view = new DataView(buffer);
        return view.getInt32(0, true); // true for little-endian
    }
}