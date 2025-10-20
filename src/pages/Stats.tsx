import { useEffect, useMemo, useState } from "react";
import { db, type DayEntry } from "../stores/db";

// regroupe par clé (mois ou année)
function groupBy<T, K extends string | number>(rows: T[], keyFn: (t: T)=>K) {
  return rows.reduce((acc, r) => {
    const k = keyFn(r) as string;
    (acc[k] ||= []).push(r);
    return acc;
  }, {} as Record<string, T[]>);
}

export default function Stats() {
  const [rows, setRows] = useState<DayEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const all = await db.days.toArray();
      // tri par date
      all.sort((a,b)=>a.dateKey.localeCompare(b.dateKey));
      setRows(all);
      setReady(true);
    })();
  }, []);

  const byMonth = useMemo(() => groupBy(rows, r => r.monthKey), [rows]);
  const byYear  = useMemo(() => groupBy(rows, r => r.dateKey.slice(0,4)), [rows]);

  const months = useMemo(() => Object.keys(byMonth).sort(), [byMonth]);
  const years  = useMemo(() => Object.keys(byYear).sort(), [byYear]);

  const totalAll = rows.reduce((s, r) => s + (r.value ?? 0), 0);
  const currentYear = new Date().getFullYear().toString();
  const totalYear = (byYear[currentYear] || []).reduce((s, r) => s + (r.value ?? 0), 0);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h4 fw-bold mb-0">📊 Statistiques</h1>
        {!ready && <span className="badge text-bg-secondary">Chargement…</span>}
      </div>

      {/* Cartes synthèse */}
      <div className="row g-3 mb-4">
        <div className="col-6">
          <div className="card text-center shadow-sm">
            <div className="card-body">
              <div className="text-muted small">Total {currentYear}</div>
              <div className="h3 fw-bold mb-0">{totalYear}</div>
              <div className="text-muted small">jour(s)</div>
            </div>
          </div>
        </div>
        <div className="col-6">
          <div className="card text-center shadow-sm">
            <div className="card-body">
              <div className="text-muted small">Total historique</div>
              <div className="h3 fw-bold mb-0">{totalAll}</div>
              <div className="text-muted small">jour(s)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Totaux par mois */}
      <div className="card shadow-sm mb-4">
        <div className="card-header fw-semibold">Par mois</div>
        <div className="list-group list-group-flush">
          {months.length === 0 && (
            <div className="list-group-item text-muted small">
              Aucune donnée pour l’instant.
            </div>
          )}
          {months.map((m) => {
            const sum = (byMonth[m] || []).reduce((s, r) => s + (r.value ?? 0), 0);
            // petite “barre” visuelle avec les progress Bootstrap
            const pct = Math.min(100, (sum / 20) * 100); // 20 jours = barre pleine (ajuste si tu veux)
            return (
              <div key={m} className="list-group-item">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <strong>{m}</strong>
                  <span className="badge text-bg-primary">{sum} j</span>
                </div>
                <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className="progress-bar" style={{width: `${pct}%`}} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Totaux par année */}
      <div className="card shadow-sm">
        <div className="card-header fw-semibold">Par année</div>
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th>Année</th>
                <th>Total jours</th>
              </tr>
            </thead>
            <tbody>
              {years.length === 0 && (
                <tr><td colSpan={2} className="text-muted small">Aucune donnée</td></tr>
              )}
              {years.map(y => {
                const sum = (byYear[y] || []).reduce((s, r) => s + (r.value ?? 0), 0);
                return (
                  <tr key={y}>
                    <td>{y}</td>
                    <td>{sum}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-muted small mt-4 mb-0">
        Ces totaux se basent sur 1 = journée entière · 0,5 = demi-journée
      </p>
    </div>
  );
}
