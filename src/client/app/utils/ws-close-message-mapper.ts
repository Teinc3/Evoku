import WSCloseCode from '@shared/types/enums/ws-codes.enum';
import wsCloseMessagesConfig from '@config/client/ws-close-messages.json';


/**
 * Maps WebSocket close codes to user-friendly error messages.
 * Provides meaningful feedback to users when disconnection occurs.
 */
export default class WSCloseMessageMapper {
  private static readonly messages: Map<number, string> = new Map(
    Object.entries(wsCloseMessagesConfig.wsCloseMessages).map(([code, message]) => [
      parseInt(code, 10),
      message,
    ])
  );

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
}
