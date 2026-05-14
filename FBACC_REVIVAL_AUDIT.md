# FBACC.js revival audit

## Что это сейчас
`fbacc.js` — монолитный bookmarklet, который:
- вытаскивает внутренние токены/контекст из Ads Manager (`fb_dtsg`, `c_user`, selected account);
- работает поверх внутренних и Graph endpoint’ов Facebook;
- рендерит собственный pop-up UI внутри страницы;
- автоматизирует большое число админских действий по ad account / BM / fanpage.

## Функции, которые стоит оставить (core value)
1. **Сводка статуса ad account / BM / FP в одном окне**
   - `showaccstatus`, `showbmstatus`, `showfpstatus`, плюс popups `showMorePopup*`.
   - Это главный “операционный дашборд” скрипта.

2. **Управление метаданными аккаунта, которые реально нужны в daily ops**
   - смена currency/timezone (`ProcessEditcurr`, `ProcessEdittzone`);
   - update name/status-related workflows.

3. **Review/appeal workflows**
   - `appealadcreo`, `appealadsacc`, `appealfp` как ускорение рутины при ограничениях.

4. **Работа с BM/FP ролями и привязками**
   - добавление/удаление пользователей, проверка ассетов, привязка активов.

## Что стоит вырезать (или вынести в отдельный “danger zone” модуль)
1. **Операции с кредитками (CC add) в текущем виде**
   - `addCCtoadAccReq2`, формы `addCCtoadAcc*`.
   - Сейчас это хранение/обработка PAN/CVC в DOM + JS без безопасного контура.

2. **Любой функционал, который завязан на scraping inline script regex’ами**
   - поиск access token в `<script>` через regex и magic-string-ы.
   - Ломается при любом изменении FB frontend.

3. **Жёстко прошитые `doc_id`, `__rev`, `spin_*` и brittle payload-ы**
   - быстро устаревает, приводит к массовым false-error.

4. **Сильно дублированные popup handlers**
   - десятки `showMorePopup*` без общей абстракции.

## Что нужно доработать/усилить
1. **Архитектура**
   - Разбить монолит на модули: `auth/context`, `api-client`, `features/*`, `ui/*`, `storage/*`.
   - Перейти на единый command-registry и декларативные feature cards.

2. **Слой API**
   - Единый `request()` с retry/backoff, classify ошибок (rate limit, auth, permission, unknown).
   - Версионирование endpoint adapters (v1/v2) и capability checks.

3. **Безопасность**
   - Запрет хранения чувствительных данных карт в local storage / plain state.
   - Секреты только в runtime памяти + auto wipe.
   - Audit log без PII/PCI.

4. **UX/операторский поток**
   - Очередь задач: видно прогресс, retry, результат по каждому действию.
   - Нормальный structured log вместо разрозненных `console.log/alert`.
   - Dry-run режим перед массовыми действиями.

5. **Надёжность и поддержка**
   - Инструмент health-check endpoint’ов перед запуском операций.
   - Feature flags + remote kill-switch для сломанных модулей.

## Что добавить в revival-версии
1. **Пакетный режим (bulk jobs)**
   - CSV/textarea input для списка account IDs / BM IDs;
   - очереди, concurrency limit, pause/resume, экспорт результатов.

2. **Диагностический модуль “Почему не сработало”**
   - автоматический разбор отказа: role missing / billing lock / geo limitation / policy gate.

3. **Профили сценариев**
   - “фарм”, “арбитраж”, “агентский”, “белый e-com” профили с разным набором safe actions.

4. **Система конфигураций и шаблонов**
   - сохранённые playbook’и действий под типовые кейсы.

5. **Современный UI слой**
   - оставить dark compact стиль, но сделать вкладки/таблицы, фильтры, поисковый input, sticky actions.

## Приоритетный roadmap (практично)
1. **MVP стабилизация**: auth/context + status pages + read-only инструменты.
2. **Safe write actions**: timezone/currency/name с валидацией и rollback hints.
3. **Bulk engine + job logs**.
4. **Appeal module v2**.
5. **Danger zone (optional)**: legacy-risk actions behind explicit unlock.

## Итог
Сильная сторона fbacc.js — это операционный “комбайн” для FB Ads менеджмента.
Слабая — монолитность, хрупкие интеграции и рискованные блоки (особенно billing/card).
В revival версии ядро надо оставить, risky части — изолировать или удалить, а основу перевести на модульную, наблюдаемую и безопасную архитектуру.
