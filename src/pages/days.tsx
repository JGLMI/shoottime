import { useEffect, useMemo, useState } from "react";
import { db, type DayEntry } from "../stores/db";
import { keyDay, keyMonth } from "../utils/time";

function labelFor(v: number | undefined) {
  if (v === 1) return "Journée entière";
  if (v === 0.5) return "Demi-journée";
  return "—";
}

export default function Days() {
  // UI state
  const [dateISO, setDateISO] = useState(() => keyDay(new Date()));
  const month = useMemo(() => keyMonth(new Date(dateISO)), [dateISO]);
  const [todayValue, setTodayValue] = useState<number | undefined>(undefined);
  const [monthRows, setMonthRows] = useState<DayEntry[]>([]);

  // Load selected day + month list
  useEffect(() => {
    (async () => {
      const day = await db.days.where("dateKey").equals(dateISO).first();
      setTodayValue(day?.value);
      const rows = await db.days.where("monthKey").equals(month).toArray();
      rows.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
      setMonthRows(rows);
    })();
  }, [dateISO, month]);

  // Actions
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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Top bar */}
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight">
            🎬 Journées de tournage
          </h1>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
            Mois {month}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-6">
        {/* Card: Select date & set value */}
        <section className="bg-white border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-gray-500">Date sélectionnée</div>
              <div className="text-lg font-medium">{dateISO}</div>
              <div className="text-sm mt-1">
                Statut :{" "}
                <span className="font-medium">
                  {labelFor(todayValue)}
                </span>
              </div>
            </div>
            <input
              className="input"
              type="date"
              value={dateISO}
              onChange={(e) => setDateISO(e.target.value)}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              className={`btn ${todayValue === 1 ? "bg-emerald-600 text-white border-emerald-600" : "hover:bg-emerald-50 border-emerald-200"}`}
              onClick={() => setDay(1)}
            >
              ✅ Journée
            </button>
            <button
              className={`btn ${todayValue === 0.5 ? "bg-amber-600 text-white border-amber-600" : "hover:bg-amber-50 border-amber-200"}`}
              onClick={() => setDay(0.5)}
            >
              🕐 Demi
            </button>
            <button className="btn-danger" onClick={clearDay}>
              ✖️ Effacer
            </button>
          </div>
        </section>

        {/* Summary cards */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-white border rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-gray-500">Total du mois</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums">
              {totalMonth.toLocaleString("fr-FR")} j
            </div>
          </div>
          <div className="bg-white border rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-gray-500">Jours enregistrés</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums">
              {monthRows.length}
            </div>
          </div>
        </section>

        {/* Table month */}
        <section className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h2 className="text-sm font-semibold">Journal du mois</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="text-left px-4 py-2">Valeur</th>
                </tr>
              </thead>
              <tbody>
                {monthRows.length === 0 && (
                  <tr>
                    <td className="px-4 py-4 text-gray-500" colSpan={2}>
                      Aucune journée enregistrée ce mois-ci.
                    </td>
                  </tr>
                )}
                {monthRows.map((r) => (
                  <tr
                    key={r.id}
                    className="odd:bg-white even:bg-gray-50/60"
                  >
                    <td className="px-4 py-2">{r.dateKey}</td>
                    <td className="px-4 py-2">
                      {r.value === 1 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 border border-emerald-200">
                          1 — Journée
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 border border-amber-200">
                          0,5 — Demi
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="pt-2 pb-8 text-center text-xs text-gray-500">
          Données stockées en local • PWA offline
        </footer>
      </main>
    </div>
  );
}
