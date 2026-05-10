import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaMapMarkerAlt, FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getJobRequestById } from '../../api';
import './jobListings.css';

const BACKEND = 'https://svoi-mastera-backend.onrender.com';
const photoUrl = (u) => !u ? null : (u.startsWith('http') || u.startsWith('data:')) ? u : BACKEND + u;
const fmtDate = (d) => !d ? '' : new Date(d).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' });

export default function JobListingDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { userId } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getJobRequestById(userId, id)
      .then((d) => { if (alive) setItem(d); })
      .catch(() => { if (alive) setItem(null); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id, userId]);

  if (loading) return <div className="jd-page"><div className="jd-wrap">Загрузка...</div></div>;
  if (!item) return <div className="jd-page"><div className="jd-wrap">Объявление не найдено</div></div>;

  const photos = (item.photos || []).map(photoUrl).filter(Boolean);
  const main = photos[idx] || null;
  const price = item.budgetTo || item.budgetFrom || item.budget || item.price;

  return (
    <div className="jd-page">
      <div className="jd-wrap">
        <Link to="/jobs" className="jd-back"><FaArrowLeft/> Назад к заявкам</Link>

        <div className="jd-header">
          <h1 className="jd-title">{item.title}</h1>
          <div className="jd-meta-row">
            {item.categoryName && <span>📂 {item.categoryName}</span>}
            {(item.addressText || item.address) && <span><FaMapMarkerAlt/>{item.addressText || item.address}</span>}
            {item.createdAt && <span><FaCalendarAlt/>{fmtDate(item.createdAt)}</span>}
          </div>
        </div>

        <div className="jd-grid">
          <div>
            <div className="jd-gallery">
              <div className="jd-main-photo">
                {main
                  ? <img src={main} alt={item.title}/>
                  : <div className="jl-card-media-empty" style={{height:'100%'}}>Нет фото</div>}
                {photos.length > 1 && (
                  <>
                    <button type="button" className="jd-nav-btn prev" onClick={() => setIdx((idx - 1 + photos.length) % photos.length)}><FaChevronLeft/></button>
                    <button type="button" className="jd-nav-btn next" onClick={() => setIdx((idx + 1) % photos.length)}><FaChevronRight/></button>
                  </>
                )}
              </div>
              {photos.length > 1 && (
                <div className="jd-thumbs">
                  {photos.map((p, i) => (
                    <div key={i} className={`jd-thumb ${i===idx?'is-active':''}`} onClick={() => setIdx(i)}>
                      <img src={p} alt=""/>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {item.description && (
              <div className="jd-card" style={{marginTop:16}}>
                <h3>Описание</h3>
                <div style={{whiteSpace:'pre-wrap', color:'#333', lineHeight:1.6}}>{item.description}</div>
              </div>
            )}

            <div className="jd-card">
              <h3>Подробности</h3>
              {item.categoryName && <div className="jd-row"><span className="k">Категория</span><span className="v">{item.categoryName}</span></div>}
              {(item.addressText || item.address) && <div className="jd-row"><span className="k">Адрес</span><span className="v">{item.addressText || item.address}</span></div>}
              {price && <div className="jd-row"><span className="k">Стоимость</span><span className="v">{Number(price).toLocaleString('ru-RU')} ₽</span></div>}
              {item.createdAt && <div className="jd-row"><span className="k">Опубликована</span><span className="v">{fmtDate(item.createdAt)}</span></div>}
            </div>
          </div>

          <aside className="jd-side">
            <div className="jd-price-card">
              <div className="jd-price-label">Стоимость</div>
              <div className="jd-price-value">{price ? `${Number(price).toLocaleString('ru-RU')} ₽` : 'Договорная'}</div>
              <div className="jd-price-hint">за работу</div>

              <button type="button" className="jd-btn jd-btn-primary" onClick={() => nav(`/chat/${item.customerId}?jobRequestId=${id}`)}>Откликнуться</button>
              <button type="button" className="jd-btn jd-btn-ghost" onClick={() => nav(`/chat/${item.customerId}?jobRequestId=${id}`)}>Написать сообщение</button>
            </div>

            <div className="jd-card">
              <h3 style={{fontSize:13, color:'#999', textTransform:'uppercase', letterSpacing:'.6px'}}>Заказчик</h3>
              <Link to={`/customers/${item.customerId}`} style={{textDecoration:'none', color:'inherit'}}>
                <div className="jd-author">
                  <div className="jd-author-ava">
                    {item.customerAvatar
                      ? <img src={photoUrl(item.customerAvatar)} alt=""/>
                      : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#888'}}>
                          {(item.customerName?.[0]||'?').toUpperCase()}
                        </div>}
                  </div>
                  <div>
                    <div className="jd-author-name">
                      {[item.customerName, item.customerLastName].filter(Boolean).join(' ') || 'Заказчик'}
                    </div>
                    <div className="jd-author-status">Активный заказчик</div>
                  </div>
                </div>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
