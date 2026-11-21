// Pasar Terapung — game logic: state, clicks, timer, score, hints, magnifier.
// Single canvas 1280x720. Panels: left x=12, right x=644, each 624x520, y=76..596.
import { GAME, STRINGS } from './config.js';
import { PANEL, SCENE_DRAW, SCENE_DIFFS } from './scenes.js';

const W = 1280, H = 720;
const PANELS = [
  { x: 12, y: 76, w: PANEL.w, h: PANEL.h },
  { x: 644, y: 76, w: PANEL.w, h: PANEL.h },
];
const TOP = 64, BOTTOM = 604;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');
  const s = {
    screen: 'start', // start | play | paused | sceneDone | timeUp | done
    scene: 0,
    found: new Set(),
    score: 0,
    totalScore: 0,
    streak: 0,
    bestStreak: 0,
    hints: GAME.hintCount,
    hintsUsed: 0,
    strikes: 0,
    timeLeft: GAME.scenes[0].par,
    timeUsed: 0,
    mouse: { x: -1, y: -1, down: false },
    flash: null, // {x,y,ok,t}
    sound: true,
    audio: null,
    perScene: [],
  };

  // ---- audio (WebAudio beeps, no files) ----
  function beep(freq, dur, type = 'sine', when = 0) {
    if (!s.sound) return;
    try {
      s.audio = s.audio || new (window.AudioContext || window.webkitAudioContext)();
      const t = s.audio.currentTime + when;
      const o = s.audio.createOscillator(), g = s.audio.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(s.audio.destination);
      o.start(t); o.stop(t + dur);
    } catch (e) { /* audio unavailable */ }
  }
  const sfxFound = () => { beep(660, 0.12); beep(880, 0.18, 'sine', 0.09); };
  const sfxWrong = () => beep(160, 0.2, 'square');
  const sfxWin = () => { [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.22, 'sine', i * 0.11)); };

  function diffs() { return SCENE_DIFFS[s.scene]; }
  function foundCount() { return s.found.size; }
  function remaining() { return diffs().length - s.found.size; }

  function startScene(i) {
    s.scene = i; s.found = new Set(); s.streak = 0; s.hints = GAME.hintCount;
    s.strikes = 0; s.timeLeft = GAME.scenes[i].par; s.timeUsed = 0; s.flash = null;
    s.score = 0; // per-scene score resets; totalScore accumulates at completion
    s.screen = 'play';
  }
  function startGame() { s.totalScore = 0; s.perScene = []; s.hintsUsed = 0; startScene(0); }

  function comboMult() { return s.streak >= 5 ? 3 : s.streak >= GAME.comboAt ? 2 : 1; }

  function markFound(d, viaHint) {
    s.found.add(d.id);
    const pts = viaHint ? 0 : GAME.pointsPerFind * comboMult();
    s.score += pts;
    if (!viaHint) { s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak); sfxFound(); }
    if (s.found.size === diffs().length) {
      const bonus = Math.round(s.timeLeft) * GAME.timeBonusPerSec;
      s.score += bonus;
      s.perScene.push({ scene: s.scene, score: s.score, timeLeft: Math.round(s.timeLeft), hintsUsed: GAME.hintCount - s.hints, strikes: s.strikes });
      s.totalScore += s.score;
      sfxWin();
      s.screen = s.scene >= 2 ? 'done' : 'sceneDone';
    }
  }

  function clickPanel(px, py, panelIdx) {
    if (s.screen !== 'play') return;
    const p = PANELS[panelIdx];
    const lx = px - p.x, ly = py - p.y;
    for (const d of diffs()) {
      if (s.found.has(d.id)) continue;
      if (d.panels === 'right' && panelIdx === 0) continue; // added-only diffs live on the right
      const dx = lx - d.x, dy = ly - d.y;
      if (dx * dx + dy * dy <= d.r * d.r) {
        markFound(d, false);
        s.flash = { x: px, y: py, ok: true, t: 0.5 };
        return;
      }
    }
    // wrong guess
    s.timeLeft = Math.max(0, s.timeLeft - GAME.wrongCostSec);
    s.streak = 0; s.strikes++;
    s.flash = { x: px, y: py, ok: false, t: 0.5 };
    sfxWrong();
  }

  function useHint() {
    if (s.screen !== 'play' || s.hints <= 0) return;
    const rest = diffs().filter(d => !s.found.has(d.id));
    if (!rest.length) return;
    s.hints--; s.hintsUsed++;
    markFound(rest[Math.floor(rest.length / 2)], true);
  }

  // ---- buttons (top bar) ----
  function buttons() {
    return [
      { id: 'hint', label: `Hint (${s.hints})`, x: 980, y: 14, w: 92, h: 36 },
      { id: 'pause', label: s.screen === 'paused' ? 'Lanjut' : 'Pause', x: 1080, y: 14, w: 84, h: 36 },
      { id: 'restart', label: 'Restart', x: 1172, y: 14, w: 84, h: 36 },
    ];
  }
  function hitButton(px, py) {
    for (const b of buttons()) {
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b.id;
    }
    return null;
  }

  // ---- input ----
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    s.mouse.x = (e.clientX - r.left) * (W / r.width);
    s.mouse.y = (e.clientY - r.top) * (H / r.height);
  });
  canvas.addEventListener('mouseleave', () => { s.mouse.x = -1; s.mouse.y = -1; });
  canvas.addEventListener('click', e => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (W / r.width);
    const y = (e.clientY - r.top) * (H / r.height);
    if (s.screen === 'start') {
      // scene buttons + start
      for (let i = 0; i < 3; i++) {
        const b = { x: 340 + i * 200, y: 470, w: 180, h: 56 };
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { startScene(i); return; }
      }
      if (x >= 540 && x <= 740 && y >= 560 && y <= 616) { startGame(); return; }
      return;
    }
    if (s.screen === 'sceneDone') {
      if (x >= 540 && x <= 740 && y >= 470 && y <= 526) { startScene(s.scene + 1); return; }
      return;
    }
    if (s.screen === 'timeUp') {
      if (x >= 460 && x <= 660 && y >= 470 && y <= 526) { startScene(s.scene); return; }
      if (x >= 680 && x <= 880 && y >= 470 && y <= 526) { startScene(Math.min(2, s.scene + 1)); return; }
      return;
    }
    if (s.screen === 'done') {
      if (x >= 540 && x <= 740 && y >= 560 && y <= 616) { startGame(); return; }
      return;
    }
    if (s.screen === 'paused') {
      const b = hitButton(x, y);
      if (b === 'pause') { s.screen = 'play'; return; }
      if (b === 'restart') { startScene(s.scene); return; }
      return;
    }
    // play
    const b = hitButton(x, y);
    if (b === 'hint') { useHint(); return; }
    if (b === 'pause') { s.screen = 'paused'; return; }
    if (b === 'restart') { startScene(s.scene); return; }
    for (let i = 0; i < 2; i++) {
      const p = PANELS[i];
      if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) { clickPanel(x, y, i); return; }
    }
  });
  window.addEventListener('keydown', e => {
    if (e.key === 'h' || e.key === 'H') useHint();
    else if (e.key === 'p' || e.key === 'P') { if (s.screen === 'play') s.screen = 'paused'; else if (s.screen === 'paused') s.screen = 'play'; }
    else if (e.key === 'r' || e.key === 'R') { if (s.screen === 'play' || s.screen === 'paused') startScene(s.scene); }
    else if (e.key === 'm' || e.key === 'M') s.sound = !s.sound;
    else if (e.key >= '1' && e.key <= '3') { if (s.screen !== 'start') startScene(+e.key - 1); }
    else if (e.key === 'Enter' && s.screen === 'start') startGame();
  });

  // ---- drawing ----
  function drawButton(b, active) {
    ctx.fillStyle = active ? '#f5b301' : '#2a3f5c';
    rr(ctx, b.x, b.y, b.w, b.h, 8); ctx.fill();
    ctx.fillStyle = active ? '#1a2436' : '#e8eef7';
    ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
  }
  function drawTopBar() {
    ctx.fillStyle = '#0f1c2e'; ctx.fillRect(0, 0, W, TOP);
    const sc = GAME.scenes[s.scene];
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffd21f'; ctx.font = 'bold 21px sans-serif';
    ctx.fillText(GAME.title, 16, 26);
    ctx.fillStyle = '#9fb2cc'; ctx.font = '13px sans-serif';
    ctx.fillText(`${sc.name} · ${sc.sub}`, 16, 47);
    // center: to find + timer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd21f'; ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`${remaining()} ${STRINGS.toFind}`, 640, 28);
    const t = Math.max(0, Math.ceil(s.timeLeft));
    const mm = String(Math.floor(t / 60)).padStart(1, '0'), ss = String(t % 60).padStart(2, '0');
    ctx.fillStyle = t <= 15 ? '#ff5a4e' : '#e8eef7'; ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`${mm}:${ss}`, 640, 52);
    ctx.fillStyle = '#22344f'; rr(ctx, 500, 56, 280, 6, 3); ctx.fill();
    ctx.fillStyle = t <= 15 ? '#ff5a4e' : '#ffd21f';
    rr(ctx, 500, 56, 280 * (s.timeLeft / GAME.scenes[s.scene].par), 6, 3); ctx.fill();
    // right: score + streak
    ctx.textAlign = 'right';
    ctx.fillStyle = '#e8eef7'; ctx.font = 'bold 17px sans-serif';
    ctx.fillText(`Score ${s.score}`, 960, 27);
    ctx.fillStyle = s.streak >= 3 ? '#ffd21f' : '#9fb2cc'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(s.streak >= 2 ? `Streak x${comboMult()} (${s.streak})` : `Strikes: ${s.strikes}`, 960, 48);
    for (const b of buttons()) drawButton(b, b.id === 'hint' && s.hints === 0);
  }
  function drawPanels() {
    const draw = SCENE_DRAW[s.scene];
    for (let i = 0; i < 2; i++) {
      const p = PANELS[i];
      ctx.save();
      ctx.beginPath(); ctx.rect(p.x, p.y, p.w, p.h); ctx.clip();
      ctx.translate(p.x, p.y);
      draw(ctx, i === 0 ? new Set() : new Set(diffs().map(d => d.id)));
      ctx.restore();
      // frame
      ctx.strokeStyle = '#2a3f5c'; ctx.lineWidth = 3;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      // found rings on both panels
      for (const d of diffs()) {
        if (!s.found.has(d.id)) continue;
        if (d.panels === 'right' && i === 0) continue;
        const cx = p.x + d.x, cy = p.y + d.y;
        ctx.strokeStyle = '#ffd21f'; ctx.lineWidth = 4;
        circle(ctx, cx, cy, d.r); ctx.stroke();
        ctx.strokeStyle = '#2fae4e'; ctx.lineWidth = 4; ctx.beginPath();
        ctx.moveTo(cx - 9, cy); ctx.lineTo(cx - 2, cy + 7); ctx.lineTo(cx + 10, cy - 8); ctx.stroke();
      }
      // label
      ctx.fillStyle = '#e8eef7'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(i === 0 ? 'LEFT — original' : 'RIGHT — spot the changes', p.x + p.w / 2, p.y - 8);
    }
    // VS badge
    ctx.fillStyle = '#f5b301'; circle(ctx, 640, 336, 20);
    ctx.fillStyle = '#1a2436'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('VS', 640, 337);
    ctx.textBaseline = 'alphabetic';
    // click flash
    if (s.flash && s.flash.t > 0) {
      ctx.strokeStyle = s.flash.ok ? '#2fae4e' : '#ff5a4e'; ctx.lineWidth = 4;
      circle(ctx, s.flash.x, s.flash.y, 22); ctx.stroke();
      if (!s.flash.ok) {
        ctx.beginPath();
        ctx.moveTo(s.flash.x - 10, s.flash.y - 10); ctx.lineTo(s.flash.x + 10, s.flash.y + 10);
        ctx.moveTo(s.flash.x + 10, s.flash.y - 10); ctx.lineTo(s.flash.x - 10, s.flash.y + 10);
        ctx.stroke();
      }
    }
    // magnifier (hover over a panel while playing)
    if (s.screen === 'play' && s.mouse.x >= 0) {
      for (let i = 0; i < 2; i++) {
        const p = PANELS[i];
        if (s.mouse.x >= p.x && s.mouse.x <= p.x + p.w && s.mouse.y >= p.y && s.mouse.y <= p.y + p.h) {
          const R = 70, Z = 2;
          const sx = Math.max(p.x, Math.min(p.x + p.w - 2 * R / Z, s.mouse.x - R / Z));
          const sy = Math.max(p.y, Math.min(p.y + p.h - 2 * R / Z, s.mouse.y - R / Z));
          ctx.save();
          ctx.beginPath(); ctx.arc(s.mouse.x, s.mouse.y, R, 0, Math.PI * 2); ctx.clip();
          ctx.drawImage(canvas, sx, sy, 2 * R / Z, 2 * R / Z, s.mouse.x - R, s.mouse.y - R, 2 * R, 2 * R);
          ctx.restore();
          ctx.strokeStyle = '#ffd21f'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(s.mouse.x, s.mouse.y, R, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,210,31,0.7)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(s.mouse.x - R, s.mouse.y); ctx.lineTo(s.mouse.x + R, s.mouse.y);
          ctx.moveTo(s.mouse.x, s.mouse.y - R); ctx.lineTo(s.mouse.x, s.mouse.y + R); ctx.stroke();
          break;
        }
      }
    }
  }
  function drawBottomBar() {
    ctx.fillStyle = '#0f1c2e'; ctx.fillRect(0, BOTTOM, W, H - BOTTOM);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#9fb2cc'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(STRINGS.found, 16, 630);
    let x = 120;
    ctx.font = '13px sans-serif';
    for (const d of diffs()) {
      if (!s.found.has(d.id)) continue;
      const label = `✓ ${d.name}`;
      const w = ctx.measureText(label).width + 18;
      ctx.fillStyle = '#1d3a24'; rr(ctx, x, 614, w, 26, 13); ctx.fill();
      ctx.fillStyle = '#8fe6a0'; ctx.fillText(label, x + 9, 632);
      x += w + 8;
      if (x > 1240) break;
    }
    ctx.fillStyle = '#6c7f9c'; ctx.font = '12px sans-serif';
    ctx.fillText(STRINGS.keys, 16, 692);
    // found dots
    ctx.textAlign = 'right'; ctx.fillStyle = '#9fb2cc'; ctx.font = '13px sans-serif';
    ctx.fillText('Found:', 1140, 630);
    diffs().forEach((d, i) => {
      ctx.fillStyle = s.found.has(d.id) ? '#2fae4e' : '#2a3f5c';
      circle(ctx, 1160 + i * 16, 626, 6);
    });
  }
  function overlay(title, lines, buttons) {
    ctx.fillStyle = 'rgba(8,15,28,0.82)'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd21f'; ctx.font = 'bold 44px sans-serif';
    ctx.fillText(title, 640, 150);
    ctx.fillStyle = '#e8eef7'; ctx.font = '17px sans-serif';
    lines.forEach((l, i) => ctx.fillText(l, 640, 200 + i * 30));
    buttons.forEach(b => {
      ctx.fillStyle = '#f5b301'; rr(ctx, b.x, b.y, b.w, b.h, 10); ctx.fill();
      ctx.fillStyle = '#1a2436'; ctx.font = 'bold 19px sans-serif'; ctx.textBaseline = 'middle';
      ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
      ctx.textBaseline = 'alphabetic';
    });
  }
  function drawStart() {
    drawTopBar(); drawPanels(); drawBottomBar();
    overlay(GAME.title, [
      GAME.subtitle + ' — 3 scenes · 7 differences each',
      'Two pictures look the same — but the right one hides 7 sneaky changes:',
      'removed, recoloured, moved, resized, flipped or added.',
      'Click a difference on either picture to ring it. Wrong clicks cost 3 seconds.',
      'Scenes: 1. Pasar Pagi · 2. Pasar Siang · 3. Lentera Malam',
      'Click a scene below, or press Enter to start.',
    ], []);
    for (let i = 0; i < 3; i++) {
      const b = { x: 340 + i * 200, y: 470, w: 180, h: 56 };
      ctx.fillStyle = '#2a3f5c'; rr(ctx, b.x, b.y, b.w, b.h, 10); ctx.fill();
      ctx.fillStyle = '#e8eef7'; ctx.font = 'bold 16px sans-serif'; ctx.textBaseline = 'middle';
      ctx.fillText(`${i + 1}. ${GAME.scenes[i].name}`, b.x + b.w / 2, b.y + b.h / 2 + 1);
      ctx.textBaseline = 'alphabetic';
    }
    ctx.fillStyle = '#f5b301'; rr(ctx, 540, 560, 200, 56, 10); ctx.fill();
    ctx.fillStyle = '#1a2436'; ctx.font = 'bold 20px sans-serif'; ctx.textBaseline = 'middle';
    ctx.fillText('▶  Start', 640, 589); ctx.textBaseline = 'alphabetic';
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0b1526'; ctx.fillRect(0, 0, W, H);
    if (s.screen === 'start') { drawStart(); return; }
    drawTopBar(); drawPanels(); drawBottomBar();
    if (s.screen === 'paused') {
      overlay('Jeda', ['Game dijeda. Tekan P atau klik Lanjut untuk main lagi.'], [
        { label: 'Lanjut', x: 540, y: 470, w: 200, h: 56 },
      ]);
    } else if (s.screen === 'sceneDone') {
      const sc = GAME.scenes[s.scene];
      overlay(`${sc.name} — Selesai!`, [
        `All 7 differences found · Time bonus +${Math.round(s.timeLeft) * GAME.timeBonusPerSec}`,
        `Scene score: ${s.score} · Total: ${s.totalScore}`,
        `Next: ${GAME.scenes[s.scene + 1].name}`,
      ], [{ label: 'Next scene ▶', x: 540, y: 470, w: 200, h: 56 }]);
    } else if (s.screen === 'timeUp') {
      overlay('Waktu habis!', [
        `You found ${foundCount()} of 7 differences in ${GAME.scenes[s.scene].name}.`,
        'Try the scene again, or move on to the next one.',
      ], [
        { label: 'Retry scene', x: 460, y: 470, w: 200, h: 56 },
        { label: 'Next scene ▶', x: 680, y: 470, w: 200, h: 56 },
      ]);
    } else if (s.screen === 'done') {
      const stars = s.hintsUsed === 0 && s.perScene.every(p => p.strikes === 0) ? 3
        : s.hintsUsed <= 2 ? 2 : 1;
      overlay(STRINGS.complete, [
        STRINGS.completeSub,
        `Total score: ${s.totalScore}   ·   Best streak: ${s.bestStreak}   ·   Hints used: ${s.hintsUsed}`,
        `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`,
        'Pasar Terapung — Spot the Difference',
      ], [{ label: '↻  Play again', x: 540, y: 560, w: 200, h: 56 }]);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (s.screen === 'play') {
      s.timeLeft -= dt; s.timeUsed += dt;
      if (s.timeLeft <= 0) { s.timeLeft = 0; s.screen = 'timeUp'; }
    }
    if (s.flash) { s.flash.t -= dt; if (s.flash.t <= 0) s.flash = null; }
    draw();
    requestAnimationFrame(loop);
  }

  return {
    state: s, startGame, startScene, useHint,
    run() { requestAnimationFrame(loop); },
  };
}
