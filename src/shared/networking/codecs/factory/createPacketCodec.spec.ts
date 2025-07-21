import createPacketCodec from './createPacketCodec';
import { ByteCodec, StringCodec } from '../primitive';
import PacketBuffer from '../../../utils/PacketBuffer';
import type IDataContract from '../../../types/contracts/IDataContract';


// Define a simple mock contract just for this test file
interface MockContract extends IDataContract {
    id: number;
    name: string;
}


describe('createPacketCodec Factory', () => {
    it('should return a class that correctly holds the provided codecMap', () => {
        // 1. Define the codec map to pass to the factory
        const mockCodecMap = {
            id: ByteCodec,
            name: StringCodec,
        };

        // 2. Use the factory to create the Codec class
        const MockPacketCodec = createPacketCodec<MockContract>(mockCodecMap);

        // 3. Instantiate the generated class
        const codecInstance = new MockPacketCodec();

        // 4. Assert that the codecMap property was assigned correctly
        expect(codecInstance.codecMap).toBe(mockCodecMap);
        expect(codecInstance.codecMap.id).toBe(ByteCodec);
    });

    it('should create a functional codec that can encode and decode data', () => {
        // 1. Define the map and create the Codec class
        const mockCodecMap = {
            id: ByteCodec,
            name: StringCodec,
        };
        const MockPacketCodec = createPacketCodec<MockContract>(mockCodecMap);
        const codecInstance = new MockPacketCodec();

        // 2. Create test data and a buffer
        const testData: MockContract = { id: 42, name: 'test' };
        const buffer = new PacketBuffer();

        // 3. Perform the encode/decode round trip
        codecInstance.encode(buffer, testData);
        buffer.index = 0; // Reset for reading
        const decodedData = codecInstance.decode(buffer);

        // 4. Assert that the data survived the round trip
        expect(decodedData).toEqual(testData);
    });
});