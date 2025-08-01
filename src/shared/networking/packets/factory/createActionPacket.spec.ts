import { IntCodec } from '../../codecs/primitive';
import INJECTABLE_CODECS from '../../codecs/custom/InjectableCodecs';
import ProtocolActions from '../../../types/enums/actions/match/protocol';
import MechanicsActions from '../../../types/enums/actions/match/player/mechanics';
import createActionPacket, { pickInjectables } from './createActionPacket';


// 1. Test the helper function in isolation
describe('pickInjectables', () => {
  it('should pick specified keys from the codec map and ignore others', () => {
    // A. Create a random subset of valid keys
    const allInjectableKeys = Object.keys(INJECTABLE_CODECS) as (keyof typeof INJECTABLE_CODECS)[];
    const selectedKeys = allInjectableKeys
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * allInjectableKeys.length));

    // B. Add a key that does not exist in INJECTABLE_CODECS
    const keyThatIsNotInjectable = 'thisKeyIsNotInjectable';
    const keysToPick = [...selectedKeys, keyThatIsNotInjectable];

    // C. Call the function
    // @ts-expect-error (2345) - Intentionally mixing types
    const selectedCodecs = pickInjectables(INJECTABLE_CODECS, keysToPick);

    // D. Assertions
    // Check that the output contains all the keys that it was supposed to select
    expect(Object.keys(selectedCodecs)).toEqual(
      // @ts-expect-error (2345)
      expect.arrayContaining(allInjectableKeys.filter(key => keysToPick.includes(key)))
    );

    // Check that the number of keys is correct (it shouldn't have added the invalid key)
    expect(Object.keys(selectedCodecs).length).toBe(selectedKeys.length);

    // Explicitly check that the invalid key was not included in the output
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((selectedCodecs as any)[keyThatIsNotInjectable]).toBeUndefined();
  });
});


// 2. Test the main factory function
describe('createActionPacket Factory', () => {

  // Test the most common use case: a packet with both injected and specific fields
  it('should create a packet with both injected and specific codecs', () => {
    // A. Define a packet using the factory
    const MockSetCell = createActionPacket(
      MechanicsActions.SET_CELL,
      ['clientTime', 'actionID', 'value', 'cellIndex'], // Fields to be auto-injected
      {}
    );

    // B. Create an instance with test data
    const packet = new MockSetCell({
      action: MechanicsActions.SET_CELL,
      clientTime: 98765,
      actionID: 69,
      value: 1,
      cellIndex: 50
    });

    // C. Perform the end-to-end wrap/unwrap test
    const buffer = packet.wrap();
    buffer.index = 0; // Reset the buffer index to read from the start
    const newPacket = new MockSetCell();
    const unwrappedData = newPacket.unwrap(buffer);

    // D. Assert that all data, including injected fields, survived the round trip
    expect(unwrappedData.action).toBe(packet.data.action);
    expect(unwrappedData.clientTime).toBe(packet.data.clientTime);
    expect(unwrappedData.actionID).toBe(packet.data.actionID);
    expect(unwrappedData.cellIndex).toBe(packet.data.cellIndex);
    expect(unwrappedData.value).toBe(packet.data.value);
  });

  it('should create a packet with both injected and specific codecs and a custom codec map', () => {
    const MockRejectAction = createActionPacket(
      ProtocolActions.REJECT_ACTION,
      ['actionID'],
      { boardHash: IntCodec }
    );

    const packet = new MockRejectAction({
      action: ProtocolActions.REJECT_ACTION,
      actionID: 42,
      boardHash: 123456789
    });

    const buffer = packet.wrap();
    buffer.index = 0; // Reset the buffer index to read from the start
    const newPacket = new MockRejectAction();
    const unwrappedData = newPacket.unwrap(buffer);

    expect(unwrappedData.action).toBe(packet.data.action);
    expect(unwrappedData.actionID).toBe(packet.data.actionID);
    expect(unwrappedData.boardHash).toBe(packet.data.boardHash);
  });

});