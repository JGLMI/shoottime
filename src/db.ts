import Dexie, { Table } from 'dexie';

export interface Session {
  id?: string;
  startISO: string;
  endISO?: string;
  durationMin?: number;
  dateKey: string;   // ex: 2025-10-19
  monthKey: string;  // ex: 2025-10
  project?: string;
  location?: string;
  notes?: string;
}

export class DB extends Dexie {
  sessions!: Table<Session, string>;
  constructor(){
    super('shoottime-db');
    this.version(1).stores({
      sessions: 'id, monthKey, dateKey'
    });
  }
}

export const db = new DB();
