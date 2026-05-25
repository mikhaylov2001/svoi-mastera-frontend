import React from 'react';
import FavoriteHeartButton from './FavoriteHeartButton';

/** Слот сердечка в правом верхнем углу медиа-блока карточки. */
export default function CardFavoriteSlot({
  kind,
  id,
  className = 'card-fav-slot',
  variant = 'card',
  size,
  ...buttonProps
}) {
  if (!kind || id == null) return null;

  const sizeClass =
    size === 'sm' ? ' card-fav-slot--sm' : size === 'xs' ? ' card-fav-slot--xs' : '';
  const buttonVariant =
    size === 'xs' ? 'compact-sm' : size === 'sm' ? 'compact' : variant;

  return (
    <div className={`${className}${sizeClass}`.trim()} onClick={(e) => e.stopPropagation()}>
      <FavoriteHeartButton
        kind={kind}
        id={id}
        variant={buttonVariant}
        {...buttonProps}
      />
    </div>
  );
}
