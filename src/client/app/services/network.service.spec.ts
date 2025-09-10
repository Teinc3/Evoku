import { TestBed } from '@angular/core/testing';

import SessionActions from '@shared/types/enums/actions/system/session';
import NetworkService from './network.service';
import { APP_CONFIG } from '../config';
import WebSocketService from '../../networking/services/WebSocketService';


// Removed separate type import; class imported above for DI


// Mock configuration data
const mockConfig = {
  networking: {
    ws: {
      uri: 'ws://localhost:8745/ws',
      timeoutMs: 5000
    },
    service: {
      autoReconnect: true,
      backoffMs: 500,
      backoffMaxMs: 5000,
      pingIntervalMs: 15000
    }
  },
  security: {
    packetScramblerSeed: 'dev-scrambler-seed-123'
  }
};

// Mock WebSocketService
class MockWebSocketService {
  ready = false;
  lastPingAt: number | null = null;
  queue: Array<[SessionActions, Record<string, unknown>]> = [];
  reconnectTimer: number | null = null;
  pingTimer: number | null = null;
  lastPacketSentAt = 0;
  disconnectCallback: (() => void) | null = null;

  async connect(): Promise<void> {
    this.ready = true;
  }

  disconnect(_code?: number, _reason?: string): void {
    this.ready = false;
  }

  send = jasmine.createSpy('send');

  setDisconnectCallback(callback: () => void): void {
    this.disconnectCallback = callback;
  }

  destroy(): void {
    // Mock implementation
  }
}

describe('NetworkService', () => {
  let service: NetworkService;
  let mockWebSocketService: MockWebSocketService;

  beforeEach(() => {
    mockWebSocketService = new MockWebSocketService();

    TestBed.configureTestingModule({
      providers: [
        NetworkService,
        { provide: APP_CONFIG, useValue: mockConfig },
        { provide: WebSocketService, useFactory: () => mockWebSocketService }
      ]
    });

    service = TestBed.inject(NetworkService);
  });

  describe('Basic functionality', () => {
    it('should create NetworkService instance', () => {
      expect(service).toBeTruthy();
    });

    it('should provide access to WebSocketService instance', () => {
      expect(service.getWSService()).toBe(mockWebSocketService as unknown as WebSocketService);
    });
  });

  describe('Connection management', () => {
    it('should connect successfully', async () => {
      await service.connect();
      expect(mockWebSocketService.ready).toBe(true);
    });

    it('should disconnect', () => {
      service.disconnect(1000, 'Test disconnect');
      expect(mockWebSocketService.ready).toBe(false);
    });
  });

  describe('Message sending', () => {
    it('should send messages through WebSocketService', () => {
      service.send(SessionActions.HEARTBEAT, {});
      expect(mockWebSocketService.send).toHaveBeenCalledWith(SessionActions.HEARTBEAT, {});
    });
  });

  describe('Status getters', () => {
    it('should return connection status', () => {
      mockWebSocketService.ready = true;
      expect(service.isConnected).toBe(true);

      mockWebSocketService.ready = false;
      expect(service.isConnected).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle connection errors gracefully', async () => {
      // Mock a connection failure
      spyOn(mockWebSocketService, 'connect').and.throwError('Connection failed');

      try {
        await service.connect();
        fail('Expected connection to throw an error');
      } catch (error) {
        expect((error as Error).message).toBe('Connection failed');
      }
    });
  });
});
