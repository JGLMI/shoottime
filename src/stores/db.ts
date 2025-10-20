import Dexie, { type Table } from "dexie";

// Gardé pour compat (si jamais tu utilises encore le Timer)
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

// Nouveau modèle "journée" (1 = journée, 0.5 = demi)
export interface DayEntry {
  id?: string;
  dateKey: string;   // YYYY-MM-DD
  monthKey: string;  // YYYY-MM
  value: 1 | 0.5;
  notes?: string;
}

export class DB extends Dexie {
  sessions!: Table<Session, string>; // ancien
  days!: Table<DayEntry, string>;    // nouveau

  constructor() {
    super("shoottime-db");
    this.version(2).stores({
      sessions: "id, monthKey, dateKey",
      days: "id, monthKey, dateKey"   // index pour filtrer par mois et jour
    });
  }
}

export const db = new DB();
export type { DayEntry };
