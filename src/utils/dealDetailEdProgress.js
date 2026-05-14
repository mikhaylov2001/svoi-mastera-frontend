/**
 * Five-step progress for deal detail (Lovable-style `ed-*` UI).
 * @param {object} detail — deal from API
 * @param {'customer'|'worker'} role
 * @param {(iso?: string) => string} formatRelative — e.g. timeAgo
 */
export function getDealEdProgress(detail, role, formatRelative) {
  const fmt = typeof formatRelative === 'function' ? formatRelative : () => '—';
  const status = detail?.status || 'NEW';
  const stageTotal = 5;

  const steps = [
    { label: 'Создана', time: fmt(detail?.createdAt) || '—', state: 'done' },
    { label: 'Принята', time: '—', state: 'todo' },
    { label: 'В работе', time: '—', state: 'todo' },
    { label: 'Подтверждение', time: '—', state: 'todo' },
    { label: 'Завершена', time: '—', state: 'todo' },
  ];

  let cancelled = false;

  if (status === 'CANCELLED') {
    cancelled = true;
    steps[0].state = 'done';
    steps[1].state = 'todo';
    steps[2].state = 'todo';
    steps[3].state = 'todo';
    steps[4] = {
      label: 'Отменена',
      time: fmt(detail?.updatedAt) || '—',
      state: 'cancel',
    };
  } else if (status === 'COMPLETED') {
    steps[1] = { ...steps[1], state: 'done', time: '—' };
    steps[2] = { ...steps[2], state: 'done', time: '—' };
    steps[3] = { ...steps[3], state: 'done', time: '—' };
    steps[4] = {
      ...steps[4],
      state: 'done',
      time: fmt(detail?.updatedAt) || 'готово',
    };
  } else if (status === 'IN_PROGRESS') {
    steps[1] = { ...steps[1], state: 'done', time: '—' };
    steps[2] = { ...steps[2], state: 'done', time: 'сейчас' };
    if (detail.customerConfirmed && detail.workerConfirmed) {
      steps[3] = { ...steps[3], state: 'done', time: '—' };
      steps[4] = { ...steps[4], state: 'current', time: '—' };
    } else {
      steps[3] = { ...steps[3], state: 'current', time: '—' };
    }
  } else {
    steps[1] = {
      ...steps[1],
      state: 'current',
      time: role === 'worker' ? 'ваш ответ' : 'ожидание',
    };
  }

  const doneCount = steps.filter((s) => s.state === 'done').length;
  const n = steps.length;
  const segmentCount = Math.max(1, n - 1);
  /* Без ограничения при 5/5 done получалось 125%+ — линия вылезала за карточку */
  const rawPercent = (doneCount / segmentCount) * 100 + (0.5 / segmentCount) * 100;
  const lineWidth = `${Math.min(100, Math.max(0, rawPercent))}%`;

  const currentIdx = steps.findIndex((s) => s.state === 'current');
  const doneLen = steps.filter((s) => s.state === 'done').length;
  const stageNum =
    currentIdx >= 0
      ? currentIdx + 1
      : cancelled
        ? stageTotal
        : Math.max(1, doneLen);

  let pct;
  if (cancelled) pct = 0;
  else if (status === 'COMPLETED') pct = 100;
  else {
    const hasCurrent = currentIdx >= 0;
    pct = Math.min(
      99,
      Math.round(((doneCount + (hasCurrent ? 0.4 : 0)) / (n - 1)) * 100),
    );
  }

  return {
    steps,
    pct,
    stageNum,
    stageTotal,
    lineWidth,
    cancelled,
  };
}
