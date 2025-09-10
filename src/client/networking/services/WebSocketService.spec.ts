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
import ClientSocket from '../transport/ClientSocket';
import ClientPacketHandler from '../handlers/ClientPacketHandler';
import WebSocketService from './WebSocketService';


describe('WebSocketService', () => {
  let service: WebSocketService;
  let _originalClientSocket: typeof ClientSocket;
  let _originalClientPacketHandler: typeof ClientPacketHandler;

  beforeAll(() => {
    // Store original constructors
    originalWebSocket = (window as Window & { WebSocket: typeof WebSocket }).WebSocket;
    _originalClientSocket = ClientSocket;
    _originalClientPacketHandler = ClientPacketHandler;
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
      expect(service['queue']).toEqual([]);
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

    it('should queue messages when not ready', () => {
      service.send(SessionActions.HEARTBEAT, {});
      expect(service['queue']).toEqual([[SessionActions.HEARTBEAT, {}]]);
    });

    it('should send messages when ready', fakeAsync(async () => {
      const connectPromise = service.connect();

      // Simulate WebSocket opening
      await mockClientSocket.connect();

      await connectPromise;
      service.send(SessionActions.HEARTBEAT, {});
      expect(service['lastPacketSentAt']).toBe(1000);
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
  });

  describe('Queue management', () => {
    it('should flush queue when becoming ready', fakeAsync(async () => {
      // Send message while offline
      service.send(SessionActions.HEARTBEAT, {});
      expect(service['queue']).toEqual([[SessionActions.HEARTBEAT, {}]]);

      // Connect and verify queue is flushed
      const connectPromise = service.connect();

      // Simulate WebSocket opening
      await mockClientSocket.connect();

      await connectPromise;
      expect(service['queue']).toEqual([]);
    }));
  });

  describe('Cleanup', () => {
    it('should clear timers and queue on destroy', () => {
      service['pingTimer'] = setInterval(() => {}, 1000);
      service['reconnectTimer'] = setTimeout(() => {}, 1000);
      service['queue'].push([SessionActions.HEARTBEAT, {}]);

      service.destroy();

      expect(service['pingTimer']).toBeNull();
      expect(service['reconnectTimer']).toBeNull();
      expect(service['queue']).toEqual([]);
    });
  });
});
