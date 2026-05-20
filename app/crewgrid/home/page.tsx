import React from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

export default function HomeDashboard() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --color-border-tertiary: #333333;
          --color-border-secondary: #444444;
          --color-background-primary: #121212;
          --color-background-secondary: #1e1e1e;
          --color-text-primary: #f3f4f6;
          --color-text-secondary: #9ca3af;
          --border-radius-md: 6px;
          --border-radius-lg: 10px;
          --font-sans: system-ui, -apple-system, sans-serif;
        }
        body {
          font-family: var(--font-sans);
          margin: 0;
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(231, 31, 127, 0.12), transparent 32%),
            radial-gradient(circle at bottom right, rgba(96, 165, 250, 0.08), transparent 26%),
            #000000;
          padding: 20px;
          box-sizing: border-box;
        }
        .app {
          display: flex;
          height: calc(100vh - 40px);
          border: 0.5px solid var(--color-border-tertiary);
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          background: var(--color-background-primary);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
          animation: dashboard-shell-in 560ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .sidebar {
          width: 220px;
          background: #1a1a1a;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          animation: dashboard-sidebar-in 620ms cubic-bezier(0.16, 1, 0.3, 1) 60ms both;
        }
        .logo { padding: 16px 20px; border-bottom: 0.5px solid #333; display: flex; align-items: center; gap: 10px; }
        .logo span { color: #E71F7F; font-weight: 600; font-size: 16px; letter-spacing: .5px; }
        .logo i { color: #E71F7F; font-size: 20px; }
        .nav-section { padding: 12px 0; }
        .nav-label { font-size: 11px; color: #666; padding: 8px 20px 4px; text-transform: uppercase; letter-spacing: .8px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 8px 20px; font-size: 13px; color: #aaa; cursor: pointer; transition: background .15s; }
        .nav-item:hover { background: #2a2a2a; color: #ddd; }
        .nav-item.active { background: #2a2a2a; color: #fff; border-left: 2px solid #E71F7F; }
        .nav-item i { font-size: 16px; width: 18px; }
        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: dashboard-main-in 620ms cubic-bezier(0.16, 1, 0.3, 1) 120ms both;
        }
        .topbar {
          height: 50px;
          border-bottom: 0.5px solid var(--color-border-tertiary);
          display: flex;
          align-items: center;
          padding: 0 24px;
          gap: 12px;
          background: var(--color-background-primary);
          animation: dashboard-fade-down 520ms ease-out 180ms both;
        }
        .topbar-title { font-size: 15px; font-weight: 500; color: var(--color-text-primary); flex: 1; }
        .btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); font-size: 12px; cursor: pointer; background: transparent; color: var(--color-text-primary); }
        .btn:hover { background: var(--color-background-secondary); }
        .btn-primary { background: #E71F7F; border-color: #E71F7F; color: #ffffff; font-weight: 500; }
        .btn-primary:hover { background: #C8196E; }
        .content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .metric-card {
          background: var(--color-background-secondary);
          border-radius: var(--border-radius-md);
          padding: 16px;
          animation: dashboard-card-up 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .metrics .metric-card:nth-child(1) { animation-delay: 180ms; }
        .metrics .metric-card:nth-child(2) { animation-delay: 230ms; }
        .metrics .metric-card:nth-child(3) { animation-delay: 280ms; }
        .metrics .metric-card:nth-child(4) { animation-delay: 330ms; }
        .metric-label { font-size: 12px; color: var(--color-text-secondary); margin-bottom: 6px; }
        .metric-value { font-size: 24px; font-weight: 600; color: var(--color-text-primary); }
        .metric-sub { font-size: 11px; margin-top: 4px; }
        .metric-sub.up { color: #4ade80; }
        .metric-sub.warn { color: #fbbf24; }
        .row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .content > .row .card {
          animation: dashboard-card-up 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .content > .row:nth-of-type(2) .card:nth-child(1) { animation-delay: 380ms; }
        .content > .row:nth-of-type(2) .card:nth-child(2) { animation-delay: 430ms; }
        .content > .row:nth-of-type(3) .card:nth-child(1) { animation-delay: 510ms; }
        .content > .row:nth-of-type(3) .card:nth-child(2) { animation-delay: 560ms; }
        .card {
          background: var(--color-background-primary);
          border: 0.5px solid var(--color-border-tertiary);
          border-radius: var(--border-radius-lg);
          padding: 16px;
        }
        .card-title { font-size: 14px; font-weight: 500; color: var(--color-text-primary); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .card-title i { font-size: 16px; color: var(--color-text-secondary); }
        .job-item { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 0.5px solid var(--color-border-tertiary); font-size: 13px; }
        .job-item:last-child { border: none; }
        .badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
        .badge-green { background: rgba(59, 109, 17, 0.3); color: #86e83c; }
        .badge-amber { background: rgba(133, 79, 11, 0.3); color: #fbbf24; }
        .badge-blue { background: rgba(24, 95, 165, 0.3); color: #60a5fa; }
        .badge-gray { background: rgba(95, 94, 90, 0.3); color: #d1d5db; }
        .job-name { flex: 1; color: var(--color-text-primary); font-weight: 400; }
        .job-date { color: var(--color-text-secondary); }
        .bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 12px; }
        .bar-label { width: 80px; color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .bar-bg { flex: 1; height: 10px; background: var(--color-border-tertiary); border-radius: 5px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 5px; background: #E71F7F; }
        .bar-val { width: 35px; text-align: right; color: var(--color-text-primary); font-weight: 500; }
        .alert-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 0.5px solid var(--color-border-tertiary); font-size: 13px; }
        .alert-item:last-child { border: none; }
        .alert-icon { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .alert-icon.warn { background: rgba(133, 79, 11, 0.3); }
        .alert-icon.warn i { color: #fbbf24; font-size: 14px; }
        .alert-icon.danger { background: rgba(163, 45, 45, 0.3); }
        .alert-icon.danger i { color: #fc8181; font-size: 14px; }
        .alert-icon.info { background: rgba(24, 95, 165, 0.3); }
        .alert-icon.info i { color: #60a5fa; font-size: 14px; }
        .alert-text { flex: 1; color: var(--color-text-secondary); line-height: 1.5; }
        .alert-text strong { color: var(--color-text-primary); font-weight: 500; }
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-top: 8px; }
        .cal-day-label { font-size: 11px; color: var(--color-text-secondary); text-align: center; padding: 4px 0; font-weight: 500; }
        .cal-day { height: 32px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: var(--color-text-secondary); cursor: pointer; }
        .cal-day:hover { background: var(--color-background-secondary); }
        .cal-day.has-job { background: rgba(133, 79, 11, 0.3); color: #fbbf24; font-weight: 500; }
        .cal-day.today { background: #E71F7F; color: #ffffff; font-weight: 600; }
        .cal-day.empty { opacity: 0; pointer-events: none; }
        @keyframes dashboard-shell-in {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes dashboard-sidebar-in {
          from {
            opacity: 0;
            transform: translateX(-16px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes dashboard-main-in {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes dashboard-fade-down {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes dashboard-card-up {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .app,
          .sidebar,
          .main,
          .topbar,
          .metric-card,
          .row .card,
          .auth-overlay,
          .auth-modal,
          .auth-overlay-loading,
          .auth-overlay-loading::after {
            animation: none !important;
            transition: none !important;
          }
        }
      ` }} />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />

      <div className="app">
        <Sidebar />

        <div className="main">
          <TopBar />
          <div className="content">
            <div className="metrics">
              <div className="metric-card">
                <div className="metric-label">Aktive Jobs</div>
                <div className="metric-value">14</div>
                <div className="metric-sub up">↑ 3 diese Woche</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Offene Angebote</div>
                <div className="metric-value">7</div>
                <div className="metric-sub warn">2 ohne Antwort</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Umsatz Mai</div>
                <div className="metric-value">38.400 €</div>
                <div className="metric-sub up">↑ 12% vs. April</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Fehlmengen</div>
                <div className="metric-value">3</div>
                <div className="metric-sub warn">Sofortmaßnahme nötig</div>
              </div>
            </div>

            <div className="row">
              <div className="card">
                <div className="card-title"><i className="ti ti-briefcase" aria-hidden="true"></i> Aktuelle Jobs</div>
                <div className="job-item">
                  <span className="badge badge-green">Aktiv</span>
                  <span className="job-name">Stadtfest München</span>
                  <span className="job-date">08.05.26</span>
                </div>
                <div className="job-item">
                  <span className="badge badge-amber">Angebot</span>
                  <span className="job-name">Firmen-Event BMW</span>
                  <span className="job-date">12.05.26</span>
                </div>
                <div className="job-item">
                  <span className="badge badge-blue">Planung</span>
                  <span className="job-name">Konzert Open Air</span>
                  <span className="job-date">19.05.26</span>
                </div>
                <div className="job-item">
                  <span className="badge badge-green">Aktiv</span>
                  <span className="job-name">Hochzeit Schloss Berg</span>
                  <span className="job-date">21.05.26</span>
                </div>
                <div className="job-item">
                  <span className="badge badge-gray">Abschluss</span>
                  <span className="job-name">Messe Hannover</span>
                  <span className="job-date">24.05.26</span>
                </div>
              </div>

              <div className="card">
                <div className="card-title"><i className="ti ti-calendar" aria-hidden="true"></i> Mai 2026</div>
                <div className="cal-grid">
                  <div className="cal-day-label">Mo</div><div className="cal-day-label">Di</div><div className="cal-day-label">Mi</div><div className="cal-day-label">Do</div><div className="cal-day-label">Fr</div><div className="cal-day-label">Sa</div><div className="cal-day-label">So</div>
                  <div className="cal-day empty"></div><div className="cal-day empty"></div><div className="cal-day empty"></div><div className="cal-day today">7</div><div className="cal-day">8</div><div className="cal-day has-job">9</div><div className="cal-day">10</div>
                  <div className="cal-day">11</div><div className="cal-day has-job">12</div><div className="cal-day">13</div><div className="cal-day">14</div><div className="cal-day">15</div><div className="cal-day has-job">16</div><div className="cal-day">17</div>
                  <div className="cal-day">18</div><div className="cal-day has-job">19</div><div className="cal-day">20</div><div className="cal-day has-job">21</div><div className="cal-day">22</div><div className="cal-day">23</div><div className="cal-day has-job">24</div>
                  <div className="cal-day">25</div><div className="cal-day">26</div><div className="cal-day">27</div><div className="cal-day">28</div><div className="cal-day">29</div><div className="cal-day has-job">30</div><div className="cal-day">31</div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="card">
                <div className="card-title"><i className="ti ti-package" aria-hidden="true"></i> Auslastung Lager (Top-Artikel)</div>
                <div className="bar-row"><span className="bar-label">PA-System</span><div className="bar-bg"><div className="bar-fill" style={{width: '92%'}}></div></div><span className="bar-val">92%</span></div>
                <div className="bar-row"><span className="bar-label">LED-Wall</span><div className="bar-bg"><div className="bar-fill" style={{width: '78%'}}></div></div><span className="bar-val">78%</span></div>
                <div className="bar-row"><span className="bar-label">Trussing</span><div className="bar-bg"><div className="bar-fill" style={{width: '65%'}}></div></div><span className="bar-val">65%</span></div>
                <div className="bar-row"><span className="bar-label">Scheinwerfer</span><div className="bar-bg"><div className="bar-fill" style={{width: '55%'}}></div></div><span className="bar-val">55%</span></div>
                <div className="bar-row"><span className="bar-label">Kabelset</span><div className="bar-bg"><div className="bar-fill" style={{width: '40%'}}></div></div><span className="bar-val">40%</span></div>
              </div>

              <div className="card">
                <div className="card-title"><i className="ti ti-alert-triangle" aria-hidden="true"></i> Hinweise & Alerts</div>
                <div className="alert-item">
                  <div className="alert-icon danger"><i className="ti ti-package-off" aria-hidden="true"></i></div>
                  <div className="alert-text"><strong>Fehlmenge:</strong> PA-System × 2 für Konzert 19.05 nicht verfügbar — Zumietung prüfen</div>
                </div>
                <div className="alert-item">
                  <div className="alert-icon warn"><i className="ti ti-tool" aria-hidden="true"></i></div>
                  <div className="alert-text"><strong>Werkstatt:</strong> Moving Head #04 in Reparatur — geplante Fertigstellung 10.05</div>
                </div>
                <div className="alert-item">
                  <div className="alert-icon warn"><i className="ti ti-clock" aria-hidden="true"></i></div>
                  <div className="alert-text"><strong>Mahnung:</strong> Rechnung #2024-089 (BMW, 2.400 €) seit 14 Tagen überfällig</div>
                </div>
                <div className="alert-item">
                  <div className="alert-icon info"><i className="ti ti-file-check" aria-hidden="true"></i></div>
                  <div className="alert-text"><strong>Angebot:</strong> Stadtfest München wartet auf Online-Bestätigung seit 2 Tagen</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
