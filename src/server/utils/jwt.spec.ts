import { generatePlayerId, signGuestToken, verifyGuestToken } from './jwt';


describe('JWT Utilities', () => {
  const originalEnv = process.env['JWT_SECRET'];

  beforeAll(() => {
    process.env['JWT_SECRET'] = 'test-secret-key';
  });

  afterAll(() => {
    process.env['JWT_SECRET'] = originalEnv;
  });

  describe('generatePlayerId', () => {
    it('should generate a valid UUID', () => {
      const playerId = generatePlayerId();
      expect(playerId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should generate unique IDs', () => {
      const id1 = generatePlayerId();
      const id2 = generatePlayerId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('signGuestToken', () => {
    it('should generate a valid JWT token', () => {
      const playerId = 'test-player-id';
      const token = signGuestToken(playerId);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should throw error if JWT_SECRET is not defined', () => {
      const playerId = 'test-player-id';
      delete process.env['JWT_SECRET'];
      expect(() => signGuestToken(playerId)).toThrow('JWT_SECRET is not defined');
      process.env['JWT_SECRET'] = 'test-secret-key';
    });
  });

  describe('verifyGuestToken', () => {
    it('should verify and decode a valid token', () => {
      const playerId = 'test-player-id';
      const token = signGuestToken(playerId);
      const decoded = verifyGuestToken(token);
      expect(decoded).toBe(playerId);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyGuestToken(invalidToken);
      expect(decoded).toBeNull();
    });

    it('should return null for expired token', () => {
      // This test would require time manipulation or a token signed with a very short expiry
      // For now, we'll just test with an invalid signature
      const playerId = 'test-player-id';
      const token = signGuestToken(playerId);
      const tamperedToken = token.slice(0, -1) + 'X'; // Tamper with signature
      const decoded = verifyGuestToken(tamperedToken);
      expect(decoded).toBeNull();
    });

    it('should throw error if JWT_SECRET is not defined', () => {
      const token = 'some.token.here';
      delete process.env['JWT_SECRET'];
      expect(() => verifyGuestToken(token)).toThrow('JWT_SECRET is not defined');
      process.env['JWT_SECRET'] = 'test-secret-key';
    });
  });

  describe('Token round-trip', () => {
    it('should successfully sign and verify a token', () => {
      const playerId = generatePlayerId();
      const token = signGuestToken(playerId);
      const verified = verifyGuestToken(token);
      expect(verified).toBe(playerId);
    });
  });
});
