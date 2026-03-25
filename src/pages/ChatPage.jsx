import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  getConversations, getConversation, sendMessage,
  updateMessage, deleteMessage, deleteConversation,
} from '../api';
import { useAuth } from '../context/AuthContext';
import './ChatPage.css';

const CHAT_BACKGROUNDS = [
  { id: 'default', label: 'Дефолт',  style: { backgroundColor: '#dde8f0', backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23b0c4d4' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E\")" } },
  { id: 'warm',    label: 'Тёплый',  style: { background: 'linear-gradient(135deg,#fdf6f0,#fdebd0)' } },
  { id: 'mint',    label: 'Мята',    style: { background: 'linear-gradient(135deg,#e0f7fa,#e8f5e9)' } },
  { id: 'lavender',label: 'Лаванда', style: { background: 'linear-gradient(135deg,#f3e5f5,#e8eaf6)' } },
  { id: 'peach',   label: 'Персик',  style: { background: 'linear-gradient(135deg,#fff8e1,#fce4ec)' } },
  { id: 'dots',    label: 'Точки',   style: { backgroundColor:'#f0f2f5', backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='%23c5cae9'/%3E%3C/svg%3E\")", backgroundSize:'20px 20px' } },
  { id: 'dark',    label: 'Тёмный',  style: { background:'#1a1a2e' }, dark:true },
  { id: 'ocean',   label: 'Океан',   style: { background:'linear-gradient(135deg,#0f3460,#16213e)' }, dark:true },
  { id: 'forest',  label: 'Лес',     style: { background:'linear-gradient(135deg,#1b5e20,#2e7d32)' }, dark:true },
  { id: 'sunrise', label: 'Рассвет', style: { background:'linear-gradient(135deg,#ff6b35,#f7c59f 50%,#efefd0)' } },
  { id: 'night',   label: 'Ночь',    style: { background:'linear-gradient(135deg,#0d0d0d,#16213e)' }, dark:true },
  { id: 'white',   label: 'Белый',   style: { background:'#ffffff' } },
];

const EMOJI_LIST = [
  '😀','😂','🥰','😍','🤩','😎','🤔','😮','😢','😡',
  '👍','👎','❤️','🔥','✅','⭐','💯','🎉','🙏','💪',
  '😊','😄','🤗','😌','😴','🥳','😬','🤝','👋','🫡',
  '💬','📱','🔨','🏠','⚡','🔧','💻','🧹','✨','📚',
];

// Icons
const IconSmile = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>;
const IconMic   = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10a7 7 0 0 1-14 0M12 19v3M8 22h8"/></svg>;
const IconSend  = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>;
const IconBack  = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>;
const IconTrash = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>;
const IconPlay  = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>;
const IconPause = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;

// Avatar
function Avatar({ name, url, size=40 }) {
  if (url) return <img src={url} alt="" className="cht-ava" style={{width:size,height:size}} />;
  const ini = (name||'?').trim().split(' ').map(p=>p[0]).join('').toUpperCase().slice(0,2);
  const cols = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#0891b2','#db2777','#4f46e5'];
  const col = cols[(ini.charCodeAt(0)||0)%cols.length];
  return <div className="cht-ava" style={{width:size,height:size,background:col,fontSize:size*0.37}}>{ini}</div>;
}

// Ticks
function Ticks({ isRead }) {
  const c = isRead ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.5)';
  return <svg width="16" height="11" viewBox="0 0 16 11" fill="none" style={{flexShrink:0}}>
    <path d="M1 5.5L4.5 9L10 2" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 5.5L8.5 9L14 2" stroke={isRead?c:'rgba(255,255,255,.25)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

// Voice Player
function VoicePlayer({ url, duration, mine }) {
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total,   setTotal]   = useState(duration||0);
  const audioRef = useRef(null);

  useEffect(() => {
    const a = new Audio(url);
    audioRef.current = a;
    a.onloadedmetadata = () => setTotal(Math.round(a.duration)||duration||0);
    a.ontimeupdate = () => setCurrent(Math.round(a.currentTime));
    a.onended = () => { setPlaying(false); setCurrent(0); };
    return () => { a.pause(); a.src=''; };
  }, [url]);

  const toggle = () => {
    const a = audioRef.current; if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().catch(()=>{}); setPlaying(true); }
  };
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const pct = total>0 ? (current/total)*100 : 0;
  const BARS = 30;

  return (
    <div className={`cht-vp ${mine?'cht-vp-mine':'cht-vp-their'}`}>
      <button className="cht-vp-play" onClick={toggle}>
        {playing ? <IconPause/> : <IconPlay/>}
      </button>
      <div className="cht-vp-body">
        <div className="cht-vp-wave">
          {Array.from({length:BARS}).map((_,i) => {
            const h = 4 + Math.abs(Math.sin(i*0.9+1)*12);
            return <div key={i} className={`cht-vp-bar${(i/BARS)*100<pct?' filled':''}`} style={{height:h}} />;
          })}
        </div>
        <div className="cht-vp-time">{fmt(playing?current:total)}</div>
      </div>
    </div>
  );
}

// Location
function LocationBubble({ coords }) {
  const [lat,lon] = coords.split(',').map(s=>parseFloat(s.trim()));
  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=15`;
  const imgUrl = `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=14&size=390,160&l=map&pt=${lon},${lat},pm2rdl`;

  return (
    <a href={osmUrl} target="_blank" rel="noreferrer" className="cht-loc">
      <div className="cht-loc-map">
        <img src={imgUrl} alt="map" className="cht-loc-img"
          onError={e=>{e.target.style.display='none'; e.target.nextSibling.style.display='flex';}}/>
        <div className="cht-loc-fallback">
          <div className="cht-loc-pin-big">📍</div>
          <div>{lat.toFixed(5)}, {lon.toFixed(5)}</div>
        </div>
        <div className="cht-loc-overlay">
          <div className="cht-loc-pin-dot"/>
        </div>
      </div>
      <div className="cht-loc-footer">
        <span>📍 Местоположение</span>
        <span className="cht-loc-open">Открыть на карте →</span>
      </div>
    </a>
  );
}

// Parse message type
function parseMsg(text) {
  if (!text) return {type:'text'};
  const loc = text.match(/^📍 (-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
  if (loc) return {type:'location', coords:`${loc[1]},${loc[2]}`};
  if (text.startsWith('🎤')) return {type:'voice'};
  return {type:'text'};
}

const timeStr = d => {
  if (!d) return '';
  const dt=new Date(d),now=new Date();
  if (dt.toDateString()===now.toDateString()) return dt.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
  const y=new Date(now); y.setDate(y.getDate()-1);
  if (dt.toDateString()===y.toDateString()) return 'вчера';
  return dt.toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
};
const fmtTime = d => !d?'':new Date(d).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
const fmtDate = d => !d?'':new Date(d).toLocaleDateString('ru-RU',{day:'numeric',month:'long'});

// Voice recorder
function useVoiceRecorder(onDone) {
  const [recording,setRecording]=useState(false);
  const [seconds,setSeconds]=useState(0);
  const media=useRef(null), chunks=useRef([]), timer=useRef(null), secs=useRef(0);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      const mime = ['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(t=>MediaRecorder.isTypeSupported(t))||'audio/webm';
      const mr = new MediaRecorder(stream,{mimeType:mime});
      chunks.current=[];
      mr.ondataavailable=e=>{ if(e.data.size>0) chunks.current.push(e.data); };
      mr.onstop=()=>{
        const blob=new Blob(chunks.current,{type:mime});
        onDone({blob,url:URL.createObjectURL(blob),duration:secs.current});
        stream.getTracks().forEach(t=>t.stop());
      };
      mr.start(100);
      media.current=mr; secs.current=0;
      setRecording(true); setSeconds(0);
      timer.current=setInterval(()=>{ secs.current++; setSeconds(secs.current); },1000);
    } catch { alert('Нет доступа к микрофону'); }
  };
  const stop   = ()=>{ media.current?.stop(); clearInterval(timer.current); setRecording(false); };
  const cancel = ()=>{ if(media.current?.state!=='inactive') media.current?.stop(); clearInterval(timer.current); chunks.current=[]; secs.current=0; setRecording(false); setSeconds(0); };
  return {recording,seconds,start,stop,cancel};
}

// ── MAIN ─────────────────────────────────────────────────────
export default function ChatPage() {
  const {partnerId}=useParams();
  const {userId}=useAuth();
  const navigate=useNavigate();
  const location=useLocation();

  const partnerIdStr=useMemo(()=>partnerId==null?null:String(partnerId),[partnerId]);
  const jobRequestId=useMemo(()=>{ const v=new URLSearchParams(location.search||'').get('jobRequestId'); return v?String(v):null; },[location.search]);

  const [convos,setConvos]=useState([]);
  const [msgs,setMsgs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [text,setText]=useState('');
  const [sending,setSending]=useState(false);
  const [error,setError]=useState('');
  const [editingId,setEditingId]=useState(null);
  const [editingText,setEditingText]=useState('');
  const [menuId,setMenuId]=useState(null);
  const [showEmoji,setShowEmoji]=useState(false);
  const [showAttach,setShowAttach]=useState(false);
  const [showBgPicker,setShowBgPicker]=useState(false);
  const [bgId,setBgId]=useState(()=>localStorage.getItem('chatBg')||'default');
  const [voiceMap,setVoiceMap]=useState({}); // {msgId:{url,duration}}
  const [mediaPreview,setMediaPreview]=useState(null);

  const endRef=useRef(null),inputRef=useRef(null),fileRef=useRef(null),photoRef=useRef(null),cameraRef=useRef(null);
  const currentBg=CHAT_BACKGROUNDS.find(b=>b.id===bgId)||CHAT_BACKGROUNDS[0];

  const voice=useVoiceRecorder(({url,duration})=>{
    setMediaPreview({type:'voice',url,duration});
  });

  const loadConvos=useCallback(async()=>{ if(!userId) return; try{setConvos(await getConversations(userId));}catch{} },[userId]);
  const loadMsgs=useCallback(async()=>{ if(!userId||!partnerIdStr) return; try{setMsgs(await getConversation(userId,partnerIdStr));}catch{} },[userId,partnerIdStr]);

  useEffect(()=>{loadConvos();},[loadConvos]);
  useEffect(()=>{
    if(!partnerIdStr) return;
    setLoading(true); setMenuId(null); setEditingId(null); setShowEmoji(false); setShowAttach(false);
    loadMsgs().then(()=>setLoading(false));
    setTimeout(()=>inputRef.current?.focus(),150);
  },[partnerIdStr,loadMsgs]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[msgs]);
  useEffect(()=>{
    if(!partnerIdStr) return;
    const iv=setInterval(()=>{loadMsgs();loadConvos();},5000);
    return()=>clearInterval(iv);
  },[partnerIdStr,loadMsgs,loadConvos]);

  const send=async()=>{
    const t=text.trim();
    if((!t&&!mediaPreview)||!partnerIdStr||!userId) return;
    setSending(true); setError('');
    try {
      let finalText=t;
      let voiceData=null;
      if(mediaPreview){
        if(mediaPreview.type==='image') finalText=`📷 ${mediaPreview.name||'Фото'}${t?'\n'+t:''}`;
        else if(mediaPreview.type==='video') finalText=`🎥 ${mediaPreview.name||'Видео'}${t?'\n'+t:''}`;
        else if(mediaPreview.type==='file') finalText=`📎 ${mediaPreview.name||'Файл'}${t?'\n'+t:''}`;
        else if(mediaPreview.type==='voice'){ finalText=`🎤 Голосовое (${mediaPreview.duration}с)`; voiceData=mediaPreview; }
        else if(mediaPreview.type==='location') finalText=`📍 ${mediaPreview.name}`;
        setMediaPreview(null);
      }
      if(!finalText){setSending(false);return;}
      const sent=await sendMessage(userId,partnerIdStr,finalText,jobRequestId);
      if(voiceData&&sent?.id) setVoiceMap(p=>({...p,[sent.id]:{url:voiceData.url,duration:voiceData.duration}}));
      setText(''); setShowEmoji(false); setShowAttach(false);
      await loadMsgs(); await loadConvos();
    } catch(e){setError(e?.message||'Не удалось отправить.');}
    setSending(false);
  };

  const onKey=e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} };
  const startEdit=m=>{setEditingId(m.id);setEditingText(m.text||'');setMenuId(null);};
  const cancelEdit=()=>{setEditingId(null);setEditingText('');};
  const saveEdit=async()=>{
    if(!editingId||!editingText.trim()) return;
    setSending(true);
    try{await updateMessage(userId,editingId,editingText.trim());cancelEdit();await loadMsgs();}catch{}
    setSending(false);
  };
  const removeMsg=async mid=>{setMenuId(null);setSending(true);try{await deleteMessage(userId,mid);await loadMsgs();await loadConvos();}catch{}setSending(false);};
  const removeChat=async()=>{
    if(!window.confirm('Удалить весь чат?')) return;
    setSending(true);
    try{await deleteConversation(userId,partnerIdStr);setMsgs([]);await loadConvos();navigate('/chat');}catch{}
    setSending(false);
  };
  const handleFilePick=(e,type)=>{
    const file=e.target.files?.[0]; if(!file) return;
    setMediaPreview({type,url:URL.createObjectURL(file),name:file.name,file});
    setShowAttach(false); e.target.value='';
  };
  const shareLocation=()=>{
    setShowAttach(false);
    if(!navigator.geolocation){alert('Геолокация недоступна');return;}
    navigator.geolocation.getCurrentPosition(
      pos=>setMediaPreview({type:'location',name:`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`}),
      ()=>alert('Не удалось получить геолокацию')
    );
  };
  const changeBg=id=>{setBgId(id);localStorage.setItem('chatBg',id);setShowBgPicker(false);};
  const activePartner=convos.find(c=>String(c.partnerId)===partnerIdStr);
  const closeAll=()=>{setMenuId(null);setShowEmoji(false);setShowAttach(false);};

  return (
    <div className="cht-root" onClick={closeAll}>

      {/* SIDEBAR */}
      <div className={`cht-side ${partnerIdStr?'cht-side-hide':''}`}>
        <div className="cht-side-hd">
          <h2>Сообщения</h2>
          <div className="cht-side-hd-sub">{convos.length>0?`${convos.length} диалог${convos.length>1?'а':''}` :'Нет диалогов'}</div>
        </div>
        {convos.length===0?(
          <div className="cht-side-empty">
            <div className="cht-side-empty-icon">💬</div>
            <h3>Нет диалогов</h3>
            <p>Напишите мастеру со страницы заявки</p>
          </div>
        ):(
          <div className="cht-side-list">
            {convos.map(c=>(
              <div key={c.partnerId} className={`cht-conv ${String(c.partnerId)===partnerIdStr?'active':''}`}
                onClick={e=>{e.stopPropagation();navigate(`/chat/${c.partnerId}`);}}>
                <Avatar name={c.partnerName} url={c.partnerAvatarUrl} size={46}/>
                <div className="cht-conv-body">
                  <div className="cht-conv-top">
                    <span className="cht-conv-name">{c.partnerName}</span>
                    <span className="cht-conv-time">{timeStr(c.lastMessageAt)}</span>
                  </div>
                  <div className="cht-conv-bottom">
                    <span className="cht-conv-msg">{c.lastMessage||'Нет сообщений'}</span>
                    {c.unreadCount>0&&<span className="cht-conv-badge">{c.unreadCount}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MAIN */}
      <div className={`cht-main ${!partnerIdStr?'cht-main-placeholder':''}`}>
        {!partnerIdStr&&(
          <div className="cht-placeholder">
            <div className="cht-placeholder-icon">💬</div>
            <h3>Выберите диалог</h3>
            <p>или начните новый со страницы заявки</p>
          </div>
        )}

        {partnerIdStr&&(<>
          {/* HEADER */}
          <div className="cht-hd" onClick={e=>e.stopPropagation()}>
            <button className="cht-hd-back" onClick={()=>navigate('/chat')}><IconBack/></button>
            <Avatar name={activePartner?.partnerName} url={activePartner?.partnerAvatarUrl} size={38}/>
            <div className="cht-hd-info">
              <div className="cht-hd-name">{activePartner?.partnerName||'Чат'}</div>
              <div className="cht-hd-status">онлайн</div>
            </div>
            <div className="cht-hd-actions">
              <button className="cht-hd-icon-btn" onClick={e=>{e.stopPropagation();setShowBgPicker(v=>!v);}} title="Сменить фон">🎨</button>
              <button className="cht-hd-icon-btn cht-hd-icon-btn-danger" onClick={e=>{e.stopPropagation();removeChat();}} title="Удалить чат"><IconTrash/></button>
            </div>
          </div>

          {/* BG PICKER */}
          {showBgPicker&&(
            <div className="cht-bg-picker" onClick={e=>e.stopPropagation()}>
              <div className="cht-bg-picker-title">Выберите фон</div>
              <div className="cht-bg-grid">
                {CHAT_BACKGROUNDS.map(bg=>(
                  <button key={bg.id} className={`cht-bg-item ${bgId===bg.id?'active':''}`}
                    onClick={()=>changeBg(bg.id)} style={bg.style}>
                    {bgId===bg.id&&<span className="cht-bg-check">✓</span>}
                    <span className="cht-bg-label" style={{color:bg.dark?'#fff':'#374151'}}>{bg.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error&&<div className="cht-error">{error}</div>}

          {/* MESSAGES */}
          <div className="cht-msgs" style={currentBg.style}>
            {loading?(
              <div className="cht-msgs-loading">Загрузка...</div>
            ):msgs.length===0?(
              <div className="cht-msgs-empty">
                <div className="cht-msgs-empty-icon">👋</div>
                <p>Напишите первое сообщение</p>
              </div>
            ):msgs.map((m,i)=>{
              const mine=m.senderId===userId;
              const showDate=i===0||new Date(msgs[i-1].createdAt).toDateString()!==new Date(m.createdAt).toDateString();
              const isLast=i===msgs.length-1||msgs[i+1].senderId!==m.senderId;
              const parsed=parseMsg(m.text);
              const vd=voiceMap[m.id];

              return (
                <React.Fragment key={m.id}>
                  {showDate&&<div className="cht-date-sep"><span>{fmtDate(m.createdAt)}</span></div>}
                  <div className={`cht-msg ${mine?'cht-msg-my':'cht-msg-their'}`} style={{marginBottom:isLast?8:2}}>
                    {!mine&&<div style={{width:32,flexShrink:0}}>{isLast&&<Avatar name={m.senderName} url={m.senderAvatarUrl} size={28}/>}</div>}
                    <div className={`cht-bubble ${parsed.type==='location'?'cht-bubble-map':''}`}>
                      {!mine&&isLast&&<div className="cht-bubble-name">{m.senderName}</div>}
                      {mine&&editingId===m.id?(
                        <div className="cht-edit-wrap">
                          <textarea className="cht-edit-textarea" value={editingText} onChange={e=>setEditingText(e.target.value)} autoFocus/>
                          <div className="cht-edit-actions">
                            <button className="btn btn-outline btn-sm" onClick={cancelEdit}>Отмена</button>
                            <button className="btn btn-primary btn-sm" onClick={saveEdit}>Сохранить</button>
                          </div>
                        </div>
                      ):(
                        <>
                          {parsed.type==='location'?(
                            <LocationBubble coords={parsed.coords}/>
                          ):parsed.type==='voice'&&vd?(
                            <VoicePlayer url={vd.url} duration={vd.duration} mine={mine}/>
                          ):(
                            <div className="cht-bubble-text"
                              onClick={e=>{e.stopPropagation();mine&&setMenuId(menuId===m.id?null:m.id);}}>
                              {m.text}
                            </div>
                          )}
                          <div className="cht-bubble-meta">
                            <span className="cht-bubble-time">{fmtTime(m.createdAt)}</span>
                            {mine&&<Ticks isRead={m.isRead}/>}
                          </div>
                          {mine&&menuId===m.id&&editingId!==m.id&&(
                            <div className="cht-msg-menu" onClick={e=>e.stopPropagation()}>
                              <button className="cht-menu-btn" onClick={()=>startEdit(m)}>✏️ Изменить</button>
                              <button className="cht-menu-btn cht-menu-btn-del" onClick={()=>removeMsg(m.id)}>🗑 Удалить</button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={endRef}/>
          </div>

          {/* MEDIA PREVIEW */}
          {mediaPreview&&(
            <div className="cht-media-preview" onClick={e=>e.stopPropagation()}>
              <div className="cht-media-preview-inner">
                {mediaPreview.type==='image'&&<img src={mediaPreview.url} alt=""/>}
                {mediaPreview.type==='video'&&<video src={mediaPreview.url} controls/>}
                {mediaPreview.type==='voice'&&(
                  <div className="cht-preview-voice">
                    <span>🎤</span><span>Голосовое · {mediaPreview.duration}с</span>
                    <audio src={mediaPreview.url} controls style={{height:32}}/>
                  </div>
                )}
                {mediaPreview.type==='file'&&<div className="cht-file-preview">📎 {mediaPreview.name}</div>}
                {mediaPreview.type==='location'&&<div className="cht-file-preview">📍 {mediaPreview.name}</div>}
              </div>
              <button className="cht-media-preview-close" onClick={()=>setMediaPreview(null)}>✕</button>
            </div>
          )}

          {/* EMOJI */}
          {showEmoji&&(
            <div className="cht-emoji-panel" onClick={e=>e.stopPropagation()}>
              {EMOJI_LIST.map(emoji=>(
                <button key={emoji} className="cht-emoji-btn"
                  onClick={()=>{setText(t=>t+emoji);inputRef.current?.focus();}}>
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* ATTACH */}
          {showAttach&&(
            <div className="cht-attach-panel" onClick={e=>e.stopPropagation()}>
              <button className="cht-attach-btn" onClick={()=>photoRef.current?.click()}>
                <span className="cht-attach-icon" style={{background:'linear-gradient(135deg,#43a047,#66bb6a)'}}>
                  <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                </span>
                <span>Фото или видео</span>
              </button>
              <button className="cht-attach-btn" onClick={()=>fileRef.current?.click()}>
                <span className="cht-attach-icon" style={{background:'linear-gradient(135deg,#1e88e5,#42a5f5)'}}>
                  <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                </span>
                <span>Файл</span>
              </button>
              <button className="cht-attach-btn" onClick={()=>{cameraRef.current?.click();setShowAttach(false);}}>
                <span className="cht-attach-icon" style={{background:'linear-gradient(135deg,#e53935,#ef5350)'}}>
                  <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </span>
                <span>Камера</span>
              </button>
              <button className="cht-attach-btn" onClick={shareLocation}>
                <span className="cht-attach-icon" style={{background:'linear-gradient(135deg,#f4511e,#ff7043)'}}>
                  <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </span>
                <span>Местоположение</span>
              </button>
            </div>
          )}

          {/* INPUT BAR */}
          <div className="cht-input" onClick={e=>e.stopPropagation()}>
            <button className={`cht-input-icon-btn${showAttach?' active':''}`}
              onClick={()=>{setShowAttach(v=>!v);setShowEmoji(false);}} title="Прикрепить">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                style={{transform:showAttach?'rotate(45deg)':'none',transition:'transform .2s'}}>
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>

            {voice.recording?(
              <div className="cht-voice-rec">
                <button className="cht-vr-cancel" onClick={voice.cancel}>✕</button>
                <div className="cht-vr-dot"/>
                <div className="cht-vr-waves">
                  {Array.from({length:12}).map((_,i)=>(
                    <div key={i} className="cht-vr-bar" style={{animationDelay:`${i*0.08}s`}}/>
                  ))}
                </div>
                <span className="cht-vr-timer">{String(Math.floor(voice.seconds/60)).padStart(2,'0')}:{String(voice.seconds%60).padStart(2,'0')}</span>
                <button className="cht-vr-stop" onClick={voice.stop}>
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                </button>
              </div>
            ):(
              <>
                <textarea ref={inputRef} className="cht-input-field"
                  placeholder="Написать сообщение…" value={text}
                  onChange={e=>setText(e.target.value)} onKeyDown={onKey} rows={1}/>
                <button className={`cht-input-icon-btn${showEmoji?' active':''}`}
                  onClick={()=>{setShowEmoji(v=>!v);setShowAttach(false);}} title="Эмодзи">
                  <IconSmile/>
                </button>
                {text.trim()||mediaPreview?(
                  <button className="cht-input-send" disabled={sending} onClick={send}><IconSend/></button>
                ):(
                  <button className="cht-input-send cht-input-voice" onMouseDown={voice.start} title="Голосовое"><IconMic/></button>
                )}
              </>
            )}
          </div>

          <input ref={photoRef}  type="file" accept="image/*,video/*" style={{display:'none'}} onChange={e=>handleFilePick(e,e.target.files?.[0]?.type?.startsWith('video')?'video':'image')}/>
          <input ref={fileRef}   type="file" style={{display:'none'}} onChange={e=>handleFilePick(e,'file')}/>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e=>handleFilePick(e,'image')}/>
        </>)}
      </div>
    </div>
  );
}