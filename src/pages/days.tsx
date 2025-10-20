import { useEffect, useMemo, useState } from "react";
import { db, type DayEntry } from "../stores/db";
import { keyDay, keyMonth } from "../utils/time";

// Formatteur de valeur
function labelFor(v: number | undefined) {
  if (v === 1) return "Journée entière";
  if (v === 0.5) return "Demi-journée";
  return "—";
}

export default function Days() {
  const [dateISO, setDateISO] = useState(() => keyDay(new Date()));
  const month = useMemo(() => keyMonth(new Date(dateISO)), [dateISO]);
  const [todayValue, setTodayValue] = useState<number | undefined>();
  const [monthRows, setMonthRows] = useState<DayEntry[]>([]);

  // Charger les données
  useEffect(() => {
    (async () => {
      const day = await db.days.where("dateKey").equals(dateISO).first();
      setTodayValue(day?.value);
      const rows = await db.days.where("monthKey").equals(month).toArray();
      rows.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
      setMonthRows(rows);
    })();
  }, [dateISO, month]);

  // Ajouter / modifier
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

  // Supprimer
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
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h4 fw-bold mb-0">🎬 Journées de tournage</h1>
        <span className="badge bg-success bg-opacity-25 text-success border border-success">
          Mois {month}
        </span>
      </div>

      {/* Carte principale */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <div className="text-muted small">Date sélectionnée</div>
              <div className="fw-semibold">{dateISO}</div>
              <div className="small mt-1">
                Statut : <span className="fw-semibold">{labelFor(todayValue)}</span>
              </div>
            </div>
            <input
              className="form-control form-control-sm"
              style={{ width: 150 }}
              type="date"
              value={dateISO}
              onChange={(e) => setDateISO(e.target.value)}
            />
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button
              className={`btn btn-sm ${
                todayValue === 1 ? "btn-success" : "btn-outline-success"
              }`}
              onClick={() => setDay(1)}
            >
              ✅ Journée entière
            </button>
            <button
              className={`btn btn-sm ${
                todayValue === 0.5 ? "btn-warning text-dark" : "btn-outline-warning"
              }`}
              onClick={() => setDay(0.5)}
            >
              🕐 Demi-journée
            </button>
            <button
              className="btn btn-sm btn-outline-danger ms-auto"
              onClick={clearDay}
            >
              ✖️ Effacer
            </button>
          </div>
        </div>
      </div>

      {/* Résumé */}
      <div className="row g-3 mb-4">
        <div className="col-6">
          <div className="card text-center shadow-sm">
            <div className="card-body">
              <div className="text-muted small">Total du mois</div>
              <div className="h3 fw-bold mb-0">{totalMonth}</div>
            </div>
          </div>
        </div>
        <div className="col-6">
          <div className="card text-center shadow-sm">
            <div className="card-body">
              <div className="text-muted small">Jours enregistrés</div>
              <div className="h3 fw-bold mb-0">{monthRows.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="card shadow-sm">
        <div className="card-header fw-semibold">Journal du mois</div>
        <div className="table-responsive">
          <table className="table table-striped mb-0">
            <thead className="table-light">
              <tr>
                <th>Date</th>
                <th>Valeur</th>
              </tr>
            </thead>
            <tbody>
              {monthRows.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center text-muted py-3">
                    Aucune journée enregistrée ce mois-ci.
                  </td>
                </tr>
              )}
              {monthRows.map((r) => (
                <tr key={r.id}>
                  <td>{r.dateKey}</td>
                  <td>
                    {r.value === 1 ? (
                      <span className="badge bg-success">1 — Journée</span>
                    ) : (
                      <span className="badge bg-warning text-dark">0,5 — Demi</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-muted small mt-4 mb-0">
        Données locales • PWA offline
      </p>
    </div>
  );
}
