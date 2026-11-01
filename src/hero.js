/* hero.js — hero home trigger, random dungeon portal spawning, monster raids & town defense */
const EL=['fire','water','earth','wind'],EI={fire:'🔥',water:'💧',earth:'🪨',wind:'🌪️'},BEAT={fire:'wind',wind:'earth',earth:'water',water:'fire'},
mult=(a,d)=>!a||!d?1:BEAT[a]==d?1.5:BEAT[d]==a?.6:1,
MO={fire:['🦎','🔥'],water:['🐸','🐙'],earth:['🐗','🍄'],wind:['🦅','🦇']},
PZ={fire:['#f7c6ae','#a45a48'],water:['#b4def2','#4b7ba8'],earth:['#ddcba0','#7b6b49'],wind:['#e2f1ea','#7ea499']},
GN='I II III IV V VI VII VIII IX X'.split(' '),DW=30,DH=22,RK=['g','w','s','f','c','gem'],SK=[];

const SKI={fireatk:'☄️',firedef:'♨️',firesup:'📣',wateratk:'💦',waterdef:'🫧',watersup:'🌧️',earthatk:'🪨',earthdef:'🗿',earthsup:'🌱',windatk:'🌪️',winddef:'🎐',windsup:'🍃'};
[['fire','🔥','Ember','Flame Ward','Battle Cry',['Shoot a blazing fireball','Gain a fiery damage shield','Boost attack power']],
 ['water','💧','Splash','Tide Shield','Healing Rain',['Launch a water splash','Gain a protective water shield','Restore health over time']],
 ['earth','🪨','Rock Toss','Stone Skin','Bloom',['Hurl a heavy boulder','Gain robust stone armor','Nurture earth vitality']],
 ['wind','🌪️','Gust','Air Barrier','Tailwind',['Unleash a sharp wind gust','Deflect attacks with a gale','Boost movement & action speed']]].forEach(([el,e,a,d,s,desc])=>['atk','def','sup'].forEach((t,i)=>SK.push({id:el+t,el,t,e:SKI[el+t],n:[a,d,s][i],desc:desc[i],cd:[2.5,7,9][i]})));

let HR=null,tombs=[],stash=[],hgen=1,lt=0,hg=null,hcmd=0;
let randomPortals = []; 
const THCon=()=>typeof THC!=='undefined'&&THC.on&&HR&&HR.alive&&!dg;
function destroyBld(b){if(!b||b.dead)return;b.dead=1;let i=bl.indexOf(b);if(i>=0)bl.splice(i,1);if(bg[b.y*N+b.x]===b)bg[b.y*N+b.x]=null;assign();calc()}
function portalPos(){
  let cx=25,cy=25,best=null;
  for(let a=0;a<400;a++){
    let minB=Math.max(8,14-(a/60|0)),minC=Math.max(12,18-(a/60|0));
    let x=2+Math.floor(Math.random()*(N-4)),y=2+Math.floor(Math.random()*(N-4)),i=y*N+x,t=ter[i];
    if(t==2||t==3||t==4||t==6||bg[i]||rd[i])continue;
    if(Math.hypot(x-cx,y-cy)<minC)continue;
    if(bl.some(b=>Math.hypot(b.x-x,b.y-y)<minB))continue;
    if(randomPortals.some(p=>Math.hypot(p.x-x,p.y-y)<8))continue;
    if(!find(cx,cy,x,y))continue;
    return {x,y};
  }
  return null;
}
let portalState = { raidTime: 40 };

const home=()=>bl.find(b=>b.k=='hero_home')||bl[0]||{x:N/2|0,y:N/2|0};
const newHero=()=>({n:'Hero '+(GN[hgen-1]||hgen),lv:1,xp:0,sp:0,sk:[],slvl:{},w:{t:0,el:null},a:{t:0,el:null},eq:{w:null,a:null,t:null},hp:60,alive:1,rs:0,on:1,path:[],act:'Wandering wilderness'}),
stat=h=>{if(!h)return{mhp:60,atk:8,def:2,cr:5,ls:0,ms:0,gf:0,xp:0};const m=mods(h);return{mhp:60+12*(h.lv-1)+h.a.t*10+m.hp,atk:8+2*(h.lv-1)+h.w.t*4+m.atk,def:2+(h.lv-1)+h.a.t*3+m.def,cr:Math.min(60,5+m.cr),ls:Math.min(25,m.ls),ms:Math.min(40,m.ms),gf:m.gf,xp:m.xp}},
ens=()=>{res.gem=res.gem||0;res.E=res.E||{fire:0,water:0,earth:0,wind:0}},gate=()=>randomPortals[0];

function gainXP(x){if(!HR)return;HR.xp+=Math.round(x*(1+stat(HR).xp/100));while(HR.xp>=30*HR.lv&&HR.lv<30){HR.xp-=30*HR.lv;HR.lv++;HR.sp++;HR.hp=Math.min(stat(HR).mhp,HR.hp+stat(HR).mhp*.5);if(dg)fx(dg.p.x,dg.p.y-.5,'LEVEL UP! +1 SP','#9f9')}}

// Spiral outward to find the nearest valid non-water tile near target coordinates
function findNearestValidTile(startX, startY) {
  let sx = startX | 0, sy = startY | 0;
  if (sx >= 0 && sy >= 0 && sx < N && sy < N) {
    let i = sy * N + sx;
    let t = ter[i];
    if (t !== 3 && t !== 4 && !bg[i] && !rd[i]) {
      return { x: sx + 0.5, y: sy + 0.5 };
    }
  }
  for (let r = 1; r <= 10; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) === r || Math.abs(dy) === r) {
          let nx = sx + dx;
          let ny = sy + dy;
          if (nx >= 0 && ny >= 0 && nx < N && ny < N) {
            let ni = ny * N + nx;
            let nt = ter[ni];
            if (nt !== 3 && nt !== 4 && !bg[ni]) {
              return { x: nx + 0.5, y: ny + 0.5 };
            }
          }
        }
      }
    }
  }
  return { x: startX + 0.5, y: startY + 0.5 };
}

function checkHeroHomeBuilt(b){
 if(b && b.k == 'hero_home'){
  if(!HR){
   HR = newHero();
   let safePos = findNearestValidTile(b.x, b.y);
   HR.x = safePos.x; 
   HR.y = safePos.y; 
   HR.alive = 1; 
   HR.on = 1;
   toast('⛺ Hero Home built! The hero has stepped out to explore the realm!');
  } else {
   toast('⛺ Hero Home relocated! The unique hero remains active.');
  }
 }
}

function checkHeroHomeInit(){
 if(!HR){
  let h = bl.find(b => b.k == 'hero_home');
  if(h){
   HR = newHero();
   let safePos = findNearestValidTile(h.x, h.y);
   HR.x = safePos.x; HR.y = safePos.y; HR.alive = 1; HR.on = 1;
  }
 }
}

function ensureHero(){
 checkHeroHomeInit();
 return HR;
}

function townTick(dt){
 ensureHero();
 if(HR){
  let hx = HR.x|0, hy = HR.y|0;
  if(hx >= 0 && hy >= 0 && hx < N && hy < N){
   let curTer = ter[hy*N + hx];
   if((curTer == 3 || curTer == 4) && !rd[hy*N + hx]){
    let H = home();
    if(H){
     let safePos = findNearestValidTile(H.x, H.y);
     HR.x = safePos.x; HR.y = safePos.y; HR.path = [];
     toast('🛡️ Hero found a way out of the water and returned to safety!');
    }
   }
  }

  portalState.raidTime -= dt;
  if(portalState.raidTime <= 0){
   portalState.raidTime = 45;
   if(randomPortals.length < 4){
    let pp = portalPos();
    if(pp){
     let el = pk(EL);
     randomPortals.push({x: pp.x, y: pp.y, el, mons: 0, raidWave: []});
     toast('🌀 A wild Dungeon Portal ('+EI[el]+') has opened far from town!');
    }
   }
  }

  randomPortals.forEach(p => {
   p.mons += dt * 0.2;
   if(p.mons >= 8 && p.raidWave.length === 0){
    toast('🚨 Monsters swarming around the ' + EI[p.el] + ' portal are marching on the town!');
    p.raidWave = Array.from({length: 3}, () => ({x: p.x, y: p.y, hp: 35, mhp: 35, atk: 8, el: p.el, e: '👺'}));
    p.mons = 0;
   }
   if(p.raidWave.length > 0){
    p.raidWave.forEach(rm => {
     if(rm.stun>0)rm.stun-=dt;if(rm.slow>0)rm.slow-=dt;
     let k=rm.stun>0?0:rm.slow>0?.5:1;
     let tb=null,bd=1e9;for(const b of bl){if(b.dead)continue;let d=Math.hypot(b.x+.5-rm.x,b.y+.5-rm.y);if(b.k=='townhall')d-=4;if(d<bd){bd=d;tb=b}}
     if(!tb)return;
     let dx=tb.x+.5-rm.x, dy=tb.y+.5-rm.y, dist=Math.hypot(dx,dy)||1;
     if(dist > 1.1){
      rm.x += (dx/dist) * 1.0 * dt * k; rm.y += (dy/dist) * 1.0 * dt * k;
     } else if(k>0){
      tb.hp -= 10 * dt;
      if(tb.hp <= 0 && !tb.dead){
       let nm=tb.n;destroyBld(tb);
       toast('💥 '+nm+' destroyed by raiding monsters!');
      }
     }
    });
   }
  });

  const S=stat(HR),H=home();
  if(THCon()){HR.path=[]}
  else if(HR.hp < S.mhp * 0.4 && H){
   let distToHome = Math.hypot(HR.x - H.x, HR.y - H.y);
   if(distToHome > 1.5){
    let p = find(HR.x|0, HR.y|0, H.x, H.y);
    if(p && p.length > 0) {
     HR.path = p;
     HR.act = 'Retreating to camp';
    } else {
     let safePos = findNearestValidTile(H.x, H.y);
     HR.x = safePos.x; HR.y = safePos.y; HR.path = [];
    }
   } else {
    HR.hp = Math.min(S.mhp, HR.hp + S.mhp * 0.2 * dt);
    HR.act = 'Resting at Hero Home';
   }
  } else {
   if(!HR.path.length && Math.random() < 0.02){
    let w = wander(HR, 5);
    if(w){
     let p = find(HR.x|0, HR.y|0, w.x, w.y);
     if(p && p.length > 0) { HR.path = p; HR.act = 'Wandering wilderness'; }
    }
   }
  }

  if(HR.path.length){
   let p=HR.path[0],dx=p[0]+.5-HR.x,dy=p[1]+.5-HR.y,d=Math.hypot(dx,dy),st=1.6*dt;
   if(d<=st){HR.x=p[0]+.5;HR.y=p[1]+.5;HR.path.shift()}
   else{HR.x+=dx/d*st;HR.y+=dy/d*st}
  }
 }
}

function townDraw(){
 const s=T*cam.z*K;g.setTransform(s,0,0,s,CW/2-cam.x*s,CH/2-cam.y*s);
 tombs.forEach(t=>{g.drawImage(spr('🪦'),t.x,t.y-.1,1,1)});
 randomPortals.forEach(p=>{
  g.drawImage(spr('🌀'),p.x,p.y,1,1);
  g.drawImage(spr(EI[p.el]),p.x+.6,p.y-.2,.5,.5);
  p.raidWave.forEach(rm=>{let sz=rm.stun>0?'💫':'';g.drawImage(spr('👺'),rm.x-.3,rm.y-.6,.6,.6);
   g.fillStyle='#0008';g.fillRect(rm.x-.3,rm.y-.75,.6,.08);g.fillStyle=rm.slow>0?'#6cf':'#e33';g.fillRect(rm.x-.3,rm.y-.75,.6*Math.max(0,rm.hp/(rm.mhp||35)),.08);
   if(sz)g.drawImage(spr(sz),rm.x-.15,rm.y-1.05,.3,.3)});
 });
 if(HR&&HR.alive&&HR.on){
  g.fillStyle='rgba(255,210,60,.5)';g.beginPath();g.ellipse(HR.x,HR.y+.02,.34,.14,0,0,7);g.fill();
  g.drawImage(spr('🧝'),HR.x-.3,HR.y-.7,.6,.6);
  g.drawImage(spr('⚔️'),HR.x+.1,HR.y-.4,.3,.3);
 }
 g.setTransform(1,0,0,1,0,0);
}

function claim(i){let t=tombs.splice(i,1)[0],p=t.p;ens();RK.forEach(k=>res[k]=(res[k]||0)+p[k]);EL.forEach(e=>res.E[e]+=p.E[e]);if(t.w.t>HR.w.t)HR.w=t.w;if(t.a.t>HR.a.t)HR.a=t.a;(t.it||[]).forEach(x=>stash.push(x));toast('🪦 Recovered '+t.n+'’s loot');calc()}

function saveH(){try{localStorage.setItem('fh1h',JSON.stringify({HR,tombs,stash,gen:hgen,lv:bl.map(b=>b.lv||1),randomPortals,over:townHallDestroyed?1:0}))}catch(e){}}
function loadH(s0){let s=null;try{s=s0&&JSON.parse(localStorage.getItem('fh1h'))}catch(e){}
 if(s){HR=s.HR;tombs=s.tombs||[];hgen=s.gen||1;stash=s.stash||[];if(HR){HR.eq=HR.eq||{w:null,a:null,t:null};HR.slvl=HR.slvl||{};HR.on=1;HR.path=[];}randomPortals=s.randomPortals||[];if(s.over){townHallDestroyed=1;spd=0}}else{hgen=1;tombs=[];stash=[];HR=null}ens();ensureHero()}
