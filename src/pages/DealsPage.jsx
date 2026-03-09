import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyDeals, completeDeal } from '../api';
import { useAuth } from '../context/AuthContext';
import './DealsPage.css';

const ST = {
  NEW:{l:'Новая',c:'badge-new'}, IN_PROGRESS:{l:'В работе',c:'badge-progress'},
  COMPLETED:{l:'Завершена',c:'badge-done'}, CANCELLED:{l:'Отменена',c:'badge-failed'},
};

export default function DealsPage() {
  const { userId } = useAuth();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [actionId, setActionId] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setDeals(await getMyDeals(userId)); } catch {}
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleConfirm = async (dealId) => {
    setActionId(dealId);
    try {
      await completeDeal(userId, dealId);
      await load();
      if (detail?.id === dealId) {
        const updated = deals.find(d => d.id === dealId);
        if (updated) setDetail({...updated}); else await load();
      }
    } catch {}
    setActionId(null);
  };

  // Re-sync detail after load
  useEffect(() => {
    if (detail) {
      const fresh = deals.find(d => d.id === detail.id);
      if (fresh) setDetail(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals]);

  const counts = {
    ALL: deals.length,
    IN_PROGRESS: deals.filter(d => d.status === 'IN_PROGRESS').length,
    COMPLETED: deals.filter(d => d.status === 'COMPLETED').length,
  };
  const filtered = filter === 'ALL' ? deals : deals.filter(d => d.status === filter);
  const isCust = (d) => d.customerId === userId;

  const timeAgo = (d) => {
    if (!d) return '';
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 60) return `${m} мин. назад`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ч. назад`;
    return Math.floor(h / 24) + ' дн. назад';
  };

  // ═══ DETAIL ═══
  if (detail) {
    const st = ST[detail.status] || {l:detail.status,c:'badge-new'};
    const im = isCust(detail);
    const myOk = im ? detail.customerConfirmed : detail.workerConfirmed;
    const otherOk = im ? detail.workerConfirmed : detail.customerConfirmed;
    return (
      <div className="container">
        <button className="dl-back" onClick={() => setDetail(null)}>← Назад к сделкам</button>
        <div className="dl-layout">
          <div className="dl-main">
            <div className="dl-card">
              <div className="dl-card-top">
                <span className={`badge ${st.c}`}>{st.l}</span>
                {detail.category && <span className="dl-cat">{detail.category}</span>}
              </div>
              <h1 className="dl-title">{detail.title || 'Задача'}</h1>
              <div className="dl-price">{detail.agreedPrice ? `${Number(detail.agreedPrice).toLocaleString('ru-RU')} ₽` : '—'}</div>
              {detail.description && detail.description !== 'Без описания' && (
                <><div className="dl-sep"/><h3 className="dl-sub">Описание</h3><p className="dl-desc">{detail.description}</p></>
              )}
              <div className="dl-sep"/>
              <h3 className="dl-sub">Участники</h3>
              <div className="dl-people">
                <div className="dl-person">
                  <div className="dl-person-role">Заказчик</div>
                  <div className="dl-person-name">{detail.customerName||'—'}{im&&<span className="dl-you"> (вы)</span>}</div>
                </div>
                <div className="dl-person">
                  <div className="dl-person-role">Мастер</div>
                  <div className="dl-person-name">{detail.workerName||'—'}{!im&&<span className="dl-you"> (вы)</span>}</div>
                </div>
              </div>
              <div className="dl-sep"/>
              <div className="dl-dates">
                {detail.createdAt&&<div>📅 Создана: {new Date(detail.createdAt).toLocaleDateString('ru-RU')}</div>}
                {detail.startedAt&&<div>🚀 В работе с: {new Date(detail.startedAt).toLocaleDateString('ru-RU')}</div>}
                {detail.completedAt&&<div>✅ Завершена: {new Date(detail.completedAt).toLocaleDateString('ru-RU')}</div>}
              </div>
            </div>
          </div>
          <div className="dl-side">
            <div className="dl-sc">
              {detail.status === 'COMPLETED' ? (
                <div className="dl-done"><span>✅</span><h3>Сделка завершена</h3><p>Обе стороны подтвердили</p></div>
              ) : detail.status === 'IN_PROGRESS' ? (
                <>
                  <h3 className="dl-sc-t">Подтверждение</h3>
                  <p className="dl-sc-h">Завершится когда обе стороны подтвердят</p>
                  <div className="dl-clist">
                    <div className={`dl-ci ${detail.customerConfirmed?'ok':''}`}>
                      <span>{detail.customerConfirmed?'✅':'⏳'}</span>
                      <div><div className="dl-ci-w">Заказчик{im&&' (вы)'}</div><div className="dl-ci-s">{detail.customerConfirmed?'Подтвердил':'Ожидание'}</div></div>
                    </div>
                    <div className={`dl-ci ${detail.workerConfirmed?'ok':''}`}>
                      <span>{detail.workerConfirmed?'✅':'⏳'}</span>
                      <div><div className="dl-ci-w">Мастер{!im&&' (вы)'}</div><div className="dl-ci-s">{detail.workerConfirmed?'Подтвердил':'Ожидание'}</div></div>
                    </div>
                  </div>
                  {!myOk ? (
                    <button className="dl-cbtn" disabled={actionId===detail.id} onClick={() => handleConfirm(detail.id)}>
                      {actionId===detail.id?'Подтверждаем…':'✅ Подтвердить выполнение'}
                    </button>
                  ) : (
                    <div className="dl-wait">Вы подтвердили.{!otherOk&&' Ожидаем другую сторону…'}</div>
                  )}
                  <Link to="/chat" className="dl-chat">💬 Написать сообщение</Link>
                </>
              ) : <p className="dl-sc-h">Статус: {st.l}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══ LIST ═══
  return (
    <div>
      <div className="page-header-bar"><div className="container"><h1>Мои сделки</h1><p>Активные и завершённые</p></div></div>
      <div className="container">
        <div className="dl-chips">
          {[['ALL','Все',counts.ALL],['IN_PROGRESS','В работе',counts.IN_PROGRESS],['COMPLETED','Завершены',counts.COMPLETED]].map(([k,l,c])=>(
            <button key={k} className={`dl-chip ${filter===k?'active':''}`} onClick={()=>setFilter(k)}>{l}<span>{c}</span></button>
          ))}
        </div>
        {loading ? (
          <div className="dl-list">{[1,2,3].map(i=><div key={i} className="dl-skel skeleton"/>)}</div>
        ) : filtered.length===0 ? (
          <div className="card empty-state"><span className="empty-state-icon">🤝</span><h3>Сделок нет</h3><p>Создайте заявку или откликнитесь</p></div>
        ) : (
          <div className="dl-list">
            {filtered.map((d,i) => {
              const st=ST[d.status]||{l:d.status,c:'badge-new'};
              const im=isCust(d);
              return (
                <div key={d.id} className="dl-deal fade-up" style={{animationDelay:`${i*0.04}s`}} onClick={()=>setDetail(d)}>
                  <div className="dl-deal-top">
                    <div className="dl-deal-info">
                      <h3 className="dl-deal-title">{d.title||'Задача'}</h3>
                      <div className="dl-deal-meta">
                        {d.category&&<span>🏷 {d.category}</span>}
                        <span>👤 {im?d.workerName:d.customerName}</span>
                        <span>{timeAgo(d.createdAt)}</span>
                      </div>
                    </div>
                    <div className="dl-deal-right">
                      <span className={`badge ${st.c}`}>{st.l}</span>
                      <div className="dl-deal-price">{d.agreedPrice?`${Number(d.agreedPrice).toLocaleString('ru-RU')} ₽`:'—'}</div>
                    </div>
                  </div>
                  {d.status==='IN_PROGRESS'&&(
                    <div className="dl-deal-prog">
                      <div className={`dl-deal-chk ${d.customerConfirmed?'ok':''}`}>{d.customerConfirmed?'✅':'⏳'} Заказчик</div>
                      <div className={`dl-deal-chk ${d.workerConfirmed?'ok':''}`}>{d.workerConfirmed?'✅':'⏳'} Мастер</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}