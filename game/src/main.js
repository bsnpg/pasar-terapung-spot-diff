// Pasar Terapung — boot. ?shot=1-play|2-night|3-start|4-complete stages a
// screenshot scene (see shots.js); otherwise the title screen shows.
import { createGame } from './game.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const game = createGame(canvas);
game.run();

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  stageShot(shot, game);
} else {
  window.__shotReady = true;
}
