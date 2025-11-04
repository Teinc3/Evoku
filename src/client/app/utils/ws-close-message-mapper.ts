import wsCloseMessagesConfig from '@config/shared/ws-close-messages.json';


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
}
