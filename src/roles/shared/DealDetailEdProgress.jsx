import React from 'react';

export function DealDetailEdCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function DealDetailEdHourglass() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export default function DealDetailEdProgress({
  steps,
  pct,
  stageNum,
  stageTotal,
  lineWidth,
  cancelled,
}) {
  return (
    <section className="ed-card">
      <div className="ed-prog-head">
        <h3 className="ed-prog-title">Прогресс сделки</h3>
        <div className="ed-prog-pct">
          {cancelled ? (
            <span className="ed-prog-cancelled">Сделка отменена</span>
          ) : (
            <>
              <b>{pct}%</b>
              {' · '}
              этап {stageNum} из {stageTotal}
            </>
          )}
        </div>
      </div>
      <div className="ed-steps">
        <div className="ed-line-bg" />
        <div className="ed-line-fg" style={{ width: lineWidth }} />
        {steps.map((s, i) => (
          <div key={i} className={`ed-step ${s.state}`}>
            <div className="ed-step-dot">
              {s.state === 'done' ? <DealDetailEdCheck /> : null}
              {s.state === 'cancel' ? <span className="ed-step-x">✕</span> : null}
            </div>
            <div>
              <div className="ed-step-lbl">{s.label}</div>
              <div className="ed-step-time">{s.time}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
