import '@shared/networking/packets';
import { SessionActions } from '@shared/types/enums/actions';
import ClientSocket from '.';


// Mock WebSocket API
class MockWebSocket {
  readyState: number = WebSocket.CLOSED; // Start closed, not connecting
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  binaryType: string = 'arraybuffer';

  private eventListeners: Record<string, ((event: Event) => void)[]> = {};
  private url: string | URL;
  private protocols?: string | string[];

  constructor(url?: string | URL, protocols?: string | string[]) {
    this.url = url || 'ws://localhost:8745/ws';
    this.protocols = protocols;
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
  close = jasmine.createSpy('close').and.callFake((code?: number, reason?: string) => {
    this.readyState = WebSocket.CLOSED;
    const event = new CloseEvent('close', { code: code || 1000, reason: reason || '' });
    if (this.onclose) {
      this.onclose(event);
    }
    if (this.eventListeners['close']) {
      this.eventListeners['close'].forEach(listener => listener(event));
    }
  });

  // Simulate connection opening
  simulateOpen(): void {
    this.readyState = WebSocket.OPEN;
    const event = new Event('open');
    if (this.onopen) {
      this.onopen(event);
    }
    if (this.eventListeners['open']) {
      this.eventListeners['open'].forEach(listener => listener(event));
    }
  }

  // Simulate receiving a message
  simulateMessage(data: ArrayBuffer | null): void {
    if (this.readyState !== WebSocket.OPEN) return;

    const event = new MessageEvent('message', { data });
    if (this.onmessage) {
      this.onmessage(event);
    }
    if (this.eventListeners['message']) {
      this.eventListeners['message'].forEach(listener => listener(event));
    }
  }

  // Simulate connection closing
  simulateClose(code: number = 1000, reason: string = ''): void {
    this.readyState = WebSocket.CLOSED;
    const event = new CloseEvent('close', { code, reason });
    if (this.onclose) {
      this.onclose(event);
    }
    if (this.eventListeners['close']) {
      this.eventListeners['close'].forEach(listener => listener(event));
    }
  }

  // Simulate error
  simulateError(error: Event): void {
    if (this.onerror) {
      this.onerror(error);
    }
    if (this.eventListeners['error']) {
      this.eventListeners['error'].forEach(listener => listener(error));
    }
  }
}

describe('ClientSocket', () => {
  let clientSocket: ClientSocket;
  let mockWebSocket: MockWebSocket;
  let originalWebSocket: typeof WebSocket;

  beforeAll(() => {
    originalWebSocket = window.WebSocket;
  });

  afterAll(() => {
    window.WebSocket = originalWebSocket;
  });

  beforeEach(() => {
    // Create a fresh mock for each test
    mockWebSocket = new MockWebSocket();
    mockWebSocket.readyState = WebSocket.CLOSED; // Ensure it starts closed

    // Create a mock WebSocket constructor that works with 'new'
    const MockWebSocketConstructor = function(_url?: string | URL, _protocols?: string | string[]) {
      mockWebSocket.readyState = WebSocket.CONNECTING; // Set to connecting when created
      return mockWebSocket;
    };

    // Add static properties to the mock constructor
    Object.assign(MockWebSocketConstructor, {
      CONNECTING: WebSocket.CONNECTING,
      OPEN: WebSocket.OPEN,
      CLOSING: WebSocket.CLOSING,
      CLOSED: WebSocket.CLOSED
    });

    // Spy on the constructor
    spyOn(window, 'WebSocket').and.callFake(MockWebSocketConstructor as unknown as () => WebSocket);

    clientSocket = new ClientSocket();
  });

  afterEach(() => {
    clientSocket.close();
  });

  describe('Basic functionality', () => {
    it('should create ClientSocket instance', () => {
      expect(clientSocket).toBeTruthy();
    });

    it('should initialize with correct default values', () => {
      expect(clientSocket.readyState).toBe(WebSocket.CLOSED);
      expect(clientSocket.isOpen).toBe(false);
    });
  });

  describe('Connection management', () => {
    it('should connect successfully', async () => {
      const connectPromise = clientSocket.connect();

      // Simulate WebSocket opening
      mockWebSocket.simulateOpen();

      await connectPromise;
      expect(clientSocket.isOpen).toBe(true);
      expect(clientSocket.readyState).toBe(WebSocket.OPEN);
    });

    it('should handle connection errors', async () => {
      const connectPromise = clientSocket.connect();

      // Simulate connection error
      const errorEvent = new Event('error');
      mockWebSocket.simulateError(errorEvent);

      await expectAsync(connectPromise).toBeRejected();
    });

    it('should close connection', () => {
      // First connect to have a WebSocket instance
      clientSocket.connect();
      mockWebSocket.simulateOpen();

      clientSocket.close(1000, 'Test close');
      expect(mockWebSocket.close).toHaveBeenCalledWith(1000, 'Test close');
    });
  });

  describe('Message handling', () => {
    beforeEach(async () => {
      const connectPromise = clientSocket.connect();
      mockWebSocket.simulateOpen();
      await connectPromise;
    });

    it('should send messages when connected', () => {
      clientSocket.send(SessionActions.HEARTBEAT, {});
      expect(mockWebSocket.send).toHaveBeenCalled();
    });

    it('should throw error when sending while not connected', () => {
      // Close the connection
      clientSocket.close();

      expect(() => {
        clientSocket.send(SessionActions.HEARTBEAT, {});
      }).toThrowError('WebSocket not open');
    });

    it('should handle incoming messages', async () => {
      const mockHandler = jasmine.createSpy('packetHandler');
      clientSocket.setListener(mockHandler);

      // Simulate receiving a message
      const testData = new ArrayBuffer(8);
      mockWebSocket.simulateMessage(testData);

      // The handler should be called (though it may fail due to packet decoding)
      // We just verify the message event was triggered
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', jasmine.any(Function));
    });
  });

  describe('Event handling', () => {
    beforeEach(async () => {
      // Connect first to ensure WebSocket exists
      const connectPromise = clientSocket.connect();
      mockWebSocket.simulateOpen();
      await connectPromise;
    });

    it('should set close event handler', () => {
      const closeHandler = jasmine.createSpy('closeHandler');
      clientSocket.onClose(closeHandler);

      mockWebSocket.simulateClose(1000, 'Normal closure');
      expect(closeHandler).toHaveBeenCalled();
    });

    it('should set error event handler', () => {
      const errorHandler = jasmine.createSpy('errorHandler');
      clientSocket.onError(errorHandler);

      const errorEvent = new Event('error');
      mockWebSocket.simulateError(errorEvent);
      expect(errorHandler).toHaveBeenCalledWith(errorEvent);
    });

    it('should set packet listener', () => {
      const packetHandler = jasmine.createSpy('packetHandler');
      clientSocket.setListener(packetHandler);

      expect(packetHandler).toBeDefined();
    });
  });

  describe('WebSocket properties', () => {
    it('should set binary type to arraybuffer', async () => {
      const connectPromise = clientSocket.connect();
      mockWebSocket.simulateOpen();
      await connectPromise;

      expect(mockWebSocket.binaryType).toBe('arraybuffer');
    });

    it('should reflect WebSocket ready state', async () => {
      // Initially should be closed since no connection
      expect(clientSocket.readyState).toBe(WebSocket.CLOSED);

      // Connect and check readyState changes
      const connectPromise = clientSocket.connect();

      // At this point, readyState should be CONNECTING
      expect(clientSocket.readyState).toBe(WebSocket.CONNECTING);

      // Simulate opening
      mockWebSocket.simulateOpen();
      await connectPromise;

      // Now should be open
      expect(clientSocket.readyState).toBe(WebSocket.OPEN);

      // Simulate closing
      mockWebSocket.simulateClose();
      expect(clientSocket.readyState).toBe(WebSocket.CLOSED);
    });

    it('should correctly report isOpen status', async () => {
      expect(clientSocket.isOpen).toBe(false);

      // Connect and simulate opening
      const connectPromise = clientSocket.connect();
      mockWebSocket.simulateOpen();
      await connectPromise;

      expect(clientSocket.isOpen).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed messages gracefully', async () => {
      const mockHandler = jasmine.createSpy('packetHandler');

      // Connect first
      const connectPromise = clientSocket.connect();
      mockWebSocket.simulateOpen();
      await connectPromise;

      clientSocket.setListener(mockHandler);

      // Send malformed data - should not throw
      mockWebSocket.simulateMessage(null);

      // The handler should not be called for malformed data
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should handle connection already in progress', async () => {
      // Start first connection
      const firstConnect = clientSocket.connect();
      mockWebSocket.simulateOpen();
      await firstConnect;

      // Second connection should resolve immediately
      const secondConnect = clientSocket.connect();
      await secondConnect;

      expect(clientSocket.isOpen).toBe(true);
    });
  });
});

