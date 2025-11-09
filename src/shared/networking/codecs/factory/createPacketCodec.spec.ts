import createPacketCodec from './createPacketCodec';
import { IntCodec } from '../primitive';
import ActionCodec from '../custom/ActionCodec';
import PacketBuffer from '../../utils/PacketBuffer';
import ProtocolActions from '../../../types/enums/actions/match/protocol';

import type AugmentAction from '../../../types/utils/AugmentAction';


// We use a real contract from our application
type AugmentedPingContract = AugmentAction<ProtocolActions.PING>;

describe('createPacketCodec Factory', () => {
  // Test 1: Verify the structure of the generated class
  it('should return a class that combines the injected ActionCodec with the codecMap', () => {
    // A. Define the codec map for the NON-action properties of the contract
    const pingCodecMap = {
      clientPing: IntCodec,
      serverTime: IntCodec,
    };

    // B. Use the factory to create the Codec class using a REAL action
    // Coerce the type to Networking.PING
    const PingPacketCodec = createPacketCodec<ProtocolActions.PING>(pingCodecMap);

    // C. Instantiate the generated class
    const codecInstance = new PingPacketCodec();

    // D. Assert that the final codecMap has the correct structure
    expect(codecInstance.codecMap.action).toBe(ActionCodec);
    expect(codecInstance.codecMap.clientPing).toBe(IntCodec);
    expect(codecInstance.codecMap.serverTime).toBe(IntCodec);
  });

  // Test 2: Verify the encode/decode logic of the generated class
  it('should create a functional codec that can perform a full encode/decode round trip', () => {
    // A. Define the map and create the Codec class
    const pingCodecMap = {
      clientPing: IntCodec,
      serverTime: IntCodec,
    };
    const PingPacketCodec = createPacketCodec<ProtocolActions.PING>(pingCodecMap);
    const codecInstance = new PingPacketCodec();

    // B. Create test data that matches the full AugmentedContract
    const testData: AugmentedPingContract = {
      action: ProtocolActions.PING, // Include the action property
      clientPing: 53,
      serverTime: 67890,
    };
    const buffer = new PacketBuffer();

    // C. Perform the encode/decode round trip
    codecInstance.encode(buffer, testData);
    buffer.index = 0; // Reset for reading
    const decodedData = codecInstance.decode(buffer);

    // D. Assert that the data survived the round trip.
    // This implicitly tests the custom `decode` logic that injects the action.
    expect(decodedData).toEqual(testData);
  });
});
