import React, { useMemo, useState } from 'react';

const LIP_CSS = `
  .lip-wrap { display: flex; flex-direction: column; gap: 12px; }
  .lip-wrap--merged { gap: 0; }
  .lip-section {
    background: #fff;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.07);
    padding: 20px 22px;
  }
  .lip-section--merged {
    border-radius: 6px;
    border: 1px solid #d1d5db;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.07);
    padding: 20px 22px;
  }
  .lip-merge-divider {
    height: 1px; background: #f0f0f0; margin: 18px 0 16px;
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

  /* Вариант как экран детали заявки (Найти работу) */
  .lip-wrap--job { gap: 0; }
  .lip-section--job {
    background: #fff; border-radius: 12px; padding: 20px 24px; margin-bottom: 16px;
    border: none;
  }
  .lip-section--job:last-of-type { margin-bottom: 0; }
  .lip-wrap--job .lip-h {
    font-size: 18px; font-weight: 800; color: #111827; letter-spacing: -0.02em;
    margin: 0 0 12px;
  }
  .lip-wrap--job .lip-desc { font-size: 15px; color: #374151; line-height: 1.7; }
  .lip-wrap--job .lip-row {
    padding: 12px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px;
  }
  .lip-wrap--job .lip-row dt { font-weight: 500; color: #9ca3af; min-width: 90px; }
  .lip-wrap--job .lip-row:last-child { border-bottom: none; }
  .lip-wrap--job .lip-section--job + .lip-section--job .lip-h { margin-bottom: 16px; }
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
  /** Одна карточка вместо двух отдельных блоков */
  mergedSections = false,
  /** Карточки как на детали заявки (отдельные блоки, типографика) */
  variant = 'default',
  /** Подпись строки цены в подробностях */
  budgetDtLabel = 'Бюджет',
}) {
  const [expanded, setExpanded] = useState(false);
  const { bodyText, urgencyLabel } = useMemo(() => parseListingDescription(description || ''), [description]);

  const pubStr = publishedAt
    ? new Date(publishedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const showToggle = bodyText.length > COLLAPSE;
  const visibleBody = !expanded && showToggle ? `${bodyText.slice(0, COLLAPSE).trim()}…` : bodyText;

  const descBlock = (
    <>
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
    </>
  );

  const detailsBlock = (
    <>
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
          <dt>{budgetDtLabel}</dt>
          <dd>{budgetLabel || '—'}</dd>
        </div>
        <div className="lip-row">
          <dt>Опубликована</dt>
          <dd>{pubStr}</dd>
        </div>
      </dl>
    </>
  );

  const jobDetail = variant === 'jobDetail';
  const sectionClass = jobDetail ? 'lip-section lip-section--job' : 'lip-section';
  const wrapClass = jobDetail ? 'lip-wrap lip-wrap--job' : 'lip-wrap';

  return (
    <>
      <style>{LIP_CSS}</style>
      {mergedSections ? (
        <div className="lip-wrap lip-wrap--merged">
          <section className="lip-section lip-section--merged">
            {descBlock}
            <div className="lip-merge-divider" />
            {detailsBlock}
          </section>
        </div>
      ) : (
        <div className={wrapClass}>
          <section className={sectionClass}>{descBlock}</section>
          <section className={sectionClass}>{detailsBlock}</section>
        </div>
      )}
    </>
  );
}
