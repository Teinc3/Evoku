/**
 * WebSocket closure codes based on RFC 6455 and custom application codes.
 * 
 * Standard codes (1000-1999) follow RFC 6455 specification.
 * Custom codes (4000-4999) are application-specific reasons for closure.
 */
enum WSCloseCode {
  // Standard RFC 6455 codes (1000-1999)
  
  /**
   * Normal closure; the connection successfully completed whatever
   * purpose for which it was created.
   */
  NORMAL_CLOSURE = 1000,
  
  /** The endpoint is going away, either because of a server failure or browser navigation */
  GOING_AWAY = 1001,
  
  /** The endpoint is terminating the connection due to a protocol error */
  PROTOCOL_ERROR = 1002,
  
  /**
   * The connection is being terminated because the endpoint received
   * data of a type it cannot accept.
   */
  UNSUPPORTED_DATA = 1003,
  
  /** Reserved. A meaning might be defined in the future. */
  RESERVED = 1004,
  
  /** Reserved. Indicates that no status code was provided even though one was expected */
  NO_STATUS_RECEIVED = 1005,
  
  /** Reserved. Indicates an abnormal closure without sending/receiving a close frame */
  ABNORMAL_CLOSURE = 1006,
  
  /**
   * The endpoint is terminating the connection because a message was
   * received that contained inconsistent data.
   */
  INVALID_FRAME_PAYLOAD = 1007,
  
  /**
   * The endpoint is terminating the connection because it received
   * a message that violates its policy.
   */
  POLICY_VIOLATION = 1008,
  
  /**
   * The endpoint is terminating the connection because a message was
   * received that is too big to process.
   */
  MESSAGE_TOO_BIG = 1009,
  
  /**
   * The client is terminating the connection because it expected
   * the server to negotiate extensions.
   */
  MANDATORY_EXTENSION = 1010,
  
  /** The server is terminating the connection because it encountered an unexpected condition */
  INTERNAL_ERROR = 1011,
  
  /** The server is terminating the connection because it is restarting. */
  SERVICE_RESTART = 1012,
  
  /** The server is terminating the connection due to a temporary condition (e.g., overloaded) */
  TRY_AGAIN_LATER = 1013,
  
  /** The server acting as a gateway received an invalid response from an upstream server */
  BAD_GATEWAY = 1014,
  
  /** Reserved. Indicates that the connection was closed due to a TLS handshake failure */
  TLS_HANDSHAKE_FAILED = 1015,
  
  // Custom application codes (4000-4999)
  
  /** Client failed to authenticate within the timeout period. */
  AUTH_TIMEOUT = 4000,
  
  /** Client provided invalid authentication credentials. */
  AUTH_FAILED = 4001,
  
  /** Client's authentication token has expired. */
  AUTH_TOKEN_EXPIRED = 4002,
  
  /** Client exceeded maximum packet queue size before authentication. */
  AUTH_QUEUE_OVERFLOW = 4003,
  
  /** Client sent an invalid or malformed packet. */
  INVALID_PACKET = 4004,
  
  /** Client exceeded the rate limit for packets. */
  RATE_LIMIT_EXCEEDED = 4005,
  
  /** Client version is incompatible with the server. */
  VERSION_MISMATCH = 4006,
  
  /** Server is shutting down gracefully. */
  SERVER_SHUTDOWN = 4007,
  
  /** Client session was terminated due to duplicate login from another location. */
  DUPLICATE_SESSION = 4008,
}

export default WSCloseCode;
