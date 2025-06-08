import { describe, it, expect } from 'vitest';
import { parseArgString } from './index';

describe('parseArgString', () => {
  it('parses definitions', () => {
    const defs = parseArgString('A:int:"aa",B:string:"bb"');
    expect(defs?.A.type).toBe('int');
    expect(defs?.B.description).toBe('bb');
  });
});
