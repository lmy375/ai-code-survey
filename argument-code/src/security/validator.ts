import { logger } from '../utils/logger.js';

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class CommandValidator {
  private static readonly DANGEROUS_PATTERNS = [
    // Command chaining and piping (but allow $ for parameter substitution)
    /[;&|`()]/,
    // File redirection
    /[<>]/,
    // Directory traversal
    /\.\.[\/\\]/,
    // Null bytes
    /\x00/,
    // Backticks for command substitution
    /`/,
    // Process substitution
    /<\(/,
    />\(/,
    // Command substitution with $() but allow simple $var
    /\$\(/,
  ];

  private static readonly DANGEROUS_COMMANDS = [
    'rm', 'rmdir', 'del', 'format', 'fdisk',
    'mkfs', 'dd', 'shutdown', 'reboot', 'halt',
    'su', 'sudo', 'passwd', 'chown', 'chmod',
    'curl', 'wget', 'nc', 'netcat', 'telnet',
  ];

  static validateCommand(command: string): void {
    logger.debug(`Validating command: ${command}`);

    if (!command || command.trim().length === 0) {
      throw new SecurityError('Command cannot be empty');
    }

    // Check for dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        throw new SecurityError(`Command contains dangerous pattern: ${pattern.source}`);
      }
    }

    // Check for dangerous commands at the start
    const commandParts = command.trim().split(/\s+/);
    const baseCommand = commandParts[0].toLowerCase();
    
    if (this.DANGEROUS_COMMANDS.includes(baseCommand)) {
      throw new SecurityError(`Command '${baseCommand}' is not allowed for security reasons`);
    }

    logger.debug('Command validation passed');
  }

  static validateArgument(arg: string): void {
    if (typeof arg !== 'string') {
      throw new SecurityError('Argument must be a string');
    }

    // Check for dangerous patterns in arguments
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(arg)) {
        throw new SecurityError(`Argument contains dangerous pattern: ${pattern.source}`);
      }
    }
  }

  static sanitizeArgument(arg: string): string {
    // Basic sanitization - escape shell metacharacters (but preserve $ for parameter substitution)
    return arg.replace(/[;&|`()\\<>]/g, '\\$&');
  }
}
