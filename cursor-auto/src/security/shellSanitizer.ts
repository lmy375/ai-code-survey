// 简单实现，后续增强
export function sanitizeShellCommand(cmd: string, args: Record<string, any>): string {
  // 禁止出现危险字符
  if (/(&&|\|\||;|\||>|<|\.{2,}\/)/.test(cmd)) {
    throw new Error('命令包含危险字符');
  }
  // 用参数安全替换
  let safeCmd = cmd;
  for (const [k, v] of Object.entries(args || {})) {
    // 只允许数字和字母
    const safeVal = String(v).replace(/[^\w.-]/g, '');
    safeCmd = safeCmd.replace(new RegExp(`\\$${k}`, 'g'), safeVal);
  }
  return safeCmd;
} 