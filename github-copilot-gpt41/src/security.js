"use strict";
// src/security.ts
// Security helpers for shell-mcp
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSafeShellCommand = isSafeShellCommand;
exports.sanitizeArg = sanitizeArg;
function isSafeShellCommand(cmd) {
    // Allow $VAR (template variables), but forbid dangerous shell metacharacters and subshells
    // Block: ; & | > < ` ! .. $() ${}
    // Allow: $VAR
    if (/\b(\$\(|\$\{)/.test(cmd))
        return false; // forbid $() and ${}
    if (/([;&|><`!])/.test(cmd))
        return false; // forbid dangerous metacharacters
    if (/\.\./.test(cmd))
        return false; // forbid path traversal
    return true;
}
function sanitizeArg(val) {
    // Remove dangerous characters
    return val.replace(/[;&|><`$!]/g, "").replace(/\.\./g, "");
}
