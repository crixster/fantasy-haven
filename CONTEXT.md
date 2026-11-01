# Fantasy Haven — context for an AI assistant
Upload this file FIRST, then only the file(s) to change, then your request.

## Rules
- Plain browser JavaScript, no frameworks, no build tools. Files are CLASSIC scripts (not ES modules) sharing ONE global scope.
- Load order is fixed (see index.html): core.js → hero.js → items.js → dungeon.js → boss.js → town-link.js → housing.js
- Top-level `const/let/function` names must be unique across ALL files. Do not rename existing globals; other files call them.
- town-link.js and housing.js wrap core's render/newDay/save/init/tap/refresh by reassigning them. Keep that pattern.
- Saves: localStorage 'fh1' (town) and 'fh1h' (hero, tombstones, stash). Do not break old saves; add fields with defaults.
- Mobile-first UI. Canvas drawing uses emoji sprites via spr('😀').
- Reply with ONLY the changed file(s), complete, and say which globals you added/renamed.
- The AI can only see what is pasted/uploaded in THIS chat. If a file is missing, ask for it instead of guessing its contents.

# Fantasy Haven — status and handoff

## What this is
A mobile-first town-builder (emoji sprites on a canvas) with a hero / perma-death / dungeon-crawling layer on top.
Plain JavaScript, no frameworks. `src/core.js` is the original town engine; the other modules add the hero system.

## Done and working (verified in real Chromium over HTTP, mobile viewport 390x780)
- Town engine (original): buildings, villagers, economy, day/night, quests, trade.
- Hero in town: appears even without a gate, pulsing gold ring; tap hero opens the ⚔️ panel; 🎯 Find hero; 📍 Send hero… (next map tap).
- Dungeon Gate (🌀, Magic tab) needs 8 villagers + 🪙150 🪵20 🪨30 💎2. The hero panel explains what is missing.
- Dungeon = ARPG: virtual stick (analog) + WASD, big ⚔️ hold-to-chase-and-attack (key F), skill buttons (keys 1-9), 💨 dodge (Space, i-frames), tap-to-target, tap-to-walk.
- Elements wheel (fire>wind>earth>water>fire), crits, lifesteal, archers, gold-named elites, health orbs, ground loot (walk over it).
- Boss every 5th floor: telegraphed slam circles, projectile volleys, enrage + adds at 50% HP, stairs 🔒 until it dies, guaranteed loot.
- Items: Magic/Rare/Legendary (named), 3 slots (weapon/armor/talisman), 8 affixes, stash, salvage (needs Blacksmith) for gold/💠/essence.
- Perma-death: new Level 1 hero next day; 🪦 tombstone at the gate holds half the pack + all equipped and unbanked items; tap the tombstone to recover.
- Town link: forging gear tiers, building upgrades with 💠 gems, housing panel (📊 tab, or tap the top bar), top bar shows 👥 villagers/beds + free beds.
- Saves: localStorage `fh1` (town) and `fh1h` (hero, tombs, stash). Old hero saves load (new fields have defaults).

## Not done / ideas (ask the owner before starting)
- Balance is estimated, never playtested: boss HP/damage, drop rates, XP curve, skill cooldowns.
- Touch feel of stick/buttons is untested on real devices (only headless Chromium with touch emulation).
- Tombstone minimap pin; more boss patterns/bosses per element; item set bonuses; sound; turn-based option (owner chose action combat instead).
- Dungeon map is small and unexplored-fog is not implemented.

## Gotchas learned the hard way
1. Scripts are CLASSIC scripts sharing one global scope (not ES modules). Every top-level const/let/function name must be unique across ALL files. A harmless-looking helper called `tick` once shadowed a test function; a function with a name used elsewhere silently overrides it.
2. `setInterval(ui,250)` in core.js keeps a direct reference to the original `ui`; reassigning `ui=` from another file does NOT change what the interval calls. To change the top bar, edit `ui()` in core.js. (render/newDay/save/init/tap ARE looked up by name each call, so wrapping those from town-link.js/housing.js works.)
3. `w2` and other core `const` helpers cannot be reassigned (even in tests).
4. Mixing up template literals and plain strings caused a visible `${...}` bug once: when editing HTML strings, check which quote type you are inside.
5. Stubbed-DOM tests missed that bug; only a real browser caught it. Always load the page in a real browser after changes.
6. `index.html` needs the `src/` folder next to it (upload both; GitHub file names are case-sensitive). A red on-screen banner reports load/runtime errors.
7. Do not break save compatibility: add fields with defaults in `loadH` (hero.js).
8. Load order: core → hero → items → dungeon → boss → town-link → housing (see index.html). Housing wraps town-link's render/refresh, so it must stay last.

## How to work on it
- The game is `index.html` + `src/*.js`, no build step. Edit a file, reload the page. Host on GitHub Pages (branch root).
- Check the browser console (or the red banner at the bottom of the screen) after every change; test on a phone-sized viewport.
- Keep each module's header comment (needs/provides) accurate.
- When you finish, reply with only the changed files, complete, and list any globals you added or renamed.


---
## Module contracts (each file's header comment)
### src/core.js
/* core.js — town simulation: grid, buildings, NPCs, economy, rendering, input, UI panels (the original game)
 Key globals used by the other modules:
   world:  N (grid size) T (tile px) K (dpr) CW CH cam{x,y,tx,ty,z} bl (buildings) bg (building grid) ter rd npcs NM res (resources) cnt (building counts) spd sv (loaded save)
   data:   CAT/BK (build catalog; BK[key]) TF (terrain tools) IC (resource icons)
   state:  view ({t:'hero'|'bld'|...}) tool (placing building key) follow (camera target with x,y)
   helpers: $ R(a,b) pk(arr) clamp spr(emoji) find(sx,sy,gx,gy)->path wander(n,r) w2(sx,sy)->world toast(msg,ms) calc() refresh() hintUI() ui()
   engine (reassigned by town-link.js): render newDay save init tap
   sheet panels: refresh() maps view.t -> vBuild2/vTrade/vHero/vStats/vFolk/vQ/vNpc/vBld; vHero and upgBtn come from town-link.js
 Load order: 1st */

### src/hero.js
/* hero.js — hero data, stats, XP, town-side behaviour, tombstones, save/load
 Needs from core.js: res bl cnt sv T K CW CH cam g spr find wander R toast calc
 Needs from items.js (at call time): mods
 Provides: EL EI BEAT mult MO PZ GN DW DH RK SK HR tombs stash hgen hg hcmd home newHero stat ens gate gainXP
           townTick townDraw claim saveH loadH
 Load order: 1st after core.js (items.js follows) */

### src/items.js
/* items.js — Diablo-style loot: Magic / Rare / Legendary items, affixes, equipment slots, stash, salvage
 Needs from core.js: pk toast calc cnt res
 Needs from hero.js: EL EI HR stash ens stat
 Needs from dungeon.js (at call time): dg
 Provides: RAR SLN SLI MD LEG rollItem mods wel ael ival itHtml dropAt equip unequip salvage salvageMagic gearHtml
 Load order: 2nd after core.js (after hero.js) */

### src/dungeon.js
/* dungeon.js — dungeon generation, Diablo-style action combat, enter/leave/die, fullscreen dungeon view
 Needs from core.js: pk IC K clamp $ toast view tool refresh calc res spr
 Needs from hero.js: EL EI mult MO PZ GN DW DH RK SK HR tombs stash hgen newHero stat ens gate gainXP
 Needs from items.js: RAR SLI rollItem dropAt wel ael
 Needs from boss.js (at call time): spawnBoss bossAI shoot prStep telStep bossDie drawBossFx
 Provides: dg wall fx genD setup bfs nearM tgt mvTo hit hurt kill cast dodge dStep enter leave die
           tsz sizeD mk skillBar hudUp dRender dFrame
 Controls (ARPG layout): left virtual stick (or WASD/arrows) = move · hold ⚔️ (or F) = chase+attack nearest · round skill buttons (or keys 1-9) · 💨 (or Space) = dodge roll
           still works: tap monster = target, tap ground = walk, drag on map = steer. Auto-attack always hits the nearest monster in reach.
 Load order: after items.js */

### src/boss.js
/* boss.js — guardian bosses (every 5th floor), enemy projectiles, ground telegraphs, boss loot
 Needs from core.js: pk
 Needs from hero.js: EL EI MO PZ HR gainXP
 Needs from items.js: rollItem dropAt
 Needs from dungeon.js: dg wall fx hurt
 Provides: BN BE ELC shoot spawnBoss addMinion bossAI prStep telStep bossDie drawBossFx
 Load order: after dungeon.js */

### src/town-link.js
/* town-link.js — forging, building upgrades, hero tab UI, engine hooks, click handler
 Needs from core.js: render newDay save init refresh sv bl cnt res IC toast calc spd
 Needs from hero.js / dungeon.js: HR tombs stash stat ens gate EL EI SK dg enter claim dFrame townTick townDraw saveH loadH lt
 Needs from items.js: RAR gearHtml equip unequip salvage salvageMagic wel ael
 Needs from core.js (extra): tap tool view follow w2 hintUI find N cam vm
 Provides: craft bump uc upgrade window.upgBtn window.vHero (called by core's refresh/vBld)
 Hooks: wraps render, newDay, save, init; wraps tap (tombstones), click handler for hl/hz/hc/ht/hu/he/hx/hs actions
 Load order: last (runs loadH(sv) at the end) */

### src/housing.js
/* housing.js — housing overview: occupancy per home, villager limit (beds), immigration conditions, map badges
 Needs from core.js: bl npcs res M view tool follow cam sheet g T K CW CH bar refresh vStats render
 Provides: hov housingInfo vHousing housingDraw okMark
 Hooks: top bar tap opens the panel; wraps refresh (view.t=='housing'), vStats (adds a housing line), render (map badges); click actions hh/hb/hp
 Load order: after town-link.js */
