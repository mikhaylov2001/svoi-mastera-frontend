import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getOpenJobRequestsForWorker, createJobOffer } from '../api';
import './FindWorkPage.css';

const ALL_CATEGORIES = [
  { slug: 'remont-kvartir',       name: 'Ремонт квартир',      emoji: '🏠', color: '#fff3e0' },
  { slug: 'santehnika',           name: 'Сантехника',           emoji: '🔧', color: '#e3f2fd' },
  { slug: 'elektrika',            name: 'Электрика',            emoji: '⚡', color: '#fffde7' },
  { slug: 'uborka',               name: 'Уборка',               emoji: '🧹', color: '#fce4ec' },
  { slug: 'parikhmaher',          name: 'Парикмахер',           emoji: '💇', color: '#fce4ec' },
  { slug: 'manikur',              name: 'Маникюр и педикюр',    emoji: '💅', color: '#fce4ec' },
  { slug: 'krasota-i-zdorovie',   name: 'Красота и здоровье',   emoji: '✨', color: '#f3e5f5' },
  { slug: 'repetitorstvo',        name: 'Репетиторство',        emoji: '📚', color: '#e3f2fd' },
  { slug: 'kompyuternaya-pomosh', name: 'Компьютерная помощь',  emoji: '💻', color: '#e8f5e9' },
];

function pluralRequests(n) {
  if (n % 10 === 1 && n % 100 !== 11) return `${n} заявка`;
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return `${n} заявки`;
  return `${n} заявок`;
}

export default function FindWorkPage() {
  const { userId } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests]                 = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showOfferModal, setShowOfferModal]     = useState(null);
  const [offerForm, setOfferForm]               = useState({ price: '', comment: '', estimatedDays: '' });
  const [submitting, setSubmitting]             = useState(false);

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

  // Матчим заявки к категории по названию или slug
  const getRequestsForCategory = (cat) => {
    return requests.filter(r => {
      const rName = (r.categoryName || '').toLowerCase().trim();
      const rSlug = (r.categorySlug || '').toLowerCase().trim();
      return (
        rName === cat.name.toLowerCase() ||
        rSlug === cat.slug.toLowerCase() ||
        rName.includes(cat.name.toLowerCase()) ||
        cat.name.toLowerCase().includes(rName) && rName.length > 2
      );
    });
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

  // ═══ ЭКРАН 2: заявки внутри категории ═══
  if (selectedCategory) {
    const catRequests = getRequestsForCategory(selectedCategory);

    return (
      <div>
        <div className="page-header-bar">
          <div className="container">
            <button className="cats-back-link" onClick={() => setSelectedCategory(null)}>
              ← Все категории
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
              <div className="cat-page-icon" style={{ background: selectedCategory.color }}>
                {selectedCategory.emoji}
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
            <div className="cats-error" style={{ padding: '60px 0' }}>
              <span style={{ fontSize: 48 }}>📋</span>
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
                      {req.budget
                        ? `до ${Number(req.budget).toLocaleString('ru-RU')} ₽`
                        : 'Договорная'}
                    </span>
                    <span className="fw-request-date">
                      {new Date(req.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  <h3 className="fw-request-title">{req.title}</h3>

                  {req.description && (
                    <p className="fw-request-desc">{req.description}</p>
                  )}

                  <div className="fw-request-meta">
                    {req.addressText && <span>📍 {req.addressText}</span>}
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
                    type="number" className="form-input"
                    placeholder="Например, 5000"
                    value={offerForm.price}
                    onChange={e => setOfferForm({ ...offerForm, price: e.target.value })}
                    required min="1"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Срок выполнения (дней)</label>
                  <input
                    type="number" className="form-input"
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
                  <button type="button" className="btn btn-outline" onClick={handleCloseOfferModal} style={{ flex: 1 }}>
                    Отмена
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 2 }}>
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
        ) : (
          <div className="cats-grid">
            {ALL_CATEGORIES.map((cat, idx) => {
              const count = getRequestsForCategory(cat).length;
              return (
                <button
                  key={cat.slug}
                  className="cat-card fade-up"
                  onClick={() => setSelectedCategory(cat)}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="cat-card-icon" style={{ background: cat.color }}>
                    {cat.emoji}
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