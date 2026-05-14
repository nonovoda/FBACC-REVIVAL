# FBACC.js revival audit (v2)

## Контекст
`fbacc.js` — legacy bookmarklet (текущая версия в коде: `6.4`), который внедряется в Ads Manager, поднимает собственный popup UI и выполняет набор внутренних операционных действий для ad account / BM / fanpage. 

## Быстрый технический срез
- Скрипт монолитный (один большой runtime blob).
- Функций верхнего уровня: **86** (`window.* = function`).
- Сильно завязан на:
  - scraping внутреннего контекста и токенов;
  - внутренние endpoints / payload-ы Facebook;
  - жёсткие magic-значения (`doc_id`, `__rev`, `spin_*`).

---

## 1) Что оставить (must keep)

### A. Операционный статус-центр (главная ценность)
Оставить и сделать read-heavy стабильным:
- `showaccstatus`, `showbmstatus`, `showfpstatus`;
- детальные popup’ы `showMorePopup*` для drill-down.

**Почему:** это core value скрипта — быстрый “единый экран” для рутины и диагностики.

### B. Ежедневные account-операции low-risk
- `ProcessEditcurr`, `ProcessEdittzone` (+ `ShowEdit*` формы);
- смежные безопасные метаданные (имя/статус там, где это валидно).

**Почему:** высокий практический KPI при относительно контролируемом риске.

### C. Appeal workflows
- `appealadcreo`, `appealadsacc`, `appealfp`.

**Почему:** экономия времени на repetitive policy operations.

### D. Роли/доступы/привязки BM/FP
- блоки `showMorePopupBMUsers*`, `showMorePopupBMAccs*`, `showMorePopupFpRoles`, и смежные add/rm.

**Почему:** это “операционный хлеб” команд, и именно это сложнее всего делать руками в большом объёме.

---

## 2) Что вырезать или вынести в Danger Zone

### A. Billing / Credit Card операции в текущем виде
- `addCCtoadAccReq2`, `addCCtoadAccForm`, `addCCtoadAccProcessForm`.

**Причина:** обработка PAN/CVC в клиентском JS/DOM без безопасного контура. Для revival: либо полностью убрать, либо изолировать за явным unlock + юридические/безопасностные ограничения.

### B. Хрупкий token scraping через regex по `<script>`
- текущее поведение `getAccessTokenFunc`.

**Причина:** ломается при любом изменении фронта Facebook, сложно поддерживать и дебажить.

### C. Hardcoded request internals
- жёстко прошитые `doc_id`, `__rev`, `spin_r/b/t`, ручные payload-конструкции.

**Причина:** высокая деградация со временем, частые silent breakages.

### D. Неконтролируемое дублирование popup handlers
- десятки `showMorePopup*` без общей абстракции.

**Причина:** высокий maintenance cost и риск несовместимых фиксов.

---

## 3) Что усилить (обязательно)

### A. Архитектура
Разделить на модули:
- `core/context` (auth/session/account context);
- `core/http` (единый request-client);
- `features/status`, `features/appeals`, `features/bm`, `features/fp`, `features/account`;
- `ui/modal`, `ui/tables`, `ui/log`;
- `storage/config`.

### B. API reliability слой
Ввести единый `request()`:
- retry/backoff;
- классификацию ошибок (auth / permission / rate / unknown);
- единый формат результата (ok/error + details + action hints).

### C. Безопасность
- запрет хранения чувствительных данных карт в local storage/DOM-state;
- auto-wipe runtime secrets;
- log redaction (без PII/PCI);
- explicit guardrails для risk-операций.

### D. UX для оператора
- очередь задач (progress, pause/resume, retry);
- structured log в UI (не только `alert/console.log`);
- dry-run режим для batch действий.

### E. Наблюдаемость и контроль изменений
- health-check endpoint’ов перед массовыми действиями;
- feature flags;
- kill-switch для сломанного модуля без полного отключения скрипта.

---

## 4) Что добавить в revival-версии

1. **Bulk Jobs Engine**
   - вход: list/CSV account IDs, BM IDs, page IDs;
   - concurrency control;
   - экспорт отчётов (success/fail + причина).

2. **Failure Diagnostics**
   - авто-классификация “почему не сработало”:
     - role missing,
     - billing lock,
     - policy gate,
     - geo/eligibility,
     - endpoint drift.

3. **Scenario Profiles**
   - профили операций: агентский / ecom / арбитраж / mixed;
   - разный набор разрешённых action-by-default.

4. **Playbooks & Templates**
   - шаблоны типовых операций и сохранение параметров.

5. **Modern compact UI**
   - сохранить dark utility стиль;
   - добавить фильтры, поиск, сортировку, sticky actions, батч-таблицы.

---

## 5) Приоритетный roadmap (implementation-first)

### Phase 0 — Stabilize shell
- выделить загрузчик/инициализацию;
- вынести конфиг и feature flags;
- собрать baseline health-check.

### Phase 1 — Read-only core
- стабильные status views (acc/bm/fp) + unified logs;
- без рискованных write-операций.

### Phase 2 — Safe writes
- currency/timezone/name через единый API-client, validations, error hints.

### Phase 3 — Bulk engine
- очереди, отчёты, retry policy, dry-run.

### Phase 4 — Appeals v2
- переупаковка appeal workflows в новую архитектуру.

### Phase 5 — Danger zone (optional)
- legacy-risk операции только за explicit unlock и строгими guardrails.

---

## 6) Практический verdict
Скрипт действительно “легендарный”, потому что закрывает большой пласт операционки в Facebook Ads.
Для revival нужен не косметический рефактор, а **контролируемая ре-платформизация**:
- сохранить статус-центр и ежедневные low-risk workflows;
- вынести/удалить unsafe billing и brittle scraping;
- построить модульный, наблюдаемый, безопасный движок batch-операций.
