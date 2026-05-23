# СвоиМастера — бриф для Base44

## Название приложения

| Поле | Значение |
|------|----------|
| **Название** | **СвоиМастера** |
| **Короткое имя (PWA)** | СвоиМастера |
| **Репозиторий** | https://github.com/mikhaylov2001/svoi-mastera-frontend |
| **Город запуска** | Йошкар-Ола |

## Что это за продукт

**СвоиМастера** — локальный маркетплейс услуг для дома и ремонта.

- **Заказчик** публикует задачу или ищет мастера по категориям, смотрит объявления, откликается, общается в чате.
- **Мастер** видит открытые заявки, откликается, ведёт сделки, публикует объявления услуг.
- **Гость** (не залогинен) видит лендинг с категориями и призывом зарегистрироваться.

Оплата и договорённости — **напрямую между сторонами** (не escrow-маркетплейс).

## Стек

- **Frontend:** React 18, React Router, Vite
- **Стили:** CSS (классы `chpv-*` на главных), без Tailwind на home
- **Шрифты:** Manrope (основной), Instrument Serif (акценты на auth)
- **Цвета:** оранжевый акцент `#e8410a` / `#ff5722`, тёмный hero `#0d0d0d`, фон `#f5f5f3` / `#fafaf7`
- **API:** REST `/api/v1` (функции в `src/api.js`)

## Маршруты главных страниц

| Роль | URL | Компонент |
|------|-----|-----------|
| Гость | `/` | `GuestLandingHome` |
| Заказчик (логин) | `/` | `CustomerHomePage` |
| Мастер | `/worker-home` | `WorkerHomePage` |

## Задача для Base44

**Переделать адаптив главных страниц** заказчика и мастера:

- mobile (≤640px)
- tablet (641–1024px)
- desktop (>1024px)

Сохранить функциональность и данные (поиск, чипы категорий, лента «сейчас на платформе», списки карточек, сайдбар). Улучшить визуальный баланс и равномерное распределение блоков на всех ширинах.

---

## Файлы для копирования в чат Base44

Скопируйте **целиком** содержимое этих файлов с GitHub (ветка `main`):

### 1. Главная заказчика + мастера (один файл, два компонента)

| Файл | Строки | Описание |
|------|--------|----------|
| [`src/pages/HomePage.jsx`](https://github.com/mikhaylov2001/svoi-mastera-frontend/blob/main/src/pages/HomePage.jsx) | 211–670 | `CustomerHomePage` — главная заказчика |
| тот же файл | 679–1108 | `WorkerHomePage` — главная мастера |
| тот же файл | 1120–1126 | `HomePage` — гость → лендинг, иначе заказчик |

### 2. Стили главной (заказчик и мастер)

| Файл | Описание |
|------|----------|
| [`src/pages/customerHomeLovable.css`](https://github.com/mikhaylov2001/svoi-mastera-frontend/blob/main/src/pages/customerHomeLovable.css) | Основные стили `.chpv-*` (hero, поиск, сетка, карточки, сайдбар) |
| [`src/roles/worker/jobListings.css`](https://github.com/mikhaylov2001/svoi-mastera-frontend/blob/main/src/roles/worker/jobListings.css) | Доп. стили списков заявок/объявлений |

### 3. Лендинг гостя (если нужен в том же стиле)

| Файл | Описание |
|------|----------|
| [`src/pages/GuestLandingHome.jsx`](https://github.com/mikhaylov2001/svoi-mastera-frontend/blob/main/src/pages/GuestLandingHome.jsx) | Лендинг для неавторизованных |
| [`src/pages/guestLandingHpCss.js`](https://github.com/mikhaylov2001/svoi-mastera-frontend/blob/main/src/pages/guestLandingHpCss.js) | Стили hero гостя (export `GUEST_LANDING_HP_CSS`) |

### 4. Контекст роутинга

| Файл | Описание |
|------|----------|
| [`src/App.jsx`](https://github.com/mikhaylov2001/svoi-mastera-frontend/blob/main/src/App.jsx) | `CustomerHomeRoute`, `WorkerHomeGate`, маршруты |
| [`src/constants/homePaths.js`](https://github.com/mikhaylov2001/svoi-mastera-frontend/blob/main/src/constants/homePaths.js) | `/` и `/worker-home` |

### 5. Сообщения / чат (мастер и заказчик — один экран)

Отдельных файлов «чат мастера» и «чат заказчика» **нет**: одна страница на обе роли, различия по `isWorker` из `useAuth()`.

| Файл | Описание |
|------|----------|
| [`src/pages/ChatPage.jsx`](https://github.com/mikhaylov2001/svoi-mastera-frontend/blob/main/src/pages/ChatPage.jsx) | Компонент `ChatPage` — список диалогов, переписка, вложения, эмодзи, фоны |
| [`src/pages/ChatPage.css`](https://github.com/mikhaylov2001/svoi-mastera-frontend/blob/main/src/pages/ChatPage.css) | Все стили чата (классы `cs-*`, `c-*`, лайтбокс вложений) |
| [`src/components/AttachButton.jsx`](https://github.com/mikhaylov2001/svoi-mastera-frontend/blob/main/src/components/AttachButton.jsx) | Кнопка прикрепления файлов (опционально для контекста) |

**Маршруты:** `/chat`, `/chat/:partnerId` (см. `App.jsx`).

**Роль:** `isWorker === true` → мастер (пункт меню «Найти работу»); иначе заказчик («Найти мастера»).

**API (из `src/api.js`):** `getConversations`, `getConversation`, `sendMessage`, `updateMessage`, `deleteMessage`, `deleteConversation`, `uploadFile`.

**Задача для Base44:** мобильная вёрстка чата (≤768px): список диалогов ↔ открытый чат, нижняя панель ввода, безопасные зоны, не ломать логику отправки и polling.

---

## Структура UI — главная заказчика (`CustomerHomePage`)

1. **Hero** — тёмный блок: заголовок, поиск, чипы категорий, быстрые подсказки, лента активности «Сейчас на платформе» (карусель).
2. **Основная сетка** — две колонки на desktop:
   - слева: фильтры категорий, сортировка, карточки **объявлений мастеров**;
   - справа (aside): топ мастеров, промо «разместить заявку».
3. **Мобильная** — колонки в столбик, горизонтальный скролл чипов.

**API:** `getListings`, `getOpenJobRequests`, `getCategories`, `getWorkerStats`, `getUserProfile`.

## Структура UI — главная мастера (`WorkerHomePage`)

1. **Hero** — аналогичный тёмный блок, поиск по **заявкам**, чипы, лента платформы.
2. **Основная сетка**:
   - слева: заявки заказчиков (карточки);
   - справа: топ заказчиков, промо «Мои объявления».
3. Те же классы `chpv-*`, зеркальная логика заказчику.

**API:** `getOpenJobRequestsForWorker`, `getCategories`, `getCustomerStats`, `getUserProfile`.

## Breakpoints (текущие ориентиры)

```css
/* mobile */
@media (max-width: 640px) { ... }

/* tablet */
@media (min-width: 641px) and (max-width: 1024px) { ... }

/* desktop */
@media (min-width: 1025px) { ... }
```

## Ограничения при интеграции

- Не ломать вызовы API и пропсы `userId` / `userName`.
- Сохранить ссылки: `/find-master`, `/my-requests`, `/find-work`, `/my-listings`, `/register`, профили `/workers/:id`.
- Компонент `FavoriteHeartButton`, `Link` из react-router.
- Роли: мастер на `/` редиректится на `/worker-home` (см. `App.jsx`).

## Текст для вставки в Base44 (кратко)

```
Проект: СвоиМастера — маркетплейс мастеров для дома и ремонта в Йошкар-Оле.
React + Vite, CSS классы chpv-*.

Нужно: адаптив главной заказчика (CustomerHomePage) и мастера (WorkerHomePage) 
из файла HomePage.jsx + customerHomeLovable.css — mobile, tablet, desktop.

Гость: GuestLandingHome.jsx отдельно.

Репо: https://github.com/mikhaylov2001/svoi-mastera-frontend
Файлы: см. docs/BASE44-handoff.md в репозитории.
```

### Текст для Base44 — чат (мобилка)

```
Проект: СвоиМастера. React + Vite.

Нужна мобильная вёрстка страницы «Сообщения» для мастера и заказчика.
Это один компонент ChatPage — роль через isWorker (мастер / заказчик).

Файлы (скопировать целиком с GitHub main):
- src/pages/ChatPage.jsx
- src/pages/ChatPage.css

Маршрут: /chat и /chat/:partnerId

UI: слева список чатов (на мобиле — отдельный экран), справа переписка;
поиск, аватары, пузыри сообщений, вложения, эмодзи, выбор фона, поле ввода внизу.

Не менять вызовы API. Breakpoint мобилки: max-width 768px (как в проекте).

Репо: https://github.com/mikhaylov2001/svoi-mastera-frontend
```
