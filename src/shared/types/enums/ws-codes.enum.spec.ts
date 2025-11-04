import WSCloseCode from './ws-codes.enum';


describe('WSCloseCode', () => {
  describe('Standard RFC 6455 codes', () => {
    it('should have correct values for standard close codes', () => {
      expect(WSCloseCode.NORMAL_CLOSURE).toBe(1000);
      expect(WSCloseCode.GOING_AWAY).toBe(1001);
      expect(WSCloseCode.PROTOCOL_ERROR).toBe(1002);
      expect(WSCloseCode.UNSUPPORTED_DATA).toBe(1003);
      expect(WSCloseCode.NO_STATUS_RECEIVED).toBe(1005);
      expect(WSCloseCode.ABNORMAL_CLOSURE).toBe(1006);
      expect(WSCloseCode.INVALID_FRAME_PAYLOAD).toBe(1007);
      expect(WSCloseCode.POLICY_VIOLATION).toBe(1008);
      expect(WSCloseCode.MESSAGE_TOO_BIG).toBe(1009);
      expect(WSCloseCode.MANDATORY_EXTENSION).toBe(1010);
      expect(WSCloseCode.INTERNAL_ERROR).toBe(1011);
      expect(WSCloseCode.SERVICE_RESTART).toBe(1012);
      expect(WSCloseCode.TRY_AGAIN_LATER).toBe(1013);
      expect(WSCloseCode.BAD_GATEWAY).toBe(1014);
      expect(WSCloseCode.TLS_HANDSHAKE_FAILED).toBe(1015);
    });
  });

  describe('Custom application codes', () => {
    it('should have values in the 4000-4999 range', () => {
      expect(WSCloseCode.AUTH_TIMEOUT).toBe(4000);
      expect(WSCloseCode.AUTH_FAILED).toBe(4001);
      expect(WSCloseCode.AUTH_TOKEN_EXPIRED).toBe(4002);
      expect(WSCloseCode.AUTH_QUEUE_OVERFLOW).toBe(4003);
      expect(WSCloseCode.INVALID_PACKET).toBe(4004);
      expect(WSCloseCode.RATE_LIMIT_EXCEEDED).toBe(4005);
      expect(WSCloseCode.VERSION_MISMATCH).toBe(4006);
      expect(WSCloseCode.SERVER_SHUTDOWN).toBe(4007);
      expect(WSCloseCode.DUPLICATE_SESSION).toBe(4008);
    });

    it('should not conflict with standard codes', () => {
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
        expect(code).toBeGreaterThanOrEqual(4000);
        expect(code).toBeLessThan(5000);
      });
    });
  });

  describe('Enum completeness', () => {
    it('should have all custom codes defined', () => {
      const customCodeNames = [
        'AUTH_TIMEOUT',
        'AUTH_FAILED',
        'AUTH_TOKEN_EXPIRED',
        'AUTH_QUEUE_OVERFLOW',
        'INVALID_PACKET',
        'RATE_LIMIT_EXCEEDED',
        'VERSION_MISMATCH',
        'SERVER_SHUTDOWN',
        'DUPLICATE_SESSION',
      ];

      customCodeNames.forEach(name => {
        expect(WSCloseCode[name as keyof typeof WSCloseCode]).toBeDefined();
      });
    });
  });
});
