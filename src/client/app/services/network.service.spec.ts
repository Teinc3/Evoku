import { Subject } from 'rxjs';
import { TestBed } from '@angular/core/testing';

import SessionActions from '@shared/types/enums/actions/system/session';
import WebSocketService from '../../networking/services/WebSocketService';
import APIService from '../../networking/services/APIService';
import NetworkService from './network.service';
import CookieService from './cookie.service';


// Mock WebSocketService
class MockWebSocketService {
  ready = false;
  lastPingAt: number | null = null;
  queue: Array<[SessionActions, Record<string, unknown>]> = [];
  pingTimer: number | null = null;
  lastPacketSentAt = 0;
  disconnectCallback: (() => void) | null = null;
  authToken: string | null = null;
  packetSubject = new Subject<Record<string, unknown>>();

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

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  destroy(): void {
    // Mock implementation
  }
}

// Mock APIService
class MockAPIService {
  authenticateGuest = jasmine.createSpy('authenticateGuest');
}

// Mock CookieService
class MockCookieService {
  get = jasmine.createSpy('get');
  set = jasmine.createSpy('set');
  delete = jasmine.createSpy('delete');
}

describe('NetworkService', () => {
  let service: NetworkService;
  let mockWebSocketService: MockWebSocketService;
  let mockAPIService: MockAPIService;
  let mockCookieService: MockCookieService;

  beforeEach(() => {
    mockWebSocketService = new MockWebSocketService();
    mockAPIService = new MockAPIService();
    mockCookieService = new MockCookieService();

    TestBed.configureTestingModule({
      providers: [
        NetworkService,
        { provide: WebSocketService, useFactory: () => mockWebSocketService },
        { provide: APIService, useFactory: () => mockAPIService },
        { provide: CookieService, useFactory: () => mockCookieService }
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
    it('should connect successfully with existing token', async () => {
      // Setup mock to return a token so initGuestAuth isn't called
      mockCookieService.get.and.returnValue('existing-token');
      
      await service.connect();
      expect(mockWebSocketService.ready).toBe(true);
      expect(mockWebSocketService.authToken).toBe('existing-token');
    });

    it('should initialize guest auth when no token exists', async () => {
      // Setup mock to return null initially, then the new token after auth
      let callCount = 0;
      mockCookieService.get.and.callFake((_name: string) => {
        callCount++;
        if (callCount <= 2) {
          return null; // First two calls - no token exists yet
        }
        return 'new-token'; // Third call - get the token after initGuestAuth sets it
      });
      
      const mockAuthResponse = {
        token: 'new-token',
        elo: 0
      };
      mockAPIService.authenticateGuest.and.returnValue(Promise.resolve(mockAuthResponse));

      await service.connect();
      
      expect(mockAPIService.authenticateGuest).toHaveBeenCalledWith(undefined);
      expect(mockCookieService.set).toHaveBeenCalledWith(
        'evoku_guest_token',
        'new-token',
        604800
      );
      expect(mockWebSocketService.authToken).toBe('new-token');
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
      // Setup mock to return a token so initGuestAuth isn't called
      mockCookieService.get.and.returnValue('existing-token');
      
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
    describe('initGuestAuth', () => {
      it('should authenticate without existing token', async () => {
        const mockResponse = {
          token: 'new-test-token',
          elo: 0,
          userID: 'test-user-id'
        };

        mockCookieService.get.and.returnValue(null);
        mockAPIService.authenticateGuest.and.returnValue(Promise.resolve(mockResponse));

        const result = await service.initGuestAuth();

        expect(mockCookieService.get).toHaveBeenCalledWith('evoku_guest_token');
        expect(mockAPIService.authenticateGuest).toHaveBeenCalledWith(undefined);
        expect(mockCookieService.set).toHaveBeenCalledWith(
          'evoku_guest_token',
          'new-test-token',
          604800
        );
        expect(result).toEqual(mockResponse);
      });

      it('should authenticate with existing token', async () => {
        const existingToken = 'existing-test-token';
        const mockResponse = {
          token: 'new-test-token',
          elo: 1500,
          userID: 'test-user-id'
        };

        mockCookieService.get.and.returnValue(existingToken);
        mockAPIService.authenticateGuest.and.returnValue(Promise.resolve(mockResponse));

        const result = await service.initGuestAuth();

        expect(mockCookieService.get).toHaveBeenCalledWith('evoku_guest_token');
        expect(mockAPIService.authenticateGuest).toHaveBeenCalledWith(existingToken);
        expect(mockCookieService.set).toHaveBeenCalledWith(
          'evoku_guest_token',
          'new-test-token',
          604800
        );
        expect(result).toEqual(mockResponse);
      });

      it('should throw error on failed authentication', async () => {
        mockCookieService.get.and.returnValue(null);
        mockAPIService.authenticateGuest.and.returnValue(
          Promise.reject(new Error('Auth failed'))
        );

        spyOn(console, 'error');

        try {
          await service.initGuestAuth();
          fail('Expected initGuestAuth to throw an error');
        } catch (error) {
          expect((error as Error).message).toBe('Auth failed');
        }

        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('Packet subscription', () => {
    it('should emit data when action matches', done => {
      const testData = { someData: 'test' };
      const subscription = service.onPacket(SessionActions.HEARTBEAT).subscribe(data => {
        expect(data).toEqual(testData);
        done();
      });

      mockWebSocketService.packetSubject.next({ action: SessionActions.HEARTBEAT, ...testData });

      subscription.unsubscribe();
    });

    it('should not emit when action does not match', () => {
      let emitted = false;
      const subscription = service.onPacket(SessionActions.HEARTBEAT).subscribe(() => {
        emitted = true;
      });

      mockWebSocketService.packetSubject.next({ action: 'OTHER_ACTION', someData: 'test' });

      expect(emitted).toBe(false);

      subscription.unsubscribe();
    });

    it('should handle multiple packets with matching actions', done => {
      const emittedData: unknown[] = [];
      const subscription = service.onPacket(SessionActions.HEARTBEAT).subscribe(data => {
        emittedData.push(data);
        if (emittedData.length === 2) {
          expect(emittedData).toEqual([{ someData: 'first' }, { someData: 'second' }]);
          done();
        }
      });

      mockWebSocketService.packetSubject.next({
        action: SessionActions.HEARTBEAT,
        someData: 'first'
      });
      mockWebSocketService.packetSubject.next({
        action: SessionActions.HEARTBEAT,
        someData: 'second'
      });

      subscription.unsubscribe();
    });

    it('should unsubscribe properly', () => {
      let emitted = false;
      const subscription = service.onPacket(SessionActions.HEARTBEAT).subscribe(() => {
        emitted = true;
      });

      subscription.unsubscribe();

      mockWebSocketService.packetSubject.next({
        action: SessionActions.HEARTBEAT,
        someData: 'test'
      });

      expect(emitted).toBe(false);
    });
  });
});
