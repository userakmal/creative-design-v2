import React from "react";

export const OptomGulbozorPage = () => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Manrope:wght@300;400;500;600;700&display=swap');

        .og-root {
          --green: #3d5235;
          --green-deep: #2e3f28;
          --green-darker: #1f2c1b;
          --cream: #e8e3cf;
          --cream-dim: rgba(232,227,207,0.7);
          --cream-line: rgba(232,227,207,0.18);
          box-sizing: border-box;
          min-height: 100vh;
          margin: 0;
          padding: 0;
          background: var(--green-deep);
          background-image:
            radial-gradient(ellipse at 20% 0%, rgba(232,227,207,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 100%, rgba(232,227,207,0.05) 0%, transparent 60%);
          font-family: 'Manrope', system-ui, sans-serif;
          color: var(--cream);
          position: relative;
        }
        .og-root *, .og-root *::before, .og-root *::after {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }
        .og-border {
          position: fixed;
          inset: 12px;
          border: 1px solid var(--cream-line);
          border-radius: 12px;
          pointer-events: none;
          z-index: 0;
        }
        .og-wrap {
          max-width: 440px;
          margin: 0 auto;
          padding: 36px 24px 56px;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .og-logo {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: var(--green);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 16px 40px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(232,227,207,0.15), 0 0 0 6px rgba(232,227,207,0.06);
          overflow: hidden;
        }
        .og-logo img {
          width: 404px;
          height: 224px;
          object-fit: cover;
          opacity: 1;
        }
        .og-h1 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 500;
          font-size: 38px;
          line-height: 1;
          margin: 24px 0 4px;
          text-align: center;
        }
        .og-h1 em {
          font-style: italic;
          color: var(--cream);
          display: block;
        }
        .og-subtitle {
          font-size: 10px;
          letter-spacing: 0.55em;
          text-transform: uppercase;
          color: var(--cream-dim);
          margin: 8px 0 0;
          text-align: center;
        }
        .og-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 22px 0 10px;
          width: 60%;
        }
        .og-divider .line { flex: 1; height: 1px; background: var(--cream-line); }
        .og-divider .leaf { width: 22px; height: 22px; color: var(--cream-dim); flex: 0 0 auto; }
        .og-tagline {
          text-align: center;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 17px;
          color: var(--cream-dim);
          line-height: 1.5;
          margin: 0 0 28px;
          max-width: 320px;
        }
        .og-links {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .og-lnk {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          background: var(--cream);
          color: var(--green-deep);
          border-radius: 10px;
          text-decoration: none;
          font-family: 'Manrope', sans-serif;
          font-weight: 500;
          font-size: 14px;
          box-shadow: 0 8px 20px -10px rgba(0,0,0,0.4);
          transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
          position: relative;
          overflow: hidden;
        }
        .og-lnk:hover, .og-lnk:focus-visible {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px -10px rgba(0,0,0,0.5);
        }
        .og-lnk:active { transform: translateY(0); }
        .og-icon {
          flex: 0 0 auto;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--green);
          color: var(--cream);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .og-icon svg { width: 20px; height: 20px; }
        .og-body { flex: 1 1 auto; min-width: 0; line-height: 1.2; }
        .og-body .label { display: block; font-size: 14px; font-weight: 600; color: var(--green-deep); }
        .og-body .meta { display: block; font-size: 11px; opacity: 0.7; margin-top: 2px; font-weight: 400; }
        .og-arr { flex: 0 0 auto; opacity: 0.5; }
        .og-arr svg { width: 16px; height: 16px; }
        .og-lnk.ghost {
          background: transparent;
          color: var(--cream);
          box-shadow: inset 0 0 0 1px var(--cream-line);
        }
        .og-lnk.ghost .og-icon { background: var(--cream); color: var(--green-deep); }
        .og-lnk.ghost .og-body .label { color: var(--cream); }
        .og-lnk.ghost .og-body .meta { color: var(--cream-dim); }
        .og-lnk.ghost:hover { background: rgba(232,227,207,0.06); }
        .og-section-label {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 22px 0 10px;
          font-size: 9.5px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: var(--cream-dim);
        }
        .og-section-label .ln { flex: 1; height: 1px; background: var(--cream-line); }
        .og-lnk.primary {
          background: var(--green);
          color: var(--cream);
          box-shadow: 0 12px 28px -10px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(232,227,207,0.1);
        }
        .og-lnk.primary .og-icon { background: var(--cream); color: var(--green-deep); }
        .og-lnk.primary .og-body .label { color: var(--cream); }
        .og-lnk.primary .og-body .meta { color: var(--cream-dim); }
        .og-hours {
          width: 100%;
          margin-top: 22px;
          padding: 16px 18px;
          border-radius: 10px;
          background: rgba(232,227,207,0.06);
          box-shadow: inset 0 0 0 1px var(--cream-line);
          font-size: 12px;
          line-height: 1.7;
        }
        .og-hours .row { display: flex; justify-content: space-between; }
        .og-hours .row span:first-child { color: var(--cream-dim); letter-spacing: 0.05em; }
        .og-hours .row span:last-child { color: var(--cream); font-variant-numeric: tabular-nums; }
        .og-hours h4 {
          margin: 0 0 8px;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-weight: 500;
          font-size: 16px;
          color: var(--cream);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .og-hours h4::after { content: ''; flex: 1; height: 1px; background: var(--cream-line); }
        .og-open-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #8fd07a;
          box-shadow: 0 0 0 3px rgba(143,208,122,0.2);
          animation: og-pulse 2s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes og-pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(143,208,122,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(143,208,122,0); }
        }
        .og-footer {
          margin-top: 36px;
          text-align: center;
          font-size: 10px;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: var(--cream-dim);
        }
        .og-footer .heart { color: #d97a8a; }
        .og-footer p { margin: 4px 0; }
        @media (max-width: 360px) {
          .og-logo { width: 160px; height: 160px; }
          .og-h1 { font-size: 32px; }
          .og-wrap { padding: 28px 18px 40px; }
        }
      `}</style>

      <div className="og-root">
        <div className="og-border" />

        <div className="og-wrap">
          <div className="og-logo">
            <img src="/optom_gulbozor/logo.png" alt="Optom Gulbozor logo" />
          </div>

          <h1 className="og-h1">Optom <em>Gulbozor</em></h1>
          <div className="og-subtitle">SINCE · 2026</div>

          <div className="og-divider">
            <span className="line" />
            <svg className="leaf" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M12 3 C 7 8, 7 16, 12 21 C 17 16, 17 8, 12 3 Z"/>
              <path d="M12 5 L 12 21" strokeWidth="0.8"/>
            </svg>
            <span className="line" />
          </div>

          <p className="og-tagline">Tabiiy gullar, ishonchli yetkazib berish — Toshkentning yuragida.</p>

          {/* Aloqa */}
          <div className="og-section-label">
            <span className="ln" /><span>ALOQA</span><span className="ln" />
          </div>

          <div className="og-links">
            <a className="og-lnk primary" href="tel:+998974760909">
              <span className="og-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </span>
              <div className="og-body">
                <span className="label">Bog'lanish · Qo'ng'iroq</span>
                <span className="meta">+998 97 476 09 09</span>
              </div>
              <span className="og-arr">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </span>
            </a>

            <a className="og-lnk" href="https://t.me/+998974760909" target="_blank" rel="noopener noreferrer">
              <span className="og-icon" style={{ background: '#229ED9', color: '#fff' }}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.94 4.34c-.13-.55-.6-.94-1.16-.99a2.7 2.7 0 0 0-1.18.16L3.13 9.93c-.81.32-1.18 1.21-.83 2.01.18.4.51.7.91.85l4.04 1.36 1.6 5.04c.18.56.83.83 1.36.55l2.39-1.27 4.27 3.13c.66.49 1.6.18 1.83-.6l3.34-15.86c.04-.27.04-.54-.1-.8zM10.06 16.6l-.6-3.86 8.79-7.86-8.19 11.72z"/>
                </svg>
              </span>
              <div className="og-body">
                <span className="label">Telegram</span>
                <span className="meta">Yozish · +998 97 476 09 09</span>
              </div>
              <span className="og-arr">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </span>
            </a>

            <a className="og-lnk" href="https://t.me/+WCHvPonLq58xYzEy" target="_blank" rel="noopener noreferrer">
              <span className="og-icon" style={{ background: '#229ED9', color: '#fff' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11l18-7-3 17-7-4-3 5-1-7 13-9-15 8z"/>
                  <circle cx="18" cy="6" r="3" fill="#d97a8a" stroke="none"/>
                  <path d="M16.5 6h3M18 4.5v3" stroke="#fff" strokeWidth="1.4"/>
                </svg>
              </span>
              <div className="og-body">
                <span className="label">Telegram kanal</span>
                <span className="meta">Yangiliklar · aksiya · yangi gullar</span>
              </div>
              <span className="og-arr">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </span>
            </a>

            <a className="og-lnk" href="https://www.instagram.com/optom__gulbozor/" target="_blank" rel="noopener noreferrer">
              <span className="og-icon" style={{ background: 'linear-gradient(135deg,#feda75,#fa7e1e 30%,#d62976 60%,#962fbf 80%,#4f5bd5)', color: '#fff' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
                </svg>
              </span>
              <div className="og-body">
                <span className="label">Instagram</span>
                <span className="meta">@optom__gulbozor</span>
              </div>
              <span className="og-arr">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </span>
            </a>
          </div>

          {/* Manzil */}
          <div className="og-section-label">
            <span className="ln" /><span>MANZIL</span><span className="ln" />
          </div>

          <div className="og-links">
            <a className="og-lnk ghost" href="https://www.google.com/maps/place/41%C2%B023'05.6%22N+69%C2%B017'37.7%22E/@41.384886,69.293797,16z" target="_blank" rel="noopener noreferrer">
              <span className="og-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s-7-7.58-7-13a7 7 0 1 1 14 0c0 5.42-7 13-7 13z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
              </span>
              <div className="og-body">
                <span className="label">Uch qahramon Gul Bozori</span>
                <span className="meta">Google Maps · yo'nalish olish</span>
              </div>
              <span className="og-arr">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M9 7h8v8"/></svg>
              </span>
            </a>
          </div>

          {/* Ish vaqti */}
          <div className="og-hours">
            <h4><span className="og-open-dot" /> Hozir ochiq · Ish vaqti</h4>
            <div className="row"><span>Dushanba — Juma</span><span>08:00 — 22:00</span></div>
            <div className="row"><span>Shanba — Yakshanba</span><span>09:00 — 23:00</span></div>
            <div className="row"><span>Yetkazib berish</span><span>24 / 7</span></div>
          </div>

          <footer className="og-footer">
            <p>© 2026 · OPTOM GULBOZOR</p>
            <p>Toshkent uchun · <span className="heart">♥</span> bilan tayyorlandi</p>
          </footer>
        </div>
      </div>
    </>
  );
};
