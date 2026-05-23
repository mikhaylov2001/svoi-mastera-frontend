import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MessageSquare, Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

function DateSeparator({ date }) {
  let label;
  try {
    const d = new Date(date);
    if (isToday(d)) label = 'Сегодня';
    else if (isYesterday(d)) label = 'Вчера';
    else label = format(d, 'd MMMM yyyy');
  } catch { label = ''; }
  return (
    <div className="ca-date">
      <span>{label}</span>
    </div>
  );
}

function ChatSearchBar({ query, setQuery, total, current, onPrev, onNext, onClose }) {
  return (
    <div className="ca-searchbar">
      <Search size={15} className="ca-sb-icon" />
      <input
        autoFocus
        placeholder="Поиск по сообщениям..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="ca-sb-input"
      />
      <span className="ca-sb-meta">
        {query.trim() ? `${total ? current + 1 : 0}/${total}` : ''}
      </span>
      <button className="ca-sb-btn" disabled={!total} onClick={onPrev} aria-label="Предыдущий">
        <ChevronUp size={15} />
      </button>
      <button className="ca-sb-btn" disabled={!total} onClick={onNext} aria-label="Следующий">
        <ChevronDown size={15} />
      </button>
      <button className="ca-sb-close" onClick={onClose} aria-label="Закрыть поиск">
        <X size={15} />
      </button>
    </div>
  );
}

export default function ChatArea({
  conversation,
  messages,
  isLoading,
  userId,
  myAvatarUrl,
  myName,
  onSend,
  onBack,
  onDelete,
  onDeleteMessage,
  onEditMessage,
  onReactMessage,
  onForwardMessage,
  reactionsMap,
  replyTo,
  setReplyTo,
}) {
  const bottomRef = useRef(null);
  const msgRefs = useRef({});
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIdx, setSearchIdx] = useState(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return messages
      .filter(m => String(m.text || '').toLowerCase().includes(q))
      .map(m => m.id);
  }, [searchQuery, messages]);

  useEffect(() => { setSearchIdx(0); }, [searchQuery]);

  useEffect(() => {
    if (searchMatches.length > 0) {
      const id = searchMatches[searchIdx % searchMatches.length];
      msgRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchIdx, searchMatches]);

  const handleToggleSearch = () => {
    setShowSearch(v => !v);
    setSearchQuery('');
  };

  // Last message timestamp from the PARTNER (not current user) — used as "last seen"
  const lastPartnerActivityAt = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (String(m.senderId) !== String(userId)) {
        return m.createdAt || null;
      }
    }
    return conversation?.lastMessageAt || null;
  }, [messages, userId, conversation]);

  if (!conversation) {
    return (
      <div className="ca-empty">
        <div className="ca-empty-icon"><MessageSquare size={36} /></div>
        <p className="ca-empty-title">Выберите чат</p>
        <p className="ca-empty-sub">Начните общение прямо сейчас</p>
      </div>
    );
  }

  return (
    <div className="ca-wrap">
      <ChatHeader
        conversation={conversation}
        onBack={onBack}
        onDelete={onDelete}
        onToggleSearch={handleToggleSearch}
        lastPartnerActivityAt={lastPartnerActivityAt}
      />

      {showSearch && (
        <ChatSearchBar
          query={searchQuery}
          setQuery={setSearchQuery}
          total={searchMatches.length}
          current={searchIdx}
          onPrev={() => setSearchIdx(i => (i - 1 + searchMatches.length) % Math.max(searchMatches.length, 1))}
          onNext={() => setSearchIdx(i => (i + 1) % Math.max(searchMatches.length, 1))}
          onClose={handleToggleSearch}
        />
      )}

      <div className="ca-messages">
        <div className="ca-messages-inner">
          {isLoading ? (
            <div className="ca-loading">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className={`ca-skel-row${i % 2 === 0 ? '' : ' ca-skel-row--me'}`}>
                  <div className={`ca-skel-bub${i % 2 === 0 ? '' : ' ca-skel-bub--me'}`} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="ca-no-msgs">
              <span>👋</span>
              <p>Нет сообщений. Начните разговор!</p>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isMe = String(m.senderId) === String(userId);
              const showDate = idx === 0 || !isSameDay(
                new Date(messages[idx - 1].createdAt || 0),
                new Date(m.createdAt || 0),
              );
              const curMatchId = searchMatches.length ? searchMatches[searchIdx % searchMatches.length] : null;
              const isSearchHit = searchQuery.trim() && curMatchId != null && String(curMatchId) === String(m.id);
              const rxList = reactionsMap?.[m.id] || reactionsMap?.[String(m.id)] || [];

              return (
                <div
                  key={m.id}
                  id={`chat-msg-${m.id}`}
                  ref={el => { msgRefs.current[m.id] = el; }}
                  className={isSearchHit ? 'ca-search-hit' : ''}
                >
                  {showDate && <DateSeparator date={m.createdAt} />}
                  <MessageBubble
                    message={m}
                    isMe={isMe}
                    partnerAvatarUrl={conversation?.partnerAvatarUrl}
                    partnerName={conversation?.partnerName}
                    myAvatarUrl={myAvatarUrl}
                    myName={myName}
                    onDelete={onDeleteMessage}
                    onEdit={onEditMessage}
                    onReact={onReactMessage}
                    onReply={setReplyTo}
                    onForward={onForwardMessage}
                    reactions={rxList}
                  />
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <MessageInput
        onSend={onSend}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        userId={userId}
        disabled={false}
      />
    </div>
  );
}
