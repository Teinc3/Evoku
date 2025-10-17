import { TestBed } from '@angular/core/testing';

import SessionActions from '@shared/types/enums/actions/system/session';
import WebSocketService from '../../networking/services/WebSocketService';
import NetworkService from './network.service';


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

  describe('Guest Authentication', () => {
    const cookieName = 'evoku_guest_token';

    beforeEach(() => {
      // Clear cookies before each test
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    describe('initGuestAuth', () => {
      it('should fetch and save token when no cookie exists', async () => {
        const mockResponse = {
          token: 'new-test-token',
          elo: 0
        };

        spyOn(window, 'fetch').and.returnValue(
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResponse)
          } as Response)
        );

        const result = await service.initGuestAuth();

        expect(window.fetch).toHaveBeenCalledWith('/api/auth/guest', jasmine.objectContaining({
          method: 'POST',
          body: JSON.stringify({})
        }));

        expect(result).toEqual(mockResponse);
        expect(document.cookie).toContain(cookieName);
      });

      it('should send existing token if cookie exists', async () => {
        const existingToken = 'existing-test-token';
        document.cookie = `${cookieName}=${existingToken}; path=/`;

        const mockResponse = {
          token: 'new-test-token',
          elo: 1500
        };

        spyOn(window, 'fetch').and.returnValue(
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResponse)
          } as Response)
        );

        const result = await service.initGuestAuth();

        expect(window.fetch).toHaveBeenCalledWith('/api/auth/guest', jasmine.objectContaining({
          method: 'POST',
          body: JSON.stringify({ token: existingToken })
        }));

        expect(result).toEqual(mockResponse);
      });

      it('should throw error on failed fetch', async () => {
        spyOn(window, 'fetch').and.returnValue(
          Promise.resolve({
            ok: false,
            status: 500
          } as Response)
        );

        spyOn(console, 'error');

        try {
          await service.initGuestAuth();
          fail('Expected initGuestAuth to throw an error');
        } catch (error) {
          expect((error as Error).message).toContain('Guest auth failed with status 500');
        }

        expect(console.error).toHaveBeenCalled();
      });

      it('should handle network errors', async () => {
        spyOn(window, 'fetch').and.returnValue(
          Promise.reject(new Error('Network error'))
        );

        spyOn(console, 'error');

        try {
          await service.initGuestAuth();
          fail('Expected initGuestAuth to throw an error');
        } catch (error) {
          expect((error as Error).message).toBe('Network error');
        }

        expect(console.error).toHaveBeenCalled();
      });
    });
  });
});
