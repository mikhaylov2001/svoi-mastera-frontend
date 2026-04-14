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
const EMPTY_FORM = { title: '', description: '', price: '', priceUnit: 'за работу', category: '', photos: [] };

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

export default function MyListingsPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('active'); // active | archive
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const [lightbox, setLightbox]   = useState(null);
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

  const active  = listings.filter(l => l.active);
  const archive = listings.filter(l => !l.active);
  const shown   = tab === 'active' ? active : archive;

  const openCreate = () => { setForm(EMPTY_FORM); setModal('create'); };
  const openEdit   = (l) => {
    setForm({ title: l.title, description: l.description || '', price: l.price, priceUnit: l.priceUnit || 'за работу', category: l.category || '', photos: l.photos || [] });
    setModal(l);
  };

  const handlePhoto = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if ((form.photos?.length || 0) + files.length > 5) { alert('Максимум 5 фото'); return; }
    const compressed = await Promise.all(files.map(compressImage));
    setForm(p => ({ ...p, photos: [...(p.photos || []), ...compressed] }));
    e.target.value = '';
  };

  const removePhoto = (i) => setForm(p => ({ ...p, photos: p.photos.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.price || !form.category) return;
    setSaving(true);
    try {
      const isEdit = modal !== 'create';
      const r = await fetch(isEdit ? `${API}/listings/${modal.id}` : `${API}/listings`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ title: form.title.trim(), description: form.description.trim() || null, price: Number(form.price), priceUnit: form.priceUnit, category: form.category, photos: form.photos?.length ? form.photos : null }),
      });
      if (r.ok) { setModal(false); await load(); }
    } catch {}
    setSaving(false);
  };

  const handleToggleActive = async (l) => {
    try {
      if (l.active) {
        await fetch(`${API}/listings/${l.id}`, { method: 'DELETE', headers: { 'X-User-Id': userId } });
      } else {
        await fetch(`${API}/listings/${l.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
          body: JSON.stringify({ title: l.title, description: l.description, price: l.price, priceUnit: l.priceUnit, category: l.category, photos: l.photos }),
        });
      }
      await load();
    } catch {}
  };

  const css = `
    .ml-page { background: #f7f8fa; min-height: 100vh; font-family: Arial, Helvetica, sans-serif; }
    .ml-wrap { max-width: 960px; margin: 0 auto; padding: 0 16px 60px; }
    .ml-header { background: #fff; border-bottom: 1px solid #e8e8e8; padding: 16px 0; margin-bottom: 0; }
    .ml-header-inner { max-width: 960px; margin: 0 auto; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; }
    .ml-title { font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0; }
    .ml-new-btn { background: #00aaff; border: none; border-radius: 8px; color: #fff; font-size: 14px; font-weight: 700; padding: 10px 20px; cursor: pointer; transition: background .15s; }
    .ml-new-btn:hover { background: #0099ee; }
    .ml-tabs { display: flex; border-bottom: 1px solid #e8e8e8; background: #fff; margin-bottom: 16px; }
    .ml-tab { background: none; border: none; border-bottom: 2px solid transparent; padding: 14px 20px; font-size: 14px; font-weight: 600; color: #8f8f8f; cursor: pointer; margin-bottom: -1px; transition: all .15s; }
    .ml-tab.active { color: #1a1a1a; border-bottom-color: #00aaff; }
    .ml-tab-count { font-size: 12px; background: #f0f0f0; border-radius: 10px; padding: 1px 7px; margin-left: 6px; color: #666; }
    .ml-tab.active .ml-tab-count { background: #e6f5ff; color: #00aaff; }
    .ml-list { display: flex; flex-direction: column; gap: 0; background: #fff; border-radius: 8px; border: 1px solid #e8e8e8; overflow: hidden; }
    .ml-item { display: flex; gap: 16px; padding: 16px; border-bottom: 1px solid #f0f0f0; transition: background .15s; }
    .ml-item:last-child { border-bottom: none; }
    .ml-item:hover { background: #fafafa; }
    .ml-item-img { width: 120px; height: 90px; border-radius: 6px; overflow: hidden; flex-shrink: 0; background: #f5f5f5; display: flex; align-items: center; justify-content: center; font-size: 32px; cursor: pointer; position: relative; }
    .ml-item-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .ml-item-img-count { position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,.5); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 5px; border-radius: 3px; }
    .ml-item-body { flex: 1; min-width: 0; }
    .ml-item-title { font-size: 15px; font-weight: 700; color: #1a1a1a; margin: 0 0 4px; cursor: pointer; }
    .ml-item-title:hover { color: #00aaff; }
    .ml-item-price { font-size: 17px; font-weight: 800; color: #1a1a1a; margin-bottom: 4px; }
    .ml-item-price-unit { font-size: 12px; color: #8f8f8f; font-weight: 500; margin-left: 4px; }
    .ml-item-cat { display: inline-block; font-size: 12px; color: #8f8f8f; background: #f5f5f5; border-radius: 4px; padding: 2px 8px; margin-bottom: 6px; }
    .ml-item-desc { font-size: 13px; color: #6b6b6b; line-height: 1.5; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; margin-bottom: 8px; }
    .ml-item-meta { display: flex; gap: 14px; font-size: 12px; color: #8f8f8f; }
    .ml-item-meta span { display: flex; align-items: center; gap: 4px; }
    .ml-item-actions { display: flex; flex-direction: column; gap: 8px; align-items: flex-end; flex-shrink: 0; }
    .ml-btn-edit { background: #fff; border: 1.5px solid #d6d6d6; border-radius: 6px; padding: 7px 16px; font-size: 13px; font-weight: 600; color: #333; cursor: pointer; transition: border-color .15s; white-space: nowrap; }
    .ml-btn-edit:hover { border-color: #00aaff; color: #00aaff; }
    .ml-btn-archive { background: none; border: none; font-size: 12px; color: #8f8f8f; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
    .ml-btn-archive:hover { color: #e8410a; }
    .ml-btn-restore { background: none; border: none; font-size: 12px; color: #00aaff; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
    .ml-empty { text-align: center; padding: 80px 24px; color: #8f8f8f; background: #fff; border-radius: 8px; border: 1px solid #e8e8e8; }
    .ml-empty-icon { font-size: 52px; margin-bottom: 16px; }
    .ml-empty h3 { font-size: 17px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px; }
    .ml-empty p { font-size: 14px; margin: 0 0 20px; }
    /* Модалка */
    .ml-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .ml-modal { background: #fff; border-radius: 12px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; padding: 24px; }
    .ml-modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .ml-modal-title { font-size: 18px; font-weight: 800; margin: 0; }
    .ml-modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #8f8f8f; line-height: 1; }
    .ml-label { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; display: block; }
    .ml-input { width: 100%; padding: 10px 13px; border-radius: 7px; border: 1.5px solid #e0e0e0; font-size: 14px; outline: none; box-sizing: border-box; font-family: Arial, sans-serif; transition: border-color .15s; }
    .ml-input:focus { border-color: #00aaff; }
    .ml-textarea { resize: vertical; min-height: 90px; line-height: 1.6; }
    .ml-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .ml-photos-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .ml-photo-thumb { position: relative; width: 76px; height: 76px; border-radius: 7px; overflow: hidden; }
    .ml-photo-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .ml-photo-del { position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; border-radius: 50%; background: rgba(0,0,0,.6); border: none; color: #fff; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .ml-photo-add { width: 76px; height: 76px; border-radius: 7px; border: 2px dashed #d1d5db; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; color: #9ca3af; font-size: 11px; gap: 3px; }
    .ml-photo-add:hover { border-color: #00aaff; color: #00aaff; }
    .ml-modal-footer { display: flex; gap: 10px; margin-top: 20px; }
    .ml-btn-cancel { flex: 1; padding: 12px; background: #f5f5f5; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; color: #333; }
    .ml-btn-save { flex: 2; padding: 12px; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; transition: background .15s; }
    .ml-field { margin-bottom: 14px; }
    @media(max-width: 600px) { .ml-item-img { width: 90px; height: 68px; } .ml-item-actions { flex-direction: row; align-items: center; } }
  `;

  return (
    <div className="ml-page">
      <style>{css}</style>

      {/* Хедер */}
      <div className="ml-header">
        <div className="ml-header-inner">
          <h1 className="ml-title">Мои объявления</h1>
          <button className="ml-new-btn" onClick={openCreate}>+ Разместить объявление</button>
        </div>
      </div>

      <div className="ml-wrap" style={{ paddingTop: 0 }}>
        {/* Табы */}
        <div className="ml-tabs">
          <button className={`ml-tab${tab === 'active' ? ' active' : ''}`} onClick={() => setTab('active')}>
            Активные <span className="ml-tab-count">{active.length}</span>
          </button>
          <button className={`ml-tab${tab === 'archive' ? ' active' : ''}`} onClick={() => setTab('archive')}>
            Архив <span className="ml-tab-count">{archive.length}</span>
          </button>
        </div>

        {/* Список */}
        {loading ? (
          <div className="ml-list">
            {[1,2,3].map(i => (
              <div key={i} className="ml-item">
                <div style={{ width: 120, height: 90, borderRadius: 6, background: '#f0f0f0' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 16, background: '#f0f0f0', borderRadius: 4, width: '60%', marginBottom: 8 }} />
                  <div style={{ height: 20, background: '#f0f0f0', borderRadius: 4, width: '30%', marginBottom: 8 }} />
                  <div style={{ height: 13, background: '#f0f0f0', borderRadius: 4, width: '80%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="ml-empty">
            <div className="ml-empty-icon">{tab === 'active' ? '📋' : '📦'}</div>
            <h3>{tab === 'active' ? 'Нет активных объявлений' : 'Архив пуст'}</h3>
            <p>{tab === 'active' ? 'Разместите объявление чтобы заказчики могли вас найти' : 'Снятые объявления появятся здесь'}</p>
            {tab === 'active' && (
              <button className="ml-new-btn" onClick={openCreate} style={{ marginTop: 4 }}>+ Разместить объявление</button>
            )}
          </div>
        ) : (
          <div className="ml-list">
            {shown.map(l => (
              <div key={l.id} className="ml-item">
                {/* Фото */}
                <div className="ml-item-img" onClick={() => l.photos?.length && setLightbox({ photos: l.photos, index: 0 })}>
                  {l.photos?.length
                    ? <>
                        <img src={l.photos[0]} alt="" />
                        {l.photos.length > 1 && <span className="ml-item-img-count">📷 {l.photos.length}</span>}
                      </>
                    : '🔧'
                  }
                </div>

                {/* Контент */}
                <div className="ml-item-body">
                  <div className="ml-item-title" onClick={() => openEdit(l)}>{l.title}</div>
                  <div className="ml-item-price">
                    {Number(l.price).toLocaleString('ru-RU')} ₽
                    <span className="ml-item-price-unit">{l.priceUnit}</span>
                  </div>
                  {l.category && <span className="ml-item-cat">{l.category}</span>}
                  {l.description && <div className="ml-item-desc">{l.description}</div>}
                  <div className="ml-item-meta">
                    <span>📅 {l.createdAt ? new Date(l.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '—'}</span>
                    {!l.active && <span style={{ color: '#ef4444', fontWeight: 600 }}>● В архиве</span>}
                  </div>
                </div>

                {/* Действия */}
                <div className="ml-item-actions">
                  <button className="ml-btn-edit" onClick={() => openEdit(l)}>Редактировать</button>
                  <button
                    className={l.active ? 'ml-btn-archive' : 'ml-btn-restore'}
                    onClick={() => handleToggleActive(l)}
                  >
                    {l.active ? 'Снять с публикации' : 'Восстановить'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ МОДАЛКА ══ */}
      {modal && (
        <div className="ml-modal-overlay" onClick={() => setModal(false)}>
          <div className="ml-modal" onClick={e => e.stopPropagation()}>
            <div className="ml-modal-header">
              <h2 className="ml-modal-title">{modal === 'create' ? 'Новое объявление' : 'Редактировать'}</h2>
              <button className="ml-modal-close" onClick={() => setModal(false)}>×</button>
            </div>

            <div className="ml-field">
              <label className="ml-label">Название *</label>
              <input className="ml-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Например: Установка розеток и выключателей" />
            </div>

            <div className="ml-field">
              <label className="ml-label">Категория *</label>
              <select className="ml-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                <option value="">Выберите категорию</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="ml-field ml-row">
              <div>
                <label className="ml-label">Цена (₽) *</label>
                <input className="ml-input" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="1500" />
              </div>
              <div>
                <label className="ml-label">Единица</label>
                <select className="ml-input" value={form.priceUnit} onChange={e => setForm(p => ({ ...p, priceUnit: e.target.value }))}>
                  {PRICE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="ml-field">
              <label className="ml-label">Описание</label>
              <textarea className="ml-input ml-textarea" value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Расскажите подробнее об услуге..." />
            </div>

            <div className="ml-field">
              <label className="ml-label">Фото (до 5 штук)</label>
              <div className="ml-photos-row">
                {(form.photos || []).map((p, i) => (
                  <div key={i} className="ml-photo-thumb">
                    <img src={p} alt="" />
                    <button className="ml-photo-del" onClick={() => removePhoto(i)}>×</button>
                  </div>
                ))}
                {(form.photos || []).length < 5 && (
                  <div className="ml-photo-add" onClick={() => photoRef.current?.click()}>
                    <span style={{ fontSize: 20 }}>📷</span>
                    <span>Добавить</span>
                  </div>
                )}
                <input ref={photoRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhoto} />
              </div>
            </div>

            <div className="ml-modal-footer">
              <button className="ml-btn-cancel" onClick={() => setModal(false)}>Отмена</button>
              <button className="ml-btn-save"
                disabled={saving || !form.title.trim() || !form.price || !form.category}
                style={{ background: form.title.trim() && form.price && form.category ? '#00aaff' : '#e0e0e0', color: form.title.trim() && form.price && form.category ? '#fff' : '#999' }}
                onClick={handleSave}>
                {saving ? 'Сохраняем...' : modal === 'create' ? 'Опубликовать' : 'Сохранить'}
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