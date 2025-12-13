import { ByteCodec, IntCodec, ShortCodec } from '../../codecs/primitive';
import createArrayCodec from '../../codecs/factory/createArrayCodec';
import PlayerInfoCodec from '../../codecs/custom/PlayerInfoCodec';
import MechanicsActions from '../../../types/enums/actions/match/player/mechanics';
import { ProtocolActions, LobbyActions } from '../../../types/enums/actions';
import createPacket from './createPacket';


describe('createPacket Factory', () => {
  it('should create a packet class that can correctly wrap and unwrap its contract', () => {
    // 1. Define a representative packet using the factory
    const MockPing = createPacket(ProtocolActions.PING, {
      serverTime: IntCodec,
      clientPing: IntCodec
    });

    // 2. Create an instance with some test data
    const packet = new MockPing({
      action: ProtocolActions.PING,
      clientPing: 69,
      serverTime: 123456,
      // @ts-expect-error (2353)
      thisAttributeIsNotInTheContract: -1 // This should not be wrapped without a codec definition
    });

    // 3. Perform the end-to-end test: wrap the data into a buffer
    const buffer = packet.wrap();
    expect(buffer.maxWritten).toBeGreaterThan(0);

    // 4. Unwrap the data from the buffer
    // Reset the buffer index to skip the action ID
    buffer.index = 0;
    const newPacket = new MockPing(); // Create an empty packet to unwrap into
    const unwrappedData = newPacket.unwrap(buffer);

    // 5. Assert that the data survived the round trip
    expect(unwrappedData.action).toBe(packet.data.action);
    expect(unwrappedData.clientPing).toBe(packet.data.clientPing);
    expect(unwrappedData.serverTime).toBe(packet.data.serverTime);
    expect((
      unwrappedData as unknown as Record<string, unknown>
    )['thisAttributeIsNotInTheContract']).toBeUndefined();
  });

  it('should be able to create an action packet using barebones implementation', () => {
    // 1. Define an action packet by definining the codec structure completely by ourselves
    const MockSetCell = createPacket(MechanicsActions.CELL_SET, {
      cellIndex: ShortCodec,
      value: ByteCodec,
      serverTime: IntCodec,
      playerID: ByteCodec,
      actionID: ShortCodec // The order will differ from the original contract! But this is fine
    });

    // 2. Create an instance with some test data
    const packet = new MockSetCell({
      action: MechanicsActions.CELL_SET,
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
    // Reset the buffer index 
    buffer.index = 0;
    const newPacket = new MockSetCell(); // Create an empty packet to unwrap into
    const unwrappedData = newPacket.unwrap(buffer);

    // 5. Assert that the data survived the round trip
    expect(unwrappedData.action).toBe(packet.data.action);
    expect(unwrappedData.cellIndex).toBe(packet.data.cellIndex);
    expect(unwrappedData.value).toBe(packet.data.value);
    expect(unwrappedData.serverTime).toBe(packet.data.serverTime);
    expect(unwrappedData.playerID).toBe(packet.data.playerID);
    expect(unwrappedData.actionID).toBe(packet.data.actionID);

    // 6. Assert that the data is wrapped in the order we specify it to be in
    // Also attach the action key at the start
    expect(Object.keys(unwrappedData)).toEqual([
      'action',
      'cellIndex',
      'value',
      'serverTime',
      'playerID',
      'actionID'
    ]);
  });

  it('should be able to create a packet with complicated and nested custom codecs', () => {
    // 1. Define our own version of the MatchFound packet
    const MockMatchFound = createPacket(LobbyActions.MATCH_FOUND, {
      myID: ByteCodec,
      players: createArrayCodec(PlayerInfoCodec),
    })

    // 2. Create an instance with some test data
    const packet = new MockMatchFound({
      action: LobbyActions.MATCH_FOUND,
      myID: 0,
      players: [
        { playerID: 0, username: 'Player1', elo: 0 },
        { playerID: 1, username: 'Unicode is göofy as fucķ \x00 and i told you so', elo: 0 },
        { playerID: 2, username: '[🥀] 你是傻逼', elo: 0 }
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
    expect(unwrappedData.action).toBe(packet.data.action);
    expect(unwrappedData.myID).toBe(packet.data.myID);
    expect(unwrappedData.players).toEqual(packet.data.players);
  })
});
