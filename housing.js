/* housing.js — housing overview: occupancy per home, villager limit (beds), immigration conditions, map badges
 Needs from core.js: bl npcs res M view tool follow cam sheet g T K CW CH bar refresh vStats render
 Provides: hov housingInfo vHousing housingDraw okMark
 Hooks: top bar tap opens the panel; wraps refresh (view.t=='housing'), vStats (adds a housing line), render (map badges); click actions hh/hb/hp
 Load order: after town-link.js */
let hov=0; // 1 = keep occupancy badges on the map even when the panel is closed
const SC=['#e5484d','#e9a23b','#3fb06b'],SI=['🔴','🟡','🟢'],stOf=b=>b.res.length==0?0:b.res.length<b.home?1:2;
function housingInfo(){const H=bl.filter(b=>b.home&&!b.dead),beds=bl.reduce((a,b)=>a+(b.home||0),0),pop=npcs.length,free=beds-pop,
 rate=Math.max(0,Math.min(free,1+(M.tou/20|0)+(pop/30|0))),ok={beds:free>0,hap:M.hap>35,food:res.f>5};
 return{H,beds,pop,free,rate,ok,n:[0,1,2].map(i=>H.filter(b=>stOf(b)==i).length)}}
const okMark=v=>v?'✅':'❌';
function vHousing(){const I=housingInfo(),can=I.ok.beds&&I.ok.hap&&I.ok.food;
 return`<div class="nh"><span class="pt">🏠</span><div><b>Housing</b><br><small>${I.H.length} homes · limit = total beds</small></div><button data-a="close">✕</button></div>`+
 `<div class="r">👥 Villagers <b>${I.pop}</b> / 🛏️ Beds <b>${I.beds}</b> · ${I.free>0?'<b>'+I.free+' free</b>':'<b>full</b>'} ${bar(I.beds?I.pop/I.beds*100:0)}<small>Town goal: 👥500</small></div>`+
 `<div class="r">🔴 Empty <b>${I.n[0]}</b> · 🟡 Partly full <b>${I.n[1]}</b> · 🟢 Full <b>${I.n[2]}</b></div>`+
 `<div class="r"><b>New neighbours each morning</b><br>${okMark(I.ok.beds)} free beds (${Math.max(0,I.free)})<br>${okMark(I.ok.hap)} 😊 happiness above 35 (now ${M.hap|0})<br>${okMark(I.ok.food)} 🍞 food above 5 (now ${res.f|0})<br>`+
 (can?`➜ up to <b>${I.rate}</b> newcomer(s) tomorrow (more with 🧳 tourism and a bigger town)`:'➜ <b>nobody will move in</b> until every ✅ is met')+`</div>`+
 `<div class="cr"><button data-a="hp:1">${hov?'📌 Badges on map: ON':'📍 Keep badges on map'}</button></div>`+
 '<div class="lst">'+I.H.slice().sort((a,b)=>stOf(a)-stOf(b)||a.n.localeCompare(b.n)).map(b=>`<div data-a="hb:${bl.indexOf(b)}">${SI[stOf(b)]} ${b.e} <b>${b.n}</b><span>${b.res.length}/${b.home}</span><small>${b.res.map(n=>n.name).join(', ')||'vacant · tap to find it'}</small></div>`).join('')+'</div>'}
// map badges: occupancy pill above every home (red = empty, amber = partly full, green = full)
function housingDraw(){const s=T*cam.z*K,fs=Math.max(9*K,.24*s);g.textAlign='center';g.textBaseline='middle';g.font=`bold ${fs}px system-ui`;
 bl.forEach(b=>{if(!b.home||b.dead)return;let x=CW/2+(b.x+.5-cam.x)*s,y=CH/2+(b.y-.1-cam.y)*s;if(x<-s||y<-s||x>CW+s||y>CH+s)return;let t=b.res.length+'/'+b.home,w=g.measureText(t).width+.2*s,h=fs*1.3;
  g.fillStyle=SC[stOf(b)];g.fillRect(x-w/2,y-h/2,w,h);g.fillStyle='#fff';g.fillText(t,x,y+fs*.04)})}
const _rf=refresh,_vs=vStats,_rr=render;
refresh=()=>{if(view&&view.t=='housing'){let st=sheet.scrollTop;sheet.hidden=false;sheet.innerHTML=vHousing();sheet.scrollTop=st}else _rf()};
vStats=()=>{const I=housingInfo();return _vs()+`<div class="r">🏠 Homes: 🔴${I.n[0]} empty · 🟡${I.n[1]} partly · 🟢${I.n[2]} full · ${I.free>0?I.free+' free beds':'no free beds'}</div><div class="cr"><button data-a="hh:1">🏠 Open housing</button></div>`};
render=t=>{_rr(t);if(!dg&&(hov||(view&&view.t=='housing')))housingDraw()};
addEventListener('click',e=>{let a=e.target.closest('[data-a]');if(!a)return;let[c,v]=a.dataset.a.split(':');
 if(c=='hh'){view=view&&view.t=='housing'?null:{t:'housing'};tool=null;follow=null}
 else if(c=='hp')hov=hov?0:1;
 else if(c=='hb'){let b=bl[+v];if(!b)return;view={t:'bld',o:b};follow=null;cam.tx=b.x+.5;cam.ty=b.y+.5}else return;refresh()});
$('top').dataset.a='hh:1'; // tap the top bar to open the housing list
setInterval(()=>{if(view&&view.t=='housing')refresh()},1500);
