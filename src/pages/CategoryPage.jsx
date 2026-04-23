import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  .cp-page { background: #f2f2f2; min-height: 100vh; font-family: Inter, Arial, sans-serif; }

  /* ── HERO HEADER ── */
  .cp-hero { position: relative; height: 180px; overflow: hidden; }
  .cp-hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(.55) saturate(1.1); }
  .cp-hero-overlay { position: absolute; inset: 0; background: linear-gradient(175deg, rgba(0,0,0,.1) 0%, rgba(0,0,0,.6) 100%); }
  .cp-hero-body { position: relative; z-index: 1; max-width: 1080px; margin: 0 auto; padding: 0 20px; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; padding-bottom: 24px; }
  .cp-hero-back { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: rgba(255,255,255,.75); text-decoration: none; background: none; border: none; font-family: inherit; cursor: pointer; padding: 0; margin-bottom: 10px; transition: color .15s; }
  .cp-hero-back:hover { color: #fff; }
  .cp-hero-row { display: flex; align-items: center; gap: 14px; }
  .cp-hero-thumb-wrap {
    width: 52px; height: 52px; border-radius: 12px; overflow: hidden; flex-shrink: 0;
    border: 2px solid rgba(255,255,255,.4); box-shadow: 0 4px 16px rgba(0,0,0,.35);
  }
  .cp-hero-thumb { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cp-hero-title { font-size: 24px; font-weight: 900; color: #fff; margin: 0 0 3px; }
  .cp-hero-sub { font-size: 14px; color: rgba(255,255,255,.75); margin: 0; }

  .cp-wrap { max-width: 1080px; margin: 0 auto; padding: 20px 20px 60px; display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: flex-start; }

  /* ── CARD ── */
  .cp-card { background: #fff; border-radius: 12px; border: 1px solid #e8e8e8; margin-bottom: 12px; overflow: hidden; }
  .cp-card-title { font-size: 16px; font-weight: 700; color: #111; padding: 18px 20px 0; margin-bottom: 16px; }

  /* ── ФОТО СЕТКА ── */
  .cp-photos { padding: 18px 20px 20px; }
  .cp-photo-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
  .cp-photo-cell { aspect-ratio: 1; border-radius: 8px; overflow: hidden; position: relative; border: 1.5px dashed #d0d0d0; background: #fafafa; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all .18s; }
  .cp-photo-cell:hover { border-color: #e8410a; background: #fff5f2; }
  .cp-photo-cell.filled { border: none; cursor: zoom-in; }
  .cp-photo-cell.main-photo { grid-column: span 2; grid-row: span 2; }
  .cp-photo-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s; }
  .cp-photo-cell.filled:hover .cp-photo-img { transform: scale(1.05); }
  .cp-photo-add-icon { font-size: 28px; opacity: .5; }
  .cp-photo-num { font-size: 11px; font-weight: 600; color: #aaa; margin-top: 4px; text-align: center; }
  .cp-photo-hint { font-size: 12px; color: #aaa; margin-top: 10px; }
  .cp-photo-del { position: absolute; top: 5px; right: 5px; width: 26px; height: 26px; border-radius: 50%; background: rgba(0,0,0,.6); color: #fff; font-size: 16px; line-height: 1; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; opacity: 0; transition: opacity .15s, background .15s; z-index: 2; }
  .cp-photo-cell.filled:hover .cp-photo-del { opacity: 1; }
  .cp-photo-del:hover { background: #dc2626 !important; }
  .cp-photo-main-badge { position: absolute; bottom: 6px; left: 6px; background: rgba(0,0,0,.5); color: #fff; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px; }
  .cp-photo-zoom { position: absolute; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .2s; }
  .cp-photo-zoom-text { font-size: 12px; font-weight: 700; color: #fff; letter-spacing: .04em; text-transform: uppercase; }
  .cp-photo-cell.filled:hover .cp-photo-zoom { opacity: 1; }
  /* ── LIGHTBOX ── */
  .cp-lb { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,.94); display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .cp-lb-img-wrap { position: relative; max-width: 92vw; max-height: 82vh; display: flex; align-items: center; justify-content: center; }
  .cp-lb-img { max-width: 90vw; max-height: 80vh; border-radius: 8px; box-shadow: 0 24px 80px rgba(0,0,0,.5); display: block; object-fit: contain; }
  .cp-lb-close { position: fixed; top: 18px; right: 18px; width: 42px; height: 42px; border-radius: 50%; background: rgba(255,255,255,.15); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,.2); color: #fff; font-size: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .2s; }
  .cp-lb-close:hover { background: rgba(255,255,255,.28); }
  .cp-lb-counter { position: fixed; top: 22px; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,.15); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,.2); color: #fff; font-size: 14px; font-weight: 700; padding: 6px 18px; border-radius: 20px; }
  .cp-lb-btn { position: fixed; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,.15); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,.2); color: #fff; font-size: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .2s; }
  .cp-lb-btn:hover { background: rgba(255,255,255,.3); }
  .cp-lb-prev { left: 18px; }
  .cp-lb-next { right: 18px; }
  .cp-lb-thumbs { position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; }
  .cp-lb-thumb { width: 56px; height: 42px; border-radius: 6px; overflow: hidden; cursor: pointer; border: 2px solid transparent; opacity: .55; transition: all .2s; }
  .cp-lb-thumb.active { border-color: #fff; opacity: 1; }
  .cp-lb-thumb:hover { opacity: .85; }
  .cp-lb-thumb img { width: 100%; height: 100%; object-fit: cover; }

  /* ── ФОРМА ПОЛЯ ── */
  .cp-fields { padding: 0 20px 20px; display: flex; flex-direction: column; gap: 16px; }
  .cp-field label { display: block; font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px; }
  .cp-field input, .cp-field textarea {
    width: 100%; padding: 12px 14px; border: 1.5px solid #e0e0e0; border-radius: 8px;
    font-size: 15px; font-family: inherit; color: #111; outline: none; box-sizing: border-box;
    transition: border-color .15s, box-shadow .15s; background: #fff;
  }
  .cp-field input:focus, .cp-field textarea:focus {
    border-color: #e8410a; box-shadow: 0 0 0 3px rgba(232,65,10,.08);
  }
  .cp-field input.err { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,.08); }
  .cp-field textarea { resize: vertical; min-height: 110px; line-height: 1.6; }
  .cp-field-hint { font-size: 12px; color: #aaa; margin-top: 5px; line-height: 1.4; }
  .cp-field-err { font-size: 12px; color: #ef4444; margin-top: 4px; font-weight: 600; }
  .cp-fields-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .cp-fields-row3 { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; }

  /* city pre-filled */
  .cp-city-input { background: #f9fafb !important; color: #555 !important; }

  /* ── ЦЕНА ── */
  .cp-price-block { padding: 18px 20px 20px; }
  .cp-price-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: end; }

  /* ── КНОПКА ── */
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
  .cp-tips-list { display: flex; flex-direction: column; gap: 6px; }
  .cp-tip-item { font-size: 12px; color: #666; padding-left: 14px; position: relative; line-height: 1.5; }
  .cp-tip-item::before { content: '💡'; position: absolute; left: 0; font-size: 11px; }
  .cp-steps { display: flex; flex-direction: column; gap: 10px; }
  .cp-step { display: flex; align-items: flex-start; gap: 12px; font-size: 13px; color: #555; }
  .cp-step-num { width: 24px; height: 24px; border-radius: 50%; background: #e8410a; color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  /* urgency */
  .cp-urgency { display: flex; flex-wrap: wrap; gap: 8px; }
  .cp-urgency-opt { padding: 8px 14px; border: 1.5px solid #e0e0e0; border-radius: 20px; font-size: 13px; font-weight: 500; color: #555; cursor: pointer; transition: all .15s; background: #fff; font-family: inherit; }
  .cp-urgency-opt.selected { border-color: #e8410a; background: #fff5f2; color: #e8410a; font-weight: 700; }
  .cp-urgency-opt:hover:not(.selected) { border-color: #aaa; }

  /* char counter */
  .cp-field-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
  .cp-char-count { font-size: 12px; color: #aaa; }
  .cp-char-count.warn { color: #f59e0b; }
  .cp-char-count.over { color: #ef4444; }

  /* ── УСПЕХ ── */
  .cp-success { max-width: 520px; margin: 80px auto; background: #fff; border-radius: 16px; border: 1px solid #e8e8e8; padding: 48px 36px; text-align: center; }
  .cp-success-ico { font-size: 64px; margin-bottom: 16px; }
  .cp-success h2 { font-size: 24px; font-weight: 800; color: #111; margin-bottom: 10px; }
  .cp-success p { font-size: 15px; color: #666; line-height: 1.7; margin-bottom: 24px; }
  .cp-success-btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
  .cp-success-btn-primary { padding: 13px 28px; background: #e8410a; border: none; border-radius: 8px; color: #fff; font-size: 15px; font-weight: 700; font-family: inherit; cursor: pointer; text-decoration: none; }
  .cp-success-btn-outline { padding: 12px 24px; background: #fff; border: 1.5px solid #e0e0e0; border-radius: 8px; color: #555; font-size: 15px; font-weight: 600; font-family: inherit; cursor: pointer; }

  @media(max-width: 860px) { .cp-wrap { grid-template-columns: 1fr; } .cp-sidebar { position: static; } }
  @media(max-width: 560px) { .cp-photo-grid { grid-template-columns: repeat(3, 1fr); } .cp-fields-row2 { grid-template-columns: 1fr; } .cp-fields-row3 { grid-template-columns: 1fr 1fr; } .cp-price-row { grid-template-columns: 1fr; } .cp-lb-btn { display: none; } }
`;

const MAX_DESC = 2000;

const EMPTY_ADDR = { city: 'Йошкар-Ола', street: '', house: '', apt: '' };
const EMPTY_FORM = { title: '', description: '', addr: EMPTY_ADDR, budget: '', urgency: '', photos: [] };

export default function CategoryPage() {
  const { slug } = useParams();
  const { userId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const photoInputRef = useRef(null);

  const category = ALL_CATEGORIES[slug];
  const sectionSlug = CAT_TO_SECTION[slug];

  const [form, setForm] = useState(EMPTY_FORM);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiCategoryId, setApiCategoryId] = useState(null);
  const [lightbox, setLightbox] = useState(null); // { index: 0 }
  const tips = CAT_TIPS[slug] || [];

  // ── Keyboard for lightbox ──
  const handleLbKey = useCallback((e) => {
    if (!lightbox) return;
    const n = form.photos.length;
    if (e.key === 'ArrowRight') setLightbox(l => ({ index: (l.index + 1) % n }));
    if (e.key === 'ArrowLeft')  setLightbox(l => ({ index: (l.index - 1 + n) % n }));
    if (e.key === 'Escape')     setLightbox(null);
  }, [lightbox, form.photos.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleLbKey);
    return () => window.removeEventListener('keydown', handleLbKey);
  }, [handleLbKey]);

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
      if (!f.type.startsWith('image/')) { setError('Только изображения'); return false; }
      if (f.size > 10 * 1024 * 1024) { setError('Файл слишком большой (max 10 МБ)'); return false; }
      return true;
    });
    const remaining = 5 - form.photos.length;
    const toAdd = validFiles.slice(0, remaining);
    if (validFiles.length > remaining) setError('Максимум 5 фотографий');
    for (const file of toAdd) {
      const data = await compressPhoto(file);
      setForm(prev => ({ ...prev, photos: [...prev.photos, { id: Date.now() + Math.random(), data, name: file.name }] }));
    }
  };

  const handleRemovePhoto = (id, e) => {
    e.stopPropagation();
    setForm(prev => {
      const next = prev.photos.filter(p => p.id !== id);
      return { ...prev, photos: next };
    });
    setLightbox(null);
  };

  const openLightbox = (i, e) => {
    e.stopPropagation();
    setLightbox({ index: i });
  };

  const setAddr = (key, val) => {
    setFieldErrors(fe => ({ ...fe, [key]: '' }));
    setForm(p => ({ ...p, addr: { ...p.addr, [key]: val } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const fe = {};
    if (!form.addr.street.trim()) fe.street = 'Укажите улицу';
    if (!form.addr.house.trim())  fe.house  = 'Укажите дом';
    if (Object.keys(fe).length) { setFieldErrors(fe); setError('Заполните все обязательные поля адреса'); return; }
    if (!userId) { navigate('/login'); return; }
    if (!form.title.trim()) { setError('Укажите название задачи'); return; }
    if (!form.description.trim()) { setError('Добавьте подробное описание'); return; }
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

    const parts = [form.addr.city, form.addr.street.trim(), `д. ${form.addr.house.trim()}`];
    if (form.addr.apt.trim()) parts.push(`кв. ${form.addr.apt.trim()}`);
    const addressText = parts.join(', ');

    setStatus('sending');
    try {
      const desc = form.urgency
        ? `${form.description.trim()}\n\n⏰ Срочность: ${URGENCY_OPTIONS.find(o => o.value === form.urgency)?.label || form.urgency}`
        : form.description.trim();
      await createJobRequest(userId, {
        categoryId,
        title: form.title.trim(),
        description: desc,
        address: addressText,
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
              Первые отклики обычно приходят в течение <strong>10 минут</strong>.
            </p>
            <div className="cp-success-btns">
              <Link to="/deals" className="cp-success-btn-primary">Перейти к сделкам →</Link>
              <button className="cp-success-btn-outline" onClick={() => { setStatus('idle'); setForm(EMPTY_FORM); }}>Создать ещё</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const descLen = form.description.length;
  const photos = form.photos;
  const n = photos.length;

  return (
    <div className="cp-page">
      <style>{css}</style>

      {/* ── HERO HEADER с фото категории ── */}
      <div className="cp-hero">
        {category.photo && <img src={category.photo} alt={category.name} className="cp-hero-img" />}
        {!category.photo && <div style={{ position: 'absolute', inset: 0, background: '#1a1a2e' }} />}
        <div className="cp-hero-overlay" />
        <div className="cp-hero-body">
          <Link to={`/sections/${sectionSlug}`} className="cp-hero-back">← Назад к категориям</Link>
          <div className="cp-hero-row">
            {category.photo && (
              <div className="cp-hero-thumb-wrap">
                <img src={category.photo} alt="" className="cp-hero-thumb" />
              </div>
            )}
            <div>
              <h1 className="cp-hero-title">{category.name}</h1>
              <p className="cp-hero-sub">Опишите задачу — мастера откликнутся сами</p>
            </div>
          </div>
        </div>
      </div>

      <div className="cp-wrap">
        {/* ═══ ФОРМА ═══ */}
        <div>
          {error && <div className="cp-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>

            {/* ── 1. ФОТОГРАФИИ ── */}
            <div className="cp-card">
              <div className="cp-card-title">
                Фотографии <span style={{ fontSize: 13, color: '#aaa', fontWeight: 400 }}>(необязательно, до 5 шт.)</span>
              </div>
              <div className="cp-photos">
                <div
                  className="cp-photo-grid"
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => { e.preventDefault(); setIsDragging(false); handlePhotoUpload(e.dataTransfer.files); }}
                >
                  {Array.from({ length: 5 }).map((_, i) => {
                    const photo = photos[i];
                    if (photo) {
                      return (
                        <div
                          key={photo.id}
                          className={`cp-photo-cell filled${i === 0 ? ' main-photo' : ''}`}
                          onClick={e => openLightbox(i, e)}
                        >
                          <img src={photo.data} alt="" className="cp-photo-img" />
                          {i === 0 && <span className="cp-photo-main-badge">Главное</span>}
                          <div className="cp-photo-zoom"><span className="cp-photo-zoom-text">Просмотр</span></div>
                          <button
                            type="button"
                            className="cp-photo-del"
                            onClick={e => handleRemovePhoto(photo.id, e)}
                          >×</button>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={i}
                        className={`cp-photo-cell${isDragging ? '' : ''}`}
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
                  {photos.length > 0
                    ? `${photos.length}/5 фото · Нажмите на фото для просмотра`
                    : 'Перетащите файлы сюда или кликните по ячейке · до 10 МБ'}
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
                    placeholder="Название"
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
                    placeholder="Текст описания"
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

            {/* ── 3. АДРЕС И СРОКИ ── */}
            <div className="cp-card">
              <div className="cp-card-title">Место и сроки</div>
              <div className="cp-fields">

                {/* Строка 1: улица (широкая) | дом | квартира */}
                <div>
                  <label style={{ fontSize: 14, fontWeight: 600, color: '#333', display: 'block', marginBottom: 8 }}>
                    Адрес выполнения *
                  </label>

                  {/* Город (заблокирован) */}
                  <div className="cp-field" style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>Город</label>
                    <input
                      value={form.addr.city}
                      className="cp-city-input"
                      readOnly
                    />
                    <span className="cp-field-hint">📍 Йошкар-Ола, Республика Марий Эл</span>
                  </div>

                  {/* Улица + дом + кв */}
                  <div className="cp-fields-row3">
                    <div className="cp-field" style={{ margin: 0 }}>
                      <label style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>Улица *</label>
                      <input
                        placeholder=""
                        value={form.addr.street}
                        onChange={e => setAddr('street', e.target.value)}
                        className={fieldErrors.street ? 'err' : ''}
                      />
                      {fieldErrors.street && <span className="cp-field-err">{fieldErrors.street}</span>}
                    </div>
                    <div className="cp-field" style={{ margin: 0 }}>
                      <label style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>Дом *</label>
                      <input
                        placeholder=""
                        value={form.addr.house}
                        onChange={e => setAddr('house', e.target.value)}
                        className={fieldErrors.house ? 'err' : ''}
                      />
                      {fieldErrors.house && <span className="cp-field-err">{fieldErrors.house}</span>}
                    </div>
                    <div className="cp-field" style={{ margin: 0 }}>
                      <label style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>Кв./офис</label>
                      <input
                        placeholder=""
                        value={form.addr.apt}
                        onChange={e => setAddr('apt', e.target.value)}
                      />
                    </div>
                  </div>

                  {(form.addr.street || form.addr.house) && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 13, color: '#166534' }}>
                      📍 {[form.addr.city, form.addr.street, form.addr.house ? `д. ${form.addr.house}` : '', form.addr.apt ? `кв. ${form.addr.apt}` : ''].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>

                {/* Срочность */}
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
                <div className="cp-price-row" style={{ marginBottom: 12 }}>
                  <div className="cp-field" style={{ margin: 0 }}>
                    <label>Ваш бюджет, ₽ *</label>
                    <input
                      name="budget"
                      type="number"
                      min="1"
                      placeholder=""
                      value={form.budget}
                      onChange={e => { setError(''); setForm(p => ({ ...p, budget: e.target.value })); }}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
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
                        <div style={{ fontSize: 13, color: '#aaa' }}>Укажите сумму — мастера её увидят</div>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8, padding: '12px 14px' }}>
                  <strong style={{ color: '#555' }}>Как работает цена:</strong> Ваш бюджет показывается мастерам.
                  Мастер может нажать <em>«Готов за эту сумму»</em> или предложит другую цену — вы сравните и выберете.
                </div>
              </div>
            </div>

            {/* ── КНОПКА ── */}
            <div className="cp-card">
              <div className="cp-submit-card">
                <button type="submit" className="cp-btn-submit" disabled={status === 'sending'}>
                  {status === 'sending' ? '⏳ Публикуем заявку…' : '📤 Опубликовать заявку мастерам'}
                </button>
                {!userId && (
                  <p className="cp-form-auth">Для отправки нужно <Link to="/login">войти в аккаунт</Link></p>
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
              ['⭐', 'Проверенные мастера', 'Реальные отзывы — только от реальных заказчиков'],
              ['💬', 'Прямая связь', 'Переписывайтесь с мастерами в чате до начала работ'],
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

      {/* ═══ LIGHTBOX ═══ */}
      {lightbox !== null && photos.length > 0 && (
        <div className="cp-lb" onClick={() => setLightbox(null)}>
          <div className="cp-lb-counter">{lightbox.index + 1} / {n}</div>
          <button className="cp-lb-close" onClick={() => setLightbox(null)}>×</button>

          {n > 1 && (
            <>
              <button
                className="cp-lb-btn cp-lb-prev"
                onClick={e => { e.stopPropagation(); setLightbox(l => ({ index: (l.index - 1 + n) % n })); }}
              >‹</button>
              <button
                className="cp-lb-btn cp-lb-next"
                onClick={e => { e.stopPropagation(); setLightbox(l => ({ index: (l.index + 1) % n })); }}
              >›</button>
            </>
          )}

          <div className="cp-lb-img-wrap" onClick={e => e.stopPropagation()}>
            <img src={photos[lightbox.index].data} alt="" className="cp-lb-img" />
          </div>

          {n > 1 && (
            <div className="cp-lb-thumbs" onClick={e => e.stopPropagation()}>
              {photos.map((p, i) => (
                <div
                  key={p.id}
                  className={`cp-lb-thumb${i === lightbox.index ? ' active' : ''}`}
                  onClick={() => setLightbox({ index: i })}
                >
                  <img src={p.data} alt="" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
