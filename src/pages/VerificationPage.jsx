import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getVerificationMe, submitVerification, uploadFile } from '../api';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  .ver-page { font-family: Inter, system-ui, sans-serif; background: #f2f3f5; min-height: 100vh; padding: 24px 16px 64px; color: #111827; }
  .ver-inner { max-width: 720px; margin: 0 auto; }
  .ver-card {
    background: #fff; border-radius: 16px; border: 1px solid #e5e7eb;
    padding: 22px 22px 24px; margin-bottom: 14px;
    box-shadow: 0 4px 24px rgba(0,0,0,.04);
  }
  .ver-h1 { font-size: 22px; font-weight: 800; margin: 0 0 8px; letter-spacing: -.02em; }
  .ver-lead { font-size: 14px; color: #6b7280; line-height: 1.65; margin: 0 0 18px; }
  .ver-back { display: inline-flex; align-items: center; gap: 6px; color: #e8410a; font-weight: 600; font-size: 14px; text-decoration: none; margin-bottom: 16px; }
  .ver-back:hover { text-decoration: underline; }
  .ver-label { font-size: 12px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px; display: block; }
  .ver-input {
    width: 100%; padding: 11px 13px; border-radius: 10px; border: 1px solid #e5e7eb;
    font-size: 15px; font-family: inherit; margin-bottom: 14px;
  }
  .ver-input:focus { outline: none; border-color: #fdba74; box-shadow: 0 0 0 3px rgba(253,186,116,.25); }
  .ver-file-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
  .ver-file-name { font-size: 13px; color: #16a34a; font-weight: 600; }
  .ver-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 10px 16px; border-radius: 10px; border: none; font-weight: 700; font-size: 14px;
    font-family: inherit; cursor: pointer; transition: transform .12s, box-shadow .12s;
  }
  .ver-btn:disabled { opacity: .55; cursor: not-allowed; }
  .ver-btn-o { background: #fff; border: 1.5px solid #e5e7eb; color: #374151; }
  .ver-btn-o:hover:not(:disabled) { border-color: #fdba74; background: #fff7ed; }
  .ver-btn-p { background: linear-gradient(135deg,#e8410a,#ff7043); color: #fff; box-shadow: 0 4px 14px rgba(232,65,10,.28); }
  .ver-btn-p:hover:not(:disabled) { transform: translateY(-1px); }
  .ver-canvas-wrap {
    border: 2px dashed #d1d5db; border-radius: 12px; background: #fafafa;
    overflow: hidden; margin-bottom: 10px;
  }
  .ver-canvas-wrap canvas { display: block; width: 100%; max-width: 420px; height: 140px; cursor: crosshair; touch-action: none; background: #fff; }
  .ver-check {
    display: flex; gap: 10px; align-items: flex-start; font-size: 13px; color: #374151; line-height: 1.55;
    margin: 14px 0;
  }
  .ver-check input { margin-top: 3px; flex-shrink: 0; width: 18px; height: 18px; accent-color: #e8410a; }
  .ver-err { font-size: 13px; color: #dc2626; font-weight: 600; margin-top: 8px; }
  .ver-ok { font-size: 13px; color: #15803d; font-weight: 600; margin-top: 8px; }
  .ver-steps { font-size: 13px; color: #6b7280; padding-left: 18px; margin: 0 0 16px; line-height: 1.7; }
`;

function DocSlot({ label, hint, file, onPick, busy }) {
  const ref = useRef(null);
  return (
    <div style={{ marginBottom: 16 }}>
      <span className="ver-label">{label}</span>
      <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 8px' }}>{hint}</p>
      <div className="ver-file-row">
        <button type="button" className="ver-btn ver-btn-o" disabled={busy} onClick={() => ref.current?.click()}>
          {busy ? 'Загрузка…' : 'Выбрать файл'}
        </button>
        <input
          ref={ref}
          type="file"
          accept="image/*,.pdf,application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => onPick(e.target.files?.[0])}
        />
        {file?.url && <span className="ver-file-name">✓ Загружено</span>}
      </div>
    </div>
  );
}

export default function VerificationPage() {
  const { userId, userRole, userName, userLastName } = useAuth();
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [fullName, setFullName] = useState('');
  const [agree, setAgree] = useState(false);
  const [doc1, setDoc1] = useState(null);
  const [doc2, setDoc2] = useState(null);
  const [sigUrl, setSigUrl] = useState('');
  const [busyDoc, setBusyDoc] = useState(null);
  const [busySig, setBusySig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);

  const profileHref = userRole === 'WORKER' ? '/worker-profile' : '/profile';

  useEffect(() => {
    setFullName([userName, userLastName].filter(Boolean).join(' ').trim());
  }, [userName, userLastName]);

  useEffect(() => {
    if (!userId) return;
    getVerificationMe(userId)
      .then((m) => {
        setMe(m);
        if (m?.verified) navigate(profileHref, { replace: true });
      })
      .catch(() => {});
  }, [userId, navigate, profileHref]);

  const uploadDoc = async (file, slot) => {
    if (!file || !userId) return;
    setBusyDoc(slot);
    setErr('');
    try {
      const data = await uploadFile(userId, file);
      const url = data?.url;
      if (!url) throw new Error('Сервер не вернул адрес файла');
      if (slot === 1) setDoc1({ url, name: file.name });
      else setDoc2({ url, name: file.name });
    } catch (e) {
      setErr(e?.message || 'Не удалось загрузить файл');
    } finally {
      setBusyDoc(null);
    }
  };

  const pos = (e) => {
    const c = canvasRef.current;
    if (!c) return null;
    const r = c.getBoundingClientRect();
    const scaleX = c.width / r.width;
    const scaleY = c.height / r.height;
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: (cx - r.left) * scaleX, y: (cy - r.top) * scaleY };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    last.current = pos(e);
  };

  const moveDraw = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    const p = pos(e);
    if (!ctx || !p || !last.current) return;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const endDraw = () => {
    drawing.current = false;
    last.current = null;
  };

  const clearCanvas = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!ctx || !c) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    setSigUrl('');
  };

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  const saveSignature = async () => {
    const c = canvasRef.current;
    if (!c || !userId) return;
    setBusySig(true);
    setErr('');
    try {
      const blob = await new Promise((resolve) => c.toBlob(resolve, 'image/png'));
      if (!blob || blob.size < 80) {
        throw new Error('Нарисуйте подпись на поле выше');
      }
      const file = new File([blob], 'signature.png', { type: 'image/png' });
      const data = await uploadFile(userId, file);
      if (!data?.url) throw new Error('Не удалось сохранить подпись');
      setSigUrl(data.url);
      setOk('Подпись сохранена');
      window.setTimeout(() => setOk(''), 2500);
    } catch (e) {
      setErr(e?.message || 'Ошибка подписи');
    } finally {
      setBusySig(false);
    }
  };

  const handleSubmit = async () => {
    if (!userId) return;
    setErr('');
    setSubmitting(true);
    try {
      await submitVerification(userId, {
        documentUrls: [doc1?.url, doc2?.url].filter(Boolean),
        signature: {
          fullLegalName: fullName.trim(),
          agreementAccepted: agree,
          signatureImageUrl: sigUrl,
        },
      });
      setOk('Заявка отправлена успешно.');
      window.setTimeout(() => navigate(profileHref), 1200);
    } catch (e) {
      setErr(e?.message || 'Не удалось отправить');
    } finally {
      setSubmitting(false);
    }
  };

  const back = profileHref;

  if (!userId) {
    return (
      <div className="ver-page">
        <style>{css}</style>
        <div className="ver-inner ver-card">
          <p>Войдите в аккаунт, чтобы пройти верификацию.</p>
          <Link to="/login">Вход →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ver-page">
      <style>{css}</style>
      <div className="ver-inner">
        <Link to={back} className="ver-back">← Назад в профиль</Link>

        <div className="ver-card">
          <h1 className="ver-h1">Верификация личности</h1>
          <p className="ver-lead">
            Загрузите документы и оставьте электронную подпись — после проверки в профиле и в каталоге появится официальная отметка «Проверен».
            Доступно для мастеров и заказчиков только из личного кабинета.
          </p>
          <ol className="ver-steps">
            <li>Удостоверение личности (разворот с фото и регистрацией) — фото или PDF.</li>
            <li>Второй документ на выбор: СНИЛС, ИНН или селфи с паспортом.</li>
            <li>Подпись мышью или пальцем в поле ниже → «Сохранить подпись».</li>
            <li>Полное ФИО как в документе и согласие на обработку данных.</li>
          </ol>

          {me?.verificationStatus === 'PENDING' && (
            <p style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 12, fontSize: 14, color: '#92400e' }}>
              Заявка уже на проверке. Обычно это занимает до 1 рабочего дня.
            </p>
          )}
          {me?.verificationStatus === 'REJECTED' && me?.verificationRejectionReason && (
            <p style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 12, fontSize: 14, color: '#991b1b' }}>
              Ранее отклонено: {me.verificationRejectionReason}. Загрузите документы заново.
            </p>
          )}
        </div>

        <div className="ver-card">
          <span className="ver-label">Документы</span>
          <DocSlot
            label="1. Паспорт / удостоверение личности"
            hint="Читаемое фото или PDF. Допустимы JPG, PNG, PDF."
            file={doc1}
            busy={busyDoc === 1}
            onPick={(f) => f && uploadDoc(f, 1)}
          />
          <DocSlot
            label="2. Дополнительно"
            hint="СНИЛС, ИНН или фото с документом в руке."
            file={doc2}
            busy={busyDoc === 2}
            onPick={(f) => f && uploadDoc(f, 2)}
          />
        </div>

        <div className="ver-card">
          <span className="ver-label">Электронная подпись</span>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 10px', lineHeight: 1.55 }}>
            Нарисуйте подпись в рамке так же, как на бумаге. Изображение сохраняется как файл и привязывается к заявке вместе с меткой времени на сервере.
          </p>
          <div className="ver-canvas-wrap">
            <canvas
              ref={canvasRef}
              width={840}
              height={280}
              onMouseDown={startDraw}
              onMouseMove={moveDraw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={moveDraw}
              onTouchEnd={endDraw}
            />
          </div>
          <div className="ver-file-row">
            <button type="button" className="ver-btn ver-btn-o" onClick={clearCanvas}>Очистить</button>
            <button type="button" className="ver-btn ver-btn-p" disabled={busySig} onClick={saveSignature}>
              {busySig ? 'Сохраняем…' : 'Сохранить подпись'}
            </button>
            {sigUrl && <span className="ver-file-name">✓ Подпись загружена</span>}
          </div>
        </div>

        <div className="ver-card">
          <span className="ver-label">ФИО и согласие</span>
          <input
            className="ver-input"
            placeholder="Фамилия Имя Отчество"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <label className="ver-check">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>
              Подтверждаю достоверность загруженных документов и согласен(на) на их проверку оператором платформы
              «СвоиМастера» в целях повышения доверия между пользователями. Понимаю, что предоставление подложных
              документов может повлечь блокировку аккаунта.
            </span>
          </label>

          {err && <div className="ver-err">{err}</div>}
          {ok && <div className="ver-ok">{ok}</div>}

          <button
            type="button"
            className="ver-btn ver-btn-p"
            style={{ width: '100%', marginTop: 12, padding: '14px' }}
            disabled={submitting || me?.verificationStatus === 'PENDING' || me?.verified}
            onClick={handleSubmit}
          >
            {submitting ? 'Отправляем…' : 'Отправить на проверку'}
          </button>
        </div>
      </div>
    </div>
  );
}
