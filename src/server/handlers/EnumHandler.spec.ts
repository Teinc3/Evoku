import { jest } from '@jest/globals';

import EnumHandler from "./EnumHandler";

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type { SessionModel } from '../models/networking';


// Type definitions for accessing private methods
interface EnumHandlerPrivate {
  handlerMap: Record<number, (session: SessionModel, data: AugmentAction<number>) => boolean>;
}

// Mock classes for testing
class MockSession {
  constructor(public readonly uuid: string) {}
  send = jest.fn();
  forward = jest.fn();
}

// Test implementation of EnumHandler
class TestEnumHandler extends EnumHandler<number> {
  constructor() {
    super();
    this.setHandlerMap({
      [1]: this.handleAction1.bind(this),
      [2]: this.handleAction2.bind(this),
    });
  }

  handleAction1(_session: SessionModel, _data: AugmentAction<number>): boolean {
    return true;
  }

  handleAction2(_session: SessionModel, _data: AugmentAction<number>): boolean {
    return true;
  }
}

describe('EnumHandler', () => {
  let enumHandler: TestEnumHandler;
  let mockSession: MockSession;

  beforeEach(() => {
    jest.clearAllMocks();
    enumHandler = new TestEnumHandler();
    mockSession = new MockSession('test-session');
  });

  describe('handleData', () => {
    it('should handle known actions successfully', async () => {
      // Arrange
      const action1Data = {
        action: 1,
        clientTime: 1000,
      };

      const action2Data = {
        action: 2,
        clientTime: 1000,
      };

      // Act & Assert
      expect(await enumHandler.handleData(
        mockSession as unknown as SessionModel, 
        action1Data as unknown as AugmentAction<number>
      )).toBe(true);
      expect(await enumHandler.handleData(
        mockSession as unknown as SessionModel, 
        action2Data as unknown as AugmentAction<number>
      )).toBe(true);
    });

    it('should return false for unknown actions', async () => {
      // Arrange
      const unknownActionData = {
        action: 999, // Action not in handlerMap
        clientTime: 1000,
      };

      // Act
      const result = await enumHandler.handleData(
        mockSession as unknown as SessionModel,
        unknownActionData as unknown as AugmentAction<number>
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('setHandlerMap', () => {
    it('should bind handler functions to the correct context', async () => {
      // Arrange
      const mockHandler = jest.fn<(
        session: SessionModel, 
        data: AugmentAction<number>
      ) => boolean>();
      const testHandler = new TestEnumHandler();

      // Act
      testHandler.setHandlerMap({
        [3]: mockHandler,
      });

      // Manually call the handler to verify binding
      const boundHandler = (testHandler as unknown as EnumHandlerPrivate).handlerMap[3];
      const mockSessionObj = mockSession as unknown as SessionModel;
      const mockData = { action: 3, clientTime: 1000 } as unknown as AugmentAction<number>;

      boundHandler(mockSessionObj, mockData);

      // Assert
      expect(mockHandler).toHaveBeenCalledWith(mockSessionObj, mockData);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should skip binding for falsy handlers', async () => {
      // Arrange
      const mockHandler = jest.fn<(
        session: SessionModel,
        data: AugmentAction<number>
      ) => boolean>();
      const testHandler = new TestEnumHandler();

      // Act
      testHandler.setHandlerMap({
        [3]: mockHandler,
        [4]: undefined, // Falsy handler that should be skipped
        [5]: undefined, // Another falsy handler
      });

      // Assert
      expect((testHandler as unknown as EnumHandlerPrivate).handlerMap[3]).toBeDefined();
      expect((testHandler as unknown as EnumHandlerPrivate).handlerMap[4]).toBeUndefined();
      expect((testHandler as unknown as EnumHandlerPrivate).handlerMap[5]).toBeUndefined();
    });
  });
});
