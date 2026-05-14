javascript:(function(){
  const APP='fbacc-revival';
  const STYLE='fbacc-revival-style';

  const st={
    root:null,overlay:null,log:null,
    tab:'dashboard',
    ctx:null,
    queue:[],
    running:false,
    stats:{total:0,done:0,ok:0,fail:0},
    settings:{trace:true,retries:1,timeoutMs:12000,delayMs:250}
  };

  const css=`
:root{--bg:#0f1715;--bg2:#0b1210;--ctl:#121f1b;--bd:#2b433a;--bd2:#22372f;--bd3:#2f4a40;--tx:#e8fff0;--lb:#c7e0d2;--mut:#99b3a6;--acc:#4dff8f;--accTx:#052012;--ok:#9bff7d;--wr:#ffd27d;--er:#ff8f8f}
#${APP}{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(860px,calc(100vw - 24px));max-height:calc(100vh - 40px);overflow:auto;z-index:2147483647;background:var(--bg);color:var(--tx);border:1px solid var(--bd);border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,.45);font:13px/1.4 Inter,"Segoe UI",Arial,sans-serif;padding:14px}
#${APP} *{box-sizing:border-box}
.h{display:flex;justify-content:space-between;position:relative;padding-right:34px;margin-bottom:8px}.h h2{margin:0;color:var(--acc);font-size:28px;line-height:1.05;font-weight:800}.m{margin-top:4px;color:var(--mut);font-size:11px}
.x{position:absolute;top:0;right:0;border:0;background:transparent;color:#d3e8dc;font-size:24px;font-weight:700;cursor:pointer}
.tabs{display:flex;gap:4px;border-bottom:1px solid var(--bd3);margin-bottom:8px;flex-wrap:wrap}.tab{border:0;background:transparent;color:var(--mut);padding:9px 10px;cursor:pointer;font:inherit;font-weight:700}.tab.a{color:var(--tx);border-bottom:2px solid var(--acc)}
.p{display:none}.p.a{display:block}.sec{margin-top:10px}.row{display:flex;gap:8px;flex-wrap:wrap}.row>*{flex:1;min-width:170px}
.btn{width:100%;border-radius:9px;border:1px solid var(--bd3);background:var(--ctl);color:var(--tx);padding:9px;font:inherit;cursor:pointer;font-weight:700}
.btn.p{background:var(--acc);color:var(--accTx);border-color:var(--acc)}
.btn:disabled{opacity:.6;cursor:not-allowed}
.kv{display:grid;grid-template-columns:190px 1fr;gap:6px 10px;font-size:12px;margin-top:6px}.kv b{color:var(--lb)}
.note{color:var(--mut);font-size:11px}.label{display:block;margin:8px 0 4px;color:var(--lb);font-size:12px}
.log{margin-top:10px;min-height:180px;max-height:340px;overflow:auto;border:1px solid var(--bd2);border-radius:10px;background:var(--bg2);padding:8px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;line-height:1.35}
.s{color:var(--ok)}.w{color:var(--wr)}.e{color:var(--er)}
.ov{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:2147483646}
.tg{display:flex;align-items:center;gap:8px}.tg input{accent-color:var(--acc)}
.in{width:100%;border-radius:9px;border:1px solid var(--bd3);background:var(--ctl);color:var(--tx);padding:9px;font:inherit}
`;

  const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
  const ts=()=>new Date().toLocaleTimeString('ru-RU',{hour12:false});
  const sh=(u)=>{try{const x=new URL(u);return `${x.hostname}${x.pathname}`;}catch(_){return String(u).slice(0,90);}};
  function L(m,t=''){ if(!st.log) return; const d=document.createElement('div'); d.className=t; d.textContent=`[${ts()}] ${m}`; st.log.appendChild(d); st.log.scrollTop=st.log.scrollHeight; }

  function inject(){ if(document.getElementById(STYLE)) return; const s=document.createElement('style'); s.id=STYLE; s.textContent=css; document.head.appendChild(s); }
  function destroy(){ st.overlay?.remove(); st.root?.remove(); document.getElementById(STYLE)?.remove(); window.removeEventListener('keydown',esc); }
  function esc(e){ if(e.key==='Escape') destroy(); }

  function parseCtx(){
    const q=new URLSearchParams(location.search);
    return {
      act:q.get('act')||null,
      businessId:q.get('business_id')||null,
      isAds:/\/adsmanager\//.test(location.pathname)||/business\.facebook\.com/.test(location.hostname),
      hasIUser:document.cookie.includes('i_user='),
      hasCUser:document.cookie.includes('c_user='),
      path:location.pathname,
      hash:location.hash||'—',
      url:location.href
    };
  }

  function tryRequire(name){ try{return window.require(name);}catch(_){return null;} }
  function legacyCtx(){
    const cur=tryRequire('CurrentUserInitialData');
    const dtsg=document.querySelector('[name="fb_dtsg"]')?.value||tryRequire('DTSGInitialData')?.token||null;
    const socid=cur?.USER_ID||((document.cookie.match(/c_user=(\d+)/)||[])[1]||null);
    let token=null;
    for(const s of document.getElementsByTagName('script')){ const m=(s.innerHTML||'').match(/"EA[A-Za-z0-9]{20,}/m); if(m){ token=m[0].slice(1); break; } }
    return {dtsg,socid,shortname:cur?.SHORT_NAME||null,tokenFound:!!token,tokenPreview:token?`${token.slice(0,10)}...${token.slice(-6)}`:'—'};
  }

  function errType(status,msg){ if(status===401||status===403) return 'auth'; if(status===429) return 'rate_limit'; if(status>=500) return 'server'; if(/network|fetch|failed|abort/i.test(msg||'')) return 'network'; return 'unknown'; }
  async function req(url,opt={}){
    const {method='GET',credentials='include',timeoutMs=st.settings.timeoutMs,retries=st.settings.retries,trace=st.settings.trace}=opt;
    let last=null;
    for(let i=0;i<=retries;i++){
      const ac=new AbortController(); const t=setTimeout(()=>ac.abort(),timeoutMs); const t0=performance.now();
      try{
        const r=await fetch(url,{method,credentials,signal:ac.signal}); clearTimeout(t);
        let j=null; try{j=await r.json();}catch(_){j=null;}
        const ms=Math.round(performance.now()-t0);
        if(r.ok){ if(trace) L(`REQ ${method} ${sh(url)} -> ${r.status} (${ms}ms)`,'s'); return {ok:true,status:r.status,data:j,dur:ms}; }
        const msg=j?.error?.message||`HTTP ${r.status}`; const et=errType(r.status,msg); if(trace) L(`REQ ${method} ${sh(url)} -> ${r.status} ${et} (${ms}ms)`,'w');
        last={ok:false,status:r.status,errorType:et,message:msg,data:j,dur:ms};
      }catch(e){ clearTimeout(t); const ms=Math.round(performance.now()-t0); const et=errType(0,e.message); if(trace) L(`REQ ${method} ${sh(url)} -> fail ${et} (${ms}ms)`,'e'); last={ok:false,status:0,errorType:et,message:e.message,data:null,dur:ms}; }
      if(i<retries) await wait(300*(i+1));
    }
    return last;
  }

  function setTab(tab){ st.tab=tab; st.root.querySelectorAll('.tab').forEach(b=>b.classList.toggle('a',b.dataset.tab===tab)); st.root.querySelectorAll('.p').forEach(p=>p.classList.toggle('a',p.dataset.panel===tab)); }
  function kv(el,obj){ el.innerHTML=Object.entries(obj).map(([k,v])=>`<div class="kv"><b>${k}</b><span>${v??'—'}</span></div>`).join(''); }

  async function refreshDashboard(){
    st.ctx=parseCtx();
    kv(st.root.querySelector('#dash-local'),{
      'Ads Manager контекст':st.ctx.isAds?'Да':'Нет','ID аккаунта (act)':st.ctx.act||'—','business_id':st.ctx.businessId||'—','Путь':st.ctx.path,'Hash':st.ctx.hash,
      'i_user cookie':st.ctx.hasIUser?'Да':'Нет','c_user cookie':st.ctx.hasCUser?'Да':'Нет'
    });
    const acc = st.ctx.act ? await req(`https://graph.facebook.com/v19.0/act_${st.ctx.act}?fields=id,name,currency,timezone_name`) : {ok:false,errorType:'missing',message:'Нет act'};
    kv(st.root.querySelector('#dash-acc'),{
      'Проверка аккаунта':acc.ok?'OK':`Ошибка (${acc.errorType||'unknown'})`,
      'Имя':acc.data?.name||'—','Валюта':acc.data?.currency||'—','Таймзона':acc.data?.timezone_name||'—'
    });
    L('Dashboard обновлён','s');
  }

  function refreshLegacy(){ const l=legacyCtx(); kv(st.root.querySelector('#legacy-box'),{'fb_dtsg':l.dtsg?'найден':'нет','socid':l.socid||'—','shortname':l.shortname||'—','token':l.tokenFound?'найден':'нет','preview':l.tokenPreview}); L('Legacy context обновлён','s'); }

  async function endpointChecks(){
    const c=st.ctx||parseCtx();
    const tests=[
      ['Graph act', c.act?`https://graph.facebook.com/v19.0/act_${c.act}?fields=id`:null],
      ['Graph business', c.businessId?`https://graph.facebook.com/v19.0/${c.businessId}?fields=id`:null],
      ['Current page', location.href]
    ];
    const out={};
    for(let i=0;i<tests.length;i++){
      const [n,url]=tests[i];
      if(!url){ out[`#${i+1} ${n}`]='Пропущен • нет данных'; continue; }
      const r=await req(url,{retries:0,timeoutMs:8000});
      out[`#${i+1} ${n}`]=r.ok?`OK • HTTP ${r.status}`:`Ошибка • ${r.errorType||'unknown'} ${r.status||''}`;
      await wait(st.settings.delayMs);
    }
    kv(st.root.querySelector('#diag-checks'),out); L('Endpoint checks завершены','s');
  }

  function diagRun(){
    const c=st.ctx||parseCtx();
    L('Диагностика окружения запущена');
    L(`Домен: ${location.hostname}`,/facebook\.com$/.test(location.hostname)?'s':'w');
    L(`Ads контекст: ${c.isAds?'да':'нет'}`,c.isAds?'s':'w');
    L(`act=${c.act||'нет'}`,c.act?'s':'w');
    L(`business_id=${c.businessId||'нет'}`,c.businessId?'s':'w');
    L(`cookies i_user=${c.hasIUser?'yes':'no'}, c_user=${c.hasCUser?'yes':'no'}`,(c.hasIUser||c.hasCUser)?'s':'w');
  }

  function queueAddTask(name,fn){ st.queue.push({name,fn}); st.stats.total=st.queue.length+st.stats.done; renderQueue(); }
  function queueReset(){ st.queue=[]; st.running=false; st.stats={total:0,done:0,ok:0,fail:0}; renderQueue(); }
  function renderQueue(){
    const box=st.root.querySelector('#queue-box');
    kv(box,{
      'В очереди':st.queue.length,
      'Выполнено':`${st.stats.done}/${st.stats.total}`,
      'Успех':st.stats.ok,
      'Ошибки':st.stats.fail,
      'Статус':st.running?'Выполняется':'Ожидание'
    });
  }
  async function queueRun(){
    if(st.running) return; st.running=true; renderQueue(); L('Запуск очереди задач','s');
    while(st.queue.length){
      const t=st.queue.shift(); renderQueue();
      try{ await t.fn(); st.stats.ok++; L(`TASK OK: ${t.name}`,'s'); }
      catch(e){ st.stats.fail++; L(`TASK FAIL: ${t.name} (${e.message})`,'e'); }
      st.stats.done++; renderQueue(); await wait(st.settings.delayMs);
    }
    st.running=false; renderQueue(); L('Очередь завершена','s');
  }

  async function withBusy(btn,label,fn){ if(!btn) return fn(); if(btn.dataset.busy==='1') return; const old=btn.textContent; btn.dataset.busy='1'; btn.disabled=true; btn.textContent=label||'Обработка...'; try{return await fn();}finally{btn.textContent=old;btn.disabled=false;btn.dataset.busy='0';}}

  function exportLog(){
    const lines=[...st.log.querySelectorAll('div')].map(x=>x.textContent).join('\n');
    const blob=new Blob([lines],{type:'text/plain;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`fbacc-log-${Date.now()}.txt`; a.click(); URL.revokeObjectURL(a.href); L('Лог экспортирован','s');
  }

  function applySettings(){
    const retries=Number(st.root.querySelector('#set-retries').value||1);
    const timeoutMs=Number(st.root.querySelector('#set-timeout').value||12000);
    const delayMs=Number(st.root.querySelector('#set-delay').value||250);
    const trace=st.root.querySelector('#set-trace').checked;
    st.settings={retries,timeoutMs,delayMs,trace};
    L(`Настройки применены: retries=${retries}, timeout=${timeoutMs}, delay=${delayMs}, trace=${trace}`,'s');
  }

  function copySummary(){ const c=st.ctx||parseCtx(); navigator.clipboard.writeText(`FBACC SNAPSHOT\nact=${c.act||'-'}\nbusiness_id=${c.businessId||'-'}\npath=${c.path}\nurl=${c.url}`).then(()=>L('Сводка скопирована','s')).catch(()=>L('Не удалось скопировать','w')); }

  function init(){
    destroy(); inject();
    st.overlay=document.createElement('div'); st.overlay.className='ov';
    st.root=document.createElement('section'); st.root.id=APP;
    st.root.innerHTML=`
<div class="h"><div><h2>FBACC Revival</h2><div class="m">Комплексный vNext • ускоренный путь к финалу</div></div><button class="x" aria-label="Закрыть">×</button></div>
<div class="tabs">
  <button class="tab a" data-tab="dashboard">Dashboard</button>
  <button class="tab" data-tab="diagnostics">Diagnostics</button>
  <button class="tab" data-tab="legacy">Legacy</button>
  <button class="tab" data-tab="queue">Queue</button>
  <button class="tab" data-tab="settings">Settings</button>
  <button class="tab" data-tab="tools">Tools</button>
</div>
<section class="p a" data-panel="dashboard">
  <div class="sec"><span class="label">Локальный контекст</span><div id="dash-local"></div></div>
  <div class="sec"><span class="label">Read-only профиль аккаунта</span><div id="dash-acc"></div></div>
  <div class="sec row"><button class="btn p" data-act="dash-refresh">Обновить dashboard</button><button class="btn" data-act="queue-fill">Добавить стандартный набор в очередь</button></div>
</section>
<section class="p" data-panel="diagnostics">
  <div class="note">Проверки окружения и endpoint health-check.</div>
  <div class="sec"><span class="label">Endpoint checks</span><div id="diag-checks"></div></div>
  <div class="sec row"><button class="btn p" data-act="diag-run">Запустить диагностику</button><button class="btn" data-act="diag-checks">Проверить endpoints</button></div>
</section>
<section class="p" data-panel="legacy">
  <div class="note">Read-only мост к legacy данным (только просмотр).</div>
  <div class="sec"><span class="label">Legacy context</span><div id="legacy-box"></div></div>
  <div class="sec row"><button class="btn" data-act="legacy-refresh">Обновить legacy context</button></div>
</section>
<section class="p" data-panel="queue">
  <div class="note">Очередь задач для пакетного read-only выполнения.</div>
  <div class="sec"><span class="label">Состояние очереди</span><div id="queue-box"></div></div>
  <div class="sec row"><button class="btn p" data-act="queue-run">Запустить очередь</button><button class="btn" data-act="queue-reset">Сбросить очередь</button></div>
</section>
<section class="p" data-panel="settings">
  <div class="note">Глобальные параметры request/queue.</div>
  <div class="sec row"><input id="set-retries" class="in" type="number" min="0" value="1" placeholder="retries"><input id="set-timeout" class="in" type="number" min="1000" value="12000" placeholder="timeout ms"><input id="set-delay" class="in" type="number" min="0" value="250" placeholder="delay ms"></div>
  <div class="sec tg"><input id="set-trace" type="checkbox" checked><label for="set-trace">Логировать request trace</label></div>
  <div class="sec row"><button class="btn" data-act="settings-apply">Применить настройки</button></div>
</section>
<section class="p" data-panel="tools">
  <div class="note">Безопасные утилиты.</div>
  <div class="sec row"><button class="btn" data-act="copy">Скопировать сводку</button><button class="btn" data-act="log-export">Экспорт лога</button><button class="btn" data-act="close">Закрыть</button></div>
</section>
<div class="sec"><span class="label">Системный лог</span><div id="app-log" class="log"></div></div>`;

    document.body.appendChild(st.overlay); document.body.appendChild(st.root); st.log=st.root.querySelector('#app-log');

    st.root.querySelector('.x').onclick=destroy; st.overlay.onclick=destroy; window.addEventListener('keydown',esc);
    st.root.querySelectorAll('.tab').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));

    st.root.querySelector('[data-act="dash-refresh"]').onclick=(e)=>withBusy(e.currentTarget,'Обновление...',refreshDashboard);
    st.root.querySelector('[data-act="diag-run"]').onclick=(e)=>withBusy(e.currentTarget,'Проверка...',async()=>diagRun());
    st.root.querySelector('[data-act="diag-checks"]').onclick=(e)=>withBusy(e.currentTarget,'Проверка...',endpointChecks);
    st.root.querySelector('[data-act="legacy-refresh"]').onclick=(e)=>withBusy(e.currentTarget,'Обновление...',async()=>refreshLegacy());

    st.root.querySelector('[data-act="queue-fill"]').onclick=()=>{
      queueAddTask('Refresh Dashboard',refreshDashboard);
      queueAddTask('Endpoint Checks',endpointChecks);
      queueAddTask('Refresh Legacy',async()=>refreshLegacy());
      L('Стандартный набор задач добавлен в очередь','s');
    };
    st.root.querySelector('[data-act="queue-run"]').onclick=(e)=>withBusy(e.currentTarget,'Выполнение...',queueRun);
    st.root.querySelector('[data-act="queue-reset"]').onclick=()=>{queueReset();L('Очередь сброшена','w');};

    st.root.querySelector('[data-act="settings-apply"]').onclick=(e)=>withBusy(e.currentTarget,'Применение...',async()=>applySettings());
    st.root.querySelector('[data-act="copy"]').onclick=(e)=>withBusy(e.currentTarget,'Копирование...',async()=>copySummary());
    st.root.querySelector('[data-act="log-export"]').onclick=(e)=>withBusy(e.currentTarget,'Экспорт...',async()=>exportLog());
    st.root.querySelector('[data-act="close"]').onclick=destroy;

    queueReset();
    L('fbacc vNext инициализирован','s');
    refreshDashboard();
    refreshLegacy();
    endpointChecks();
  }

  init();
})();
