// src/security.ts
// Security helpers for shell-mcp

export function isSafeShellCommand(cmd: string): boolean {
  // Allow $VAR (template variables), but forbid dangerous shell metacharacters and subshells
  // Block: ; & | > < ` ! .. $() ${}
  // Allow: $VAR
  if (/\b(\$\(|\$\{)/.test(cmd)) return false; // forbid $() and ${}
  if (/([;&|><`!])/.test(cmd)) return false; // forbid dangerous metacharacters
  if (/\.\./.test(cmd)) return false; // forbid path traversal
  return true;
}

export function sanitizeArg(val: string): string {
  // Remove dangerous characters
  return val.replace(/[;&|><`$!]/g, "").replace(/\.\./g, "");
}
