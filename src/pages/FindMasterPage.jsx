import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getOpenJobRequestsForWorker, createJobOffer } from '../api';
import './FindWorkPage.css';

// Иконки и цвета для категорий
const CATEGORY_STYLES = {
  'Ремонт квартир': { emoji: '🏠', color: '#fff3e0' },
  'Сантехника': { emoji: '🔧', color: '#e3f2fd' },
  'Электрика': { emoji: '⚡', color: '#fffde7' },
  'Уборка': { emoji: '🧹', color: '#fce4ec' },
  'Парикмахер': { emoji: '💇', color: '#fce4ec' },
  'Маникюр': { emoji: '💅', color: '#fce4ec' },
  'Красота и здоровье': { emoji: '✨', color: '#f3e5f5' },
  'Репетиторство': { emoji: '📚', color: '#e3f2fd' },
  'Компьютерная помощь': { emoji: '💻', color: '#e8f5e9' },
};

export default function FindWorkPage() {
  const { userId } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(null);
  const [offerForm, setOfferForm] = useState({ price: '', comment: '', estimatedDays: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [userId]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getOpenJobRequestsForWorker(userId);
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to load requests:', err);
      showToast('Не удалось загрузить заявки', 'error');
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

    if (!offerForm.price) {
      showToast('Укажите цену', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createJobOffer(userId, showOfferModal.id, {
        price: Number(offerForm.price),
        comment: offerForm.comment || 'Готов выполнить работу',
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
  const groupedRequests = requests.reduce((acc, request) => {
    const category = request.categoryName || 'Без категории';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(request);
    return acc;
  }, {});

  const categories = Object.keys(groupedRequests).sort();

  // Если выбрана категория - показываем заявки внутри неё
  if (selectedCategory) {
    const categoryRequests = groupedRequests[selectedCategory] || [];

    return (
      <div className="find-work-page">
        <div className="container" style={{ paddingTop: '32px' }}>
          <button
            className="cats-back-link"
            onClick={() => setSelectedCategory(null)}
          >
            ← Назад к категориям
          </button>

          <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--gray-900)', marginBottom: '8px' }}>
            {selectedCategory}
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--gray-600)', marginBottom: '32px' }}>
            {categoryRequests.length} {categoryRequests.length === 1 ? 'заявка' : categoryRequests.length < 5 ? 'заявки' : 'заявок'}
          </p>

          {/* Requests Grid */}
          <div className="masters-grid">
            {categoryRequests.map((request, i) => (
              <div
                key={request.id}
                className="master-card fade-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <h3 className="master-card-title">{request.title}</h3>

                {request.description && (
                  <p className="master-text">{request.description}</p>
                )}

                <div className="master-card-meta">
                  {request.addressText && `📍 ${request.addressText}`}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  {request.budgetTo && (
                    <div className="master-price">
                      до {Number(request.budgetTo).toLocaleString('ru-RU')} ₽
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                    {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>

                {request.offersCount > 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '12px', fontWeight: 600 }}>
                    {request.offersCount} {request.offersCount === 1 ? 'отклик' : 'откликов'}
                  </div>
                )}

                <div className="master-actions">
                  <button className="btn btn-primary" onClick={() => handleOpenOfferModal(request)}>
                    Откликнуться
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Offer Modal */}
        {showOfferModal && (
          <div className="modal-overlay" onClick={handleCloseOfferModal}>
            <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
              <h3>Отклик на заявку</h3>
              <p className="modal-subtitle">{showOfferModal.title}</p>

              <form onSubmit={handleSubmitOffer}>
                <div className="form-group">
                  <label htmlFor="price">Ваша цена *</label>
                  <input
                    type="number"
                    id="price"
                    className="form-control"
                    placeholder="Например, 5000"
                    value={offerForm.price}
                    onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="estimatedDays">Срок выполнения (дней)</label>
                  <input
                    type="number"
                    id="estimatedDays"
                    className="form-control"
                    placeholder="Например, 3"
                    value={offerForm.estimatedDays}
                    onChange={(e) => setOfferForm({ ...offerForm, estimatedDays: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="comment">Комментарий</label>
                  <textarea
                    id="comment"
                    className="form-control"
                    rows={4}
                    placeholder="Опишите как вы выполните работу..."
                    value={offerForm.comment}
                    onChange={(e) => setOfferForm({ ...offerForm, comment: e.target.value })}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={handleCloseOfferModal}>
                    Отмена
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Отправка...' : 'Отправить отклик'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Главная страница - показываем категории
  return (
    <div className="find-work-page">
      <div className="container" style={{ paddingTop: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--gray-900)', marginBottom: '8px' }}>
          Найти работу
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--gray-600)', marginBottom: '32px' }}>
          Выберите раздел — найдите активные заявки
        </p>

        {loading && (
          <div className="loading-state">Загрузка заявок...</div>
        )}

        {!loading && categories.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>Нет открытых заявок</h3>
            <p>Заявки появятся здесь автоматически</p>
          </div>
        )}

        {!loading && categories.length > 0 && (
          <div className="cats-grid">
            {categories.map((category, idx) => {
              const style = CATEGORY_STYLES[category] || { emoji: '📋', color: '#f3f4f6' };
              const count = groupedRequests[category].length;

              return (
                <button
                  key={category}
                  className="cat-card fade-up"
                  onClick={() => setSelectedCategory(category)}
                  style={{ animationDelay: `${idx * 0.05}s`, cursor: 'pointer' }}
                >
                  <div className="cat-card-icon" style={{ background: style.color }}>
                    {style.emoji}
                  </div>
                  <div className="cat-card-body">
                    <h2>{category}</h2>
                    <p>{count} {count === 1 ? 'заявка' : count < 5 ? 'заявки' : 'заявок'}</p>
                  </div>
                  <div className="cat-card-arrow">→</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}