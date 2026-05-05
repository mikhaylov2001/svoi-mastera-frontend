import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getVerificationMe, submitVerification } from '../api';
import { VERIFICATION_QUIZ_QUESTIONS } from '../data/verificationQuiz';

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
  .ver-lead { font-size: 14px; color: #6b7280; line-height: 1.65; margin: 0; }
  .ver-back { display: inline-flex; align-items: center; gap: 6px; color: #e8410a; font-weight: 600; font-size: 14px; text-decoration: none; margin-bottom: 16px; }
  .ver-back:hover { text-decoration: underline; }
  .ver-label { font-size: 12px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 12px; display: block; }
  .ver-sub { font-size: 12px; color: #9ca3af; margin: -6px 0 14px; line-height: 1.45; }
  .ver-input {
    width: 100%; padding: 11px 13px; border-radius: 10px; border: 1px solid #e5e7eb;
    font-size: 15px; font-family: inherit; margin-bottom: 14px;
    box-sizing: border-box;
  }
  .ver-input:focus { outline: none; border-color: #fdba74; box-shadow: 0 0 0 3px rgba(253,186,116,.25); }
  .ver-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 10px 16px; border-radius: 10px; border: none; font-weight: 700; font-size: 14px;
    font-family: inherit; cursor: pointer; transition: transform .12s, box-shadow .12s;
  }
  .ver-btn:disabled { opacity: .55; cursor: not-allowed; }
  .ver-btn-p { background: linear-gradient(135deg,#e8410a,#ff7043); color: #fff; box-shadow: 0 4px 14px rgba(232,65,10,.28); }
  .ver-btn-p:hover:not(:disabled) { transform: translateY(-1px); }
  .ver-check {
    display: flex; gap: 12px; align-items: flex-start; font-size: 13px; color: #374151; line-height: 1.55;
    margin: 14px 0; cursor: pointer;
  }
  .ver-check-ui {
    position: relative; flex-shrink: 0; width: 24px; height: 24px; margin-top: 2px;
  }
  .ver-check-input {
    position: absolute !important; inset: 0 !important; width: 24px !important; height: 24px !important;
    margin: 0 !important; opacity: 0 !important; cursor: pointer; z-index: 2;
    -webkit-appearance: none !important; appearance: none !important;
  }
  .ver-check-input:disabled { cursor: not-allowed; }
  .ver-check-fake {
    position: absolute; inset: 0; z-index: 1; pointer-events: none;
    border: 2px solid #cbd5e1; border-radius: 6px; background: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 800; color: #fff; line-height: 1;
    transition: border-color .15s, background .15s, box-shadow .15s;
  }
  .ver-check-fake-on {
    background: linear-gradient(135deg,#e8410a,#ff7043);
    border-color: #e8410a;
    box-shadow: 0 1px 4px rgba(232,65,10,.35);
  }
  .ver-check-copy { flex: 1; min-width: 0; }
  .ver-err { font-size: 13px; color: #dc2626; font-weight: 600; margin-top: 8px; }
  .ver-ok { font-size: 13px; color: #15803d; font-weight: 600; margin-top: 8px; }
  .ver-q { margin-bottom: 22px; padding-bottom: 20px; border-bottom: 1px solid #f3f4f6; }
  .ver-q:last-of-type { border-bottom: none; margin-bottom: 8px; padding-bottom: 0; }
  .ver-q-num { font-size: 11px; font-weight: 700; color: #e8410a; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; }
  .ver-q-text { font-size: 15px; font-weight: 600; color: #111827; line-height: 1.45; margin: 0 0 12px; }
  .ver-opts { display: flex; flex-direction: column; gap: 8px; }
  .ver-opt {
    display: block; width: 100%; text-align: left; padding: 12px 14px; border-radius: 12px;
    border: 2px solid #e5e7eb; background: #fafafa; font-size: 14px; line-height: 1.45;
    color: #374151; cursor: pointer; font-family: inherit; transition: border-color .15s, background .15s;
  }
  .ver-opt:hover { border-color: #fdba74; background: #fffbeb; }
  .ver-opt.ver-opt-on { border-color: #e8410a; background: #fff7ed; box-shadow: 0 0 0 1px rgba(232,65,10,.15); }
  @media (max-width: 768px) {
    .ver-page { padding: 14px max(12px, env(safe-area-inset-left)) 56px max(12px, env(safe-area-inset-right)); }
    .ver-card { padding: 18px 16px 20px; border-radius: 14px; }
    .ver-h1 { font-size: 20px; }
    .ver-input { font-size: 16px; padding: 12px 14px; }
    .ver-btn { min-height: 48px; padding: 12px 18px; font-size: 15px; }
    .ver-opt { padding: 14px 16px; min-height: 48px; font-size: 15px; }
  }
`;

function isReasonableBirthDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (d >= today) return false;
  const min = new Date();
  min.setFullYear(min.getFullYear() - 120);
  if (d < min) return false;
  const maxYoung = new Date();
  maxYoung.setFullYear(maxYoung.getFullYear() - 14);
  if (d > maxYoung) return false;
  return true;
}

export default function VerificationPage() {
  const { userId, userRole, userName, userLastName } = useAuth();
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [residence, setResidence] = useState('');
  const [agreeRules, setAgreeRules] = useState(false);
  /** индекс выбранного варианта на каждый вопрос или null */
  const [picked, setPicked] = useState(() => VERIFICATION_QUIZ_QUESTIONS.map(() => null));
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const profileHref = userRole === 'WORKER' ? '/worker-profile' : '/profile';

  const quizComplete = useMemo(
    () => picked.every((v) => v !== null && v !== undefined),
    [picked],
  );

  const personalOk =
    fullName.trim().length >= 3 &&
    birthDate.trim().length > 0 &&
    isReasonableBirthDate(birthDate.trim()) &&
    residence.trim().length >= 3;

  const formValid =
    quizComplete &&
    personalOk &&
    agreeRules;

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

  const setAnswer = (questionIndex, optionIndex) => {
    setPicked((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
    setErr('');
  };

  const handleSubmit = async () => {
    if (!userId) return;
    setErr('');
    if (!formValid) {
      setErr(
        'Заполните все обязательные поля: ФИО, дату рождения, место проживания, ответьте на каждый вопрос теста верно и отметьте согласие с правилами.',
      );
      return;
    }
    setSubmitting(true);
    try {
      await submitVerification(userId, {
        quizAnswers: picked,
        signature: {
          fullLegalName: fullName.trim(),
          birthDate: birthDate.trim(),
          residence: residence.trim(),
          agreementAccepted: agreeRules,
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
  const blocked = submitting || me?.verificationStatus === 'PENDING' || me?.verified;

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
          <h1 className="ver-h1">Верификация на платформе</h1>
          <p className="ver-lead">
            Укажите данные о себе, ответьте на все вопросы теста и подтвердите согласие с правилами — после проверки может появиться отметка «Проверен».
          </p>

          {me?.verificationStatus === 'PENDING' && (
            <p style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 12, fontSize: 14, color: '#92400e', marginTop: 16 }}>
              Заявка уже на проверке. Обычно это занимает до 1 рабочего дня.
            </p>
          )}
          {me?.verificationStatus === 'REJECTED' && me?.verificationRejectionReason && (
            <p style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 12, fontSize: 14, color: '#991b1b', marginTop: 16 }}>
              Ранее отклонено: {me.verificationRejectionReason}. Заполните форму заново и отправьте заявку снова.
            </p>
          )}
        </div>

        <div className="ver-card">
          <span className="ver-label">Личные данные</span>
          <p className="ver-sub">Все поля обязательны — без них заявку отправить нельзя.</p>
          <label className="ver-label" style={{ textTransform: 'none', letterSpacing: 'normal', color: '#374151', fontSize: 13 }} htmlFor="ver-fullname">
            ФИО полностью
          </label>
          <input
            id="ver-fullname"
            className="ver-input"
            placeholder="Фамилия Имя Отчество"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            disabled={blocked}
          />
          <label className="ver-label" style={{ textTransform: 'none', letterSpacing: 'normal', color: '#374151', fontSize: 13 }} htmlFor="ver-birth">
            Дата рождения
          </label>
          <input
            id="ver-birth"
            className="ver-input"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date(new Date().setFullYear(new Date().getFullYear() - 14)).toISOString().slice(0, 10)}
            disabled={blocked}
          />
          <label className="ver-label" style={{ textTransform: 'none', letterSpacing: 'normal', color: '#374151', fontSize: 13 }} htmlFor="ver-live">
            Где проживаете
          </label>
          <input
            id="ver-live"
            className="ver-input"
            placeholder="Город или населённый пункт, регион"
            value={residence}
            onChange={(e) => setResidence(e.target.value)}
            autoComplete="address-level2"
            disabled={blocked}
          />
        </div>

        <div className="ver-card">
          <span className="ver-label">Тест: общение и правила</span>
          <p className="ver-sub">Нужно ответить на каждый вопрос и выбрать верный вариант.</p>
          {VERIFICATION_QUIZ_QUESTIONS.map((q, qi) => (
            <div className="ver-q" key={qi}>
              <div className="ver-q-num">Вопрос {qi + 1} из {VERIFICATION_QUIZ_QUESTIONS.length}</div>
              <p className="ver-q-text">{q.text}</p>
              <div className="ver-opts">
                {q.options.map((label, oi) => (
                  <button
                    key={oi}
                    type="button"
                    className={`ver-opt ${picked[qi] === oi ? 'ver-opt-on' : ''}`}
                    onClick={() => setAnswer(qi, oi)}
                    disabled={blocked}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="ver-card">
          <span className="ver-label">Согласие с правилами</span>
          <label className="ver-check">
            <span className="ver-check-ui">
              <input
                type="checkbox"
                className="ver-check-input"
                checked={agreeRules}
                onChange={(e) => setAgreeRules(e.target.checked)}
                disabled={blocked}
              />
              <span className={`ver-check-fake ${agreeRules ? 'ver-check-fake-on' : ''}`} aria-hidden>
                {agreeRules ? '✓' : ''}
              </span>
            </span>
            <span className="ver-check-copy">
              Подтверждаю, что ознакомился(ась) с{' '}
              <Link to="/terms" style={{ color: '#e8410a', fontWeight: 600 }} onClick={(e) => e.stopPropagation()}>правилами платформы</Link>
              {' '}(включая рекомендации по общению), обязуюсь их соблюдать, не обходить правила через личные каналы
              и понимаю, что нарушения могут повлечь ограничение аккаунта.
            </span>
          </label>

          {err && <div className="ver-err">{err}</div>}
          {ok && <div className="ver-ok">{ok}</div>}

          <button
            type="button"
            className="ver-btn ver-btn-p"
            style={{ width: '100%', marginTop: 12, padding: '14px' }}
            disabled={blocked || !formValid}
            onClick={handleSubmit}
          >
            {submitting ? 'Отправляем…' : 'Отправить на проверку'}
          </button>
        </div>
      </div>
    </div>
  );
}
