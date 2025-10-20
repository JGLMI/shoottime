import { useEffect, useMemo, useState } from "react";
import { db, type DayEntry } from "../stores/db";
import { keyDay, keyMonth } from "../utils/time";


const SYNC_URL = 'https://script.google.com/macros/s/AKfycbwXXvxmMY3245iB3iIvrClk74IylADBVbMwjdZY6XaaincMTL8M-GfrmiDMf2i8rg4T/exec';
const SYNC_SECRET = 'wami'; // 

function labelFor(v: number | undefined) {
  if (v === 1) return "Journée entière";
  if (v === 0.5) return "Demi-journée";
  return "—";
}

// Fallback UUID compatible mobiles un peu anciens
const uid = () =>
  (globalThis.crypto && "randomUUID" in globalThis.crypto
    ? (globalThis.crypto as any).randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);

export default function Days() {
  // Etat UI / données
  const [dateISO, setDateISO] = useState(() => keyDay(new Date()));
  const month = useMemo(() => keyMonth(new Date(dateISO)), [dateISO]);
  const [todayValue, setTodayValue] = useState<number | undefined>(undefined);
  const [monthRows, setMonthRows] = useState<DayEntry[]>([]);

  // Toast simple (Bootstrap alert)
  const [toast, setToast] = useState<string>("");
  function notify(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1800);
  }

  // Sync Google Sheets (dans le composant pour accéder à notify)
  async function syncToSheet() {
    try {
      const rows = await db.days.toArray();
      await fetch(SYNC_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // évite le preflight CORS
        body: JSON.stringify({ secret: SYNC_SECRET, rows }),
      });
      notify("✅ Données synchronisées");
    } catch (e) {
      console.error("Sync error", e);
      alert("❌ Échec de la synchro Google Sheets");
    }
  }

  // Charger la valeur du jour + la liste du mois
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
    try {
      const existing = await db.days.where("dateKey").equals(dateISO).first();
      if (existing?.id) {
        await db.days.update(existing.id, { value });
      } else {
        await db.days.add({
          id: uid(),
          dateKey: dateISO,
          monthKey: month,
          value,
        });
      }
      setTodayValue(value);
      const rows = await db.days.where("monthKey").equals(month).toArray();
      rows.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
      setMonthRows(rows);
      await syncToSheet();
    } catch (e) {
      console.error(e);
      alert("Impossible d’enregistrer (désactive la navigation privée et réessaie).");
    }
  }

  async function clearDay() {
    try {
      const existing = await db.days.where("dateKey").equals(dateISO).first();
      if (existing?.id) {
        await db.days.delete(existing.id);
        setTodayValue(undefined);
        const rows = await db.days.where("monthKey").equals(month).toArray();
        rows.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
        setMonthRows(rows);
        await syncToSheet();
      }
    } catch (e) {
      console.error(e);
      alert("Suppression impossible. Essaie en mode normal (pas privé).");
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
            <button className="btn btn-sm btn-outline-danger ms-auto" onClick={clearDay}>
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

      {/* Toast de confirmation */}
      <div
        className={`position-fixed bottom-0 start-50 translate-middle-x mb-3 ${
          toast ? "" : "d-none"
        }`}
        style={{ zIndex: 1080 }}
      >
        <div className="alert alert-success shadow-sm py-2 px-3 mb-0" role="alert">
          {toast}
        </div>
      </div>

      <p className="text-center text-muted small mt-4 mb-0">
        Données locales • PWA offline • Sync Google Sheets
      </p>
    </div>
  );
}

