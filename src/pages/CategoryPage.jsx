import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { createJobRequest, getCategories } from '../api';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES_BY_SECTION } from './CategoriesPage';
import './CategoryPage.css';

const ALL_CATEGORIES = {};
const CAT_TO_SECTION = {};
Object.entries(CATEGORIES_BY_SECTION).forEach(([sectionSlug, cats]) => {
  cats.forEach(cat => {
    ALL_CATEGORIES[cat.slug] = cat;
    CAT_TO_SECTION[cat.slug] = sectionSlug;
  });
});

export default function CategoryPage() {
  const { slug } = useParams();
  const { userId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const category   = ALL_CATEGORIES[slug];
  const sectionSlug = CAT_TO_SECTION[slug];

  const [form, setForm] = useState({ title: '', description: '', address: '', budget: '' });

  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    const title       = qp.get('title')       || '';
    const description = qp.get('description') || '';
    if (title || description) {
      setForm(prev => ({
        ...prev,
        ...(title       ? { title }       : {}),
        ...(description ? { description } : {}),
      }));
    }
  }, [location.search]);

  const [status,        setStatus]        = useState('idle');
  const [error,         setError]         = useState('');
  const [apiCategoryId, setApiCategoryId] = useState(null);

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
    if (!userId)              { navigate('/login'); return; }
    if (!form.title.trim())   { setError('Укажите название задачи'); return; }
    if (!form.description.trim()) { setError('Добавьте подробное описание'); return; }
    if (!form.address.trim()) { setError('Укажите адрес выполнения работы'); return; }
    if (!form.budget)         { setError('Укажите предварительную цену'); return; }
    if (Number(form.budget) <= 0) { setError('Цена должна быть больше нуля'); return; }
    if (!apiCategoryId)       { setError('Категория не найдена. Обновите страницу.'); return; }

    setStatus('sending'); setError('');
    try {
      const data = {
        categoryId:  apiCategoryId,
        title:       form.title.trim(),
        description: form.description.trim(),
        address:     form.address.trim(),
        budget:      Number(form.budget),
      };
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
        <Link to="/sections" className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>
          К разделам
        </Link>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="container">
        <div className="cat-success">
          <span className="cat-success-icon">🎉</span>
          <h2>Заявка отправлена!</h2>
          <p>Мастера увидят вашу задачу и начнут откликаться. Следите за статусом в разделе «Мои заказы».</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/deals" className="btn btn-primary">Перейти к заказам</Link>
            <button
              className="btn btn-outline"
              onClick={() => {
                setStatus('idle');
                setForm({ title: '', description: '', address: '', budget: '' });
              }}
            >
              Создать ещё одну
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── ШАПКА ── */}
      <div className="page-header-bar">
        <div className="container">
          <div className="cat-page-breadcrumb">
            <Link to={`/sections/${sectionSlug}`} className="cat-page-back">
              ← Назад к категориям
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
            <div className="cat-page-icon" style={{ background: category.color }}>
              {category.emoji}
            </div>
            <div>
              <h1>{category.name}</h1>
              <p>Создайте задачу — мастера откликнутся сами</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── КОНТЕНТ ── */}
      <div className="container">
        <div className="cat-page-layout">

          {/* Форма */}
          <div className="cat-form-card">
            <h2 className="cat-form-title">Описание задачи</h2>

            {error && <div className="cat-form-error">⚠️ {error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label className="form-label">Название задачи *</label>
                <input
                  className="form-input"
                  name="title"
                  placeholder="Опишите задачу кратко"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">Подробное описание *</label>
                <textarea
                  className="form-input form-textarea"
                  name="description"
                  placeholder="Подробно опишите что нужно сделать…"
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="cat-form-row">
                <div className="form-field">
                  <label className="form-label">Адрес *</label>
                  <input
                    className="form-input"
                    name="address"
                    placeholder="Улица, кв"
                    value={form.address}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Предварительная цена, ₽ *</label>
                  <input
                    className="form-input"
                    name="budget"
                    type="number"
                    min="1"
                    placeholder="Например: 3000"
                    value={form.budget}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'Отправляем…' : '📤 Отправить заявку мастерам'}
              </button>

              {!userId && (
                <p className="cat-form-auth-note">
                  Для отправки нужно{' '}
                  <Link to="/login" className="cat-form-link">войти в аккаунт</Link>
                </p>
              )}
            </form>
          </div>

          {/* Сайдбар */}
          <div className="cat-sidebar">
            <div className="cat-tip-card">
              <div className="cat-tip-title">🔒 Безопасная сделка</div>
              <p className="cat-tip-text">
                Оплата поступает мастеру только после того, как вы подтвердили выполнение работы.
              </p>
            </div>
            <div className="cat-tip-card">
              <div className="cat-tip-title">⚡ Быстрый отклик</div>
              <p className="cat-tip-text">
                Первые предложения от мастеров поступают в течение 10 минут после публикации задачи.
              </p>
            </div>
            <div className="cat-tip-card">
              <div className="cat-tip-title">⭐ Проверенные мастера</div>
              <p className="cat-tip-text">
                Выбирайте по рейтингу и отзывам — только реальные оценки от реальных заказчиков.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
