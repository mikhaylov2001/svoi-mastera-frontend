import React, { useEffect, useState, useCallback } from 'react';

// --- MOCK DEPENDENCIES ---
// Replacing missing external imports to ensure the file compiles in a self-contained environment.
const useAuth = () => ({ userId: 'mock-user-id' });

const getMyDeals = async (userId) => {
  return [
    { id: '1', title: 'Example Task 1', status: 'IN_PROGRESS', customerId: 'mock-user-id', workerName: 'Alex', agreedPrice: 1500, createdAt: Date.now() },
    { id: '2', title: 'Example Task 2', status: 'COMPLETED', customerId: 'other-user', workerName: 'mock-user-id', agreedPrice: 5000, createdAt: Date.now() - 86400000 },
  ];
};

const completeDeal = async (userId, dealId) => {
  return new Promise(resolve => setTimeout(resolve, 500));
};

const Link = ({ to, className, children }) => <a href={to} className={className}>{children}</a>;
// -------------------------

const ST = {
  NEW: { l: 'Новая', c: 'badge-new' },
  IN_PROGRESS: { l: 'В работе', c: 'badge-progress' },
  COMPLETED: { l: 'Завершена', c: 'badge-done' },
  CANCELLED: { l: 'Отменена', c: 'badge-failed' },
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

  // Re-sync detail after load without triggering eslint warnings or infinite loops
  useEffect(() => {
    if (detail?.id) {
      const fresh = deals.find(d => d.id === detail.id);
      // Only update if the data actually changed
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(detail)) {
        setDetail(fresh);
      }
    }
  }, [deals, detail]);

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
      <div className="container" style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <button style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer' }} onClick={() => setDetail(null)}>← Назад к сделкам</button>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 60%', border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
            <div>
              <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#e0e0e0', marginRight: '10px' }}>{st.l}</span>
              {detail.category && <span style={{ color: '#666' }}>{detail.category}</span>}
            </div>
            <h1>{detail.title || 'Задача'}</h1>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#2b8a3e', margin: '10px 0' }}>{detail.agreedPrice ? `${Number(detail.agreedPrice).toLocaleString('ru-RU')} ₽` : '—'}</div>
            {detail.description && detail.description !== 'Без описания' && (
              <><hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }}/><h3>Описание</h3><p>{detail.description}</p></>
            )}
            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }}/>
            <h3>Участники</h3>
            <div style={{ display: 'flex', gap: '40px' }}>
              <div>
                <div style={{ color: '#888', fontSize: '0.9em' }}>Заказчик</div>
                <div>{detail.customerName||'—'}{im&&<span style={{ color: '#aaa' }}> (вы)</span>}</div>
              </div>
              <div>
                <div style={{ color: '#888', fontSize: '0.9em' }}>Мастер</div>
                <div>{detail.workerName||'—'}{!im&&<span style={{ color: '#aaa' }}> (вы)</span>}</div>
              </div>
            </div>
          </div>
          <div style={{ flex: '1 1 30%', border: '1px solid #eee', padding: '20px', borderRadius: '8px', background: '#fafafa' }}>
            {detail.status === 'COMPLETED' ? (
              <div style={{ textAlign: 'center' }}><span style={{ fontSize: '2em' }}>✅</span><h3>Сделка завершена</h3><p>Обе стороны подтвердили</p></div>
            ) : detail.status === 'IN_PROGRESS' ? (
              <>
                <h3>Подтверждение</h3>
                <p style={{ fontSize: '0.9em', color: '#666' }}>Завершится когда обе стороны подтвердят</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <span>{detail.customerConfirmed?'✅':'⏳'}</span>
                    <div><div style={{ fontWeight: 'bold' }}>Заказчик{im&&' (вы)'}</div><div style={{ fontSize: '0.8em', color: '#666' }}>{detail.customerConfirmed?'Подтвердил':'Ожидание'}</div></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <span>{detail.workerConfirmed?'✅':'⏳'}</span>
                    <div><div style={{ fontWeight: 'bold' }}>Мастер{!im&&' (вы)'}</div><div style={{ fontSize: '0.8em', color: '#666' }}>{detail.workerConfirmed?'Подтвердил':'Ожидание'}</div></div>
                  </div>
                </div>
                {!myOk ? (
                  <button style={{ width: '100%', padding: '10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }} disabled={actionId===detail.id} onClick={() => handleConfirm(detail.id)}>
                    {actionId===detail.id?'Подтверждаем…':'✅ Подтвердить выполнение'}
                  </button>
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px', color: '#2b8a3e' }}>Вы подтвердили.{!otherOk&&' Ожидаем другую сторону…'}</div>
                )}
                <div style={{ marginTop: '15px', textAlign: 'center' }}><Link to="/chat" style={{ color: '#007bff', textDecoration: 'none' }}>💬 Написать сообщение</Link></div>
              </>
            ) : <p>Статус: {st.l}</p>}
          </div>
        </div>
      </div>
    );
  }

  // ═══ LIST ═══
  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ background: '#f8f9fa', padding: '20px 0', marginBottom: '20px' }}>
        <div className="container" style={{ padding: '0 20px', maxWidth: '1000px', margin: '0 auto' }}>
          <h1 style={{ margin: '0 0 5px 0' }}>Мои сделки</h1>
          <p style={{ margin: 0, color: '#666' }}>Активные и завершённые</p>
        </div>
      </div>
      <div className="container" style={{ padding: '0 20px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {[['ALL','Все',counts.ALL],['IN_PROGRESS','В работе',counts.IN_PROGRESS],['COMPLETED','Завершены',counts.COMPLETED]].map(([k,l,c])=>(
            <button key={k} style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #ccc', background: filter===k?'#333':'#fff', color: filter===k?'#fff':'#333', cursor: 'pointer' }} onClick={()=>setFilter(k)}>
              {l} <span style={{ background: filter===k?'#555':'#eee', padding: '2px 6px', borderRadius: '10px', fontSize: '0.8em', marginLeft: '5px' }}>{c}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div>{[1,2,3].map(i=><div key={i} style={{ height: '80px', background: '#f0f0f0', marginBottom: '10px', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}/>)}</div>
        ) : filtered.length===0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '8px', color: '#888' }}><span style={{ fontSize: '3em' }}>🤝</span><h3>Сделок нет</h3><p>Создайте заявку или откликнитесь</p></div>
        ) : (
          <div>
            {filtered.map((d,i) => {
              const st=ST[d.status]||{l:d.status,c:'badge-new'};
              const im=isCust(d);
              return (
                <div key={d.id} onClick={()=>setDetail(d)} style={{ border: '1px solid #eaeaea', padding: '15px', borderRadius: '8px', marginBottom: '10px', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0' }}>{d.title||'Задача'}</h3>
                      <div style={{ fontSize: '0.85em', color: '#666', display: 'flex', gap: '15px' }}>
                        {d.category&&<span>🏷 {d.category}</span>}
                        <span>👤 {im?d.workerName:d.customerName}</span>
                        <span>{timeAgo(d.createdAt)}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8em', padding: '4px 8px', borderRadius: '4px', background: '#e0e0e0', display: 'inline-block', marginBottom: '5px' }}>{st.l}</span>
                      <div style={{ fontWeight: 'bold', color: '#2b8a3e' }}>{d.agreedPrice?`${Number(d.agreedPrice).toLocaleString('ru-RU')} ₽`:'—'}</div>
                    </div>
                  </div>
                  {d.status==='IN_PROGRESS'&&(
                    <div style={{ marginTop: '15px', display: 'flex', gap: '20px', fontSize: '0.85em' }}>
                      <div style={{ color: d.customerConfirmed?'#2b8a3e':'#888' }}>{d.customerConfirmed?'✅':'⏳'} Заказчик</div>
                      <div style={{ color: d.workerConfirmed?'#2b8a3e':'#888' }}>{d.workerConfirmed?'✅':'⏳'} Мастер</div>
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