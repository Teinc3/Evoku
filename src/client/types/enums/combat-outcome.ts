/**
 * Enum representing the outcome of a combat event.
 */
enum CombatOutcome {
  /** Attack was successfully blocked/deflected */
  REFLECTED = 'reflected',
  /** Attack hit the target */
  HIT = 'hit'
}

export default CombatOutcome;
