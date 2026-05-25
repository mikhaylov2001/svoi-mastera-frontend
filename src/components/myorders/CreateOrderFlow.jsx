import React, { useMemo, useState } from 'react';

const HERO = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1800&q=82';

const SECTIONS = [
  {
    name: 'Ремонт',
    subtitle: 'Ремонт квартир, сантехника, электрика',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80',
    categories: ['Ремонт квартир', 'Сантехника', 'Электрика', 'Сварочные работы'],
  },
  {
    name: 'Уборка',
    subtitle: 'Генеральная уборка, после ремонта, мытьё окон',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80',
    categories: ['Уборка'],
  },
  {
    name: 'Красота',
    subtitle: 'Парикмахер, маникюр, красота и здоровье',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80',
    categories: ['Красота и здоровье', 'Маникюр и педикюр', 'Парикмахер'],
  },
  {
    name: 'Образование',
    subtitle: 'Репетиторство, подготовка к экзаменам',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80',
    categories: ['Репетиторство'],
  },
  {
    name: 'Техпомощь',
    subtitle: 'Компьютерная помощь, настройка техники',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80',
    categories: ['Компьютерная помощь'],
  },
  {
    name: 'Переезды',
    subtitle: 'Грузоперевозки и помощь с переездом',
    image: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=1200&q=80',
    categories: ['Грузоперевозки'],
  },
];

const CATEGORY_IMAGES = {
  'Ремонт квартир': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&q=80',
  'Сантехника': 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=900&q=80',
  'Электрика': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=900&q=80',
  'Сварочные работы': 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=900&q=80',
  'Уборка': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=80',
  'Красота и здоровье': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=80',
  'Маникюр и педикюр': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&q=80',
  'Парикмахер': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80',
  'Репетиторство': 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&q=80',
  'Компьютерная помощь': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&q=80',
  'Грузоперевозки': 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=900&q=80',
};

function HelpPanel() {
  return (
    <aside className="req-help">
      <h3>Как это работает</h3>
      <ol>
        <li><b>Разместите заявку</b><span>Опишите задачу и укажите цену</span></li>
        <li><b>Пишите в чате</b><span>Мастера откликнутся и обсудят детали</span></li>
        <li><b>Договоритесь напрямую</b><span>Выберите подходящего мастера</span></li>
        <li><b>Оплата мастеру</b><span>После выполнения работы</span></li>
      </ol>
    </aside>
  );
}

export default function CreateOrderFlow({ onClose, onSave, categories: externalCategories }) {
  const [step, setStep] = useState(1);
  const [section, setSection] = useState(null);
  const [category, setCategory] = useState('');
  const [form, setForm] = useState({ title: '', description: '', budget: '', address: '' });
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);

  const categories = useMemo(() => section?.categories || [], [section]);
  const progress = step === 1 ? 0 : step === 2 ? 45 : 80;
  const valid = form.title.trim() && category;

  const selectSection = item => { setSection(item); setCategory(''); setStep(2); };
  const selectCategory = item => { setCategory(item); setStep(3); };
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handlePhotos = e => {
    const files = Array.from(e.target.files || []).slice(0, 5 - photos.length);
    const next = files.map(f => URL.createObjectURL(f));
    setPhotos(prev => [...prev, ...next].slice(0, 5));
  };
  const removePhoto = idx => setPhotos(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await onSave({
        id: Date.now(),
        title: form.title.trim(),
        category,
        description: form.description.trim(),
        address: form.address.trim(),
        budget: form.budget ? Number(form.budget) : null,
        photos,
        createdAt: new Date().toISOString(),
        status: 'OPEN',
        offersCount: 0,
        offers: [],
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="req-flow">
      <header className="req-flow-hero">
        <img src={HERO} alt="" />
        <div className="req-flow-overlay" />
        <button type="button" className="req-flow-close" onClick={onClose}>✕</button>
        <div className="req-flow-hero-body">
          <div>
            <button type="button" className="req-flow-back" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
              ← {step === 1 ? 'Мои заявки' : 'Назад'}
            </button>
            <div className="req-flow-steps">
              <span className={step >= 1 ? 'active' : ''}>1 · Раздел</span>
              <span className={step >= 2 ? 'active' : ''}>2 · Категория</span>
              <span className={step >= 3 ? 'active' : ''}>3 · Заявка</span>
            </div>
            <h1>{step === 1 ? 'Выберите раздел' : step === 2 ? 'Выберите категорию' : 'Новая заявка'}</h1>
            <p>{step === 1 ? 'Шаг 1 — выберите раздел услуги' : step === 2 ? 'Шаг 2 — уточните категорию' : 'Шаг 3 — заполните заявку и опубликуйте'}</p>
            <div className="req-flow-progress"><span style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
      </header>

      <main className="req-flow-main">
        {step === 1 && (
          <div className="req-flow-layout">
            <div className="req-grid-sections">
              {SECTIONS.map(item => (
                <button type="button" key={item.name} className="req-sec-card" onClick={() => selectSection(item)}>
                  <img src={item.image} alt="" />
                  <span className="req-sec-overlay" />
                  <span className="req-sec-name">{item.name}<small>{item.subtitle}</small></span>
                </button>
              ))}
            </div>
            <HelpPanel />
          </div>
        )}

        {step === 2 && (
          <div className="req-flow-layout">
            <div className="req-grid-cats">
              {categories.map(item => (
                <button type="button" key={item} className="req-cat-card" onClick={() => selectCategory(item)}>
                  <img src={CATEGORY_IMAGES[item] || section?.image} alt="" />
                  <span className="req-cat-name">{item}</span>
                </button>
              ))}
            </div>
            <HelpPanel />
          </div>
        )}

        {step === 3 && (
          <div className="req-flow-layout">
            <div className="req-flow-formcol">
              {/* Photos card */}
              <section className="req-flow-card">
                <div className="req-flow-card-head">
                  <div>
                    <h2>Фотографии</h2>
                    <p>Заявки с фото получают больше откликов</p>
                  </div>
                  <span>{photos.length}/5</span>
                </div>
                <div className="req-photo-grid">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <label key={idx} className={`req-photo-cell${idx === 0 ? ' main' : ''}`}>
                      {photos[idx] ? (
                        <>
                          <img src={photos[idx]} alt="" />
                          <button type="button" className="photo-remove-mini" onClick={e => { e.preventDefault(); removePhoto(idx); }}>×</button>
                        </>
                      ) : (
                        <span>{idx === 0 ? 'Главное фото' : '+'}</span>
                      )}
                      <input type="file" accept="image/*" onChange={handlePhotos} hidden />
                    </label>
                  ))}
                </div>
              </section>

              {/* Details card */}
              <section className="req-flow-card">
                <h2>Описание заявки</h2>
                <p>Название, категорию и детали — мастер увидит это перед откликом</p>
                <div className="req-form-grid">
                  <input className="req-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Например: замена смесителя на кухне" maxLength={80} />
                  <input className="req-input" value={form.budget} onChange={e => set('budget', e.target.value)} type="number" placeholder="Бюджет, ₽" min="0" />
                  <input className="req-input" value={category} readOnly placeholder="Категория" />
                  <input className="req-input req-address" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Адрес или район выполнения" />
                  <textarea className="req-input req-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Опишите задачу подробнее…" />
                </div>
                <button type="button" className="req-submit" disabled={!valid || saving} onClick={handleSubmit}>
                  {saving ? 'Публикуем…' : 'Опубликовать заявку'}
                </button>
              </section>
            </div>

            {/* Preview */}
            <aside className="req-preview-card">
              <h3>Предпросмотр</h3>
              <div className="req-preview-img">
                {photos[0] ? <img src={photos[0]} alt="" /> : 'Фото появится здесь'}
              </div>
              <span className="badge badge-new">{category || 'Категория'}</span>
              <strong>{form.budget ? `${Number(form.budget).toLocaleString('ru-RU')} ₽` : 'Цена в заявке'}</strong>
              <p>{form.title || 'Название вашей заявки'}</p>
              <p className="req-preview-address">{form.address || 'Адрес или район'}</p>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
