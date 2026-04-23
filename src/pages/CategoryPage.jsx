import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { createJobRequest, getCategories } from '../api';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES_BY_SECTION } from './CategoriesPage';

const ALL_CATEGORIES = {};
const CAT_TO_SECTION = {};
Object.entries(CATEGORIES_BY_SECTION).forEach(([sectionSlug, cats]) => {
  cats.forEach(cat => {
    ALL_CATEGORIES[cat.slug] = cat;
    CAT_TO_SECTION[cat.slug] = sectionSlug;
  });
});

const CAT_TIPS = {
  'remont-kvartir': ['Укажите площадь помещения', 'Опишите материалы (если уже выбраны)', 'Приложите фото — мастер оценит объём'],
  'santehnika': ['Укажите тип работы: замена, установка, ремонт', 'Приложите фото протечки или неисправности', 'Напишите марку оборудования при наличии'],
  'elektrika': ['Опишите проблему или что нужно сделать', 'Укажите тип щитка и количество розеток', 'Приложите фото для точной оценки'],
  'uborka': ['Укажите площадь и тип уборки', 'Опишите особые пожелания (гипоаллергенные средства и т.д.)', 'Напишите удобное время'],
  'parikhmaher': ['Опишите желаемую причёску или процедуру', 'Укажите длину и тип волос', 'Можно приложить фото желаемого результата'],
  'manikur': ['Укажите вид маникюра/педикюра', 'Опишите дизайн или приложите фото', 'Укажите нужна ли гелевая база'],
  'krasota-i-zdorovie': ['Опишите процедуру и желаемый результат', 'Укажите есть ли противопоказания', 'Приложите фото при необходимости'],
  'repetitorstvo': ['Укажите предмет, класс и цель (ОГЭ/ЕГЭ/общее развитие)', 'Опишите текущий уровень знаний', 'Укажите формат: онлайн или очно'],
  'kompyuternaya-pomosh': ['Опишите проблему максимально подробно', 'Укажите марку и ОС устройства', 'Приложите скриншот ошибки при возможности'],
};

const URGENCY_OPTIONS = [
  { value: '', label: 'Не важно' },
  { value: 'urgent', label: '🔥 Срочно (сегодня-завтра)' },
  { value: 'week', label: '📅 На этой неделе' },
  { value: 'month', label: '🗓 В течение месяца' },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  .cp-page { background: #f7f7f7; min-height: 100vh; font-family: Inter, Arial, sans-serif; }
  .cp-breadcrumb { background: #fff; border-bottom: 1px solid #e8e8e8; padding: 10px 0; }
  .cp-breadcrumb-inner { max-width: 1080px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; gap: 6px; font-size: 13px; color: #999; }
  .cp-breadcrumb-link { color: #555; text-decoration: none; }
  .cp-breadcrumb-link:hover { text-decoration: underline; }
  .cp-header { background: #fff; border-bottom: 1px solid #e8e8e8; padding: 20px 0; }
  .cp-header-inner { max-width: 1080px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; gap: 14px; }
  .cp-header-icon { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0; }
  .cp-header-title { font-size: 22px; font-weight: 800; color: #111; margin: 0 0 3px; }
  .cp-header-sub { font-size: 14px; color: #999; margin: 0; }
  .cp-wrap { max-width: 1080px; margin: 0 auto; padding: 24px 20px 60px; display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: flex-start; }

  /* ── CARD секции ── */
  .cp-card { background: #fff; border-radius: 12px; border: 1px solid #e8e8e8; margin-bottom: 12px; overflow: hidden; }
  .cp-card-title { font-size: 16px; font-weight: 700; color: #111; padding: 18px 20px 0; margin-bottom: 16px; }

  /* ── ФОТО ── */
  .cp-photos { padding: 18px 20px 20px; }
  .cp-photo-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 0; }
  .cp-photo-cell { aspect-ratio: 1; border-radius: 8px; overflow: hidden; position: relative; border: 1.5px dashed #d0d0d0; background: #fafafa; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all .18s; }
  .cp-photo-cell:hover { border-color: #e8410a; background: #fff5f2; }
  .cp-photo-cell.filled { border: none; cursor: default; }
  .cp-photo-cell.main-photo { grid-column: span 2; grid-row: span 2; aspect-ratio: auto; aspect-ratio: 1; }
  .cp-photo-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cp-photo-num { font-size: 11px; font-weight: 600; color: #aaa; margin-top: 4px; }
  .cp-photo-add-icon { font-size: 28px; opacity: .5; }
  .cp-photo-add-text { font-size: 11px; color: #aaa; margin-top: 4px; text-align: center; line-height: 1.3; padding: 0 6px; }
  .cp-photo-del { position: absolute; top: 5px; right: 5px; width: 22px; height: 22px; border-radius: 50%; background: rgba(0,0,0,.55); color: #fff; font-size: 14px; line-height: 1; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; opacity: 0; transition: opacity .15s; }
  .cp-photo-cell.filled:hover .cp-photo-del { opacity: 1; }
  .cp-photo-main-badge { position: absolute; bottom: 6px; left: 6px; background: rgba(0,0,0,.5); color: #fff; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px; }
  .cp-photo-hint { font-size: 12px; color: #aaa; margin-top: 10px; }

  /* ── ФОРМА ПОЛЯ ── */
  .cp-fields { padding: 0 20px 20px; display: flex; flex-direction: column; gap: 16px; }
  .cp-field label { display: block; font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px; }
  .cp-field input, .cp-field textarea, .cp-field select {
    width: 100%; padding: 12px 14px; border: 1.5px solid #e0e0e0; border-radius: 8px;
    font-size: 15px; font-family: inherit; color: #111; outline: none; box-sizing: border-box;
    transition: border-color .15s, box-shadow .15s;
    background: #fff;
  }
  .cp-field input:focus, .cp-field textarea:focus, .cp-field select:focus {
    border-color: #e8410a; box-shadow: 0 0 0 3px rgba(232,65,10,.08);
  }
  .cp-field textarea { resize: vertical; min-height: 110px; line-height: 1.6; }
  .cp-field-hint { font-size: 12px; color: #aaa; margin-top: 5px; line-height: 1.4; }
  .cp-field-hint.tips { color: #777; }
  .cp-fields-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  /* ── ЦЕНА ── */
  .cp-price-block { padding: 18px 20px 20px; }
  .cp-price-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: end; }
  .cp-price-tag { display: inline-flex; align-items: center; gap: 5px; background: #fff7ed; border: 1px solid #fcd34d; border-radius: 6px; padding: 6px 10px; font-size: 12px; color: #92400e; font-weight: 600; margin-top: 10px; }
  .cp-price-visible { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }

  /* ── КНОПКА ОТПРАВКИ ── */
  .cp-submit-card { padding: 20px; }
  .cp-btn-submit { width: 100%; padding: 15px; background: #e8410a; border: none; border-radius: 10px; color: #fff; font-size: 16px; font-weight: 700; font-family: inherit; cursor: pointer; transition: background .15s; }
  .cp-btn-submit:hover { background: #c73208; }
  .cp-btn-submit:disabled { background: #fca98e; cursor: not-allowed; }
  .cp-form-auth { text-align: center; font-size: 13px; color: #aaa; margin-top: 10px; }
  .cp-form-auth a { color: #e8410a; font-weight: 600; text-decoration: none; }

  /* ── ОШИБКА ── */
  .cp-error { background: #fff5f5; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #dc2626; margin-bottom: 12px; }

  /* ── САЙДБАР ── */
  .cp-sidebar { display: flex; flex-direction: column; gap: 12px; position: sticky; top: 76px; }
  .cp-sb-card { background: #fff; border-radius: 12px; border: 1px solid #e8e8e8; padding: 18px; }
  .cp-sb-title { font-size: 14px; font-weight: 700; color: #111; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
  .cp-sb-item { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: #555; padding: 8px 0; border-bottom: 1px solid #f5f5f5; line-height: 1.5; }
  .cp-sb-item:last-child { border-bottom: none; padding-bottom: 0; }
  .cp-sb-ico { font-size: 18px; flex-shrink: 0; }
  .cp-steps { counter-reset: step; display: flex; flex-direction: column; gap: 10px; }
  .cp-step { display: flex; align-items: flex-start; gap: 12px; font-size: 13px; color: #555; }
  .cp-step-num { width: 24px; height: 24px; border-radius: 50%; background: #e8410a; color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .cp-tips-list { display: flex; flex-direction: column; gap: 6px; }
  .cp-tip-item { font-size: 12px; color: #666; padding-left: 14px; position: relative; line-height: 1.5; }
  .cp-tip-item::before { content: '💡'; position: absolute; left: 0; font-size: 11px; }

  /* ── УСПЕХ ── */
  .cp-success { max-width: 520px; margin: 80px auto; background: #fff; border-radius: 16px; border: 1px solid #e8e8e8; padding: 48px 36px; text-align: center; }
  .cp-success-ico { font-size: 64px; margin-bottom: 16px; }
  .cp-success h2 { font-size: 24px; font-weight: 800; color: #111; margin-bottom: 10px; }
  .cp-success p { font-size: 15px; color: #666; line-height: 1.7; margin-bottom: 24px; }
  .cp-success-btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
  .cp-success-btn-primary { padding: 13px 28px; background: #e8410a; border: none; border-radius: 8px; color: #fff; font-size: 15px; font-weight: 700; font-family: inherit; cursor: pointer; text-decoration: none; }
  .cp-success-btn-outline { padding: 12px 24px; background: #fff; border: 1.5px solid #e0e0e0; border-radius: 8px; color: #555; font-size: 15px; font-weight: 600; font-family: inherit; cursor: pointer; }
  .cp-success-btn-outline:hover { border-color: #999; }

  /* urgency radio */
  .cp-urgency { display: flex; flex-wrap: wrap; gap: 8px; }
  .cp-urgency-opt { padding: 8px 14px; border: 1.5px solid #e0e0e0; border-radius: 20px; font-size: 13px; font-weight: 500; color: #555; cursor: pointer; transition: all .15s; background: #fff; font-family: inherit; }
  .cp-urgency-opt.selected { border-color: #e8410a; background: #fff5f2; color: #e8410a; font-weight: 700; }
  .cp-urgency-opt:hover:not(.selected) { border-color: #aaa; }

  /* char counter */
  .cp-field-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
  .cp-char-count { font-size: 12px; color: #aaa; }
  .cp-char-count.warn { color: #f59e0b; }
  .cp-char-count.over { color: #ef4444; }

  @media(max-width: 860px) { .cp-wrap { grid-template-columns: 1fr; } .cp-sidebar { position: static; } }
  @media(max-width: 560px) { .cp-photo-grid { grid-template-columns: repeat(3, 1fr); } .cp-fields-row { grid-template-columns: 1fr; } .cp-price-row { grid-template-columns: 1fr; } }
`;

const MAX_DESC = 2000;

export default function CategoryPage() {
  const { slug } = useParams();
  const { userId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const photoInputRef = useRef(null);

  const category = ALL_CATEGORIES[slug];
  const sectionSlug = CAT_TO_SECTION[slug];

  const [form, setForm] = useState({ title: '', description: '', address: '', budget: '', urgency: '', photos: [] });
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [apiCategoryId, setApiCategoryId] = useState(null);
  const tips = CAT_TIPS[slug] || [];

  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    const title = qp.get('title') || '';
    const description = qp.get('description') || '';
    if (title || description) setForm(prev => ({ ...prev, ...(title ? { title } : {}), ...(description ? { description } : {}) }));
  }, [location.search]);

  useEffect(() => {
    getCategories().then(cats => {
      const found = cats.find(c => c.slug === slug);
      if (found) setApiCategoryId(found.id);
    }).catch(() => {});
  }, [slug]);

  const compressPhoto = (file) => new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 1200;
        let w = img.width, h = img.height;
        if (w > MAX) { h = h * MAX / w; w = MAX; }
        if (h > MAX) { w = w * MAX / h; h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  const handlePhotoUpload = async (files) => {
    setError('');
    const validFiles = Array.from(files).filter(f => {
      if (!f.type.startsWith('image/')) { setError('Можно загружать только изображения'); return false; }
      if (f.size > 10 * 1024 * 1024) { setError('Файл слишком большой (максимум 10 МБ)'); return false; }
      return true;
    });
    const remaining = 5 - form.photos.length;
    const toAdd = validFiles.slice(0, remaining);
    if (validFiles.length > remaining) setError(`Максимум 5 фотографий`);
    for (const file of toAdd) {
      const data = await compressPhoto(file);
      setForm(prev => ({ ...prev, photos: [...prev.photos, { id: Date.now() + Math.random(), data, name: file.name }] }));
    }
  };

  const handleRemovePhoto = (id) => setForm(prev => ({ ...prev, photos: prev.photos.filter(p => p.id !== id) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!userId) { navigate('/login'); return; }
    if (!form.title.trim()) { setError('Укажите название задачи'); return; }
    if (!form.description.trim()) { setError('Добавьте подробное описание'); return; }
    if (!form.address.trim()) { setError('Укажите адрес выполнения работы'); return; }
    if (!form.budget) { setError('Укажите предварительную цену'); return; }
    if (Number(form.budget) <= 0) { setError('Цена должна быть больше нуля'); return; }

    let categoryId = apiCategoryId;
    if (!categoryId) {
      try {
        const cats = await getCategories();
        const found = cats.find(c => c.slug === slug);
        if (found) { categoryId = found.id; setApiCategoryId(found.id); }
        else { setError('Категория не найдена'); return; }
      } catch { setError('Не удалось загрузить категории'); return; }
    }

    setStatus('sending');
    try {
      const desc = form.urgency
        ? `${form.description.trim()}\n\n⏰ Срочность: ${URGENCY_OPTIONS.find(o => o.value === form.urgency)?.label || form.urgency}`
        : form.description.trim();
      await createJobRequest(userId, {
        categoryId,
        title: form.title.trim(),
        description: desc,
        address: form.address.trim(),
        budget: Number(form.budget),
        photos: form.photos.map(p => p.data),
      });
      setStatus('success');
    } catch (err) {
      setError(err.message || 'Не удалось создать заявку');
      setStatus('error');
    }
  };

  if (!category) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <p style={{ color: '#999' }}>Категория не найдена</p>
        <Link to="/sections" style={{ color: '#e8410a', fontWeight: 700 }}>← К разделам</Link>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="cp-page">
        <style>{css}</style>
        <div style={{ padding: '40px 20px' }}>
          <div className="cp-success">
            <div className="cp-success-ico">🎉</div>
            <h2>Заявка опубликована!</h2>
            <p>
              Мастера уже видят вашу задачу{form.photos.length > 0 ? ' и фотографии' : ''}.
              Первые отклики обычно приходят в течение <strong>10 минут</strong>. Следите за предложениями в разделе «Мои сделки».
            </p>
            <div className="cp-success-btns">
              <Link to="/deals" className="cp-success-btn-primary">Перейти к сделкам →</Link>
              <button
                className="cp-success-btn-outline"
                onClick={() => { setStatus('idle'); setForm({ title: '', description: '', address: '', budget: '', urgency: '', photos: [] }); }}
              >
                Создать ещё
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const descLen = form.description.length;

  return (
    <div className="cp-page">
      <style>{css}</style>

      {/* Хлебная крошка */}
      <div className="cp-breadcrumb">
        <div className="cp-breadcrumb-inner">
          <Link to="/sections" className="cp-breadcrumb-link">Услуги</Link>
          <span>›</span>
          <Link to={`/sections/${sectionSlug}`} className="cp-breadcrumb-link">{category.name}</Link>
          <span>›</span>
          <span>Разместить заявку</span>
        </div>
      </div>

      {/* Заголовок */}
      <div className="cp-header">
        <div className="cp-header-inner">
          <div className="cp-header-icon" style={{ background: category.color }}>{category.emoji}</div>
          <div>
            <h1 className="cp-header-title">{category.name}</h1>
            <p className="cp-header-sub">Опишите задачу — мастера откликнутся сами</p>
          </div>
        </div>
      </div>

      <div className="cp-wrap">
        {/* ═══ ЛЕВАЯ КОЛОНКА — ФОРМА ═══ */}
        <div>
          {error && <div className="cp-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>

            {/* ── 1. ФОТОГРАФИИ ── */}
            <div className="cp-card">
              <div className="cp-card-title">Фотографии <span style={{ fontSize: 13, color: '#aaa', fontWeight: 400 }}>(необязательно, до 5 шт.)</span></div>
              <div className="cp-photos">
                <div
                  className="cp-photo-grid"
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => { e.preventDefault(); setIsDragging(false); handlePhotoUpload(e.dataTransfer.files); }}
                >
                  {/* Слоты фото */}
                  {Array.from({ length: 5 }).map((_, i) => {
                    const photo = form.photos[i];
                    if (photo) {
                      return (
                        <div key={photo.id} className={`cp-photo-cell filled${i === 0 ? ' main-photo' : ''}`}>
                          <img src={photo.data} alt="" className="cp-photo-img" />
                          {i === 0 && <span className="cp-photo-main-badge">Главное</span>}
                          <button type="button" className="cp-photo-del" onClick={() => handleRemovePhoto(photo.id)}>×</button>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={i}
                        className={`cp-photo-cell${isDragging ? ' dragging' : ''}`}
                        style={isDragging ? { borderColor: '#e8410a', background: '#fff5f2' } : {}}
                        onClick={() => photoInputRef.current?.click()}
                      >
                        <span className="cp-photo-add-icon">{i === 0 ? '📷' : '+'}</span>
                        <span className="cp-photo-num">{i === 0 ? 'Добавить фото' : `Фото ${i + 1}`}</span>
                      </div>
                    );
                  })}
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={e => { handlePhotoUpload(e.target.files); e.target.value = ''; }}
                />
                <p className="cp-photo-hint">
                  {form.photos.length > 0
                    ? `${form.photos.length}/5 фото добавлено · Первое фото — главное`
                    : 'Перетащите файлы сюда или кликните по ячейке · PNG, JPG до 10 МБ'}
                </p>
              </div>
            </div>

            {/* ── 2. ОПИСАНИЕ ── */}
            <div className="cp-card">
              <div className="cp-card-title">Описание задачи</div>
              <div className="cp-fields">
                <div className="cp-field">
                  <label>Название задачи *</label>
                  <input
                    name="title"
                    placeholder={`Например: «${category.name}»`}
                    value={form.title}
                    onChange={e => { setError(''); setForm(p => ({ ...p, title: e.target.value })); }}
                    maxLength={120}
                    required
                  />
                  <span className="cp-field-hint">Коротко и конкретно: что нужно сделать</span>
                </div>
                <div className="cp-field">
                  <div className="cp-field-top">
                    <label style={{ margin: 0 }}>Подробное описание *</label>
                    <span className={`cp-char-count${descLen > MAX_DESC * 0.9 ? descLen > MAX_DESC ? ' over' : ' warn' : ''}`}>
                      {descLen}/{MAX_DESC}
                    </span>
                  </div>
                  <textarea
                    name="description"
                    placeholder="Подробно опишите что нужно сделать: объём работы, материалы, особые пожелания…"
                    value={form.description}
                    onChange={e => { setError(''); setForm(p => ({ ...p, description: e.target.value })); }}
                    maxLength={MAX_DESC}
                    rows={5}
                    required
                  />
                  {tips.length > 0 && (
                    <div className="cp-tips-list" style={{ marginTop: 8 }}>
                      {tips.map((t, i) => <span key={i} className="cp-tip-item">{t}</span>)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── 3. МЕСТО И СРОКИ ── */}
            <div className="cp-card">
              <div className="cp-card-title">Место и сроки</div>
              <div className="cp-fields">
                <div className="cp-field">
                  <label>Адрес выполнения *</label>
                  <input
                    name="address"
                    placeholder="Улица, дом, квартира"
                    value={form.address}
                    onChange={e => { setError(''); setForm(p => ({ ...p, address: e.target.value })); }}
                    required
                  />
                  <span className="cp-field-hint">📍 Йошкар-Ола, Республика Марий Эл</span>
                </div>
                <div className="cp-field">
                  <label>Срочность</label>
                  <div className="cp-urgency">
                    {URGENCY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`cp-urgency-opt${form.urgency === opt.value ? ' selected' : ''}`}
                        onClick={() => setForm(p => ({ ...p, urgency: opt.value }))}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── 4. БЮДЖЕТ ── */}
            <div className="cp-card">
              <div className="cp-card-title">Предварительная цена</div>
              <div className="cp-price-block">
                <div className="cp-fields-row" style={{ marginBottom: 12 }}>
                  <div className="cp-field" style={{ margin: 0 }}>
                    <label>Ваш бюджет, ₽ *</label>
                    <input
                      name="budget"
                      type="number"
                      min="1"
                      placeholder="Например: 3 000"
                      value={form.budget}
                      onChange={e => { setError(''); setForm(p => ({ ...p, budget: e.target.value })); }}
                      required
                    />
                  </div>
                  <div style={{ padding: '6px 0 0', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    {form.budget && Number(form.budget) > 0 ? (
                      <div style={{ padding: '12px 14px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 8 }}>
                        <div style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>
                          ✅ Мастера увидят: <strong>{Number(form.budget).toLocaleString('ru-RU')} ₽</strong>
                        </div>
                        <div style={{ fontSize: 12, color: '#16a34a', marginTop: 3 }}>
                          Они смогут принять эту сумму или предложить свою
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '12px 14px', background: '#fafafa', border: '1.5px solid #e8e8e8', borderRadius: 8 }}>
                        <div style={{ fontSize: 13, color: '#aaa' }}>Укажите сумму → мастера её увидят</div>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8, padding: '12px 14px' }}>
                  <strong style={{ color: '#555' }}>Как работает цена:</strong><br />
                  Ваш бюджет показывается мастерам. Мастер может нажать <em>«Готов за эту сумму»</em> — 
                  тогда вы видите его согласие. Или предложит другую цену — вы сравните и выберете.
                </div>
              </div>
            </div>

            {/* ── КНОПКА ── */}
            <div className="cp-card">
              <div className="cp-submit-card">
                <button
                  type="submit"
                  className="cp-btn-submit"
                  disabled={status === 'sending'}
                >
                  {status === 'sending' ? '⏳ Публикуем заявку…' : '📤 Опубликовать заявку мастерам'}
                </button>
                {!userId && (
                  <p className="cp-form-auth">
                    Для отправки нужно <Link to="/login">войти в аккаунт</Link>
                  </p>
                )}
                <p style={{ fontSize: 12, color: '#bbb', textAlign: 'center', marginTop: 10, marginBottom: 0 }}>
                  Размещение бесплатно · Мастера видят заявку сразу после публикации
                </p>
              </div>
            </div>

          </form>
        </div>

        {/* ═══ САЙДБАР ═══ */}
        <div className="cp-sidebar">

          <div className="cp-sb-card">
            <div className="cp-sb-title">⚡ Как это работает</div>
            <div className="cp-steps">
              {[
                ['Опубликуйте задачу', 'Опишите что нужно сделать и укажите бюджет'],
                ['Получайте отклики', 'Мастера увидят вашу цену и пришлют предложения'],
                ['Выберите мастера', 'Сравните цены, отзывы и рейтинги'],
                ['Подтвердите работу', 'Оплата проходит только после выполнения'],
              ].map(([title, desc], i) => (
                <div key={i} className="cp-step">
                  <span className="cp-step-num">{i + 1}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 2 }}>{title}</div>
                    <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cp-sb-card">
            <div className="cp-sb-title">🔒 Ваша безопасность</div>
            {[
              ['🛡', 'Безопасная сделка', 'Оплата поступает мастеру только после вашего подтверждения'],
              ['⭐', 'Проверенные мастера', 'Реальные отзывы и рейтинги — только от реальных заказчиков'],
              ['💬', 'Прямая связь', 'Переписывайтесь с мастерами прямо в чате до начала работ'],
            ].map(([ico, title, desc]) => (
              <div key={title} className="cp-sb-item">
                <span className="cp-sb-ico">{ico}</span>
                <div>
                  <div style={{ fontWeight: 600, color: '#333', marginBottom: 2 }}>{title}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {tips.length > 0 && (
            <div className="cp-sb-card">
              <div className="cp-sb-title">💡 Советы для {category.name.toLowerCase()}</div>
              <div className="cp-tips-list">
                {tips.map((t, i) => <span key={i} className="cp-tip-item">{t}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
