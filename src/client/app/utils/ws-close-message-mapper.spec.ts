import WSCloseCode from '@shared/types/enums/ws-codes.enum';
import WSCloseMessageMapper from './ws-close-message-mapper';


describe('WSCloseMessageMapper', () => {
  describe('getMessage', () => {
    it('should return correct message for standard codes', () => {
      const message = WSCloseMessageMapper.getMessage(WSCloseCode.NORMAL_CLOSURE);
      expect(message).toBe('Connection closed normally');
    });

    it('should return correct message for custom codes', () => {
      const message = WSCloseMessageMapper.getMessage(WSCloseCode.AUTH_TIMEOUT);
      expect(message).toBe('Authentication timeout - please reconnect');
    });

    it('should append server reason when provided', () => {
      const message = WSCloseMessageMapper.getMessage(
        WSCloseCode.AUTH_FAILED,
        'Invalid token'
      );
      expect(message).toBe('Authentication failed - invalid credentials: Invalid token');
    });

    it('should return default message for unknown codes', () => {
      const message = WSCloseMessageMapper.getMessage(9999);
      expect(message).toBe('Connection closed with code 9999');
    });

    it('should use server reason only for unknown codes if provided', () => {
      const message = WSCloseMessageMapper.getMessage(9999, 'Custom reason');
      expect(message).toBe('Custom reason');
    });
  });

  describe('Coverage for all codes', () => {
    it('should have messages for all standard codes', () => {
      const standardCodes = [
        WSCloseCode.NORMAL_CLOSURE,
        WSCloseCode.GOING_AWAY,
        WSCloseCode.PROTOCOL_ERROR,
        WSCloseCode.UNSUPPORTED_DATA,
        WSCloseCode.NO_STATUS_RECEIVED,
        WSCloseCode.ABNORMAL_CLOSURE,
        WSCloseCode.INVALID_FRAME_PAYLOAD,
        WSCloseCode.POLICY_VIOLATION,
        WSCloseCode.MESSAGE_TOO_BIG,
        WSCloseCode.MANDATORY_EXTENSION,
        WSCloseCode.INTERNAL_ERROR,
        WSCloseCode.SERVICE_RESTART,
        WSCloseCode.TRY_AGAIN_LATER,
        WSCloseCode.BAD_GATEWAY,
        WSCloseCode.TLS_HANDSHAKE_FAILED,
      ];

      standardCodes.forEach(code => {
        const message = WSCloseMessageMapper.getMessage(code);
        expect(message).not.toContain(`code ${code}`);
      });
    });

    it('should have messages for all custom codes', () => {
      const customCodes = [
        WSCloseCode.AUTH_TIMEOUT,
        WSCloseCode.AUTH_FAILED,
        WSCloseCode.AUTH_TOKEN_EXPIRED,
        WSCloseCode.AUTH_QUEUE_OVERFLOW,
        WSCloseCode.INVALID_PACKET,
        WSCloseCode.RATE_LIMIT_EXCEEDED,
        WSCloseCode.VERSION_MISMATCH,
        WSCloseCode.SERVER_SHUTDOWN,
        WSCloseCode.DUPLICATE_SESSION,
      ];

      customCodes.forEach(code => {
        const message = WSCloseMessageMapper.getMessage(code);
        expect(message).not.toContain(`code ${code}`);
      });
    });
  });
});
