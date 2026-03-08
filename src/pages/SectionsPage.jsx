import React from 'react';
import { Link } from 'react-router-dom';
import './SectionsPage.css';

const SECTIONS = [
  {
    slug: 'remont',
    name: 'Ремонт',
    emoji: '🏠',
    color: '#fff3e0',
    desc: 'Ремонт квартир, сантехника, электрика',
    count: 3,
  },
  {
    slug: 'uborka',
    name: 'Уборка',
    emoji: '🧹',
    color: '#fce4ec',
    desc: 'Генеральная уборка, после ремонта, мытьё окон',
    count: 1,
  },
  {
    slug: 'krasota',
    name: 'Красота',
    emoji: '💇',
    color: '#f3e5f5',
    desc: 'Парикмахер, маникюр, красота и здоровье',
    count: 3,
  },
  {
    slug: 'obrazovanie',
    name: 'Образование',
    emoji: '📚',
    color: '#e3f2fd',
    desc: 'Репетиторство, подготовка к экзаменам',
    count: 1,
  },
  {
    slug: 'tehpomosh',
    name: 'Техпомощь',
    emoji: '💻',
    color: '#e8f5e9',
    desc: 'Компьютерная помощь, настройка техники',
    count: 1,
  },
];

export { SECTIONS };

export default function SectionsPage() {
  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1>Услуги</h1>
          <p>Выберите раздел — найдите нужного мастера</p>
        </div>
      </div>

      <div className="container">
        <div className="sections-grid">
          {SECTIONS.map((sec, i) => (
            <Link
              key={sec.slug}
              to={`/sections/${sec.slug}`}
              className="section-card fade-up"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="section-card-icon" style={{ background: sec.color }}>
                {sec.emoji}
              </div>
              <div className="section-card-body">
                <h2>{sec.name}</h2>
                <p>{sec.desc}</p>
              </div>
              <div className="section-card-meta">
                <span className="section-card-count">{sec.count} категорий</span>
                <span className="section-card-arrow">›</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}