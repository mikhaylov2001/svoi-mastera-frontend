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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 20.25l-1.1-1C6.14 15.36 3.5 12.64 3.5 9.75 3.5 7.4 5.4 5.5 7.75 5.5c1.52 0 2.98.78 3.75 2.02.77-1.24 2.23-2.02 3.75-2.02 2.35 0 4.25 1.9 4.25 4.25 0 2.89-2.64 5.61-7.4 9.5l-1.1 1z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? 'currentColor' : 'none'}
        />
      </svg>
    </button>
  );
}
