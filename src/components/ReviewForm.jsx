import React, { useState } from 'react';
import { createReview, createCustomerReview } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './ReviewForm.css';

export default function ReviewForm({ dealId, onSuccess, forWorker = false }) {
  const { userId } = useAuth();
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      showToast('Выберите оценку', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const api = forWorker ? createCustomerReview : createReview;
      await api(userId, dealId, {
        rating,
        text: text.trim() || null
      });

      showToast('Отзыв отправлен!', 'success');
      setRating(0);
      setText('');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to create review:', err);
      showToast('Не удалось отправить отзыв', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="review-form">
      <h3 className="review-form-title">{forWorker ? 'Отзыв о заказчике' : 'Оставить отзыв'}</h3>

      <div className="review-rating">
        <label>Оценка:</label>
        <div className="stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`star ${star <= (hoveredRating || rating) ? 'active' : ''}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="review-text">
        <label htmlFor="review-text">Комментарий (необязательно):</label>
        <textarea
          id="review-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={forWorker ? 'Как прошло общение и постановка задачи…' : 'Расскажите о работе мастера…'}
          rows={4}
          maxLength={500}
        />
        <small>{text.length} / 500</small>
      </div>

      <button type="submit" className="btn btn-primary" disabled={submitting || rating === 0}>
        {submitting ? 'Отправка...' : 'Отправить отзыв'}
      </button>
    </form>
  );
}
