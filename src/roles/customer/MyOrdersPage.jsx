import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getMyJobRequests, getOffersForRequest, acceptOffer,
  getCategories, createJobRequest, updateJobRequest,
  getMyDeals, cancelJobRequest,
} from '../../api';
import { useSameRouteRefetch } from '../../hooks/useSameRouteRefetch';
import OrderCard from '../../components/myorders/OrderCard';
import OrderDetail from '../../components/myorders/OrderDetail';
import OffersSheet from '../../components/myorders/OffersSheet';
import EditOrderSheet from '../../components/myorders/EditOrderSheet';
import CreateOrderFlow from '../../components/myorders/CreateOrderFlow';
import '../../styles/moCabinetStyle.css';

const HERO = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=2400&q=86';
const BACKEND = 'https://svoi-mastera-backend.onrender.com';

const STATUS_TABS = [
  { key: 'all',       label: 'Все' },
  { key: 'wait',      label: 'Ждут' },
  { key: 'work',      label: 'В работе' },
  { key: 'done',      label: 'Завершены' },
  { key: 'cancelled', label: 'Отменены' },
];

function filterByTab(orders, key) {
  if (key === 'all') return orders;
  if (key === 'wait') return orders.filter(o => ['OPEN','IN_NEGOTIATION','ASSIGNED'].includes(o.status));
  if (key === 'work') return orders.filter(o => o.status === 'IN_PROGRESS');
  if (key === 'done') return orders.filter(o => o.status === 'COMPLETED');
  if (key === 'cancelled') return orders.filter(o => ['CANCELLED','EXPIRED'].includes(o.status));
  return orders;
}

function resolvePhotoUrl(u) {
  if (!u) return null;
  if (String(u).startsWith('http') || String(u).startsWith('data:')) return u;
  return BACKEND + u;
}

/** Нормализуем заявку с бэка в формат компонентов */
function normalizeRequest(r, categories = []) {
  if (!r) return r;
  const cat = r.category && typeof r.category === 'object' ? r.category : null;
  const categoryName =
    r.categoryName ?? r.category_name ?? (typeof r.category === 'string' ? r.category : cat?.name) ?? '';

  const photos = (r.photos || r.photoUrls || [])
    .map(p => (typeof p === 'string' ? p : p?.url || p?.photoUrl || ''))
    .filter(Boolean)
    .map(resolvePhotoUrl);

  return {
    ...r,
    category: categoryName,
    photos,
    budget: r.budget != null ? Number(r.budget) : null,
    offersCount: Number(r.offersCount ?? r.offers_count ?? 0),
    offers: r.offers || [],
  };
}

/** Нормализуем оффер с бэка */
function normalizeOffer(o) {
  if (!o) return o;
  const firstName = o.workerName || o.worker_name || '';
  const lastName  = o.workerLastName || o.worker_last_name || '';
  const name = [firstName, lastName].filter(Boolean).join(' ') || 'Мастер';
  const initial = firstName[0] || name[0] || 'М';
  const avatarRaw = o.workerAvatarUrl || o.worker_avatar_url || o.avatarUrl;
  const avatarUrl = avatarRaw ? resolvePhotoUrl(avatarRaw) : null;
  return {
    ...o,
    name,
    initial,
    avatarUrl,
    price: o.price ?? o.suggestedBudget ?? o.suggested_budget ?? null,
    rating: o.rating ?? o.workerRating ?? null,
    reviews: o.reviews ?? o.reviewsCount ?? o.workerReviewsCount ?? null,
    message: o.message || o.description || o.comment || '',
    createdAt: o.createdAt || o.created_at,
  };
}

/** Мёрж статуса сделок в заявки */
function mergeDealsIntoRequests(requests, deals, customerId) {
  if (!requests?.length || !customerId) return requests || [];
  const custDeals = (deals || []).filter(d => String(d.customerId) === String(customerId));
  return requests.map(r => {
    const hasDoneDeal = custDeals.some(d => d.status === 'COMPLETED' && String(d.jobRequestId || '') === String(r.id));
    if (hasDoneDeal && r.status !== 'COMPLETED') return { ...r, status: 'COMPLETED' };
    return r;
  });
}

function EmptyState({ icon, title, text, btnLabel, onBtn }) {
  return (
    <div className="mo-empty">
      <div className="mo-empty-emoji">{icon}</div>
      <div className="mo-empty-title">{title}</div>
      <div className="mo-empty-sub">{text}</div>
      {btnLabel && <div className="mo-empty-actions"><button type="button" className="mo-cta" onClick={onBtn}>{btnLabel}</button></div>}
    </div>
  );
}

export default function MyOrdersPage() {
  const { userId } = useAuth();
  const [searchParams] = useSearchParams();

  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [statusTab, setStatusTab]   = useState('all');
  const [search, setSearch]         = useState('');
  const [sort, setSort]             = useState('newest');
  const [detail, setDetail]         = useState(null);
  const [offersOrder, setOffersOrder] = useState(null);
  const [offersData, setOffersData] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [editOrder, setEditOrder]   = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const lastRefreshRef = useRef(0);

  /* ── Load ── */
  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [reqs, deals] = await Promise.all([
        getMyJobRequests(userId),
        getMyDeals(userId).catch(() => []),
      ]);
      const merged = mergeDealsIntoRequests(reqs || [], deals, userId);
      setOrders(merged.map(r => normalizeRequest(r)));
    } catch (e) {
      console.error('MyOrdersPage load error:', e);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { if (userId) load(); }, [userId, load]);
  useSameRouteRefetch('/my-requests', load);

  /* ── URL params ── */
  useEffect(() => {
    const createParam = searchParams.get('create');
    if (createParam === '1' || createParam === 'true') setShowCreate(true);

    const tabParam = searchParams.get('tab');
    if (tabParam === 'archive') setStatusTab('cancelled');
  }, [searchParams]);

  useEffect(() => {
    if (!orders.length) return;
    const reqId = searchParams.get('request');
    const offersParam = searchParams.get('offers');
    if (reqId) {
      const found = orders.find(r => String(r.id) === String(reqId));
      if (found) {
        setDetail(found);
        if (offersParam === '1') openOffersSheet(found);
      }
    }
  }, [searchParams, orders]);

  /* ── Visibility refresh ── */
  useEffect(() => {
    if (!userId) return;
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastRefreshRef.current < 25000) return;
      lastRefreshRef.current = now;
      load();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [userId, load]);

  /* ── Offers sheet ── */
  const openOffersSheet = async (order) => {
    setOffersOrder(order);
    setOffersData([]);
    setOffersLoading(true);
    try {
      const raw = await getOffersForRequest(order.id);
      setOffersData((raw || []).map(normalizeOffer));
    } catch {
      setOffersData(order.offers || []);
    }
    setOffersLoading(false);
  };

  /* ── Accept offer ── */
  const handleAcceptOffer = async (offer) => {
    if (!offersOrder || actionLoading) return;
    setActionLoading(offer.id);
    try {
      await acceptOffer(userId, offersOrder.id, offer.id);
      setOffersOrder(null);
      await load();
    } catch (e) {
      alert(e.message || 'Не удалось принять отклик');
    }
    setActionLoading(null);
  };

  /* ── Save edit ── */
  const handleSaveEdit = async (updated) => {
    try {
      await updateJobRequest(userId, updated.id, {
        title: updated.title,
        description: updated.description,
        budget: updated.budget,
        address: updated.address,
      });
      await load();
      setEditOrder(null);
      if (detail?.id === updated.id) setDetail(prev => ({ ...prev, ...updated }));
    } catch (e) {
      alert(e.message || 'Не удалось сохранить');
    }
  };

  /* ── Create new order ── */
  const handleCreate = async (newOrder) => {
    try {
      await createJobRequest(userId, {
        title: newOrder.title,
        description: newOrder.description,
        budget: newOrder.budget,
        address: newOrder.address,
        categoryName: newOrder.category,
      });
      setShowCreate(false);
      await load();
    } catch (e) {
      alert(e.message || 'Не удалось создать заявку');
    }
  };

  /* ── Cancel order ── */
  const handleCancel = async (order) => {
    if (!window.confirm(`Отменить заявку «${order?.title || ''}»?`)) return;
    try {
      await cancelJobRequest(userId, order.id);
      setDetail(null);
      await load();
    } catch (e) {
      alert(e.message || 'Не удалось отменить');
    }
  };

  /* ── Filtered list ── */
  const shown = filterByTab(orders, statusTab)
    .filter(o => !search || `${o.title} ${o.description || ''}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'newest'
      ? new Date(b.createdAt) - new Date(a.createdAt)
      : new Date(a.createdAt) - new Date(b.createdAt));

  /* ── Detail view ── */
  if (detail) {
    const detailOrder = orders.find(o => o.id === detail.id) || detail;
    return (
      <>
        <OrderDetail
          order={detailOrder}
          onBack={() => setDetail(null)}
          onOpenOffers={() => openOffersSheet(detailOrder)}
          onEdit={() => setEditOrder(detailOrder)}
          onCancel={() => handleCancel(detailOrder)}
        />
        {offersOrder && (
          <OffersSheet
            order={{ ...offersOrder, offers: offersLoading ? [] : offersData }}
            onClose={() => setOffersOrder(null)}
            onAccept={handleAcceptOffer}
          />
        )}
        {editOrder && (
          <EditOrderSheet
            order={editOrder}
            onClose={() => setEditOrder(null)}
            onSave={handleSaveEdit}
          />
        )}
      </>
    );
  }

  /* ── Main list ── */
  return (
    <>
      <div className="mo-page">
        {/* Hero */}
        <header className="mo-hero">
          <img src={HERO} alt="" />
          <div className="mo-hero-inner">
            <div>
              <h1>Мои сделки</h1>
              <p>Сделки с мастерами — отслеживайте прогресс и подтверждайте</p>
            </div>
            <button type="button" className="mo-cta" onClick={() => setShowCreate(true)}>
              + Найти мастера
            </button>
          </div>
        </header>

        <main className="mo-main">
          {/* Toolbar */}
          <div className="mo-toolbar">
            {/* Status tabs */}
            <div className="mo-status-tabs">
              {STATUS_TABS.map(t => {
                const count = filterByTab(orders, t.key).length;
                return (
                  <button
                    key={t.key}
                    type="button"
                    className={`mo-status-tab${statusTab === t.key ? ' active' : ''}`}
                    onClick={() => setStatusTab(t.key)}
                  >
                    {t.label}
                    {count > 0 && <span className="mo-status-tab-count">{count}</span>}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="mo-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" />
              </svg>
              <input
                type="search"
                placeholder="Поиск по сделкам или мастеру…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoComplete="off"
              />
            </div>

            {/* Sort */}
            <select className="mo-sort" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
            </select>
          </div>

          {/* Content */}
          {loading ? (
            <EmptyState icon="⏳" title="Загружаем сделки…" text="Пожалуйста, подождите" />
          ) : shown.length === 0 ? (
            <EmptyState
              icon="📋"
              title="Нет сделок"
              text={statusTab === 'all' ? 'Найдите мастера и начните сделку' : 'В этой категории пока нет сделок'}
              btnLabel={statusTab === 'all' ? '+ Найти мастера' : undefined}
              onBtn={() => setShowCreate(true)}
            />
          ) : (
            <div className="mo-grid">
              {shown.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onOpen={() => setDetail(order)}
                  onOpenOffers={() => openOffersSheet(order)}
                  onEdit={() => setEditOrder(order)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateOrderFlow
          onClose={() => setShowCreate(false)}
          onSave={handleCreate}
        />
      )}
      {offersOrder && !detail && (
        <OffersSheet
          order={{ ...offersOrder, offers: offersLoading ? [] : offersData }}
          onClose={() => setOffersOrder(null)}
          onAccept={handleAcceptOffer}
        />
      )}
      {editOrder && !detail && (
        <EditOrderSheet
          order={editOrder}
          onClose={() => setEditOrder(null)}
          onSave={handleSaveEdit}
        />
      )}
    </>
  );
}
