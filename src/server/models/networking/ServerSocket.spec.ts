import WebSocket from 'ws';

import ProtocolActions from '@shared/types/enums/actions/match/protocol';
import ServerSocket from './ServerSocket';


// Mock WebSocket
const mockWebSocket = () => ({
  send: jest.fn(),
  close: jest.fn(),
  removeAllListeners: jest.fn(),
  on: jest.fn(),
  readyState: WebSocket.OPEN as number,
  OPEN: WebSocket.OPEN,
  CLOSED: WebSocket.CLOSED,
  CONNECTING: WebSocket.CONNECTING,
  CLOSING: WebSocket.CLOSING
});

// Mock PacketIO
jest.mock('@shared/networking/utils/PacketIO', () => {
  return jest.fn().mockImplementation(() => ({
    encodePacket: jest.fn((action, data) => {
      // Return a mock buffer that represents encoded packet
      const mockBuffer = Buffer.from(JSON.stringify({ action, data }));
      return mockBuffer;
    }),
    decodePacket: jest.fn(buffer => {
      // Decode mock buffer back to action object
      const data = JSON.parse(Buffer.from(buffer).toString());
      return {
        type: data.action,
        payload: data.data
      };
    })
  }));
});

describe('ServerSocket', () => {
  let mockWs: ReturnType<typeof mockWebSocket>;
  let serverSocket: ServerSocket;
  let mockPacketIO: {
    encodePacket: jest.Mock;
    decodePacket: jest.Mock;
  };

  beforeEach(() => {
    mockWs = mockWebSocket();
    serverSocket = new ServerSocket(
      mockWs as unknown as WebSocket,
      jest.fn(),
      jest.fn()
    );
    // Get the mocked PacketIO instance
    mockPacketIO = (serverSocket as unknown as { packetIO: typeof mockPacketIO }).packetIO;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create ServerSocket with WebSocket', () => {
      expect(serverSocket).toBeInstanceOf(ServerSocket);
      expect(mockPacketIO).toBeDefined();
    });
  });

  describe('send', () => {
    it('should encode and send packet through WebSocket', () => {
      const action = ProtocolActions.PING;
      const data = { serverTime: 1000, clientPing: 50 };

      serverSocket.send(action, data);

      expect(mockPacketIO.encodePacket).toHaveBeenCalledWith(action, data);
      expect(mockWs.send).toHaveBeenCalledWith(expect.any(Buffer));
    });

    it('should handle different action types', () => {
      const testCases = [
        { action: ProtocolActions.PING, data: { serverTime: 1000, clientPing: 50 } },
        { action: ProtocolActions.PONG, data: { clientTime: 1000, serverTime: 1050 } }
      ];

      testCases.forEach(({ action, data }) => {
        serverSocket.send(action, data);
        expect(mockPacketIO.encodePacket).toHaveBeenCalledWith(action, data);
      });

      expect(mockWs.send).toHaveBeenCalledTimes(testCases.length);
    });
  });

  describe('setListener', () => {
    let handler: jest.Mock;

    beforeEach(() => {
      handler = jest.fn();
    });

    it('should remove existing listeners before adding new one', () => {
      serverSocket.setListener(handler);

      expect(mockWs.removeAllListeners).toHaveBeenCalledWith('message');
      expect(mockWs.on).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should handle binary messages correctly', () => {
      serverSocket.setListener(handler);

      // Get the message handler that was registered
      const messageHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')[1];

      // Simulate binary message
      const mockData = { action: ProtocolActions.PING, data: { serverTime: 1000, clientPing: 50 } };
      const mockBuffer = Buffer.from(JSON.stringify(mockData));
      
      messageHandler(mockBuffer, true); // isBinary = true

      expect(mockPacketIO.decodePacket).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith({
        type: ProtocolActions.PING,
        payload: { serverTime: 1000, clientPing: 50 }
      });
    });

    it('should close connection for non-binary messages', () => {
      const closeSpy = jest.spyOn(serverSocket, 'close');
      serverSocket.setListener(handler);

      const messageHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')[1];

      // Simulate text message
      messageHandler('text message', false); // isBinary = false

      expect(closeSpy).toHaveBeenCalled();
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle ArrayBuffer from different data types', () => {
      serverSocket.setListener(handler);

      const messageHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')[1];

      // Test with regular ArrayBuffer
      const arrayBuffer = new ArrayBuffer(10);
      messageHandler(arrayBuffer, true);

      expect(mockPacketIO.decodePacket).toHaveBeenCalledWith(arrayBuffer);
    });

    it('should handle Buffer with offset and byteLength', () => {
      serverSocket.setListener(handler);

      const messageHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')[1];

      // Create a Buffer with specific offset/length
      const originalBuffer = Buffer.alloc(20);
      const slicedBuffer = originalBuffer.subarray(5, 15);
      
      messageHandler(slicedBuffer, true);

      expect(mockPacketIO.decodePacket).toHaveBeenCalled();
      // Verify it creates proper ArrayBuffer slice
      const calledWith = mockPacketIO.decodePacket.mock.calls[0][0];
      expect(calledWith).toBeInstanceOf(ArrayBuffer);
    });

    it('should handle decode errors gracefully', () => {
      mockPacketIO.decodePacket.mockImplementation(() => {
        throw new Error('Decode error');
      });

      serverSocket.setListener(handler);

      const messageHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')[1];
      const mockBuffer = Buffer.from('invalid data');

      // Should not throw
      expect(() => {
        messageHandler(mockBuffer, true);
      }).not.toThrow();

      expect(handler).not.toHaveBeenCalled();
    });

    it('should prevent duplicate listeners', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      serverSocket.setListener(handler1);
      serverSocket.setListener(handler2);

      expect(mockWs.removeAllListeners).toHaveBeenCalledTimes(2);
      expect(mockWs.on).toHaveBeenCalledTimes(4); // 2 from constructor + 2 from setListener
    });
  });

  describe('close', () => {
    it('should remove all listeners and close WebSocket', () => {
      serverSocket.close();

      expect(mockWs.removeAllListeners).toHaveBeenCalled();
      expect(mockWs.close).toHaveBeenCalled();
    });

    it('should only close if WebSocket is in OPEN state', () => {
      (mockWs as unknown as { readyState: number }).readyState = WebSocket.OPEN;
      serverSocket.close();
      expect(mockWs.close).toHaveBeenCalled();

      jest.clearAllMocks();

      (mockWs as unknown as { readyState: number }).readyState = WebSocket.CLOSED;
      serverSocket.close();
      expect(mockWs.close).not.toHaveBeenCalled();
      expect(mockWs.removeAllListeners).toHaveBeenCalled(); // Still removes listeners
    });

    it('should handle different ready states', () => {
      const states = [WebSocket.CONNECTING, WebSocket.CLOSING, WebSocket.CLOSED];

      states.forEach(state => {
        jest.clearAllMocks();
        (mockWs as unknown as { readyState: number }).readyState = state;
        
        serverSocket.close();
        
        expect(mockWs.removeAllListeners).toHaveBeenCalled();
        expect(mockWs.close).not.toHaveBeenCalled();
      });
    });
  });

  describe('readyState getter', () => {
    it('should return WebSocket ready state', () => {
      const states = [
        WebSocket.CONNECTING,
        WebSocket.OPEN,
        WebSocket.CLOSING,
        WebSocket.CLOSED
      ];

      states.forEach(state => {
        (mockWs as unknown as { readyState: number }).readyState = state;
        expect(serverSocket.readyState).toBe(state);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete send and receive cycle', () => {
      const handler = jest.fn();
      serverSocket.setListener(handler);

      // Send a packet
      const outgoingAction = ProtocolActions.PING;
      const outgoingData = { serverTime: 1000, clientPing: 50 };
      serverSocket.send(outgoingAction, outgoingData);

      expect(mockWs.send).toHaveBeenCalled();

      // Simulate receiving a response
      const messageHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')[1];
      const responseData = {
        action: ProtocolActions.PONG,
        data: { clientTime: 1000, serverTime: 1050 }
      };
      const responseBuffer = Buffer.from(JSON.stringify(responseData));

      messageHandler(responseBuffer, true);

      expect(handler).toHaveBeenCalledWith({
        type: ProtocolActions.PONG,
        payload: { clientTime: 1000, serverTime: 1050 }
      });
    });

    it('should handle rapid multiple operations', () => {
      const handler = jest.fn();
      serverSocket.setListener(handler);

      // Send multiple packets rapidly
      for (let i = 0; i < 5; i++) {
        serverSocket.send(ProtocolActions.PING, { serverTime: 1000 + i, clientPing: 50 });
      }

      expect(mockWs.send).toHaveBeenCalledTimes(5);
      expect(mockPacketIO.encodePacket).toHaveBeenCalledTimes(5);
    });

    it('should handle error scenarios in realistic workflow', () => {
      const handler = jest.fn();
      
      // Setup listener
      serverSocket.setListener(handler);
      
      // Simulate corrupted packet
      const messageHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')[1];
      mockPacketIO.decodePacket.mockImplementationOnce(() => {
        throw new Error('Corrupted packet');
      });
      
      const corruptedBuffer = Buffer.from('corrupted data');
      messageHandler(corruptedBuffer, true);
      
      // Should not crash and should not call handler
      expect(handler).not.toHaveBeenCalled();
      
      // Should still be able to process valid packets after error
      mockPacketIO.decodePacket.mockImplementationOnce((buffer: ArrayBuffer) => {
        const data = JSON.parse(Buffer.from(buffer).toString());
        return { type: data.action, payload: data.data };
      });
      
      const validData = {
        action: ProtocolActions.PING,
        data: { serverTime: 1000, clientPing: 50 }
      };
      const validBuffer = Buffer.from(JSON.stringify(validData));
      messageHandler(validBuffer, true);
      
      expect(handler).toHaveBeenCalledWith({
        type: ProtocolActions.PING,
        payload: { serverTime: 1000, clientPing: 50 }
      });
    });

    it('should properly cleanup resources on close', () => {
      const handler = jest.fn();
      serverSocket.setListener(handler);

      // Verify setup
      expect(mockWs.on).toHaveBeenCalled();

      // Close and verify cleanup
      serverSocket.close();

      expect(mockWs.removeAllListeners).toHaveBeenCalled();
      expect(mockWs.close).toHaveBeenCalled();

      // Subsequent operations should not cause issues
      expect(() => {
        serverSocket.close(); // Double close
      }).not.toThrow();
    });
  });
});