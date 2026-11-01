/* town-link.js — forging, building upgrades, hero tab UI, engine hooks, click handler
 Needs from core.js: render newDay save init refresh sv bl cnt res IC toast calc spd
 Needs from hero.js / dungeon.js: HR tombs stash stat ens gate EL EI SK dg enter claim dFrame townTick townDraw saveH loadH lt
 Needs from items.js: RAR gearHtml equip unequip salvage salvageMagic wel ael
 Needs from core.js (extra): tap tool view follow w2 hintUI find N cam vm
 Provides: craft bump uc upgrade window.upgBtn window.vHero (called by core's refresh/vBld)
 Hooks: wraps render, newDay, save, init; wraps tap (tombstones), click handler for hl/hz/hc/ht/hu/he/hx/hs actions
 Load order: last (runs loadH(sv) at the end) */
/* --- TOWN INTEGRATION: forge gear (needs a Blacksmith) and upgrade buildings with rare gems --- */
function craft(sl,el){if(!cnt.smith)return toast('Build a Blacksmith first');let n=HR[sl].t+1;if(n>5)return toast('Already max tier');let g=(sl=='w'?60:50)*n,r=sl=='w'?'s':'w',q=(sl=='w'?10:15)*n,e=3*n;ens();
 if(res.g<g||res[r]<q||res.E[el]<e)return toast(`Need 🪙${g} ${IC[r]}${q} ${EI[el]}${e}`);res.g-=g;res[r]-=q;res.E[el]-=e;HR[sl]={t:n,el};toast((sl=='w'?'⚔️ Weapon':'🛡️ Armor')+' forged: tier '+n+' '+EI[el])}
const bump=b=>{b.lv=(b.lv||1)+1;['hap','bea','mag','tou'].forEach(k=>{if(b[k])b[k]++});if(b.home)b.home++},uc=b=>{let l=b.lv||1;return{g:80*l,w:20*l,s:20*l,gem:l}};
function upgrade(i){let b=bl[i];if(!b)return;let c=uc(b);ens();if((b.lv||1)>=4||res.g<c.g||res.w<c.w||res.s<c.s||res.gem<c.gem)return toast('Need 🪙'+c.g+' 🪵'+c.w+' 🪨'+c.s+' 💠'+c.gem);res.g-=c.g;res.w-=c.w;res.s-=c.s;res.gem-=c.gem;bump(b);calc();toast('⭐ '+b.n+' upgraded to level '+b.lv)}
window.upgBtn=b=>{if(b.d||(!b.job&&!b.home&&!b.hap))return'';let l=b.lv||1;if(l>=4)return'<br>⭐ Max level';let c=uc(b);return`<br>⭐ Level ${l}: +50% output, more appeal<div class="cr"><button data-a="hu:${bl.indexOf(b)}">⬆️ Upgrade · 🪙${c.g} 🪵${c.w} 🪨${c.s} 💠${c.gem}</button></div>`};
const tombHtml=(t,i)=>`<div class="q">🪦 <b>${t.n}</b> (Lv ${t.lv}) · slain by ${t.by||'?'}${t.fl?' on '+EI[t.z]+' floor '+t.fl:''}<br>🪙${t.p.g} 🪵${t.p.w} 🪨${t.p.s} 💠${t.p.gem} + gear${t.it&&t.it.length?' + 🎁 '+t.it.map(x=>`<span style="color:${RAR[x.r].c}">${x.n}</span>`).join(', '):''} <button data-a="ht:${i}">Recover</button></div>`;
window.vHero=()=>{ens();const S=stat(HR),G=gate(),tc_=k=>HR[k].t>=5?'max':`T${HR[k].t+1}: 🪙${(k=='w'?60:50)*(HR[k].t+1)} ${k=='w'?'🪨'+10*(HR[k].t+1):'🪵'+15*(HR[k].t+1)} ✨${3*(HR[k].t+1)}`;
 return(view&&view.tomb!=null&&tombs[view.tomb]?'<div class="r"><b>🪦 You tapped a tombstone</b></div>'+tombHtml(tombs[view.tomb],view.tomb):'')+`<div class="nh"><span class="pt">🧝</span><div><b>${HR.n}</b> · Lv ${HR.lv} ${HR.alive?'':'💀 arrives at the gate tomorrow'}<br><small>XP ${HR.xp}/${30*HR.lv} · skill points ${HR.sp}</small></div></div>`+(G?'':'<div class="r">⚠️ <b>No Dungeon Gate yet.</b> It needs 👥'+BK.portal.u+' villagers (you have '+npcs.length+') and '+cost(BK.portal)+'. Your hero waits in town until it is built.<div class="cr"><button data-a="hg:1">🌀 Build Dungeon Gate</button></div></div>')+`<div class="cr"><button data-a="hf:1">🎯 Find hero</button><button data-a="hm:1" ${HR.alive&&HR.on?'':'disabled'}>📍 Send hero…</button></div>`+
 `❤️ ${HR.hp|0}/${S.mhp} · ⚔️ ${S.atk}${wel()?EI[wel()]:''} · 🛡️ ${S.def}${ael()?EI[ael()]:''}<br><small>🎯 ${S.cr}% crit · 🩸 ${S.ls}% · 👟 +${S.ms}% · 🪙 +${S.gf}% · 📘 +${S.xp}%</small><br><small>Essence ${EL.map(e=>EI[e]+(res.E[e]|0)).join(' ')} · 💠 ${res.gem|0}</small>`+
 gearHtml()+'<div class="r"><b>Skills</b> · 1 point each · 🔥>🌪️>🪨>💧>🔥</div>'+EL.map(e=>'<div class="cr">'+SK.filter(k=>k.el==e).map(k=>HR.sk.includes(k.id)?`<button disabled>${k.e}${k.n}<br><small>${k.t}</small></button>`:`<button data-a="hl:${k.id}" ${HR.sp?'':'disabled'}>${k.e}${k.n}<br><small>${k.t} · learn</small></button>`).join('')+'</div>').join('')+
 `<div class="r"><b>Explore</b> ${G?'':'· build a 🌀 Dungeon Gate (Magic tab) first'}</div><div class="cr">`+EL.map(e=>`<button data-a="hz:${e}" ${G&&HR.alive&&HR.hp>0?'':'disabled'}>${EI[e]}</button>`).join('')+'</div>'+
 `<div class="r"><b>Forge</b> ${cnt.smith?'':'· needs a Blacksmith'}<br><small>⚔️ ${tc_('w')} · 🛡️ ${tc_('a')}</small></div><div class="cr">`+EL.map(e=>`<button data-a="hc:w:${e}">⚔️${EI[e]}</button>`).join('')+EL.map(e=>`<button data-a="hc:a:${e}">🛡️${EI[e]}</button>`).join('')+'</div>'+
 tombs.map(tombHtml).join('')};

/* --- PHASE 1: Hero overlay controls in town --- */
let heroTownOverlay = 0;
function toggleHeroTownOverlay(open) {
  heroTownOverlay = open ? 1 : 0;
  let ov = $('townHeroOverlay');
  if (ov) {
    ov.hidden = !open;
  }
  if (open) {
    let ds = $('th_ds');
    if (ds) {
      ds.innerHTML = HR.sk.map(id => {
        let k = SK.find(s => s.id == id);
        return `<button data-th="${id}" title="${k.n}">${k.e}</button>`;
      }).join('') + (HR.sk.length ? '' : '<small style="color:#fff">No skills</small>');
    }
  }
}

function updateTownHeroOverlay() {
  if (!heroTownOverlay || !HR) return;
  let S = stat(HR);
  let dh = $('th_dh');
  if (dh) {
    dh.textContent = `${HR.n} · Lv ${HR.lv} · ❤️ ${Math.max(0, HR.hp) | 0}/${S.mhp}` + (HR.b && HR.b.sh > 0 ? ` 🛡️${HR.b.shv | 0}` : '');
  }
  let ds = $('th_ds');
  if (ds && HR.sk) {
    [...ds.querySelectorAll('button[data-th]')].forEach(b => {
      let id = b.dataset.th, k = SK.find(s => s.id == id);
      if (k && HR.cd) {
        let c = HR.cd[id] || 0;
        b.style.opacity = c > 0 ? .4 : 1;
        b.textContent = k.e + (c > 0 ? ' ' + Math.ceil(c) : '');
      }
    });
  }
  let da = $('th_da');
  if (da && HR.b) {
    da.classList.toggle('on', !!HR.ah);
  }
}

function townHeroOverlayTick(dt) {
  if (!heroTownOverlay || !HR || !HR.alive) return;
  if (!HR.b) HR.b = { atk: 0, spd: 0, sh: 0, shv: 0, inv: 0 };
  if (!HR.cd) HR.cd = {};
  
  const b = HR.b, S = stat(HR);
  for (const k in HR.cd) HR.cd[k] -= dt;
  b.atk -= dt; b.spd -= dt; b.inv -= dt;
  if (b.sh > 0 && (b.sh -= dt) <= 0) b.shv = 0;

  const js = HR.js;
  if (js) {
    HR.path = [];
    let st = 3.2 * (1 + S.ms / 100) * (b.spd > 0 ? 1.6 : 1) * dt;
    let nx = HR.x + js.x * st, ny = HR.y + js.y * st;
    let ix = nx | 0, iy = ny | 0;
    if (ix >= 0 && iy >= 0 && ix < N && iy < N && !bg[iy * N + ix] && ter[iy * N + ix] != 3 && ter[iy * N + ix] != 4) {
      HR.x = nx; HR.y = ny;
    }
  }
  HR.on = 1;
}

const _r=render,_n=newDay,_s=save,_i=init;
render=t=>{
  let dt = Math.min(.1, t - (lt || t)) * spd;
  if (dg) { dFrame(t); return; }
  
  if (heroTownOverlay) {
    townHeroOverlayTick(dt);
  }
  
  _r(t);
  
  if (heroTownOverlay) {
    townDraw();
    updateTownHeroOverlay();
  } else {
    townTick(Math.min(.1, t - (lt || t)) * spd);
    townDraw();
  }
  lt = t;
};

newDay=()=>{_n();ens();if(HR&&!HR.alive&&--HR.rs<=0){HR.alive=1;HR.hp=stat(HR).mhp;HR.on=0;toast('🧝 '+HR.n+' arrives'+(gate()?' at the Dungeon Gate':' in town')+'!')}};
save=()=>{_s();saveH()};init=s=>{_i(s);loadH(s)};

addEventListener('click',e=>{
  let a=e.target.closest('[data-a]');
  if(!a) return;
  let[c,v,w]=a.dataset.a.split(':');ens();
  if(c=='hl'){if(HR.sp&&!HR.sk.includes(v)){HR.sp--;HR.sk.push(v)}}else if(c=='hz')enter(v);else if(c=='hc')craft(v,w);else if(c=='hm'){hcmd=1;view=null;toast('📍 Tap the map where your hero should go',5000)}else if(c=='hf'){if(HR.on){follow=HR;cam.tx=HR.x;cam.ty=HR.y;view=null}else toast('The hero is not in town right now')}else if(c=='hg'){tool='portal';view=null;vm=null;hintUI()}else if(c=='ht'){claim(+v);view={t:'hero'};toggleHeroTownOverlay(false);}else if(c=='hu')upgrade(+v);else if(c=='he')equip(+v);else if(c=='hx')unequip(v);else if(c=='hs')v=='m'?salvageMagic():salvage(+v);else return;
  refresh();
});

function initTownHeroOverlayDOM() {
  if ($('townHeroOverlay')) return;
  let d = document.createElement('div');
  d.id = 'townHeroOverlay';
  d.hidden = true;
  d.innerHTML = '<div id="th_dh"></div>' +
    '<div id="th_dj"><div id="th_dk"></div></div>' +
    '<div id="th_dr"><div id="th_ds"></div><div id="th_db"><button data-th="dodge" class="rb">💨</button><button id="th_da" class="rb big">⚔️</button></div></div>';
  document.body.appendChild(d);

  let st = document.createElement('style');
  st.textContent = '#townHeroOverlay{position:fixed;inset:0;z-index:18;pointer-events:none}' +
    '#th_dh{position:fixed;left:0;right:0;top:calc(54px + env(safe-area-inset-top,0px));padding:4px 10px;background:#0008;color:#fff;font-weight:700;text-align:center;pointer-events:none}' +
    '#th_dj{position:fixed;left:14px;bottom:calc(56px + env(safe-area-inset-bottom,0px));width:132px;height:132px;border-radius:50%;background:#fff2;border:2px solid #fff5;touch-action:none;pointer-events:auto}' +
    '#th_dk{position:absolute;left:38px;top:38px;width:56px;height:56px;border-radius:50%;background:#fff7;pointer-events:none}' +
    '#th_dr{position:fixed;right:10px;bottom:calc(52px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;align-items:flex-end;gap:10px;pointer-events:auto}' +
    '#th_ds{display:flex;flex-wrap:wrap-reverse;justify-content:flex-end;gap:6px;max-width:176px}' +
    '#th_db{display:flex;gap:10px;align-items:flex-end}' +
    '#townHeroOverlay .rb,#th_ds button{width:52px;height:52px;border-radius:50%;background:#fff3;border:2px solid #fff6;color:#fff;font-size:20px;line-height:1.05;padding:0;touch-action:none;pointer-events:auto}' +
    '#townHeroOverlay .big{width:78px;height:78px;font-size:32px;background:#e5484d99}' +
    '#th_da.on{background:#ff8a2bcc}';
  document.head.appendChild(st);

  d.onclick = e => {
    let b = e.target.closest('button[data-th]');
    if (!b || !HR) return;
    let id = b.dataset.th;
    if (id == 'dodge') {
      if (typeof dodge === 'function') dodge();
    } else {
      if (typeof cast === 'function') cast(id);
    }
  };

  const j = $('th_dj'), kn = $('th_dk');
  let jid = null;
  const jv = e => {
    let r = j.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), m = Math.hypot(dx, dy) || 1, R = r.width / 2, c = Math.min(m, R * .62);
    if (HR) HR.js = m > 9 ? { x: dx / m, y: dy / m, k: Math.min(1, m / R) } : null;
    kn.style.transform = `translate(${dx / m * c}px,${dy / m * c}px)`;
  };
  j.onpointerdown = e => { jid = e.pointerId; j.setPointerCapture(jid); jv(e); };
  j.onpointermove = e => { if (e.pointerId == jid) jv(e); };
  j.onpointerup = j.onpointercancel = e => { if (e.pointerId != jid) return; jid = null; if (HR) HR.js = null; kn.style.transform = 'translate(0,0)'; };

  const A = $('th_da');
  A.onpointerdown = e => { A.setPointerCapture(e.pointerId); if (HR) HR.ah = 1; A.classList.add('on'); };
  A.onpointerup = A.onpointercancel = () => { if (HR) HR.ah = 0; A.classList.remove('on'); };
}

setTimeout(initTownHeroOverlayDOM, 100);

const _t=tap;
tap=(sx,sy)=>{
  let[wx_,wy]=w2(sx,sy);
  if (HR && HR.alive && HR.on && Math.hypot(HR.x - wx_, HR.y - .4 - wy) < 0.7) {
    toggleHeroTownOverlay(true);
    view = null;
    refresh();
    hintUI();
    return;
  }
  if (heroTownOverlay) {
    toggleHeroTownOverlay(false);
    return;
  }

  if(hcmd&&!tool){hcmd=0;let X=wx_|0,Y=wy|0,p=HR&&HR.alive&&HR.on&&X>=0&&Y>=0&&X<N&&Y<N?find(HR.x|0,HR.y|0,X,Y):null;if(p){HR.path=p;HR.t=25;follow=HR;toast('🧝 '+HR.n+' is on the way')}else toast('🧝 Your hero can’t reach that spot');return}
  if(!tool){let i=tombs.findIndex(t=>wx_>=t.x&&wx_<t.x+1&&wy>=t.y-.1&&wy<t.y+.9);if(i>=0){view={t:'hero',tomb:i};follow=null;refresh();hintUI();return}}
  _t(sx,sy);
};

if(!gate())setTimeout(()=>toast('🧝 Build a 🌀 Dungeon Gate (🔨 Magic tab) (needs 👥8 villagers) so your hero can explore. Tap the hero for the ⚔️ panel.',7000),2500);
setInterval(saveH,30000);loadH(sv);
