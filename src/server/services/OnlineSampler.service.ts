import type StatsService from './StatsService';


/**
 * Sampler service that periodically records server statistics to Redis.
 * Samples every hour at xx:00:00.
 */
export class StatsSampler {
  private timer: NodeJS.Timeout | null = null;

  constructor(private statsService: StatsService) {}

  /**
   * Start the sampler. It will align to the next hour boundary (:00:00)
   * and then sample every 60 minutes.
   */
  public start(): void {
    if (this.timer) {
      return; // Already running
    }

    // Calculate milliseconds until next hour
    const now = new Date();
    const msUntilNextHour = 
      (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000 - now.getMilliseconds();

    // Wait until next :00:00, then start the interval
    setTimeout(() => {
      this.sample(); // Take first sample
      this.timer = setInterval(() => this.sample(), 3600_000); // Then every 60 minutes
    }, msUntilNextHour);
  }

  /** Stop the sampler */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Take a sample and persist to Redis */
  private async sample(): Promise<void> {
    await this.statsService.sampleStats();
  }
}

export default StatsSampler;
