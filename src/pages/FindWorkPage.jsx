import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOpenJobRequestsForWorker, createJobOffer, getMyDeals, getCategories } from '../api';
import { useAuth } from '../context/AuthContext';
import './FindWorkPage.css';

const DEAL_ST = {
  NEW: { l: 'Новая', c: 'st-new' }, IN_PROGRESS: { l: 'В работе', c: 'st-prog' },
  COMPLETED: { l: 'Выполнена', c: 'st-done' }, CANCELLED: { l: 'Отменена', c: 'st-fail' },
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
  const [offerForm, setOfferForm] = useState({ price: '', comment: '', days: '' });
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
    setOfferForm({ price: req.budgetTo ? String(req.budgetTo) : '', comment: '', days: '' });
    setOfferStatus('idle');
  };

  const handleSend = async () => {
    if (!offerForm.price || !detail) return;
    setOfferStatus('sending');
    try {
      await createJobOffer(userId, detail.id, {
        price: Number(offerForm.price),
        comment: offerForm.comment,
        estimatedDays: offerForm.days ? Number(offerForm.days) : null,
      });
      setOfferStatus('done');
      setRequests(prev => prev.filter(r => r.id !== detail.id));
    } catch { setOfferStatus('error'); }
  };

  // Send first message and navigate to chat
  const handleChat = async (req) => {
    // We need the customer's userId — it's not in the jobRequest DTO from backend.
    // For now, navigate to chat and let user send from there.
    // TODO: backend should include customerId in JobRequestDto
    navigate('/chat');
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} мин. назад`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ч. назад`;
    const days = Math.floor(hrs / 24);
    return days === 1 ? 'вчера' : `${days} дн. назад`;
  };

  // ═══ DETAIL VIEW ═══
  if (detail) {
    return (
      <div className="fw-detail-page">
        <div className="container">
          <button className="fw-back" onClick={() => setDetail(null)}>← Назад к заявкам</button>

          <div className="fw-detail-layout">
            <div className="fw-detail-main">
              <div className="fw-detail-card">
                <div className="fw-detail-cat">{catName(detail.categoryId)}</div>
                <h1 className="fw-detail-title">{detail.title}</h1>
                {detail.budgetTo ? (
                  <div className="fw-detail-price">{Number(detail.budgetTo).toLocaleString('ru-RU')} ₽</div>
                ) : (
                  <div className="fw-detail-price fw-detail-price-dog">Цена договорная</div>
                )}
                <div className="fw-detail-meta">
                  {detail.addressText && <div>📍 {detail.addressText}</div>}
                  {detail.city && <div>🏙 {detail.city}</div>}
                  {detail.createdAt && <div>🕐 {timeAgo(detail.createdAt)}</div>}
                </div>
                {detail.description && detail.description !== 'Без описания' && (
                  <>
                    <div className="fw-detail-sep" />
                    <h3 className="fw-detail-subtitle">Описание</h3>
                    <p className="fw-detail-desc">{detail.description}</p>
                  </>
                )}
              </div>
            </div>

            <div className="fw-detail-side">
              {offerStatus === 'done' ? (
                <div className="fw-side-card fw-side-success">
                  <span>✅</span>
                  <h3>Отклик отправлен!</h3>
                  <p>Заказчик увидит ваше предложение</p>
                  <button className="fw-btn fw-btn-primary" onClick={() => setDetail(null)}>Вернуться</button>
                </div>
              ) : (
                <div className="fw-side-card">
                  <h3 className="fw-side-title">Откликнуться</h3>
                  <div className="fw-field">
                    <label>Ваша цена, ₽</label>
                    <input type="number" placeholder="0" value={offerForm.price}
                      onChange={e => setOfferForm({...offerForm, price: e.target.value})} />
                  </div>
                  <div className="fw-field">
                    <label>Срок (дней)</label>
                    <input type="number" placeholder="—" value={offerForm.days}
                      onChange={e => setOfferForm({...offerForm, days: e.target.value})} />
                  </div>
                  <div className="fw-field">
                    <label>Сообщение</label>
                    <textarea placeholder="Здравствуйте! Готов выполнить…" value={offerForm.comment}
                      onChange={e => setOfferForm({...offerForm, comment: e.target.value})} />
                  </div>
                  {offerStatus === 'error' && <div className="fw-side-error">Не удалось отправить</div>}
                  <button className="fw-btn fw-btn-primary" disabled={!offerForm.price || offerStatus === 'sending'}
                    onClick={handleSend}>
                    {offerStatus === 'sending' ? 'Отправляем…' : '📤 Откликнуться'}
                  </button>
                  <button className="fw-btn fw-btn-chat" onClick={() => handleChat(detail)}>
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
              <div className="fw-grid">{[1,2,3,4].map(i => <div key={i} className="fw-card-skel skeleton" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="card empty-state"><span className="empty-state-icon">🔍</span><h3>Заявок нет</h3><p>Новые появятся здесь</p></div>
            ) : (
              <div className="fw-grid">
                {filtered.map((req, i) => (
                  <div key={req.id} className="fw-card fade-up" style={{animationDelay:`${i*0.04}s`}} onClick={() => openDetail(req)}>
                    <div className="fw-card-cat">{catName(req.categoryId)}</div>
                    <h3 className="fw-card-title">{req.title}</h3>
                    {req.budgetTo ? (
                      <div className="fw-card-price">{Number(req.budgetTo).toLocaleString('ru-RU')} ₽</div>
                    ) : (
                      <div className="fw-card-price fw-card-price-dog">Договорная</div>
                    )}
                    {req.description && req.description !== 'Без описания' && (
                      <p className="fw-card-desc">{req.description}</p>
                    )}
                    <div className="fw-card-bottom">
                      {req.addressText && <span>📍 {req.addressText}</span>}
                      <span>{timeAgo(req.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'deals' && (
          <div>
            {deals.length === 0 ? (
              <div className="card empty-state"><span className="empty-state-icon">🤝</span><h3>Сделок нет</h3><p>Откликайтесь на заявки</p></div>
            ) : (
              <div className="fw-deals-list">
                {deals.map((d, i) => {
                  const st = DEAL_ST[d.status] || { l: d.status, c: 'st-new' };
                  return (
                    <div key={d.id} className="fw-deal fade-up" style={{animationDelay:`${i*0.04}s`}}>
                      <div className="fw-deal-row">
                        <div className="fw-deal-price">{d.agreedPrice ? `${Number(d.agreedPrice).toLocaleString('ru-RU')} ₽` : '—'}</div>
                        <span className={`fw-deal-st ${st.c}`}>{st.l}</span>
                      </div>
                      <div className="fw-deal-date">{d.createdAt ? new Date(d.createdAt).toLocaleDateString('ru-RU') : ''}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}