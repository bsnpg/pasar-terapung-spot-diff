// Pasar Terapung — Spot the Difference. Scene metadata + UI strings.
// All art is drawn procedurally on canvas (no images, no network).
// Deterministic: differences are fixed coordinates, no randomness at runtime.
export const GAME = {
  title: 'Pasar Terapung',
  subtitle: 'Spot the Difference',
  scenes: [
    { id: 0, name: 'Pasar Pagi', sub: 'Scene 1 of 3 · Par 2:00', par: 120 },
    { id: 1, name: 'Pasar Siang', sub: 'Scene 2 of 3 · Par 2:00', par: 120 },
    { id: 2, name: 'Lentera Malam', sub: 'Scene 3 of 3 · Par 2:00', par: 120 },
  ],
  wrongCostSec: 3,
  hintCount: 3,
  pointsPerFind: 100,
  timeBonusPerSec: 5,
  comboAt: 3, // 3 finds in a row -> x2; 5 in a row -> x3
};

export const STRINGS = {
  toFind: 'to find',
  found: 'Sudah ketemu:',
  hint: 'Hint',
  pause: 'Pause',
  restart: 'Restart',
  sound: 'Sound',
  howTo:
    'Two pictures look the same — but the right one has 7 sneaky changes: things removed, recoloured, moved, resized, flipped or added. Click a difference on either picture to ring it. Wrong clicks cost 3 seconds. Find all 7 before the timer runs out.',
  keys: 'Mouse: click to guess · Hover: magnifier · Keys: H hint · P pause · R restart · 1-3 scene · M sound',
  complete: 'Pasar Selesai!',
  completeSub: 'You found every difference in all 3 scenes.',
  playAgain: 'Play again',
};
