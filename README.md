# Fantasy Haven

https://github.com/crixster/fantasy-haven/tree/main
A mobile-first fantasy town builder with a hero, perma-death, and ARPG dungeon crawling (bosses, loot, tombstones).
Plain JavaScript. No build step, no dependencies.

## Run locally
Open `index.html` in a browser (keep the `src/` folder next to it). Some browsers block local scripts from `file://`; if so run `python3 -m http.server` in this folder and open http://localhost:8000.

## Host on GitHub Pages
1. Create a repository and upload **everything in this folder** (`index.html`, `src/`, `.nojekyll`, `README.md`, `CONTEXT.md`), keeping the folder structure.
2. Settings → Pages → Source: *Deploy from a branch* → Branch `main`, folder `/ (root)` → Save.
3. After a minute the game is live at `https://<your-username>.github.io/<repo-name>/`.

File names are case-sensitive on GitHub: keep them exactly as they are.

## Playing
- Build 🏠 homes until you have 8 villagers, then build the 🌀 Dungeon Gate (🔨 → Magic: 🪙150 🪵20 🪨30 💎2).
- Tap your hero (or the ⚔️ tab) to open the hero panel and choose a dungeon element.
- Dungeon: left stick moves, hold ⚔️ to attack, round buttons cast skills, 💨 dodges red circles. Boss every 5th floor.
- The top bar shows 👥 villagers/beds; tap it for the housing list.
- If your hero dies, tap the 🪦 on the map to recover the loot.

## Continuing development with an AI
Upload `CONTEXT.md` first, then the file(s) to change.
