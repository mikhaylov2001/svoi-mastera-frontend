import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Paperclip, Image as ImageIcon, FileText, Camera, MapPin, User, X } from 'lucide-react';
import './AttachButton.css';

/**
 * Кнопка «Прикрепить» с выпадающим меню (стиль Lovable).
 *
 * Props:
 *   onPick(type, files?) — 'photo' | 'doc' | 'camera' | 'geo' | 'contact'
 *   disabled
 *
 * Ref: { close() } — закрыть меню снаружи
 */
const AttachButton = forwardRef(function AttachButton({ onPick, disabled = false }, ref) {
  const [open, setOpen] = useState(false);
  const fileImg = useRef(null);
  const fileDoc = useRef(null);

  const close = () => setOpen(false);

  useImperativeHandle(ref, () => ({ close }), []);

  const items = [
    { id: 'photo', label: 'Фото или видео', icon: ImageIcon, color: '#7c3aed', action: () => fileImg.current?.click() },
    { id: 'doc', label: 'Файл', icon: FileText, color: '#0ea5e9', action: () => fileDoc.current?.click() },
    { id: 'camera', label: 'Камера', icon: Camera, color: '#ef4444', action: () => onPick?.('camera') },
    { id: 'geo', label: 'Местоположение', icon: MapPin, color: '#22c55e', action: () => onPick?.('geo') },
    { id: 'contact', label: 'Контакт', icon: User, color: '#f59e0b', action: () => onPick?.('contact') },
  ];

  const softBg = hex => {
    if (!hex || hex[0] !== '#') return 'rgba(15,23,42,0.06)';
    const h = hex.slice(1);
    if (h.length === 6) return `${hex}22`;
    return 'rgba(15,23,42,0.06)';
  };

  return (
    <div className={`atb-wrap ${open ? 'is-open' : ''}`}>
      {open && <div className="atb-backdrop" onClick={close} aria-hidden />}

      <div className="atb-menu" role="menu" aria-hidden={!open}>
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              type="button"
              role="menuitem"
              className="atb-item"
              style={{ '--d': `${i * 35}ms` }}
              onClick={() => {
                it.action();
                close();
              }}
            >
              <span
                className="atb-item-ic"
                style={{ color: it.color, background: softBg(it.color) }}
              >
                <Icon size={18} strokeWidth={2.2} />
              </span>
              <span className="atb-item-lb">{it.label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="atb-btn"
        aria-label="Прикрепить"
        aria-expanded={open}
        aria-haspopup="menu"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
      >
        <span className="atb-btn-ring" aria-hidden />
        <span className="atb-btn-ic">
          {open ? <X size={20} strokeWidth={2.4} /> : <Paperclip size={20} strokeWidth={2.2} />}
        </span>
        {!open && <span className="atb-tip">Прикрепить</span>}
      </button>

      <input
        ref={fileImg}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={e => {
          onPick?.('photo', e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={fileDoc}
        type="file"
        multiple
        hidden
        onChange={e => {
          onPick?.('doc', e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
});

AttachButton.displayName = 'AttachButton';

export default AttachButton;
