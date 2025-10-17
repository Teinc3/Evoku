import jwt from 'jsonwebtoken';
import crypto from 'crypto';


/**
 * JWT utility functions for guest authentication.
 * Handles token signing and verification for guest users.
 */

interface TokenPayload {
  playerId: string;
}

/**
 * Generate a unique player ID for a guest user
 */
export function generatePlayerId(): string {
  return crypto.randomUUID();
}

/**
 * Sign a JWT token for a guest player
 */
export function signGuestToken(playerId: string): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const payload: TokenPayload = {
    playerId
  };

  return jwt.sign(payload, secret, {
    expiresIn: '7d' // Token expires in 7 days
  });
}

/**
 * Verify and decode a JWT token
 * Returns the player ID if valid, null otherwise
 */
export function verifyGuestToken(token: string): string | null {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    return decoded.playerId;
  } catch {
    return null;
  }
}
