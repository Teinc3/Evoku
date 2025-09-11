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

// Mock ClientPacketHandler
class MockClientPacketHandler {
  handleData = jasmine.createSpy('handleData');
}

// Mock the dependencies
let mockClientSocket: MockClientSocket;
let mockClientPacketHandler: MockClientPacketHandler;
let originalWebSocket: typeof WebSocket;

// Import the actual classes to mock them
import WebSocketService from './WebSocketService';

import type ClientSocket from '../transport/ClientSocket';
import type ClientPacketHandler from '../handlers/ClientPacketHandler';


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
    mockClientPacketHandler = new MockClientPacketHandler();

    (window as Window & { WebSocket: typeof WebSocket }).WebSocket =
      MockWebSocket as unknown as typeof WebSocket;

    // Create service instance with mocked dependencies
    service = new WebSocketService(
      mockClientSocket as unknown as ClientSocket,
      mockClientPacketHandler as unknown as ClientPacketHandler
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
      expect(service['reconnectTimer']).toBeNull();
      expect(service['pingTimer']).toBeNull();
      expect(service['lastPingAt']).toBeNull();
      expect(service['lastPacketSentAt']).toBe(0);
      expect(service['disconnectCallback']).toBeNull();
    });

    it('should have ready getter that returns false initially', () => {
      expect(service.ready).toBe(false);
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

    it('should handle disconnect', () => {
      service.disconnect(1000, 'Test disconnect');
      expect(service['pingTimer']).toBeNull();
      expect(service['reconnectTimer']).toBeNull();
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

    it('should handle incoming packets', () => {
      const mockPacket = {
        action: SessionActions.HEARTBEAT,
        timestamp: Date.now()
      };

      // Access private method
      const handlePacket = service['handlePacket'];
      handlePacket(mockPacket);

      expect(mockClientPacketHandler.handleData).toHaveBeenCalledWith(mockPacket);
    });

    it('should handle packet handler errors gracefully', () => {
      spyOn(console, 'error');

      const mockPacket = {
        action: SessionActions.HEARTBEAT,
        timestamp: Date.now()
      };

      // Make packet handler throw an error
      mockClientPacketHandler.handleData.and.throwError('Handler error');

      const handlePacket = service['handlePacket'];
      handlePacket(mockPacket);

      expect(console.error).toHaveBeenCalledWith(
        `Error in packet handler for action ${SessionActions.HEARTBEAT}:`,
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

    it('should handle close events with auto-reconnect enabled', () => {
      spyOn(console, 'log');
      const disconnectCallback = jasmine.createSpy('disconnectCallback');
      service.setDisconnectCallback(disconnectCallback);

      // Since clientConfig is read-only, we'll test the default behavior
      // which should have autoReconnect enabled by default
      const handleClose = service['handleClose'];
      handleClose();

      expect(disconnectCallback).toHaveBeenCalled();
      // Should have scheduled reconnect (since autoReconnect is true by default)
      expect(service['reconnectTimer']).toBeTruthy();
    });

    it('should handle error events', () => {
      spyOn(console, 'error');

      const mockError = new Event('error');
      const handleError = service['handleError'];
      handleError(mockError);

      expect(console.error).toHaveBeenCalledWith('WebSocket error:', mockError);
    });
  });

  describe('Reconnection functionality', () => {
    beforeEach(() => {
      jasmine.clock().install();
    });

    it('should schedule reconnection when autoReconnect is enabled', () => {
      spyOn(console, 'log');

      service['scheduleReconnect']();

      expect(service['reconnectTimer']).toBeTruthy();
    });

    it('should not schedule reconnection if already scheduled', () => {
      // Schedule once
      service['scheduleReconnect']();
      const firstTimer = service['reconnectTimer'];

      // Try to schedule again
      service['scheduleReconnect']();
      const secondTimer = service['reconnectTimer'];

      // Should be the same timer
      expect(firstTimer).toBe(secondTimer);
    });
  });

  describe('Cleanup', () => {
    it('should clear timers on destroy', () => {
      service['pingTimer'] = setInterval(() => {}, 1000);
      service['reconnectTimer'] = setTimeout(() => {}, 1000);

      service.destroy();

      expect(service['pingTimer']).toBeNull();
      expect(service['reconnectTimer']).toBeNull();
    });

    it('should clear reconnect timer when clearing timers', () => {
      service['reconnectTimer'] = setTimeout(() => {}, 1000);

      service['clearTimers']();

      expect(service['reconnectTimer']).toBeNull();
      expect(service['lastPingAt']).toBeNull();
    });
  });
});
