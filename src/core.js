/* core.js — town simulation: grid, buildings, NPCs, economy, rendering, input, UI panels
 Load order: 1st */
"use strict";
const N=50,T=32,$=i=>document.getElementById(i),cv=$('c'),g=cv.getContext('2d'),mm=$('mm'),mg=mm.getContext('2d'),sheet=$('sheet'),
clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),R=(a,b)=>a+Math.random()*(b-a),pk=a=>a[Math.random()*a.length|0];

const BLD_BASE_HP=100, REPAIR_COST_G=15, REPAIR_COST_W=10;

const CAT=`townhall|🏛️|Town Hall|Home|150/50/50/0|home=4,bea=3,g=8,u=0
cottage|🏠|Cottage|Home|40/10/0/0|home=2
family|🏡|Family House|Home|90/25/5/0|home=4
noble|🏰|Noble Home|Home|220/20/40/0|home=3,bea=2,g=6,u=20
inn|🛏️|Inn|Home|120/30/10/0|home=2,job=2,tou=2,g=5
hero_home|⛺|Hero Home|Home|100/30/20/0|home=1,job=1,u=10
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
 if(res.g<c[0]||res.w<c[1]||res.s<c[2]||res.c<c[3])return toast('Not enough resources');res.g-=c[0];res.w-=c[1];res.s-=c[2];res.c-=c[3];
 let placedBld = put(k,x,y);assign();calc();
 if(typeof checkHeroHomeBuilt==='function') checkHeroHomeBuilt(placedBld);
}
function demolish(x,y){
  let i=y*N+x,b=bg[i];
  if(b){
    if(b.k==='townhall') return toast('🏛️ The Town Hall cannot be demolished! It must be protected from monsters.');
    b.dead=1;bl.splice(bl.indexOf(b),1);bg[i]=null;b.$.forEach((v,j)=>res['gwsc'[j]]+=v/2);assign()
  }else if(rd[i]){rd[i]=0;res.g+=1}
  calc()
}
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
  let th = bl.find(b=>b.k=='townhall');
  if(bl.
