/* hero.js — hero data, stats, XP, town-side behaviour, tombstones, save/load, phase 2 portal & raid threat
 Needs from core.js: res bl cnt sv T K CW CH cam g spr find wander R toast calc
 Needs from items.js (at call time): mods
 Provides: EL EI BEAT mult MO PZ GN DW DH RK SK HR tombs stash hgen hg hcmd home newHero stat ens gate gainXP
           townTick townDraw claim saveH loadH portalState raidTick
 Load order: 1st after core.js (items.js follows) */
const EL=['fire','water','earth','wind'],EI={fire:'🔥',water:'💧',earth:'🪨',wind:'🌪️'},BEAT={fire:'wind',wind:'earth',earth:'water',water:'fire'},
mult=(a,d)=>!a||!d?1:BEAT[a]==d?1.5:BEAT[d]==a?.6:1,
MO={fire:['🦎','🔥'],water:['🐸','🐙'],earth:['🐗','🍄'],wind:['🦅','🦇']},
PZ={fire:['#f7c6ae','#a45a48'],water:['#b4def2','#4b7ba8'],earth:['#ddcba0','#7b6b49'],wind:['#e2f1ea','#7ea499']},
GN='I II III IV V VI VII VIII IX X'.split('פס').map(s=>s),DW=30,DH=22,RK=['g','w','s','f','c','gem'],SK=[];
[['fire','🔥','Ember','Flame Ward','Battle Cry'],['water','💧','Splash','Tide Shield','Healing Rain'],['earth','🪨','Rock Toss','Stone Skin','Bloom'],['wind','🌪️','Gust','Air Barrier','Tailwind']].forEach(([el,e,a,d,s])=>['atk','def','sup'].forEach((t,i)=>SK.push({id:el+t,el,t,e,n:[a,d,s][i],cd:[2.5,7,9][i]})));

let HR,tombs=[],stash=[],hgen=1,lt=0,hg=null,hcmd=0;
let portalState = { mons: 0, raidTime: 50, raiding: false, raidWave: [] };

const home=()=>bl.find(b=>b.job||b.home)||bl[0]||{x:N/2|0,y:N/2|0};
const newHero=()=>({n:'Hero '+(GN[hgen-1]||hgen),lv:1,xp:0,sp:0,sk:[],w:{t:0,el:null},a:{t:0,el:null},eq:{w:null,a:null,t:null},hp:60,alive:1,rs:0,on:0,path:[]}),
stat=h=>{const m=mods(h);return{mhp:60+12*(h.lv-1)+h.a.t*10+m.hp,atk:8+2*(h.lv-1)+h.w.t*4+m.atk,def:2+(h.lv-1)+h.a.t*3+m.def,cr:Math.min(60,5+m.cr),ls:Math.min(25,m.ls),ms:Math.min(40,m.ms),gf:m.gf,xp:m.xp}},
ens=()=>{res.gem=res.gem||0;res.E=res.E||{fire:0,water:0,earth:0,wind:0}},gate=()=>bl.find(b=>b.k=='portal');
function gainXP(x){HR.xp+=Math.round(x*(1+stat(HR).xp/100));while(HR.xp>=30*HR.lv&&HR.lv<30){HR.xp-=30*HR.lv;HR.lv++;HR.sp++;HR.hp=Math.min(stat(HR).mhp,HR.hp+stat(HR).mhp*.5);if(dg)fx(dg.p.x,dg.p.y-.5,'LEVEL UP! +1 SP','#9f9')}}

function townTick(dt){if(!HR||!HR.alive)return;const S=stat(HR),G=gate(),H=G||home();HR.hp=Math.min(S.mhp,HR.hp+S.mhp*.05*dt);if(G!==hg){hg=G;HR.on=0}
 if(!HR.on){HR.x=H.x+.5;HR.y=Math.min(N-1,H.y+1.5);HR.on=1;HR.path=[];HR.t=0}

 if(G){
  portalState.raidTime -= dt;
  if(portalState.raidTime <= 0){
   portalState.raidTime = 45;
   portalState.mons += 3;
   toast('⚠️ Monsters accumulate around the Dungeon Gate! ('+portalState.mons+'/12)');
  }
  if(portalState.mons >= 12 && !portalState.raiding){
   portalState.raiding = true;
   toast('🚨 RAID WAVE! Monsters march from the Dungeon Gate to attack town buildings!', 5000);
   // Spawn raid monsters near gate
   portalState.raidWave = Array.from({length: 4}, ()=>({x: G.x+R(-1,1), y: G.y+R(1,2), hp: 30+HR.lv*10, atk: 6+HR.lv, el: pk(EL), e: '👺'}));
  }
  if(portalState.raiding && portalState.raidWave.length > 0){
   let targetBld = bl.filter(b=>!b.dead)[0] || G;
   for(let rm of portalState.raidWave){
    let dx = targetBld.x - rm.x, dy = targetBld.y - rm.y, dist = Math.hypot(dx, dy) || 1;
    if(dist > 0.8){
     rm.x += (dx/dist)*1.2*dt; rm.y += (dy/dist)*1.2*dt;
    } else {
     targetBld.hp -= 15 * dt;
     if(targetBld.hp <= 0){
      targetBld.dead = 1;
      bl.splice(bl.indexOf(targetBld), 1);
      if(bg[targetBld.y*N+targetBld.x]===targetBld) bg[targetBld.y*N+targetBld.x]=null;
      toast('💥 A building was destroyed by the raid!');
      calc();
     }
    }
   }
   if(targetBld.dead || portalState.raidWave.every(rm=>rm.hp<=0)){
    portalState.raiding = false;
    portalState.mons = 0;
    portalState.raidWave = [];
   }
  }
 }

 if(HR.path.length){let p=HR.path[0],dx=p[0]+.5-HR.x,dy=p[1]+.5-HR.y,d=Math.hypot(dx,dy),st=1.8*dt;if(d<=st){HR.x=p[0]+.5;HR.y=p[1]+.5;HR.path.shift()}else{HR.x+=dx/d*st;HR.y+=dy/d*st}}
 else if((HR.t-=dt)<0){HR.t=R(3,8);let t=wander({x:H.x,y:H.y},4);if(t){let p=find(HR.x|0,HR.y|0,t.x,t.y);if(p)HR.path=p}}}

function townDraw(){const s=T*cam.z*K;g.setTransform(s,0,0,s,CW/2-cam.x*s,CH/2-cam.y*s);tombs.forEach(t=>{g.drawImage(spr('🪦'),t.x,t.y-.1,1,1);g.globalAlpha=.5+.5*Math.sin(Date.now()/350);g.drawImage(spr('✨'),t.x+.55,t.y-.25,.4,.4);g.globalAlpha=1});
 if(HR&&HR.alive&&HR.on){g.fillStyle='rgba(255,210,60,'+(.4+.2*Math.sin(Date.now()/300))+')';g.beginPath();g.ellipse(HR.x,HR.y+.02,.34,.14,0,0,7);g.fill();g.drawImage(spr('🧝'),HR.x-.3,HR.y-.7,.6,.6);g.drawImage(spr('⚔️'),HR.x+.1,HR.y-.4,.3,.3)}
 if(portalState && portalState.raiding){portalState.raidWave.forEach(rm=>{g.drawImage(spr('👺'),rm.x-.3,rm.y-.6,.6,.6);})}
 g.setTransform(1,0,0,1,0,0)}

function claim(i){let t=tombs.splice(i,1)[0],p=t.p;ens();RK.forEach(k=>res[k]=(res[k]||0)+p[k]);EL.forEach(e=>res.E[e]+=p.E[e]);if(t.w.t>HR.w.t)HR.w=t.w;if(t.a.t>HR.a.t)HR.a=t.a;(t.it||[]).forEach(x=>stash.push(x));toast('🪦 Recovered '+t.n+'’s loot, gear'+(t.it&&t.it.length?' and '+t.it.length+' item(s)':''));calc()}

function saveH(){try{localStorage.setItem('fh1h',JSON.stringify({HR,tombs,stash,gen:hgen,lv:bl.map(b=>b.lv||1),portalState}))}catch(e){}}
function loadH(s0){let s=null;try{s=s0&&JSON.parse(localStorage.getItem('fh1h'))}catch(e){}
 if(s){HR=s.HR;tombs=s.tombs||[];hgen=s.gen||1;stash=s.stash||[];HR.eq=HR.eq||{w:null,a:null,t:null};HR.on=0;HR.path=[];if(s.portalState)portalState=s.portalState;(s.lv||[]).forEach((l,i)=>{let b=bl[i];while(b&&(b.lv||1)<l)bump(b)})}else{hgen=1;tombs=[];stash=[];HR=newHero()}ens()}
