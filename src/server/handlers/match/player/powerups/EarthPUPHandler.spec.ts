import { jest } from '@jest/globals';

import EarthPUPActions from '@shared/types/enums/actions/match/player/powerups/earth';
import EarthPUPHandler from "./EarthPUPHandler";

import type SessionModel from '../../../../models/networking/Session';
import type RoomModel from '../../../../models/networking/Room';


// Mock classes for testing
class MockSession {
  constructor(public readonly uuid: string) {}
  send = jest.fn();
  forward = jest.fn();
}

class MockRoom {
  constructor(public readonly roomID: string) {}
}

describe('EarthPUPHandler', () => {
  let earthPUPHandler: EarthPUPHandler;
  let mockRoom: MockRoom;
  let mockSession: MockSession;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoom = new MockRoom('test-room');
    mockSession = new MockSession('test-session');
    earthPUPHandler = new EarthPUPHandler(mockRoom as unknown as RoomModel);
  });

  describe('handleUseLandslide', () => {
    it('should handle USE_LANDSLIDE action and return true', () => {
      // Arrange
      const useLandslideData = {
        action: EarthPUPActions.USE_LANDSLIDE,
        actionID: 42,
        pupID: 1,
        clientTime: 1000,
        targetID: 2,
        cellIndex: 5,
      };

      // Act
      const result = earthPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useLandslideData
      );

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('handleUseExcavate', () => {
    it('should handle USE_EXCAVATE action and return true', () => {
      // Arrange
      const useExcavateData = {
        action: EarthPUPActions.USE_EXCAVATE,
        actionID: 43,
        pupID: 2,
        clientTime: 1000,
        cellIndex: 7,
      };

      // Act
      const result = earthPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useExcavateData
      );

      // Assert
      expect(result).toBe(true);
    });
  });
});
