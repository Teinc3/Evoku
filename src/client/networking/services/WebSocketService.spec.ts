// eslint-disable-next-line import/newline-after-import
import { fakeAsync } from '@angular/core/testing';

// eslint-disable-next-line import/newline-after-import
import '@shared/networking/packets';
 
// eslint-disable-next-line import/order
import SessionActions from '@shared/types/enums/actions/system/session';


class MockWebSocket {
  readyState: number = WebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  binaryType: string = 'arraybuffer';

  private eventListeners: { [key: string]: ((event: Event) => void)[] } = {};

  constructor() {
    // Start as CONNECTING, will be set to OPEN when connect() is called
  }

  addEventListener = jasmine.createSpy('addEventListener').and.callFake((
    type: string,
    listener: (event: Event) => void
  ) => {
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = [];
    }
    this.eventListeners[type].push(listener);
  });

  removeEventListener = jasmine.createSpy('removeEventListener').and.callFake((
    type: string,
    listener: (event: Event) => void
  ) => {
    if (this.eventListeners[type]) {
      const index = this.eventListeners[type].indexOf(listener);
      if (index > -1) {
        this.eventListeners[type].splice(index, 1);
      }
    }
  });

  send = jasmine.createSpy('send');
  close = jasmine.createSpy('close');

  // Simulate connection opening
  simulateOpen() {
    this.readyState = WebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
    // Also trigger addEventListener callbacks
    if (this.eventListeners['open']) {
      this.eventListeners['open'].forEach(listener => listener(new Event('open')));
    }
  }
}

// Mock ClientSocket - simplified version that doesn't create real WebSocket
class MockClientSocket {
  isOpen = false;
  readyState = 3; // CLOSED
  ws: MockWebSocket | null = null;
  io: unknown = null;
  url: string = 'ws://mock';
  private packetHandler: ((data: unknown) => void) | null = null;

  async connect(): Promise<void> {
    this.readyState = 1; // OPEN
    this.isOpen = true;
  }

  close(): void {
    this.readyState = 3; // CLOSED
    this.isOpen = false;
  }

  send = jasmine.createSpy('send').and.callFake(() => {
    // Mock successful send - don't throw errors
  });

  setListener(handler: (data: unknown) => void): void {
    this.packetHandler = handler;
  }

  onClose(_handler: (event: CloseEvent) => void): void {
    // Mock - do nothing
  }

  onError(_handler: (event: Event) => void): void {
    // Mock - do nothing
  }

  handleMessage = jasmine.createSpy('handleMessage');

  // Simulate receiving a packet
  simulatePacket(data: unknown): void {
    if (this.packetHandler) {
      this.packetHandler(data);
    }
  }
}

// Mock the dependencies
let mockClientSocket: MockClientSocket;
let originalWebSocket: typeof WebSocket;

// Import the actual classes to mock them
import WebSocketService from './WebSocketService';

import type ClientSocket from '../transport/ClientSocket';


describe('WebSocketService', () => {
  let service: WebSocketService;

  beforeAll(() => {
    // Store original constructors
    originalWebSocket = (window as Window & { WebSocket: typeof WebSocket }).WebSocket;
    // Mock Date.now() globally
    spyOn(Date, 'now').and.returnValue(1000);
  });

  afterAll(() => {
    // Restore original WebSocket
    (window as Window & { WebSocket: typeof WebSocket }).WebSocket = originalWebSocket;
    // Restore Date.now()
    (Date.now as jasmine.Spy).and.callThrough();
  });

  beforeEach(() => {
    // Create fresh mocks for each test
    mockClientSocket = new MockClientSocket();

    (window as Window & { WebSocket: typeof WebSocket }).WebSocket =
      MockWebSocket as unknown as typeof WebSocket;

    // Create service instance with mocked dependencies
    service = new WebSocketService(
      mockClientSocket as unknown as ClientSocket
    );
  });

  afterEach(() => {
    // Clean up
    service.destroy();
    jasmine.clock().uninstall();
  });

  describe('Basic functionality', () => {
    it('should create service instance', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with correct default values', () => {
      expect(service['pingTimer']).toBeNull();
      expect(service['lastPingAt']).toBeNull();
      expect(service['lastPacketSentAt']).toBe(0);
      expect(service['disconnectCallback']).toBeNull();
    });

    it('should have ready getter that returns false initially', () => {
      expect(service.ready).toBe(false);
    });

    it('should set auth token', () => {
      const testToken = 'test-auth-token';
      service.setAuthToken(testToken);
      expect(service['authToken']).toBe(testToken);
    });
  });

  describe('Connection management', () => {
    beforeEach(() => {
      jasmine.clock().install();
    });

    it('should connect successfully', fakeAsync(async () => {
      const connectPromise = service.connect();

      // Simulate WebSocket opening
      mockClientSocket.connect();

      await connectPromise;
      expect(service.ready).toBe(true);
    }));

    it('should send AUTH packet when connecting with auth token', fakeAsync(async () => {
      const testToken = 'test-auth-token';
      service.setAuthToken(testToken);
      
      spyOn(service, 'send');
      
      const connectPromise = service.connect();
      mockClientSocket.connect();
      await connectPromise;

      expect(service.send).toHaveBeenCalledWith(
        jasmine.any(Number), // SessionActions.AUTH
        jasmine.objectContaining({
          token: testToken,
          version: jasmine.any(String)
        })
      );
    }));

    it('should not send AUTH packet when connecting without auth token', fakeAsync(async () => {
      spyOn(service, 'send');
      
      const connectPromise = service.connect();
      mockClientSocket.connect();
      await connectPromise;

      expect(service.send).not.toHaveBeenCalled();
    }));

    it('should handle disconnect', () => {
      service.disconnect(1000, 'Test disconnect');
      expect(service['pingTimer']).toBeNull();
    });

    it('should set disconnect callback', () => {
      const callback = jasmine.createSpy('callback');
      service.setDisconnectCallback(callback);

      expect(service['disconnectCallback']).toBe(callback);
    });
  });

  describe('Message sending', () => {
    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(1000));
    });

    it('should throw error when sending while not ready', () => {
      expect(() => {
        service.send(SessionActions.HEARTBEAT, {});
      }).toThrowError('WebSocket is not connected');
    });

    it('should send messages when ready', fakeAsync(async () => {
      const connectPromise = service.connect();

      // Simulate WebSocket opening
      await mockClientSocket.connect();

      await connectPromise;
      service.send(SessionActions.HEARTBEAT, {});
      expect(service['lastPacketSentAt']).toBe(1000);
    }));

    it('should handle send errors gracefully', fakeAsync(async () => {
      const connectPromise = service.connect();

      // Simulate WebSocket opening
      await mockClientSocket.connect();

      await connectPromise;

      // Make socket.send throw an error
      mockClientSocket.send = jasmine.createSpy('send').and.throwError('Send failed');

      expect(() => {
        service.send(SessionActions.HEARTBEAT, {});
      }).toThrowError('Send failed');
    }));


  });

  describe('Heartbeat functionality', () => {
    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(1000));
    });

    it('should start heartbeat after connecting', fakeAsync(async () => {
      const connectPromise = service.connect();

      // Simulate WebSocket opening
      await mockClientSocket.connect();

      await connectPromise;
      expect(service['pingTimer']).toBeTruthy();
    }));

    it('should send heartbeat after 15 seconds of inactivity', fakeAsync(async () => {
      const connectPromise = service.connect();

      // Simulate WebSocket opening
      await mockClientSocket.connect();

      await connectPromise;

      // Set last packet time to 15 seconds ago
      service['lastPacketSentAt'] = 0;

      // Advance time to trigger heartbeat check
      jasmine.clock().tick(15000);

      // Should have sent heartbeat - Date.now() should return 16000 (1000 + 15000)
      expect(service['lastPingAt']).toBe(16000);
    }));

    it('should not send heartbeat when not ready', fakeAsync(async () => {
      const connectPromise = service.connect();
      await mockClientSocket.connect();
      await connectPromise;

      // Disconnect to make socket not ready
      service.disconnect();

      // Set last packet time to 15 seconds ago
      service['lastPacketSentAt'] = 0;

      // Advance time to trigger heartbeat check
      jasmine.clock().tick(15000);

      // Should not have sent heartbeat since not ready
      expect(service['lastPingAt']).toBeNull();
    }));

    it('should clear existing ping timer when starting heartbeat', fakeAsync(async () => {
      // Start with an existing timer
      service['pingTimer'] = setInterval(() => {}, 1000);

      const connectPromise = service.connect();
      await mockClientSocket.connect();
      await connectPromise;

      // The old timer should have been cleared and a new one set
      expect(service['pingTimer']).toBeTruthy();
    }));
  });

  describe('Event handling', () => {
    beforeEach(async () => {
      jasmine.clock().install();
      const connectPromise = service.connect();
      await mockClientSocket.connect();
      await connectPromise;
    });

    it('should broadcast incoming packets via Subject', done => {
      const mockPacket = {
        action: SessionActions.HEARTBEAT,
        timestamp: Date.now()
      };

      // Subscribe to packet stream
      service.getPacketStream().subscribe(packet => {
        expect(packet.action).toBe(SessionActions.HEARTBEAT);
        expect(packet.data).toEqual({ timestamp: jasmine.any(Number) });
        done();
      });

      // Access private method and trigger packet
      const handlePacket = service['handlePacket'];
      handlePacket(mockPacket);
    });

    it('should handle broadcast errors gracefully', () => {
      spyOn(console, 'error');

      const mockPacket = {
        action: SessionActions.HEARTBEAT,
        timestamp: Date.now()
      };

      // Spy on the subject's next method to throw an error
      spyOn(service['packetSubject'], 'next').and.throwError('Broadcast error');

      const handlePacket = service['handlePacket'];
      handlePacket(mockPacket);

      expect(console.error).toHaveBeenCalledWith(
        `Error broadcasting packet for action ${SessionActions.HEARTBEAT}:`,
        jasmine.any(Error)
      );
    });

    it('should handle close events', () => {
      spyOn(console, 'log');
      const disconnectCallback = jasmine.createSpy('disconnectCallback');
      service.setDisconnectCallback(disconnectCallback);

      const handleClose = service['handleClose'];
      handleClose();

      expect(disconnectCallback).toHaveBeenCalled();
    });

    it('should handle close events', () => {
      const disconnectCallback = jasmine.createSpy('disconnectCallback');
      service.setDisconnectCallback(disconnectCallback);

      const handleClose = service['handleClose'];
      handleClose();

      expect(disconnectCallback).toHaveBeenCalled();
    });

    it('should handle error events', () => {
      spyOn(console, 'error');

      const mockError = new Event('error');
      const handleError = service['handleError'];
      handleError(mockError);

      expect(console.error).toHaveBeenCalledWith('WebSocket error:', mockError);
    });
  });

  describe('Cleanup', () => {
    it('should clear timers and complete subject on destroy', () => {
      service['pingTimer'] = setInterval(() => {}, 1000);
      const completeSpy = spyOn(service['packetSubject'], 'complete');

      service.destroy();

      expect(service['pingTimer']).toBeNull();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should clear ping timer when clearing timers', () => {
      service['pingTimer'] = setInterval(() => {}, 1000);

      service['clearTimers']();

      expect(service['pingTimer']).toBeNull();
      expect(service['lastPingAt']).toBeNull();
    });
  });

  describe('Packet subscription', () => {
    it('should provide packet stream', done => {
      const stream = service.getPacketStream();
      expect(stream).toBeDefined();

      stream.subscribe(packet => {
        expect(packet.action).toBe(SessionActions.HEARTBEAT);
        done();
      });

      // Trigger a packet
      service['packetSubject'].next({
        action: SessionActions.HEARTBEAT,
        data: {}
      });
    });

    it('should filter packets by action type', done => {
      const heartbeatStream = service.onPacket(SessionActions.HEARTBEAT);

      heartbeatStream.subscribe(data => {
        expect(data).toEqual({ timestamp: 123 });
        done();
      });

      // Send different action types
      service['packetSubject'].next({
        action: SessionActions.AUTH,
        data: { token: 'test', version: '1.0.0' }
      });

      service['packetSubject'].next({
        action: SessionActions.HEARTBEAT,
        data: { timestamp: 123 }
      });
    });
  });
});
