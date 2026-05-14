(function () {
  const TOOL_ID = "fbacc-revival-shell";
  const STYLE_ID = "fbacc-revival-shell-style";

  function destroy() {
    document.getElementById(TOOL_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
:root {
  --fbtool-panel-bg: #0f1715;
  --fbtool-deep-bg: #0b1210;
  --fbtool-control-bg: #121f1b;
  --fbtool-border: #2b433a;
  --fbtool-border-soft: #22372f;
  --fbtool-border-input: #2f4a40;
  --fbtool-text: #e8fff0;
  --fbtool-label: #c7e0d2;
  --fbtool-muted: #99b3a6;
  --fbtool-accent: #4dff8f;
  --fbtool-accent-text: #052012;
  --fbtool-success: #9bff7d;
  --fbtool-warning: #ffd27d;
  --fbtool-error: #ff8f8f;
  --fbtool-radius-control: 9px;
  --fbtool-radius-log: 10px;
  --fbtool-radius-modal: 14px;
  --fbtool-gap: 8px;
  --fbtool-font: Inter, 'Segoe UI', Arial, sans-serif;
  --fbtool-font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --fbtool-font-size: 13px;
  --fbtool-label-size: 12px;
  --fbtool-note-size: 11px;
  --fbtool-log-size: 12px;
}

.fbtool {position: fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(520px,calc(100vw - 24px));max-height:calc(100vh - 40px);overflow:auto;z-index:2147483647;background:var(--fbtool-panel-bg);color:var(--fbtool-text);border:1px solid var(--fbtool-border);border-radius:var(--fbtool-radius-modal);box-shadow:0 24px 60px rgba(0,0,0,.45);font:var(--fbtool-font-size)/1.4 var(--fbtool-font);padding:14px;}
.fbtool__header{display:flex;justify-content:space-between;gap:8px;position:relative;padding-right:34px;margin-bottom:10px}
.fbtool__title{margin:0;color:var(--fbtool-accent);font-size:28px;line-height:1.05;font-weight:800}
.fbtool__meta{margin-top:4px;color:var(--fbtool-muted);font-size:var(--fbtool-note-size)}
.fbtool__close{position:absolute;top:0;right:0;border:0;background:transparent;color:#d3e8dc;padding:0;cursor:pointer;line-height:1;font-size:24px;font-weight:700}
.fbtool__section{margin-top:10px}
.fbtool__label{display:block;margin:8px 0 4px;color:var(--fbtool-label);font-size:var(--fbtool-label-size)}
.fbtool__note{color:var(--fbtool-muted);font-size:var(--fbtool-note-size)}
.fbtool__btn{width:100%;border-radius:var(--fbtool-radius-control);border:1px solid var(--fbtool-border-input);background:var(--fbtool-control-bg);color:var(--fbtool-text);padding:9px;font:inherit;cursor:pointer;font-weight:700}

.fbacc-shell__overlay {position: fixed;inset: 0;background: rgba(0,0,0,.35);z-index: 2147483646;}
.fbacc-shell__actions {display: flex;gap: var(--fbtool-gap);margin-top: 10px;}
.fbacc-shell__actions .fbtool__btn { flex: 1; }
.fbtool__btn--primary {background: var(--fbtool-accent) !important;color: var(--fbtool-accent-text) !important;border-color: var(--fbtool-accent) !important;}
.fbtool__log {margin-top: 10px;min-height: 120px;max-height: 260px;overflow: auto;border: 1px solid var(--fbtool-border-soft);border-radius: var(--fbtool-radius-log);background: var(--fbtool-deep-bg);padding: 8px;font-family: var(--fbtool-font-mono);font-size: var(--fbtool-log-size);line-height: 1.35;}
.fbtool__log-line--success { color: var(--fbtool-success); }
.fbtool__log-line--warning { color: var(--fbtool-warning); }
.fbtool__log-line--error { color: var(--fbtool-error); }
`;
    document.head.appendChild(style);
  }

  function now() {
    return new Date().toLocaleTimeString("ru-RU", { hour12: false });
  }

  function log(logEl, text, type = "info") {
    const line = document.createElement("div");
    line.className = type === "info" ? "" : `fbtool__log-line--${type}`;
    line.textContent = `[${now()}] ${text}`;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function init() {
    destroy();
    injectStyle();

    const overlay = document.createElement("div");
    overlay.className = "fbacc-shell__overlay";
    overlay.id = TOOL_ID + "-overlay";

    const root = document.createElement("section");
    root.id = TOOL_ID;
    root.className = "fbtool fbtool--medium";

    root.innerHTML = `
      <header class="fbtool__header">
        <div>
          <h2 class="fbtool__title fbtool__title--medium">FBACC Revival</h2>
          <div class="fbtool__meta">Phase 0 • Каркас интерфейса</div>
        </div>
        <button class="fbtool__close" aria-label="Закрыть">×</button>
      </header>

      <section class="fbtool__section">
        <div class="fbtool__note">Стартовый шаг рефакторинга: единый shell, лог и базовые действия без изменения бизнес-логики.</div>
        <div class="fbacc-shell__actions">
          <button class="fbtool__btn fbtool__btn--primary" data-action="health">Проверить окружение</button>
          <button class="fbtool__btn" data-action="close">Закрыть</button>
        </div>
      </section>

      <section class="fbtool__section">
        <label class="fbtool__label">Системный лог</label>
        <div class="fbtool__log" id="fbacc-shell-log"></div>
      </section>

      <section class="fbtool__section fbtool__note">
        Используются фирменные стили из репозитория: tokens/typography/styles.
      </section>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(root);

    const closeBtn = root.querySelector(".fbtool__close");
    const closeAction = root.querySelector('[data-action="close"]');
    const healthBtn = root.querySelector('[data-action="health"]');
    const logEl = root.querySelector("#fbacc-shell-log");

    const onClose = () => {
      overlay.remove();
      destroy();
    };

    closeBtn.addEventListener("click", onClose);
    closeAction.addEventListener("click", onClose);
    overlay.addEventListener("click", onClose);

    healthBtn.addEventListener("click", () => {
      healthBtn.disabled = true;
      const oldText = healthBtn.textContent;
      healthBtn.textContent = "Проверка...";

      log(logEl, "Старт health-check", "info");

      const checks = [
        ["URL Ads Manager", /facebook\.com\/.+ads/.test(location.href)],
        ["Наличие document.body", !!document.body],
        ["Наличие cookie i_user", document.cookie.includes("i_user=")],
      ];

      checks.forEach(([name, ok]) => {
        log(logEl, `${name}: ${ok ? "OK" : "Не найдено"}`, ok ? "success" : "warning");
      });

      log(logEl, "Health-check завершён", "info");
      healthBtn.disabled = false;
      healthBtn.textContent = oldText;
    });

    log(logEl, "UI shell инициализирован", "success");
  }

  window.FBACCRevivalShell = { init, destroy };
})();
