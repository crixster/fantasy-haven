// Add inside core.js or update town destruction / check:
let townHallDestroyed = 0;
// In newDay or update loop:
function checkTownHall() {
  let th = bl.find(b => b.k === 'cottage' || b.k === 'family' || b.k === 'noble'); // or designate a central building as Town Hall
  if (bl.length > 0 && !th && !townHallDestroyed) {
    townHallDestroyed = 1;
    toast('💀 GAME OVER: The Town Hall / Center has been destroyed!', 10000);
    spd = 0;
  }
}
