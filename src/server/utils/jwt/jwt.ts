import jwt from 'jsonwebtoken';
import crypto from 'crypto';


/**
 * JWT utility functions for guest authentication.
 * Handles token signing and verification for guest users.
 */

/**
 * Generate a unique player ID for a guest user
 */
export function generatePlayerId(): crypto.UUID {
  return crypto.randomUUID();
}

/**
 * Sign a JWT token for a guest player
 */
export function signGuestToken(playerID: string): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const payload = {
    playerID
  };

  return jwt.sign(payload, secret, {
    expiresIn: '7d' // Token expires in 7 days
  });
}

/**
 * Verify and decode a JWT token
 * Returns the player ID if valid, null otherwise
 */
export function verifyGuestToken(token: string): crypto.UUID | null {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    const decoded = jwt.verify(token, secret) as { playerID: crypto.UUID };
    return decoded.playerID;
  } catch {
    return null;
  }
}
