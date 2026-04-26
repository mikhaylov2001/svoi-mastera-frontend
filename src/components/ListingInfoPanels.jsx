import React, { useMemo, useState } from 'react';

const LIP_CSS = `
  .lip-wrap { display: flex; flex-direction: column; gap: 12px; }
  .lip-section {
    background: #fff; border: 1px solid #e6e6e6; border-radius: 14px;
    padding: 20px 22px;
  }
  .lip-h { font-size: 15px; font-weight: 700; margin: 0 0 12px; color: #111; letter-spacing: -0.02em; }
  .lip-desc { font-size: 14px; color: #444; line-height: 1.75; margin: 0; white-space: pre-wrap; word-break: break-word; }
  .lip-urgency {
    margin-top: 14px; padding-top: 14px; border-top: 1px solid #eee;
    font-size: 14px; color: #333; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-weight: 600;
  }
  .lip-urgency span:first-child { color: #666; font-weight: 600; }
  .lip-empty { font-size: 14px; color: #bbb; font-style: italic; margin: 0; }
  .lip-toggle {
    margin-top: 10px; background: none; border: none; color: #e8410a;
    font-size: 13px; font-weight: 700; cursor: pointer; padding: 0; font-family: inherit;
  }
  .lip-toggle:hover { text-decoration: underline; }
  .lip-rows { margin: 0; }
  .lip-row {
    display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
    padding: 14px 0; border-bottom: 1px solid #eee; font-size: 14px;
  }
  .lip-row:last-child { border-bottom: none; padding-bottom: 0; }
  .lip-row dt { color: #9ca3af; font-weight: 600; flex-shrink: 0; min-width: 100px; }
  .lip-row dd { margin: 0; text-align: right; color: #111827; font-weight: 600; max-width: 62%; line-height: 1.45; }
`;

/** Убирает из текста блок «⏰ Срочность: …», добавленный при создании заявки */
export function parseListingDescription(raw) {
  if (!raw || typeof raw !== 'string') return { bodyText: '', urgencyLabel: null };
  const marker = '\n\n⏰ Срочность:';
  const i = raw.indexOf(marker);
  if (i === -1) return { bodyText: raw.trim(), urgencyLabel: null };
  const bodyText = raw.slice(0, i).trim();
  const after = raw.slice(i + marker.length).trim();
  return { bodyText, urgencyLabel: after || null };
}

const COLLAPSE = 420;

/**
 * Единый блок «Описание» + «Подробности» для карточек объявлений услуг мастера.
 */
export default function ListingInfoPanels({
  description,
  category,
  address,
  budgetLabel,
  publishedAt,
  emptyDescriptionText = 'Описание не добавлено',
}) {
  const [expanded, setExpanded] = useState(false);
  const { bodyText, urgencyLabel } = useMemo(() => parseListingDescription(description || ''), [description]);

  const pubStr = publishedAt
    ? new Date(publishedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const showToggle = bodyText.length > COLLAPSE;
  const visibleBody = !expanded && showToggle ? `${bodyText.slice(0, COLLAPSE).trim()}…` : bodyText;

  return (
    <>
      <style>{LIP_CSS}</style>
      <div className="lip-wrap">
        <section className="lip-section">
          <h2 className="lip-h">Описание</h2>
          {bodyText ? (
            <>
              <p className="lip-desc">{visibleBody}</p>
              {showToggle && (
                <button type="button" className="lip-toggle" onClick={() => setExpanded(e => !e)}>
                  {expanded ? 'Свернуть ↑' : 'Читать полностью ↓'}
                </button>
              )}
              {urgencyLabel && (
                <div className="lip-urgency">
                  <span>⏰ Срочность:</span>
                  <span>📅 {urgencyLabel.replace(/^📅\s*/, '')}</span>
                </div>
              )}
            </>
          ) : (
            <p className="lip-empty">{emptyDescriptionText}</p>
          )}
        </section>

        <section className="lip-section">
          <h2 className="lip-h">Подробности</h2>
          <dl className="lip-rows">
            <div className="lip-row">
              <dt>Категория</dt>
              <dd>{category || '—'}</dd>
            </div>
            <div className="lip-row">
              <dt>Адрес</dt>
              <dd>{address || 'Уточняется при заказе'}</dd>
            </div>
            <div className="lip-row">
              <dt>Бюджет</dt>
              <dd>{budgetLabel || '—'}</dd>
            </div>
            <div className="lip-row">
              <dt>Опубликована</dt>
              <dd>{pubStr}</dd>
            </div>
          </dl>
        </section>
      </div>
    </>
  );
}
