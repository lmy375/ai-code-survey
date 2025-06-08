"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LogLevel = void 0;
exports.setLogLevel = setLogLevel;
exports.log = log;
// src/logger.ts
// Simple logger with levels
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
let currentLevel = LogLevel.INFO;
function setLogLevel(level) {
    currentLevel = level;
}
function log(level, ...args) {
    if (level >= currentLevel) {
        const prefix = LogLevel[level];
        // eslint-disable-next-line no-console
        console.error(`[${prefix}]`, ...args);
    }
}
exports.logger = {
    debug: (...a) => log(LogLevel.DEBUG, ...a),
    info: (...a) => log(LogLevel.INFO, ...a),
    warn: (...a) => log(LogLevel.WARN, ...a),
    error: (...a) => log(LogLevel.ERROR, ...a),
};
