import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOpenJobRequestsForWorker, createJobOffer, getMyDeals, getCategories } from '../api';
import { useAuth } from '../context/AuthContext';
import './FindWorkPage.css';

const DEAL_ST = {
  NEW:{l:'Новая',c:'st-new'}, IN_PROGRESS:{l:'В работе',c:'st-prog'},
  COMPLETED:{l:'Выполнена',c:'st-done'}, CANCELLED:{l:'Отменена',c:'st-fail'},
};

export default function FindWorkPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('feed');
  const [requests, setRequests] = useState([]);
  const [deals, setDeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState('ALL');
  const [detail, setDetail] = useState(null);

  // Offer form
  const [useClientPrice, setUseClientPrice] = useState(true);
  const [customPrice, setCustomPrice] = useState('');
  const [comment, setComment] = useState('');
  const [days, setDays] = useState('');
  const [offerStatus, setOfferStatus] = useState('idle');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reqs, myDeals, cats] = await Promise.all([
        getOpenJobRequestsForWorker(userId),
        getMyDeals(userId).catch(() => []),
        getCategories(),
      ]);
      setRequests(reqs); setDeals(myDeals); setCategories(cats);
    } catch {}
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const catName = (id) => categories.find(c => c.id === id)?.name || '';
  const feedCats = [...new Set(requests.map(r => r.categoryId))];
  const filtered = catFilter === 'ALL' ? requests : requests.filter(r => r.categoryId === catFilter);

  const openDetail = (req) => {
    setDetail(req);
    setUseClientPrice(!!req.budgetTo);
    setCustomPrice(req.budgetTo ? String(req.budgetTo) : '');
    setComment('');
    setDays('');
    setOfferStatus('idle');
  };

  const getFinalPrice = () => {
    if (useClientPrice && detail?.budgetTo) return Number(detail.budgetTo);
    return customPrice ? Number(customPrice) : 0;
  };

  const handleSend = async () => {
    const price = getFinalPrice();
    if (!price || !detail) return;
    setOfferStatus('sending');
    try {
      await createJobOffer(userId, detail.id, {
        price,
        comment: comment || (useClientPrice ? 'Согласен на вашу цену. Готов выполнить!' : 'Предлагаю свою цену. Готов обсудить.'),
        estimatedDays: days ? Number(days) : null,
      });
      setOfferStatus('done');
      setRequests(prev => prev.filter(r => r.id !== detail.id));
    } catch { setOfferStatus('error'); }
  };

  const timeAgo = (d) => {
    if (!d) return '';
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 60) return `${m} мин. назад`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ч. назад`;
    const dd = Math.floor(h / 24);
    return dd === 1 ? 'вчера' : `${dd} дн. назад`;
  };

  // ═══ DETAIL VIEW ═══
  if (detail) {
    const clientPrice = detail.budgetTo ? Number(detail.budgetTo) : 0;
    const customerId =
      detail.customerId ||
      detail.customerUserId ||
      detail.ownerId ||
      detail.userId ||
      null;

    return (
      <div className="fw-dp">
        <div className="container">
          <button className="fw-back" onClick={() => setDetail(null)}>← Назад к заявкам</button>

          <div className="fw-dl">
            {/* Left: request info */}
            <div className="fw-dm">
              <div className="fw-dc">
                <div className="fw-dc-cat">{catName(detail.categoryId)}</div>
                <h1 className="fw-dc-title">{detail.title}</h1>

                {clientPrice > 0 && (
                  <div className="fw-dc-price-block">
                    <div className="fw-dc-price-label">Предварительная цена клиента</div>
                    <div className="fw-dc-price">{clientPrice.toLocaleString('ru-RU')} ₽</div>
                  </div>
                )}
                {!clientPrice && (
                  <div className="fw-dc-price-block">
                    <div className="fw-dc-price-label">Цена</div>
                    <div className="fw-dc-price fw-dc-price-dog">Договорная</div>
                  </div>
                )}

                <div className="fw-dc-meta">
                  {detail.addressText && <div>📍 {detail.addressText}</div>}
                  {detail.city && <div>🏙 {detail.city}</div>}
                  {detail.createdAt && <div>🕐 {timeAgo(detail.createdAt)}</div>}
                </div>

                {detail.description && detail.description !== 'Без описания' && (
                  <>
                    <div className="fw-dc-sep" />
                    <h3 className="fw-dc-sub">Описание</h3>
                    <p className="fw-dc-desc">{detail.description}</p>
                  </>
                )}
              </div>
            </div>

            {/* Right: action panel */}
            <div className="fw-ds">
              {offerStatus === 'done' ? (
                <div className="fw-sc fw-sc-ok">
                  <span>✅</span>
                  <h3>Отклик отправлен!</h3>
                  <p>Заказчик увидит ваше предложение и решит</p>
                  <button className="fw-b fw-b-p" onClick={() => setDetail(null)}>Вернуться к ленте</button>
                </div>
              ) : (
                <div className="fw-sc">
                  <h3 className="fw-sc-t">Взять заказ</h3>

                  {/* Price choice */}
                  {clientPrice > 0 && (
                    <div className="fw-price-choice">
                      <button className={`fw-pc-btn ${useClientPrice ? 'active' : ''}`}
                        onClick={() => setUseClientPrice(true)}>
                        ✅ Согласен — {clientPrice.toLocaleString('ru-RU')} ₽
                      </button>
                      <button className={`fw-pc-btn ${!useClientPrice ? 'active' : ''}`}
                        onClick={() => setUseClientPrice(false)}>
                        ✏️ Предложить свою цену
                      </button>
                    </div>
                  )}

                  {/* Custom price input */}
                  {(!useClientPrice || !clientPrice) && (
                    <div className="fw-f">
                      <label>Ваша цена, ₽</label>
                      <input type="number" placeholder="Сколько возьмёте за работу"
                        value={customPrice} onChange={e => setCustomPrice(e.target.value)} />
                    </div>
                  )}

                  <div className="fw-f">
                    <label>Срок выполнения (дней)</label>
                    <input type="number" placeholder="Не обязательно"
                      value={days} onChange={e => setDays(e.target.value)} />
                  </div>

                  <div className="fw-f">
                    <label>Сообщение заказчику</label>
                    <textarea placeholder={useClientPrice && clientPrice
                      ? 'Здравствуйте! Согласен на вашу цену, готов приступить…'
                      : 'Здравствуйте! Предлагаю свою цену, потому что…'}
                      value={comment} onChange={e => setComment(e.target.value)} />
                  </div>

                  {/* Summary */}
                  <div className="fw-summary">
                    <div className="fw-summary-label">Итого ваш отклик:</div>
                    <div className="fw-summary-price">
                      {getFinalPrice() > 0 ? `${getFinalPrice().toLocaleString('ru-RU')} ₽` : 'Укажите цену'}
                    </div>
                    {useClientPrice && clientPrice > 0 && (
                      <div className="fw-summary-note">Вы соглашаетесь на цену клиента</div>
                    )}
                    {!useClientPrice && customPrice && clientPrice > 0 && Number(customPrice) !== clientPrice && (
                      <div className="fw-summary-note fw-summary-diff">
                        {Number(customPrice) < clientPrice
                          ? `Дешевле на ${(clientPrice - Number(customPrice)).toLocaleString('ru-RU')} ₽`
                          : `Дороже на ${(Number(customPrice) - clientPrice).toLocaleString('ru-RU')} ₽`
                        }
                      </div>
                    )}
                  </div>

                  {offerStatus === 'error' && <div className="fw-err">Не удалось отправить. Попробуйте ещё раз.</div>}

                  <button className="fw-b fw-b-p" disabled={getFinalPrice() <= 0 || offerStatus === 'sending'}
                    onClick={handleSend}>
                    {offerStatus === 'sending' ? 'Отправляем…'
                      : useClientPrice && clientPrice ? '✅ Взять за ' + clientPrice.toLocaleString('ru-RU') + ' ₽'
                      : '📤 Отправить предложение'}
                  </button>

                  <button
                    className="fw-b fw-b-chat"
                    onClick={() => {
                      if (customerId) navigate(`/chat/${customerId}?jobRequestId=${detail.id}`);
                      else navigate('/chat');
                    }}
                  >
                    💬 Написать заказчику
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══ LIST VIEW ═══
  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1>Найти работу</h1>
          <p>Открытые заявки в Йошкар-Оле</p>
        </div>
      </div>
      <div className="container">
        <div className="fw-tabs">
          <button className={`fw-tab ${tab==='feed'?'active':''}`} onClick={() => setTab('feed')}>
            Заявки {requests.length > 0 && <span className="fw-tab-num">{requests.length}</span>}
          </button>
          <button className={`fw-tab ${tab==='deals'?'active':''}`} onClick={() => setTab('deals')}>
            Мои сделки {deals.length > 0 && <span className="fw-tab-num">{deals.length}</span>}
          </button>
        </div>

        {tab === 'feed' && (
          <div>
            {feedCats.length > 0 && (
              <div className="fw-cats">
                <button className={`fw-cat ${catFilter==='ALL'?'active':''}`} onClick={() => setCatFilter('ALL')}>Все</button>
                {feedCats.map(id => (
                  <button key={id} className={`fw-cat ${catFilter===id?'active':''}`} onClick={() => setCatFilter(id)}>
                    {catName(id)}
                  </button>
                ))}
              </div>
            )}
            {loading ? (
              <div className="fw-grid">{[1,2,3,4].map(i => <div key={i} className="fw-skel skeleton" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="card empty-state"><span className="empty-state-icon">🔍</span><h3>Заявок нет</h3><p>Новые появятся здесь</p></div>
            ) : (
              <div className="fw-grid">
                {filtered.map((req, i) => {
                  const price = req.budgetTo ? Number(req.budgetTo) : 0;
                  return (
                    <div key={req.id} className="fw-card fade-up" style={{animationDelay:`${i*0.04}s`}} onClick={() => openDetail(req)}>
                      <div className="fw-card-cat">{catName(req.categoryId)}</div>
                      <h3 className="fw-card-title">{req.title}</h3>
                      <div className="fw-card-price-row">
                        {price > 0 ? (
                          <>
                            <div className="fw-card-price">{price.toLocaleString('ru-RU')} ₽</div>
                            <div className="fw-card-price-hint">предв. цена</div>
                          </>
                        ) : (
                          <div className="fw-card-price fw-card-price-dog">Договорная</div>
                        )}
                      </div>
                      {req.description && req.description !== 'Без описания' && (
                        <p className="fw-card-desc">{req.description}</p>
                      )}
                      <div className="fw-card-bottom">
                        {req.addressText && <span>📍 {req.addressText}</span>}
                        <span>{timeAgo(req.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'deals' && (
          <div>
            {deals.length === 0 ? (
              <div className="card empty-state"><span className="empty-state-icon">🤝</span><h3>Сделок нет</h3><p>Откликайтесь на заявки</p></div>
            ) : (
              <div className="fw-deals">{deals.map((d,i) => {
                const st = DEAL_ST[d.status]||{l:d.status,c:'st-new'};
                return (
                  <div key={d.id} className="fw-deal fade-up" style={{animationDelay:`${i*0.04}s`}}
                    onClick={() => navigate('/deals')}>
                    <div className="fw-deal-row">
                      <div className="fw-deal-info">
                        <h3 className="fw-deal-title">{d.title || 'Задача'}</h3>
                        <div className="fw-deal-meta">
                          {d.category && <span>🏷 {d.category}</span>}
                          <span>👤 {d.customerName || 'Заказчик'}</span>
                          <span>{timeAgo(d.createdAt)}</span>
                        </div>
                      </div>
                      <div className="fw-deal-right">
                        <span className={`fw-deal-st ${st.c}`}>{st.l}</span>
                        <div className="fw-deal-price">{d.agreedPrice?`${Number(d.agreedPrice).toLocaleString('ru-RU')} ₽`:'—'}</div>
                      </div>
                    </div>
                    {d.status === 'IN_PROGRESS' && (
                      <div className="fw-deal-prog">
                        <span className={d.customerConfirmed ? 'fw-chk-ok' : 'fw-chk-wait'}>
                          {d.customerConfirmed ? '✅' : '⏳'} Заказчик
                        </span>
                        <span className={d.workerConfirmed ? 'fw-chk-ok' : 'fw-chk-wait'}>
                          {d.workerConfirmed ? '✅' : '⏳'} Мастер
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}