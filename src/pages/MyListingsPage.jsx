import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';

const CATEGORIES = [
  'Ремонт квартир', 'Сантехника', 'Электрика', 'Компьютерная помощь',
  'Уборка', 'Парикмахер', 'Маникюр и педикюр', 'Красота и здоровье',
  'Репетиторство', 'Грузоперевозки', 'Сварочные работы', 'Другое',
];

const PRICE_UNITS = ['за работу', 'за час', 'за день', 'договорная'];

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX; } }
        else { if (h > MAX) { w = w * MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

const EMPTY_FORM = { title: '', description: '', price: '', priceUnit: 'за работу', category: '', photos: [] };

export default function MyListingsPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false); // false | 'create' | listing obj
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const photoRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/workers/${userId}/listings`);
      if (r.ok) setListings(await r.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (userId) load(); }, [userId]);

  const openCreate = () => { setForm(EMPTY_FORM); setModal('create'); };
  const openEdit   = (l) => {
    setForm({
      title: l.title, description: l.description || '',
      price: l.price, priceUnit: l.priceUnit || 'за работу',
      category: l.category || '', photos: l.photos || [],
    });
    setModal(l);
  };

  const handlePhoto = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const current = form.photos || [];
    if (current.length + files.length > 5) { alert('Максимум 5 фото'); return; }
    const compressed = await Promise.all(files.map(compressImage));
    setForm(p => ({ ...p, photos: [...current, ...compressed] }));
    e.target.value = '';
  };

  const removePhoto = (i) => setForm(p => ({ ...p, photos: p.photos.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.price || !form.category) return;
    setSaving(true);
    try {
      const isEdit = modal !== 'create';
      const url  = isEdit ? `${API}/listings/${modal.id}` : `${API}/listings`;
      const method = isEdit ? 'PUT' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          price: Number(form.price),
          priceUnit: form.priceUnit,
          category: form.category,
          photos: form.photos.length ? form.photos : null,
        }),
      });
      if (r.ok) { setModal(false); await load(); }
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await fetch(`${API}/listings/${id}`, {
        method: 'DELETE',
        headers: { 'X-User-Id': userId },
      });
      await load();
    } catch {}
    setDeleting(null);
  };

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Хедер */}
      <div style={{ background: '#fff', borderBottom: '1.5px solid #e5e7eb', padding: '12px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>Мои объявления</h1>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>Ваши услуги на платформе</div>
          </div>
          <button onClick={openCreate}
            style={{ padding: '10px 20px', background: '#e8410a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            + Новое объявление
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 280, borderRadius: 12, background: '#e5e7eb', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        )}

        {!loading && listings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px', background: '#fff', borderRadius: 12, border: '1.5px dashed #e5e7eb' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Нет объявлений</h3>
            <p style={{ fontSize: 14, color: '#9ca3af', margin: '0 0 20px' }}>Опубликуйте свои услуги чтобы заказчики могли вас найти</p>
            <button onClick={openCreate}
              style={{ padding: '12px 28px', background: '#e8410a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              + Создать объявление
            </button>
          </div>
        )}

        {!loading && listings.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
            {listings.map(l => (
              <div key={l.id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', transition: 'box-shadow .2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                {/* Фото */}
                <div style={{ position: 'relative', aspectRatio: '4/3', background: '#f5f5f5', overflow: 'hidden', cursor: l.photos?.length ? 'pointer' : 'default' }}
                  onClick={() => l.photos?.length && setLightbox({ photos: l.photos, index: 0 })}>
                  {l.photos?.length
                    ? <img src={l.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#d1d5db' }}>🔧</div>
                  }
                  {l.category && (
                    <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4 }}>
                      {l.category}
                    </div>
                  )}
                  {l.photos?.length > 1 && (
                    <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: 11, padding: '2px 7px', borderRadius: 999 }}>
                      📷 {l.photos.length}
                    </div>
                  )}
                  {!l.active && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Снято с публикации</span>
                    </div>
                  )}
                </div>

                {/* Тело */}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {l.title}
                  </div>
                  {l.description && (
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.5 }}>
                      {l.description}
                    </div>
                  )}
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 12 }}>
                    {Number(l.price).toLocaleString('ru-RU')} ₽
                    <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginLeft: 4 }}>{l.priceUnit}</span>
                  </div>

                  {/* Кнопки */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(l)}
                      style={{ flex: 1, padding: '8px', background: '#f5f5f5', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                      ✏️ Редактировать
                    </button>
                    <button onClick={() => handleDelete(l.id)} disabled={deleting === l.id}
                      style={{ padding: '8px 12px', background: '#fff0f0', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#ef4444' }}>
                      {deleting === l.id ? '...' : '🗑'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ МОДАЛКА СОЗДАНИЯ/РЕДАКТИРОВАНИЯ ══ */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}
          onClick={() => setModal(false)}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                {modal === 'create' ? '+ Новое объявление' : '✏️ Редактировать'}
              </h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>

            {/* Название */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Название *</div>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Например: Установка розеток и выключателей"
                style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#e8410a'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
            </div>

            {/* Категория */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Категория *</div>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff' }}>
                <option value="">Выберите категорию</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Цена */}
            <div style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Цена (₽) *</div>
                <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  placeholder="1500"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#e8410a'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Единица</div>
                <select value={form.priceUnit} onChange={e => setForm(p => ({ ...p, priceUnit: e.target.value }))}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff' }}>
                  {PRICE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Описание */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Описание</div>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Расскажите подробнее об услуге, опыте, условиях работы..."
                rows={4}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = '#e8410a'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
            </div>

            {/* Фото */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Фото (до 5 штук)</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(form.photos || []).map((p, i) => (
                  <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => removePhoto(i)}
                      style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,.6)', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ×
                    </button>
                  </div>
                ))}
                {(form.photos || []).length < 5 && (
                  <div onClick={() => photoRef.current?.click()}
                    style={{ width: 80, height: 80, borderRadius: 8, border: '2px dashed #d1d5db', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af', fontSize: 11, gap: 4 }}>
                    <span style={{ fontSize: 22 }}>📷</span>
                    <span>Добавить</span>
                  </div>
                )}
                <input ref={photoRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhoto} />
              </div>
            </div>

            {/* Кнопки */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(false)}
                style={{ flex: 1, padding: '13px', background: '#f5f5f5', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                Отмена
              </button>
              <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.price || !form.category}
                style={{ flex: 2, padding: '13px', background: form.title.trim() && form.price && form.category ? '#e8410a' : '#e5e7eb', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: form.title.trim() && form.price && form.category ? 'pointer' : 'not-allowed', color: form.title.trim() && form.price && form.category ? '#fff' : '#9ca3af' }}>
                {saving ? 'Сохраняем...' : modal === 'create' ? '📢 Опубликовать' : '💾 Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.93)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setLightbox(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
            <img src={lightbox.photos[lightbox.index]} alt="" style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 10, display: 'block' }} />
            <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }}>×</button>
            {lightbox.photos.length > 1 && (<>
              <button onClick={e => { e.stopPropagation(); setLightbox(l => ({ ...l, index: (l.index - 1 + l.photos.length) % l.photos.length })); }}
                style={{ position: 'absolute', left: -50, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', fontSize: 26, cursor: 'pointer' }}>‹</button>
              <button onClick={e => { e.stopPropagation(); setLightbox(l => ({ ...l, index: (l.index + 1) % l.photos.length })); }}
                style={{ position: 'absolute', right: -50, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', fontSize: 26, cursor: 'pointer' }}>›</button>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}