/* town-hero.js — control the hero on the town map: virtual stick, hold-to-attack, skills, defend vs raiders,
   walk-to-portal prompt, game-over screen
 Needs from core.js: bl bg rd ter N T K CW CH g cam follow view tool spd res calc assign toast refresh $ clamp spr townHallDestroyed D
 Needs from hero.js: HR SK EL EI MO stat mult gainXP randomPortals THCon destroyBld
 Needs from items.js: wel
 Needs from dungeon.js: dg enter
 Provides: THC thToggle thRaiders thCast thStep thUI thWalk
 Hooks: wraps render (controls, fx, UI refresh). Load order: last (after housing.js) */
const THC={on:0,js:null,ah:0,cd:{},b:{atk:0,spd:0},at:0,fx:[],near:null,snooze:null,ui:0,lt:0,prompt:null};
const TH_EN={fire:'Ember',water:'Tidal',earth:'Stone',wind:'Gale'};
const TH_COL={fire:'#ff6a2b',water:'#3ab0ff',earth:'#a98a3c',wind:'#8fe3c4'};

const thRaiders=()=>{let a=[];randomPortals.forEach(p=>p.raidWave.forEach(r=>a.push({r,p})));return a};
const thNear=(max)=>{let b=null,bd=max;for(const o of thRaiders()){let d=Math.hypot(o.r.x-HR.x,o.r.y+.2-HR.y);if(d<bd){bd=d;b=o}}return b?[b,bd]:[null,99]};
const thWalk=(x,y)=>{if(x<0||y<0||x>=N||y>=N)return 0;let i=(y|0)*N+(x|0),t=ter[i];if((t==3||t==4)&&rd[i]!=3)return 0;if(bg[i]&&!bg[i].d)return 0;return 1};
const thFx=(x,y,t,c)=>THC.fx.push({k:'t',x,y,t,c:c||'#fff',l:1.1});

function thToggle(){
  if(!HR||!HR.alive||dg)return;
  THC.on=THC.on?0:1;THC.js=null;THC.ah=0;view=null;tool=null;
  if(THC.on){follow=HR;toast('🎮 Controlling your hero · tap the hero again to stop',2600)}
  else follow=null;
  refresh();hintUI();thUI(1);
}

function thKill(o){
  let a=o.p.raidWave,i=a.indexOf(o.r);if(i>=0)a.splice(i,1);
  gainXP(6);res.g+=4;thFx(o.r.x,o.r.y-.6,'+6 XP','#9f9');
  if(!a.length)o.p.mons=0;
}
function thHit(o,dmg,el){
  let S=stat(HR),x=mult(el,o.r.el),crit=Math.random()*100<S.cr,d=Math.max(1,Math.round(dmg*x*(.85+Math.random()*.3)*(crit?1.7:1)));
  o.r.hp-=d;thFx(o.r.x,o.r.y-.7,(crit?'💥':'')+d,x>1?'#ffd36a':x<1?'#aab':'#fff');
  if(S.ls&&HR.hp<S.mhp)HR.hp=Math.min(S.mhp,HR.hp+d*S.ls/100);
  if(o.r.hp<=0)thKill(o);
}

function thCast(id){
  if(!HR||!HR.alive||dg||!HR.sk.includes(id))return;
  let k=SK.find(s=>s.id==id);if(!k||(THC.cd[id]||0)>0)return;
  let S=stat(HR),lvl=(HR.slvl&&HR.slvl[id])||1,pw=1+(lvl-1)*.25,B=THC.b;
  if(k.t=='atk'){
    let[o,d]=thNear(9);if(!o)return thFx(HR.x,HR.y-.8,'No target','#ccc');
    THC.fx.push({k:'p',x:HR.x,y:HR.y-.3,tx:o.r.x,ty:o.r.y-.3,e:k.e,l:.28,m:.28});
    thHit(o,S.atk*1.8*pw,k.el);
    for(const q of thRaiders())if(q.r!==o.r&&Math.hypot(q.r.x-o.r.x,q.r.y-o.r.y)<1.2&&q.r.hp>0)thHit(q,S.atk*.8*pw,k.el);
  }else if(k.t=='def'){
    // Ward: repairs nearby buildings and shoves + stuns raiders close to the hero
    let n=0;for(const b of bl)if(!b.dead&&Math.hypot(b.x+.5-HR.x,b.y+.5-HR.y)<7){b.hp=Math.min(b.mhp,b.hp+b.mhp*.3*pw);n++}
    for(const q of thRaiders()){let dx=q.r.x-HR.x,dy=q.r.y-HR.y,d=Math.hypot(dx,dy)||1;if(d<3.2){q.r.stun=1.5*pw;let nx=q.r.x+dx/d*1.8,ny=q.r.y+dy/d*1.8;if(thWalk(nx,ny)){q.r.x=nx;q.r.y=ny}}}
    THC.fx.push({k:'r',x:HR.x,y:HR.y,c:TH_COL[k.el],l:.6,m:.6,r:7});
    thFx(HR.x,HR.y-.9,k.e+' Ward'+(n?' · repaired '+n:''),'#fff');
  }else{
    if(k.el=='fire'){B.atk=6*pw;thFx(HR.x,HR.y-.9,k.e+' Attack up','#fb8')}
    else if(k.el=='wind'){B.spd=6*pw;thFx(HR.x,HR.y-.9,k.e+' Haste','#9fe')}
    else if(k.el=='water'){HR.hp=Math.min(S.mhp,HR.hp+S.mhp*.35*pw);for(const b of bl)if(!b.dead&&Math.hypot(b.x+.5-HR.x,b.y+.5-HR.y)<5)b.hp=Math.min(b.mhp,b.hp+b.mhp*.15*pw);THC.fx.push({k:'r',x:HR.x,y:HR.y,c:TH_COL.water,l:.6,m:.6,r:5});thFx(HR.x,HR.y-.9,k.e+' Healing','#9cf')}
    else{for(const q of thRaiders())if(Math.hypot(q.r.x-HR.x,q.r.y-HR.y)<8)q.r.slow=6*pw;THC.fx.push({k:'r',x:HR.x,y:HR.y,c:TH_COL.earth,l:.6,m:.6,r:8});thFx(HR.x,HR.y-.9,k.e+' Raiders slowed','#dc9')}
  }
  THC.cd[id]=Math.max(1,k.cd-(lvl-1)*.4);
}

function thStep(dt){
  const act=THC.on&&HR&&HR.alive&&!dg;
  if(!act){if(THC.on&&(dg||!HR||!HR.alive)){THC.on=0;THC.js=null;THC.ah=0;thUI(1)}return}
  for(const k in THC.cd)THC.cd[k]-=dt;THC.b.atk-=dt;THC.b.spd-=dt;THC.at-=dt;
  follow=HR;
  const S=stat(HR),spd_=3.2*(1+S.ms/100)*(THC.b.spd>0?1.6:1);
  let[o,d]=thNear(10),mv=null;
  if(THC.js)mv={x:THC.js.x,y:THC.js.y,k:Math.max(.35,THC.js.k||1)};
  else if(THC.ah&&o&&d>1.1){let dx=o.r.x-HR.x,dy=o.r.y-HR.y,m=Math.hypot(dx,dy)||1;mv={x:dx/m,y:dy/m,k:1}}
  if(mv){let st=spd_*mv.k*dt,nx=HR.x+mv.x*st,ny=HR.y+mv.y*st;if(thWalk(nx,HR.y))HR.x=nx;if(thWalk(HR.x,ny))HR.y=ny;HR.path=[];HR.act='Under your control'}
  HR.x=clamp(HR.x,.5,N-.5);HR.y=clamp(HR.y,.5,N-.5);
  // auto-attack nearest raider in reach
  if(THC.at<=0){let[q,qd]=thNear(1.5);if(q){THC.at=THC.b.spd>0?.55:.8;thHit(q,S.atk*(THC.b.atk>0?1.5:1),wel())}}
  // portal proximity
  let np=randomPortals.find(p=>Math.hypot(p.x+.5-HR.x,p.y+.5-HR.y)<1.3)||null;
  if(THC.snooze&&Math.hypot(THC.snooze.x+.5-HR.x,THC.snooze.y+.5-HR.y)>2.6)THC.snooze=null;
  if(np&&np!==THC.snooze&&!THC.prompt){THC.prompt=np;THC.js=null;THC.ah=0;thPrompt(np)}
  THC.fx.forEach(e=>{e.l-=dt;if(e.k=='t')e.y-=dt*.6});THC.fx=THC.fx.filter(e=>e.l>0);
}

function thPrompt(p){
  let m=$('thp');m.hidden=false;
  m.innerHTML=`<div class="thc"><div style="font-size:42px">🌀 ${EI[p.el]}</div><b>${TH_EN[p.el]} Dungeon</b><br><small>Element: ${p.el} · monsters ${MO[p.el].join(' ')} · a guardian boss waits every 5th floor</small><br><small>Your hero: Lv ${HR.lv} · ❤️ ${HR.hp|0}/${stat(HR).mhp}</small><div class="cr" style="justify-content:center;margin-top:10px"><button data-th="go">⚔️ Enter dungeon</button><button data-th="no">Not now</button></div></div>`;
}
function thClosePrompt(snooze){let m=$('thp');m.hidden=true;if(snooze)THC.snooze=THC.prompt;THC.prompt=null}

// ---------- UI ----------
function thBuild(){
  if($('th'))return;
  let st=document.createElement('style');
  st.textContent='#th{position:fixed;inset:0;z-index:8;pointer-events:none}#th[hidden]{display:none}#th *{touch-action:none;user-select:none;-webkit-user-select:none}'+
  '#tj{pointer-events:auto;position:absolute;left:14px;bottom:calc(64px + env(safe-area-inset-bottom,0px));width:124px;height:124px;border-radius:50%;background:#fff3;border:2px solid #fff6}'+
  '#tk{position:absolute;left:35px;top:35px;width:54px;height:54px;border-radius:50%;background:#fff9;pointer-events:none}'+
  '#tr{pointer-events:none;position:absolute;right:10px;bottom:calc(60px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;align-items:flex-end;gap:22px}'+
  '#ts{display:flex;flex-wrap:wrap-reverse;justify-content:flex-end;gap:22px 6px;max-width:190px;pointer-events:none}'+
  '#ts button,#ta{pointer-events:auto;position:relative;width:52px;height:52px;border-radius:50%;background:#0007;border:3px solid #fff6;color:#fff;font-size:22px;line-height:1;padding:0}'+
  '#ta{width:76px;height:76px;font-size:32px;background:#e5484d99;border-color:#fff7}#ta.on{background:#ff8a2bcc}'+
  '#tx{pointer-events:auto;position:absolute;left:10px;bottom:calc(196px + env(safe-area-inset-bottom,0px));background:#0009;color:#fff;border-radius:14px;padding:4px 10px;font-size:13px}'+
  '#th .sn{position:absolute;left:-8px;right:-8px;bottom:-15px;font-size:9px;line-height:1;text-align:center;color:#fff;text-shadow:0 0 3px #000,0 0 3px #000}#th .sl{position:absolute;top:-4px;right:-4px;font-size:9px;background:#000b;color:#fff;padding:1px 3px;border-radius:6px}'+
  '#th .cdn{position:absolute;inset:0;display:grid;place-items:center;font-size:20px;color:#fff;background:#000b;border-radius:50%}'+
  '#thn{position:absolute;right:10px;bottom:calc(150px + env(safe-area-inset-bottom,0px));color:#fff;font-size:12px;text-align:right;text-shadow:0 0 3px #000}'+
  '#thh{position:absolute;left:10px;max-width:170px;bottom:calc(232px + env(safe-area-inset-bottom,0px));text-align:left;color:#fff;font-weight:700;text-shadow:0 0 3px #000;pointer-events:none;font-size:13px}'+
  '#thp,#thg{position:fixed;inset:0;z-index:30;background:#000a;display:grid;place-items:center}#thp[hidden],#thg[hidden]{display:none}'+
  '.thc{background:var(--pn,#fff);color:var(--tx,#222);padding:18px 20px;border-radius:18px;text-align:center;max-width:300px;box-shadow:0 4px 24px #0008}.thc button{padding:8px 12px;margin:0 3px}';
  document.head.appendChild(st);
  let d=document.createElement('div');d.id='th';d.hidden=true;
  d.innerHTML='<div id="thh"></div><button id="tx">✕ Stop controlling</button><div id="tj"><div id="tk"></div></div><div id="tr"><div id="ts"></div><div id="thn"></div><button id="ta">⚔️</button></div>';
  document.body.appendChild(d);
  let p=document.createElement('div');p.id='thp';p.hidden=true;document.body.appendChild(p);
  let go=document.createElement('div');go.id='thg';go.hidden=true;document.body.appendChild(go);
  const j=$('tj'),kn=$('tk');let jid=null;
  const jv=e=>{let r=j.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),m=Math.hypot(dx,dy)||1,R=r.width/2,c=Math.min(m,R*.62);THC.js=m>9?{x:dx/m,y:dy/m,k:Math.min(1,m/R)}:null;kn.style.transform=`translate(${dx/m*c}px,${dy/m*c}px)`};
  j.onpointerdown=e=>{jid=e.pointerId;j.setPointerCapture(jid);jv(e)};j.onpointermove=e=>{if(e.pointerId==jid)jv(e)};
  j.onpointerup=j.onpointercancel=e=>{if(e.pointerId!=jid)return;jid=null;THC.js=null;kn.style.transform='translate(0,0)'};
  const A=$('ta');A.onpointerdown=e=>{A.setPointerCapture(e.pointerId);THC.ah=1;A.classList.add('on')};A.onpointerup=A.onpointercancel=()=>{THC.ah=0;A.classList.remove('on')};
  $('tx').onclick=()=>thToggle();
  $('ts').onclick=e=>{let b=e.target.closest('button[data-ts]');if(b)thCast(b.dataset.ts)};
  p.onclick=e=>{let b=e.target.closest('[data-th]');if(!b)return;if(b.dataset.th=='go'){let pp=THC.prompt;thClosePrompt(0);if(pp&&randomPortals.includes(pp)){randomPortals.splice(randomPortals.indexOf(pp),1);randomPortals.unshift(pp);THC.js=null;THC.ah=0;THC.on=0;enter(pp.el)}}else thClosePrompt(1)};
  go.onclick=e=>{if(e.target.closest('[data-th=new]')){try{localStorage.removeItem('fh1');localStorage.removeItem('fh1h')}catch(x){}location.reload()}};
  addEventListener('keydown',e=>{if(!THC.on||dg)return;let k=e.code;if(k=='KeyF')THC.ah=1;else{let i=+e.key;if(i>=1&&i<=HR.sk.length)thCast(HR.sk[i-1])}});
  addEventListener('keyup',e=>{if(e.code=='KeyF')THC.ah=0});
  // keyboard move
  const KK={};addEventListener('keydown',e=>{KK[e.code]=1;thKey(KK)});addEventListener('keyup',e=>{KK[e.code]=0;thKey(KK)});
  function thKey(K_){if(!THC.on||dg)return;let x=(K_.KeyD||K_.ArrowRight?1:0)-(K_.KeyA||K_.ArrowLeft?1:0),y=(K_.KeyS||K_.ArrowDown?1:0)-(K_.KeyW||K_.ArrowUp?1:0),m=Math.hypot(x,y);if(jid==null)THC.js=m?{x:x/m,y:y/m,k:1}:null}
}

function thUI(force){
  thBuild();
  const show=THC.on&&HR&&HR.alive&&!dg&&!view&&!tool&&!townHallDestroyed&&!THC.prompt;
  $('th').hidden=!show;
  if(!HR||!show&&!force)return;
  if(THC.on&&show){
    let S=stat(HR),R=thRaiders().length;
    $('thh').textContent=`🧝 ${HR.n} · ❤️ ${HR.hp|0}/${S.mhp}`+(R?` · 👺 ${R} raider${R>1?'s':''} attacking!`:'');
    $('thn').innerHTML=HR.sk.length?'':'No skills yet.<br>Learn some in the ⚔️ tab.';
    let ids=HR.sk.join(',');
    if($('ts').dataset.k!==ids){$('ts').dataset.k=ids;$('ts').innerHTML=HR.sk.map(id=>{let k=SK.find(s=>s.id==id);return`<button data-ts="${id}" title="${k.n}: ${k.desc}" style="border-color:${TH_COL[k.el]}"></button>`}).join('')}
    [...$('ts').querySelectorAll('button')].forEach(b=>{let id=b.dataset.ts,k=SK.find(s=>s.id==id),c=THC.cd[id]||0,l=(HR.slvl&&HR.slvl[id])||1;
      let h=k.e+'<small class="sn">'+k.n+'</small><small class="sl">L'+l+'</small>'+(c>0?'<b class="cdn">'+Math.ceil(c)+'</b>':'');if(b.dataset.h!==h){b.dataset.h=h;b.innerHTML=h}})
  }
}

function thGameOver(){
  let go=$('thg');if(!go)return;
  if(townHallDestroyed&&go.hidden){go.hidden=false;THC.on=0;
    go.innerHTML=`<div class="thc"><div style="font-size:46px">💀</div><b>Game over</b><br>The Town Hall has fallen to the monsters.<br><small>Your town survived ${D} day${D==1?'':'s'}.</small><div class="cr" style="justify-content:center;margin-top:12px"><button data-th="new">🔄 Start a new town</button></div></div>`;
    if($('th'))$('th').hidden=true;$('thp').hidden=true}
}

function thDrawFx(){
  if(!THC.fx.length)return;
  const s=T*cam.z*K;g.setTransform(s,0,0,s,CW/2-cam.x*s,CH/2-cam.y*s);g.textAlign='center';
  for(const e of THC.fx){
    if(e.k=='p'){let f=1-e.l/e.m,x=e.x+(e.tx-e.x)*f,y=e.y+(e.ty-e.y)*f;g.drawImage(spr(e.e),x-.25,y-.25,.5,.5)}
    else if(e.k=='r'){let f=1-e.l/e.m;g.globalAlpha=1-f;g.strokeStyle=e.c;g.lineWidth=.12;g.beginPath();g.arc(e.x,e.y,e.r*f,0,7);g.stroke();g.globalAlpha=1}
    else{g.globalAlpha=Math.min(1,e.l*1.6);g.font='bold .38px system-ui';g.lineWidth=.08;g.strokeStyle='#000';g.strokeText(e.t,e.x,e.y);g.fillStyle=e.c;g.fillText(e.t,e.x,e.y);g.globalAlpha=1}
  }
  g.setTransform(1,0,0,1,0,0);
}
function thRing(){
  if(!THC.on||!HR||!HR.alive||dg)return;
  const s=T*cam.z*K;g.setTransform(s,0,0,s,CW/2-cam.x*s,CH/2-cam.y*s);
  g.strokeStyle='rgba(255,230,120,.9)';g.lineWidth=.07;g.beginPath();g.ellipse(HR.x,HR.y+.03,.42+Math.sin(performance.now()/200)*.03,.18,0,0,7);g.stroke();
  g.setTransform(1,0,0,1,0,0);
}

const _thr=render;let _thT=0;
render=t=>{
  let dt=Math.min(.1,Math.max(0,t-_thT));_thT=t;
  if(townHallDestroyed){spd=0;thGameOver()}
  if(dg){_thr(t);return}
  thStep(dt);_thr(t);thRing();thDrawFx();
  if((THC.ui-=dt)<=0){THC.ui=.12;thUI()}
};

addEventListener('click',e=>{
  let a=e.target.closest('[data-a]');if(!a)return;let[c]=a.dataset.a.split(':');
  if(c=='hc'){if(HR&&HR.alive&&!dg&&!THC.on)thToggle();else if(THC.on){view=null;refresh();thUI(1)}}
  else if(c=='hf'&&THC.on)follow=HR;
});
thBuild();
