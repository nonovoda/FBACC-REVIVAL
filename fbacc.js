javascript:(function(){
  const TOOL_ID = 'fbacc-revival-shell';
  const STYLE_ID = 'fbacc-revival-shell-style';

  function destroy() {
    document.getElementById(TOOL_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    document.getElementById(TOOL_ID + '-overlay')?.remove();
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
:root {
  --fbtool-panel-bg:#0f1715;--fbtool-deep-bg:#0b1210;--fbtool-control-bg:#121f1b;
  --fbtool-border:#2b433a;--fbtool-border-soft:#22372f;--fbtool-border-input:#2f4a40;
  --fbtool-text:#e8fff0;--fbtool-label:#c7e0d2;--fbtool-muted:#99b3a6;
  --fbtool-accent:#4dff8f;--fbtool-accent-text:#052012;
  --fbtool-success:#9bff7d;--fbtool-warning:#ffd27d;--fbtool-error:#ff8f8f;
}
.fbtool{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(520px,calc(100vw - 24px));max-height:calc(100vh - 40px);overflow:auto;z-index:2147483647;background:var(--fbtool-panel-bg);color:var(--fbtool-text);border:1px solid var(--fbtool-border);border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,.45);font:13px/1.4 Inter,"Segoe UI",Arial,sans-serif;padding:14px}
.fbtool__header{display:flex;justify-content:space-between;position:relative;padding-right:34px;margin-bottom:10px}
.fbtool__title{margin:0;color:var(--fbtool-accent);font-size:28px;line-height:1.05;font-weight:800}
.fbtool__meta{margin-top:4px;color:var(--fbtool-muted);font-size:11px}
.fbtool__close{position:absolute;top:0;right:0;border:0;background:transparent;color:#d3e8dc;padding:0;cursor:pointer;line-height:1;font-size:24px;font-weight:700}
.fbtool__tabs{display:flex;margin-top:8px;border-bottom:1px solid var(--fbtool-border-input)}
.fbtool__tab{flex:1;border:0;background:transparent;color:var(--fbtool-muted);padding:9px 8px;cursor:pointer;font:inherit;font-weight:700}
.fbtool__tab.is-active{color:var(--fbtool-text);border-bottom:2px solid var(--fbtool-accent)}
.fbtool__section{margin-top:10px}.fbtool__label{display:block;margin:8px 0 4px;color:var(--fbtool-label);font-size:12px}
.fbtool__btn{width:100%;border-radius:9px;border:1px solid var(--fbtool-border-input);background:var(--fbtool-control-bg);color:var(--fbtool-text);padding:9px;font:inherit;cursor:pointer;font-weight:700}
.fbtool__btn--primary{background:var(--fbtool-accent)!important;color:var(--fbtool-accent-text)!important;border-color:var(--fbtool-accent)!important}
.fbtool__log{margin-top:10px;min-height:120px;max-height:260px;overflow:auto;border:1px solid var(--fbtool-border-soft);border-radius:10px;background:var(--fbtool-deep-bg);padding:8px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;line-height:1.35}
.fbtool__log-line--success{color:var(--fbtool-success)}.fbtool__log-line--warning{color:var(--fbtool-warning)}.fbtool__log-line--error{color:var(--fbtool-error)}
.fbacc-shell__overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:2147483646}
.fbacc-shell__actions{display:flex;gap:8px;margin-top:10px}.fbacc-shell__actions .fbtool__btn{flex:1}
.fbacc-shell__panel{display:none}.fbacc-shell__panel.is-active{display:block}
.fbacc-shell__kv{display:grid;grid-template-columns:160px 1fr;gap:6px 10px;font-size:12px;margin-top:6px}.fbacc-shell__kv b{color:var(--fbtool-label)}
`;
    document.head.appendChild(style);
  }

  function now(){ return new Date().toLocaleTimeString('ru-RU', {hour12:false}); }
  function log(logEl,text,type='info'){ const d=document.createElement('div'); d.className=type==='info'?'':`fbtool__log-line--${type}`; d.textContent=`[${now()}] ${text}`; logEl.appendChild(d); logEl.scrollTop=logEl.scrollHeight; }

  function buildSnapshot(){
    const q = new URLSearchParams(location.search);
    return {
      acc:{'ID аккаунта (act)': q.get('act')||'—','Путь страницы':location.pathname,'Личный профиль':document.cookie.includes('i_user=')?'Да':'Нет'},
      bm:{'business_id в URL':q.get('business_id')||'—','ID в hash':location.hash||'—'},
      fp:{'Признак fanpage контекста':/page|fan|facebook\.com\//i.test(location.href)?'Да':'Не определён','URL':location.href.slice(0,120)}
    };
  }

  function renderKV(el,data){ el.innerHTML = Object.entries(data).map(([k,v])=>`<div class="fbacc-shell__kv"><b>${k}</b><span>${v}</span></div>`).join(''); }

  function setActiveTab(root,key){
    root.querySelectorAll('.fbtool__tab').forEach(t=>t.classList.toggle('is-active',t.dataset.tab===key));
    root.querySelectorAll('.fbacc-shell__panel').forEach(p=>p.classList.toggle('is-active',p.dataset.panel===key));
  }

  function init(){
    destroy(); injectStyle();
    const overlay=document.createElement('div'); overlay.id=TOOL_ID+'-overlay'; overlay.className='fbacc-shell__overlay';
    const root=document.createElement('section'); root.id=TOOL_ID; root.className='fbtool';
    root.innerHTML=`
<header class="fbtool__header"><div><h2 class="fbtool__title">FBACC Revival</h2><div class="fbtool__meta">Bookmarklet • Phase 1 read-only</div></div><button class="fbtool__close" aria-label="Закрыть">×</button></header>
<div class="fbtool__tabs"><button class="fbtool__tab is-active" data-tab="acc">Аккаунт</button><button class="fbtool__tab" data-tab="bm">BM</button><button class="fbtool__tab" data-tab="fp">FP</button></div>
<section class="fbtool__section fbacc-shell__panel is-active" data-panel="acc"><div id="panel-acc"></div></section>
<section class="fbtool__section fbacc-shell__panel" data-panel="bm"><div id="panel-bm"></div></section>
<section class="fbtool__section fbacc-shell__panel" data-panel="fp"><div id="panel-fp"></div></section>
<section class="fbtool__section"><div class="fbacc-shell__actions"><button class="fbtool__btn fbtool__btn--primary" data-action="refresh">Обновить snapshot</button><button class="fbtool__btn" data-action="close">Закрыть</button></div></section>
<section class="fbtool__section"><label class="fbtool__label">Системный лог</label><div id="fbacc-log" class="fbtool__log"></div></section>`;
    document.body.appendChild(overlay); document.body.appendChild(root);

    const logEl=root.querySelector('#fbacc-log');
    const refresh=root.querySelector('[data-action="refresh"]');
    const onClose=()=>destroy();
    root.querySelector('.fbtool__close').addEventListener('click',onClose);
    root.querySelector('[data-action="close"]').addEventListener('click',onClose);
    overlay.addEventListener('click',onClose);
    root.querySelectorAll('.fbtool__tab').forEach(tab=>tab.addEventListener('click',()=>setActiveTab(root,tab.dataset.tab)));

    function refreshSnapshot(){
      const s=buildSnapshot();
      renderKV(root.querySelector('#panel-acc'),s.acc);
      renderKV(root.querySelector('#panel-bm'),s.bm);
      renderKV(root.querySelector('#panel-fp'),s.fp);
      log(logEl,'Read-only snapshot обновлён','success');
    }

    refresh.addEventListener('click',()=>{refresh.disabled=true;const t=refresh.textContent;refresh.textContent='Обновление...';refreshSnapshot();refresh.textContent=t;refresh.disabled=false;});
    refreshSnapshot();
    log(logEl,'FBACC bookmarklet shell инициализирован','success');
  }

  init();
})();
