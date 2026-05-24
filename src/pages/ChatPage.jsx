import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getConversations, getConversation, sendMessage,
  updateMessage, deleteMessage, deleteConversation,
  getUserProfile,
} from '../api';
import { useAuth } from '../context/AuthContext';
import { useSameRouteRefetch } from '../hooks/useSameRouteRefetch';
import ConversationList from '../components/messages/ConversationList';
import ChatArea from '../components/messages/ChatArea';
import './ChatPage.css';

// ─── Local storage helpers ────────────────────────────────────
const STORAGE_KEY_REACTIONS = uid => `chat_reactions_${uid}`;

function loadReactions(userId, partnerId) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY_REACTIONS(userId)) || '{}');
    return all[String(partnerId)] || {};
  } catch { return {}; }
}

function saveReactions(userId, partnerId, map) {
  try {
    const key = STORAGE_KEY_REACTIONS(userId);
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    all[String(partnerId)] = map;
    localStorage.setItem(key, JSON.stringify(all));
  } catch { /* ignore */ }
}

// ─── Forward dialog ──────────────────────────────────────────
function ForwardDialog({ convos, currentPid, onForward, onClose, busy }) {
  return (
    <div className="fwd-backdrop" onClick={onClose} role="presentation">
      <div className="fwd-panel" onClick={e => e.stopPropagation()}>
        <div className="fwd-title">Переслать в чат</div>
        <div className="fwd-list">
          {convos.filter(c => String(c.partnerId) !== String(currentPid)).length === 0 ? (
            <p className="fwd-empty">Нет других диалогов.</p>
          ) : (
            convos
              .filter(c => String(c.partnerId) !== String(currentPid))
              .map(c => {
                const ini = (c.partnerName || '?').trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  return (
                  <button key={c.partnerId} className="fwd-row" disabled={busy} onClick={() => onForward(c.partnerId)}>
                    <div className="fwd-ava">{ini}</div>
                    <span>{c.partnerName || 'Чат'}</span>
      </button>
                );
              })
          )}
        </div>
        <button className="fwd-cancel" onClick={onClose}>Отмена</button>
      </div>
      </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function ChatPage() {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const { userId, isWorker } = useAuth();

  const pid = partnerId ? String(partnerId) : null;

  const [convos, setConvos] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [busy, setBusy] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState(null); // for new conversations

  const [myProfile, setMyProfile] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [reactionsMap, setReactionsMap] = useState({});
  const [forwardMsg, setForwardMsg] = useState(null);

  // Active conversation — found in list OR a placeholder for new chats
  const activeConversation = useMemo(() => {
    if (!pid) return null;
    const found = convos.find(c => String(c.partnerId) === pid);
    if (found) return found;
    // Placeholder: use partner profile info if loaded
    return {
      partnerId: pid,
      partnerName: partnerInfo?.displayName || partnerInfo?.name || partnerInfo?.fullName || partnerInfo?.firstName || 'Чат',
      partnerAvatarUrl: partnerInfo?.avatarUrl || partnerInfo?.avatar || null,
      lastMessage: '',
      lastMessageAt: null,
      unreadCount: 0,
    };
  }, [convos, pid, partnerInfo]);

  // Load conversations
  const loadConvos = useCallback(async () => {
    if (!userId) return;
    try {
      const list = await getConversations(userId);
      setConvos(list);
    } catch { /* ignore */ }
    setLoadingConvos(false);
  }, [userId]);

  // Load messages
  const loadMsgs = useCallback(async () => {
    if (!userId || !pid) return;
    try {
      const list = await getConversation(userId, pid);
      setMsgs(list);
    } catch { /* ignore */ }
  }, [userId, pid]);

  const refetchAll = useCallback(() => {
    loadConvos();
    loadMsgs();
  }, [loadConvos, loadMsgs]);

  useSameRouteRefetch('/chat', refetchAll);

  // Load own profile for avatar in messages
  useEffect(() => {
    if (!userId) return;
    getUserProfile(userId).then(p => setMyProfile(p)).catch(() => {});
  }, [userId]);

  // Initial load
  useEffect(() => { loadConvos(); }, [loadConvos]);

  // Load messages when pid changes
  useEffect(() => {
    if (!pid) { setMsgs([]); setPartnerInfo(null); return; }
    setLoadingMsgs(true);
    setReplyTo(null);
    loadMsgs().finally(() => setLoadingMsgs(false));
  }, [pid, loadMsgs]);

  // Load partner profile when pid set and not in conversations
  useEffect(() => {
    if (!pid || !userId) return;
    // If conversation already exists in list, no need to fetch profile separately
    const exists = convos.find(c => String(c.partnerId) === pid);
    if (exists) { setPartnerInfo(null); return; }
    getUserProfile(pid).then(info => setPartnerInfo(info)).catch(() => {});
  }, [pid, userId, convos]);

  // Load reactions when pid changes
  useEffect(() => {
    if (!userId || !pid) { setReactionsMap({}); return; }
    setReactionsMap(loadReactions(userId, pid));
  }, [userId, pid]);

  // Poll for updates
  useEffect(() => {
    if (!pid) return;
    const iv = setInterval(() => { loadMsgs(); loadConvos(); }, 5000);
    return () => clearInterval(iv);
  }, [pid, loadMsgs, loadConvos]);

  // ─── Handlers ────────────────────────────────────────────────

  const handleSelectConversation = useCallback(conv => {
    navigate(`/chat/${conv.partnerId}`);
  }, [navigate]);

  const handleBack = useCallback(() => {
    navigate('/chat');
  }, [navigate]);

  const handleNewChat = useCallback(() => {
    navigate(isWorker ? '/find-work' : '/find-master');
  }, [navigate, isWorker]);

  const handleSend = useCallback(async ({ text, attachmentUrl, attachmentType, replyTo: rt }) => {
    if (!userId || !pid) return;
    setBusy(true);
    try {
      const replyPrefix = rt ? `> ${rt.name}: ${rt.text}\n` : '';
      const finalText = replyPrefix + (text || '');
      await sendMessage(userId, pid, finalText, null, attachmentUrl || null, attachmentType || null);
      await loadMsgs();
      await loadConvos();
    } catch { /* ignore */ }
        setBusy(false);
  }, [userId, pid, loadMsgs, loadConvos]);

  const handleDeleteMessage = useCallback(async msgId => {
    if (!window.confirm('Удалить сообщение?')) return;
    setBusy(true);
    try {
      await deleteMessage(userId, msgId);
      await loadMsgs();
      await loadConvos();
    } catch { /* ignore */ }
    setBusy(false);
  }, [userId, loadMsgs, loadConvos]);

  const handleEditMessage = useCallback(async (msgId, text) => {
    setBusy(true);
    try {
      await updateMessage(userId, msgId, text);
      await loadMsgs();
    } catch { /* ignore */ }
    setBusy(false);
  }, [userId, loadMsgs]);

  const handleReactMessage = useCallback((msgId, emoji) => {
    const key = String(msgId);
    setReactionsMap(prev => {
      const cur = Array.isArray(prev[key]) ? [...prev[key]] : [];
      const i = cur.indexOf(emoji);
      if (i >= 0) cur.splice(i, 1);
      else { cur.push(emoji); if (cur.length > 6) cur.shift(); }
      const next = { ...prev };
      if (cur.length) next[key] = cur;
      else delete next[key];
      if (userId && pid) saveReactions(userId, pid, next);
      return next;
    });
  }, [userId, pid]);

  const handleForwardMessage = useCallback(msg => {
    setForwardMsg(msg);
  }, []);

  const doForward = useCallback(async targetPid => {
    if (!forwardMsg || !userId) return;
    setBusy(true);
    try {
      await sendMessage(userId, String(targetPid), forwardMsg.text || '', null, forwardMsg.attachmentUrl || null, forwardMsg.attachmentType || null);
      setForwardMsg(null);
      await loadConvos();
    } catch { /* ignore */ }
    setBusy(false);
  }, [forwardMsg, userId, loadConvos]);

  const handleDeleteConversation = useCallback(async () => {
    if (!window.confirm('Удалить весь чат?')) return;
    setBusy(true);
    try {
      await deleteConversation(userId, pid);
      setMsgs([]);
      await loadConvos();
      navigate('/chat');
    } catch { /* ignore */ }
    setBusy(false);
  }, [userId, pid, loadConvos, navigate]);

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="cr2">
      {/* Sidebar: conversation list */}
      <div className={`cr2-sidebar${pid ? ' cr2-sidebar--hidden' : ''}`}>
        <ConversationList
          conversations={convos}
          isLoading={loadingConvos}
          activeId={pid}
          onSelect={handleSelectConversation}
          onNewChat={handleNewChat}
            />
          </div>

      {/* Chat area */}
      <div className={`cr2-main${!pid ? ' cr2-main--empty' : ''}`}>
        <ChatArea
          conversation={activeConversation}
          messages={msgs}
          isLoading={loadingMsgs}
          userId={userId}
          isWorker={isWorker}
          myAvatarUrl={myProfile?.avatarUrl || myProfile?.avatar || null}
          myName={myProfile?.displayName || myProfile?.name || myProfile?.fullName || myProfile?.firstName || null}
          onSend={handleSend}
          onBack={handleBack}
          onDelete={handleDeleteConversation}
          onDeleteMessage={handleDeleteMessage}
          onEditMessage={handleEditMessage}
          onReactMessage={handleReactMessage}
          onForwardMessage={handleForwardMessage}
          reactionsMap={reactionsMap}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
        />
            </div>

      {/* Forward dialog */}
      {forwardMsg && (
        <ForwardDialog
          convos={convos}
          currentPid={pid}
          onForward={doForward}
          onClose={() => setForwardMsg(null)}
          busy={busy}
        />
      )}
    </div>
  );
}
