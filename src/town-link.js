/* town-link.js — forging, building upgrades, hero home, random portal interaction */
function craft(sl,el){if(!cnt.smith)return toast('Build a Blacksmith first');let n=HR[sl].t+1;if(n>5)return toast('Already max tier');let g=(sl=='w'?60:50)*n,r=sl=='w'?'s':'w',q=(sl=='w'?10:15)*n,e=3*n;ens();
 if(res.g<g||res[r]<q||res.E[el]<e)return toast(`Need 🪙${g} ${IC[r]}${q} ${EI[el]}${e}`);res.g-=g;res[r]-=q;res.E[el]-=e;HR[sl]={t:n,el};toast((sl=='w'?'⚔️ Weapon':'🛡️ Armor')+' forged: tier '+n+' '+EI[el])}
const bump=b=>{b.lv=(b.lv||1)+1;['hap','bea','mag','tou'].forEach(k=>{if(b[k])b[k]++});if(b.home)b.home++},uc=b=>{let l=b.lv||1;return{g:80*l,w:20*l,s:20*l,gem:l}};
function upgrade(i){let b=bl[i];if(!b)return;let c=uc(b);ens();if((b.lv||1)>=4||res.g<c.g||res.w<c.w||res.s<c.s||res.gem<c.gem)return toast('Need 🪙'+c.g+' 🪵'+c.w+' 🪨'+c.s+' 💠'+c.gem);res.g-=c.g;res.w-=c.w;res.s-=c.s;res.gem-=c.gem;bump(b);calc();toast('⭐ '+b.n+' upgraded to level '+b.lv)}
window.upgBtn=b=>{if(!b||b.d||(!b.job&&!b.home&&!b.hap))return'';let l=b.lv||1;if(l>=4)return'<br>⭐ Max level';let c=uc(b);return`<br>⭐ Level ${l}: +50% output, more appeal<div class="cr"><button data-a="hu:${bl.indexOf(b)}">⬆️ Upgrade · 🪙${c.g} 🪵${c.w} 🪨${c.s} 💠${c.gem}</button></div>`};
const tombHtml=(t,i)=>`<div class="q">🪦 <b>${t.n}</b> (Lv ${t.lv}) · slain by ${t.by||'?'}<br><button data-a="ht:${i}">Recover</button></div>`;

window.vHero=()=>{
 ens();
 ensureHero();
 if(!HR) return `<div class="nh"><span>⛺</span><div><b>No Hero Yet</b><br><small>Build a <b>Hero Home</b> in the town build menu to summon your hero!</small></div></div>`;
 const S=stat(HR);
 return`<div class="nh"><span class="pt">🧝</span><div><b>${HR.n}</b> · Lv ${HR.lv}<br><small>XP ${HR.xp}/${30*HR.lv} · skill points <b>${HR.sp}</b></small></div></div>`+
  `<div class="r">🏠 <b>Hero's Home</b> acts as rest, healing, and stash base.</div>`+
  `<div class="cr"><button data-a="hf:1">🎯 Find hero</button><button data-a="hm:1" ${HR.alive&&HR.on?'':'disabled'}>📍 Send hero…</button></div>`+
  `❤️ ${HR.hp|0}/${S.mhp} · ⚔️ ${S.atk} · 🛡️ ${S.def}<br>`+
  gearHtml()+
  '<div class="r"><b>Skills & Upgrades</b> (1 SP per level)</div>'+
  EL.map(e=>'<div class="cr">'+SK.filter(k=>k.el==e).map(k=>{
   let learned=HR.sk.includes(k.id),lvl=(HR.slvl&&HR.slvl[k.id])||1;
   if(!learned) return `<button data-a="hl:${k.id}" ${HR.sp>0?'':'disabled'}>${k.e}${k.n}<br><small>Learn</small></button>`;
   return `<button data-a="hup:${k.id}" ${HR.sp>0&&lvl<5?'':'disabled'}>${k.e}${k.n} L${lvl}<br><small>Upgrade</small></button>`;
  }).join('')+'</div>').join('')+
  `<div class="r"><b>Explore Wild Portals</b> (Walk your hero to any random 🌀 portal on the map to enter)</div>`+
  gearHtml();
};

let heroTownOverlay=0;
function toggleHeroTownOverlay(open){
 heroTownOverlay=open?1:0;let ov=$('townHeroOverlay');if(ov)ov.hidden=!open;
}
function updateTownHeroOverlay(){}
function townHeroOverlayTick(dt){}

const _r=render,_n=newDay,_s=save,_i=init;
render=t=>{_r(t);};
newDay=()=>{_n();ens();if(HR&&!HR.alive&&--HR.rs<=0){HR.alive=1;HR.hp=stat(HR).mhp;HR.on=1;toast('🧝 Hero resurrected at home!')}};
save=()=>{_s();saveH()};init=s=>{_i(s);loadH(s)};

addEventListener('click',e=>{
 let a=e.target.closest('[data-a]');if(!a)return;let[c,v,w]=a.dataset.a.split(':');ens();
 if(c=='hl'){let hero=ensureHero();if(hero&&hero.sp>0&&!hero.sk.includes(v)){hero.sp--;hero.sk.push(v);hero.slvl=hero.slvl||{};hero.slvl[v]=1}}
 else if(c=='hup'){let hero=ensureHero();hero.slvl=hero.slvl||{};let lvl=hero.slvl[v]||1;if(hero&&hero.sp>0&&lvl<5){hero.sp--;hero.slvl[v]=lvl+1}}
 else if(c=='hm'){hcmd=1;view=null;toast('📍 Tap map where hero should go',4000)}
 else if(c=='hf'){let hero=ensureHero();if(hero){hero.on=1;follow=hero;cam.tx=hero.x;cam.ty=hero.y;view=null}}
 else if(c=='he')equip(+v);else if(c=='hx')unequip(v);else if(c=='hs')v=='m'?salvageMagic():salvage(+v);else return;
 refresh();
});

const _t=tap;
tap=(sx,sy)=>{
  let[wx_,wy]=w2(sx,sy);
  if(typeof randomPortals !== 'undefined'){
    let p = randomPortals.find(rp => Math.hypot(rp.x + 0.5 - wx_, rp.y + 0.5 - wy) < 1.2);
    if(p){
      enter(p.el);
      return;
    }
  }
  _t(sx,sy);
};
