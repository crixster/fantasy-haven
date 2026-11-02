/* boss.js — guardian bosses (every 5th floor), enemy projectiles, ground telegraphs, boss loot
 Needs from core.js: pk
 Needs from hero.js: EL EI MO PZ HR gainXP
 Needs from items.js: rollItem dropAt
 Needs from dungeon.js: dg wall fx hurt
 Provides: BN BE ELC shoot spawnBoss addMinion bossAI prStep telStep bossDie drawBossFx
 Load order: after dungeon.js */
const BN={fire:'Cinder Drake',water:'Tide Kraken',earth:'Moss Titan',wind:'Storm Roc'},BE={fire:'🐉',water:'🦑',earth:'🗿',wind:'🦉'},
ELC={fire:'#ff6a2b',water:'#3ab0ff',earth:'#a98a3c',wind:'#8fe3c4'};
function spawnBoss(r){let f=dlv(dg.f),el=dg.z,hp=260+90*f,mo={x:r.cx+.5,y:r.cy+.5,el,lv:f,e:BE[el],nm:BN[el],boss:1,src:'b',hp,mhp:hp,atk:6+2.5*f|0,def:2+f,cd:2,sp:1,sz:2,t1:4,t2:2.5,enr:0};
 dg.mons.push(mo);dg.boss=mo;fx(dg.p.x,dg.p.y-1,'⚠️ '+mo.nm+' guards the stairs','#f66')}
const shoot=(m,P,dmg,n)=>{let a=Math.atan2(P.y-m.y,P.x-m.x);for(let i=0;i<n;i++){let q=a+(i-(n-1)/2)*.3;dg.pr.push({x:m.x,y:m.y,vx:Math.cos(q)*4.6,vy:Math.sin(q)*4.6,dmg:Math.round(dmg),el:m.el,by:m.nm||m.e,l:3})}};
function addMinion(b){let lv=dlv(dg.f),x,y,i=0;do{x=b.x+(Math.random()-.5)*3;y=b.y+(Math.random()-.5)*3}while(wall(x,y)&&++i<9);if(i>=9){x=b.x;y=b.y}
 dg.mons.push({x,y,el:b.el,lv,e:pk(MO[b.el]),hp:18+8*lv,mhp:18+8*lv,atk:4+2*lv,def:lv*.8,cd:1.5,sp:1.3,sz:1,src:'m'})}
// boss pattern: telegraphed slam on the hero's position (move out of the red circle!), projectile volleys, and an enraged second phase
function bossAI(m,dt){const P=dg.p,e=m.enr?.65:1;m.t1-=dt;m.t2-=dt;
 if(m.t1<=0){m.t1=5*e;dg.tel.push({x:P.x,y:P.y,r:1.7,t:1,t0:1,dmg:Math.round(m.atk*1.6),el:m.el,by:m.nm});fx(m.x,m.y-1,'⚠️ SLAM','#f55')}
 if(m.t2<=0){m.t2=3.2*e;shoot(m,P,m.atk*.7,m.enr?3:1)}
 if(!m.enr&&m.hp<m.mhp/2){m.enr=1;m.sp*=1.3;dg.shake=.5;fx(m.x,m.y-1,'😡 ENRAGED','#f55');for(let k=0;k<3;k++)addMinion(m)}}
function prStep(dt){const P=dg.p;for(const q of dg.pr.slice()){q.x+=q.vx*dt;q.y+=q.vy*dt;q.l-=dt;if(q.l<=0||wall(q.x,q.y)){dg.pr.splice(dg.pr.indexOf(q),1);continue}
 if(Math.hypot(q.x-P.x,q.y-P.y)<.45){dg.pr.splice(dg.pr.indexOf(q),1);if(hurt(q.dmg,q.el,q.by))return 1}}}
function telStep(dt){const P=dg.p;for(const t of dg.tel.slice()){t.t-=dt;if(t.t>0)continue;dg.tel.splice(dg.tel.indexOf(t),1);dg.shake=Math.max(dg.shake,.3);fx(t.x,t.y,'💥','#fff');
 if(Math.hypot(t.x-P.x,t.y-P.y)<t.r&&hurt(t.dmg,t.el,t.by))return 1}}
function bossDie(m){let P=dg.pack,f=dlv(dg.f),el=m.el,n=1+(Math.random()<.5);dg.pr=[];dg.tel=[];dg.boss=null;
 P.gem+=2+(f/5|0);P.E[el]+=4+(f/5|0);P.w+=6+f;P.s+=6+f;
 for(let i=0;i<n;i++)dropAt(m.x+i*.9-.45,m.y+.7,rollItem(f,'b'));dg.drops.push({x:m.x-.9,y:m.y,orb:1},{x:m.x+.9,y:m.y,orb:1});
 dg.shake=.5;fx(m.x,m.y-1,'🏆 '+m.nm+' defeated!','#ffd');fx(m.x,m.y-1.5,'Stairs unlocked','#cfc');gainXP(60+20*f)}
function drawBossFx(x,ox,oy,ts){dg.tel.forEach(t=>{let p=1-t.t/t.t0,cx=ox+t.x*ts,cy=oy+t.y*ts;x.fillStyle='rgba(255,40,40,.22)';x.strokeStyle='#f44';x.lineWidth=2;x.beginPath();x.arc(cx,cy,t.r*ts,0,7);x.fill();x.stroke();x.fillStyle='rgba(255,60,40,.4)';x.beginPath();x.arc(cx,cy,t.r*ts*p,0,7);x.fill()});
 dg.pr.forEach(q=>{x.fillStyle=ELC[q.el];x.strokeStyle='#fff';x.lineWidth=1.5;x.beginPath();x.arc(ox+q.x*ts,oy+q.y*ts,.17*ts,0,7);x.fill();x.stroke()})}
