import React from 'react';
import FavoriteHeartButton from './FavoriteHeartButton';

/** Слот сердечка в правом верхнем углу медиа-блока карточки. */
export default function CardFavoriteSlot({
  kind,
  id,
  className = 'card-fav-slot',
  buttonClassName = '',
  ...buttonProps
}) {
  if (!kind || id == null) return null;

  return (
    <div className={className} onClick={(e) => e.stopPropagation()}>
      <FavoriteHeartButton kind={kind} id={id} className={buttonClassName} {...buttonProps} />
    </div>
  );
}
