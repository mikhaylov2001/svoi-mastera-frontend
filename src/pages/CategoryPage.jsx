import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { createJobRequest, getCategories } from '../api';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES_BY_SECTION } from './CategoriesPage';
import './CategoryPage.css';

// Build flat lookup from sections data
const ALL_CATEGORIES = {};
const CAT_TO_SECTION = {};
Object.entries(CATEGORIES_BY_SECTION).forEach(([sectionSlug, cats]) => {
  cats.forEach(cat => {
    ALL_CATEGORIES[cat.slug] = cat;
    CAT_TO_SECTION[cat.slug] = sectionSlug;
  });
});

// Per-category hints: title placeholder, description placeholder, tips
const CAT_HINTS = {
  'remont-kvartir': {
    titlePh: 'Например: "Поклейка обоев в зале 18 м²"',
    descPh: 'Укажите тип работ (штукатурка, покраска, обои, полы), площадь помещения, текущее состояние стен/пола…',
    tips: [
      'Укажите площадь помещения в м²',
      'Опишите текущее состояние (черновая, требуется демонтаж)',
      'Напишите, есть ли свои материалы',
      'Приложите фото помещения, если возможно',
    ],
  },
  'santehnika': {
    titlePh: 'Например: "Замена смесителя на кухне"',
    descPh: 'Опишите проблему: что течёт, что нужно заменить/установить, марка сантехники если есть…',
    tips: [
      'Опишите, что именно сломалось или что нужно установить',
      'Укажите марку и модель сантехники, если знаете',
      'Напишите, есть ли доступ к стоякам',
      'Сфотографируйте проблемное место',
    ],
  },
  'elektrika': {
    titlePh: 'Например: "Перенос розеток в спальне"',
    descPh: 'Опишите задачу: сколько точек, нужна ли замена проводки, тип стен (бетон, кирпич, гипсокартон)…',
    tips: [
      'Укажите количество розеток/выключателей',
      'Опишите тип стен (бетон, кирпич, ГКЛ)',
      'Напишите, нужна ли замена щитка или автоматов',
      'Уточните, есть ли заземление в доме',
    ],
  },
  'uborka': {
    titlePh: 'Например: "Генеральная уборка 2-комнатной квартиры"',
    descPh: 'Укажите тип уборки (генеральная, после ремонта, поддерживающая), площадь, наличие домашних животных…',
    tips: [
      'Укажите площадь квартиры и количество комнат',
      'Опишите тип уборки: генеральная, после ремонта, разовая',
      'Напишите, нужно ли мытьё окон или балкона',
      'Уточните, есть ли домашние животные',
    ],
  },
  'parikhmaher': {
    titlePh: 'Например: "Женская стрижка и окрашивание на дому"',
    descPh: 'Опишите, что нужно: стрижка, укладка, окрашивание, длина волос, желаемый результат…',
    tips: [
      'Укажите тип услуги: стрижка, окрашивание, укладка',
      'Опишите длину и тип волос',
      'Приложите фото желаемого результата',
      'Уточните, нужны ли материалы мастера (краска, средства)',
    ],
  },
  'manikur': {
    titlePh: 'Например: "Маникюр с гель-лаком на дому"',
    descPh: 'Опишите, что нужно: маникюр, педикюр, наращивание, дизайн, покрытие…',
    tips: [
      'Укажите тип: маникюр, педикюр или комплекс',
      'Опишите желаемое покрытие (гель-лак, наращивание)',
      'Напишите, нужен ли дизайн ногтей',
      'Приложите фото желаемого результата, если есть',
    ],
  },
  'krasota-i-zdorovie': {
    titlePh: 'Например: "Массаж спины на дому, 1 час"',
    descPh: 'Опишите, что нужно: тип массажа, косметологическая процедура, есть ли противопоказания…',
    tips: [
      'Укажите тип процедуры (массаж, чистка лица, уход)',
      'Опишите цель: расслабление, лечебный эффект, уход за кожей',
      'Напишите о противопоказаниях или аллергиях',
      'Уточните желаемую продолжительность сеанса',
    ],
  },
  'repetitorstvo': {
    titlePh: 'Например: "Репетитор по математике для 9 класса, ОГЭ"',
    descPh: 'Укажите предмет, класс/уровень ученика, цель (ОГЭ, ЕГЭ, подтянуть оценки), удобное время…',
    tips: [
      'Укажите предмет и класс/уровень ученика',
      'Опишите цель: подготовка к ОГЭ/ЕГЭ, подтянуть оценки',
      'Напишите удобные дни и время для занятий',
      'Уточните формат: очно на дому или онлайн',
    ],
  },
  'kompyuternaya-pomosh': {
    titlePh: 'Например: "Чистка ноутбука от вирусов и настройка"',
    descPh: 'Опишите проблему: тормозит, не включается, нужна установка ПО, настройка Wi-Fi, восстановление данных…',
    tips: [
      'Опишите проблему: что не работает, когда началось',
      'Укажите тип устройства (ПК, ноутбук, марка)',
      'Напишите, какая ОС установлена (Windows, macOS)',
      'Уточните, нужна ли установка программ или антивируса',
    ],
  },
};

function getHints(slug) {
  return CAT_HINTS[slug] || {
    titlePh: 'Опишите задачу кратко',
    descPh: 'Подробно опишите, что нужно сделать…',
    tips: ['Укажите точный адрес', 'Опишите объём работы', 'Напишите удобное время', 'Укажите желаемые сроки'],
  };
}

export default function CategoryPage() {
  const { slug } = useParams();
  const { userId } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();
  const category = ALL_CATEGORIES[slug];
  const sectionSlug = CAT_TO_SECTION[slug];
  const hints = getHints(slug);

  const [form, setForm] = useState({ title: '', description: '', address: '', budget: '' });

  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    const title = qp.get('title') || '';
    const description = qp.get('description') || '';
    if (title || description) {
      setForm((prev) => ({ ...prev, ...(title ? { title } : {}), ...(description ? { description } : {}) }));
    }
  }, [location.search]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [apiCategoryId, setApiCategoryId] = useState(null);

  // Загружаем категории с бэкенда, чтобы найти UUID по slug
  useEffect(() => {
    getCategories()
      .then(cats => {
        const found = cats.find(c => c.slug === slug);
        if (found) setApiCategoryId(found.id);
      })
      .catch(() => {});
  }, [slug]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!userId) { navigate('/login'); return; }
    if (!form.title.trim()) { setError('Укажите название задачи'); return; }
    if (!apiCategoryId) { setError('Категория не найдена на сервере. Попробуйте обновить страницу.'); return; }

    setStatus('sending'); setError('');
    try {
      const data = {
        categoryId: apiCategoryId,
        title: form.title.trim(),
      };
      if (form.description.trim()) data.description = form.description.trim();
      if (form.address.trim()) data.address = form.address.trim();
      if (form.budget) data.budget = Number(form.budget);

      await createJobRequest(userId, data);
      setStatus('success');
    } catch (err) {
      setError(err.message || 'Не удалось создать заявку. Попробуйте ещё раз.');
      setStatus('error');
    }
  };

  if (!category) {
    return (
      <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <p>Категория не найдена</p>
        <Link to="/sections" className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>К разделам</Link>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="container">
        <div className="cat-success">
          <span className="cat-success-icon">🎉</span>
          <h2>Заявка отправлена!</h2>
          <p>Мастера увидят вашу задачу и начнут откликаться. Следите за статусом в разделе «Мои сделки».</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/deals" className="btn btn-primary">Перейти к сделкам</Link>
            <button className="btn btn-outline" onClick={() => { setStatus('idle'); setForm({ title: '', description: '', address: '', budget: '' }); }}>
              Создать ещё одну
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <div className="cat-page-breadcrumb">
            <Link to={`/sections/${sectionSlug}`} className="cat-page-back">← Назад к категориям</Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
            <div className="cat-page-icon" style={{ background: category.color }}>{category.emoji}</div>
            <div>
              <h1>{category.name}</h1>
              <p>Создайте задачу — мастера откликнутся сами</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="cat-page-layout">
          <div className="cat-form-card">
            <h2 className="cat-form-title">Описание задачи</h2>

            {error && <div className="cat-form-error">⚠️ {error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label className="form-label">Название задачи *</label>
                <input className="form-input" name="title"
                  placeholder={hints.titlePh}
                  value={form.title} onChange={handleChange} required />
              </div>

              <div className="form-field">
                <label className="form-label">Подробное описание</label>
                <textarea className="form-input form-textarea" name="description"
                  placeholder={hints.descPh}
                  value={form.description} onChange={handleChange} />
              </div>

              <div className="cat-form-row">
                <div className="form-field">
                  <label className="form-label">Адрес</label>
                  <input className="form-input" name="address"
                    placeholder="Улица, кв"
                    value={form.address} onChange={handleChange} />
                </div>
                <div className="form-field">
                  <label className="form-label">Предварительная цена, ₽</label>
                  <input className="form-input" name="budget" type="number"
                    placeholder="Не обязательно"
                    value={form.budget} onChange={handleChange} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full"
                disabled={status === 'sending'}>
                {status === 'sending' ? 'Отправляем…' : '📤 Отправить заявку мастерам'}
              </button>

              {!userId && (
                <p className="cat-form-auth-note">
                  Для отправки нужно <Link to="/login" className="cat-form-link">войти в аккаунт</Link>
                </p>
              )}
            </form>
          </div>

          <div className="cat-sidebar">
            <div className="cat-tip-card">
              <div className="cat-tip-title">💡 Советы для категории «{category.name}»</div>
              <ul className="cat-tip-list">
                {hints.tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
            <div className="cat-tip-card">
              <div className="cat-tip-title">🔒 Безопасная сделка</div>
              <p className="cat-tip-text">Оплата поступает мастеру только после того, как вы подтвердили выполнение работы.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
