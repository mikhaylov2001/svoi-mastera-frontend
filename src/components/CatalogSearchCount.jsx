import { pluralRuForm } from '../utils/formatCountRu';

const FORMS = {
  requests: ['заявка', 'заявки', 'заявок'],
  listings: ['объявление', 'объявления', 'объявлений'],
};

/** Бейдж «N заявок» / «N объявлений» — число и слово раздельно, без эффекта «11». */
export default function CatalogSearchCount({ count, type = 'listings' }) {
  const n = Number(count) || 0;
  const [one, few, many] = FORMS[type] || FORMS.listings;
  return (
    <span className="fmp-global-search-count">
      <span className="fmp-global-search-count-num">{n}</span>
      <span className="fmp-global-search-count-word">{pluralRuForm(n, one, few, many)}</span>
    </span>
  );
}
