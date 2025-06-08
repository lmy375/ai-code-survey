import { logger } from '../utils/logger.js';

export class SecurityValidator {
  private static readonly DANGEROUS_PATTERNS = [
    /[;&|`$(){}[\]<>]/,           // Command injection characters
    /\.\.[\/\\]/,                 // Directory traversal
    /\/etc\/|\/proc\/|\/sys\//,   // System directories
    /rm\s+-rf/,                   // Dangerous rm commands
    /sudo|su\s/,                  // Privilege escalation
    /wget|curl.*[|&;]/,           // Network commands with pipes
    /nc\s|netcat/,                // Network utilities
  ];

  private static readonly ALLOWED_SHELL_CHARS = new Set([
    ' ', '-', '_', '=', '.', '/', '\\', ':', '@', '+', '~', '*', '?', '[', ']'
  ]);

  static validateCommand(command: string): { valid: boolean; reason?: string } {
    if (!command || typeof command !== 'string') {
      return { valid: false, reason: 'Command must be a non-empty string' };
    }

    // Check for dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        logger.warn(`Blocked potentially dangerous command: ${command}`);
        return { valid: false, reason: `Command contains dangerous pattern: ${pattern}` };
      }
    }

    return { valid: true };
  }

  static validateArgument(arg: string): { valid: boolean; reason?: string } {
    if (typeof arg !== 'string') {
      return { valid: false, reason: 'Argument must be a string' };
    }

    // Check for null bytes
    if (arg.includes('\0')) {
      return { valid: false, reason: 'Argument contains null byte' };
    }

    // Check for dangerous characters in arguments
    for (const char of arg) {
      if (!char.match(/[\w\s]/) && !this.ALLOWED_SHELL_CHARS.has(char)) {
        logger.warn(`Blocked argument with suspicious character: ${char} in ${arg}`);
        return { valid: false, reason: `Argument contains suspicious character: ${char}` };
      }
    }

    return { valid: true };
  }

  static sanitizeEnvironmentVariables(env: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(env)) {
      // Only allow alphanumeric keys with underscores
      if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
        logger.warn(`Skipping environment variable with invalid key: ${key}`);
        continue;
      }

      // Validate the value
      const validation = this.validateArgument(value);
      if (validation.valid) {
        sanitized[key] = value;
      } else {
        logger.warn(`Skipping environment variable ${key} with invalid value`);
      }
    }

    return sanitized;
  }

  static validateTimeout(timeout: number): { valid: boolean; reason?: string } {
    if (typeof timeout !== 'number' || timeout <= 0) {
      return { valid: false, reason: 'Timeout must be a positive number' };
    }

    if (timeout > 300000) { // 5 minutes max
      return { valid: false, reason: 'Timeout cannot exceed 300 seconds' };
    }

    return { valid: true };
  }
}