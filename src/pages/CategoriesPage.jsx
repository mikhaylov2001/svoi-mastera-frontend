import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../api';
import './CategoriesPage.css';

const CAT_META = {
  'remont':      { emoji: '🏠', color: '#fff3e0', desc: 'Отделка, штукатурка, покраска, обои, полы' },
  'santehnika':  { emoji: '🔧', color: '#e3f2fd', desc: 'Трубы, ванна, унитаз, смесители' },
  'elektrika':   { emoji: '⚡', color: '#fffde7', desc: 'Проводка, розетки, щитки, освещение' },
  'mebel':       { emoji: '🛋️', color: '#f3e5f5', desc: 'Сборка, разборка, подъём мебели' },
  'tehnika':     { emoji: '📺', color: '#e8f5e9', desc: 'Кондиционеры, стиралки, холодильники, ТВ' },
  'uborka':      { emoji: '🧹', color: '#fce4ec', desc: 'Генеральная, после ремонта, окна' },
  'dveri':       { emoji: '🚪', color: '#e0f7fa', desc: 'Установка, замена, врезка замков' },
  'pokraska':    { emoji: '🎨', color: '#f1f8e9', desc: 'Покраска стен, потолков, фасадов' },
  'parikhmaher': { emoji: '💇', color: '#fce4ec', desc: 'Стрижки, укладки, окрашивание на дому' },
  'manikur':     { emoji: '💅', color: '#fce4ec', desc: 'Маникюр, педикюр, дизайн ногтей' },
  'kosmetolog':  { emoji: '✨', color: '#f3e5f5', desc: 'Чистка лица, массаж, уход на дому' },
  'massazh':     { emoji: '💆', color: '#e8f5e9', desc: 'Расслабляющий, лечебный, спортивный' },
  'sadovnik':    { emoji: '🌱', color: '#e8f5e9', desc: 'Стрижка газона, посадка, уход за садом' },
  'perevozka':   { emoji: '🚚', color: '#e3f2fd', desc: 'Перевозка мебели, вещей, грузчики' },
  'repetitor':   { emoji: '📚', color: '#fff3e0', desc: 'Школьные предметы, языки, подготовка к экзаменам' },
};

function getMeta(slug) {
  return CAT_META[slug] || { emoji: '🔨', color: '#f1f3f4', desc: 'Профессиональные услуги' };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    setStatus('loading');
    getCategories()
      .then(data => { setCategories(data); setStatus('success'); })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1>Категории услуг</h1>
          <p>Выберите раздел — мастера откликнутся на вашу задачу</p>
        </div>
      </div>

      <div className="container">
        {status === 'loading' && (
          <div className="cats-grid" style={{paddingTop:32}}>
            {Array.from({length:12}).map((_,i) => (
              <div key={i} className="cat-skeleton">
                <div className="skeleton" style={{width:52,height:52,borderRadius:12,flexShrink:0}} />
                <div style={{flex:1}}>
                  <div className="skeleton" style={{width:'60%',height:16,marginBottom:8}} />
                  <div className="skeleton" style={{width:'90%',height:13}} />
                </div>
              </div>
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="cats-error">
            <span>😕</span>
            <p>Не удалось загрузить категории</p>
            <button className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>Повторить</button>
          </div>
        )}

        {status === 'success' && (
          <div className="cats-grid">
            {categories.map((cat, i) => {
              const m = getMeta(cat.slug);
              return (
                <Link
                  key={cat.id}
                  to={`/categories/${cat.slug}`}
                  className="cat-card fade-up"
                  style={{animationDelay:`${i*0.04}s`}}
                >
                  <div className="cat-card-icon" style={{background:m.color}}>{m.emoji}</div>
                  <div className="cat-card-body">
                    <h2>{cat.name}</h2>
                    <p>{m.desc}</p>
                  </div>
                  <div className="cat-card-arrow">›</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}