import { ByteCodec, IntCodec, ShortCodec } from '../../codecs/primitive';
import createArrayCodec from '../../codecs/factory/createArrayCodec';
import PlayerInfoCodec from '../../codecs/custom/PlayerInfoCodec';
import Networking from '../../../types/enums/actions/networking';
import Gameplay from '../../../types/enums/actions/mechanics/gameplay';
import Lifecycle from '../../../types/enums/actions/lifecycle';
import createPacket from './createPacket';


describe('createPacket Factory', () => {
  it('should create a packet class that can correctly wrap and unwrap its contract', () => {
    // 1. Define a representative packet using the factory
    const MockPing = createPacket(Networking.PING, {
      serverTime: IntCodec,
      clientPing: IntCodec
    });

    // 2. Create an instance with some test data
    const packet = new MockPing({
      clientPing: 69,
      serverTime: 123456,
      // @ts-expect-error (2353)
      thisAttributeIsNotInTheContract: -1 // This should not be wrapped without a codec definition
    });

    // 3. Perform the end-to-end test: wrap the data into a buffer
    const buffer = packet.wrap();
    expect(buffer.maxWritten).toBeGreaterThan(0);

    // 4. Unwrap the data from the buffer
    // Reset the buffer index to read from the start
    buffer.index = 0;
    const newPacket = new MockPing(); // Create an empty packet to unwrap into
    const unwrappedData = newPacket.unwrap(buffer);

    // 5. Assert that the data survived the round trip
    expect(unwrappedData.clientPing).toBe(packet.data.clientPing);
    expect(unwrappedData.serverTime).toBe(packet.data.serverTime);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((unwrappedData as any).thisAttributeIsNotInTheContract).toBeUndefined();
  });

  it('should be able to create an action packet using barebones implementation', () => {
    // 1. Define an action packet by definining the codec structure completely by ourselves
    const MockSetCell = createPacket(Gameplay.CELL_SET, {
      cellIndex: ShortCodec,
      value: ByteCodec,
      serverTime: IntCodec,
      playerID: ByteCodec,
      actionID: ShortCodec // The order will differ from the original contract! But this is fine
    });

    // 2. Create an instance with some test data
    const packet = new MockSetCell({
      cellIndex: 5,
      value: 1,
      serverTime: 123456789,
      playerID: 0,
      actionID: 84
    });

    // 3. Perform the end-to-end test: wrap the data into a buffer
    const buffer = packet.wrap();
    expect(buffer.maxWritten).toBeGreaterThan(0);

    // 4. Unwrap the data from the buffer
    // Reset the buffer index to read from the start
    buffer.index = 0;
    const newPacket = new MockSetCell(); // Create an empty packet to unwrap into
    const unwrappedData = newPacket.unwrap(buffer);

    // 5. Assert that the data survived the round trip
    expect(unwrappedData.cellIndex).toBe(packet.data.cellIndex);
    expect(unwrappedData.value).toBe(packet.data.value);
    expect(unwrappedData.serverTime).toBe(packet.data.serverTime);
    expect(unwrappedData.playerID).toBe(packet.data.playerID);
    expect(unwrappedData.actionID).toBe(packet.data.actionID);

    // 6. Assert that the data is wrapped in the order we specify it to be in
    expect(Object.keys(unwrappedData)).toEqual([
      'cellIndex',
      'value',
      'serverTime',
      'playerID',
      'actionID'
    ]);
  });

  it('should be able to create a packet with complicated and nested custom codecs', () => {
    // 1. Define our own version of the MatchFound packet
    const MockMatchFound = createPacket(Lifecycle.MATCH_FOUND, {
      myID: ByteCodec,
      players: createArrayCodec(PlayerInfoCodec),
    })

    // 2. Create an instance with some test data
    const packet = new MockMatchFound({
      myID: 0,
      players: [
        { playerID: 0, username: 'Player1' },
        { playerID: 1, username: 'Unicode is göofy as fucķ \x00 and i told you so' },
        { playerID: 2, username: '[🥀] 你是傻逼' }
      ]
    });

    // 3. Perform the end-to-end test: wrap the data into a buffer
    const buffer = packet.wrap();
    expect(buffer.maxWritten).toBeGreaterThan(0);

    // 4. Unwrap the data from the buffer
    // Reset the buffer index to read from the start
    buffer.index = 0;
    const newPacket = new MockMatchFound(); // Create an empty packet to unwrap into
    const unwrappedData = newPacket.unwrap(buffer);

    // 5. Assert that the data survived the round trip
    expect(unwrappedData.myID).toBe(packet.data.myID);
    expect(unwrappedData.players).toEqual(packet.data.players);
  })
});