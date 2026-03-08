import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyJobRequests, getOffersForRequest, acceptOffer, getCategories } from '../api';
import { useAuth } from '../context/AuthContext';
import './MyOrdersPage.css';

const ST = {
  DRAFT:'Черновик', OPEN:'Открыта', IN_NEGOTIATION:'Переговоры', ASSIGNED:'Назначена',
  IN_PROGRESS:'В работе', COMPLETED:'Выполнена', CANCELLED:'Отменена', EXPIRED:'Истекла',
};
const ST_CLS = { OPEN:'badge-new', IN_PROGRESS:'badge-progress', COMPLETED:'badge-done', CANCELLED:'badge-failed' };

export default function MyOrdersPage() {
  const { userId } = useAuth();
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  // Detail panel
  const [selected, setSelected] = useState(null);
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reqs, cats] = await Promise.all([getMyJobRequests(userId), getCategories()]);
      setRequests(reqs); setCategories(cats);
    } catch {}
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const catName = (id) => categories.find(c => c.id === id)?.name || '';

  const openDetail = async (req) => {
    setSelected(req);
    setOffersLoading(true);
    try { setOffers(await getOffersForRequest(req.id)); } catch { setOffers([]); }
    setOffersLoading(false);
  };

  const handleAccept = async (offer) => {
    if (!selected) return;
    setActionId(offer.id);
    try { await acceptOffer(userId, selected.id, offer.id); await load(); setSelected(null); } catch {}
    setActionId(null);
  };

  const counts = {
    ALL: requests.length,
    OPEN: requests.filter(r => r.status === 'OPEN').length,
    ACTIVE: requests.filter(r => ['IN_PROGRESS','ASSIGNED','IN_NEGOTIATION'].includes(r.status)).length,
    DONE: requests.filter(r => r.status === 'COMPLETED').length,
  };

  const filtered = filter === 'ALL' ? requests
    : filter === 'ACTIVE' ? requests.filter(r => ['IN_PROGRESS','ASSIGNED','IN_NEGOTIATION'].includes(r.status))
    : filter === 'DONE' ? requests.filter(r => r.status === 'COMPLETED')
    : requests.filter(r => r.status === filter);

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1>Мои заказы</h1>
          <p>Управляйте заявками и выбирайте мастеров</p>
        </div>
      </div>

      <div className="container">
        {/* Mobile filter chips */}
        <div className="mo-chips">
          {[['ALL','Все',counts.ALL],['OPEN','Открытые',counts.OPEN],['ACTIVE','В работе',counts.ACTIVE],['DONE','Готово',counts.DONE]].map(([k,l,c]) => (
            <button key={k} className={`mo-chip ${filter===k?'active':''}`} onClick={() => setFilter(k)}>
              {l} <span>{c}</span>
            </button>
          ))}
        </div>

        <div className="mo-layout">
          {/* Sidebar */}
          <aside className="mo-sidebar">
            <div className="mo-sidebar-title">Фильтр</div>
            {[['ALL','Все заявки',counts.ALL],['OPEN','Открытые',counts.OPEN],['ACTIVE','В работе',counts.ACTIVE],['DONE','Выполнены',counts.DONE]].map(([k,l,c]) => (
              <button key={k} className={`mo-filter ${filter===k?'active':''}`} onClick={() => setFilter(k)}>
                {l}<span className="mo-filter-count">{c}</span>
              </button>
            ))}
            <div className="mo-sidebar-sep" />
            <Link to="/sections" className="btn btn-primary btn-full">+ Создать заявку</Link>
          </aside>

          {/* List */}
          <div className="mo-main">
            {loading ? (
              <div className="mo-list">{[1,2,3].map(i => <div key={i} className="mo-skel skeleton" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="card empty-state">
                <span className="empty-state-icon">📋</span>
                <h3>Заявок нет</h3>
                <p>Создайте заявку — мастера увидят её и предложат цену</p>
                <Link to="/sections" className="btn btn-primary">Создать заявку</Link>
              </div>
            ) : (
              <div className="mo-list">
                {filtered.map((req, i) => (
                  <div key={req.id} className={`mo-card fade-up ${selected?.id === req.id ? 'selected' : ''}`}
                    style={{animationDelay:`${i*0.03}s`}} onClick={() => openDetail(req)}>
                    <div className="mo-card-row">
                      <h3 className="mo-card-title">{req.title}</h3>
                      <span className={`badge ${ST_CLS[req.status]||'badge-new'}`}>{ST[req.status]||req.status}</span>
                    </div>
                    {req.description && req.description !== 'Без описания' && (
                      <p className="mo-card-desc">{req.description}</p>
                    )}
                    <div className="mo-card-meta">
                      {catName(req.categoryId) && <span>🏷 {catName(req.categoryId)}</span>}
                      {req.addressText && <span>📍 {req.addressText}</span>}
                      {req.createdAt && <span>🕐 {new Date(req.createdAt).toLocaleDateString('ru-RU')}</span>}
                    </div>
                    {req.budgetTo && <div className="mo-card-price">до {Number(req.budgetTo).toLocaleString('ru-RU')} ₽</div>}
                    <div className="mo-card-tap">Нажмите чтобы посмотреть отклики →</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Detail / Offers Panel (modal on mobile, side panel on desktop) ═══ */}
      {selected && (
        <div className="mo-detail-overlay" onClick={() => setSelected(null)}>
          <div className="mo-detail" onClick={e => e.stopPropagation()}>
            <button className="mo-detail-close" onClick={() => setSelected(null)}>✕</button>

            <div className="mo-detail-header">
              <h2>{selected.title}</h2>
              <span className={`badge ${ST_CLS[selected.status]||'badge-new'}`}>{ST[selected.status]||selected.status}</span>
            </div>

            {selected.description && selected.description !== 'Без описания' && (
              <p className="mo-detail-desc">{selected.description}</p>
            )}

            <div className="mo-detail-info">
              {catName(selected.categoryId) && <div>🏷 {catName(selected.categoryId)}</div>}
              {selected.addressText && <div>📍 {selected.addressText}</div>}
              {selected.budgetTo && <div>💰 до {Number(selected.budgetTo).toLocaleString('ru-RU')} ₽</div>}
              {selected.createdAt && <div>📅 {new Date(selected.createdAt).toLocaleDateString('ru-RU')}</div>}
            </div>

            <div className="mo-detail-divider" />

            <h3 className="mo-detail-section-title">
              📩 Отклики мастеров {!offersLoading && <span className="mo-offers-count">{offers.length}</span>}
            </h3>

            {offersLoading ? (
              <div className="skeleton" style={{height:80, borderRadius:12}} />
            ) : offers.length === 0 ? (
              <div className="mo-offers-empty">
                <span>🔍</span>
                <p>Откликов пока нет</p>
                <p className="mo-offers-hint">Мастера увидят вашу заявку и предложат свою цену. Обычно первый отклик приходит в течение 10–30 минут.</p>
              </div>
            ) : (
              <div className="mo-offers-list">
                {offers.map(offer => (
                  <div key={offer.id} className="mo-offer">
                    <div className="mo-offer-top">
                      <div className="mo-offer-price">{Number(offer.price).toLocaleString('ru-RU')} ₽</div>
                      <div className="mo-offer-status">
                        {offer.estimatedDays && <span className="mo-offer-days">{offer.estimatedDays} дн.</span>}
                        <span className={`badge ${offer.status==='ACCEPTED'?'badge-done':'badge-new'}`}>
                          {offer.status==='ACCEPTED'?'Принят':offer.status==='REJECTED'?'Отклонён':'Новый'}
                        </span>
                      </div>
                    </div>
                    {offer.message && <p className="mo-offer-msg">{offer.message}</p>}
                    <div className="mo-offer-date">{offer.createdAt && new Date(offer.createdAt).toLocaleDateString('ru-RU')}</div>

                    {offer.status === 'CREATED' && (
                      <div className="mo-offer-actions">
                        <button className="btn btn-primary btn-sm" disabled={actionId===offer.id}
                          onClick={() => handleAccept(offer)}>
                          {actionId===offer.id ? 'Принимаем…' : '✅ Принять и создать сделку'}
                        </button>
                        <a href={`https://wa.me/?text=${encodeURIComponent('Здравствуйте! Пишу вам по заявке «' + selected.title + '» на СвоиМастера.')}`}
                          target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                          💬 Написать
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}