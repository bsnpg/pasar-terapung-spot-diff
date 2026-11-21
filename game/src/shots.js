// Screenshot staging: ?shot=1-play|2-night|3-start|4-complete paints one
// canonical scene, then sets window.__shotReady. Used by the capture script.
import { SCENE_DIFFS } from './scenes.js';

export function stageShot(name, game) {
  const s = game.state;
  const setFound = (scene, ids) => {
    game.startScene(scene);
    ids.forEach(id => s.found.add(id));
    s.screen = 'play';
  };
  if (name === '1-play') {
    // Scene 1 mid-play: 3 found, rings visible, timer 1:32, score 350, streak x2
    setFound(0, ['boat', 'lantern', 'cat']);
    s.score = 350; s.streak = 2; s.timeLeft = 92; s.hints = 3; s.strikes = 0;
  } else if (name === '2-night') {
    // Scene 3 night lanterns mid-play: 2 found, timer 1:45, score 200
    setFound(2, ['moon', 'lantern2']);
    s.score = 200; s.streak = 1; s.timeLeft = 105; s.hints = 2; s.strikes = 1;
  } else if (name === '3-start') {
    s.screen = 'start';
  } else if (name === '4-complete') {
    // Results screen: all scenes done
    s.perScene = [
      { scene: 0, score: 850, timeLeft: 42, hintsUsed: 0, strikes: 0 },
      { scene: 1, score: 790, timeLeft: 31, hintsUsed: 1, strikes: 0 },
      { scene: 2, score: 810, timeLeft: 35, hintsUsed: 0, strikes: 1 },
    ];
    s.totalScore = 2450; s.score = 2450; s.bestStreak = 5; s.hintsUsed = 1;
    s.scene = 2; s.found = new Set(SCENE_DIFFS[2].map(d => d.id));
    s.screen = 'done';
  }
  window.__shotReady = true;
}
