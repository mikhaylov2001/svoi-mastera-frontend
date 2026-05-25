import React, { useEffect, useState } from 'react';

const CATEGORIES = [
  'Ремонт квартир','Сантехника','Электрика','Уборка','Грузоперевозки',
  'Компьютерная помощь','Репетиторство','Красота и здоровье',
  'Маникюр и педикюр','Парикмахер','Сварочные работы',
];

function PhotoEditor({ photos, onAdd, onRemove }) {
  return (
    <div className="cab-photo-editor">
      <div className="cab-photo-title">
        Фотографии <span>{photos.length}/5</span>
      </div>
      <div className="cab-photo-grid">
        {Array.from({ length: 5 }).map((_, idx) => (
          <label key={idx} className={`cab-photo-cell${idx === 0 ? ' main' : ''}`}>
            {photos[idx] ? (
              <>
                <img src={photos[idx]} alt="" />
                <button type="button" onClick={e => { e.preventDefault(); onRemove(idx); }}>×</button>
              </>
            ) : (
              <span>{idx === 0 ? 'Главное фото' : '+'}</span>
            )}
            <input type="file" accept="image/*" onChange={onAdd} hidden />
          </label>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="cab-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function EditOrderSheet({ order, onClose, onSave }) {
  const [form, setForm] = useState({
    title: order.title || '',
    category: order.category || '',
    description: order.description || '',
    budget: order.budget || '',
    address: order.address || '',
  });
  const [photos, setPhotos] = useState(order.photos || []);
  const [saving, setSaving] = useState(false);

  const valid = form.title.trim() && form.category;
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handlePhotos = e => {
    const files = Array.from(e.target.files || []).slice(0, 5 - photos.length);
    const next = files.map(f => URL.createObjectURL(f));
    setPhotos(prev => [...prev, ...next].slice(0, 5));
  };

  const removePhoto = idx => setPhotos(prev => prev.filter((_, i) => i !== idx));

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await onSave({ ...order, ...form, photos, budget: form.budget ? Number(form.budget) : null });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cab-sheet-wrap">
      <button type="button" className="cab-sheet-backdrop" onClick={onClose} aria-label="Закрыть" />
      <section className="cab-sheet">
        <div className="cab-sheet-handle" />
        <header className="cab-sheet-head">
          <div>
            <span className="cab-sheet-kicker">Редактирование</span>
            <h2>Заявка</h2>
            <p>Обновите детали — мастера увидят актуальную информацию</p>
          </div>
          <button type="button" className="cab-sheet-close" onClick={onClose}>✕</button>
        </header>

        <div className="cab-sheet-body">
          <PhotoEditor photos={photos} onAdd={handlePhotos} onRemove={removePhoto} />
          <div className="cab-form-grid one">
            <Field label="Название заявки *">
              <input className="cab-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Что нужно сделать?" />
            </Field>
            <Field label="Категория *">
              <select className="cab-input" value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Выберите категорию…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Бюджет">
              <div className="cab-money-field">
                <input className="cab-input" type="number" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="Не указан — договорная" />
                <span>₽</span>
              </div>
            </Field>
            <Field label="Адрес / район">
              <input className="cab-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Где нужна работа?" />
            </Field>
            <Field label="Описание">
              <textarea className="cab-input cab-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Опишите задачу подробнее…" />
            </Field>
          </div>
        </div>

        <footer className="cab-sheet-actions">
          <button type="button" className="cab-secondary" onClick={onClose}>Отмена</button>
          <button type="button" className="cab-primary" disabled={!valid || saving} onClick={handleSave}>
            {saving ? 'Сохраняем…' : 'Сохранить изменения'}
          </button>
        </footer>
      </section>
    </div>
  );
}
