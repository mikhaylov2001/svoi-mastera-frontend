import React from 'react';

const settings = [
  { key: 'personal',      title: 'Личные данные',              text: 'Имя, город и контакты' },
  { key: 'notifications', title: 'Уведомления',                text: 'Push и email' },
  { key: 'verification',  title: 'Верификация',                text: 'Документы и подтверждение' },
  { key: 'guarantee',     title: 'Гарантия и ответственность', text: 'Доступно после проверки', status: 'Позже' },
  { key: 'payments',      title: 'Платёжные данные',           text: 'Скоро появится',          status: 'Скоро', disabled: true },
];

export default function ProfileSettingsPanel({ onSelect }) {
  return (
    <aside className="mp-settings-panel mp-settings-panel-v2 mp-apple-settings">
      <h1 className="mp-apple-settings-title">Настройки</h1>

      <div className="mp-apple-settings-card">
        <div className="mp-section-title compact">
          <h2>Профиль</h2>
          <p>Управляйте данными, уведомлениями, проверкой и безопасностью аккаунта.</p>
        </div>

        <div className="mp-settings-list">
          {settings.map(item => (
            <button
              type="button"
              key={item.key}
              disabled={item.disabled}
              className={item.disabled ? 'is-disabled' : ''}
              onClick={() => !item.disabled && onSelect?.(item.key)}
            >
              <span>
                <b>{item.title}</b>
                <small>{item.text}</small>
                {item.status && <em>{item.status}</em>}
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
