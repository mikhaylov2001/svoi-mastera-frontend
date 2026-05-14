/** Доп. стили для «карточки объявления» (сетка, сайдбар, мета) — страница объявления и деталь заявки в «Найти работу». */
export const listingDetailSurfaceExtraCss = `
/* Сайдбар чуть шире → главное фото слега уже; карточки чуть просторнее */
.ed--listing-detail .ed-grid {
  grid-template-columns: minmax(0, 1fr) minmax(288px, 358px);
  gap: 20px;
}
@media (max-width: 1020px) {
  .ed--listing-detail .ed-grid { grid-template-columns: 1fr; }
}
.ed--listing-detail .ed-side { gap: 13px; min-width: 0; }
.ed--listing-detail .ed-side .ed-card {
  padding: 17px 20px;
  border-radius: 15px;
}
.ed--listing-detail .ed-price-num { font-size: 28px; margin-top: 6px; letter-spacing: -0.03em; }
.ed--listing-detail .ed-price-num small { font-size: 16px; }
.ed--listing-detail .ed-price-sub { margin-top: 6px; font-size: 12px; line-height: 1.45; }
.ed--listing-detail .ed-actions { margin-top: 10px; gap: 6px; }
.ed--listing-detail .ed-btn,
.ed--listing-detail .ed-msg-btn {
  padding: 9px 14px;
  font-size: 13px;
  border-radius: 10px;
}
.ed--listing-detail .ed-cust-row { padding: 0 0 10px; }
.ed--listing-detail .ed-eyebrow--block { display: block; margin-bottom: 8px; }
/* Аватар в карточке «Мастер» / «Заказчик» — чуть меньше базового 44px */
.ed--listing-detail .ed-ava {
  width: 40px;
  height: 40px;
  border-radius: 10px;
}
.ed--listing-detail .ed-ava-fallback { font-size: 13px; }
.ed--listing-detail .ed-own-note { margin-top: 10px; padding: 10px 12px; font-size: 12px; line-height: 1.45; }
.ed--listing-detail .ed-link-deals { padding: 6px 0 0; font-size: 12px; }
.ed--listing-detail .ed-similar-head { margin-bottom: 10px; }
.ed--listing-detail .ed-similar-head strong { font-size: 14px; }

.ed-head { align-items: flex-start; }
.ed-head-right { display: flex; align-items: flex-start; gap: 10px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
.ed-fav.ulc-fav-heart {
  width: 40px; height: 40px; border-radius: 10px; border: 1px solid #ececef; background: #fff; color: #71717a;
  display: flex; align-items: center; justify-content: center; padding: 0; box-shadow: none; cursor: pointer;
}
.ed-fav.ulc-fav-heart:hover,
.ed-fav.ulc-fav-heart--on { color: #f45b31; border-color: #ffd4c2; background: #fff7f3; }
.ed-fav.ulc-fav-heart svg { width: 18px; height: 18px; }
.ed-listing-meta { margin-top: 10px; font-size: 13px; color: #71717a; line-height: 1.5; display: flex; flex-wrap: wrap; gap: 10px 16px; }
.ed-listing-meta span { display: inline-flex; align-items: center; gap: 6px; }
.ed-ava-fallback.neutral { background: #e4e4e8 !important; color: #52525b !important; }
.ed-similar-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.ed-similar-head strong { font-size: 15px; font-weight: 600; color: #0a0a0a; letter-spacing: -.02em; }
.ed-similar-head a { font-size: 12px; color: #f45b31; font-weight: 600; text-decoration: none; }
.ed-similar-head a:hover { text-decoration: underline; }
.ed-sim-item { display: flex; gap: 12px; text-decoration: none; color: inherit; padding: 10px 8px; border-radius: 10px; transition: background .15s; }
.ed-sim-item:hover { background: #fafafa; }
.ed-sim-img { width: 58px; height: 44px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: #f4f4f5; }
.ed-sim-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ed-sim-title { font-size: 13px; font-weight: 500; color: #52525b; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ed-sim-price { font-size: 13px; font-weight: 700; color: #0a0a0a; margin-top: 2px; }
.ed-error { font-size: 12px; color: #ef4444; font-weight: 600; padding: 4px 0; }
.ed-link-deals { display: block; text-align: center; font-size: 13px; color: #f45b31; font-weight: 600; background: none; border: none; cursor: pointer; font-family: inherit; padding: 8px 0 0; }
.ed-link-deals:hover { text-decoration: underline; }
.ed-own-note { margin-top: 14px; padding: 12px 14px; background: #fafafa; border-radius: 10px; font-size: 13px; color: #52525b; line-height: 1.5; border: 1px solid #ececef; }
`;
