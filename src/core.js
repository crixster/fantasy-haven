/* core.js — town simulation */
"use strict";
const N=50,T=32,$=i=>document.getElementById(i),cv=$('c'),g=cv.getContext('2d'),mm=$('mm'),mg=mm.getContext('2d'),sheet=$('sheet'),
clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),R=(a,b)=>a+Math.random()*(b-a),pk=a=>a[Math.random()*a.length|0];

const BLD_BASE_HP=100, REPAIR_COST_G=15, REPAIR_COST_W=10;

const CAT=`townhall|🏛️|Town Hall|Home|150/50/50/0|home=4,bea=3,g=8,u=0
cottage|🏠|Cottage|Home|40/10/0/0|home=2
family|🏡|Family House|Home|90/25/5/0|home=4
noble|🏰|Noble Home|Home|220/20/40/0|home=3,bea=2,g=6,u=20
inn|🛏️|Inn|Home|120/30/10/0|home=2,job=2,tou=2,g=5
hero_home|⛺|Hero Home|Home|100/30/20/0|home=0,job=0,u=10
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