import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGuaranteeMe, acceptGuaranteeTerms } from '../api';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  .gt-page { font-family: Inter, system-ui, sans-serif; background: #f2f3f5; min-height: 100vh; padding: 24px 16px 64px; color: #111827; }
  .gt-inner { max-width: 720px; margin: 0 auto; }
  .gt-card {
    background: #fff; border-radius: 16px; border: 1px solid #e5e7eb;
    padding: 22px 22px 24px; margin-bottom: 14px;
    box-shadow: 0 4px 24px rgba(0,0,0,.04);
  }
  .gt-h1 { font-size: 22px; font-weight: 800; margin: 0 0 8px; letter-spacing: -.02em; }
  .gt-lead { font-size: 14px; color: #6b7280; line-height: 1.65; margin: 0 0 16px; }
  .gt-back { display: inline-flex; align-items: center; gap: 6px; color: #e8410a; font-weight: 600; font-size: 14px; text-decoration: none; margin-bottom: 16px; }
  .gt-back:hover { text-decoration: underline; }
  .gt-section { margin-bottom: 20px; }
  .gt-section h2 { font-size: 14px; font-weight: 700; color: #374151; margin: 0 0 8px; }
  .gt-section p { font-size: 13px; color: #4b5563; line-height: 1.6; margin: 0 0 8px; }
  .gt-section p:last-child { margin-bottom: 0; }
  .gt-check {
    display: flex; gap: 12px; align-items: flex-start; font-size: 13px; color: #374151; line-height: 1.55;
    margin: 14px 0; cursor: pointer;
  }
  .gt-check-ui { position: relative; flex-shrink: 0; width: 24px; height: 24px; margin-top: 2px; }
  .gt-check-input {
    position: absolute !important; inset: 0 !important; width: 24px !important; height: 24px !important;
    margin: 0 !important; opacity: 0 !important; cursor: pointer; z-index: 2;
    -webkit-appearance: none !important; appearance: none !important;
  }
  .gt-check-input:disabled { cursor: not-allowed; }
  .gt-check-fake {
    position: absolute; inset: 0; z-index: 1; pointer-events: none;
    border: 2px solid #cbd5e1; border-radius: 6px; background: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 800; color: #fff; line-height: 1;
    transition: border-color .15s, background .15s, box-shadow .15s;
  }
  .gt-check-fake-on {
    background: linear-gradient(135deg,#e8410a,#ff7043);
    border-color: #e8410a;
    box-shadow: 0 1px 4px rgba(232,65,10,.35);
  }
  .gt-check-copy { flex: 1; min-width: 0; }
  .gt-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 10px 16px; border-radius: 10px; border: none; font-weight: 700; font-size: 14px;
    font-family: inherit; cursor: pointer; transition: transform .12s, box-shadow .12s;
  }
  .gt-btn:disabled { opacity: .55; cursor: not-allowed; }
  .gt-btn-p { background: linear-gradient(135deg,#e8410a,#ff7043); color: #fff; box-shadow: 0 4px 14px rgba(232,65,10,.28); }
  .gt-btn-p:hover:not(:disabled) { transform: translateY(-1px); }
  .gt-err { font-size: 13px; color: #dc2626; font-weight: 600; margin-top: 8px; }
  .gt-ok { font-size: 13px; color: #15803d; font-weight: 600; margin-top: 12px; }
  .gt-muted { font-size: 12px; color: #9ca3af; margin-top: 8px; }
  @media (max-width: 768px) {
    .gt-page {
      padding: 14px max(12px, env(safe-area-inset-left)) 56px max(12px, env(safe-area-inset-right));
    }
    .gt-card { padding: 18px 16px 20px; border-radius: 14px; }
    .gt-h1 { font-size: 19px; }
    .gt-btn { width: 100%; min-height: 48px; justify-content: center; font-size: 15px; }
    .gt-section p { font-size: 14px; }
  }
`;

const INITIAL_CLAUSES = {
  acceptDealProcedure: false,
  acceptPaymentSettlement: false,
  acceptDisputeResolution: false,
  acceptOperatorDisclaimer: false,
  acceptPersonalDeclarations: false,
};

export default function GuaranteeTermsPage() {
  const { userId, userRole } = useAuth();
  const profileHome = userRole === 'WORKER' ? '/worker-profile' : '/profile';

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [clauses, setClauses] = useState(() => ({ ...INITIAL_CLAUSES }));
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState('');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setLoadErr('');
    getGuaranteeMe(userId)
      .then(setMe)
      .catch((e) => setLoadErr(e.message || 'Не удалось загрузить данные.'))
      .finally(() => setLoading(false));
  }, [userId]);

  const allChecked = Object.values(clauses).every(Boolean);

  const onSubmit = async () => {
    if (!userId || !allChecked) return;
    setSubmitting(true);
    setSubmitErr('');
    try {
      const next = await acceptGuaranteeTerms(userId, clauses);
      setMe(next);
      setClauses({ ...INITIAL_CLAUSES });
    } catch (e) {
      setSubmitErr(e.message || 'Не удалось сохранить.');
    } finally {
      setSubmitting(false);
    }
  };

  const fmtAccepted = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(iso);
    }
  };

  function Toggle({ field, children }) {
    const on = clauses[field];
    return (
      <label className="gt-check">
        <span className="gt-check-ui">
          <input
            type="checkbox"
            className="gt-check-input"
            checked={on}
            disabled={!me?.profileVerified || me?.guaranteeAccepted}
            onChange={() => setClauses((c) => ({ ...c, [field]: !c[field] }))}
          />
          <span className={`gt-check-fake ${on ? 'gt-check-fake-on' : ''}`}>{on ? '✓' : ''}</span>
        </span>
        <span className="gt-check-copy">{children}</span>
      </label>
    );
  }

  return (
    <div className="gt-page">
      <style>{css}</style>
      <div className="gt-inner">
        <Link to={profileHome} className="gt-back">← Назад в профиль</Link>

        <div className="gt-card">
          <h1 className="gt-h1">Заявление о гарантии и ответственности</h1>
          <p className="gt-lead">
            Это не тест и не опрос: ниже — текст заявления в отношении ваших сделок на сервисе. Отметки (галочки) и сохранение
            фиксируют вашу волю в электронной форме: вы <strong>сами</strong> берёте на себя ответственность за своё участие в сделке
            и <strong>заверяете</strong>, что со своей стороны будете действовать добросовестно, чтобы сделка прошла корректно.
            Оператор платформы (владелец сервиса) не является стороной ваших договорённостей и не отвечает за их исход.
          </p>

          {loading && <p className="gt-lead">Загрузка…</p>}
          {loadErr && <p className="gt-err">{loadErr}</p>}

          {!loading && !loadErr && me && !me.profileVerified && (
            <>
              <p className="gt-lead" style={{ color: '#92400e', background: '#fffbeb', padding: 12, borderRadius: 10 }}>
                Заявление можно подписать после успешной верификации профиля.
              </p>
              <Link to="/verification" className="gt-btn gt-btn-p" style={{ textDecoration: 'none', marginTop: 8 }}>
                Перейти к верификации
              </Link>
            </>
          )}

          {!loading && !loadErr && me?.guaranteeAccepted && (
            <>
              <p className="gt-ok">Вы уже зафиксировали согласие с текстом заявления.</p>
              {me.guaranteeAcceptedAt && (
                <p className="gt-muted">Дата: {fmtAccepted(me.guaranteeAcceptedAt)}</p>
              )}
              {me.consentVersion && (
                <p className="gt-muted">Версия текста: {me.consentVersion}</p>
              )}
              <Link to={profileHome} className="gt-btn gt-btn-p" style={{ textDecoration: 'none', marginTop: 16 }}>
                В профиль
              </Link>
            </>
          )}

          {!loading && !loadErr && me?.profileVerified && !me?.guaranteeAccepted && (
            <>
              <div className="gt-section">
                <h2>1. Что вы подтверждаете</h2>
                <p>
                  Вы заявляете и гарантируете, что относитесь к сделкам на платформе добросовестно: своевременно связываетесь
                  с контрагентом, не вводите его в заблуждение, исполняете согласованные условия со своей стороны и прилагаете
                  разумные усилия, чтобы совместная сделка (работа, оплата, сдача результата) прошла без срывов по вашей вине.
                  Это <strong>ваша личная гарантия поведения</strong>, а не страховка и не обещание платформы какого-либо результата.
                </p>
              </div>
              <div className="gt-section">
                <h2>2. Ответственность перед контрагентом</h2>
                <p>
                  Все обязательства по качеству, срокам, цене и объёму работ лежат между вами и второй стороной сделки.
                  Вы несёте полную ответственность за последствия своих действий и бездействия в рамках таких договорённостей
                  и обязуетесь разрешать претензии прежде всего <strong>напрямую с контрагентом</strong>.
                </p>
              </div>
              <div className="gt-section">
                <h2>3. Расчёты</h2>
                <p>
                  Условия оплаты, порядок передачи денег или иного расчёта определяете вы и контрагент самостоятельно.
                  Вы понимаете, что оператор платформы не получает от вашего имени оплату, не является агентом по расчётам
                  и не контролирует фактическое исполнение денежных обязательств сторон, если иное прямо не предусмотрено
                  отдельным функционалом и документами сервиса.
                </p>
              </div>
              <div className="gt-section">
                <h2>4. Споры и убытки</h2>
                <p>
                  Споры, убытки и иски, вызванные сделкой между пользователями, <strong>не образуют оснований</strong> для
                  переноса ответственности на владельца или оператора платформы. Вы обязуетесь не требовать от оператора
                  компенсации убытков, связанных с исполнением или неисполнением обязательств контрагентом, качеством работ,
                  сроками и иными условиями вашей частной договорённости, за исключением случаев, прямо предусмотренных законом.
                </p>
              </div>
              <div className="gt-section">
                <h2>5. Роль оператора (владельца сервиса)</h2>
                <p>
                  Платформа предоставляет программные средства и информационное сопровождение. Оператор вправе модерировать
                  контент и отключать нарушителей правил проекта. Оператор <strong>не контролирует</strong> исполнение ваших
                  сделок и <strong>не гарантирует</strong> результат работы мастера или поведение заказчика. Ограничение
                  ответственности оператора действует в максимально допустимой законом мере.
                </p>
              </div>
              <div className="gt-section">
                <h2>6. Заключительные отметки</h2>
                <p>
                  Сведения в вашем профиле достоверны. Вы полностью ознакомились с текстом выше, понимаете его правовое значение
                  для распределения рисков между вами, контрагентом и оператором, и принимаете его добровольно.
                  Ниже — короткие формальные отметки; все должны быть включены, чтобы зафиксировать согласие.
                </p>
              </div>

              <p className="gt-lead" style={{ marginTop: 20, fontWeight: 600, color: '#374151' }}>
                Формальные отметки (все обязательны):
              </p>

              <Toggle field="acceptDealProcedure">
                Я <strong>подтверждаю личную гарантию</strong> добросовестного участия в сделке и обязуюсь со своей стороны
                действовать так, чтобы сделка прошла корректно (п. 1–2).
              </Toggle>
              <Toggle field="acceptPaymentSettlement">
                Я понимаю, что <strong>расчёты с контрагентом — моя зона ответственности</strong>; платформа не сторона моих
                платёжных обязательств (п. 3).
              </Toggle>
              <Toggle field="acceptDisputeResolution">
                Споры по сделке буду решать <strong>с контрагентом</strong>; претензии к оператору по исходу сделки не заявляю в объёме,
                указанном в п. 4.
              </Toggle>
              <Toggle field="acceptOperatorDisclaimer">
                Согласен(на) с тем, что <strong>оператор не отвечает</strong> за результат работ и поведение пользователей и ограничивает
                свою ответственность в рамках п. 5.
              </Toggle>
              <Toggle field="acceptPersonalDeclarations">
                Заявляю <strong>достоверность данных</strong> в профиле и принимаю весь текст заявления целиком (п. 6).
              </Toggle>

              {submitErr && <p className="gt-err">{submitErr}</p>}

              <button
                type="button"
                className="gt-btn gt-btn-p"
                style={{ marginTop: 8 }}
                disabled={!allChecked || submitting}
                onClick={onSubmit}
              >
                {submitting ? 'Сохранение…' : 'Зафиксировать согласие'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
