/* dungeon.js — dungeon generation, Diablo-style action combat, enter/leave/die, fullscreen dungeon view
 Needs from core.js: pk IC K clamp $ toast view tool refresh calc res spr
 Needs from hero.js: EL EI mult MO PZ GN DW DH RK SK HR tombs stash hgen newHero stat ens gate gainXP
 Needs from items.js: RAR SLI rollItem dropAt wel ael
 Needs from boss.js (at call time): spawnBoss bossAI shoot prStep telStep bossDie drawBossFx
 Provides: dg wall fx genD setup bfs nearM tgt mvTo hit hurt kill cast dodge dStep enter leave die
           tsz sizeD mk skillBar hudUp dRender dFrame
 Controls (ARPG layout): left virtual stick (or WASD/arrows) = move · hold ⚔️ (or F) = chase+attack nearest · round skill buttons (or keys 1-9) · 💨 (or Space) = dodge roll
 Load order: after items.js */
let dg=null,lt2=0,hud=0,activeSkillRange=null;
const wall=(x,y)=>(dg.m[y|0]||[])[x|0]!==0,fx=(x,y,t,c)=>dg.fx.push({x,y,t,c,l:1.3}),RGE={fire:'👺',water:'🐡',earth:'🧙',wind:'🦜'};

function genD(f){for(;;){let m=Array.from({length:DH},()=>Array(DW).fill(1)),rs=[];
 for(let k=0;k<80&&rs.length<6+(f>3);k++){let w=4+Math.random()*5|0,h=4+Math.random()*4|0,x=1+Math.random()*(DW-w-2)|0,y=1+Math.random()*(DH-h-2)|0;if(rs.some(r=>x<r.x+r.w+1&&x+w+1>r.x&&y<r.y+r.h+1&&y+h+1>r.y))continue;rs.push({x,y,w,h,cx:x+w/2|0,cy:y+h/2|0});for(let a=y;a<y+h;a++)for(let b=x;b<x+w;b++)m[a][b]=0}
 if(rs.length<3)continue;for(let i=1;i<rs.length;i++){let A=rs[i-1],B=rs[i];for(let x=Math.min(A.cx,B.cx);x<=Math.max(A.cx,B.cx);x++)m[A.cy][x]=0;for(let y=Math.min(A.cy,B.cy);y<=Math.max(A.cy,B.cy);y++)m[y][B.cx]=0}return{m,rs}}}

function setup(f){let{m,rs}=genD(f),z=dg.z,bf=f%5==0,L=rs[rs.length-1];
 if(bf)for(let a=Math.max(1,L.y-1);a<=Math.min(DH-2,L.y+L.h);a++)for(let c=Math.max(1,L.x-1);c<=Math.min(DW-2,L.x+L.w);c++)m[a][c]=0;
 Object.assign(dg,{f,m,mons:[],ch:[],fx:[],drops:[],pr:[],tel:[],boss:null,tg:null,dn:null,shake:0,fd:{x:0,y:1},path:[],cd:{},at:0,b:{atk:0,spd:0,sh:0,shv:0,inv:0,swing:0},ent:{x:rs[0].cx+.5,y:rs[0].cy+.5},st:{x:L.cx+.5,y:L.cy+.5}});dg.p={...dg.ent};
 rs.slice(1).forEach((r,ri)=>{if(bf&&ri==rs.length-2)return;let n=1+Math.random()*(1+f/2)|0;
  for(let k=0;k<n;k++){let el=Math.random()<.7?z:pk(EL),lv=f+(Math.random()<.3?1:0),mo={x:r.x+1+Math.random()*(r.w-2),y:r.y+1+Math.random()*(r.h-2),el,lv,e:pk(MO[el]),hp:18+8*lv,mhp:18+8*lv,atk:4+2*lv,def:lv*.8,cd:1,sp:1.1+Math.random()*.4,sz:1,src:'m'};
   if(f>=2&&Math.random()<.2){mo.rg=1;mo.sp*=.8;mo.e=RGE[el]}
   else if(Math.random()<.07+.01*f){mo.src='e';mo.nm=pk(['Brutal','Cursed','Savage','Vicious']);mo.mhp=mo.hp=Math.round(mo.hp*2.2);mo.atk=Math.round(mo.atk*1.3);mo.sz=1.25}
   dg.mons.push(mo)}
  if(Math.random()<.5)dg.ch.push({x:r.cx+.5,y:r.cy+.5})});
 if(bf)spawnBoss(L)}

function bfs(m,a,b){const k=(x,y)=>y*DW+x;let pr={[k(a[0],a[1])]:-1},q=[a];while(q.length){let[x,y]=q.shift();if(x==b[0]&&y==b[1])break;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){let X=x+dx,Y=y+dy;if(X<0||Y<0||X>=DW||Y>=DH||m[Y][X]||k(X,Y)in pr)continue;pr[k(X,Y)]=k(x,y);q.push([X,Y])}}
 let p=[],c=k(b[0],b[1]);if(!(c in pr))return[];while(c!=k(a[0],a[1])){p.unshift([c%DW,c/DW|0]);c=pr[c]}return p}

const KS={},kvec=()=>{let x=(KS.KeyD||KS.ArrowRight?1:0)-(KS.KeyA||KS.ArrowLeft?1:0),y=(KS.KeyS||KS.ArrowDown?1:0)-(KS.KeyW||KS.ArrowUp?1:0),m=Math.hypot(x,y);return m?{x:x/m,y:y/m,k:1}:null},
nearM=()=>{let b=null,bd=99;for(const m of dg.mons){let d=Math.hypot(m.x-dg.p.x,m.y-dg.p.y);if(d<bd){bd=d;b=m}}return[b,bd]},
tgt=()=>dg.tg&&dg.tg.hp>0?[dg.tg,Math.hypot(dg.tg.x-dg.p.x,dg.tg.y-dg.p.y)]:nearM(),
mvTo=(tx,ty,st)=>{let P=dg.p,dx=tx-P.x,dy=ty-P.y,d=Math.hypot(dx,dy);if(d<.12)return;let s=Math.min(st,d),nx=P.x+dx/d*s,ny=P.y+dy/d*s;dg.fd={x:dx/d,y:dy/d};if(!wall(nx,P.y))P.x=nx;if(!wall(P.x,ny))P.y=ny},
mvM=(m,ux,uy,s)=>{let nx=m.x+ux*s,ny=m.y+uy*s;if(!wall(nx,m.y))m.x=nx;if(!wall(m.x,ny))m.y=ny};

function hit(m,dmg,el){let S=stat(HR),x=mult(el,m.el),d=Math.max(1,Math.round(dmg*x*(.85+Math.random()*.3)-m.def*.5)),cr=Math.random()*100<S.cr;if(cr)d=Math.round(d*1.8);
 m.hp-=d;if(S.ls)HR.hp=Math.min(S.mhp,HR.hp+d*S.ls/100);if(cr)dg.shake=Math.max(dg.shake,.08);
 fx(m.x,m.y,(cr?'CRIT ':'-')+d,cr?'#ff8a2b':x>1?'#ffcf33':x<1?'#9ab':'#fff');if(x>1)fx(m.x,m.y-.4,'Super effective!','#ffcf33');if(x<1)fx(m.x,m.y-.4,'Resisted','#9ab');if(m.hp<=0)kill(m)}

function hurt(raw,el,who){const b=dg.b,S=stat(HR);if(b.inv>0){fx(dg.p.x,dg.p.y-.3,'Dodged','#9ef');return}
 let x=mult(el,b.sh>0?b.shEl:ael()),dm=Math.max(1,Math.round(raw*x-S.def*.5));if(b.sh>0){let a=Math.min(b.shv,dm);b.shv-=a;dm-=a;if(b.shv<=0)b.sh=0}
 if(dm>0){HR.hp-=dm;dg.shake=Math.max(dg.shake,.12)}fx(dg.p.x,dg.p.y-.3,dm>0?'-'+dm+(x>1?'!':''):'Blocked','#f77');if(HR.hp<=0){die(who);return 1}}

function kill(m){dg.mons.splice(dg.mons.indexOf(m),1);if(dg.tg==m)dg.tg=null;let P=dg.pack,L=m.lv,S=stat(HR),el=m.src=='e',gd=Math.round((2+L*2)*(el?3:1)*(1+S.gf/100));P.g+=gd;fx(m.x,m.y-.2,'+'+gd+'🪙','#fd6');
 if(m.boss)return bossDie(m);
 if(Math.random()<.45){let r=pk(['w','s','f']),n=1+Math.random()*3|0;P[r]+=n;fx(m.x,m.y-.5,'+'+n+IC[r],'#fff')}
 if(el||Math.random()<.3){P.E[m.el]++;fx(m.x,m.y-.8,'+'+EI[m.el]+' essence','#cff')}
 if(Math.random()<.04+.015*dg.f){P.gem++;fx(m.x,m.y-1.1,'+💠 rare gem!','#f9f')}
 if(Math.random()<(el?.5:.06+.004*dg.f))dropAt(m.x,m.y,rollItem(f||1,m.src));
 if(Math.random()<.09)dg.drops.push({x:m.x,y:m.y,orb:1});
 gainXP((10+L*6)*(el?2.5:1)|0)}

function cast(id){
 let k=SK.find(s=>s.id==id);
 if(!HR.sk.includes(id))return;
 let cdMap = dg ? dg.cd : (HR.cd = HR.cd || {});
 if(cdMap[id] > 0) return;
 let S=stat(HR),lvl=(HR.slvl&&HR.slvl[id])||1,b=dg?dg.b:(HR.b=HR.b||{atk:0,spd:0,sh:0,shv:0,inv:0,swing:0}),[m,d]=tgt();
 let powerBonus = 1 + (lvl-1)*0.25;
 if(k.t=='atk'){
  if(dg && (!m || d>5))return fx(dg.p.x,dg.p.y,'No target','#ccc');
  if(m) hit(m, S.atk * 1.8 * powerBonus, k.el);
  fx(dg?dg.p.x:HR.x, dg?dg.p.y:HR.y, k.e + ' L'+lvl, '#fff');
 } else if(k.t=='def'){
  b.sh=5; b.shv=(10 + S.def*2 + HR.lv*3) * powerBonus; b.shEl=k.el;
  fx(dg?dg.p.x:HR.x, dg?dg.p.y:HR.y, '🛡️'+EI[k.el]+' L'+lvl, '#fff');
 } else {
  if(k.el=='fire')b.atk=6*powerBonus;
  else if(k.el=='wind')b.spd=6*powerBonus;
  else if(k.el=='water')HR.hp=Math.min(S.mhp,HR.hp+S.mhp*(0.35*powerBonus));
  else { HR.hp=Math.min(S.mhp,HR.hp+S.mhp*(0.2*powerBonus)); b.sh=5; b.shv=8*powerBonus; b.shEl='earth'; }
  fx(dg?dg.p.x:HR.x, dg?dg.p.y:HR.y, '✨'+k.n+' L'+lvl, '#cfc');
 }
 cdMap[id] = Math.max(1, k.cd - (lvl-1)*0.4);
}

function dodge(){if(!dg||dg.cd.dodge>0)return;let P=dg.p,u=null,c=$('dc'),ts=tsz(),js=dg.js||kvec();
 if(js)u={x:js.x,y:js.y};
 else if(dg.dn&&dg.dn.t>.3){let dx=(dg.dn.sx-c.width/2)/ts,dy=(dg.dn.sy-c.height/2)/ts,d=Math.hypot(dx,dy)||1;u={x:dx/d,y:dy/d}}
 else if(dg.path.length){let q=dg.path[0],dx=q[0]+.5-P.x,dy=q[1]+.5-P.y,d=Math.hypot(dx,dy)||1;u={x:dx/d,y:dy/d}}
 else{let[m,d]=nearM();u=m&&d<4&&d>.01?{x:(P.x-m.x)/d,y:(P.y-m.y)/d}:dg.fd}
 for(let i=0;i<8;i++){let nx=P.x+u.x*.3,ny=P.y+u.y*.3;if(!wall(nx,P.y))P.x=nx;if(!wall(P.x,ny))P.y=ny}dg.path=[];dg.b.inv=.45;dg.cd.dodge=2.5;fx(P.x,P.y-.3,'💨','#9ef')}

function dStep(dt){const P=dg.p,b=dg.b,S=stat(HR);for(const k in dg.cd)dg.cd[k]-=dt;b.atk-=dt;b.spd-=dt;b.inv-=dt;b.swing=Math.max(0,b.swing-dt);dg.shake=Math.max(0,dg.shake-dt);if(b.sh>0&&(b.sh-=dt)<=0)b.shv=0;
 const js=dg.js||kvec();if(dg.ah||KS.KeyF){if(!dg.tg||dg.tg.hp<=0){let[m,d]=nearM();if(m&&d<8)dg.tg=m}}
 const st=3.2*(1+S.ms/100)*(b.spd>0?1.6:1)*dt,tg=dg.tg&&dg.tg.hp>0?dg.tg:(dg.tg=null);
 if(js){dg.path=[];dg.dn=null;if(!(dg.ah||KS.KeyF))dg.tg=null;mvTo(P.x+js.x,P.y+js.y,st*Math.max(.35,js.k||1))}
 else if(dg.dn&&(dg.dn.t+=dt)>.3){let c=$('dc'),ts=tsz();dg.path=[];mvTo((dg.dn.sx-c.width/2)/ts+P.x,(dg.dn.sy-c.height/2)/ts+P.y,st)}
 else{if(tg){if(Math.hypot(tg.x-P.x,tg.y-P.y)<=(tg.boss?1.5:1.2))dg.path=[];else if((dg.rp=(dg.rp||0)-dt)<=0){dg.rp=.4;dg.path=bfs(dg.m,[P.x|0,P.y|0],[tg.x|0,tg.y|0])}}
  if(dg.path.length){let q=dg.path[0];mvTo(q[0]+.5,q[1]+.5,st);if(Math.hypot(q[0]+.5-P.x,q[1]+.5-P.y)<.1)dg.path.shift()}}
 if((dg.at-=dt)<=0){let[m,d]=tgt();if(m&&d<(m.boss?1.7:1.4)){dg.at=.8;b.swing=0.3;hit(m,S.atk*(b.atk>0?1.5:1),wel())}}
 for(const m of dg.mons.slice()){if(m.hp<=0)continue;let dx=P.x-m.x,dy=P.y-m.y,d=Math.hypot(dx,dy)||.01;m.cd-=dt;if(m.boss)bossAI(m,dt);
  if(m.rg){let w=d<3?-1:d>5?1:0;if(w&&d<9)mvM(m,dx/d*w,dy/d*w,m.sp*dt);if(d<7&&m.cd<=0){m.cd=2.2;shoot(m,P,m.atk*.85,1)}}
  else{let rc=m.boss?1.6:1.1;if(d<(m.boss?14:7)&&d>rc-.2)mvM(m,dx/d,dy/d,m.sp*dt);if(d<=rc&&m.cd<=0){m.cd=m.boss?1.6:1.1;if(hurt(m.atk,m.el,m.nm||m.e))return}}}
 if(prStep(dt)||telStep(dt))return;
 dg.drops=dg.drops.filter(d=>{if(Math.hypot(d.x-P.x,d.y-P.y)>.8)return 1;if(d.orb){HR.hp=Math.min(S.mhp,HR.hp+S.mhp*.18);fx(d.x,d.y,'❤️ +HP','#f99')}else{dg.pack.it.push(d.it);fx(d.x,d.y,d.it.n,RAR[d.it.r].b)}return 0});
 dg.ch=dg.ch.filter(c=>{if(Math.hypot(c.x-P.x,c.y-P.y)>.8)return 1;let f=dg.f,p=dg.pack;p.g+=8*f;p.w+=2+f;p.s+=2+f;if(Math.random()<.6)p.E[pk(EL)]+=1+(f/3|0);if(Math.random()<.35)p.gem++;if(Math.random()<.3)dropAt(c.x,c.y+.5,rollItem(f,'c'));fx(c.x,c.y,'📦 Loot!','#ff9');return 0});
 if(Math.hypot(dg.st.x-P.x,dg.st.y-P.y)<.7){if(dg.boss&&dg.boss.hp>0){if((dg.sl=(dg.sl||0)-dt)<=0){dg.sl=2;fx(P.x,P.y-.5,'🔒 Defeat the guardian','#f88')}}
  else{let f=dg.f+1;HR.hp=Math.min(S.mhp,HR.hp+S.mhp*.2);setup(f);fx(dg.p.x,dg.p.y,'Floor '+f+(f%5==0?' · BOSS':''),'#fff');return}}
 dg.fx.forEach(e=>{e.l-=dt;e.y-=dt*.6});dg.fx=dg.fx.filter(e=>e.l>0)}

function enter(el){
 if(dg||!HR||!HR.alive||!gate())return toast('Your hero must be waiting at a Dungeon Gate');
 let randEl = el || pk(EL);
 dg={z:randEl,pack:{g:0,w:0,s:0,f:0,c:0,gem:0,E:{fire:0,water:0,earth:0,wind:0},it:[]}};
 setup(1);view=null;tool=null;mk();$('dg').hidden=false;sizeD();skillBar();
 toast('Entering ' + EI[randEl] + ' Dungeon!');
}

function leave(){if(Math.hypot(dg.p.x-dg.ent.x,dg.p.y-dg.ent.y)>1.5)return toast('Walk back to the 🌀 to leave');let P=dg.pack;ens();RK.forEach(k=>res[k]=(res[k]||0)+P[k]);EL.forEach(e=>res.E[e]+=P.E[e]);P.it.forEach(i=>stash.push(i));HR.hp=stat(HR).mhp;HR.on=1;placeHero();
 toast(`🧝 Home with 🪙${P.g} 🪵${P.w} 🪨${P.s} 🍞${P.f} 💎${P.c} 💠${P.gem}${P.it.length?' · '+P.it.length+' item(s)':''} + essences`,4500);dg=null;$('dg').hidden=true;view={t:'hero'};refresh();calc()}

const tpos=G=>{for(let i=0;;i++){let x=G.x+[0,1,-1][i%3],y=G.y+1+(i/3|0);if(!tombs.some(t=>t.x==x&&t.y==y))return{x,y}}};
function die(who){let P=dg.pack,h=k=>k/2|0,G=gate()||{x:25,y:25},at=tpos(G),it=Object.values(HR.eq).filter(Boolean).concat(P.it);
 tombs.push({x:at.x,y:at.y,n:HR.n,lv:HR.lv,w:HR.w,a:HR.a,it,by:who||'the dark',z:dg.z,fl:dg.f,p:{...Object.fromEntries(RK.map(k=>[k,h(P[k])])),E:Object.fromEntries(EL.map(e=>[e,h(P.E[e])]))}});
 hgen++;HR=newHero();HR.alive=0;HR.rs=1;dg=null;$('dg').hidden=true;toast('💀 Your hero has fallen. A tombstone marks the gate — tap it to recover the loot.',5000);view={t:'hero'};refresh()}

const tsz=()=>clamp($('dc').width/10,32*K,56*K),sizeD=()=>{let c=$('dc');c.width=innerWidth*K|0;c.height=innerHeight*K|0};
function mk(){if($('dg'))return;let d=document.createElement('div');d.id='dg';d.hidden=true;
 d.innerHTML='<canvas id="dc"></canvas><div id="dh"></div><button id="dx" data-s="leave">🚪 Leave</button><div id="dj"><div id="dk"></div></div><div id="dr"><div id="ds"></div><div id="db"><button data-s="dodge" class="rb">💨</button><button id="da" class="rb big">⚔️</button></div></div>';document.body.appendChild(d);
 let s=document.createElement('style');s.textContent='#dg{position:fixed;inset:0;z-index:20;background:#222;touch-action:none;user-select:none;-webkit-user-select:none}#dc{width:100%;height:100%;touch-action:none}#dh{position:fixed;left:0;right:0;top:0;padding:calc(6px + env(safe-area-inset-top,0px)) 10px 6px;background:#000a;color:#fff;font-weight:700;text-align:center;pointer-events:none}'+
  '#dx{position:fixed;right:8px;top:calc(92px + env(safe-area-inset-top,0px));background:#0008;color:#fff;border-radius:14px;padding:4px 10px;font-size:13px}'+
  '#dj{position:fixed;left:14px;bottom:calc(22px + env(safe-area-inset-bottom,0px));width:132px;height:132px;border-radius:50%;background:#fff2;border:2px solid #fff5;touch-action:none}#dk{position:absolute;left:38px;top:38px;width:56px;height:56px;border-radius:50%;background:#fff7;pointer-events:none}'+
  '#dr{position:fixed;right:10px;bottom:calc(18px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;align-items:flex-end;gap:10px}#ds{display:flex;flex-wrap:wrap-reverse;justify-content:flex-end;gap:20px 6px;max-width:190px}#db{display:flex;gap:10px;align-items:flex-end}'+
  '#dg .rb,#ds button{width:52px;height:52px;border-radius:50%;background:#fff3;border:2px solid #fff6;color:#fff;font-size:20px;line-height:1.05;padding:0;touch-action:none;position:relative}#dg .big{width:78px;height:78px;font-size:32px;background:#e5484d99}#da.on{background:#ff8a2bcc}.sn{position:absolute;left:-6px;right:-6px;bottom:-14px;font-size:9px;line-height:1;text-align:center;color:#fff;text-shadow:0 0 3px #000,0 0 3px #000;pointer-events:none}.sl{position:absolute;top:-2px;right:-2px;font-size:9px;background:#000b;color:#fff;padding:1px 3px;border-radius:6px}.cdn{position:absolute;inset:0;display:grid;place-items:center;font-size:20px;color:#fff;background:#000a;border-radius:50%}';document.head.appendChild(s);
 
 d.onclick=e=>{let b=e.target.closest('button[data-s]');if(!b||!dg)return;let id=b.dataset.s;id=='leave'?leave():id=='dodge'?dodge():cast(id)};addEventListener('resize',sizeD);
 
 d.onpointerdown=e=>{let b=e.target.closest('button[data-s]');if(b&&b.dataset.s!='dodge'){activeSkillRange=b.dataset.s}};
 d.onpointerup=d.onpointercancel=()=>{activeSkillRange=null};

 addEventListener('keydown',e=>{if(!dg)return;KS[e.code]=1;if(e.code=='Space'){e.preventDefault();dodge()}else if(e.code.startsWith('Arrow'))e.preventDefault();else{let i=+e.key;if(i>=1&&i<=HR.sk.length)cast(HR.sk[i-1])}});addEventListener('keyup',e=>{KS[e.code]=0});
 
 const j=$('dj'),kn=$('dk');let jid=null;
 const jv=e=>{let r=j.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),m=Math.hypot(dx,dy)||1,R=r.width/2,c=Math.min(m,R*.62);if(dg)dg.js=m>9?{x:dx/m,y:dy/m,k:Math.min(1,m/R)}:null;kn.style.transform=`translate(${dx/m*c}px,${dy/m*c}px)`};
 j.onpointerdown=e=>{jid=e.pointerId;j.setPointerCapture(jid);jv(e)};j.onpointermove=e=>{if(e.pointerId==jid)jv(e)};
 j.onpointerup=j.onpointercancel=e=>{if(e.pointerId!=jid)return;jid=null;if(dg)dg.js=null;kn.style.transform='translate(0,0)'};
 
 const A=$('da');A.onpointerdown=e=>{A.setPointerCapture(e.pointerId);if(dg)dg.ah=1;A.classList.add('on')};A.onpointerup=A.onpointercancel=()=>{if(dg)dg.ah=0;A.classList.remove('on')};
 
 const c=$('dc');
 c.onpointerdown=e=>{if(!dg)return;c.setPointerCapture(e.pointerId);let ts=tsz(),sx=e.clientX*K,sy=e.clientY*K,wx=(sx-c.width/2)/ts+dg.p.x,wy=(sy-c.height/2)/ts+dg.p.y,m=dg.mons.find(m=>Math.hypot(m.x-wx,m.y-wy)<.55*(m.sz||1)+.15);
  if(m){dg.tg=m;dg.path=[];dg.dn=null;return}
  dg.tg=null;let tx=wx|0,ty=wy|0;if(dg.m[ty]&&dg.m[ty][tx]===0)dg.path=bfs(dg.m,[dg.p.x|0,dg.p.y|0],[tx,ty]);dg.dn={sx,sy,x0:sx,y0:sy,t:0}};
 c.onpointermove=e=>{if(!dg||!dg.dn)return;let d=dg.dn;d.sx=e.clientX*K;d.sy=e.clientY*K;if(Math.hypot(d.sx-d.x0,d.sy-d.y0)>12*K)d.t=Math.max(d.t,.31)};
 c.onpointerup=c.onpointercancel=()=>{if(dg)dg.dn=null}}

function skillBar(){
 let elColors={fire:'#ff6a2b',water:'#3ab0ff',earth:'#a98a3c',wind:'#8fe3c4'};
 $('ds').innerHTML=HR.sk.map(id=>{
  let k=SK.find(s=>s.id==id),lvl=(HR.slvl&&HR.slvl[id])||1;
  let bgCol=elColors[k.el]||'#fff3';
  return`<button data-s="${id}" title="${k.n} (Lv ${lvl}): ${k.desc}" style="border-color:${bgCol}">${k.e}<small class="sn">${k.n}</small><small class="sl">L${lvl}</small></button>`
 }).join('')+(HR.sk.length?'':'<small style="color:#fff;text-align:right">No skills yet.<br>Learn some in the ⚔️ tab.</small>')}

function hudUp(){let S=stat(HR),P=dg.pack,B=dg.boss&&dg.boss.hp>0?dg.boss:null;$('dh').innerHTML=`${EI[dg.z]} Floor ${dg.f}${dg.f%5==0?' · BOSS':''} · ❤️ ${Math.max(0,HR.hp)|0}/${S.mhp} · Lv ${HR.lv}${dg.b.sh>0?' 🛡️'+(dg.b.shv|0):''}`+
 (B?`<br>👹 ${B.nm}${B.enr?' 😡':''}<div style="margin:3px auto;width:70%;height:8px;background:#400;border-radius:4px"><div style="width:${Math.max(0,B.hp/B.mhp*100)}%;height:8px;background:#e33;border-radius:4px"></div></div>`:'')+
 `<br><small>Pack 🪙${P.g} 🪵${P.w} 🪨${P.s} 🍞${P.f} 💠${P.gem} 🎁${P.it.length} ${EL.map(e=>EI[e]+P.E[e]).join(' ')} · stick = move · hold ⚔️ = chase &amp; attack · 💨 dodges red circles</small>`;
 [...$('dg').querySelectorAll('button[data-s]')].forEach(b=>{let id=b.dataset.s,k=SK.find(s=>s.id==id);if(k||id=='dodge'){let c=(dg.cd[id]||0);b.style.opacity=c>0?.4:1;b.innerHTML=(k?k.e+'<small class="sn">'+k.n+'</small>'+'<small class="sl">L'+((HR.slvl&&HR.slvl[id])||1)+'</small>':'💨')+(c>0?'<b class="cdn">'+Math.ceil(c)+'</b>':'')}})}

function dRender(){const c=$('dc'),x=c.getContext('2d'),W=c.width,Hh=c.height,ts=tsz(),P=dg.p,sk=dg.shake*ts*.25,ox=W/2-P.x*ts+(Math.random()-.5)*sk,oy=Hh/2-P.y*ts+(Math.random()-.5)*sk,pal=PZ[dg.z];x.fillStyle=pal[1];x.fillRect(0,0,W,Hh);
 for(let j=Math.max(0,Math.floor(-oy/ts));j<DH&&oy+j*ts<Hh;j++)for(let i=Math.max(0,Math.floor(-ox/ts));i<DW&&ox+i*ts<W;i++)if(dg.m[j][i]===0){x.fillStyle=pal[0];x.fillRect(ox+i*ts,oy+j*ts,ts+1,ts+1);if((i+j)%2){x.fillStyle='rgba(255,255,255,.12)';x.fillRect(ox+i*ts,oy+j*ts,ts,ts)}}
 const S=(e,px,py,sz=1)=>x.drawImage(spr(e),ox+(px-sz/2)*ts,oy+(py-sz/2)*ts,sz*ts,sz*ts);
 S('🌀',dg.ent.x,dg.ent.y);S(dg.boss&&dg.boss.hp>0?'🔒':'⬇️',dg.st.x,dg.st.y);dg.ch.forEach(q=>S('📦',q.x,q.y,.8));drawBossFx(x,ox,oy,ts);x.textAlign='center';x.font=`bold ${.3*ts}px system-ui`;
 dg.drops.forEach(d=>{if(d.orb)return S('❤️',d.x,d.y,.5);let R=RAR[d.it.r];x.fillStyle=R.b;x.globalAlpha=.3+.2*Math.sin(Date.now()/200);x.beginPath();x.arc(ox+d.x*ts,oy+d.y*ts,.32*ts,0,7);x.fill();x.globalAlpha=1;S(SLI[d.it.sl],d.x,d.y,.55);x.fillStyle=R.b;x.fillText(d.it.n,ox+d.x*ts,oy+(d.y-.4)*ts)});
 if(dg.tg&&dg.tg.hp>0){let t=dg.tg,z=t.sz||1;x.strokeStyle='#f55';x.lineWidth=2;x.beginPath();x.ellipse(ox+t.x*ts,oy+(t.y+.35*z)*ts,.45*ts*z,.18*ts*z,0,0,7);x.stroke()}
 
 x.strokeStyle='rgba(240, 143, 180, 0.45)';x.lineWidth=2;x.beginPath();x.arc(ox+P.x*ts,oy+P.y*ts,1.4*ts,0,7);x.stroke();

 if(activeSkillRange){
  x.strokeStyle='rgba(80, 200, 255, 0.7)';x.fillStyle='rgba(80, 200, 255, 0.15)';x.lineWidth=2;
  x.beginPath();x.arc(ox+P.x*ts,oy+P.y*ts,3.5*ts,0,7);x.fill();x.stroke();
 }

 dg.mons.forEach(m=>{let z=m.sz||1,bw=.8*z*ts,bx=ox+m.x*ts-bw/2,by=oy+(m.y-.62*z)*ts;S(m.e,m.x,m.y,.9*z);x.fillStyle='#0008';x.fillRect(bx,by,bw,.1*ts);x.fillStyle=m.boss?'#e33':m.src=='e'?'#fb3':'#e55';x.fillRect(bx,by,bw*Math.max(0,m.hp/m.mhp),.1*ts);x.fillStyle=m.src=='e'?'#fd5':'#fff';x.fillText((m.nm?m.nm+' ':'')+EI[m.el]+m.lv,ox+m.x*ts,by-.08*ts)});
 if(dg.b.sh>0){x.strokeStyle=dg.b.shEl?'#8cf':'#fff';x.lineWidth=3;x.beginPath();x.arc(ox+P.x*ts,oy+P.y*ts,.5*ts,0,7);x.stroke()}
 
 x.globalAlpha=dg.b.inv>0?.45:1;S('🧝',P.x,P.y,.9);
 if(dg.b.swing>0){x.strokeStyle='#fff';x.lineWidth=3;x.beginPath();x.arc(ox+P.x*ts,oy+P.y*ts,.8*ts,0,7);x.stroke()}
 x.globalAlpha=1;

 dg.fx.forEach(e=>{x.globalAlpha=Math.min(1,e.l);x.fillStyle=e.c;x.fillText(e.t,ox+e.x*ts,oy+e.y*ts);x.globalAlpha=1})}

function dFrame(t){let dt=Math.min(.05,t-lt2||.016);lt2=t;dStep(dt);if(!dg)return;dRender();if((hud-=dt)<0){hud=.2;hudUp()}}

