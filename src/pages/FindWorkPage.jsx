import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getOpenJobRequestsForWorker, createJobOffer, getCategories } from '../api';
import './FindWorkPage.css';

const CATEGORY_STYLES = {
  'remont-kvartir':       { emoji: '🏠', color: '#fff3e0' },
  'santehnika':           { emoji: '🔧', color: '#e3f2fd' },
  'elektrika':            { emoji: '⚡', color: '#fffde7' },
  'uborka':               { emoji: '🧹', color: '#fce4ec' },
  'parikhmaher':          { emoji: '💇', color: '#fce4ec' },
  'manikur':              { emoji: '💅', color: '#fce4ec' },
  'krasota-i-zdorovie':   { emoji: '✨', color: '#f3e5f5' },
  'repetitorstvo':        { emoji: '📚', color: '#e3f2fd' },
  'kompyuternaya-pomosh': { emoji: '💻', color: '#e8f5e9' },
};

function pluralRequests(n) {
  if (n % 10 === 1 && n % 100 !== 11) return `${n} заявка`;
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return `${n} заявки`;
  return `${n} заявок`;
}

export default function FindWorkPage() {
  const { userId } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests]                 = useState([]);
  const [categories, setCategories]             = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showOfferModal, setShowOfferModal]     = useState(null);
  const [offerForm, setOfferForm]               = useState({ price: '', comment: '', estimatedDays: '' });
  const [submitting, setSubmitting]             = useState(false);

  useEffect(() => { loadData(); }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, reqs] = await Promise.all([
        getCategories(),
        getOpenJobRequestsForWorker(userId),
      ]);
      setCategories(cats || []);
      setRequests(reqs || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRequestsForCategory = (cat) =>
    requests.filter(r => r.categoryId === cat.id);

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
        message:       offerForm.comment || 'Готов выполнить работу',
        estimatedDays: offerForm.estimatedDays ? Number(offerForm.estimatedDays) : null,
      });
      showToast('Отклик отправлен!', 'success');
      handleCloseOfferModal();
      loadData();
    } catch (err) {
      console.error('Failed to create offer:', err);
      showToast('Не удалось отправить отклик', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ═══ Модалка отклика ═══
  const OfferModal = () => (
    <div className="fw-modal-overlay" onClick={handleCloseOfferModal}>
      <div className="fw-modal" onClick={e => e.stopPropagation()}>

        {/* Шапка */}
        <div className="fw-modal-header">
          <h3 className="fw-modal-title">📩 Отклик на заявку</h3>
          <p className="fw-modal-subtitle">{showOfferModal.title}</p>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmitOffer}>
          <div className="fw-modal-body">

            <div className="fw-modal-field">
              <label className="fw-modal-label">Ваша цена, ₽ *</label>
              <input
                type="number"
                className="fw-modal-input"
                placeholder="Например, 5000"
                value={offerForm.price}
                onChange={e => setOfferForm({ ...offerForm, price: e.target.value })}
                required
                min="1"
                autoFocus
              />
              {showOfferModal.budgetTo && (
                <span className="fw-modal-hint">
                  Бюджет заказчика: до {Number(showOfferModal.budgetTo).toLocaleString('ru-RU')} ₽
                </span>
              )}
            </div>

            <div className="fw-modal-field">
              <label className="fw-modal-label">Срок выполнения (дней)</label>
              <input
                type="number"
                className="fw-modal-input"
                placeholder="Например, 3"
                value={offerForm.estimatedDays}
                onChange={e => setOfferForm({ ...offerForm, estimatedDays: e.target.value })}
                min="1"
              />
            </div>

            <div className="fw-modal-field">
              <label className="fw-modal-label">Комментарий</label>
              <textarea
                className="fw-modal-input fw-modal-textarea"
                placeholder="Опишите как вы выполните работу, ваш опыт..."
                value={offerForm.comment}
                onChange={e => setOfferForm({ ...offerForm, comment: e.target.value })}
              />
            </div>

          </div>

          {/* Футер */}
          <div className="fw-modal-footer">
            <button
              type="button"
              className="fw-modal-cancel"
              onClick={handleCloseOfferModal}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="fw-modal-submit"
              disabled={submitting || !offerForm.price}
            >
              {submitting ? 'Отправка...' : '📩 Отправить отклик'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );

  // ═══ ЭКРАН 2: заявки внутри категории ═══
  if (selectedCategory) {
    const style = CATEGORY_STYLES[selectedCategory.slug] || { emoji: '📋', color: '#f3f4f6' };
    const catRequests = getRequestsForCategory(selectedCategory);

    return (
      <div>
        <div className="page-header-bar">
          <div className="container">
            <button className="cats-back-link" onClick={() => setSelectedCategory(null)}>
              ← Все категории
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
              <div className="cat-page-icon" style={{ background: style.color }}>
                {style.emoji}
              </div>
              <div>
                <h1>{selectedCategory.name}</h1>
                <p>{pluralRequests(catRequests.length)} от заказчиков</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          {catRequests.length === 0 ? (
            <div className="fw-empty">
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
                  <div className="fw-request-top">
                    <span className="fw-request-budget">
                      {req.budgetTo
                        ? `до ${Number(req.budgetTo).toLocaleString('ru-RU')} ₽`
                        : req.budgetFrom
                        ? `от ${Number(req.budgetFrom).toLocaleString('ru-RU')} ₽`
                        : 'Договорная'}
                    </span>
                    <span className="fw-request-date">
                      {new Date(req.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  <h3 className="fw-request-title">{req.title}</h3>

                  {req.description && req.description !== 'Без описания' && (
                    <p className="fw-request-desc">{req.description}</p>
                  )}

                  <div className="fw-request-meta">
                    {req.addressText && <span>📍 {req.addressText}</span>}
                    {req.city && !req.addressText && <span>🏙️ {req.city}</span>}
                    {req.scheduledAt && (
                      <span>📅 {new Date(req.scheduledAt).toLocaleDateString('ru-RU')}</span>
                    )}
                  </div>

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

        {showOfferModal && <OfferModal />}
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
        {loading ? (
          <div className="cats-grid">
            {[1,2,3,4,5,6,7,8,9].map(i => (
              <div key={i} className="cat-skeleton">
                <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 'var(--r-md)' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: '85%', height: 13 }} />
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="fw-empty">
            <span>📋</span>
            <p>Категории не загружены</p>
          </div>
        ) : (
          <div className="cats-grid">
            {categories.map((cat, idx) => {
              const style = CATEGORY_STYLES[cat.slug] || { emoji: '📋', color: '#f3f4f6' };
              const count = getRequestsForCategory(cat).length;
              return (
                <button
                  key={cat.id}
                  className="cat-card fade-up"
                  onClick={() => setSelectedCategory(cat)}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="cat-card-icon" style={{ background: style.color }}>
                    {style.emoji}
                  </div>
                  <div className="cat-card-body">
                    <h2>{cat.name}</h2>
                    <p>{count > 0 ? pluralRequests(count) : 'Нет активных заявок'}</p>
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