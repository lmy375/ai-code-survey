import { createLogger } from './logger.js';

const logger = createLogger();

// Dangerous patterns that could lead to command injection
const DANGEROUS_PATTERNS = [
  /&&/,
  /\|\|/,
  /;/,
  /\|/,
  /`/,
  /\$\(/,
  /\$\{/,
  /</,
  />/,
  /\.\.\//,
  /~\//,
];

// Allowed environment variables that can be used in commands
const ALLOWED_ENV_VARS = new Set([
  'PATH',
  'HOME',
  'USER',
  'SHELL',
  'LANG',
  'LC_ALL',
  'TZ',
]);

export function validateCommandSafety(command: string, args: Record<string, any> = {}): void {
  logger.debug('Validating command safety', { command, args });

  // Check for dangerous patterns in the base command
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error(`Command contains potentially dangerous pattern: ${pattern}`);
    }
  }

  // Check for dangerous patterns in arguments
  for (const [key, value] of Object.entries(args)) {
    if (typeof value === 'string') {
      for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(value)) {
          throw new Error(`Argument '${key}' contains potentially dangerous pattern: ${pattern}`);
        }
      }
    }
  }

  logger.debug('Command validation passed');
}

export function sanitizeEnvironment(env: Record<string, string | undefined>): Record<string, string | undefined> {
  const sanitized: Record<string, string | undefined> = {};
  
  for (const [key, value] of Object.entries(env)) {
    if (ALLOWED_ENV_VARS.has(key)) {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

export function escapeShellArg(arg: string): string {
  // Escape single quotes and wrap in single quotes
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

export function buildSafeCommand(baseCommand: string, args: Record<string, any>): string {
  let command = baseCommand;
  
  // Replace placeholders with escaped values
  for (const [key, value] of Object.entries(args)) {
    const placeholder = `$${key}`;
    if (command.includes(placeholder)) {
      const escapedValue = escapeShellArg(String(value));
      command = command.replace(new RegExp(`\\$${key}`, 'g'), escapedValue);
    }
  }
  
  return command;
}
