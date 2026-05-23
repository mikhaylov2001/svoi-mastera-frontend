import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, MapPin, Mic, FileText, Music, Film } from 'lucide-react';
import { uploadFile } from '../../api';
import EmojiPicker from './EmojiPicker';
import ReplyPreview from './ReplyPreview';

function FilePreview({ file, onRemove }) {
  const isImage = file.type?.startsWith('image/');
  const isVideo = file.type?.startsWith('video/');
  const isAudio = file.type?.startsWith('audio/');

  return (
    <div className="mi-fp">
      {isImage && file.previewUrl ? (
        <div className="mi-fp-img-wrap">
          <img src={file.previewUrl} alt={file.name} className="mi-fp-img" />
        </div>
      ) : (
        <div className="mi-fp-file">
          {isVideo ? <Film size={14} /> : isAudio ? <Music size={14} /> : <FileText size={14} />}
          <span className="mi-fp-name">{file.name}</span>
        </div>
      )}
      <button className="mi-fp-remove" onClick={onRemove} aria-label="Убрать">
        <X size={11} />
      </button>
    </div>
  );
}

export default function MessageInput({ onSend, replyTo, onCancelReply, userId, disabled }) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [locating, setLocating] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const fileRef = useRef(null);
  const textRef = useRef(null);
  const mrRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // close emoji picker on outside click
  useEffect(() => {
    if (!showEmoji) return;
    const h = e => {
      if (!e.target.closest('[data-emoji-picker]')) setShowEmoji(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showEmoji]);

  const resize = () => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = '36px';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  };

  const handleSubmit = async e => {
    e?.preventDefault();
    const content = text.trim();
    if (!content && pendingFiles.length === 0) return;

    const replyMeta = replyTo ? { replyTo } : {};

    if (pendingFiles.length > 0) {
      for (const pf of pendingFiles) {
        if (pf.url) {
          onSend({ text: pf.type?.startsWith('image/') ? `📷 ${pf.name}` : `📎 ${pf.name}`, attachmentUrl: pf.url, attachmentType: pf.type?.startsWith('image/') ? 'image' : (pf.type?.startsWith('video/') ? 'video' : 'file'), ...replyMeta });
        }
      }
      setPendingFiles([]);
    }

    if (content) {
      onSend({ text: content, ...replyMeta });
      setText('');
      setTimeout(resize, 0);
    }
    onCancelReply?.();
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handleChange = e => {
    setText(e.target.value);
    resize();
  };

  const processFiles = async files => {
    const arr = Array.from(files);
    for (const file of arr) {
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
      const tempId = Math.random().toString(36).slice(2);
      setPendingFiles(prev => [...prev, { tempId, name: file.name, type: file.type, previewUrl, url: null, uploading: true }]);
      try {
        const res = await uploadFile(userId, file);
        const url = res?.url || res?.file_url || '';
        setPendingFiles(prev => prev.map(pf => pf.tempId === tempId ? { ...pf, url, uploading: false } : pf));
      } catch {
        setPendingFiles(prev => prev.filter(pf => pf.tempId !== tempId));
      }
    }
  };

  const handleFileChange = async e => {
    const files = e.target.files;
    if (files?.length) await processFiles(files);
    e.target.value = '';
  };

  const insertEmoji = emoji => {
    const el = textRef.current;
    if (el) {
      const s = el.selectionStart, en = el.selectionEnd;
      const next = text.slice(0, s) + emoji + text.slice(en);
      setText(next);
      setTimeout(() => {
        el.selectionStart = el.selectionEnd = s + emoji.length;
        el.focus(); resize();
      }, 0);
    } else {
      setText(p => p + emoji);
    }
    setShowEmoji(false);
  };

  const handleLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        onSend({ text: `📍 ${pos.coords.latitude},${pos.coords.longitude}`, attachmentType: 'location', attachmentUrl: `${pos.coords.latitude},${pos.coords.longitude}` });
        setLocating(false);
      },
      () => setLocating(false),
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        try {
          const res = await uploadFile(userId, file);
          const url = res?.url || res?.file_url || '';
          onSend({ text: `🎤 Голосовое (${recordSecs}с)`, attachmentUrl: url, attachmentType: 'voice' });
        } catch {
          // Fall back to base64
          const reader = new FileReader();
          reader.onload = () => onSend({ text: `🎤 Голосовое (${recordSecs}с)`, attachmentUrl: reader.result, attachmentType: 'voice' });
          reader.readAsDataURL(blob);
        }
      };
      mr.start();
      mrRef.current = mr;
      setRecording(true);
      setRecordSecs(0);
      timerRef.current = setInterval(() => setRecordSecs(s => s + 1), 1000);
    } catch { /* mic denied */ }
  };

  const stopRecording = () => {
    mrRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
    setRecordSecs(0);
  };

  const cancelRecording = () => {
    if (mrRef.current?.state !== 'inactive') {
      mrRef.current.ondataavailable = null;
      mrRef.current.onstop = null;
      mrRef.current.stop();
      mrRef.current.stream?.getTracks().forEach(t => t.stop());
    }
    clearInterval(timerRef.current);
    setRecording(false);
    setRecordSecs(0);
  };

  const canSend = (text.trim() || pendingFiles.length > 0) && !pendingFiles.some(f => f.uploading);
  const fmtSecs = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div
      className={`mi-wrap${dragOver ? ' mi-wrap--drag' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={async e => {
        e.preventDefault(); setDragOver(false);
        const files = e.dataTransfer.files;
        if (files?.length) await processFiles(files);
      }}
    >
      {/* Reply */}
      <ReplyPreview replyTo={replyTo} onCancel={onCancelReply} />

      {/* File previews */}
      {pendingFiles.length > 0 && (
        <div className="mi-files">
          {pendingFiles.map(pf => (
            <div key={pf.tempId} className="mi-fp-slot">
              {pf.uploading ? (
                <div className="mi-fp-loading"><div className="mi-fp-spin" /></div>
              ) : (
                <FilePreview file={pf} onRemove={() => setPendingFiles(prev => prev.filter(f => f.tempId !== pf.tempId))} />
              )}
            </div>
          ))}
        </div>
      )}

      {dragOver && (
        <div className="mi-drag-hint">Отпустите для прикрепления</div>
      )}

      <input ref={fileRef} type="file" className="mi-file-hidden"
        accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.txt,.zip,.rar"
        multiple onChange={handleFileChange} />

      <form onSubmit={handleSubmit} className="mi-form">
        {recording ? (
          /* Recording UI */
          <div className="mi-rec">
            <button type="button" onClick={cancelRecording} className="mi-rec-cancel" aria-label="Отмена">
              <X size={15} />
            </button>
            <div className="mi-rec-body">
              <div className="mi-rec-waves">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span key={i} className="mi-rec-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <span className="mi-rec-time">{fmtSecs(recordSecs)}</span>
            </div>
            <button type="button" onClick={stopRecording} className="mi-rec-send" aria-label="Отправить">
              <Send size={15} />
            </button>
          </div>
        ) : (
          <div className="mi-pill">
            {/* Attach */}
            <button type="button" className="mi-icon-btn" onClick={() => fileRef.current?.click()} disabled={disabled} aria-label="Прикрепить">
              <Paperclip size={19} />
            </button>

            {/* Textarea */}
            <textarea
              ref={textRef}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Напишите сообщение..."
              disabled={disabled}
              rows={1}
              className="mi-textarea"
              style={{ minHeight: 36, maxHeight: 140 }}
            />

            {/* Right actions */}
            <div className="mi-right">
              <button type="button" className="mi-icon-btn" onClick={handleLocation} disabled={locating || disabled} aria-label="Местоположение">
                {locating
                  ? <div className="mi-locating" />
                  : <MapPin size={18} />}
              </button>

              <div className="mi-emoji-wrap" data-emoji-picker>
                <button type="button" className={`mi-icon-btn mi-emoji-btn${showEmoji ? ' mi-emoji-btn--active' : ''}`}
                  onClick={() => setShowEmoji(v => !v)} aria-label="Эмодзи">
                  😊
                </button>
                {showEmoji && (
                  <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />
                )}
              </div>

              {canSend ? (
                <button type="submit" className="mi-send" disabled={pendingFiles.some(f => f.uploading)} aria-label="Отправить">
                  <Send size={16} />
                </button>
              ) : (
                <button type="button" onClick={startRecording} className="mi-icon-btn" aria-label="Голосовое сообщение">
                  <Mic size={19} />
                </button>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
