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
  .ver-lead { font-size: 14px; color: #6b7280; line-height: 1.65; margin: 0 0 18px; }
  .ver-back { display: inline-flex; align-items: center; gap: 6px; color: #e8410a; font-weight: 600; font-size: 14px; text-decoration: none; margin-bottom: 16px; }
  .ver-back:hover { text-decoration: underline; }
  .ver-label { font-size: 12px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 12px; display: block; }
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
    display: flex; gap: 10px; align-items: flex-start; font-size: 13px; color: #374151; line-height: 1.55;
    margin: 14px 0;
  }
  .ver-check input { margin-top: 3px; flex-shrink: 0; width: 18px; height: 18px; accent-color: #e8410a; }
  .ver-err { font-size: 13px; color: #dc2626; font-weight: 600; margin-top: 8px; }
  .ver-ok { font-size: 13px; color: #15803d; font-weight: 600; margin-top: 8px; }
  .ver-steps { font-size: 13px; color: #6b7280; padding-left: 18px; margin: 0 0 16px; line-height: 1.7; }
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
`;

export default function VerificationPage() {
  const { userId, userRole, userName, userLastName } = useAuth();
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [fullName, setFullName] = useState('');
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

  const formValid =
    quizComplete &&
    agreeRules &&
    fullName.trim().length >= 3;

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
      setErr('Ответьте на все вопросы, укажите ФИО и отметьте согласие с правилами.');
      return;
    }
    setSubmitting(true);
    try {
      await submitVerification(userId, {
        quizAnswers: picked,
        signature: {
          fullLegalName: fullName.trim(),
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
            Пройдите короткий тест о том, как безопасно и корректно работать с другими пользователями на «СвоиМастера».
            После проверки заявки в профиле может появиться отметка «Проверен». Доступно заказчикам и мастерам из личного кабинета.
          </p>
          <ol className="ver-steps">
            <li>Внимательно ответьте на все вопросы — нужны только правильные варианты.</li>
            <li>Укажите полное ФИО.</li>
            <li>Поставьте галочку: вы подтверждаете, что ознакомились с правилами платформы и обязуетесь их соблюдать.</li>
          </ol>

          {me?.verificationStatus === 'PENDING' && (
            <p style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 12, fontSize: 14, color: '#92400e' }}>
              Заявка уже на проверке. Обычно это занимает до 1 рабочего дня.
            </p>
          )}
          {me?.verificationStatus === 'REJECTED' && me?.verificationRejectionReason && (
            <p style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 12, fontSize: 14, color: '#991b1b' }}>
              Ранее отклонено: {me.verificationRejectionReason}. Пройдите тест и отправьте заявку снова.
            </p>
          )}
        </div>

        <div className="ver-card">
          <span className="ver-label">Тест: общение и правила</span>
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
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="ver-card">
          <span className="ver-label">ФИО и согласие с правилами</span>
          <input
            className="ver-input"
            placeholder="Фамилия Имя Отчество"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
          <label className="ver-check">
            <input
              type="checkbox"
              checked={agreeRules}
              onChange={(e) => setAgreeRules(e.target.checked)}
            />
            <span>
              Подтверждаю, что ознакомился(ась) с{' '}
              <Link to="/terms" style={{ color: '#e8410a', fontWeight: 600 }}>правилами платформы</Link>
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
