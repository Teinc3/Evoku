import PacketBuffer from '../utils/PacketBuffer';
import { IntCodec } from '../codecs/primitive';
import CustomCodec from '../codecs/CustomCodec';
import ActionCodec from '../codecs/custom/ActionCodec';
import MechanicsActions from '../../types/enums/actions/match/player/mechanics';
import AbstractPacket from './AbstractPacket';

import type AugmentAction from '../../types/utils/AugmentAction';
import type { CustomCodecConstructor, CustomCodecMap } from '../../types/networking/ICodec';


// Mock codec for testing - handles SetCell contract with required fields
class MockSetCellCodec extends CustomCodec<AugmentAction<MechanicsActions.SET_CELL>> {
  readonly codecMap = {
    action: ActionCodec,
    clientTime: IntCodec,
    actionID: IntCodec,
    cellIndex: IntCodec,
    value: IntCodec
  } as CustomCodecMap<AugmentAction<MechanicsActions.SET_CELL>>;
}

// Concrete implementation for testing
class TestSetCellPacket extends AbstractPacket<MechanicsActions.SET_CELL> {
  readonly id = MechanicsActions.SET_CELL;
  readonly Codec = MockSetCellCodec as CustomCodecConstructor<
    AugmentAction<MechanicsActions.SET_CELL>
  >;
}

describe('AbstractPacket', () => {
  let packet: TestSetCellPacket;
  let mockData: AugmentAction<MechanicsActions.SET_CELL>;

  beforeEach(() => {
    mockData = {
      action: MechanicsActions.SET_CELL,
      clientTime: 1000,
      actionID: 42,
      cellIndex: 5,
      value: 2
    };
    packet = new TestSetCellPacket(mockData);
  });

  describe('constructor', () => {
    it('should initialize with provided data', () => {
      const testData: AugmentAction<MechanicsActions.SET_CELL> = {
        action: MechanicsActions.SET_CELL,
        clientTime: 1000,
        actionID: 42,
        cellIndex: 5,
        value: 2
      };
      const testPacket = new TestSetCellPacket(testData);
      expect(testPacket.data).toEqual(testData);
    });

    it('should initialize with empty object when no data provided', () => {
      const testPacket = new TestSetCellPacket();
      expect(testPacket.data).toEqual({} as AugmentAction<MechanicsActions.SET_CELL>);
    });
  });

  describe('data property', () => {
    it('should get the current data', () => {
      expect(packet.data).toEqual(mockData);
    });

    it('should set new data', () => {
      const newData: AugmentAction<MechanicsActions.SET_CELL> = {
        action: MechanicsActions.SET_CELL,
        clientTime: 2000,
        actionID: 43,
        cellIndex: 10,
        value: 3
      };
      packet.data = newData;
      expect(packet.data).toEqual(newData);
    });
  });

  describe('id property', () => {
    it('should return the correct packet ID', () => {
      expect(packet.id).toBe(MechanicsActions.SET_CELL);
    });
  });

  describe('Codec property', () => {
    it('should return the correct codec constructor', () => {
      expect(packet.Codec).toBe(MockSetCellCodec);
    });
  });

  describe('unwrap method', () => {
    it('should decode data from buffer and set it as packet data', () => {
      const buffer = new PacketBuffer();
      const codecInstance = new MockSetCellCodec();
      codecInstance.encode(buffer, mockData);

      // Reset buffer position for reading
      buffer.index = 0;

      const result = packet.unwrap(buffer);
      expect(result.action).toBe(MechanicsActions.SET_CELL);
      expect(packet.data.action).toBe(MechanicsActions.SET_CELL);
    });

    it('should return the decoded data', () => {
      const buffer = new PacketBuffer();
      const codecInstance = new MockSetCellCodec();
      codecInstance.encode(buffer, mockData);

      buffer.index = 0;

      const result = packet.unwrap(buffer);
      expect(result.action).toBe(MechanicsActions.SET_CELL);
    });
  });

  describe('wrap method', () => {
    it('should encode data into buffer using provided data', () => {
      const testData: AugmentAction<MechanicsActions.SET_CELL> = {
        action: MechanicsActions.SET_CELL,
        clientTime: 1000,
        actionID: 42,
        cellIndex: 5,
        value: 2
      };
      const result = packet.wrap(testData);

      expect(result).toBeInstanceOf(PacketBuffer);
      expect(result.index).toBeGreaterThan(0);
    });

    it('should encode data into buffer using instance data when no data provided', () => {
      packet.data = {
        action: MechanicsActions.SET_CELL,
        clientTime: 1000,
        actionID: 42,
        cellIndex: 5,
        value: 2
      };
      const result = packet.wrap();

      expect(result).toBeInstanceOf(PacketBuffer);
      expect(result.index).toBeGreaterThan(0);
    });

    it('should throw error when no data is available', () => {
      // Create a fresh packet without setting any data
      const emptyPacket = new TestSetCellPacket();
      // Manually set data to null to trigger the error condition
      // @ts-expect-error ts(2322)
      emptyPacket._data = undefined;
      expect(() => emptyPacket.wrap()).toThrow('No data provided to wrap in packet buffer.');
    });
  });

  describe('integration with PacketBuffer', () => {
    it('should round-trip data through unwrap and wrap', () => {
      const originalData: AugmentAction<MechanicsActions.SET_CELL> = {
        action: MechanicsActions.SET_CELL,
        clientTime: 1000,
        actionID: 42,
        cellIndex: 5,
        value: 2
      };

      // Wrap data into buffer
      const buffer = packet.wrap(originalData);

      // Create new packet and unwrap from buffer
      const newPacket = new TestSetCellPacket();
      buffer.index = 0; // Reset for reading
      const unwrappedData = newPacket.unwrap(buffer);

      expect(unwrappedData.action).toBe(originalData.action);
      expect(newPacket.data.action).toBe(originalData.action);
    });
  });
});
