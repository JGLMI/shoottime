import { useEffect, useMemo, useState } from "react";
import { db, type DayEntry } from "../stores/db";
import { keyDay, keyMonth } from "../utils/time";

function labelFor(v: number | undefined) {
  if (v === 1) return "Journée entière";
  if (v === 0.5) return "Demi-journée";
  return "—";
}

export default function Days() {
  // date sélectionnée (aujourd'hui par défaut)
  const [dateISO, setDateISO] = useState(() => keyDay(new Date()));
  const month = useMemo(() => keyMonth(new Date(dateISO)), [dateISO]);

  // valeur du jour sélectionné (1, 0.5 ou undefined)
  const [todayValue, setTodayValue] = useState<number | undefined>(undefined);

  // liste du mois courant
  const [monthRows, setMonthRows] = useState<DayEntry[]>([]);

  // charge la valeur du jour + le mois quand date change
  useEffect(() => {
    (async () => {
      const day = await db.days.where("dateKey").equals(dateISO).first();
      setTodayValue(day?.value);
      const rows = await db.days.where("monthKey").equals(month).toArray();
      // tri par date
      rows.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
      setMonthRows(rows);
    })();
  }, [dateISO, month]);

  async function setDay(value: 1 | 0.5) {
    const existing = await db.days.where("dateKey").equals(dateISO).first();
    if (existing) {
      await db.days.update(existing.id!, { value });
    } else {
      await db.days.add({
        id: crypto.randomUUID(),
        dateKey: dateISO,
        monthKey: month,
        value,
      });
    }
    setTodayValue(value);
    // maj la liste du mois
    const rows = await db.days.where("monthKey").equals(month).toArray();
    rows.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    setMonthRows(rows);
  }

  async function clearDay() {
    const existing = await db.days.where("dateKey").equals(dateISO).first();
    if (existing?.id) {
      await db.days.delete(existing.id);
      setTodayValue(undefined);
      const rows = await db.days.where("monthKey").equals(month).toArray();
      rows.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
      setMonthRows(rows);
    }
  }

  const totalMonth = monthRows.reduce((sum, r) => sum + (r.value ?? 0), 0);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Journées de tournage</h1>
        <input
          className="input"
          type="date"
          value={dateISO}
          onChange={(e) => setDateISO(e.target.value)}
        />
      </header>

      <section className="p-6 border rounded-xl space-y-4">
        <div className="text-sm opacity-70">Date sélectionnée</div>
        <div className="text-xl font-medium">{dateISO}</div>

        <div className="flex items-center gap-3">
          <button className="btn-primary" onClick={() => setDay(1)}>
            ✅ Journée entière (1)
          </button>
          <button className="btn" onClick={() => setDay(0.5)}>
            🕐 Demi-journée (0,5)
          </button>
          {todayValue !== undefined && (
            <button className="btn-danger" onClick={clearDay}>
              ✖️ Effacer
            </button>
          )}
        </div>

        <div className="text-sm">
          Statut du {dateISO} :{" "}
          <span className="font-medium">{labelFor(todayValue)}</span>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mois {month}</h2>
          <div className="text-sm">
            Total : <span className="font-medium">{totalMonth}</span> jour(s)
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left">Date</th>
              <th className="text-left">Valeur</th>
            </tr>
          </thead>
          <tbody>
            {monthRows.map((r) => (
              <tr key={r.id}>
                <td>{r.dateKey}</td>
                <td>{r.value === 1 ? "1 (journée)" : "0,5 (demi)"}</td>
              </tr>
            ))}
            {monthRows.length === 0 && (
              <tr>
                <td colSpan={2} className="opacity-60 py-2">
                  Aucune journée enregistrée ce mois-ci.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
