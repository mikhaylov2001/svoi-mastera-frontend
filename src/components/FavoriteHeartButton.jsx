import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

const HEART_PATH =
  'M12 20.25l-1.1-1C6.14 15.36 3.5 12.64 3.5 9.75 3.5 7.4 5.4 5.5 7.75 5.5c1.52 0 2.98.78 3.75 2.02.77-1.24 2.23-2.02 3.75-2.02 2.35 0 4.25 1.9 4.25 4.25 0 2.89-2.64 5.61-7.4 9.5l-1.1 1z';

/**
 * Кнопка «В избранное» — единый вид по проекту.
 * variant: card | detail | compact | compact-sm
 * kind: listing | jobRequest
 */
export default function FavoriteHeartButton({
  kind,
  id,
  variant = 'card',
  className = '',
  forcedActive = false,
  onToggle,
  titleActive = 'Убрать из избранного',
  titleInactive = 'В избранное',
}) {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const fav = useFavorites();
  const active =
    forcedActive ||
    (kind === 'listing' ? fav.isListingFavorite(id) : fav.isJobRequestFavorite(id));

  const onClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (onToggle) {
        onToggle(e);
        return;
      }
      if (!userId) {
        navigate('/login');
        return;
      }
      if (kind === 'listing') fav.toggleListing(id);
      else fav.toggleJobRequest(id);
    },
    [userId, navigate, fav, kind, id, onToggle],
  );

  const variantClass =
    variant === 'detail'
      ? 'fav-heart--detail'
      : variant === 'compact'
        ? 'fav-heart--compact'
        : variant === 'compact-sm'
          ? 'fav-heart--compact-sm'
          : 'fav-heart--card';

  return (
    <button
      type="button"
      className={`fav-heart ulc-fav-heart ${variantClass} ${active ? 'fav-heart--on ulc-fav-heart--on' : ''} ${className}`.trim()}
      onClick={onClick}
      title={active ? titleActive : titleInactive}
      aria-pressed={active}
      aria-label={active ? titleActive : titleInactive}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d={HEART_PATH}
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
