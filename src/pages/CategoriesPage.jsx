import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import './CategoriesPage.css';

const CATEGORIES_BY_SECTION = {
  remont: [
    { slug: 'remont-kvartir', name: 'Ремонт квартир', emoji: '🏠', color: '#fff3e0', desc: 'Отделка, штукатурка, покраска, обои, полы' },
    { slug: 'santehnika',     name: 'Сантехника',     emoji: '🔧', color: '#e3f2fd', desc: 'Трубы, ванна, унитаз, смесители, канализация' },
    { slug: 'elektrika',      name: 'Электрика',      emoji: '⚡', color: '#fffde7', desc: 'Проводка, розетки, щитки, освещение' },
  ],
  uborka: [
    { slug: 'uborka', name: 'Уборка', emoji: '🧹', color: '#fce4ec', desc: 'Генеральная, после ремонта, мытьё окон' },
  ],
  krasota: [
    { slug: 'parikhmaher',       name: 'Парикмахер',          emoji: '💇', color: '#fce4ec', desc: 'Стрижки, укладки, окрашивание на дому' },
    { slug: 'manikur',           name: 'Маникюр и педикюр',   emoji: '💅', color: '#fce4ec', desc: 'Маникюр, педикюр, наращивание, дизайн ногтей' },
    { slug: 'krasota-i-zdorovie', name: 'Красота и здоровье', emoji: '✨', color: '#f3e5f5', desc: 'Косметолог, массаж, уходовые процедуры' },
  ],
  obrazovanie: [
    { slug: 'repetitorstvo', name: 'Репетиторство', emoji: '📚', color: '#e3f2fd', desc: 'Школьные предметы, языки, подготовка к экзаменам' },
  ],
  tehpomosh: [
    { slug: 'kompyuternaya-pomosh', name: 'Компьютерная помощь', emoji: '💻', color: '#e8f5e9', desc: 'Ремонт ПК, настройка, установка ПО, удаление вирусов' },
  ],
};

const SECTION_NAMES = {
  remont: 'Ремонт',
  uborka: 'Уборка',
  krasota: 'Красота',
  obrazovanie: 'Образование',
  tehpomosh: 'Техпомощь',
};

export { CATEGORIES_BY_SECTION };

export default function CategoriesPage() {
  const { sectionSlug } = useParams();

  const categories = CATEGORIES_BY_SECTION[sectionSlug];
  const sectionName = SECTION_NAMES[sectionSlug];

  if (!categories) {
    return <Navigate to="/sections" replace />;
  }

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <Link to="/sections" className="cats-back-link">← Все разделы</Link>
          <h1>{sectionName}</h1>
          <p>Выберите категорию — мастера откликнутся на вашу задачу</p>
        </div>
      </div>

      <div className="container">
        <div className="cats-grid">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
               to={`/categories/${cat.slug}`}
              className="cat-card fade-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="cat-card-icon" style={{ background: cat.color }}>
                {cat.emoji}
              </div>
              <div className="cat-card-body">
                <h2>{cat.name}</h2>
                <p>{cat.desc}</p>
              </div>
              <div className="cat-card-arrow">›</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
