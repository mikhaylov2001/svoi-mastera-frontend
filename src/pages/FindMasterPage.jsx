import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getOpenJobRequestsForWorker, createJobOffer } from '../api';
import './FindWorkPage.css';

export default function FindWorkPage() {
  const { userId } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recency');
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

  // Фильтрация
  const filteredRequests = requests.filter(request => {
    const matchesSearch = !searchTerm ||
      request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Сортировка
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'price-high') {
      return (b.budgetTo || 0) - (a.budgetTo || 0);
    }
    if (sortBy === 'price-low') {
      return (a.budgetTo || 0) - (b.budgetTo || 0);
    }
    // recency - по умолчанию
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Группируем по категориям
  const groupedRequests = sortedRequests.reduce((acc, request) => {
    const category = request.categoryName || 'Без категории';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(request);
    return acc;
  }, {});

  const categories = Object.keys(groupedRequests).sort();

  return (
    <div className="find-work-page">
      <div className="container" style={{ paddingTop: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--gray-900)', marginBottom: '8px' }}>
          Найти работу
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--gray-600)', marginBottom: '24px' }}>
          Открытые заявки в Йошкар-Оле · {sortedRequests.length} {sortedRequests.length === 1 ? 'заявка' : sortedRequests.length < 5 ? 'заявки' : 'заявок'}
        </p>

        {/* Панель фильтров */}
        <div className="find-master-controls">
          <div className="controls-left">
            <div className="search-box">
              <input
                type="text"
                placeholder="Поиск заявок..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="controls-right">
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recency">Сначала новые</option>
              <option value="price-high">Сначала дорогие</option>
              <option value="price-low">Сначала дешёвые</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="loading-state">
            <div>Загрузка заявок...</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedRequests.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>Нет открытых заявок</h3>
            <p>Заявки появятся здесь автоматически</p>
          </div>
        )}

        {/* Categories with Requests */}
        {!loading && categories.map((category, idx) => (
          <div key={category} style={{ marginBottom: '48px' }}>
            {/* Category Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '2px solid var(--gray-300)'
            }}>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 800,
                color: 'var(--gray-900)',
                margin: 0,
                letterSpacing: '-0.3px'
              }}>
                {category}
              </h2>
              <span style={{
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: 700
              }}>
                {groupedRequests[category].length}
              </span>
            </div>

            {/* Requests Grid */}
            <div className="masters-grid">
              {groupedRequests[category].map((request, i) => (
                <div
                  key={request.id}
                  className="master-card fade-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {/* Title */}
                  <h3 className="master-card-title">{request.title}</h3>

                  {/* Description */}
                  {request.description && (
                    <p className="master-text">{request.description}</p>
                  )}

                  {/* Meta Info */}
                  <div className="master-card-meta">
                    {request.addressText && `📍 ${request.addressText}`}
                  </div>

                  {/* Price & Date */}
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

                  {/* Offers Count */}
                  {request.offersCount > 0 && (
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--gray-500)',
                      marginBottom: '12px',
                      fontWeight: 600
                    }}>
                      {request.offersCount} {request.offersCount === 1 ? 'отклик' : 'откликов'}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="master-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleOpenOfferModal(request)}
                    >
                      Откликнуться
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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