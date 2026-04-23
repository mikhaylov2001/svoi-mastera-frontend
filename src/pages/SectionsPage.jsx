import React from 'react';
import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    slug: 'remont',
    name: 'Ремонт',
    desc: 'Ремонт квартир, сантехника, электрика',
    count: 3,
    tags: ['Отделка', 'Сантехника', 'Электрика'],
    photo: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=80',
    accent: '#ff7043',
    featured: true,
  },
  {
    slug: 'uborka',
    name: 'Уборка',
    desc: 'Генеральная уборка, после ремонта, мытьё окон',
    count: 1,
    tags: ['Генеральная', 'После ремонта', 'Окна'],
    photo: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=900&q=80',
    accent: '#26c6da',
  },
  {
    slug: 'krasota',
    name: 'Красота',
    desc: 'Парикмахер, маникюр, красота и здоровье',
    count: 3,
    tags: ['Парикмахер', 'Маникюр', 'Косметолог'],
    photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=80',
    accent: '#f06292',
  },
  {
    slug: 'obrazovanie',
    name: 'Образование',
    desc: 'Репетиторство, подготовка к экзаменам',
    count: 1,
    tags: ['Репетитор', 'ОГЭ / ЕГЭ', 'Языки'],
    photo: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900&q=80',
    accent: '#42a5f5',
  },
  {
    slug: 'tehpomosh',
    name: 'Техпомощь',
    desc: 'Компьютерная помощь, настройка техники',
    count: 1,
    tags: ['Ремонт ПК', 'Настройка', 'Вирусы'],
    photo: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=900&q=80',
    accent: '#66bb6a',
  },
];

export { SECTIONS };

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  .sp-page { background: #f2f2f2; min-height: 100vh; font-family: Inter, Arial, sans-serif; }
  .sp-header { padding: 32px 0 20px; }
  .sp-header-inner { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
  .sp-header h1 { font-size: 28px; font-weight: 900; color: #111; margin: 0 0 4px; }
  .sp-header p  { font-size: 15px; color: #888; margin: 0; }

  .sp-grid {
    max-width: 1100px; margin: 0 auto; padding: 0 20px 60px;
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-auto-rows: 230px;
    gap: 14px;
  }

  /* featured: spans 7 cols × 2 rows */
  .sp-card-featured { grid-column: span 7; grid-row: span 2; }
  /* regular tall: 5 cols × 1 row */
  .sp-card-5 { grid-column: span 5; }
  /* wide: 5 cols × 1 row */
  .sp-card-wide { grid-column: span 6; }

  .sp-card {
    position: relative; overflow: hidden; border-radius: 18px;
    text-decoration: none; color: #fff; display: block;
    cursor: pointer;
  }

  .sp-card-photo {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; display: block;
    transition: transform .5s cubic-bezier(.25,.46,.45,.94);
  }
  .sp-card:hover .sp-card-photo { transform: scale(1.06); }

  .sp-card-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(175deg, rgba(0,0,0,.08) 0%, rgba(0,0,0,.72) 100%);
    transition: background .3s;
  }
  .sp-card:hover .sp-card-overlay {
    background: linear-gradient(175deg, rgba(0,0,0,.12) 0%, rgba(0,0,0,.80) 100%);
  }

  .sp-card-body {
    position: absolute; inset: 0; padding: 22px 24px;
    display: flex; flex-direction: column; justify-content: flex-end;
  }

  .sp-card-count {
    position: absolute; top: 18px; left: 18px;
    background: rgba(255,255,255,.18); backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,.25);
    border-radius: 20px; padding: 4px 12px;
    font-size: 12px; font-weight: 700; color: #fff; letter-spacing: .04em;
  }

  .sp-card-name {
    font-size: 26px; font-weight: 900; line-height: 1.1;
    margin-bottom: 6px; text-shadow: 0 2px 8px rgba(0,0,0,.3);
  }
  .sp-card-featured .sp-card-name { font-size: 36px; }

  .sp-card-desc {
    font-size: 13px; color: rgba(255,255,255,.82); line-height: 1.5;
    margin-bottom: 14px; max-width: 380px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .sp-card-featured .sp-card-desc { font-size: 15px; }

  .sp-card-tags {
    display: flex; flex-wrap: wrap; gap: 6px;
  }
  .sp-card-tag {
    background: rgba(255,255,255,.18); backdrop-filter: blur(6px);
    border: 1px solid rgba(255,255,255,.25);
    border-radius: 20px; padding: 4px 12px;
    font-size: 12px; font-weight: 600; color: #fff;
    transition: background .2s;
  }
  .sp-card:hover .sp-card-tag { background: rgba(255,255,255,.28); }

  .sp-card-arrow {
    position: absolute; top: 18px; right: 18px;
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(255,255,255,.18); backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; color: #fff;
    transition: background .2s, transform .2s;
  }
  .sp-card:hover .sp-card-arrow { background: rgba(255,255,255,.35); transform: translate(2px,-2px); }

  /* ACCENT LINE at bottom left */
  .sp-card-accent {
    position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
    opacity: 0; transition: opacity .3s;
  }
  .sp-card:hover .sp-card-accent { opacity: 1; }

  @media(max-width: 860px) {
    .sp-grid { grid-template-columns: 1fr 1fr; grid-auto-rows: 200px; }
    .sp-card-featured, .sp-card-5, .sp-card-wide { grid-column: span 2; }
    .sp-card-featured { grid-row: span 1; }
    .sp-card-featured .sp-card-name { font-size: 28px; }
  }
  @media(max-width: 520px) {
    .sp-grid { grid-template-columns: 1fr; grid-auto-rows: 180px; gap: 10px; }
    .sp-card-featured, .sp-card-5, .sp-card-wide { grid-column: span 1; }
    .sp-card-name { font-size: 22px !important; }
  }
`;

export default function SectionsPage() {
  // Layout: featured=Ремонт (7col×2row), then Уборка(5col), Красота(5col), Образование(6col), Техпомощь(6col)
  const layout = ['sp-card-featured', 'sp-card-5', 'sp-card-5', 'sp-card-wide', 'sp-card-wide'];

  return (
    <div className="sp-page">
      <style>{css}</style>
      <div className="sp-header">
        <div className="sp-header-inner">
          <h1>Услуги</h1>
          <p>Выберите раздел — найдите нужного мастера</p>
        </div>
      </div>

      <div className="sp-grid">
        {SECTIONS.map((sec, i) => (
          <Link
            key={sec.slug}
            to={`/sections/${sec.slug}`}
            className={`sp-card ${layout[i] || 'sp-card-wide'}${i === 0 ? ' sp-card-featured' : ''}`}
          >
            <img src={sec.photo} alt={sec.name} className="sp-card-photo" />
            <div className="sp-card-overlay" />

            <div className="sp-card-count">{sec.count} {sec.count === 1 ? 'категория' : 'категории'}</div>
            <div className="sp-card-arrow">›</div>

            <div className="sp-card-body">
              <div className="sp-card-name">{sec.name}</div>
              <div className="sp-card-desc">{sec.desc}</div>
              <div className="sp-card-tags">
                {sec.tags.map(tag => (
                  <span key={tag} className="sp-card-tag">{tag}</span>
                ))}
              </div>
            </div>

            <div className="sp-card-accent" style={{ background: sec.accent }} />
          </Link>
        ))}
      </div>
    </div>
  );
}
