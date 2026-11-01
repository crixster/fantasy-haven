/* hero.js — hero home trigger, random dungeon portal spawning, monster raids & town defense
 Load order: 1st after core.js */
const EL=['fire','water','earth','wind'],EI={fire:'🔥',water:'💧',earth:'🪨',wind:'🌪️'},BEAT={fire:'wind',wind:'earth',earth:'water',water:'fire'},
mult=(a,d)=>!a||!d?1:BEAT[a]==d?1.5:BEAT[d]==a?.6:1,
MO={fire:['🦎','🔥'],water:['🐸','🐙'],earth:['🐗','🍄'],wind:['🦅','🦇']},
PZ={fire:['#f7c6ae','#a45a48'],water:['#b4def2','#4b7ba8'],earth:['#ddcba0','#7b6b49'],wind:['#e2f1ea','#7ea499']},
GN='I II III IV V VI VII VIII IX X'.split(' '),DW=30,DH=22,RK=['g','w','s','f','c','gem'],SK=[];

[['fire','🔥','Ember','Flame Ward','Battle Cry',['Shoot a blazing fireball','Gain a fiery damage shield','Boost attack power']],
 ['water','💧','Splash','Tide Shield','Healing Rain',['Launch a water splash','Gain a protective water shield','Restore health over time']],
 ['earth','🪨','Rock Toss','Stone Skin','Bloom',['Hurl a heavy boulder','Gain robust stone armor','Nurture earth vitality']],
 ['wind','🌪️','Gust','Air Barrier','Tailwind',['Unleash a sharp wind gust','Deflect attacks with a gale','Boost movement & action speed']]].forEach(([el,e,a,d,s,desc])=>['atk','def','sup'].forEach((t,i)=>SK.push({id:el+t,el,t,e,n:[a,d,s][i],desc:desc[i],cd:[2.5,7,9][i]})));

let HR=null,tombs=[],stash=[],hgen=1,lt=0,hg=null,hcmd=0;
let randomPortals = []; 
let portalState = { raidTime: 40 };

const home=()=>bl.find(b=>b.k=='hero_home')||bl[0]||{x:N/2|0,y:N/2|0};
const newHero=()=>({n:'Hero '+(GN[hgen-1]||hgen),lv:1,xp:0,sp:0,sk:[],slvl:{},w:{t:0,el:null},a:{t:0,el:null},eq:{w:null,a:null,t:null},hp:60,alive:1,rs:0,on:0,path:[]}),
stat=h=>{if(!h)return{mhp:60,atk:8,def:2,cr:5,ls:0,ms:0,gf:0,xp:0};const m=mods(h);return{mhp:60+12*(h.lv-1)+h.a.t*10+m.hp,atk:8+2*(h.lv-1)+h.w.t*4+m.atk,def:2+(h.lv-1)+h.a.t*3+m.def,cr:Math.min(60,5+m.cr),ls:Math.min(25,m.ls),ms:Math.min(40,m.ms),gf:m.gf,xp:m.xp}},
ens=()=>{res.gem=res.gem||0;res.E=res.E||{fire:0,water:0,earth:0,wind:0}},gate=()=>randomPortals[0];

function gainXP(x){if(!HR)return;HR.xp+=Math.round(x*(1+stat(HR).xp/100));while(HR.xp>=30*HR.lv&&HR.lv<30){HR.xp-=30*HR.lv;HR.lv++;HR.sp++;HR.hp=Math.min(stat(HR).mhp,HR.hp+stat(HR).mhp*.5);if(dg)fx(dg.p.x,dg.p.y-.5,'LEVEL UP! +1 SP','#9f9')}}

function checkHeroHomeBuilt(b){
 if(b && b.k == 'hero_home' && !HR){
  HR = newHero();
  HR.x = b.x + 0.5; HR.y = b.y + 0.5; HR.alive = 1; HR.on = 1;
  toast('⛺ Hero Home built! Hero has arrived and portals are appearing in the wild!');
 }
}

function townTick(dt){
 if(HR){
  portalState.raidTime -= dt;
  if(portalState.raidTime <= 0){
   portalState.raidTime = 45;
   if(randomPortals.length < 4){
    let angle = Math.random() * Math.PI * 2, dist = 12 + Math.random() * 8;
    let px = Math.round(25 + Math.cos(angle) * dist), py = Math.round(25 + Math.sin(angle) * dist);
    let el = pk(EL);
    randomPortals.push({x: px, y: py, el, mons: 0, raidWave: []});
    toast('🌀 A wild Dungeon Portal ('+EI[el]+') has opened far from town!');
   }
  }

  randomPortals.forEach(p => {
   p.mons += dt * 0.2;
   if(p.mons >= 8 && p.raidWave.length === 0){
    toast('🚨 Monsters swarming around the ' + EI[p.el] + ' portal are marching on the town!');
    p.raidWave = Array.from({length: 3}, () => ({x: p.x, y: p.y, hp: 35, atk: 8, el: p.el, e: '👺'}));
    p.mons = 0;
   }
   if(p.raidWave.length > 0){
    p.raidWave.forEach(rm => {
     let dx = 25 - rm.x, dy = 25 - rm.y, dist = Math.hypot(dx, dy) || 1;
     if(dist > 1.5){
      rm.x += (dx/dist) * 1.0 * dt; rm.y += (dy/dist) * 1.0 * dt;
     } else {
      let targetBld = bl.find(b=>b.k=='townhall') || bl[0];
      if(targetBld){
       targetBld.hp -= 10 * dt;
       if(targetBld.hp <= 0 && !targetBld.dead){
        targetBld.dead = 1;
        bl.splice(bl.indexOf(targetBld), 1);
        toast('💥 Town building destroyed by raiding monsters!');
       }
      }
     }
    });
   }
  });

  const S=stat(HR),H=home();
  if(HR.hp < S.mhp * 0.4 && H){
   let distToHome = Math.hypot(HR.x - H.x, HR.y - H.y);
   if(distToHome > 1.5){
    let p = find(HR.x|0, HR.y|0, H.x, H.y);
    if(p) HR.path = p;
   } else {
    HR.hp = Math.min(S.mhp, HR.hp + S.
