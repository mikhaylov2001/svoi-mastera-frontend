import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';

const CATEGORIES_BY_SECTION = {
  remont: [
    {
      slug: 'remont-kvartir', name: 'Ремонт квартир', emoji: '🏠', color: '#fff3e0',
      desc: 'Отделка, штукатурка, покраска, обои, полы',
      photo: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80',
      priceFrom: 'от 1 500 ₽/час', masters: '12+ мастеров',
    },
    {
      slug: 'santehnika', name: 'Сантехника', emoji: '🔧', color: '#e3f2fd',
      desc: 'Трубы, ванна, унитаз, смесители, канализация',
      photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      priceFrom: 'от 800 ₽/час', masters: '8+ мастеров',
    },
    {
      slug: 'elektrika', name: 'Электрика', emoji: '⚡', color: '#fffde7',
      desc: 'Проводка, розетки, щитки, освещение',
      photo: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80',
      priceFrom: 'от 1 000 ₽/час', masters: '6+ мастеров',
    },
  ],
  uborka: [
    {
      slug: 'uborka', name: 'Уборка', emoji: '🧹', color: '#fce4ec',
      desc: 'Генеральная, после ремонта, мытьё окон',
      photo: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&q=80',
      priceFrom: 'от 2 000 ₽', masters: '5+ мастеров',
    },
  ],
  krasota: [
    {
      slug: 'parikhmaher', name: 'Парикмахер', emoji: '💇', color: '#fce4ec',
      desc: 'Стрижки, укладки, окрашивание на дому',
      photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80',
      priceFrom: 'от 500 ₽', masters: '10+ мастеров',
    },
    {
      slug: 'manikur', name: 'Маникюр и педикюр', emoji: '💅', color: '#fce4ec',
      desc: 'Маникюр, педикюр, наращивание, дизайн ногтей',
      photo: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
      priceFrom: 'от 700 ₽', masters: '15+ мастеров',
    },
    {
      slug: 'krasota-i-zdorovie', name: 'Красота и здоровье', emoji: '✨', color: '#f3e5f5',
      desc: 'Косметолог, массаж, уходовые процедуры',
      photo: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
      priceFrom: 'от 1 200 ₽', masters: '7+ мастеров',
    },
  ],
  obrazovanie: [
    {
      slug: 'repetitorstvo', name: 'Репетиторство', emoji: '📚', color: '#e3f2fd',
      desc: 'Школьные предметы, языки, подготовка к экзаменам',
      photo: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80',
      priceFrom: 'от 600 ₽/час', masters: '9+ репетиторов',
    },
  ],
  tehpomosh: [
    {
      slug: 'kompyuternaya-pomosh', name: 'Компьютерная помощь', emoji: '💻', color: '#e8f5e9',
      desc: 'Ремонт ПК, настройка, установка ПО, удаление вирусов',
      photo: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&q=80',
      priceFrom: 'от 500 ₽', masters: '4+ специалиста',
    },
  ],
};

const SECTION_META = {
  remont:      { name: 'Ремонт',      photo: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&q=80' },
  uborka:      { name: 'Уборка',      photo: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=1400&q=80' },
  krasota:     { name: 'Красота',     photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1400&q=80' },
  obrazovanie: { name: 'Образование', photo: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1400&q=80' },
  tehpomosh:   { name: 'Техпомощь',   photo: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1400&q=80' },
};

export { CATEGORIES_BY_SECTION };

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  .cp2-page { background: #f2f2f2; min-height: 100vh; font-family: Inter, Arial, sans-serif; }

  /* Hero */
  .cp2-hero {
    position: relative; height: 200px; overflow: hidden;
    display: flex; align-items: flex-end;
  }
  .cp2-hero-img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; display: block;
    filter: brightness(.6) saturate(1.1);
  }
  .cp2-hero-body {
    position: relative; z-index: 1;
    max-width: 1100px; margin: 0 auto; padding: 0 20px 28px; width: 100%;
  }
  .cp2-hero-back {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 13px; color: rgba(255,255,255,.75); background: none; border: none;
    cursor: pointer; font-family: inherit; padding: 0; margin-bottom: 12px;
    text-decoration: none; transition: color .15s;
  }
  .cp2-hero-back:hover { color: #fff; }
  .cp2-hero-title { font-size: 36px; font-weight: 900; color: #fff; margin: 0 0 4px; line-height: 1.1; }
  .cp2-hero-sub { font-size: 15px; color: rgba(255,255,255,.75); margin: 0; }

  /* Grid */
  .cp2-grid-wrap { max-width: 1100px; margin: 0 auto; padding: 24px 20px 60px; }
  .cp2-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }

  /* Card */
  .cp2-card {
    background: #fff; border-radius: 16px; overflow: hidden;
    text-decoration: none; color: inherit; display: flex; flex-direction: column;
    border: 1.5px solid #e8e8e8;
    transition: box-shadow .22s, transform .22s, border-color .22s;
  }
  .cp2-card:hover {
    box-shadow: 0 8px 32px rgba(0,0,0,.12);
    transform: translateY(-4px);
    border-color: #e8410a;
  }

  .cp2-card-img {
    position: relative; height: 150px; overflow: hidden; background: #f0f0f0; flex-shrink: 0;
  }
  .cp2-card-img img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    transition: transform .5s cubic-bezier(.25,.46,.45,.94);
  }
  .cp2-card:hover .cp2-card-img img { transform: scale(1.08); }

  .cp2-card-badge {
    position: absolute; top: 10px; right: 10px;
    background: rgba(0,0,0,.52); backdrop-filter: blur(6px);
    color: #fff; font-size: 11px; font-weight: 700;
    padding: 3px 9px; border-radius: 20px;
  }

  .cp2-card-emoji-wrap {
    position: absolute; bottom: -20px; left: 16px;
    width: 44px; height: 44px; border-radius: 12px;
    background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,.12);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
  }

  .cp2-card-body { padding: 28px 16px 16px; flex: 1; display: flex; flex-direction: column; }
  .cp2-card-name { font-size: 16px; font-weight: 800; color: #111; margin-bottom: 5px; line-height: 1.25; }
  .cp2-card-desc { font-size: 13px; color: #777; line-height: 1.55; flex: 1; margin-bottom: 14px; }

  .cp2-card-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 12px; border-top: 1px solid #f0f0f0;
  }
  .cp2-card-price { font-size: 13px; font-weight: 700; color: #e8410a; }
  .cp2-card-masters { font-size: 12px; color: #aaa; }
  .cp2-card-go {
    width: 30px; height: 30px; border-radius: 50%; background: #f5f5f5;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; color: #999; flex-shrink: 0;
    transition: background .2s, color .2s;
  }
  .cp2-card:hover .cp2-card-go { background: #e8410a; color: #fff; }

  @media(max-width: 860px) { .cp2-grid { grid-template-columns: repeat(2, 1fr); } }
  @media(max-width: 520px) {
    .cp2-grid { grid-template-columns: 1fr; gap: 10px; }
    .cp2-hero { height: 160px; }
    .cp2-hero-title { font-size: 28px; }
  }
`;

export default function CategoriesPage() {
  const { sectionSlug } = useParams();
  const categories = CATEGORIES_BY_SECTION[sectionSlug];
  const meta = SECTION_META[sectionSlug];

  if (!categories) return <Navigate to="/sections" replace />;

  return (
    <div className="cp2-page">
      <style>{css}</style>

      {/* Hero */}
      <div className="cp2-hero">
        <img src={meta.photo} alt={meta.name} className="cp2-hero-img" />
        <div className="cp2-hero-body">
          <Link to="/sections" className="cp2-hero-back">← Все разделы</Link>
          <h1 className="cp2-hero-title">{meta.name}</h1>
          <p className="cp2-hero-sub">Выберите категорию — мастера откликнутся на вашу задачу</p>
        </div>
      </div>

      {/* Cards grid */}
      <div className="cp2-grid-wrap">
        <div className="cp2-grid">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              to={`/categories/${cat.slug}`}
              className="cp2-card fade-up"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="cp2-card-img">
                <img src={cat.photo} alt={cat.name} />
                <div className="cp2-card-badge">{cat.masters}</div>
                <div className="cp2-card-emoji-wrap">{cat.emoji}</div>
              </div>

              <div className="cp2-card-body">
                <div className="cp2-card-name">{cat.name}</div>
                <div className="cp2-card-desc">{cat.desc}</div>
                <div className="cp2-card-footer">
                  <div>
                    <div className="cp2-card-price">{cat.priceFrom}</div>
                    <div className="cp2-card-masters">{cat.masters}</div>
                  </div>
                  <div className="cp2-card-go">›</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
