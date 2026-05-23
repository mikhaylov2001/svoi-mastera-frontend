import React, { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import ConversationItem from './ConversationItem';

export default function ConversationList({ conversations, isLoading, activeId, onSelect, onNewChat }) {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c => {
    const q = search.toLowerCase();
    return (
      String(c.partnerName || '').toLowerCase().includes(q) ||
      String(c.lastMessage || '').toLowerCase().includes(q)
    );
  });

  const totalUnread = conversations.reduce((s, c) => s + (Number(c.unreadCount) || 0), 0);

  return (
    <div className="cl-wrap">
      {/* Header */}
      <div className="cl-top">
        <div className="cl-top-row">
          <div className="cl-title-group">
            <h1 className="cl-title">Сообщения</h1>
            {totalUnread > 0 && <span className="cl-unread-badge">{totalUnread}</span>}
          </div>
          <button className="cl-new-btn" onClick={onNewChat} title="Новый чат" aria-label="Новый чат">
            <Plus size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="cl-search">
          <Search size={16} className="cl-search-icon" />
          <input
            placeholder="Поиск..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="cl-search-input"
          />
          {search && (
            <button className="cl-search-clear" onClick={() => setSearch('')} aria-label="Очистить">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="cl-list">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="cl-skeleton">
              <div className="cl-skel-ava" />
              <div className="cl-skel-body">
                <div className="cl-skel-line cl-skel-line--w2" />
                <div className="cl-skel-line cl-skel-line--w3" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="cl-empty">
            <Search size={40} className="cl-empty-icon" />
            <p className="cl-empty-title">Ничего не найдено</p>
            {search && <p className="cl-empty-sub">Попробуйте другой запрос</p>}
            {!search && conversations.length === 0 && (
              <p className="cl-empty-sub">Начните общение со страницы заявки или каталога</p>
            )}
          </div>
        ) : (
          filtered.map(c => (
            <ConversationItem
              key={c.partnerId}
              conversation={c}
              isActive={String(c.partnerId) === String(activeId)}
              onClick={() => onSelect(c)}
            />
          ))
        )}
      </div>
    </div>
  );
}
