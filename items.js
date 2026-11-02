/* items.js — Diablo-style loot: Magic / Rare / Legendary items, affixes, equipment slots, stash, salvage
 Needs from core.js: pk toast calc cnt res
 Needs from hero.js: EL EI HR stash ens stat
 Needs from dungeon.js (at call time): dg
 Provides: RAR SLN SLI MD LEG rollItem mods wel ael ival itHtml dropAt equip unequip salvage salvageMagic gearHtml
 Load order: 2nd after core.js (after hero.js) */
const RAR=[{n:'Magic',c:'#2a6fd6',b:'#7ab8ff',q:1,k:2},{n:'Rare',c:'#a87400',b:'#ffd84a',q:1.5,k:3},{n:'Legendary',c:'#d4520a',b:'#ff9a3c',q:2.3,k:4}],
SLN={w:'Weapon',a:'Armor',t:'Talisman'},SLI={w:'⚔️',a:'🛡️',t:'📿'},
MD={atk:{l:'Attack',e:'⚔️',u:'',b:f=>2+f*1.2},def:{l:'Defense',e:'🛡️',u:'',b:f=>1+f*.8},hp:{l:'Health',e:'❤️',u:'',b:f=>8+f*3},
 cr:{l:'Crit',e:'🎯',u:'%',b:()=>2.5},ls:{l:'Life steal',e:'🩸',u:'%',b:()=>1.5},ms:{l:'Move speed',e:'👟',u:'%',b:()=>4},gf:{l:'Gold find',e:'🪙',u:'%',b:()=>8},xp:{l:'XP',e:'📘',u:'%',b:()=>4}},
PRI={w:['atk'],a:['def','hp'],t:['hp','cr','ls','ms','gf','xp']},
BASE={w:['Blade','Axe','Spear','Mace','Staff'],a:['Mail','Cloak','Plate','Hauberk','Robe'],t:['Charm','Ring','Amulet','Idol','Sigil']},
PRE={fire:['Ember','Cinder','Blazing','Scorched'],water:['Tidal','Frost','Brine','Misty'],earth:['Granite','Mossy','Stone','Ancient'],wind:['Gale','Zephyr','Cloud','Whisper']},
SUF=['of the Wolf','of Sorrow','of the Dawn','of Grit','of the Fox','of Embers','of Thorns','of the Deep'],
LEG=[['Emberfang','w','fire'],['Tidecaller','w','water'],['Quakebreaker','w','earth'],['Skyreaver','w','wind'],['Cindermail','a','fire'],['Mantle of the Deep','a','water'],
 ['Stoneheart Aegis','a','earth'],['Gale-Woven Cloak','a','wind'],['Haven’s Heart','t','earth'],['Eye of the Storm','t','wind'],['Phoenix Ash','t','fire'],['Moon-Tide Pearl','t','water']];
/* src: m=monster e=elite c=chest b=boss — higher sources roll better rarity; deeper floors help a little */
function rollItem(f,src){let lg={m:.005,e:.03,c:.04,b:.25}[src]+f*.002,rr={m:.1,e:.3,c:.3,b:.5}[src]+f*.005,x=Math.random(),r=x<lg?2:x<lg+rr?1:0,sl,el,n;
 if(r==2){let L=pk(LEG);n=L[0];sl=L[1];el=L[2]}else{sl=pk(['w','a','t']);el=pk(EL);n=pk(PRE[el])+' '+pk(BASE[sl])+(r==1?' '+pk(SUF):'')}
 let q=RAR[r].q,p=pk(PRI[sl]),keys=[p].concat(Object.keys(MD).filter(k=>k!=p).sort(()=>Math.random()-.5)).slice(0,RAR[r].k),m={};
 keys.forEach(k=>m[k]=Math.max(1,Math.round(MD[k].b(f)*(.8+Math.random()*.4)*q)));
 return{id:Math.random().toString(36).slice(2,9),n,sl,r,el,lv:f,m}}
const mods=h=>{let o={atk:0,def:0,hp:0,cr:0,ls:0,ms:0,gf:0,xp:0};if(h&&h.eq)for(const s in h.eq){let it=h.eq[s];if(it)for(const k in it.m)o[k]+=it.m[k]}return o},
wel=()=>(HR.eq&&HR.eq.w&&HR.eq.w.el)||HR.w.el,ael=()=>(HR.eq&&HR.eq.a&&HR.eq.a.el)||HR.a.el,
ival=it=>Math.round((10+it.lv*5)*RAR[it.r].q*(1+it.r)),
dropAt=(x,y,it)=>dg.drops.push({x,y,it}),
itHtml=it=>`<b style="color:${RAR[it.r].c}">${it.n}</b> <small>${RAR[it.r].n} ${SLN[it.sl]} ${EI[it.el]} · iLv${it.lv}<br>${Object.entries(it.m).map(([k,v])=>MD[k].e+'+'+v+MD[k].u+' '+MD[k].l).join(' · ')}</small>`;
function equip(i){let it=stash[i];if(!it)return;let o=HR.eq[it.sl];HR.eq[it.sl]=it;stash.splice(i,1);if(o)stash.push(o);HR.hp=Math.min(HR.hp,stat(HR).mhp);toast('Equipped '+it.n)}
function unequip(s){let it=HR.eq[s];if(!it)return;stash.push(it);HR.eq[s]=null;HR.hp=Math.min(HR.hp,stat(HR).mhp)}
// salvaging needs a Blacksmith: pays gold, plus rare gems (rare=1, legendary=2) and elemental essence for town upgrades and forging
function salv(it){ens();res.g+=ival(it);res.gem+=it.r;res.E[it.el]+=it.r+1}
function salvage(i){if(!cnt.smith)return toast('Build a Blacksmith to salvage items');let it=stash.splice(i,1)[0];if(it){salv(it);toast(`Salvaged ${it.n}: 🪙${ival(it)}${it.r?' 💠'+it.r:''} ${EI[it.el]}${it.r+1}`)}calc()}
function salvageMagic(){if(!cnt.smith)return toast('Build a Blacksmith to salvage items');let k=stash.filter(i=>i.r==0),g=0;if(!k.length)return toast('No magic items to salvage');k.forEach(i=>{salv(i);g+=ival(i);stash.splice(stash.indexOf(i),1)});toast(`Salvaged ${k.length} magic items for 🪙${g}`);calc()}
function gearHtml(){const slot=s=>{let it=HR.eq[s];return`<div class="q">${SLI[s]} ${it?itHtml(it)+` <button data-a="hx:${s}">Unequip</button>`:'<small>'+SLN[s]+': empty</small>'}</div>`};
 return'<div class="r"><b>Gear</b> · dropped by monsters, elites, chests and bosses</div>'+['w','a','t'].map(slot).join('')+
 (stash.length?`<div class="r"><b>Stash</b> (${stash.length})${cnt.smith?'':' · Blacksmith needed to salvage'} <button data-a="hs:m" ${cnt.smith?'':'disabled'}>Salvage all Magic</button></div>`:'')+
 stash.slice(0,12).map((it,i)=>`<div class="q">${itHtml(it)}<br><button data-a="he:${i}">Equip</button> <button data-a="hs:${i}" ${cnt.smith?'':'disabled'}>Salvage 🪙${ival(it)}</button></div>`).join('')+(stash.length>12?`<small>…and ${stash.length-12} more</small>`:'')}
