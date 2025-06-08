import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level < this.level) return;

    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level];
    
    let coloredMessage: string;
    switch (level) {
      case LogLevel.DEBUG:
        coloredMessage = chalk.gray(`[${timestamp}] ${levelStr}: ${message}`);
        break;
      case LogLevel.INFO:
        coloredMessage = chalk.blue(`[${timestamp}] ${levelStr}: ${message}`);
        break;
      case LogLevel.WARN:
        coloredMessage = chalk.yellow(`[${timestamp}] ${levelStr}: ${message}`);
        break;
      case LogLevel.ERROR:
        coloredMessage = chalk.red(`[${timestamp}] ${levelStr}: ${message}`);
        break;
    }

    console.error(coloredMessage, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }
}

export const logger = new Logger();