/**
 * Превращает технические ответы Spring/Hibernate/PostgreSQL в понятный текст.
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function humanizeServerErrorMessage(text) {
  if (text == null) return 'Произошла ошибка. Попробуйте ещё раз.';
  let t = String(text).replace(/\s+/g, ' ').trim();
  if (!t) return 'Произошла ошибка. Попробуйте ещё раз.';

  const lower = t.toLowerCase();
  if (
    /could not open jpa entitymanager|entitymanager for transaction|failed to obtain jdbc connection|could not obtain connection|hibernate\.exception|schema validation|schemamanagementexception|unable to build hibernate sessionfactory|dataaccessresourcefailure/i.test(
      lower,
    )
  ) {
    return 'Сервер временно не может обработать запрос (проблема с базой данных или обновление). Попробуйте через несколько минут. Если не проходит — напишите в поддержку.';
  }

  const errBlock = t.match(/\[ERROR:\s*([^\]]+)\]/i);
  const core = (errBlock ? errBlock[1] : t).trim();

  if (/view_count/i.test(core) && /does not exist/i.test(core)) {
    return 'База данных ещё обновляется (нет поля счётчика просмотров). Подождите 1–2 минуты после выката сервера и обновите страницу.';
  }
  if (/column\s+"[^"]+"\s+of\s+relation\s+"[^"]+"\s+does not exist/i.test(core)) {
    return 'Схема базы не совпадает с версией сайта — обычно это временно после обновления сервера. Попробуйте через минуту.';
  }
  if (/relation\s+"[^"]+"\s+does not exist/i.test(core)) {
    return 'В базе не найдена нужная таблица. Напишите в поддержку.';
  }
  if (/required request header 'x-user-id'.*not present/i.test(core)) {
    return 'Нужно войти в аккаунт, чтобы выполнить это действие.';
  }
  if (/could not initialize proxy .* no session/i.test(core)) {
    return 'Профиль временно недоступен из-за ошибки сервера. Попробуйте через пару минут.';
  }
  if (/request method '.+' is not supported/i.test(core)) {
    return 'Временная ошибка запроса. Обновите страницу и попробуйте снова.';
  }
  if (/category not found/i.test(core)) {
    return 'Выберите корректную категорию заявки.';
  }
  if (/user not found/i.test(core)) {
    return 'Сессия устарела или аккаунт не найден на сервере. Выйдите из профиля и войдите снова.';
  }
  if (/customer profile not found/i.test(core)) {
    return 'Профиль заказчика не настроен. Выйдите и войдите снова или обновите профиль в настройках.';
  }
  if (/duplicate key|unique constraint/i.test(core)) {
    return 'Такая запись уже есть. Измените данные и сохраните снова.';
  }
  if (/violates foreign key/i.test(core)) {
    return 'Связанные данные не найдены. Выйдите из аккаунта и войдите снова.';
  }
  if (/not null violation|null value in column/i.test(core)) {
    return 'Не заполнено обязательное поле. Проверьте форму.';
  }
  if (/violates check constraint/i.test(core)) {
    return 'Значение не подходит по правилам сервера. Измените и попробуйте снова.';
  }
  if (/value too long|character varying\(\d+\)/i.test(core)) {
    return 'Слишком длинный текст или слишком большие данные. Сократите описание или уберите часть фото.';
  }
  if (/Worker profile not found/i.test(t)) {
    return 'Профиль мастера не найден. Войдите как мастер или зарегистрируйтесь мастером.';
  }
  if (/Not your listing/i.test(t)) {
    return 'Это не ваше объявление.';
  }
  if (/Listing not found/i.test(t)) {
    return 'Объявление не найдено.';
  }

  if (core && core.length > 0 && core.length <= 320 && core !== t) {
    return `Ошибка сервера: ${core}`;
  }
  if (t.length > 420) return `${t.slice(0, 420)}…`;
  return t;
}
