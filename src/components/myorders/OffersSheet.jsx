import React, { useEffect } from 'react';
import { timeAgo } from './OrderCard';

export default function OffersSheet({ order, onClose, onAccept }) {
  const offers = order.offers || [];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      <div className="mo-sheet-overlay" onClick={onClose} />

      <div className="mo-sheet">
        <div className="mo-sheet-handle">
          <div className="mo-sheet-handle-bar" />
        </div>

        <div className="mo-sheet-head">
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#111' }}>Отклики</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>{order.title}</p>
          </div>
          <button className="mo-sheet-close" onClick={onClose}>✕</button>
        </div>

        <div className="mo-sheet-badge">
          {offers.length} {offers.length === 1 ? 'отклик' : offers.length < 5 ? 'отклика' : 'откликов'}
        </div>

        <div className="mo-sheet-list">
          {offers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔔</div>
              <div style={{ fontWeight: 700 }}>Откликов пока нет</div>
              <div style={{ fontSize: 13, marginTop: 6, color: '#aaa' }}>Мастера увидят вашу заявку и откликнутся</div>
            </div>
          ) : (
            offers.map((offer, i) => {
              const name = offer.name || offer.workerName || 'Мастер';
              const initial = offer.initial || name[0] || 'М';
              const price = offer.price
                ? `${Number(offer.price).toLocaleString('ru-RU')} ₽`
                : offer.suggestedBudget
                  ? `${Number(offer.suggestedBudget).toLocaleString('ru-RU')} ₽`
                  : 'По договорённости';

              return (
                <div key={offer.id || i} className="mo-offer-card">
                  <div className="mo-offer-header">
                    <div className="mo-offer-avatar">
                      {offer.avatarUrl
                        ? <img src={offer.avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : initial
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: '#111' }}>{name}</span>
                        {i === 0 && <span className="mo-offer-top-badge">ТОП</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        {offer.rating && (
                          <>
                            <span style={{ color: '#f59e0b', fontSize: 12 }}>★</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>{offer.rating}</span>
                            {offer.reviews && <span style={{ fontSize: 11, color: '#999' }}>({offer.reviews} отзывов)</span>}
                            <span style={{ fontSize: 11, color: '#ccc', margin: '0 2px' }}>·</span>
                          </>
                        )}
                        <span style={{ fontSize: 11, color: '#bbb' }}>{timeAgo(offer.completedAt || offer.createdAt)}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#111' }}>{price}</div>
                    </div>
                  </div>

                  {(offer.message || offer.description) && (
                    <p className="mo-offer-msg">{offer.message || offer.description}</p>
                  )}

                  <div className="mo-offer-actions">
                    <button
                      className="mo-offer-accept"
                      onClick={() => onAccept?.(offer)}
                    >
                      Принять
                    </button>
                    <button className="mo-offer-chat">Написать</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
