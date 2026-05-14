javascript:(function(){
  const APP_ID='fbacc-revival';
  const STYLE_ID='fbacc-revival-style';

  const state={
    context:null,
    activeTab:'overview',
    logEl:null,
    root:null,
    overlay:null
  };

  const css=`
:root{--bg:#0f1715;--bg2:#0b1210;--ctl:#121f1b;--bd:#2b433a;--bd2:#22372f;--bd3:#2f4a40;--tx:#e8fff0;--lb:#c7e0d2;--mut:#99b3a6;--acc:#4dff8f;--accTx:#052012;--ok:#9bff7d;--wr:#ffd27d;--er:#ff8f8f}
#${APP_ID}{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(720px,calc(100vw - 24px));max-height:calc(100vh - 40px);overflow:auto;z-index:2147483647;background:var(--bg);color:var(--tx);border:1px solid var(--bd);border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,.45);font:13px/1.4 Inter,"Segoe UI",Arial,sans-serif;padding:14px}
#${APP_ID} *{box-sizing:border-box} #${APP_ID} h2{margin:0;color:var(--acc);font-size:28px;line-height:1.05;font-weight:800}
.fh{display:flex;justify-content:space-between;position:relative;padding-right:34px;margin-bottom:8px}.fm{margin-top:4px;color:var(--mut);font-size:11px}
.fc{position:absolute;top:0;right:0;border:0;background:transparent;color:#d3e8dc;font-size:24px;font-weight:700;cursor:pointer}
.tabs{display:flex;border-bottom:1px solid var(--bd3);margin-bottom:8px}.tab{flex:1;border:0;background:transparent;color:var(--mut);padding:9px 8px;cursor:pointer;font:inherit;font-weight:700}.tab.a{color:var(--tx);border-bottom:2px solid var(--acc)}
.p{display:none}.p.a{display:block}.sec{margin-top:10px}.row{display:flex;gap:8px}.row>*{flex:1}
.btn{width:100%;border-radius:9px;border:1px solid var(--bd3);background:var(--ctl);color:var(--tx);padding:9px;font:inherit;cursor:pointer;font-weight:700}
.btn.p{background:var(--acc);color:var(--accTx);border-color:var(--acc)}
.kv{display:grid;grid-template-columns:180px 1fr;gap:6px 10px;font-size:12px;margin-top:6px}.kv b{color:var(--lb)}
.note{color:var(--mut);font-size:11px}.label{display:block;margin:8px 0 4px;color:var(--lb);font-size:12px}
.log{margin-top:10px;min-height:140px;max-height:300px;overflow:auto;border:1px solid var(--bd2);border-radius:10px;background:var(--bg2);padding:8px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;line-height:1.35}
.s{color:var(--ok)}.w{color:var(--wr)}.e{color:var(--er)}
.ov{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:2147483646}
`;

  function t(){return new Date().toLocaleTimeString('ru-RU',{hour12:false});}
  function log(msg,type='i'){if(!state.logEl)return;const d=document.createElement('div');d.className=type==='i'?'':type;d.textContent=`[${t()}] ${msg}`;state.logEl.appendChild(d);state.logEl.scrollTop=state.logEl.scrollHeight;}

  function injectStyle(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=css;document.head.appendChild(s);}
  function destroy(){state.overlay?.remove();state.root?.remove();document.getElementById(STYLE_ID)?.remove();window.removeEventListener('keydown',onEsc);} 
  function onEsc(e){if(e.key==='Escape') destroy();}

  function parseContext(){
    const q=new URLSearchParams(location.search);
    const act=q.get('act')||null;
    const businessId=q.get('business_id')||null;
    const isAds=/\/adsmanager\//.test(location.pathname)||/business\.facebook\.com/.test(location.hostname);
    const hasIUser=document.cookie.includes('i_user=');
    const hasCUser=document.cookie.includes('c_user=');
    return {act,businessId,isAds,hasIUser,hasCUser,url:location.href,path:location.pathname,hash:location.hash||'—'};
  }

  function renderKV(target,obj){target.innerHTML=Object.entries(obj).map(([k,v])=>`<div class="kv"><b>${k}</b><span>${v??'—'}</span></div>`).join('');}


  function tryRequire(path){
    try { return window.require(path); } catch(_) { return null; }
  }

  function extractLegacyContext(){
    const dtsgNode=document.querySelector('[name="fb_dtsg"]');
    const dtsg=dtsgNode?.value||tryRequire('DTSGInitialData')?.token||null;
    const currentUser=tryRequire('CurrentUserInitialData');
    const socid=currentUser?.USER_ID||((document.cookie.match(/c_user=(\d+)/)||[])[1]||null);
    const shortname=currentUser?.SHORT_NAME||null;

    let token=null;
    const scripts=document.getElementsByTagName('script');
    const re=/"EA[A-Za-z0-9]{20,}/gm;
    for(let i=0;i<scripts.length;i++){
      const html=scripts[i].innerHTML||'';
      const m=html.match(re);
      if(m&&m[0]){ token=m[0].slice(1); break; }
    }

    return {dtsg,socid,shortname,tokenFound:!!token,tokenPreview:token?`${token.slice(0,10)}...${token.slice(-6)}`:'—'};
  }

  async function safeFetchAccountSnapshot(){
    const c=state.context;
    if(!c.act) return {status:'Нет act в URL',name:'—',currency:'—',timezone:'—'};
    // Read-only probe; token-less request might fail, we handle softly.
    try{
      const res=await fetch(`https://graph.facebook.com/v19.0/act_${c.act}?fields=id,name,currency,timezone_name`,{credentials:'include'});
      const j=await res.json();
      if(j.error) return {status:`Ошибка: ${j.error.message||'unknown'}`,name:'—',currency:'—',timezone:'—'};
      return {status:'OK',name:j.name||'—',currency:j.currency||'—',timezone:j.timezone_name||'—'};
    }catch(e){
      return {status:'Сетевой/доступ: недоступно',name:'—',currency:'—',timezone:'—'};
    }
  }

  function switchTab(tab){
    state.activeTab=tab;
    state.root.querySelectorAll('.tab').forEach(x=>x.classList.toggle('a',x.dataset.tab===tab));
    state.root.querySelectorAll('.p').forEach(x=>x.classList.toggle('a',x.dataset.panel===tab));
  }

  async function refreshOverview(){
    const c=parseContext(); state.context=c;
    const box=state.root.querySelector('#ov-context');
    renderKV(box,{
      'Ads Manager контекст':c.isAds?'Да':'Нет',
      'ID аккаунта (act)':c.act||'—',
      'business_id':c.businessId||'—',
      'Путь':c.path,
      'Hash':c.hash,
      'i_user cookie':c.hasIUser?'Да':'Нет',
      'c_user cookie':c.hasCUser?'Да':'Нет'
    });
    log('Базовый контекст обновлён','s');

    const remote=await safeFetchAccountSnapshot();
    renderKV(state.root.querySelector('#ov-remote'),{
      'Проверка Graph API':remote.status,
      'Имя аккаунта':remote.name,
      'Валюта':remote.currency,
      'Таймзона':remote.timezone
    });
    log('Read-only проверка аккаунта завершена','s');
  }

  function refreshLegacy(){
    const l=extractLegacyContext();
    renderKV(state.root.querySelector('#ov-legacy'),{
      'fb_dtsg':l.dtsg?'найден':'нет',
      'socid (c_user/CurrentUser)':l.socid||'—',
      'shortname':l.shortname||'—',
      'access token':l.tokenFound?'найден (preview ниже)':'не найден',
      'token preview':l.tokenPreview
    });
    log('Legacy context обновлён (read-only)','s');
  }



  async function runReadOnlyChecks(){
    const c=state.context||parseContext();
    const checks=[];

    const endpoints=[
      {name:'Graph act endpoint',url:c.act?`https://graph.facebook.com/v19.0/act_${c.act}?fields=id` : null},
      {name:'Business endpoint',url:c.businessId?`https://graph.facebook.com/v19.0/${c.businessId}?fields=id,name` : null},
      {name:'Current page probe',url:location.href}
    ];

    for(const e of endpoints){
      if(!e.url){ checks.push([e.name,'Пропущен','Недостаточно данных']); continue; }
      try{
        const r=await fetch(e.url,{method:'GET',credentials:'include'});
        checks.push([e.name, r.ok?'OK':'Ошибка', `HTTP ${r.status}`]);
      }catch(err){
        checks.push([e.name,'Ошибка','network/fetch']);
      }
    }

    const out={};
    checks.forEach((x,i)=>{ out[`#${i+1} ${x[0]}`]=`${x[1]} • ${x[2]}`; });
    renderKV(state.root.querySelector('#ov-checks'),out);
    log('Endpoint checks завершены (read-only)','s');
  }

  function runDiagnostics(){
    const c=state.context||parseContext();
    log('Диагностика окружения запущена','i');
    log(`Домен: ${location.hostname}`,/facebook\.com$/.test(location.hostname)?'s':'w');
    log(`Ads контекст: ${c.isAds?'да':'нет'}`,c.isAds?'s':'w');
    log(`act в URL: ${c.act||'не найден'}`,c.act?'s':'w');
    log(`business_id в URL: ${c.businessId||'не найден'}`,c.businessId?'s':'w');
    log(`Cookie профиль: i_user=${c.hasIUser?'есть':'нет'}, c_user=${c.hasCUser?'есть':'нет'}`,(c.hasIUser||c.hasCUser)?'s':'w');
  }

  function copySummary(){
    const c=state.context||parseContext();
    const text=`FBACC REVIVAL SNAPSHOT\nact=${c.act||'-'}\nbusiness_id=${c.businessId||'-'}\npath=${c.path}\nurl=${c.url}`;
    navigator.clipboard.writeText(text).then(()=>log('Сводка скопирована в буфер','s')).catch(()=>log('Не удалось скопировать в буфер','w'));
  }

  function init(){
    destroy(); injectStyle();
    const ov=document.createElement('div');ov.className='ov';
    const root=document.createElement('section');root.id=APP_ID;
    root.innerHTML=`
<div class="fh"><div><h2>FBACC Revival</h2><div class="fm">Полное обновление • Bookmarklet vNext (read-only core)</div></div><button class="fc" aria-label="Закрыть">×</button></div>
<div class="tabs">
  <button class="tab a" data-tab="overview">Обзор</button>
  <button class="tab" data-tab="diag">Диагностика</button>
  <button class="tab" data-tab="legacy">Legacy</button><button class="tab" data-tab="tools">Инструменты</button>
</div>
<section class="p a" data-panel="overview">
  <div class="sec"><span class="label">Локальный контекст</span><div id="ov-context"></div></div>
  <div class="sec"><span class="label">Read-only проверка аккаунта</span><div id="ov-remote"></div></div>
  <div class="sec"><span class="label">Endpoint checks</span><div id="ov-checks"></div></div>
  <div class="sec row"><button class="btn" data-act="checks">Проверить endpoints</button><button class="btn" data-act="refresh">Обновить контекст</button></div>
</section>
<section class="p" data-panel="diag">
  <div class="note">Панель запускает диагностические проверки окружения и пишет результат в лог.</div>
  <div class="sec row"><button class="btn p" data-act="diag">Запустить диагностику</button><button class="btn" data-act="refresh">Обновить контекст</button></div>
</section>
<section class="p" data-panel="legacy">
  <div class="note">Read-only мост к legacy-контексту (без выполнения рискованных действий).</div>
  <div class="sec"><span class="label">Legacy context</span><div id="ov-legacy"></div></div>
  <div class="sec row"><button class="btn" data-act="legacy">Обновить legacy context</button><button class="btn" data-act="refresh">Обновить общий контекст</button></div>
</section>
<section class="p" data-panel="tools">
  <div class="note">Только безопасные действия без мутаций данных.</div>
  <div class="sec row"><button class="btn" data-act="copy">Скопировать сводку</button><button class="btn" data-act="close">Закрыть окно</button></div>
</section>
<div class="sec"><span class="label">Системный лог</span><div id="app-log" class="log"></div></div>`;

    document.body.appendChild(ov);document.body.appendChild(root);
    state.root=root;state.overlay=ov;state.logEl=root.querySelector('#app-log');

    root.querySelector('.fc').onclick=destroy; ov.onclick=destroy; window.addEventListener('keydown',onEsc);
    root.querySelectorAll('.tab').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
    root.querySelector('[data-act="diag"]').onclick=runDiagnostics;
    root.querySelector('[data-act="checks"]').onclick=runReadOnlyChecks;
    root.querySelector('[data-act="copy"]').onclick=copySummary;
    root.querySelector('[data-act="legacy"]').onclick=refreshLegacy;
    root.querySelector('[data-act="close"]').onclick=destroy;
    root.querySelectorAll('[data-act="refresh"]').forEach(b=>b.onclick=()=>refreshOverview());

    log('Инициализация нового fbacc.js завершена','s');
    refreshOverview();
    refreshLegacy();
    runReadOnlyChecks();
  }

  init();
})();
