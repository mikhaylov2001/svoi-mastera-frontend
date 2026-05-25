import React from 'react';

export const DEAL_STEPS = ['Создана', 'Принята', 'В работе', 'Подтверждение', 'Завершена'];

export function dealStepIndex(status) {
  if (status === 'NEW') return 1;
  if (status === 'IN_PROGRESS') return 3;
  if (status === 'COMPLETED') return 4;
  return -1;
}

export function DealDarkProgress({ deal }) {
  const stepIdx = dealStepIndex(deal.status);
  const isCompleted = deal.status === 'COMPLETED';
  const progress = stepIdx < 0 ? 0 : Math.round((stepIdx / (DEAL_STEPS.length - 1)) * 100);
  const progressColor = isCompleted ? '#2dd4a8' : '#e8410a';
  const progressRingTrack = 'rgba(255, 214, 196, .12)';
  const stageLabel = isCompleted
    ? 'Сделка завершена 🎉'
    : deal.status === 'CANCELLED'
      ? 'Сделка отменена'
      : DEAL_STEPS[Math.max(0, stepIdx)];

  return (
    <div className="mo-progress-card">
      <div className="mo-progress-card-header">
        <div>
          <div className="mo-progress-card-label">Прогресс сделки</div>
          <div className="mo-progress-card-title">{stageLabel}</div>
        </div>
        <div
          className="mo-progress-ring"
          style={{ background: `conic-gradient(${progressColor} ${progress * 3.6}deg, ${progressRingTrack} 0deg)` }}
        >
          <div className="mo-progress-ring-inner" style={{ color: isCompleted ? '#6ee7b7' : '#ff8a5b' }}>
            {progress}%
          </div>
        </div>
      </div>
      <div className="mo-timeline">
        {DEAL_STEPS.map((s, i) => {
          const done = stepIdx >= 0 && i < stepIdx;
          const curr = i === stepIdx;
          const future = i > stepIdx;
          const isLast = i === DEAL_STEPS.length - 1;
          return (
            <div key={s} className="mo-timeline-item">
              <div className="mo-timeline-track">
                <div
                  className="mo-timeline-dot"
                  style={{
                    background: done
                      ? 'linear-gradient(135deg,#2dd4a8,#16a34a)'
                      : curr
                        ? (isCompleted ? 'linear-gradient(135deg,#2dd4a8,#16a34a)' : 'linear-gradient(135deg,#ff642f,#e8410a)')
                        : 'rgba(255,214,196,.08)',
                    boxShadow: curr ? `0 0 0 4px ${isCompleted ? 'rgba(45,212,168,.22)' : 'rgba(232,65,10,.28)'}` : 'none',
                    color: done || curr ? '#fff' : 'rgba(255,206,180,.35)',
                  }}
                >
                  {done ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                  ) : curr ? (
                    <svg width="8" height="8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="white" /></svg>
                  ) : (
                    i + 1
                  )}
                </div>
                {!isLast && (
                  <div
                    className="mo-timeline-line"
                    style={{ background: done ? 'linear-gradient(180deg,#2dd4a8,rgba(232,65,10,.35))' : 'rgba(255,214,196,.08)' }}
                  />
                )}
              </div>
              <div style={{ paddingBottom: isLast ? 0 : 18, paddingTop: 7 }}>
                <div className={`mo-timeline-step-name${future ? ' future' : ''}`}>{s}</div>
                <div
                  className={`mo-timeline-step-sub ${done ? 'mo-timeline-step-sub--done' : curr ? 'mo-timeline-step-sub--curr' : 'mo-timeline-step-sub--future'}`}
                >
                  {done ? '✓ Выполнено' : curr ? 'Текущий этап' : '—'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConfirmPartyRows({ parties }) {
  return (
    <div className="mo-confirm-parties">
      {parties.map((p, i) => (
        <div
          key={i}
          className={`mo-confirm-party ${p.confirmed ? 'mo-confirm-party--ok' : 'mo-confirm-party--wait'}`}
        >
          <div className={`mo-confirm-party-icon ${p.confirmed ? 'mo-confirm-party-icon--ok' : 'mo-confirm-party-icon--wait'}`}>
            {p.confirmed ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
            ) : (
              p.icon
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div className="mo-confirm-party-name">{p.name}</div>
            <div className={p.confirmed ? 'mo-confirm-party-sub--ok' : 'mo-confirm-party-sub--wait'}>{p.sub}</div>
          </div>
          <div
            className={p.confirmed ? 'mo-confirm-dot--ok' : 'mo-confirm-dot--wait'}
            style={{
              width: 18, height: 18, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            {p.confirmed && (
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** @param {'customer'|'worker'} viewAs */
export function DealConfirmCard({
  viewAs = 'customer',
  customerOk,
  workerOk,
  actionId,
  dealId,
  onComplete,
  onCancelActive,
}) {
  const isWorker = viewAs === 'worker';
  const myOk = isWorker ? workerOk : customerOk;
  const otherOk = isWorker ? customerOk : workerOk;

  const parties = isWorker
    ? [
        { name: 'Заказчик', sub: customerOk ? '✓ Подтверждено' : 'Ожидает подтверждения', confirmed: customerOk, icon: '👤' },
        { name: 'Мастер (вы)', sub: workerOk ? '✓ Подтверждено' : 'Ожидает вашего действия', confirmed: workerOk, icon: '🔧' },
      ]
    : [
        { name: 'Заказчик (вы)', sub: customerOk ? '✓ Подтверждено' : 'Ожидает вашего действия', confirmed: customerOk, icon: '👤' },
        { name: 'Мастер', sub: workerOk ? '✓ Подтверждено' : 'Ожидает подтверждения', confirmed: workerOk, icon: '🔧' },
      ];

  const title = myOk ? 'Ваш голос учтён!' : 'Работа выполнена?';
  const lead = myOk
    ? (isWorker ? 'Ожидаем подтверждения от заказчика' : 'Ожидаем подтверждения от мастера')
    : (isWorker ? 'Подтвердите, что задача выполнена' : 'Подтвердите, что мастер выполнил задачу');
  const waitSub = isWorker ? 'Ожидаем заказчика…' : 'Ожидаем мастера…';
  const cancelLabel = isWorker ? 'Отказаться от сделки' : 'Отменить сделку в работе';

  return (
    <div className="mo-confirm-card mo-confirm-card--dark">
      <div className="mo-confirm-accent" style={{ background: myOk ? 'linear-gradient(90deg,#2dd4a8,#16a34a)' : 'linear-gradient(90deg,#e8410a,#ff7043)' }} />
      <div className="mo-confirm-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div
            className="mo-confirm-icon"
            style={{
              background: myOk ? 'linear-gradient(135deg,#2dd4a8,#16a34a)' : 'linear-gradient(135deg,#ff642f,#e8410a)',
              boxShadow: `0 4px 14px ${myOk ? 'rgba(45,212,168,.28)' : 'rgba(232,65,10,.32)'}`,
            }}
          >
            {myOk ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            )}
          </div>
          <div>
            <div className={`mo-confirm-kicker ${myOk ? 'mo-confirm-kicker--ok' : 'mo-confirm-kicker--wait'}`}>
              Подтверждение
            </div>
            <div className="mo-confirm-title">{title}</div>
          </div>
        </div>
        <div className="mo-confirm-lead">{lead}</div>
      </div>
      <ConfirmPartyRows parties={parties} />
      <div className="mo-confirm-cta">
        {!myOk ? (
          <button type="button" className="mo-confirm-btn" disabled={actionId === dealId} onClick={() => onComplete(dealId)}>
            {actionId === dealId ? 'Подтверждаем…' : '✓ Подтвердить выполнение'}
          </button>
        ) : !otherOk ? (
          <div className="mo-confirm-banner mo-confirm-banner--wait">
            <div style={{ fontSize: 24 }}>⏳</div>
            <div>
              <div className="mo-confirm-banner-title">Вы подтвердили!</div>
              <div className="mo-confirm-banner-sub">{waitSub}</div>
            </div>
          </div>
        ) : (
          <div className="mo-confirm-banner mo-confirm-banner--done">
            <div style={{ fontSize: 24 }}>🎉</div>
            <div><div className="mo-confirm-banner-title">Обе стороны подтвердили!</div></div>
          </div>
        )}
        <button type="button" className="mo-cancel-btn mo-cancel-btn--dark" onClick={onCancelActive}>{cancelLabel}</button>
      </div>
    </div>
  );
}

/** @param {'customer'|'worker'} viewAs */
export function DealNewStatusCard({
  viewAs = 'customer',
  actionId,
  dealId,
  chatUserId,
  onAccept,
  onCancel,
  onChat,
}) {
  const isWorker = viewAs === 'worker';

  return (
    <div className="mo-confirm-card mo-confirm-card--dark">
      <div className="mo-confirm-accent" style={{ background: 'linear-gradient(90deg,#e8410a,#ff7043)' }} />
      <div className="mo-confirm-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div className="mo-confirm-icon" style={{ background: 'linear-gradient(135deg,#ff642f,#e8410a)', boxShadow: '0 4px 14px rgba(232,65,10,.32)' }}>
            {isWorker ? '📋' : '⏳'}
          </div>
          <div>
            <div className="mo-confirm-kicker mo-confirm-kicker--warn">Статус</div>
            <div className="mo-confirm-title">{isWorker ? 'Новый заказ' : 'Ждём мастера'}</div>
          </div>
        </div>
        <div className="mo-confirm-lead">
          {isWorker
            ? 'Заказчик выбрал вас. Примите заказ — он перейдёт в работу.'
            : 'Вы выбрали мастера. После подтверждения заказ перейдёт в работу.'}
        </div>
      </div>
      <div className="mo-confirm-cta">
        {isWorker ? (
          <>
            <button
              type="button"
              className="mo-confirm-btn"
              disabled={actionId === dealId}
              onClick={() => onAccept(dealId)}
            >
              {actionId === dealId ? '⏳ Принимаем…' : '✅ Принять заказ'}
            </button>
            {chatUserId ? (
              <button type="button" className="mo-master-btn mo-master-btn--dark" style={{ marginTop: 0, minHeight: 46 }} onClick={onChat}>
                💬 Уточнить детали
              </button>
            ) : null}
            <button type="button" className="mo-cancel-btn mo-cancel-btn--dark" onClick={onCancel}>
              Отказаться от заказа
            </button>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'rgba(255,206,180,.45)', lineHeight: 1.45, textAlign: 'center' }}>
              Можно отказаться до принятия — заказчик выберет другого мастера
            </p>
          </>
        ) : (
          <>
            {chatUserId ? (
              <button type="button" className="mo-master-btn mo-master-btn--dark" style={{ marginTop: 0, minHeight: 46 }} onClick={onChat}>
                💬 Написать мастеру
              </button>
            ) : null}
            <button type="button" className="mo-cancel-btn mo-cancel-btn--dark" onClick={onCancel}>
              Отменить заявку
            </button>
          </>
        )}
      </div>
    </div>
  );
}
