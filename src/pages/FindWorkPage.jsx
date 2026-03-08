import React, { useEffect, useState, useCallback } from 'react';
import { getOpenJobRequestsForWorker, createJobOffer, getMyDeals, getCategories } from '../api';
import { useAuth } from '../context/AuthContext';
import './FindWorkPage.css';

const DEAL_ST = {
  NEW: { l: 'Новая', c: 'badge-new' }, IN_PROGRESS: { l: 'В работе', c: 'badge-progress' },
  COMPLETED: { l: 'Выполнена', c: 'badge-done' }, CANCELLED: { l: 'Отменена', c: 'badge-failed' },
};

export default function FindWorkPage() {
  const { userId } = useAuth();
  const [tab, setTab] = useState('feed');
  const [requests, setRequests] = useState([]);
  const [deals, setDeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState('ALL');

  // Detail
  const [detail, setDetail] = useState(null);

  // Offer
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
    setOfferForm({ price: '', comment: '', days: '' });
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

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1>Найти работу</h1>
          <p>Открытые заявки заказчиков в Йошкар-Оле</p>
        </div>
      </div>

      <div className="container">
        {/* Tabs */}
        <div className="fw-tabs">
          <button className={`fw-tab ${tab==='feed'?'active':''}`} onClick={() => setTab('feed')}>
            📋 Лента заявок {requests.length > 0 && <span className="fw-tab-badge">{requests.length}</span>}
          </button>
          <button className={`fw-tab ${tab==='deals'?'active':''}`} onClick={() => setTab('deals')}>
            🤝 Мои сделки {deals.length > 0 && <span className="fw-tab-badge">{deals.length}</span>}
          </button>
        </div>

        {/* ═══ FEED ═══ */}
        {tab === 'feed' && (
          <div>
            {feedCats.length > 1 && (
              <div className="fw-cats">
                <button className={`fw-cat ${catFilter==='ALL'?'active':''}`} onClick={() => setCatFilter('ALL')}>Все</button>
                {feedCats.map(id => (
                  <button key={id} className={`fw-cat ${catFilter===id?'active':''}`} onClick={() => setCatFilter(id)}>
                    {catName(id) || 'Другое'}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="fw-list">{[1,2,3].map(i => <div key={i} className="fw-skel skeleton" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="card empty-state">
                <span className="empty-state-icon">🔍</span>
                <h3>Заявок пока нет</h3>
                <p>Когда заказчики создадут задачи, они появятся здесь</p>
              </div>
            ) : (
              <div className="fw-list">
                {filtered.map((req, i) => (
                  <div key={req.id} className="fw-card fade-up" style={{animationDelay:`${i*0.03}s`}} onClick={() => openDetail(req)}>
                    <div className="fw-card-row">
                      <h3 className="fw-card-title">{req.title}</h3>
                      {req.budgetTo && (
                        <span className="fw-card-budget">до {Number(req.budgetTo).toLocaleString('ru-RU')} ₽</span>
                      )}
                    </div>
                    {req.description && req.description !== 'Без описания' && (
                      <p className="fw-card-desc">{req.description}</p>
                    )}
                    <div className="fw-card-meta">
                      {catName(req.categoryId) && <span>🏷 {catName(req.categoryId)}</span>}
                      {req.addressText && <span>📍 {req.addressText}</span>}
                      {req.createdAt && <span>🕐 {new Date(req.createdAt).toLocaleDateString('ru-RU')}</span>}
                    </div>
                    <div className="fw-card-cta">Нажмите чтобы откликнуться →</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ DEALS ═══ */}
        {tab === 'deals' && (
          <div>
            {deals.length === 0 ? (
              <div className="card empty-state">
                <span className="empty-state-icon">🤝</span>
                <h3>Сделок пока нет</h3>
                <p>Откликайтесь на заявки — когда заказчик примет отклик, появится сделка</p>
              </div>
            ) : (
              <div className="fw-list">
                {deals.map((d, i) => {
                  const st = DEAL_ST[d.status] || { l: d.status, c: 'badge-new' };
                  return (
                    <div key={d.id} className="fw-card fade-up" style={{animationDelay:`${i*0.03}s`}}>
                      <div className="fw-card-row">
                        <h3 className="fw-card-title">Сделка</h3>
                        <span className={`badge ${st.c}`}>{st.l}</span>
                      </div>
                      <div className="fw-card-meta">
                        <span>💰 {d.agreedPrice ? `${Number(d.agreedPrice).toLocaleString('ru-RU')} ₽` : '—'}</span>
                        <span>🕐 {d.createdAt ? new Date(d.createdAt).toLocaleDateString('ru-RU') : '—'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ Detail Panel ═══ */}
      {detail && (
        <div className="fw-detail-overlay" onClick={() => setDetail(null)}>
          <div className="fw-detail" onClick={e => e.stopPropagation()}>
            <button className="fw-detail-close" onClick={() => setDetail(null)}>✕</button>

            <h2 className="fw-detail-title">{detail.title}</h2>

            {detail.description && detail.description !== 'Без описания' && (
              <p className="fw-detail-desc">{detail.description}</p>
            )}

            <div className="fw-detail-info">
              {catName(detail.categoryId) && <div>🏷 {catName(detail.categoryId)}</div>}
              {detail.addressText && <div>📍 {detail.addressText}</div>}
              {detail.city && <div>🏙 {detail.city}</div>}
              {detail.budgetTo && <div className="fw-detail-price">💰 Бюджет: до {Number(detail.budgetTo).toLocaleString('ru-RU')} ₽</div>}
              {detail.createdAt && <div>📅 {new Date(detail.createdAt).toLocaleDateString('ru-RU')}</div>}
            </div>

            <div className="fw-detail-divider" />

            {offerStatus === 'done' ? (
              <div className="fw-detail-success">
                <span>✅</span>
                <h3>Отклик отправлен!</h3>
                <p>Заказчик увидит ваше предложение и свяжется с вами.</p>
                <button className="btn btn-primary btn-full" onClick={() => setDetail(null)}>Вернуться к ленте</button>
              </div>
            ) : (
              <>
                <h3 className="fw-detail-form-title">💬 Откликнуться</h3>

                <div className="form-field">
                  <label className="form-label">Ваша цена, ₽ *</label>
                  <input className="form-input" type="number" placeholder="Сколько возьмёте за работу"
                    value={offerForm.price} onChange={e => setOfferForm({...offerForm, price: e.target.value})} />
                </div>

                <div className="form-field">
                  <label className="form-label">Срок (дней)</label>
                  <input className="form-input" type="number" placeholder="Сколько дней займёт"
                    value={offerForm.days} onChange={e => setOfferForm({...offerForm, days: e.target.value})} />
                </div>

                <div className="form-field">
                  <label className="form-label">Сообщение заказчику</label>
                  <textarea className="form-input form-textarea"
                    placeholder="Расскажите о себе и опыте, когда сможете приехать…"
                    value={offerForm.comment} onChange={e => setOfferForm({...offerForm, comment: e.target.value})} />
                </div>

                {offerStatus === 'error' && (
                  <div style={{background:'var(--red-light)', color:'var(--red)', padding:'10px 14px', borderRadius:10, fontSize:13, marginBottom:12}}>
                    Не удалось отправить. Попробуйте ещё раз.
                  </div>
                )}

                <button className="btn btn-primary btn-full" disabled={!offerForm.price || offerStatus === 'sending'}
                  onClick={handleSend}>
                  {offerStatus === 'sending' ? 'Отправляем…' : '📤 Отправить отклик'}
                </button>

                <a href={`https://wa.me/?text=${encodeURIComponent('Здравствуйте! Пишу по заявке «' + detail.title + '» на СвоиМастера в Йошкар-Оле.')}`}
                  target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-full" style={{marginTop:10}}>
                  💬 Написать заказчику в WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}