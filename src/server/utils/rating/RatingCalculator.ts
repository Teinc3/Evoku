/**
 * RatingCalculator handles ELO rating calculations for players after matches.
 * Implements the standard ELO rating system formula.
 */
export default class RatingCalculator {
  private static readonly K = 80; // ELO constant, determines rating volatility

  /**
   * Calculates the ELO rating change for the winner in a match.
   * @param winnerElo Current ELO of the winner
   * @param loserElo Current ELO of the loser
   * @returns The ELO change (positive number)
   */
  static calculateEloChange(winnerElo: number, loserElo: number): number {
    const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    const change = this.K * (1 - expectedWinner);
    return Math.round(change);
  }

  /**
   * Calculates the new ELO rating for the winner.
   * @param winnerElo Current ELO of the winner
   * @param loserElo Current ELO of the loser
   * @returns New ELO rating for the winner
   */
  static getNewWinnerElo(winnerElo: number, loserElo: number): number {
    return winnerElo + this.calculateEloChange(winnerElo, loserElo);
  }

  /**
   * Calculates the new ELO rating for the loser.
   * @param loserElo Current ELO of the loser
   * @param winnerElo Current ELO of the winner
   * @returns New ELO rating for the loser (minimum 0)
   */
  static getNewLoserElo(loserElo: number, winnerElo: number): number {
    const change = this.calculateEloChange(winnerElo, loserElo);
    return Math.max(0, loserElo - change);
  }
}
