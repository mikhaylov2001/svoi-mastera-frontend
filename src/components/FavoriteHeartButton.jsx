import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

/**
 * Кнопка «В избранное» как на Авито: контур / заливка, клик не всплывает с карточки.
 * kind: listing | jobRequest
 */
export default function FavoriteHeartButton({ kind, id, className = '', titleActive = 'Убрать из избранного', titleInactive = 'В избранное' }) {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const fav = useFavorites();
  const active =
    kind === 'listing' ? fav.isListingFavorite(id) : fav.isJobRequestFavorite(id);

  const onClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!userId) {
        navigate('/login');
        return;
      }
      if (kind === 'listing') fav.toggleListing(id);
      else fav.toggleJobRequest(id);
    },
    [userId, navigate, fav, kind, id],
  );

  return (
    <button
      type="button"
      className={`ulc-fav-heart ${active ? 'ulc-fav-heart--on' : ''} ${className}`.trim()}
      onClick={onClick}
      title={active ? titleActive : titleInactive}
      aria-pressed={active}
      aria-label={active ? titleActive : titleInactive}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 21s-7-4.35-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 11c0 5.65-7 10-7 10Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
          fill={active ? 'currentColor' : 'none'}
        />
      </svg>
    </button>
  );
}
