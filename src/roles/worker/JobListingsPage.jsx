import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaRegClock, FaBolt, FaImage } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getOpenJobRequestsForWorker } from '../../api';
import './jobListings.css';

const BACKEND = 'https://svoi-mastera-backend-mf3h.onrender.com';
const photoUrl = (u) => !u ? null : (u.startsWith('http') || u.startsWith('data:')) ? u : BACKEND + u;
const fmtDate = (d) => !d ? '' : new Date(d).toLocaleDateString('ru-RU', { day:'numeric', month:'short' });
const fmtPrice = (p) => p ? `${Number(p).toLocaleString('ru-RU')} ₽` : null;

export default function JobListingsPage() {
  const { userId } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('ALL');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getOpenJobRequestsForWorker(userId)
      .then((d) => { if (alive) setItems(Array.isArray(d) ? d : (d?.items || [])); })
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [userId]);

  const cats = useMemo(() => {
    const s = new Map();
    items.forEach((i) => { if (i.categoryName) s.set(i.categoryName, (s.get(i.categoryName) || 0) + 1); });
    return Array.from(s, ([name, n]) => ({ name, n }));
  }, [items]);

  const visible = cat === 'ALL' ? items : items.filter((i) => i.categoryName === cat);

  return (
    <div className="jl-page">
      <div className="jl-wrap">
        <div className="jl-head">
          <div>
            <h1 className="jl-title">Актуальные заявки</h1>
            <div className="jl-sub">{items.length} заявок ждут отклика</div>
          </div>
          <div className="jl-filters">
            <button type="button" className={`jl-chip ${cat==='ALL'?'is-active':''}`} onClick={() => setCat('ALL')}>Все</button>
            {cats.slice(0, 6).map((c) => (
              <button type="button" key={c.name} className={`jl-chip ${cat===c.name?'is-active':''}`} onClick={() => setCat(c.name)}>
                {c.name} · {c.n}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="jl-empty">Загружаем заявки...</div>
        ) : visible.length === 0 ? (
          <div className="jl-empty">В этой категории пока нет заявок.</div>
        ) : (
          <div className="jl-grid">
            {visible.map((item) => {
              const photo = photoUrl(item.photos?.[0] || item.photo);
              const price = fmtPrice(item.budgetTo || item.budgetFrom || item.budget || item.price);
              return (
                <Link key={item.id} to={`/jobs/${item.id}`} className="jl-card">
                  <div className="jl-card-media">
                    {photo
                      ? <img src={photo} alt={item.title || 'Заявка'} loading="lazy" />
                      : <div className="jl-card-media-empty"><FaImage/></div>}
                    {item.categoryName && <span className="jl-cat-badge">{item.categoryName}</span>}
                    {item.urgent && <span className="jl-urgent"><FaBolt/> Срочно</span>}
                  </div>

                  <div className="jl-card-body">
                    <div className="jl-price">{price || <span className="jl-price-muted">Договорная</span>}</div>
                    <div className="jl-card-title">{item.title || 'Заявка'}</div>

                    <div className="jl-meta">
                      {(item.cityName || item.addressText || item.address) && (
                        <span><FaMapMarkerAlt/>{item.cityName || item.addressText || item.address}</span>
                      )}
                      {item.createdAt && <span><FaRegClock/>{fmtDate(item.createdAt)}</span>}
                    </div>

                    <div className="jl-card-foot">
                      <div className="jl-author-ava">
                        {item.customerAvatar
                          ? <img src={photoUrl(item.customerAvatar)} alt=""/>
                          : (item.customerName?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="jl-author-name">
                        {[item.customerName, item.customerLastName].filter(Boolean).join(' ') || 'Заказчик'}
                      </div>
                      {item.cityName && <span className="jl-author-loc"><FaMapMarkerAlt/>{item.cityName}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
