import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getOpenJobRequestsForWorker, createJobOffer } from '../api';
import './FindWorkPage.css';

const CATEGORY_STYLES = {
  'Ремонт квартир':      { emoji: '🏠', color: '#fff3e0' },
  'Сантехника':          { emoji: '🔧', color: '#e3f2fd' },
  'Электрика':           { emoji: '⚡', color: '#fffde7' },
  'Уборка':              { emoji: '🧹', color: '#fce4ec' },
  'Парикмахер':          { emoji: '💇', color: '#fce4ec' },
  'Маникюр и педикюр':   { emoji: '💅', color: '#fce4ec' },
  'Маникюр':             { emoji: '💅', color: '#fce4ec' },
  'Красота и здоровье':  { emoji: '✨', color: '#f3e5f5' },
  'Репетиторство':       { emoji: '📚', color: '#e3f2fd' },
  'Компьютерная помощь': { emoji: '💻', color: '#e8f5e9' },
};

function pluralRequests(n) {
  if (n % 10 === 1 && n % 100 !== 11) return `${n} заявка`;
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return `${n} заявки`;
  return `${n} заявок`;
}

export default function FindWorkPage() {
  const { userId } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showOfferModal, setShowOfferModal]     = useState(null);
  const [offerForm, setOfferForm]       = useState({ price: '', comment: '', estimatedDays: '' });
  const [submitting, setSubmitting]     = useState(false);

  useEffect(() => { loadRequests(); }, [userId]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getOpenJobRequestsForWorker(userId);
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOfferModal = (request) => {
    setShowOfferModal(request);
    setOfferForm({ price: '', comment: '', estimatedDays: '' });
  };

  const handleCloseOfferModal = () => {
    setShowOfferModal(null);
    setOfferForm({ price: '', comment: '', estimatedDays: '' });
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!offerForm.price) { showToast('Укажите цену', 'error'); return; }
    setSubmitting(true);
    try {
      await createJobOffer(userId, showOfferModal.id, {
        price:         Number(offerForm.price),
        comment:       offerForm.comment || 'Готов выполнить работу',
        estimatedDays: offerForm.estimatedDays ? Number(offerForm.estimatedDays) : null,
      });
      showToast('Отклик отправлен!', 'success');
      handleCloseOfferModal();
      loadRequests();
    } catch (err) {
      console.error('Failed to create offer:', err);
      showToast('Не удалось отправить отклик', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Группируем по категориям
  const groupedRequests = requests.reduce((acc, req) => {
    const cat = req.categoryName || 'Без категории';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(req);
    return acc;
  }, {});

  const categories = Object.keys(groupedRequests).sort();

  // ═══ ЭКРАН 2: заявки внутри категории ═══
  if (selectedCategory) {
    const catRequests = groupedRequests[selectedCategory] || [];
    const catStyle = CATEGORY_STYLES[selectedCategory] || { emoji: '📋', color: '#f3f4f6' };

    return (
      <div>
        {/* Header */}
        <div className="page-header-bar">
          <div className="container">
            <button className="cats-back-link" onClick={() => setSelectedCategory(null)}>
              ← Все категории
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
              <div className="cat-page-icon" style={{ background: catStyle.color }}>
                {catStyle.emoji}
              </div>
              <div>
                <h1>{selectedCategory}</h1>
                <p>{pluralRequests(catRequests.length)} от заказчиков</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          {catRequests.length === 0 ? (
            <div className="cats-error" style={{ padding: '60px 0' }}>
              <span>📋</span>
              <p>Заявок в этой категории пока нет</p>
            </div>
          ) : (
            <div className="fw-requests-grid">
              {catRequests.map((req, idx) => (
                <div
                  key={req.id}
                  className="fw-request-card fade-up"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {/* Бюджет */}
                  <div className="fw-request-top">
                    <span className="fw-request-budget">
                      {req.budget
                        ? `до ${Number(req.budget).toLocaleString('ru-RU')} ₽`
                        : 'Договорная'}
                    </span>
                    <span className="fw-request-date">
                      {new Date(req.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  {/* Заголовок */}
                  <h3 className="fw-request-title">{req.title}</h3>

                  {/* Описание */}
                  {req.description && (
                    <p className="fw-request-desc">{req.description}</p>
                  )}

                  {/* Мета */}
                  <div className="fw-request-meta">
                    {req.addressText && <span>📍 {req.addressText}</span>}
                    {req.categoryName && <span>🏷️ {req.categoryName}</span>}
                  </div>

                  {/* Кнопка */}
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => handleOpenOfferModal(req)}
                  >
                    📩 Откликнуться
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Модалка отклика */}
        {showOfferModal && (
          <div className="modal-overlay" onClick={handleCloseOfferModal}>
            <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Отклик на заявку</h3>
              <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 20 }}>
                {showOfferModal.title}
              </p>

              <form onSubmit={handleSubmitOffer}>
                <div className="form-field">
                  <label className="form-label">Ваша цена, ₽ *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Например, 5000"
                    value={offerForm.price}
                    onChange={e => setOfferForm({ ...offerForm, price: e.target.value })}
                    required
                    min="1"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Срок выполнения (дней)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Например, 3"
                    value={offerForm.estimatedDays}
                    onChange={e => setOfferForm({ ...offerForm, estimatedDays: e.target.value })}
                    min="1"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Комментарий</label>
                  <textarea
                    className="form-input form-textarea"
                    placeholder="Опишите как вы выполните работу..."
                    value={offerForm.comment}
                    onChange={e => setOfferForm({ ...offerForm, comment: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleCloseOfferModal}
                    style={{ flex: 1 }}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ flex: 2 }}
                  >
                    {submitting ? 'Отправка...' : '📩 Отправить отклик'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══ ЭКРАН 1: сетка категорий ═══
  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1>Найти работу</h1>
          <p>Выберите категорию — откликайтесь на заявки заказчиков</p>
        </div>
      </div>

      <div className="container">
        {/* Скелетон */}
        {loading && (
          <div className="cats-grid" style={{ padding: '28px 0 48px' }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="cat-skeleton">
                <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 'var(--r-md)' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: '85%', height: 13 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Пусто */}
        {!loading && categories.length === 0 && (
          <div className="cats-error" style={{ padding: '60px 0' }}>
            <span>📋</span>
            <p>Нет открытых заявок от заказчиков</p>
          </div>
        )}

        {/* Категории */}
        {!loading && categories.length > 0 && (
          <div className="cats-grid" style={{ padding: '28px 0 48px' }}>
            {categories.map((cat, idx) => {
              const style = CATEGORY_STYLES[cat] || { emoji: '📋', color: '#f3f4f6' };
              const count = groupedRequests[cat].length;

              return (
                <button
                  key={cat}
                  className="cat-card fade-up"
                  onClick={() => setSelectedCategory(cat)}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="cat-card-icon" style={{ background: style.color }}>
                    {style.emoji}
                  </div>
                  <div className="cat-card-body">
                    <h2>{cat}</h2>
                    <p>{pluralRequests(count)}</p>
                  </div>
                  <div className="cat-card-arrow">›</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}