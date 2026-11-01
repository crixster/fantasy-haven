/* core.js — town simulation: grid, buildings, NPCs, economy, rendering, input, UI panels (the original game)
 Key globals used by the other modules:
   world:  N (grid size) T (tile px) K (dpr) CW CH cam{x,y,tx,ty,z} bl (buildings) bg (building grid) ter rd npcs NM res (resources) cnt (building counts) spd sv (loaded save)
   data:   CAT/BK (build catalog; BK[key]) TF (terrain tools) IC (resource icons)
   state:  view ({t:'hero'|'bld'|...}) tool (placing building key) follow (camera target with x,y)
   helpers: $ R(a,b) pk(arr) clamp spr(emoji) find(sx,sy,gx,gy)->path wander(n,r) w2(sx,sy)->world toast(msg,ms) calc() refresh() hintUI() ui()
   engine (reassigned by town-link.js): render newDay save init tap
   sheet panels: refresh() maps view.t -> vBuild2/vTrade/vHero/vStats/vFolk/vQ/vNpc/vBld; vHero and upgBtn come from town-link.js
 Load order: 1st */
"use strict";
const N=50,T=32,$=i=>document.getElementById(i),cv=$('c'),g=cv.getContext('2d'),mm=$('mm'),mg=mm.getContext('2d'),sheet=$('sheet'),
clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),R=(a,b)=>a+Math.random()*(b-a),pk=a=>a[Math.random()*a.length|0];

const BLD_BASE_HP=100, REPAIR_COST_G=15, REPAIR_COST_W=10;

const CAT=`cottage|🏠|Cottage|Home|40/10/0/0|home=2
family|🏡|Family House|Home|90/25/5/0|home=4
noble|🏰|Noble Home|Home|220/20/40/0|home=3,bea=2,g=6,u=20
inn|🛏️|Inn|Home|120/30/10/0|home=2,job=2,tou=2,g=5
hero_home|⛺|Hero Home|Home|80/20/10/0|home=1,job=1
farm|🌾|Farm|Work|50/10/0/0|job=2,f=10,ln=gl
orchard|🍎|Orchard|Work|70/15/0/0|job=2,f=7,g=2,bea=1,ln=gf
bakery|🥖|Bakery|Work|100/20/10/0|job=2,f=-3,g=10
market|🛒|Market|Work|110/25/0/0|job=2,g=9,hap=1
smith|⚒️|Blacksmith|Work|130/15/25/0|job=2,s=-2,g=11
tailor|🧵|Tailor|Work|90/20/0/0|job=2,g=8
tavern|🍺|Tavern|Work|140/30/10/0|job=2,g=7,f=-1,hap=2,tou=1
lumber|🪓|Lumber Camp|Work|40/0/0/0|job=2,w=7,ln=f
mine|⛏️|Mine|Work|60/10/0/0|job=2,s=5,ln=h
harbor|⚓|Fishing Harbour|Work|160/40/10/0|job=3,f=14,g=3,tou=1,ln=w
theater|🎭|Theater|Joy|300/40/40/0|job=2,hap=4,tou=2,bea=1,u=30
garden|🌷|Garden|Joy|60/5/0/0|hap=3,bea=3,o=1,ln=gl
fountain|⛲|Fountain|Joy|140/0/30/0|hap=3,bea=4,o=1,ln=gl
park|🌳|Park|Joy|80/10/0/0|hap=3,bea=2,o=1,ln=lf
festival|🎪|Festival Grounds|Joy|200/30/0/0|hap=4,tou=4,o=1,u=25
wizard|🗼|Wizard Tower|Magic|300/30/40/5|job=1,mag=5,u=15,ln=hx
alchemy|⚗️|Alchemy Shop|Magic|260/20/20/3|job=2,g=12,c=-0.5,mag=3,u=25
crystal|💎|Crystal Workshop|Magic|300/20/30/0|job=2,c=2,s=-3,mag=2,u=35,ln=x
dragon|🐉|Dragon Sanctuary|Magic|500/40/60/10|job=1,tou=6,mag=3,u=60,ln=h
fairy|🧚|Fairy Grove|Magic|180/20/0/2|hap=3,bea=3,mag=3,o=1,u=20,ln=lf
road|🟫|Road|Path|2/0/0/0|r=1
stone|⬜|Stone Road|Path|4/0/1/0|r=2
bridge|🌉|Bridge|Path|15/5/0/0|r=3
lantern|🏮|Lantern|Path|5/0/0/0|bea=1,d=1`.split('\n').map(l=>{let[k,e,n,cat,c,p]=l.split('|'),o={k,e,n,cat,$:c.split('/').map(Number),u:0};p.split(',').forEach(q=>{let[a,b]=q.split('=');o[a]=isNaN(b)?b:+b});return o}),BK={};
CAT.forEach(b=>BK[b.k]=b);
const QT=`bakery|1|Build a bakery
road|14|Improve the roads: lay 14 road tiles
farm|3|Grow more food: build 3 farms
garden|2|Decorate the neighborhood: 2 gardens
fountain|1|Add a fountain to the square
park|2|Build 2 parks for picnics
lantern|6|Light the streets: 6 lanterns
tavern|1|Open a tavern
cottage|6|Build 6 cottages for newcomers
market|2|Open 2 markets
wizard|1|Raise a wizard tower
theater|1|Build a theater`.split('\n').map(l=>{let[k,n,t]=l.split('|');return[k,+n,t]});
const PAL=['100,52,76|98,52,70|42,52,72|195,25,92','110,45,68|108,45,62|35,55,66|200,25,88','35,35,76|35,35,72|30,35,70|210,20,93','200,70,78|200,72,74|205,60,74|200,40,86','200,70,72|200,72,68|205,60,68|200,40,82','100,52,78|98,50,72|45,50,74|195,25,92','280,60,84|280,60,82|280,55,80|280,40,90'].map(s=>s.split('|').map(q=>q.split(',').map(Number)));
const TR=['🌳','🌳','🍁','🌲'],FL=['🌸','🌼','🌻','🌱'],SN=['🌸 Spring','☀️ Summer','🍂 Autumn','❄️ Winter'],FN=['Spring Bloom Event','Moonlight Market','Harvest Festival','Winter Celebration'],
WI={sun:'☀️',rain:'🌧️',fog:'🌫️',snow:'❄️'},IC={f:'🍞',w:'🪵',s:'🪨',g:'🪙',c:'💎'},CC={Home:'#ffd1dc',Work:'#ffe5b4',Joy:'#c8f0c8',Magic:'#dcc8ff',Path:'#fff3b0'},
PERS={Cheerful:['😄','#ffb7c5'],Lazy:['😴','#b8c0ff'],Ambitious:['😤','#ffd6a5'],Bookish:['🤓','#caffbf'],Adventurous:['🤠','#9bf6ff'],Shy:['🥺','#fdffb6'],Artistic:['🥰','#e7c6ff']},
LV={Cheerful:['park','festival','tavern','fountain'],Lazy:['park','garden','home'],Ambitious:['market','smith','theater'],Bookish:['wizard','garden','alchemy'],Adventurous:['*'],Shy:['garden','park','home'],Artistic:['theater','fountain','garden','fairy']},
NAMES='Lily Moss Pip Fern Bram Willa Odo Tansy Rue Finn Hazel Juno Ivy Barley Clover Nell Orin Sage Poppy Thistle Wren Alder Daisy Gus Mabel Rowan Tilly Elm Briar Posy'.split(' '),
CHAT=['Lovely day, ','Have you tried the bread, ','How’s work, ','Tea later, ','So good to see you, '];

let S0,ter,ter0,vm,rd,bg,bl,npcs,NM,res,tm,D,spd=1,wx,wxT,fest,quests,done,tc,view,tool,cat='Home',follow,M={},cnt={},nid=0,hungry=0,won=0,fr=0,lastR=0,K=1,CW,CH,newArm=0,townHallDestroyed=0;
const cam={x:25,y:25,z:1,tx:25,ty:25,tz:0},ac={s:0,t:0},SP={},PS=Array.from({length:120},()=>({x:Math.random()*900,y:Math.random()*900,v:Math.random(),p:Math.random()*6}));
const season=()=>((D-1)/8|0)%4,hh=()=>String(tm|0).padStart(2,'0')+':'+String(tm%1*60|0).padStart(2,'0');
function spr(e){if(SP[e])return SP[e];let c=document.createElement('canvas');c.width=c.height=64;let x=c.getContext('2d');x.font='46px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(e,32,36);return SP[e]=c}

function gen(){let s=S0;const r=()=>(s=(s*1664525+1013904223)>>>0)/4294967296;
 const fld=()=>{let a=Array.from({length:N*N},r);for(let k=0;k<4;k++)a=a.map((_,i)=>{let x=i%N,y=i/N|0,t=0,c=0;for(let u=-2;u<=2;u++)for(let v=-2;v<=2;v++){let X=x+u,Y=y+v;if(X>=0&&Y>=0&&X<N&&Y<N){t+=a[Y*N+X];c++}}return t/c});let lo=Math.min(...a),hi=Math.max(...a);return a.map(v=>(v-lo)/(hi-lo))};
 let h=fld(),m=fld(),c=fld();
 ter=h.map((v,i)=>v<.2?4:c[i]>.82?6:v>.8?2:m[i]>.68?1:m[i]<.3&&v>.3?5:0);
 let x=8+r()*34|0;for(let y=0;y<N;y++){x=clamp(x+(r()*3|0)-1,1,N-2);[x,x+1].forEach(X=>{if(ter[y*N+X]!=4)ter[y*N+X]=3})}
 for(let y=19;y<31;y++)for(let x=19;x<31;x++)ter[y*N+x]=0}
function paint(){let s=season();tc=ter.map((t,i)=>{let[h,sa,l]=PAL[t][s];return`hsl(${h},${sa}%,${l+((i%N*7+(i/N|0)*13)%4)*1.2}%)`})}

const TL={g:0,f:1,h:2,l:5,x:6},LL={g:'grass',f:'forest',h:'hill',l:'flowers',x:'crystal',w:'3×3 water'},
TF={t_clear:['🪓','Clear Trees',[1],0,[10,0,0,0],'w',3],t_plant:['🌲','Plant Trees',[0,5],1,[6,0,0,0]],t_flat:['⛏️','Level Hill',[2],0,[15,0,0,0],'s',5],t_raise:['⛰️','Raise Hill',[0,1,5],2,[20,0,10,0]],t_dig:['💧','Dig Water',[0,1,2,5],4,[25,0,0,0]],t_fill:['🧱','Fill Water',[3,4],0,[0,5,8,0]],t_bloom:['🌸','Sow Flowers',[0],5,[6,0,0,0]],t_charm:['🔮','Infuse Crystal',[0,1,2,5],6,[0,0,0,3]]},
PR={f:[3,1,10],w:[4,2,10],s:[6,3,10],c:[60,30,1]};
const wat=(x,y)=>x>=0&&y>=0&&x<N&&y<N&&(ter[y*N+x]==3||ter[y*N+x]==4);
function big(x,y){for(let a=x-2;a<=x;a++)for(let b=y-2;b<=y;b++){let k=1;for(let u=0;u<3&&k;u++)for(let v=0;v<3;v++)if(!wat(a+u,b+v)){k=0;break}if(k)return 1}return 0}
const can=(k,x,y)=>k in TF?!bg[y*N+x]&&!rd[y*N+x]&&TF[k][2].includes(ter[y*N+x]):ok(k,x,y);
function pay(c){if(res.g<c[0]||res.w<c[1]||res.s<c[2]||res.c<c[3])return 0;res.g-=c[0];res.w-=c[1];res.s-=c[2];res.c-=c[3];return 1}
function terra(k,x,y){let t=TF[k],i=y*N+x;if(x<0||y<0||x>=N||y>=N)return;if(bg[i]||rd[i])return toast('Demolish what’s on this tile first');if(!t[2].includes(ter[i]))return toast('Doesn’t work on this land');if(!pay(t[4]))return toast('Not enough resources');ter[i]=t[3];if(t[5])res[t[5]]+=t[6];paint();calc()}
function trade(a,r){let[b,s,n]=PR[r];if(a=='buy'){if(res.g<b*n)return toast('Not enough gold');res.g-=b*n;res[r]+=n}else{if(res[r]<n)return toast('Not enough '+IC[r]);res[r]-=n;res.g+=s*n}}
function vTrade(){return'<b>💱 Traveling Merchant</b><div class="lst">'+Object.keys(PR).map(r=>{let[b,s,n]=PR[r];return`<div>${IC[r]} <b>${res[r]|0}</b><span><button data-a="buy:${r}">Buy ${n} · ${b*n}🪙</button><button data-a="sell:${r}">Sell ${n} · ${s*n}🪙</button></span></div>`}).join('')+'</div>'}
function vBuild2(){let L=cat=='Land'?Object.entries(TF).map(([k,t])=>`<button data-a="pick:${k}">${t[0]}<br>${t[1]}<small>${cost({$:t[4]})}${t[5]?' → +'+t[6]+IC[t[5]]:''}</small></button>`):CAT.filter(b=>b.cat==cat).map(b=>{let l=b.u>npcs.length;return`<button data-a="pick:${b.k}" ${l?'disabled':''}>${b.e}<br>${b.n}<small>${l?'🔒 pop '+b.u:cost(b)}</small>${b.ln?'<small>on '+[...b.ln].map(c=>LL[c]).join('/')+'</small>':''}</button>`});
 return'<div class="ch">'+['Home','Work','Joy','Magic','Path','Land'].map(c=>`<b data-a="cat:${c}" class="${c==cat?'on':''}">${c}</b>`).join('')+'<b data-a="pick:X">🧹 Demolish</b></div><div class="gr">'+L.join('')+'</div>'}
function ok(k,x,y){if(x<0||y<0||x>=N||y>=N)return 0;let i=y*N+x,t=ter[i],b=BK[k],w=t==3||t==4;if(b.r==3)return w&&!rd[i];if(b.ln=='w')return w&&!bg[i]&&!rd[i]&&big(x,y)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,d])=>x+a>=0&&y+d>=0&&x+a<N&&y+d<N&&!wat(x+a,y+d));if(w)return 0;if(b.ln&&![...b.ln].some(c=>TL[c]==t))return 0;if(b.r)return !bg[i]&&rd[i]!=b.r;return !bg[i]&&!rd[i]}
function put(k,x,y){let b=BK[k],i=y*N+x;if(b.r){rd[i]=b.r;return}let mhp=BLD_BASE_HP+(b.$?(b.$[0]+b.$[1]*2):50);let o={...b,x,y,res:[],wk:[],hp:mhp,mhp};bl.push(o);bg[i]=o;return o}
function place(k,x,y){let b=BK[k],c=b.$;if(!ok(k,x,y))return toast(b.ln&&'Needs '+[...b.ln].map(c=>LL[c]).join(' or ')+(b.ln=='w'?' by the shore':' land')||'Can’t build there');if(b.u>npcs.length)return toast('Locked until pop '+b.u);
 if(res.g<c[0]||res.w<c[1]||res.s<c[2]||res.c<c[3])return toast('Not enough resources');res.g-=c[0];res.w-=c[1];res.s-=c[2];res.c-=c[3];put(k,x,y);assign();calc()}
function demolish(x,y){let i=y*N+x,b=bg[i];if(b){b.dead=1;bl.splice(bl.indexOf(b),1);bg[i]=null;b.$.forEach((v,j)=>res['gwsc'[j]]+=v/2);assign()}else if(rd[i]){rd[i]=0;res.g+=1}calc()}
const cost=b=>[b.$[0]&&'🪙'+b.$[0],b.$[1]&&'🪵'+b.$[1],b.$[2]&&'🪨'+b.$[2],b.$[3]&&'💎'+b.$[3]].filter(Boolean).join(' ');

function find(sx,sy,gx,gy){const E=(x,y)=>y*N+x,gi=E(gx,gy),si=E(sx,sy),G=new Float32Array(N*N).fill(1e9),P=new Int16Array(N*N).fill(-1),C=new Uint8Array(N*N),Q=new Uint8Array(N*N),F={};
 let O=[si];G[si]=0;Q[si]=1;let it=0;
 while(O.length&&it++<3000){let bi=0;for(let i=1;i<O.length;i++)if(F[O[i]]<F[O[bi]])bi=i;let c=O.splice(bi,1)[0];
  if(c==gi){let p=[];while(c!=si){p.unshift([c%N,c/N|0]);c=P[c]}return p}
  C[c]=1;let cx=c%N,cy=c/N|0;
  for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){let x=cx+dx,y=cy+dy;if(x<0||y<0||x>=N||y>=N)continue;let i=E(x,y);if(C[i])continue;let t=ter[i];
   if((t==3||t==4)&&rd[i]!=3&&i!=gi)continue;if(bg[i]&&!bg[i].d&&i!=gi)continue;
   let ng=G[c]+(rd[i]?1:[2,3,4,0,0,2,3][t]);if(ng<G[i]){G[i]=ng;P[i]=c;F[i]=ng+1.4*(Math.abs(x-gx)+Math.abs(y-gy));if(!Q[i]){Q[i]=1;O.push(i)}}}}
 return null}

function spawn(h,o){let p=pk(Object.keys(PERS)),n={id:nid++,name:pk(NAMES)+(nid>30?' '+String.fromCharCode(65+nid%26)+'.':''),age:18+Math.random()*50|0,pers:p,hap:60,en:80,wealth:20,fr:{},home:h,work:null,
 x:h?h.x+.5:25.5,y:h?h.y+.5:25.5,path:[],in:h,tgt:h,act:'Settling in',bub:null,cd:0,sp:R(.9,1.2)};if(o)Object.assign(n,o);npcs.push(n);NM.set(n.id,n);return n}
function assign(){bl.forEach(b=>{b.res=[];b.wk=[]});
 npcs.forEach(n=>{if(n.home&&!n.home.dead&&n.home.res.length<n.home.home)n.home.res.push(n);else n.home=null;if(n.work&&!n.work.dead&&n.work.wk.length<n.work.job)n.work.wk.push(n);else n.work=null});
 npcs.forEach(n=>{if(!n.home){let b=near(n,b=>b.home&&b.res.length<b.home);if(b){n.home=b;b.res.push(n)}}if(!n.work){let b=near(n,b=>b.job&&b.wk.length<b.job);if(b){n.work=b;b.wk.push(n)}}})}
function near(n,f,r){let a=bl.filter(f);if(!a.length)return null;a.sort((p,q)=>Math.abs(p.x-n.x)+Math.abs(p.y-n.y)-Math.abs(q.x-n.x)-Math.abs(q.y-n.y));return r?pk(a.slice(0,3)):a[0]}
function wander(n,r=6){for(let i=0;i<9;i++){let x=clamp(n.x+R(-r,r)|0,0,N-1),y=clamp(n.y+R(-r,r)|0,0,N-1),j=y*N+x;if(ter[j]!=3&&ter[j]!=4&&!bg[j])return{x,y}}return null}
function go(n,t,act){if(!t)return;n.act=act;n.tgt=t;if(Math.abs(n.x-t.x-.5)<.7&&Math.abs(n.y-t.y-.5)<.7){n.path=[];n.in=t.k?t:null;return}
 let p=find(n.x|0,n.y|0,t.x,t.y);if(p){n.path=p;n.in=null}else{n.path=[];n.act='Can’t find a way there. Needs a road!';n.tgt=null}}
function arrive(n){let b=n.tgt;if(b&&b.k){n.in=b;if(b.o){n.x+=R(-.3,.3);n.y+=R(-.15,.3)}}}
const say=(n,t,th)=>n.bub={t,th,l:4.5};
function plan(n,h){const P=n.pers;let t,a;
 if(fest&&h>=15&&h<22){t=near(n,b=>b.k=='festival')||near(n,b=>b.o)||wander(n,3);a='Joining the '+fest;n.hap=Math.min(100,n.hap+3)}
 else if(h>=22||h<6||n.en<10){t=n.home;a='Sleeping'}
 else if(h<7){t=n.home;a='Waking up'}
 else if(h==12){t=near(n,b=>/bakery|tavern|market|inn/.test(b.k),1);a=t?'Having lunch at the '+t.n:'Eating at home';t=t||n.home}
 else if(n.work&&(h<12||(h>=13&&h<17))&&!(P=='Lazy'&&Math.random()<.25)){t=n.work;a='Working at the '+t.n}
 else if(h<20){let f=Object.entries(n.fr).sort((p,q)=>q[1]-p[1])[0],o=f&&NM.get(+f[0]);
  if(o&&f[1]>15&&Math.random()<.3&&(!o.in||o.in.o)){t=o.in||{x:o.x|0,y:o.y|0};a='Meeting '+o.name+(o.in?' at the '+o.in.n:' in town')}
  else{let k=pk(LV[P]);t=k=='*'?wander(n,12):k=='home'?n.home:near(n,b=>b.k==k,1)||near(n,b=>b.o,1);a=t&&t.k?(t.o?'Enjoying the ':'Visiting the ')+t.n:'Taking a stroll'}}
 else{t=n.home;a='Relaxing at home'}
 if(!t){t=wander(n);a='Wandering around town'}go(n,t,a)}
function upd(n,dt){let sl=n.act=='Sleeping'&&n.in;n.en=clamp(n.en+(sl?9:-2.2)*dt*.2,0,100);n.cd-=dt;if(n.bub&&(n.bub.l-=dt)<0)n.bub=null;
 if(n.path.length){let p=n.path[0],dx=p[0]+.5-n.x,dy=p[1]+.5-n.y,d=Math.hypot(dx,dy),st=n.sp*1.7*dt*(rd[(n.y|0)*N+(n.x|0)]?1.35:1);
  if(d<=st){n.x=p[0]+.5;n.y=p[1]+.5;n.path.shift();if(!n.path.length)arrive(n)}else{n.x+=dx/d*st;n.y+=dy/d*st}}}
function social(){let G=new Map();npcs.forEach(n=>{if(n.in&&!n.in.o)return;let k=(n.x|0)+','+(n.y|0);(G.get(k)||G.set(k,[]).get(k)).push(n)});
 G.forEach(a=>{if(a.length<2)return;let[u,v]=a;if(u.cd>0||v.cd>0)return;u.cd=v.cd=8;let o=(u.fr[v.id]||0)+R(2,6);u.fr[v.id]=o;v.fr[u.id]=(v.fr[u.id]||0)+R(2,6);
  let h=o>60?'💖 ':o>30?'💕 ':'💬 ';say(u,h+pk(CHAT)+v.name+'!');say(v,h+'Hi '+u.name+'!');u.act='Chatting with '+v.name;v.act='Chatting with '+u.name})}
function thought(n){return n.hap<35?pk(['I’m so unhappy…','This town needs more fun!']):!n.home?'I need a home…':!n.work?'I’d love a job.':res.f<8?'We’re running low on food!':!cnt.bakery?'A bakery would be lovely.':!cnt.park&&!cnt.garden?'Could we have a park?':M.mag<10?'A touch of magic would be nice.':pk(['What a cozy town!','I love living here.','The lanterns are pretty.'])}

function checkTownHall(){
  if(townHallDestroyed) return;
  let th = bl.find(b=>b.k=='hero_home'||b.k=='cottage'||b.k=='family'||b.k=='noble');
  if(bl.length>0 && !th){
    townHallDestroyed=1;
    toast('💀 GAME OVER: Town Center/Home destroyed!', 10000);
    spd=0;
  }
}

function newDay(){D++;let s=season(),d=(D-1)%8+1,mul=[1,1.3,1.5,.4][s];
 for(const b of bl){let st=b.job?Math.min(1,b.wk.length/b.job):0;if(!st)continue;let ds={},ok=1;for(const r of'fwsgc'){let v=(b[r]||0)*st*(1+.5*((b.lv||1)-1));if(r=='f'&&v>0)v*=mul;if(v<0&&res[r]+v<0)ok=0;ds[r]=v}if(ok)for(const r in ds)res[r]+=ds[r]}
 let emp=npcs.filter(n=>n.work).length;res.g+=emp*3+M.tou*.3*[1.2,1.3,1,.7][s];res.f-=npcs.length*.35;if(res.g<40){res.g+=40;toast('🎒 Travelers left tips: +40 🪙')}hungry=0;if(res.f<0){res.f=0;hungry=1}
 fest=d==3?FN[s]:d==6&&s<2?'Crystal Fair':'';if(fest){res.g+=20+M.tou*2;toast('🎉 '+fest+' today from 3 pm!',4000)}
 npcs.forEach(n=>{let t=50;if(n.home){t+=10;let a=0;for(const b of bl)if(b.hap&&Math.abs(b.x-n.home.x)+Math.abs(b.y-n.home.y)<=8)a+=b.hap;t+=Math.min(25,a)}else t-=20;
  t+=n.work?6:-6;t+=hungry?-25:6;if(n.pers=='Cheerful')t+=6;if(n.pers=='Ambitious')t+=n.work?6:-6;if(n.pers=='Artistic')t+=M.bea/10;if(n.pers=='Bookish')t+=M.mag/10;if(wx=='rain')t-=3;
  n.hap+=(clamp(t,0,100)-n.hap)*.5;n.wealth=Math.max(0,n.wealth+(n.work?5:0)-2)});
 let free=bl.reduce((a,b)=>a+(b.home||0),0)-npcs.length;
 if(free>0&&M.hap>35&&res.f>5){let k=Math.min(free,1+(M.tou/20|0)+(npcs.length/30|0));for(let i=0;i<k;i++){let hs=bl.filter(b=>b.home&&b.res.length<b.home);if(hs.length){let h=pk(hs),n=spawn(h);h.res.push(n)}}toast('🧳 New neighbors arrived!')}
 assign();paint();if(D%8==1)toast('Season: '+SN[s])}
function calc(){cnt={};bl.forEach(b=>cnt[b.k]=(cnt[b.k]||0)+1);cnt.road=rd.reduce((a,v)=>a+(v?1:0),0);
 let p=npcs.length,e=npcs.filter(n=>n.work).length,sum=k=>bl.reduce((a,b)=>a+(b[k]||0),0);
 M={pop:p,hap:p?npcs.reduce((a,n)=>a+n.hap,0)/p:50,pro:Math.min(100,(p?e/p*40:0)+Math.min(40,bl.filter(b=>b.g>0).length*4)+Math.min(20,npcs.reduce((a,n)=>a+n.wealth,0)/Math.max(1,p)/5)),bea:Math.min(100,sum('bea')*1.5),mag:Math.min(100,sum('mag')*3),tou:Math.min(100,sum('tou')*3)};
 M.rank=p>=500&&M.hap>=90&&M.pro>=90&&M.bea>=90?'Magical Kingdom':p>=150?'City':p>=50?'Town':p>=15?'Hamlet':'Village';
 if(M.rank=='Magical Kingdom'&&!won){won=1;toast('👑 Magical Kingdom achieved! You win!',9000)}
 checkTownHall()}
function quest(){quests=quests.filter(q=>{let[k,n]=QT[q.t];if((cnt[k]||0)<n)return 1;let gd=70+n*12,c=k=='wizard'||k=='theater'?2:0;res.g+=gd;res.c+=c;npcs.forEach(p=>p.hap=Math.min(100,p.hap+6));done.push(q.t);toast(`✅ ${q.who}’s request done! +🪙${gd}${c?' +💎'+c:''}`);return 0});if(done.length>=QT.length)done=[];qgen()}
function qgen(){let c=QT.map((_,i)=>i).filter(i=>!done.includes(i)&&!quests.some(q=>q.t==i)&&(cnt[QT[i][0]]||0)<QT[i][1]);while(quests.length<3&&c.length)quests.push({t:c.splice(Math.random()*c.length|0,1)[0],who:npcs.length?pk(npcs).name:'A traveler'})}
function roll(){let w=[[.5,.3,.2,0],[.75,.2,.05,0],[.4,.3,.3,0],[.3,0,.2,.5]][season()],r=Math.random(),a=0;wx=['sun','rain','fog','snow'][Math.max(0,w.findIndex(v=>(a+=v)>=r))];wxT=R(3,9)}
function sim(sd){fr++;let h=tm|0;for(const n of npcs){upd(n,sd);if((n.id+fr)%15==0&&n.slot!==h){n.slot=h;plan(n,h)}}
 if((ac.s+=sd)>.7){ac.s=0;social()}if((ac.t+=sd)>9&&npcs.length){ac.t=0;let n=pk(npcs);if(!n.in||n.in.o)say(n,'💭 '+thought(n),1)}if((wxT-=sd*.2)<=0)roll()}

function repairBuilding(b){if(!b)return;let missing=b.mhp-b.hp;if(missing<=0)return toast('Building is at full health');if(res.g<REPAIR_COST_G||res.w<REPAIR_COST_W)return toast(`Need 🪙${REPAIR_COST_G} 🪵${REPAIR_COST_W} to repair`);res.g-=REPAIR_COST_G;res.w-=REPAIR_COST_W;b.hp=b.mhp;toast('Repaired '+b.n);calc();refresh()}

function save(){try{let ix=new Map(bl.map((b,i)=>[b,i]));localStorage.setItem('fh1',JSON.stringify({S:S0,tf:ter.map((t,i)=>t!=ter0[i]?[i,t]:0).filter(Boolean),res,H:tm,D,rd:Array.from(rd),bl:bl.map(b=>[b.k,b.x,b.y,b.hp]),nid,q:quests,done,
 np:npcs.map(n=>({id:n.id,name:n.name,age:n.age,pers:n.pers,hap:n.hap,en:n.en,wealth:n.wealth,fr:n.fr,h:ix.has(n.home)?ix.get(n.home):-1,w:ix.has(n.work)?ix.get(n.work):-1}))}));toast('Saved 💾')}catch(e){toast('Saving is unavailable here')}
}
function init(sv){S0=sv?sv.S:Math.random()*1e9|0;gen();ter0=ter.slice();if(sv&&sv.tf)sv.tf.forEach(([i,t])=>ter[i]=t);vm=null;rd=new Uint8Array(N*N);bg=new Array(N*N).fill(null);bl=[];npcs=[];NM=new Map();nid=0;done=[];quests=[];fest='';wx='sun';wxT=5;follow=null;
 if(sv){res=sv.res;tm=sv.H;D=sv.D;rd=Uint8Array.from(sv.rd);sv.bl.forEach(([k,x,y,hp])=>{let b=put(k,x,y);if(b&&hp!==undefined)b.hp=hp;});sv.np.forEach(o=>{let h=bl[o.h]||null;let n=spawn(h,o);n.home=h;n.work=bl[o.w]||null});nid=sv.nid;done=sv.done||[];quests=sv.q||[]}
 else{res={g:600,f:40,w:80,s:40,c:3};tm=8;D=1;for(let x=21;x<=29;x++)put('road',x,25);[[25,25,'hero_home'],[22,24,'cottage'],[24,24,'cottage'],[26,24,'cottage'],[22,26,'farm'],[24,26,'market'],[26,26,'park']].forEach(([x,y,k])=>put(k,x,y));for(let i=0;i<5;i++)spawn(bl[i%3])}
 paint();assign();calc();qgen()}

function rs(){K=Math.min(devicePixelRatio||1,2);cv.width=CW=innerWidth*K|0;cv.height=CH=innerHeight*K|0;if(!cam.tz)cam.z=cam.tz=clamp(innerWidth/(13*T),.5,2)}
const w2=(sx,sy)=>{let s=T*cam.z*K;return[(sx*K-CW/2)/s+cam.x,(sy*K-CH/2)/s+cam.y]};
function render(t){let dtr=Math.min(.1,t-lastR);lastR=t;if(follow){cam.tx=follow.x;cam.ty=follow.y}
 cam.tx=clamp(cam.tx,0,N);cam.ty=clamp(cam.ty,0,N);cam.x+=(cam.tx-cam.x)*.15;cam.y+=(cam.ty-cam.y)*.15;cam.z+=(cam.tz-cam.z)*.2;
 const s=T*cam.z*K,ox=CW/2-cam.x*s,oy=CH/2-cam.y*s,se=season();
 g.setTransform(1,0,0,1,0,0);g.fillStyle='#bfe0e8';g.fillRect(0,0,CW,CH);g.setTransform(s,0,0,s,ox,oy);
 let x0=Math.max(0,Math.floor(-ox/s)),x1=Math.min(N-1,Math.floor((CW-ox)/s)),y0=Math.max(0,Math.floor(-oy/s)),y1=Math.min(N-1,Math.floor((CH-oy)/s));
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){g.fillStyle=tc[y*N+x];g.fillRect(x,y,1.02,1.02)}
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){let i=y*N+x,tt=ter[i];
  if(tt==3||tt==4){g.fillStyle='rgba(255,255,255,.3)';g.fillRect(x+.15,y+.45+Math.sin(t*2+x*.9+y)*.2,.7,.07)}
  if(rd[i]){g.fillStyle=rd[i]==1?'#ead2ab':rd[i]==2?'#cfcad9':'#bf9466';g.fillRect(x+.04,y+.04,.92,.92);if(rd[i]==3){g.fillStyle='#8b6440';g.fillRect(x,y+.3,1,.05);g.fillRect(x,y+.65,1,.05)}}
  else if(!bg[i]){let sw=Math.sin(t*1.6+x*.7+y*.4)*.04;
   if(tt==1)g.drawImage(spr(TR[se]),x+sw-.05,y-.15,1.1,1.1);else if(tt==5)g.drawImage(spr(FL[se]),x+.2+sw,y+.25,.6,.6);
   else if(tt==2)g.drawImage(spr('⛰️'),x,y-.05,1,1);else if(tt==6)g.drawImage(spr('💎'),x+.1,y+.1+Math.sin(t*2+x)*.05,.8,.8)}}
 for(const b of bl){if(b.x<x0||b.x>x1||b.y<y0||b.y>y1)continue;if(!b.d){g.fillStyle=CC[b.cat];g.beginPath();g.roundRect(b.x+.04,b.y+.04,.92,.92,.2);g.fill()}g.drawImage(spr(b.e),b.x+.02,b.y-.1,.96,.96);
  if(b.hp!==undefined&&b.hp<b.mhp){let bw=.8,bx=b.x+0.1,by=b.y-0.15;g.fillStyle='#0008';g.fillRect(bx,by,bw,.08);g.fillStyle='#e33';g.fillRect(bx,by,bw*Math.max(0,b.hp/b.mhp),.14)}}
 if(tool&&tool!='X'&&(tool in TF||BK[tool].ln||BK[tool].r==3)){if(!vm){vm=new Uint8Array(N*N);for(let i=0;i<N*N;i++)vm[i]=can(tool,i%N,i/N|0)?1:0}g.fillStyle=`rgba(110,255,150,${.3+Math.sin(t*4)*.1})`;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(vm[y*N+x])g.fillRect(x+.06,y+.06,.88,.88)}
 let vis=npcs.filter(n=>(!n.in||n.in.o)&&n.x>x0-1&&n.x<x1+2&&n.y>y0-1&&n.y<y1+2).sort((a,b)=>a.y-b.y),sl=view&&view.t=='npc'?view.o:null;
 for(const n of vis){let bob=n.path.length?Math.abs(Math.sin(t*9+n.id))*.06:0;g.fillStyle='rgba(0,0,0,.18)';g.beginPath();g.ellipse(n.x,n.y+.02,.17,.07,0,0,7);g.fill();
  g.fillStyle=PERS[n.pers][1];g.beginPath();g.arc(n.x,n.y-.12-bob,.15,0,7);g.fill();g.drawImage(spr(PERS[n.pers][0]),n.x-.2,n.y-.5-bob,.4,.4);
  if(n===sl){g.strokeStyle='#fff';g.lineWidth=.05;g.beginPath();g.ellipse(n.x,n.y,.3,.14,0,0,7);g.stroke()}}
 g.setTransform(1,0,0,1,0,0);
 let night=clamp((Math.abs(tm-12)-6)/4,0,1)*.5;if(night>0){g.fillStyle=`rgba(25,25,80,${night})`;g.fillRect(0,0,CW,CH);
  g.setTransform(s,0,0,s,ox,oy);g.globalCompositeOperation='lighter';g.fillStyle=`rgba(255,200,90,${night*.5})`;
  for(const b of bl)if(b.k=='lantern'||b.k=='tavern'||b.k=='inn'||b.k=='festival'){g.beginPath();g.arc(b.x+.5,b.y+.5,b.d?.9:1.2,0,7);g.fill()}
  g.globalCompositeOperation='source-over';g.setTransform(1,0,0,1,0,0)}
 let mode=wx=='rain'?'r':wx=='snow'?'s':night>.15?'f':'';
 if(mode){g.fillStyle=g.strokeStyle=mode=='r'?'rgba(120,160,230,.7)':mode=='s'?'#fff':'#ffe98a';g.lineWidth=K;
  PS.forEach((p,i)=>{if(mode=='f'&&i>40)return;g.beginPath();
   if(mode=='r'){p.y+=900*dtr*K;p.x-=120*dtr*K;g.moveTo(p.x,p.y);g.lineTo(p.x+4*K,p.y-14*K);g.stroke()}
   else if(mode=='s'){p.y+=60*dtr*K*(.5+p.v);p.x+=Math.sin(t+p.p)*20*dtr*K;g.arc(p.x,p.y,(2+p.v*2)*K,0,7);g.fill()}
   else{p.x+=Math.sin(t*.7+p.p)*20*dtr*K;p.y+=Math.cos(t*.5+p.p)*14*dtr*K;g.globalAlpha=.4+.6*Math.abs(Math.sin(t*2+p.p));g.arc(p.x,p.y,2.5*K,0,7);g.fill();g.globalAlpha=1}
   if(p.y>CH)p.y=-10;if(p.y<0&&mode=='f')p.y=CH;if(p.x<0)p.x=CW;if(p.x>CW)p.x=0})}
 if(wx=='fog'){g.fillStyle=`rgba(236,242,247,${.38+Math.sin(t*.4)*.06})`;g.fillRect(0,0,CW,CH)}
 if(cam.z>.7){let k=0;g.font=`bold ${12*K}px system-ui`;g.textAlign='center';
  for(const n of vis){let tx=n.bub&&k<24?n.bub.t:n===sl?n.act:null;if(!tx)continue;k++;let px=ox+n.x*s,py=oy+(n.y-.6)*s,w=g.measureText(tx).width+12*K,th=n.bub&&n.bub.th;
   g.fillStyle='rgba(255,255,255,.95)';g.beginPath();g.roundRect(px-w/2,py-26*K,w,20*K,8*K);g.fill();g.beginPath();
   if(th){g.arc(px,py-2*K,3*K,0,7);g.arc(px+4*K,py-9*K,2*K,0,7)}else{g.moveTo(px-4*K,py-6*K);g.lineTo(px+4*K,py-6*K);g.lineTo(px,py)}g.fill();g.fillStyle='#4a3b52';g.fillText(tx,px,py-12*K)}}}

function minimap(){for(let i=0;i<N*N;i++){mg.fillStyle=rd[i]?'#c9a77a':bg[i]?'#e86a9a':tc[i];mg.fillRect(i%N,i/N|0,1,1)}
 mg.fillStyle='#fff';npcs.forEach(n=>{if(!n.in||n.in.o)mg.fillRect(n.x|0,n.y|0,1,1)});
 let w=CW/(T*cam.z*K),h=CH/(T*cam.z*K);mg.strokeStyle='#fff';mg.lineWidth=.8;mg.strokeRect(cam.x-w/2,cam.y-h/2,w,h)}
const mgo=e=>{let r=mm.getBoundingClientRect();follow=null;cam.tx=(e.clientX-r.left)/r.width*N;cam.ty=(e.clientY-r.top)/r.height*N};
mm.onpointerdown=e=>{mm.setPointerCapture(e.pointerId);mgo(e)};mm.onpointermove=e=>{if(e.buttons)mgo(e)};

const Pt=new Map();let moved=0;const zoom=f=>cam.tz=clamp(cam.tz*f,.35,2.6);
cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);Pt.set(e.pointerId,[e.clientX,e.clientY]);moved=0};
cv.onpointermove=e=>{let o=Pt.get(e.pointerId);if(!o)return;let n=[e.clientX,e.clientY];
 if(Pt.size==2){let q=[...Pt.entries()].find(([k])=>k!=e.pointerId)[1];zoom(Math.hypot(n[0]-q[0],n[1]-q[1])/Math.max(1,Math.hypot(o[0]-q[0],o[1]-q[1])))}
 else{cam.x=cam.tx-=(n[0]-o[0])/(T*cam.z);cam.y=cam.ty-=(n[1]-o[1])/(T*cam.z);if(moved>8)follow=null}
 moved+=Math.abs(n[0]-o[0])+Math.abs(n[1]-o[1]);Pt.set(e.pointerId,n)};
cv.onpointerup=cv.onpointercancel=e=>{Pt.delete(e.pointerId);if(moved<8&&!Pt.size)tap(e.clientX,e.clientY)};
cv.onwheel=e=>{e.preventDefault();zoom(e.deltaY<0?1.12:.89)};
function tap(sx,sy){let[wx_,wy]=w2(sx,sy),X=wx_|0,Y=wy|0;if(X<0||Y<0||X>=N||Y>=N||wx_<0||wy<0)return;
 if(tool){tool=='X'?demolish(X,Y):tool in TF?terra(tool,X,Y):place(tool,X,Y);vm=null;return}
 let n=npcs.find(n=>(!n.in||n.in.o)&&Math.hypot(n.x-wx_,n.y-.3-wy)<.5);
 if(n){view={t:'npc',o:n};follow=n}else if(bg[Y*N+X])view={t:'bld',o:bg[Y*N+X]};else{view=null;follow=null}refresh();hintUI()}

const bar=v=>`<span class="b"><i style="width:${clamp(v,0,100)}%"></i></span>`,toast=(m,ms=2600)=>{let t=$('toast');t.textContent=m;t.style.opacity=1;clearTimeout(toast.h);toast.h=setTimeout(()=>t.style.opacity=0,ms)};
const prod=(b,st)=>'fwsgc'.split('').filter(r=>b[r]).map(r=>(b[r]>0?'+':'')+(+(b[r]*st).toFixed(1))+IC[r]).join(' ');
function vBuild(){return'<div class="ch">'+['Home','Work','Joy','Magic','Path'].map(c=>`<b data-a="cat:${c}" class="${c==cat?'on':''}">${c}</b>`).join('')+'<b data-a="pick:X">🧹 Demolish</b></div><div class="gr">'+CAT.filter(b=>b.cat==cat).map(b=>{let l=b.u>npcs.length;return`<button data-a="pick:${b.k}" ${l?'disabled':''}>${b.e}<br>${b.n}<small>${l?'🔒 pop '+b.u:cost(b)}</small></button>`}).join('')+'</div>'}
function vStats(){const row=(l,v)=>`<div class="r">${l} ${bar(v)} ${v|0}</div>`;
 return`<b>${M.rank}</b> · goal: 👥500, 😊90, 💰90, 🌸90`+row('😊 Happiness',M.hap)+row('💰 Prosperity',M.pro)+row('🌸 Beauty',M.bea)+row('🔮 Magic',M.mag)+row('🧳 Tourism',M.tou)+
 `<div class="r">👥 ${npcs.length}/500 · 🏠 beds ${bl.reduce((a,b)=>a+(b.home||0),0)} · 💼 jobs ${npcs.filter(n=>n.work).length}/${bl.reduce((a,b)=>a+(b.job||0),0)}</div><div class="cr"><button data-a="save">💾 Save</button><button data-a="new">🆕 New town</button></div>`}
function vFolk(){return`<b>Residents (${npcs.length})</b><div class="lst">`+npcs.slice().sort((a,b)=>a.name<b.name?-1:1).slice(0,80).map(n=>`<div data-a="npc:${n.id}">${PERS[n.pers][0]} <b>${n.name}</b><span>${n.hap|0}%</span><small>${n.work?n.work.n:'No job'}: ${n.act}</small></div>`).join('')+'</div>'}
function vQ(){return'<b>📜 Requests</b>'+(quests.map(q=>{let[k,n,t]=QT[q.t];return`<div class="q">💬 <b>${q.who}</b>: ${t}<br><small>${Math.min(cnt[k]||0,n)}/${n} · 🪙${70+n*12}${k=='wizard'||k=='theater'?' 💎2':''} +😊</small></div>`}).join('')||'<div>No requests right now.</div>')}
function vNpc(n){let f=Object.entries(n.fr).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([i,v])=>{let o=NM.get(+i);return o?o.name+(v>60?' 💖':v>30?' 💕':' 🙂'):''}).join(', ')||'None yet';
 return`<div class="nh"><span class="pt" style="background:${PERS[n.pers][1]}">${PERS[n.pers][0]}</span><div><b>${n.name}</b>, ${n.age}<br><small>${n.work?n.work.n+' worker':'Wanderer'} · ${n.pers}</small></div><button data-a="close">✕</button></div>
 😊 ${bar(n.hap)} ⚡ ${bar(n.en)} 🪙${n.wealth|0}<br>Now: <b>${n.act}</b><br>🏠 ${n.home?n.home.n:'Homeless'} · 💼 ${n.work?n.work.n:'No job'}<br>Friends: ${f}<br><small>Day: wake 6 · work 7–12, 13–17 · lunch 12 · free time likes ${LV[n.pers].join(', ')} · sleep 22</small>`}
function vBld(b){let st=b.job?Math.min(1,b.wk.length/b.job):1,p=prod(b,st);
 return`<div class="nh"><span class="pt">${b.e}</span><div><b>${b.n}</b><br><small>${b.cat}</small></div><button data-a="close">✕</button></div>`+
 `❤️ Health: ${b.hp|0}/${b.mhp} ${b.hp<b.mhp?`<button data-a="repair:${bl.indexOf(b)}">Repair (🪙${REPAIR_COST_G} 🪵${REPAIR_COST_W})</button>`:''}<br>`+
 (b.job?`👷 Workers ${b.wk.length}/${b.job}: ${b.wk.map(n=>n.name).join(', ')||'none'}<br>`:'')+(b.home?`🏠 Residents ${b.res.length}/${b.home}: ${b.res.map(n=>n.name).join(', ')||'none'}<br>`:'')+
 (p?`Per day: ${p} (negative = consumed)<br>`:'')+(b.hap?`😊 +${b.hap} to homes within 8 tiles<br>`:'')+(b.bea?`🌸 Beauty +${b.bea} `:'')+(b.mag?`🔮 Magic +${b.mag} `:'')+(b.tou?`🧳 Tourism +${b.tou}`:'')+upgBtn(b)}
function refresh(){if(!view){sheet.hidden=true;return}let st=sheet.scrollTop;sheet.hidden=false;sheet.innerHTML=({build:vBuild2,trade:vTrade,hero:vHero,stats:vStats,folk:vFolk,quests:vQ,npc:()=>vNpc(view.o),bld:()=>vBld(view.o)})[view.t]();sheet.scrollTop=st}
function hintUI(){let h=$('hint');h.hidden=!tool;if(tool)h.innerHTML=tool in TF?`${TF[tool][0]} ${TF[tool][1]} (${cost({$:TF[tool][4]})}) · tap a green tile · tap here to stop`:tool=='X'?'🧹 Tap a building or road to remove it · tap here to stop':`Placing ${BK[tool].e} ${BK[tool].n} (${cost(BK[tool])}) · tap here to stop`;
 document.querySelectorAll('[data-a^=spd]').forEach(b=>b.classList.toggle('on',b.dataset.a=='spd:'+spd))}
document.onclick=e=>{let a=e.target.closest('[data-a]');if(!a)return;let[c,v]=a.dataset.a.split(':');
 if(c=='tab'){view=view&&view.t==v?null:{t:v};tool=null;follow=null}else if(c=='cat')cat=v;else if(c=='pick'){tool=v;view=null;vm=null}else if(c=='buy'||c=='sell')trade(c,v);else if(c=='spd')spd=+v;
 else if(c=='close'){view=null;follow=null}else if(c=='npc'){let n=NM.get(+v);view={t:'npc',o:n};follow=n}else if(c=='repair'){repairBuilding(bl[+v])}else if(c=='save')save();else if(c=='cancel')tool=null;
 else if(c=='new'){if(newArm){localStorage.removeItem('fh1');newArm=0;init();view=null}else{newArm=1;toast('Tap “New town” again to confirm')}}
 hintUI();refresh()};
function ui(){let bd=bl.reduce((a,b)=>a+(b.home||0),0),fb=bd-npcs.length;
 $('top').innerHTML=`🪙${res.g|0} 🍞${res.f|0} 🪵${res.w|0} 🪨${res.s|0} 💎${res.c|0} <span style="${fb<=0?'color:#c0392b':''}">👥${npcs.length}/${bd}</span> 😊${M.hap|0}%<small>${M.rank} · ${fb>0?'🛏️'+fb+' free':'🏠 FULL'} · ${SN[season()]} Y${(D-1)/32+1|0} D${(D-1)%8+1} · ${hh()} ${WI[wx]}${fest?' · 🎉 '+fest:''}</small>`}

let last=performance.now();
function loop(now){let dt=Math.min(.1,(now-last)/1000);last=now;if(spd){let sd=dt*spd;tm+=sd*.2;if(tm>=24){tm-=24;newDay()}sim(sd)}render(now/1000);requestAnimationFrame(loop)}
let sv=null;try{sv=JSON.parse(localStorage.getItem('fh1'))}catch(e){}
try{init(sv)}catch(e){init()}
addEventListener('resize',rs);rs();ui();hintUI();
setInterval(ui,250);setInterval(minimap,300);
setInterval(()=>{calc();quest();if(view&&['npc','bld','stats','quests'].includes(view.t))refresh()},1000);
setInterval(save,30000);
requestAnimationFrame(loop);
