import { useState } from "react";
import Days from "./pages/days";
import Stats from "./pages/Stats";

export default function App() {
  const [view, setView] = useState<"days" | "stats">("days");

  return (
    <div>
      {/* Barre de navigation simple Bootstrap */}
      <nav className="navbar bg-body-tertiary border-bottom sticky-top">
        <div className="container">
          <span className="navbar-brand fw-semibold">ShootTime</span>
          <ul className="nav nav-pills">
            <li className="nav-item">
              <button
                className={`nav-link ${view === "days" ? "active" : ""}`}
                onClick={() => setView("days")}
              >
                Journées
              </button>
            </li>
            <li className="nav-item ms-2">
              <button
                className={`nav-link ${view === "stats" ? "active" : ""}`}
                onClick={() => setView("stats")}
              >
                Stats
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Vues */}
      {view === "days" ? <Days /> : <Stats />}
    </div>
  );
}
