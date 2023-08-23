export class Logger {
  constructor(private name: string) {}

  log(...args: any[]) {
    console.log(`[${this.name}]`, ...args);
  }

  error(...args: any[]) {
    console.error(`[${this.name}]`, ...args);
  }

  warn(...args: any[]) {
    console.warn(`[${this.name}]`, ...args);
  }

  info(...args: any[]) {
    console.info(`[${this.name}]`, ...args);
  }

  debug(...args: any[]) {
    console.debug(`[${this.name}]`, ...args);
  }

  trace(...args: any[]) {
    console.trace(`[${this.name}]`, ...args);
  }
}
