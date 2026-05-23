import React from 'react';
import { X } from 'lucide-react';

export default function ReplyPreview({ replyTo, onCancel }) {
  if (!replyTo) return null;
  return (
    <div className="rp-bar">
      <div className="rp-accent" />
      <div className="rp-body">
        <div className="rp-name">{replyTo.name || 'Собеседник'}</div>
        <div className="rp-text">{replyTo.text}</div>
      </div>
      <button className="rp-close" onClick={onCancel} aria-label="Убрать ответ">
        <X size={15} />
      </button>
    </div>
  );
}
