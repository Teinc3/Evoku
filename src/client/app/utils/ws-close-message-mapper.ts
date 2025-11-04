import WSCloseCode from '@shared/types/enums/ws-codes.enum';


/**
 * Maps WebSocket close codes to user-friendly error messages.
 * Provides meaningful feedback to users when disconnection occurs.
 */
export default class WSCloseMessageMapper {
  private static readonly messages: Map<number, string> = new Map([
    // Standard RFC 6455 codes
    [WSCloseCode.NORMAL_CLOSURE, 'Connection closed normally'],
    [WSCloseCode.GOING_AWAY, 'Server is going away or browser navigated away'],
    [WSCloseCode.PROTOCOL_ERROR, 'Protocol error occurred'],
    [WSCloseCode.UNSUPPORTED_DATA, 'Unsupported data type received'],
    [WSCloseCode.NO_STATUS_RECEIVED, 'No status code received'],
    [WSCloseCode.ABNORMAL_CLOSURE, 'Connection closed abnormally'],
    [WSCloseCode.INVALID_FRAME_PAYLOAD, 'Invalid message data received'],
    [WSCloseCode.POLICY_VIOLATION, 'Message violates policy'],
    [WSCloseCode.MESSAGE_TOO_BIG, 'Message too large to process'],
    [WSCloseCode.MANDATORY_EXTENSION, 'Required extension not negotiated'],
    [WSCloseCode.INTERNAL_ERROR, 'Internal server error occurred'],
    [WSCloseCode.SERVICE_RESTART, 'Server is restarting'],
    [WSCloseCode.TRY_AGAIN_LATER, 'Server temporarily unavailable'],
    [WSCloseCode.BAD_GATEWAY, 'Bad gateway response'],
    [WSCloseCode.TLS_HANDSHAKE_FAILED, 'TLS handshake failed'],
    
    // Custom application codes
    [WSCloseCode.AUTH_TIMEOUT, 'Authentication timeout - please reconnect'],
    [WSCloseCode.AUTH_FAILED, 'Authentication failed - invalid credentials'],
    [WSCloseCode.AUTH_TOKEN_EXPIRED, 'Session expired - please log in again'],
    [WSCloseCode.INVALID_PACKET, 'Invalid data sent to server'],
    [WSCloseCode.RATE_LIMIT_EXCEEDED, 'Too many requests - please slow down'],
    [WSCloseCode.VERSION_MISMATCH, 'Client version incompatible - please refresh'],
    [WSCloseCode.QUEUE_OVERFLOW, 'Too many pending requests'],
    [WSCloseCode.SERVER_SHUTDOWN, 'Server is shutting down'],
    [WSCloseCode.KICKED, 'You have been kicked from the server'],
    [WSCloseCode.BANNED, 'Your account has been banned'],
    [WSCloseCode.DUPLICATE_SESSION, 'Logged in from another location'],
  ]);

  /**
   * Get a user-friendly message for a WebSocket close code.
   * @param code The WebSocket close code
   * @param serverReason Optional reason string from the server
   * @returns A user-friendly error message
   */
  static getMessage(code: number, serverReason?: string): string {
    const message = this.messages.get(code);
    
    if (message) {
      return serverReason ? `${message}: ${serverReason}` : message;
    }
    
    // Default message for unknown codes
    return serverReason || `Connection closed with code ${code}`;
  }

  /**
   * Check if a close code indicates a client error.
   * @param code The WebSocket close code
   * @returns True if the code indicates a client-side issue
   */
  static isClientError(code: number): boolean {
    return code >= 4000 && code < 5000;
  }

  /**
   * Check if a close code indicates a server error.
   * @param code The WebSocket close code
   * @returns True if the code indicates a server-side issue
   */
  static isServerError(code: number): boolean {
    return (
      code === WSCloseCode.INTERNAL_ERROR ||
      code === WSCloseCode.SERVICE_RESTART ||
      code === WSCloseCode.TRY_AGAIN_LATER ||
      code === WSCloseCode.BAD_GATEWAY ||
      code === WSCloseCode.SERVER_SHUTDOWN
    );
  }

  /**
   * Check if a close code indicates the client should attempt to reconnect.
   * @param code The WebSocket close code
   * @returns True if reconnection is recommended
   */
  static shouldReconnect(code: number): boolean {
    // Don't reconnect on client errors or bans
    if (
      code === WSCloseCode.AUTH_FAILED ||
      code === WSCloseCode.VERSION_MISMATCH ||
      code === WSCloseCode.KICKED ||
      code === WSCloseCode.BANNED ||
      code === WSCloseCode.DUPLICATE_SESSION
    ) {
      return false;
    }
    
    // Reconnect on network issues and temporary server problems
    return (
      code === WSCloseCode.ABNORMAL_CLOSURE ||
      code === WSCloseCode.SERVICE_RESTART ||
      code === WSCloseCode.TRY_AGAIN_LATER ||
      code === WSCloseCode.AUTH_TIMEOUT ||
      code === WSCloseCode.AUTH_TOKEN_EXPIRED
    );
  }
}
