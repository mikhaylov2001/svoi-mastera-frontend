import { Link, useNavigate } from 'react-router-dom';
import { CATEGORIES_BY_SECTION } from './CategoriesPage';
import { CATEGORY_PLACEHOLDER_PHOTO_BY_SLUG as CAT_PHOTOS } from '../utils/categoryPlaceholderPhoto';
import { GUEST_LANDING_HP_CSS } from './guestLandingHpCss';

const ALL_CATS = Object.values(CATEGORIES_BY_SECTION).flat();

const GUEST_SECTION_CSS = `
    .g-section { padding: 60px 0; }
    .g-section-white { background: #fff; }
    .g-section-gray  { background: #f5f5f3; }
    .g-section-dark  { background: #0d0d0d; }
    .g-wrap { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    .g-section-hdr { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .g-section-hdr .g-title { margin-bottom: 0; }
    .g-section-hdr-link { font-size: 13px; color: #e8410a; font-weight: 700; text-decoration: none; white-space: nowrap; }
    .g-section-hdr-link:hover { text-decoration: underline; }
    .g-section-center { text-align: center; margin-bottom: 32px; }
    .g-section-center .g-sub { margin-bottom: 0; }
    .g-eyebrow { font-size: 11px; font-weight: 800; color: #e8410a; text-transform: uppercase; letter-spacing: .1em; margin-bottom: 8px; }
    .g-title { font-size: 32px; font-weight: 900; letter-spacing: -.5px; margin: 0 0 10px; }
    .g-sub { font-size: 15px; color: #888; margin: 0 0 40px; }
    .g-how-scroll { }
    .g-how-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
    .g-how-card { background: #fff; border-radius: 16px; padding: 28px 24px; border: 1px solid #ebebeb; transition: box-shadow .18s, transform .18s; }
    .g-how-card:hover { box-shadow: 0 8px 28px rgba(232,65,10,.1); transform: translateY(-3px); border-color: rgba(232,65,10,.2); }
    .g-how-num { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg,#e8410a,#ff5722); color: #fff; font-size: 18px; font-weight: 900; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(232,65,10,.3); }
    .g-how-title { font-size: 17px; font-weight: 800; margin: 0 0 8px; }
    .g-how-desc { font-size: 14px; color: #666; line-height: 1.6; margin: 0; }
    .g-benefits-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
    .g-benefit { display: flex; gap: 16px; align-items: flex-start; }
    .g-benefit-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
    .g-benefit-title { font-size: 15px; font-weight: 800; margin: 0 0 4px; }
    .g-benefit-desc { font-size: 13px; color: #888; line-height: 1.55; margin: 0; }
    .g-cats-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(150px,1fr)); gap: 10px; }
    .g-cat-card { background: #fff; border-radius: 12px; border: 1px solid #ebebeb; padding: 18px 14px; text-align: center; text-decoration: none; color: #1a1a1a; display: flex; flex-direction: column; align-items: center; gap: 8px; transition: all .18s; }
    .g-cat-card:hover { border-color: #e8410a; box-shadow: 0 4px 16px rgba(232,65,10,.1); transform: translateY(-2px); }
    .g-cat-emoji { font-size: 28px; }
    .g-cat-name { font-size: 13px; font-weight: 700; }
    .g-reviews-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
    .g-review { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 16px; padding: 24px; }
    .g-review-stars { color: #f59e0b; font-size: 16px; margin-bottom: 12px; }
    .g-review-text { font-size: 14px; color: rgba(255,255,255,.7); line-height: 1.65; margin: 0 0 16px; font-style: italic; }
    .g-review-footer { display: flex; align-items: center; gap: 10px; }
    .g-review-ava { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: 800; flex-shrink: 0; }
    .g-review-name { font-size: 14px; font-weight: 700; color: #fff; }
    .g-review-svc { font-size: 12px; color: rgba(255,255,255,.4); }
    .g-cta { background: linear-gradient(135deg, #1a0a00 0%, #3d1200 50%, #e8410a 100%); border-radius: 20px; padding: 48px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
    .g-cta-title { font-size: 26px; font-weight: 900; color: #fff; margin: 0 0 8px; }
    .g-cta-sub { font-size: 15px; color: rgba(255,255,255,.65); margin: 0; }
    .g-cta-btn { background: #fff; border: none; border-radius: 10px; color: #e8410a; font-size: 15px; font-weight: 800; padding: 14px 32px; cursor: pointer; white-space: nowrap; font-family: Manrope,Arial,sans-serif; transition: background .15s; flex-shrink: 0; }
    .g-cta-btn:hover { background: #fff3f0; }
    .g-cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
    .g-cat-tile { border-radius: 12px; overflow: hidden; text-decoration: none; color: #fff; position: relative; aspect-ratio: 4/3; display: flex; flex-direction: column; justify-content: flex-end; transition: transform .18s, box-shadow .18s; -webkit-tap-highlight-color: transparent; }
    .g-cat-tile:active { transform: scale(0.98); }
    .g-cat-tile-bg { position: absolute; inset: 0; background-size: cover; background-position: center; }
    .g-cat-tile-ph { position: absolute; inset: 0; background: linear-gradient(135deg,#2a1a00,#e8410a); display: flex; align-items: center; justify-content: center; font-size: 36px; }
    .g-cat-tile-overlay { position: absolute; inset: 0; background: linear-gradient(0deg,rgba(0,0,0,.72) 0%,rgba(0,0,0,.1) 55%,transparent 100%); }
    .g-cat-tile-label { position: relative; padding: 10px 12px; font-size: 13px; font-weight: 800; line-height: 1.2; }
    .g-cat-grid > a { -webkit-tap-highlight-color: transparent; }
    .g-reviews-scroll { }
    .g-section-dark .g-section-center .g-title { color: #fff; }
    .g-section-dark .g-section-center .g-eyebrow { color: #ff8055; }

    @media (min-width: 769px) and (max-width: 1024px) {
      .g-wrap { padding: 0 32px; }
      .g-section { padding: 48px 0; }
      .g-section-center { margin-bottom: 28px; }
      .g-title { font-size: 28px; }
      .g-how-grid { gap: 20px; }
      .g-how-card { padding: 24px 22px; }
      .g-benefits-grid { grid-template-columns: repeat(2, 1fr); gap: 16px 20px; }
      .g-benefit { padding: 4px 0; }
      .g-cat-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; }
      .g-reviews-grid { gap: 16px; }
      .g-review { padding: 22px 20px; }
      .g-cta {
        padding: 36px 40px;
        gap: 24px 32px;
        align-items: center;
        justify-content: flex-start;
      }
      .g-cta > div:first-child { flex: 1; min-width: 0; }
      .g-cta-btn { margin-left: auto; }
      .g-cta-title { font-size: 24px; }
      .g-cta-sub { font-size: 14px; line-height: 1.55; }
      .g-cta-btn { padding: 14px 28px; }
    }

    @media(max-width:768px) {
      .g-wrap { padding: 0 max(16px, env(safe-area-inset-left)) 0 max(16px, env(safe-area-inset-right)); }
      .g-section { padding: 40px 0; }
      .g-section-center { margin-bottom: 24px; }
      .g-title { font-size: 26px; }
      .g-sub { margin-bottom: 0; }
      .g-section-hdr { flex-direction: column; align-items: flex-start; margin-bottom: 16px; }
      .g-section-hdr-link { min-height: 44px; display: inline-flex; align-items: center; }
      .g-how-scroll, .g-reviews-scroll {
        overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
        margin: 0 calc(-1 * max(16px, env(safe-area-inset-left)));
        padding: 4px max(16px, env(safe-area-inset-right)) 12px max(16px, env(safe-area-inset-left));
        scrollbar-width: none;
      }
      .g-how-scroll::-webkit-scrollbar, .g-reviews-scroll::-webkit-scrollbar { display: none; }
      .g-how-grid, .g-reviews-grid {
        display: flex; gap: 12px; width: max-content; grid-template-columns: unset;
      }
      .g-how-card, .g-review {
        flex: 0 0 min(84vw, 300px); scroll-snap-align: start;
      }
      .g-benefits-grid { grid-template-columns: 1fr; gap: 10px; }
      .g-benefit { background: #fff; border: 1px solid #ebebeb; border-radius: 14px; padding: 14px 16px; }
      .g-cat-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .g-cta { flex-direction: column; align-items: stretch; text-align: center; padding: 32px 20px; gap: 16px; }
      .g-cta-title { font-size: 22px; }
      .g-cta-btn { width: 100%; white-space: normal; min-height: 48px; }
    }
    @media(max-width:480px) {
      .g-section { padding: 32px 0; }
      .g-title { font-size: 22px; letter-spacing: -.35px; }
      .g-cat-grid { gap: 8px; }
      .g-cat-grid > a { aspect-ratio: 1 !important; border-radius: 14px !important; }
      .g-cat-grid > a > div:last-child { padding: 8px 10px !important; }
      .g-cat-grid > a > div:last-child > div { font-size: 12px !important; }
      .g-how-card { padding: 20px 18px; }
      .g-cta { padding: 24px 16px !important; border-radius: 16px; }
    }
  `;

/** Лендинг для гостя на `/` (до объединения с витриной заказчика). */
export default function GuestLandingHome() {
  const navigate = useNavigate();

  return (
    <div className="hp">
      <style>{GUEST_LANDING_HP_CSS}</style>
      <style>{GUEST_SECTION_CSS}</style>

      <div className="hp-hero">
        <div className="hp-hero-noise" />
        <div className="hp-hero-glow" />
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            left: '-80px',
            width: 400,
            height: 400,
            borderRadius: '50%',
            border: '1px solid rgba(232,65,10,.1)',
            pointerEvents: 'none',
          }}
        />

        <div className="hp-guest-hero-inner">
          <div>
            <div className="hp-hero-eyebrow" style={{ marginBottom: 24 }}>
              <span className="hp-hero-dot" />
              Йошкар-Ола · Проверенные мастера рядом
            </div>
            <h1 className="hp-hero-h1" style={{ marginBottom: 20, lineHeight: 1.06 }}>
              Найдите мастера
              <br />
              в <em>Йошкар-Оле</em>
              <br />
              рядом с вами
            </h1>
            <p className="hp-guest-hero-lead">
              Опишите задачу — мастера откликнутся сами. Выбирайте по рейтингу, договаривайтесь внутри сервиса.
            </p>
            <div className="hp-guest-hero-actions">
              <Link to="/register" className="hp-hero-btn">
                🔍 Найти мастера
              </Link>
              <Link to="/register?role=WORKER" className="hp-hero-btn-ghost">
                Стать мастером →
              </Link>
            </div>
            <div className="hp-guest-hero-stats">
              {[
                ['24/7', 'Приём заявок'],
                ['9', 'Категорий'],
                ['5.0★', 'Рейтинг'],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="hp-guest-stat-num">{n}</div>
                  <div className="hp-guest-stat-lbl">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hp-guest-photo-grid">
            {ALL_CATS.slice(0, 9).map((cat) => (
              <Link
                key={cat.slug}
                to="/register"
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: '#fff',
                  position: 'relative',
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'flex-end',
                  transition: 'transform .2s,box-shadow .2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {CAT_PHOTOS[cat.slug] ? (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `url(${CAT_PHOTOS[cat.slug]})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg,#2a1a00,#e8410a)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                    }}
                  >
                    {cat.emoji || '🛠️'}
                  </div>
                )}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(0deg,rgba(0,0,0,.72) 0%,transparent 55%)',
                  }}
                />
                <div style={{ position: 'relative', padding: '8px 10px', fontSize: 11, fontWeight: 800, lineHeight: 1.2 }}>
                  {cat.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <section className="g-section g-section-white">
        <div className="g-wrap">
          <div className="g-section-center">
            <p className="g-eyebrow">Просто и понятно</p>
            <h2 className="g-title">Как это работает</h2>
            <p className="g-sub">Три шага от задачи до результата</p>
          </div>
          <div className="g-how-scroll">
          <div className="g-how-grid">
            {[
              { n: '1', title: 'Создайте задачу', desc: 'Опишите работу, укажите цену за работу и адрес. Это займёт пару минут.' },
              { n: '2', title: 'Получите отклики', desc: 'Мастера пишут в личные сообщения — уточняйте детали и договаривайтесь напрямую.' },
              { n: '3', title: 'Выполните и оплатите', desc: 'Оплата наличными или переводом напрямую мастеру после работы — без посредников.' },
            ].map((s) => (
              <div key={s.n} className="g-how-card">
                <div className="g-how-num">{s.n}</div>
                <h3 className="g-how-title">{s.title}</h3>
                <p className="g-how-desc">{s.desc}</p>
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

      <section className="g-section g-section-gray">
        <div className="g-wrap">
          <div className="g-section-hdr">
            <div>
              <p className="g-eyebrow">Услуги</p>
              <h2 className="g-title">Популярные категории</h2>
            </div>
            <Link to="/register" className="g-section-hdr-link">
              Все категории →
            </Link>
          </div>
          <div className="g-cat-grid">
            {ALL_CATS.map((cat) => (
              <Link
                key={cat.slug}
                to="/register"
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: '#fff',
                  position: 'relative',
                  aspectRatio: '4/3',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  transition: 'transform .18s, box-shadow .18s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {CAT_PHOTOS[cat.slug] ? (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `url(${CAT_PHOTOS[cat.slug]})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      transition: 'transform .3s',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg,#2a1a00,#e8410a)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 36,
                    }}
                  >
                    {cat.emoji || '🛠️'}
                  </div>
                )}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(0deg,rgba(0,0,0,.72) 0%,rgba(0,0,0,.1) 55%,transparent 100%)',
                  }}
                />
                <div style={{ position: 'relative', padding: '10px 12px' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{cat.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="g-section g-section-white">
        <div className="g-wrap">
          <div className="g-section-center">
            <p className="g-eyebrow">Почему мы</p>
            <h2 className="g-title">Преимущества сервиса</h2>
          </div>
          <div className="g-benefits-grid">
            {[
              { ico: '⚡', bg: '#fffbeb', title: 'Быстрый отклик', desc: 'Мастера видят вашу заявку с ценой за работу и пишут в личные сообщения' },
              { ico: '💬', bg: '#f0fdf4', title: 'Договорённости в чате', desc: 'Сроки и детали согласуете с мастером в переписке — без лишних звонков' },
              { ico: '⭐', bg: '#eff6ff', title: 'Проверенные мастера', desc: 'Рейтинг, отзывы и история работ — выбирайте лучшего с полной информацией' },
              { ico: '💳', bg: '#fdf4ff', title: 'Оплата напрямую', desc: 'Наличные или перевод на карту мастеру — платформа не удерживает деньги' },
              { ico: '📍', bg: '#fff3f0', title: 'Мастера рядом', desc: 'Только мастера из Йошкар-Олы — никаких долгих ожиданий' },
              { ico: '🎯', bg: '#fff9f0', title: 'Цена в заявке', desc: 'Вы сразу указываете сумму за работу — без скрытых доплат' },
            ].map((b) => (
              <div key={b.title} className="g-benefit">
                <div className="g-benefit-icon" style={{ background: b.bg }}>
                  {b.ico}
                </div>
                <div>
                  <p className="g-benefit-title">{b.title}</p>
                  <p className="g-benefit-desc">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="g-section g-section-dark">
        <div className="g-wrap">
          <div className="g-section-center">
            <p className="g-eyebrow" style={{ color: '#ff8055' }}>
              Отзывы
            </p>
            <h2 className="g-title" style={{ color: '#fff' }}>
              Что говорят клиенты
            </h2>
          </div>
          <div className="g-reviews-scroll">
          <div className="g-reviews-grid">
            {[
              { ava: 'АК', color: '#6366f1', name: 'Анна К.', svc: 'Сантехника', text: 'Нашла сантехника за 15 минут. Приехал вовремя, всё сделал аккуратно. Сервис огонь!' },
              { ava: 'МР', color: '#0ea5e9', name: 'Михаил Р.', svc: 'Электрика', text: 'Заказывал электрика для новой квартиры. Мастер профессиональный, цена честная.' },
              { ava: 'СТ', color: '#22c55e', name: 'Светлана Т.', svc: 'Репетиторство', text: 'Репетитор по математике для дочки — нашла через сервис. Уже видим результат!' },
            ].map((r) => (
              <div key={r.name} className="g-review">
                <div className="g-review-stars">★★★★★</div>
                <p className="g-review-text">«{r.text}»</p>
                <div className="g-review-footer">
                  <div className="g-review-ava" style={{ background: r.color }}>
                    {r.ava}
                  </div>
                  <div>
                    <p className="g-review-name">{r.name}</p>
                    <p className="g-review-svc">{r.svc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

      <section className="g-section g-section-gray">
        <div className="g-wrap">
          <div className="g-cta">
            <div>
              <h2 className="g-cta-title">Готовы разместить задачу?</h2>
              <p className="g-cta-sub">Зарегистрируйтесь бесплатно и получайте предложения от мастеров рядом с вами</p>
            </div>
            <button type="button" className="g-cta-btn" onClick={() => navigate('/register')}>
              Начать бесплатно →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
