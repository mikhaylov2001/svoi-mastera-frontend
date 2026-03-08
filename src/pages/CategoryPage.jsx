import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCategories, createJobRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import './CategoryPage.css';

const CAT_META = {
  'remont':      { emoji: '🏠', color: '#fff3e0' },
  'santehnika':  { emoji: '🔧', color: '#e3f2fd' },
  'elektrika':   { emoji: '⚡', color: '#fffde7' },
  'mebel':       { emoji: '🛋️', color: '#f3e5f5' },
  'tehnika':     { emoji: '📺', color: '#e8f5e9' },
  'uborka':      { emoji: '🧹', color: '#fce4ec' },
  'dveri':       { emoji: '🚪', color: '#e0f7fa' },
  'pokraska':    { emoji: '🎨', color: '#f1f8e9' },
  'parikhmaher': { emoji: '💇', color: '#fce4ec' },
  'manikur':     { emoji: '💅', color: '#fce4ec' },
  'kosmetolog':  { emoji: '✨', color: '#f3e5f5' },
  'massazh':     { emoji: '💆', color: '#e8f5e9' },
  'sadovnik':    { emoji: '🌱', color: '#e8f5e9' },
  'perevozka':   { emoji: '🚚', color: '#e3f2fd' },
  'repetitor':   { emoji: '📚', color: '#fff3e0' },
};
function getMeta(slug) { return CAT_META[slug] || { emoji:'🔨', color:'#f1f3f4' }; }

export default function CategoryPage() {
  const { slug } = useParams();
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [form, setForm] = useState({ title:'', description:'', address:'', budget:'' });
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories()
      .then(list => {
        const found = list.find(c => c.slug === slug);
        if (found) setCategory(found);
      })
      .catch(() => {});
  }, [slug]);

  const meta = getMeta(slug);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!userId) { navigate('/login'); return; }
    if (!form.title.trim()) { setError('Укажите название задачи'); return; }

    setStatus('sending'); setError('');
    try {
      await createJobRequest(userId, {
        categoryId: category?.id,
        title: form.title,
        description: form.description,
        address: form.address,
        budget: form.budget ? Number(form.budget) : null,
      });
      setStatus('success');
    } catch (err) {
      setError('Не удалось создать заявку. Попробуйте ещё раз.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="container">
        <div className="cat-success">
          <span className="cat-success-icon">🎉</span>
          <h2>Заявка отправлена!</h2>
          <p>Мастера увидят вашу задачу и начнут откликаться. Следите за статусом в разделе «Мои сделки».</p>
          <div style={{display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap'}}>
            <Link to="/deals" className="btn btn-primary">Перейти к сделкам</Link>
            <button className="btn btn-outline" onClick={() => { setStatus('idle'); setForm({title:'',description:'',address:'',budget:''}); }}>
              Создать ещё одну
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header-bar">
        <div className="container">
          <div className="cat-page-breadcrumb">
            <Link to="/categories" className="cat-page-back">← Все категории</Link>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:14, marginTop:10}}>
            <div className="cat-page-icon" style={{background:meta.color}}>{meta.emoji}</div>
            <div>
              <h1>{category?.name || slug}</h1>
              <p>Создайте задачу — мастера откликнутся сами</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="cat-page-layout">

          {/* Form */}
          <div className="cat-form-card">
            <h2 className="cat-form-title">Описание задачи</h2>

            {error && <div className="cat-form-error">⚠️ {error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label className="form-label">Название задачи *</label>
                <input
                  className="form-input"
                  name="title"
                  placeholder='Например: "Замена смесителя на кухне"'
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">Подробное описание</label>
                <textarea
                  className="form-input form-textarea"
                  name="description"
                  placeholder="Опишите детали: что именно нужно сделать, какие материалы есть, особые пожелания…"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              <div className="cat-form-row">
                <div className="form-field">
                  <label className="form-label">Адрес</label>
                  <input
                    className="form-input"
                    name="address"
                    placeholder="Улица, дом, квартира"
                    value={form.address}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Бюджет, ₽</label>
                  <input
                    className="form-input"
                    name="budget"
                    type="number"
                    placeholder="Не обязательно"
                    value={form.budget}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'Отправляем…' : '📤 Отправить заявку мастерам'}
              </button>

              {!userId && (
                <p className="cat-form-auth-note">
                  Для отправки нужно <Link to="/login" className="cat-form-link">войти в аккаунт</Link>
                </p>
              )}
            </form>
          </div>

          {/* Sidebar tips */}
          <div className="cat-sidebar">
            <div className="cat-tip-card">
              <div className="cat-tip-title">💡 Как получить хороший отклик</div>
              <ul className="cat-tip-list">
                <li>Укажите точный адрес</li>
                <li>Опишите объём работы</li>
                <li>Напишите, есть ли материалы</li>
                <li>Укажите желаемые сроки</li>
              </ul>
            </div>
            <div className="cat-tip-card">
              <div className="cat-tip-title">🔒 Безопасная сделка</div>
              <p className="cat-tip-text">Оплата поступает мастеру только после того, как вы подтвердили выполнение работы.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}