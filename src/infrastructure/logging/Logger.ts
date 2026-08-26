export interface LogContext { [key: string]: unknown }

export class Logger {
  constructor(private readonly scope: string) {}
  info(message: string, context?: LogContext) { console.info(this.format(message), context ?? ""); }
  warn(message: string, context?: LogContext) { console.warn(this.format(message), context ?? ""); }
  error(message: string, error?: unknown, context?: LogContext) { console.error(this.format(message), { ...context, error: this.describe(error) }); }
  private format(message: string) { return `[${this.scope}] ${message}`; }
  private describe(error: unknown) { return error instanceof Error ? { name: error.name, message: error.message, stack: process.env.NODE_ENV === "development" ? error.stack : undefined } : error; }
}

export const createLogger = (scope: string) => new Logger(scope);

