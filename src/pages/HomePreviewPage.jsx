import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './homePreview.css';

const CATS = [
  { name: 'Ремонт квартир', count: '240 мастеров', from: 'от 500 ₽', img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80' },
  { name: 'Сантехника', count: '180', from: 'от 400 ₽', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
  { name: 'Электрика', count: '156', from: 'от 600 ₽', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80' },
  { name: 'Уборка', count: '94', from: 'от 300 ₽', img: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&q=80' },
  { name: 'Парикмахер', count: '72', from: 'от 800 ₽', img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80' },
];

const CHIPS_CUSTOMER = ['💅 Маникюр', '💄 Красота', '📚 Репетиторы', '💻 Компьютеры', '🚗 Автосервис', '🐾 Зоо', '📦 Грузчики', '🎨 Дизайн'];
const CHIPS_WORKER = ['⚡ Электрика', '🔧 Сантехника', '🧹 Уборка', '💻 IT', '🚚 Перевозки', '🎨 Отделка', '🔨 Ремонт', '✂️ Красота'];

const QUICK_CUSTOMER = ['⚡ электрик сегодня', '🧹 уборка 2-к', '🔧 сантехник срочно', '💻 ремонт ноутбука'];
const QUICK_WORKER = ['⚡ срочные заявки', '📍 рядом с вами', '💰 от 1500 ₽', '⭐ с отзывами'];

const FEED_CUSTOMER = [
  { who: 'Иван', what: 'взял заказ «Замена розеток»', time: '2 мин назад', color: 'linear-gradient(135deg,#e8410a,#ff7043)' },
  { who: 'Анна', what: 'оставила отзыв ★5', time: '5 мин', color: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  { who: 'Дмитрий', what: 'разместил заявку «Поклейка обоев»', time: '8 мин', color: 'linear-gradient(135deg,#0ea5e9,#22d3ee)' },
];
const FEED_WORKER = [
  { who: 'Ольга', what: 'ищет мастера «Установка двери»', time: '1 мин', color: 'linear-gradient(135deg,#e8410a,#ff7043)' },
  { who: 'Сергей', what: 'принял отклик на заявку', time: '4 мин', color: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  { who: 'Мария', what: 'опубликовала «Генеральная уборка»', time: '6 мин', color: 'linear-gradient(135deg,#0ea5e9,#22d3ee)' },
];

const LISTINGS_CUSTOMER = [
  { tag: 'Электрика', price: '1 200 ₽', title: 'Замена проводки в квартире, монтаж щитка', rating: 4.9, reviews: 124, city: 'Йошкар-Ола', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80' },
  { tag: 'Сантехника', price: '888 ₽', title: 'Установка смесителя, замена труб, любые работы', rating: 4.8, reviews: 86, city: 'Йошкар-Ола', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
  { tag: 'Уборка', price: '2 500 ₽', title: 'Генеральная уборка квартиры до 60 м²', rating: 5.0, reviews: 42, city: 'Йошкар-Ола', img: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&q=80' },
  { tag: 'Ремонт', price: '5 000 ₽', title: 'Ремонт ПК, чистка, установка ОС', rating: 4.7, reviews: 211, city: 'Йошкар-Ола', img: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&q=80' },
];

const LISTINGS_WORKER = [
  { tag: 'Электрика', price: 'до 8 000 ₽', title: 'Нужен электрик: перенос розеток в новостройке', rating: null, reviews: null, city: 'Йошкар-Ола', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80' },
  { tag: 'Сантехника', price: 'договорная', title: 'Протечка под ванной, нужна диагностика и ремонт', rating: null, reviews: null, city: 'Йошкар-Ола', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
  { tag: 'Уборка', price: '3 000 ₽', title: 'Уборка после ремонта, вывоз мусора', rating: null, reviews: null, city: 'Йошкар-Ола', img: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&q=80' },
  { tag: 'Ремонт', price: 'от 15 000 ₽', title: 'Косметический ремонт комнаты 14 м²', rating: null, reviews: null, city: 'Йошкар-Ола', img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80' },
];

const TOP_MASTERS = [
  { name: 'Алексей И.', cat: 'Электрика', rate: 4.9 },
  { name: 'Мария К.', cat: 'Уборка', rate: 5.0 },
  { name: 'Сергей П.', cat: 'Сантехника', rate: 4.8 },
];

const TOP_REQUESTS_PREVIEW = [
  { title: 'Замена проводки в однушке', budget: 'до 12 000 ₽', time: '2 мин' },
  { title: 'Сборка кухни, навеска шкафов', budget: 'договорная', time: '5 мин' },
  { title: 'Генеральная уборка после ремонта', budget: '4 500 ₽', time: '8 мин' },
];

const fmt = (n) => Number(n).toLocaleString('ru-RU');

const COPY = {
  customer: {
    eyebrow: 'Йошкар-Ола · 1 240 мастеров онлайн',
    h1Before: 'Найдите мастера ',
    h1Accent: 'рядом с вами',
    h1After: ' за 7 минут',
    sub: 'Ремонт, сантехника, красота и другие услуги — оставьте заявку и получите отклики проверенных мастеров.',
    searchPlaceholder: 'Что нужно сделать? Например: починить кран',
    searchGo: 'Найти →',
    trust1: '12 480',
    trust1b: 'заказов выполнено',
    trust2: '4.9 ★',
    trust2b: 'средний рейтинг',
    trust3: '~7 мин',
    trust3b: 'средний отклик',
    social: [
      ['12 480', 'заказов'],
      ['4.9 ★', 'рейтинг'],
      ['1 240', 'мастеров'],
      ['~7 мин', 'отклик'],
      ['98%', 'довольны'],
    ],
    categoriesTitle: 'Популярные категории',
    categoriesLink: '/sections',
    categoriesLinkLabel: 'Все категории →',
    listingsTitle: 'Объявления мастеров',
    listingsLink: '/find-master',
    listingsLinkLabel: 'Все мастера →',
    filters: [
      { k: 'all', l: 'Все' },
      { k: 'today', l: 'Сегодня' },
      { k: 'near', l: '📍 Рядом' },
      { k: 'rev', l: 'С отзывами' },
      { k: 'cheap', l: 'До 1 000 ₽' },
    ],
    cardWrite: 'Написать',
    cardMore: 'Подробнее',
    cardUnit: 'за работу',
    cardVerified: '✓ Проверен',
    widgetTitle: 'Заявка за 30 секунд',
    step1b: 'Опишите задачу',
    step1s: 'Что и когда нужно сделать',
    step2b: 'Получите отклики',
    step2s: 'В среднем за 7 минут',
    step3b: 'Выберите мастера',
    step3s: 'Сравните цены и отзывы',
    ctaHref: '/my-requests',
    ctaLabel: 'Разместить заявку →',
    topTitle: 'Топ мастера недели',
    promoTitle: 'Стать мастером',
    promoText: 'Получайте заказы каждый день. Регистрация бесплатно.',
    promoHref: '/register',
    promoBtn: 'Начать →',
    searchBase: '/find-master',
    bentoBase: '/find-master',
    chipBase: '/find-master',
  },
  worker: {
    eyebrow: 'Йошкар-Ола · свежие заявки',
    h1Before: 'Найдите ',
    h1Accent: 'работу рядом',
    h1After: ' и откликайтесь первым',
    sub: 'Заявки от заказчиков: ремонт, уборка, монтаж и другое — выберите задачу и предложите свою цену.',
    searchPlaceholder: 'Что ищете? Например: электрика на сегодня',
    searchGo: 'Найти →',
    trust1: '12 480',
    trust1b: 'заказов на платформе',
    trust2: '4.9 ★',
    trust2b: 'доверие заказчиков',
    trust3: '~7 мин',
    trust3b: 'средний отклик',
    social: [
      ['12 480', 'заказов'],
      ['4.9 ★', 'рейтинг'],
      ['87', 'заявок сегодня'],
      ['~7 мин', 'отклик'],
      ['98%', 'довольны'],
    ],
    categoriesTitle: 'Популярные направления',
    categoriesLink: '/find-work',
    categoriesLinkLabel: 'Все разделы →',
    listingsTitle: 'Свежие заявки',
    listingsLink: '/find-work',
    listingsLinkLabel: 'Все заявки →',
    filters: [
      { k: 'all', l: 'Все' },
      { k: 'today', l: 'Сегодня' },
      { k: 'near', l: '📍 Рядом' },
      { k: 'rev', l: 'С бюджетом' },
      { k: 'cheap', l: 'До 3 000 ₽' },
    ],
    cardWrite: 'Откликнуться',
    cardMore: 'Подробнее',
    cardUnit: 'бюджет',
    cardVerified: '● Открыта',
    widgetTitle: 'Отклик за минуту',
    step1b: 'Откройте заявку',
    step1s: 'Подходит по городу и задаче',
    step2b: 'Предложите цену',
    step2s: 'Срок и комментарий — в одном окне',
    step3b: 'Договоритесь в чате',
    step3s: 'Уточните детали с заказчиком',
    ctaHref: '/find-work',
    ctaLabel: 'Смотреть заявки →',
    topTitle: 'Свежие заявки',
    promoTitle: 'Разместите объявление',
    promoText: 'Заказчики найдут вас сами. Публикация — несколько минут.',
    promoHref: '/my-listings',
    promoBtn: 'Разместить услугу →',
    searchBase: '/find-work',
    bentoBase: '/find-work',
    chipBase: '/find-work',
  },
};

/**
 * Макет главной (Lovable): /home-preview — заказчик, /home-preview/worker — мастер.
 */
export default function HomePreviewPage({ variant = 'customer' }) {
  const navigate = useNavigate();
  const isWorker = variant === 'worker';
  const c = COPY[isWorker ? 'worker' : 'customer'];

  const [filter, setFilter] = useState('all');
  const [favs, setFavs] = useState({});
  const [feedIdx, setFeedIdx] = useState(0);
  const [q, setQ] = useState('');

  const chips = isWorker ? CHIPS_WORKER : CHIPS_CUSTOMER;
  const quick = isWorker ? QUICK_WORKER : QUICK_CUSTOMER;
  const feedSource = isWorker ? FEED_WORKER : FEED_CUSTOMER;
  const listings = isWorker ? LISTINGS_WORKER : LISTINGS_CUSTOMER;

  useEffect(() => {
    const t = setInterval(() => setFeedIdx((i) => (i + 1) % feedSource.length), 3500);
    return () => clearInterval(t);
  }, [feedSource.length]);

  const visibleFeed = useMemo(
    () => [feedSource[feedIdx], feedSource[(feedIdx + 1) % feedSource.length], feedSource[(feedIdx + 2) % feedSource.length]],
    [feedIdx, feedSource],
  );

  const onSearch = (e) => {
    e.preventDefault();
    const s = q.trim();
    const base = c.searchBase;
    navigate(s ? `${base}?q=${encodeURIComponent(s)}` : base);
  };

  const quickNavigate = (text) => {
    navigate(`${c.searchBase}?q=${encodeURIComponent(text)}`);
  };

  return (
    <div className="hpv">
      <div className="hpv-role-switch">
        <Link to="/home-preview" className={!isWorker ? 'active' : ''}>
          Версия для заказчика
        </Link>
        <span style={{ color: 'rgba(255,255,255,.35)' }}>|</span>
        <Link to="/home-preview/worker" className={isWorker ? 'active' : ''}>
          Версия для мастера
        </Link>
      </div>

      <section className="hpv-hero">
        <div className="hpv-hero-inner">
          <div>
            <div className="hpv-eyebrow">
              <span className="hpv-dot" />
              {c.eyebrow}
            </div>
            <h1 className="hpv-h1">
              {c.h1Before}
              <span>{c.h1Accent}</span>
              {c.h1After}
            </h1>
            <p className="hpv-sub">{c.sub}</p>

            <form className="hpv-search" onSubmit={onSearch}>
              <button type="button" className="hpv-search-loc">
                📍 Йошкар-Ола
              </button>
              <div className="hpv-search-input">
                <span style={{ color: 'rgba(255,255,255,.4)' }} aria-hidden>
                  🔍
                </span>
                <input
                  placeholder={c.searchPlaceholder}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Поиск"
                />
              </div>
              <button type="submit" className="hpv-search-go">
                {c.searchGo}
              </button>
            </form>

            <div className="hpv-quick">
              {quick.map((t) => (
                <button key={t} type="button" className="hpv-quick-chip" onClick={() => quickNavigate(t)}>
                  {t}
                </button>
              ))}
            </div>

            <div className="hpv-trust">
              <div className="hpv-trust-item">
                <strong>{c.trust1}</strong>
                {c.trust1b}
              </div>
              <div className="hpv-trust-item">
                <strong>{c.trust2}</strong>
                {c.trust2b}
              </div>
              <div className="hpv-trust-item">
                <strong>{c.trust3}</strong>
                {c.trust3b}
              </div>
            </div>
          </div>

          <aside className="hpv-livecard">
            <div className="hpv-live-head">
              <span className="hpv-live-title">Сейчас на платформе</span>
              <span className="hpv-live-online">Онлайн</span>
            </div>
            <div className="hpv-feed">
              {visibleFeed.map((f, i) => (
                <div className="hpv-feed-row" key={`${f.who}-${i}`}>
                  <div className="hpv-feed-ava" style={{ background: f.color }}>
                    {f.who[0]}
                  </div>
                  <div className="hpv-feed-text">
                    <b>{f.who}</b> {f.what}
                  </div>
                  <div className="hpv-feed-time">{f.time}</div>
                </div>
              ))}
            </div>
            <div className="hpv-mini-stats">
              <div className="hpv-mini-stat">
                <b>1 240</b>
                <span>мастеров</span>
              </div>
              <div className="hpv-mini-stat">
                <b>87</b>
                <span>заявок сегодня</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="hpv-social">
        <div className="hpv-social-inner">
          {c.social.map(([bold, lbl], i) => (
            <React.Fragment key={`${bold}-${i}`}>
              {i > 0 ? <div className="hpv-social-divider" /> : null}
              <div className="hpv-social-item">
                <b>{bold}</b>
                <span>{lbl}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="hpv-body">
        <main>
          <div className="hpv-section-hdr">
            <h2>{c.categoriesTitle}</h2>
            <Link to={c.categoriesLink}>{c.categoriesLinkLabel}</Link>
          </div>
          <div className="hpv-bento">
            {CATS.map((cat, i) => (
              <Link key={cat.name} className={`hpv-bento-tile ${i === 0 ? 'big' : ''}`} to={c.bentoBase}>
                <div className="hpv-bento-bg" style={{ backgroundImage: `url(${cat.img})` }} />
                <div className="hpv-bento-overlay" />
                <div className="hpv-bento-body">
                  <div className="hpv-bento-name">{cat.name}</div>
                  <div className="hpv-bento-meta">
                    <span>{cat.count}</span>
                    <span>{cat.from}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="hpv-chips">
            {chips.map((chip) => (
              <Link key={chip} className="hpv-chip" to={`${c.chipBase}?q=${encodeURIComponent(chip)}`}>
                {chip}
              </Link>
            ))}
          </div>

          <div className="hpv-section-hdr" style={{ marginTop: 28 }}>
            <h2>{c.listingsTitle}</h2>
            <Link to={c.listingsLink}>{c.listingsLinkLabel}</Link>
          </div>

          <div className="hpv-filter-row">
            {c.filters.map((f) => (
              <button key={f.k} type="button" className={`hpv-filter ${filter === f.k ? 'active' : ''}`} onClick={() => setFilter(f.k)}>
                {f.l}
              </button>
            ))}
            <select className="hpv-sort" aria-label="Сортировка">
              <option>Новые</option>
              <option>Дешевле</option>
              <option>Рейтинг</option>
            </select>
          </div>

          <div className="hpv-grid">
            {listings.map((l, i) => (
              <article className="hpv-card" key={l.title}>
                <div className="hpv-card-img">
                  <img src={l.img} alt="" loading="lazy" />
                  <div className="hpv-card-tag">{l.tag}</div>
                  <button
                    type="button"
                    className={`hpv-card-fav ${favs[i] ? 'active' : ''}`}
                    onClick={() => setFavs((p) => ({ ...p, [i]: !p[i] }))}
                    aria-label={favs[i] ? 'Убрать из избранного' : 'В избранное'}
                  >
                    {favs[i] ? '♥' : '♡'}
                  </button>
                  <div className="hpv-card-quick">
                    <Link to={isWorker ? '/find-work' : `/find-master?q=${encodeURIComponent(l.tag)}`} className="hpv-quick-btn primary" onClick={(e) => e.stopPropagation()}>
                      {c.cardWrite}
                    </Link>
                    <Link to={isWorker ? '/find-work' : '/find-master'} className="hpv-quick-btn" onClick={(e) => e.stopPropagation()}>
                      {c.cardMore}
                    </Link>
                  </div>
                </div>
                <Link to={isWorker ? '/find-work' : '/find-master'} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="hpv-card-body">
                    <div>
                      <span className="hpv-card-price">{l.price}</span>
                      <span className="hpv-card-unit">{c.cardUnit}</span>
                    </div>
                    <div className="hpv-card-title">{l.title}</div>
                    <div className="hpv-card-meta">
                      {l.rating != null ? (
                        <>
                          <span className="hpv-card-rate">★ {l.rating}</span>
                          <span style={{ color: '#bbb' }}>· {l.reviews} отзывов</span>
                        </>
                      ) : (
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Новая заявка</span>
                      )}
                      <span className="hpv-card-verified">{c.cardVerified}</span>
                      <span className="hpv-card-city">📍 {l.city}</span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </main>

        <aside className="hpv-side">
          <div className="hpv-widget">
            <h3 className="hpv-widget-title">{c.widgetTitle}</h3>
            <div className="hpv-step">
              <div className="hpv-step-num">1</div>
              <div className="hpv-step-text">
                <b>{c.step1b}</b>
                <span>{c.step1s}</span>
              </div>
            </div>
            <div className="hpv-step">
              <div className="hpv-step-num">2</div>
              <div className="hpv-step-text">
                <b>{c.step2b}</b>
                <span>{c.step2s}</span>
              </div>
            </div>
            <div className="hpv-step">
              <div className="hpv-step-num">3</div>
              <div className="hpv-step-text">
                <b>{c.step3b}</b>
                <span>{c.step3s}</span>
              </div>
            </div>
            <Link className="hpv-cta-btn" to={c.ctaHref}>
              {c.ctaLabel}
            </Link>
          </div>

          <div className="hpv-widget">
            <h3 className="hpv-widget-title">{c.topTitle}</h3>
            {isWorker
              ? TOP_REQUESTS_PREVIEW.map((r) => (
                  <div className="hpv-top-master" key={r.title}>
                    <div className="hpv-tm-ava" style={{ fontSize: 11, fontWeight: 800 }}>
                      !
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="hpv-tm-name" style={{ fontSize: 12, lineHeight: 1.25 }}>
                        {r.title}
                      </div>
                      <div className="hpv-tm-cat">{r.budget}</div>
                    </div>
                    <div className="hpv-tm-rate" style={{ fontSize: 11, color: '#94a3b8' }}>
                      {r.time}
                    </div>
                  </div>
                ))
              : TOP_MASTERS.map((m) => (
                  <div className="hpv-top-master" key={m.name}>
                    <div className="hpv-tm-ava">{m.name[0]}</div>
                    <div>
                      <div className="hpv-tm-name">{m.name}</div>
                      <div className="hpv-tm-cat">{m.cat}</div>
                    </div>
                    <div className="hpv-tm-rate">★ {m.rate}</div>
                  </div>
                ))}
          </div>

          <div className="hpv-promo">
            <h3>{c.promoTitle}</h3>
            <p>{c.promoText}</p>
            <Link className="hpv-promo-btn" to={c.promoHref}>
              {c.promoBtn}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
