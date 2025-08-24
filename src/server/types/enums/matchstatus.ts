/**
 * Server-side enum for match status in a room.
 */
enum MatchStatus {
  PREINIT = 0,
  ONGOING = 1, // Includes the time after initialization, but before the match starts
  ENDED = 2
}

export default MatchStatus;