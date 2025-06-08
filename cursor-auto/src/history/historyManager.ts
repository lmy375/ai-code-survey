import fs from 'fs';
import path from 'path';

const HISTORY_FILE = path.join(process.cwd(), '.shell-mcp-history.json');

export interface HistoryEntry {
  timestamp: number;
  type: 'single' | 'repl';
  tool: string;
  input: any;
  output: any;
  sessionId?: string;
}

export class HistoryManager {
  private history: HistoryEntry[] = [];

  constructor() {
    this.load();
  }

  add(entry: HistoryEntry) {
    this.history.push(entry);
    this.save();
  }

  query(filter?: Partial<HistoryEntry>) {
    return this.history.filter(e => {
      for (const k in filter) {
        if ((e as any)[k] !== (filter as any)[k]) return false;
      }
      return true;
    });
  }

  exportAll() {
    return [...this.history];
  }

  private load() {
    if (fs.existsSync(HISTORY_FILE)) {
      this.history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    }
  }

  private save() {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(this.history, null, 2));
  }
}

export const historyManager = new HistoryManager(); 