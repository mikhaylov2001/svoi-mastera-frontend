import React, { useEffect, useState } from 'react';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';

/* ── Personal settings form ── */
function PersonalForm({ userId, profile, onSaved }) {
  const [form, setForm] = useState({
    firstName: profile?.displayName || '',
    lastName: profile?.lastName || '',
    city: profile?.city || '',
    bio: profile?.bio || profile?.description || profile?.about || '',
    phone: profile?.phone || profile?.phoneNumber || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    setForm({
      firstName: profile?.displayName || '',
      lastName: profile?.lastName || '',
      city: profile?.city || '',
      bio: profile?.bio || profile?.description || profile?.about || '',
      phone: profile?.phone || profile?.phoneNumber || '',
    });
  }, [profile]);

  const field = (key) => ({
    value: form[key],
    onChange: e => setForm(f => ({ ...f, [key]: e.target.value })),
  });

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/users/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: form.firstName,
          lastName: form.lastName,
          city: form.city,
          bio: form.bio,
          phone: form.phone,
        }),
      });
      setSaved(true);
      onSaved?.({ ...form });
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mp-section-title compact" style={{ marginBottom: 0 }}>
        <span style={{ display: 'block', color: '#e8410a', fontSize: 11, fontWeight: 950, letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 4 }}>
          Личные данные
        </span>
        <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 950, letterSpacing: '-.04em' }}>
          Основная информация
        </h2>
      </div>
      <div className="mp-settings-form">
        <label>
          Имя
          <input type="text" {...field('firstName')} placeholder="Анатолий" />
        </label>
        <label>
          Фамилия
          <input type="text" {...field('lastName')} placeholder="Николаевич" />
        </label>
        <label>
          Город
          <input type="text" {...field('city')} placeholder="Йошкар-Ола" />
        </label>
        <label>
          Телефон
          <input type="tel" {...field('phone')} placeholder="+7 900 000 00 00" />
        </label>
        <label className="wide">
          О себе
          <textarea {...field('bio')} placeholder="Расскажите о себе..." />
        </label>
        <button
          type="button"
          className="mp-settings-save-btn"
          onClick={save}
          disabled={saving}
        >
          {saving ? 'Сохранение…' : 'Сохранить данные'}
        </button>
        {saved && <span className="mp-save-note">✓ Сохранено</span>}
      </div>
    </div>
  );
}

/* ── Notifications form ── */
const NOTIF_ITEMS = [
  { key: 'newReplies',  title: 'Новые отклики',       sub: 'Когда мастер откликнулся на задачу' },
  { key: 'chatMessages', title: 'Сообщения в чате',   sub: 'Входящие сообщения от пользователей' },
  { key: 'dealChanges', title: 'Изменения по сделкам', sub: 'Статус и обновления активных сделок' },
  { key: 'reviews',     title: 'Отзывы и рейтинг',    sub: 'Новые отзывы о вашем профиле' },
];

function NotificationsForm() {
  const [toggles, setToggles] = useState({ newReplies: true, chatMessages: true, dealChanges: true, reviews: false });
  const toggle = key => setToggles(t => ({ ...t, [key]: !t[key] }));
  return (
    <div>
      <div style={{ marginBottom: 0 }}>
        <span style={{ display: 'block', color: '#e8410a', fontSize: 11, fontWeight: 950, letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 4 }}>
          Уведомления
        </span>
        <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 950, letterSpacing: '-.04em' }}>
          Управление сообщениями
        </h2>
      </div>
      <div className="mp-toggle-list">
        {NOTIF_ITEMS.map(item => (
          <button
            key={item.key}
            type="button"
            className="mp-toggle-item"
            onClick={() => toggle(item.key)}
          >
            <div>
              <b>{item.title}</b>
              <small>{item.sub}</small>
            </div>
            <span className={`mp-toggle-pill ${toggles[item.key] ? 'on' : ''}`}>
              {toggles[item.key] ? 'Вкл' : 'Выкл'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Verification form ── */
function VerificationForm({ verified }) {
  return (
    <div>
      <span style={{ display: 'block', color: '#e8410a', fontSize: 11, fontWeight: 950, letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 4 }}>
        Верификация
      </span>
      <h2 style={{ margin: '0 0 16px', color: '#111827', fontSize: 22, fontWeight: 950, letterSpacing: '-.04em' }}>
        Документы и подтверждение
      </h2>
      <div className="mp-status-banner">
        <b>{verified ? '✅ Профиль проверен' : '🔍 Верификация не пройдена'}</b>
        <span>
          {verified
            ? 'Ваш профиль прошёл проверку. Отметка «Проверен» видна всем пользователям.'
            : 'Пройдите верификацию, чтобы повысить доверие к профилю.'}
        </span>
      </div>
      {!verified && (
        <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
          {['Подтверждение телефона', 'Проверка личности', 'Статус «Проверен» в профиле'].map(step => (
            <div key={step} style={{
              display: 'flex', alignItems: 'center', gap: 12, borderRadius: 16,
              padding: '14px 16px', background: '#f8f3ee',
            }}>
              <span style={{
                width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center',
                background: '#e8410a', color: '#fff', fontWeight: 950, fontSize: 13, flexShrink: 0,
              }}>✓</span>
              <span style={{ color: '#111827', fontSize: 14, fontWeight: 850 }}>{step}</span>
            </div>
          ))}
          <button
            type="button"
            className="mp-settings-save-btn"
            style={{ marginTop: 8 }}
          >
            Начать верификацию
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Guarantee form ── */
function GuaranteeForm() {
  return (
    <div>
      <span style={{ display: 'block', color: '#e8410a', fontSize: 11, fontWeight: 950, letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 4 }}>
        Гарантия
      </span>
      <h2 style={{ margin: '0 0 16px', color: '#111827', fontSize: 22, fontWeight: 950, letterSpacing: '-.04em' }}>
        Гарантия и ответственность
      </h2>
      <div className="mp-status-banner" style={{ background: 'linear-gradient(135deg, rgba(17,24,39,.07), rgba(255,255,255,.95))', borderColor: 'rgba(17,24,39,.08)' }}>
        <b>🔒 Доступно после верификации</b>
        <span>Пройдите проверку профиля, чтобы открыть условия гарантий и безопасных сделок.</span>
      </div>
    </div>
  );
}

/* ── Main export ── */
const FORM_MAP = {
  personal:      PersonalForm,
  notifications: NotificationsForm,
  verification:  VerificationForm,
  guarantee:     GuaranteeForm,
};

export default function ProfileSettingsDetail({
  activeKey,   // string
  onBack,      // () => void
  userId,      // string|number
  profile,     // raw profile object
  verified,    // bool
  onSaved,     // (updated) => void
}) {
  const Form = FORM_MAP[activeKey];
  if (!Form) return null;

  return (
    <div className="mp-settings-detail-wrap">
      <button type="button" className="mp-back-button" onClick={onBack}>
        ← Назад в профиль
      </button>
      <div className="mp-glass-card" style={{ padding: '28px 30px' }}>
        <Form
          userId={userId}
          profile={profile}
          verified={verified}
          onSaved={onSaved}
        />
      </div>
    </div>
  );
}
