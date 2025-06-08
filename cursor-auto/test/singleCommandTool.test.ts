// @jest-environment node
'use strict';
import { createSingleCommandTool } from '../src/tool/singleCommandTool';

describe('singleCommandTool', () => {
  it('should execute date command', async () => {
    const tool = createSingleCommandTool({ name: 'date', cmd: 'date' });
    const result = await tool.execute({});
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should block dangerous command', async () => {
    const tool = createSingleCommandTool({ name: 'danger', cmd: 'ls; rm -rf /' });
    await expect(tool.execute({})).rejects.toThrow('命令包含危险字符');
  });
}); 