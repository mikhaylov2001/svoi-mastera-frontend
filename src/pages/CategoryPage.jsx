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

  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    budget: '',
    photos: [] // ✨ НОВОЕ: массив фотографий
  });

  // ✨ НОВОЕ: Состояние для drag & drop
  const [isDragging, setIsDragging] = useState(false);

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

  // ✨ НОВОЕ: Обработка загрузки фото
  const handlePhotoUpload = (files) => {
    const validFiles = Array.from(files).filter(file => {
      // Проверка типа
      if (!file.type.startsWith('image/')) {
        setError('Можно загружать только изображения');
        return false;
      }
      // Проверка размера (макс 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Размер изображения не должен превышать 5MB');
        return false;
      }
      return true;
    });

    // Ограничение: макс 5 фото
    const remainingSlots = 5 - form.photos.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (filesToAdd.length < validFiles.length) {
      setError('Максимум 5 фотографий');
    }

    // Конвертируем в base64
    filesToAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setForm(prev => ({
          ...prev,
          photos: [...prev.photos, {
            id: Date.now() + Math.random(),
            data: e.target.result,
            name: file.name
          }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  // ✨ НОВОЕ: Удаление фото
  const handleRemovePhoto = (photoId) => {
    setForm(prev => ({
      ...prev,
      photos: prev.photos.filter(p => p.id !== photoId)
    }));
  };

  // ✨ НОВОЕ: Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handlePhotoUpload(files);
    }
  };

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
        // TODO: В будущем добавить photos в API
        // photos:      form.photos.map(p => p.data)
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
                setForm({ title: '', description: '', address: '', budget: '', photos: [] });
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
                <span className="form-hint">Например: "Установить кондиционер" или "Покрасить стены"</span>
              </div>

              <div className="form-field">
                <label className="form-label">Подробное описание *</label>
                <textarea
                  className="form-input form-textarea"
                  name="description"
                  placeholder="Подробно опишите что нужно сделать…"
                  value={form.description}
                  onChange={handleChange}
                  rows="5"
                  required
                />
                <span className="form-hint">Укажите детали: размеры, материалы, особые требования</span>
              </div>

              {/* ✨ НОВОЕ: Загрузка фото */}
              <div className="form-field">
                <label className="form-label">Фотографии (необязательно)</label>

                {/* Превью загруженных фото */}
                {form.photos.length > 0 && (
                  <div className="photo-preview-grid">
                    {form.photos.map(photo => (
                      <div key={photo.id} className="photo-preview-item">
                        <img src={photo.data} alt={photo.name} />
                        <button
                          type="button"
                          className="photo-remove-btn"
                          onClick={() => handleRemovePhoto(photo.id)}
                          title="Удалить"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drag & Drop зона */}
                {form.photos.length < 5 && (
                  <div
                    className={`photo-upload-zone ${isDragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('photo-input').click()}
                  >
                    <div className="photo-upload-icon">📷</div>
                    <div className="photo-upload-text">
                      <strong>Перетащите фото сюда</strong> или нажмите для выбора
                    </div>
                    <div className="photo-upload-hint">
                      Максимум 5 фото • До 5MB каждое • PNG, JPG, JPEG
                    </div>
                    <input
                      id="photo-input"
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        handlePhotoUpload(e.target.files);
                        e.target.value = ''; // Сброс для повторной загрузки
                      }}
                    />
                  </div>
                )}

                <span className="form-hint">
                  💡 Фото помогут мастерам точнее оценить объём работы
                </span>
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
                  <span className="form-hint">📍 Йошкар-Ола</span>
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
                  <span className="form-hint">💰 Мастера могут предложить свою цену</span>
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