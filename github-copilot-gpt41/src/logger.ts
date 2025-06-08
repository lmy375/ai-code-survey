// src/logger.ts
// Simple logger with levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

let currentLevel = LogLevel.INFO;

export function setLogLevel(level: LogLevel) {
  currentLevel = level;
}

export function log(level: LogLevel, ...args: any[]) {
  if (level >= currentLevel) {
    const prefix = LogLevel[level];
    // eslint-disable-next-line no-console
    console.error(`[${prefix}]`, ...args);
  }
}

export const logger = {
  debug: (...a: any[]) => log(LogLevel.DEBUG, ...a),
  info: (...a: any[]) => log(LogLevel.INFO, ...a),
  warn: (...a: any[]) => log(LogLevel.WARN, ...a),
  error: (...a: any[]) => log(LogLevel.ERROR, ...a),
};
