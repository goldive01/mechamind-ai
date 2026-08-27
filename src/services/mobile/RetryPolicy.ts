export class ExponentialBackoffPolicy {
  constructor(private readonly baseDelayMs = 5_000, private readonly maximumDelayMs = 15 * 60_000) {}
  delay(attempt: number) { return Math.min(this.maximumDelayMs, this.baseDelayMs * 2 ** Math.max(0, attempt - 1)); }
  nextAttempt(attempt: number, now: Date) { return new Date(now.getTime() + this.delay(attempt)); }
}
