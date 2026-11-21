// Pasar Terapung — procedural scene art (Canvas 2D, no images).
// Each scene draws into a 624x520 panel. `diffs` is a Set of difference ids
// applied to the RIGHT panel only; the LEFT panel always draws the original.
// Difference coordinates here are the click targets (x, y, r in panel space).
// Panel space: sky 0-290, dock 285-310, river 290-520.

export const PANEL = { w: 624, h: 520 };

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
function tri(ctx, x1, y1, x2, y2, x3, y3) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath(); ctx.fill();
}
function sky(ctx, top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, 300);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, PANEL.w, 300);
}
function river(ctx, top, bottom) {
  const g = ctx.createLinearGradient(0, 290, 0, PANEL.h);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 290, PANEL.w, PANEL.h - 290);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
  for (const y of [320, 360, 410, 460, 500]) {
    ctx.beginPath();
    for (let x = 20; x < PANEL.w - 20; x += 40) {
      ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 20, y - 5, x + 40, y);
    }
    ctx.stroke();
  }
}
function dock(ctx) {
  ctx.fillStyle = '#8a5a33'; ctx.fillRect(0, 284, PANEL.w, 26);
  ctx.fillStyle = '#6e4525';
  for (let x = 0; x < PANEL.w; x += 52) ctx.fillRect(x, 284, 3, 26);
  ctx.fillStyle = '#a06a3e'; ctx.fillRect(0, 284, PANEL.w, 5);
}
function cloud(ctx, x, y, s, color = '#ffffff') {
  ctx.fillStyle = color;
  circle(ctx, x, y, 16 * s); circle(ctx, x + 18 * s, y + 3 * s, 13 * s);
  circle(ctx, x + 36 * s, y, 15 * s); circle(ctx, x + 18 * s, y - 8 * s, 12 * s);
}
function sun(ctx, x, y, r, color = '#ffcf3f') {
  ctx.fillStyle = color; circle(ctx, x, y, r);
  ctx.strokeStyle = color; ctx.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * (r + 6), y + Math.sin(a) * (r + 6));
    ctx.lineTo(x + Math.cos(a) * (r + 16), y + Math.sin(a) * (r + 16));
    ctx.stroke();
  }
}
function moon(ctx, x, y, r, full) {
  ctx.fillStyle = '#f5eeda'; circle(ctx, x, y, r);
  if (!full) { ctx.fillStyle = '#141b3a'; circle(ctx, x + r * 0.45, y - r * 0.15, r * 0.85); }
}
function star(ctx, x, y, r) {
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, rad = i % 2 ? r * 0.4 : r;
    const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath(); ctx.fill();
}
function bird(ctx, x, y, s = 1) {
  ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 2.5; ctx.beginPath();
  ctx.moveTo(x - 10 * s, y); ctx.quadraticCurveTo(x - 4 * s, y - 7 * s, x, y);
  ctx.quadraticCurveTo(x + 4 * s, y - 7 * s, x + 10 * s, y); ctx.stroke();
}
function house(ctx, x, y, w, h, wall, roof, sign) {
  ctx.fillStyle = wall; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = roof; tri(ctx, x - 8, y, x + w / 2, y - 34, x + w + 8, y);
  ctx.fillStyle = '#2c2c34';
  ctx.fillRect(x + 14, y + h * 0.45, 22, 26); ctx.fillRect(x + w - 36, y + h * 0.45, 22, 26);
  ctx.fillRect(x + w / 2 - 14, y + h - 40, 28, 40);
  if (sign) {
    ctx.fillStyle = '#fff8e6'; rr(ctx, x + w / 2 - 34, y + 12, 68, 24, 4); ctx.fill();
    ctx.fillStyle = '#7a3b12'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(sign, x + w / 2, y + 29);
  }
}
function boat(ctx, cx, cy, hull, sail) {
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(cx - 55, cy - 8); ctx.lineTo(cx + 55, cy - 8);
  ctx.lineTo(cx + 40, cy + 22); ctx.lineTo(cx - 40, cy + 22); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5a3a22'; ctx.fillRect(cx - 3, cy - 52, 6, 46);
  if (sail) { ctx.fillStyle = sail; tri(ctx, cx, cy - 52, cx, cy - 10, cx + 34, cy - 10); }
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(cx - 50, cy - 8, 100, 5);
}
function lantern(ctx, x, y, color, glow) {
  if (glow) {
    const g = ctx.createRadialGradient(x, y, 2, x, y, 26);
    g.addColorStop(0, 'rgba(255,190,80,0.55)'); g.addColorStop(1, 'rgba(255,190,80,0)');
    ctx.fillStyle = g; circle(ctx, x, y, 26);
  }
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, 11, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd76a'; ctx.fillRect(x - 11, y - 3, 22, 4);
  ctx.fillStyle = '#7a3b12'; ctx.fillRect(x - 3, y - 17, 6, 4); ctx.fillRect(x - 3, y + 13, 6, 4);
}
function lanternString(ctx, y, skipIdx, color, glow) {
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, y - 14); ctx.quadraticCurveTo(312, y + 6, 624, y - 14); ctx.stroke();
  const xs = [80, 180, 280, 380, 480, 580];
  xs.forEach((x, i) => { if (i !== skipIdx) lantern(ctx, x, y + (i % 2 ? 8 : 0), color, glow); });
}
function basket(ctx, x, y, n, color) {
  ctx.fillStyle = '#8a5a33'; rr(ctx, x - 24, y, 48, 18, 4); ctx.fill();
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) circle(ctx, x - 16 + i * 11, y - 4 - (i % 2) * 6, 7);
}
function cat(ctx, x, y, color = '#e8912d') {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(x, y, 16, 11, 0, 0, Math.PI * 2); ctx.fill(); // body
  circle(ctx, x + 13, y - 12, 9); // head
  tri(ctx, x + 7, y - 18, x + 10, y - 26, x + 13, y - 18);
  tri(ctx, x + 14, y - 19, x + 17, y - 27, x + 20, y - 18);
  ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.beginPath();
  ctx.moveTo(x - 14, y + 4); ctx.quadraticCurveTo(x - 24, y - 8, x - 18, y - 16); ctx.stroke();
}
function flag(ctx, x, y, color, flipped) {
  ctx.fillStyle = '#5a3a22'; ctx.fillRect(x - 2, y - 34, 4, 40);
  ctx.fillStyle = color;
  if (flipped) tri(ctx, x, y - 34, x, y - 12, x - 24, y - 23);
  else tri(ctx, x, y - 34, x, y - 12, x + 24, y - 23);
}
function fish(ctx, x, y, color = '#ff8c42', flip = false) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(x, y, 14, 7, flip ? 0.4 : -0.4, 0, Math.PI * 2); ctx.fill();
  tri(ctx, x - 12, y, x - 22, y - 7, x - 22, y + 7);
}

// ---------------- Scene 1: Pasar Pagi (morning, warm) ----------------
export const DIFFS_1 = [
  { id: 'boat', name: 'Warna perahu buah', x: 150, y: 405, r: 36 },
  { id: 'lantern', name: 'Lentera hilang', x: 280, y: 70, r: 20 },
  { id: 'oranges', name: 'Jumlah jeruk', x: 235, y: 445, r: 24 },
  { id: 'cat', name: 'Kucing hilang', x: 560, y: 470, r: 22 },
  { id: 'flag', name: 'Bendera terbalik', x: 90, y: 120, r: 20 },
  { id: 'fishboat', name: 'Perahu ikan pindah', x: 515, y: 415, r: 46 },
  { id: 'sun', name: 'Matahari membesar', x: 560, y: 95, r: 38 },
];
export function drawScene1(ctx, diffs) {
  sky(ctx, '#ffcf9a', '#ffedc9');
  river(ctx, '#3a9bc2', '#1f6a8c');
  sun(ctx, 560, 95, diffs.has('sun') ? 52 : 34);
  cloud(ctx, 120, 80, 1); cloud(ctx, 300, 58, 0.8); cloud(ctx, 450, 110, 0.9);
  bird(ctx, 210, 110); bird(ctx, 250, 130, 0.8); bird(ctx, 420, 80, 0.9);
  lanternString(ctx, 70, diffs.has('lantern') ? 2 : -1, '#e14b7a', false);
  house(ctx, 55, 150, 120, 135, '#f2e3c2', '#c65a2e', 'PASAR');
  house(ctx, 440, 140, 135, 145, '#e8d5a8', '#3f7d6b', null);
  house(ctx, 285, 185, 100, 100, '#dfe9c8', '#8a5a33', null);
  flag(ctx, 90, 120, '#e14b7a', diffs.has('flag'));
  dock(ctx);
  boat(ctx, 150, 405, diffs.has('boat') ? '#2fa8a0' : '#d94f3d', '#fff3d6');
  boat(ctx, 330, 425, '#7a5fc0', '#ffe9a8');
  if (diffs.has('fishboat')) boat(ctx, 540, 430, '#2f6fb2', '#fff3d6');
  else boat(ctx, 490, 400, '#2f6fb2', '#fff3d6');
  basket(ctx, 235, 445, diffs.has('oranges') ? 3 : 5, '#ff8c1a');
  basket(ctx, 90, 450, 4, '#7ac74f');
  basket(ctx, 310, 462, 3, '#e14b7a');
  fish(ctx, 400, 492);
  if (!diffs.has('cat')) cat(ctx, 560, 470);
}

// ---------------- Scene 2: Pasar Siang (midday, bright) ----------------
export const DIFFS_2 = [
  { id: 'umbrella', name: 'Warna payung', x: 150, y: 200, r: 34 },
  { id: 'baskets', name: 'Jumlah keranjang', x: 90, y: 450, r: 26 },
  { id: 'boat2', name: 'Warna perahu bunga', x: 500, y: 405, r: 32 },
  { id: 'bird', name: 'Burung hilang', x: 300, y: 90, r: 18 },
  { id: 'flag2', name: 'Bendera terbalik', x: 310, y: 100, r: 20 },
  { id: 'fish', name: 'Ikan muncul', x: 200, y: 490, r: 22, panels: 'right' },
  { id: 'cloud', name: 'Awan membesar', x: 450, y: 70, r: 26 },
];
export function drawScene2(ctx, diffs) {
  sky(ctx, '#a8d8f8', '#e6f5ff');
  river(ctx, '#2f8fc7', '#1a5f8a');
  sun(ctx, 560, 70, 28, '#ffe066');
  cloud(ctx, 120, 70, 0.9); cloud(ctx, 450, 70, diffs.has('cloud') ? 1.6 : 0.9);
  if (!diffs.has('bird')) bird(ctx, 300, 90);
  bird(ctx, 200, 120, 0.8);
  house(ctx, 70, 160, 110, 125, '#f2e3c2', '#c65a2e', null);
  house(ctx, 220, 130, 180, 155, '#fdf3d0', '#2f6fb2', 'PASAR TERAPUNG');
  house(ctx, 460, 150, 120, 135, '#e8d5a8', '#3f7d6b', null);
  flag(ctx, 310, 100, '#d94f3d', diffs.has('flag2'));
  // big market umbrella over the left stall
  ctx.fillStyle = diffs.has('umbrella') ? '#2fa8a0' : '#d94f3d';
  ctx.beginPath(); ctx.arc(150, 205, 52, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath(); ctx.arc(150, 205, 52, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = diffs.has('umbrella') ? '#2fa8a0' : '#d94f3d';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(150, 205);
    ctx.arc(150, 205, 52, Math.PI + (i * Math.PI) / 4, Math.PI + ((i + 0.5) * Math.PI) / 4);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#5a3a22'; ctx.fillRect(148, 205, 4, 60);
  dock(ctx);
  boat(ctx, 140, 410, '#4a9e4d', '#fff3d6');
  boat(ctx, 330, 430, '#8a5a33', '#ffe9a8');
  boat(ctx, 500, 405, diffs.has('boat2') ? '#ffd21f' : '#e14b7a', '#fff3d6');
  basket(ctx, 90, 450, diffs.has('baskets') ? 2 : 4, '#ff8c1a');
  basket(ctx, 250, 460, 3, '#7ac74f');
  basket(ctx, 420, 455, 4, '#c65a2e');
  fish(ctx, 420, 495);
  if (diffs.has('fish')) fish(ctx, 200, 490, '#2fa8a0', true);
  cat(ctx, 570, 465, '#3a3a3a');
}

// ---------------- Scene 3: Lentera Malam (night lanterns) ----------------
export const DIFFS_3 = [
  { id: 'moon', name: 'Bulan purnama', x: 560, y: 90, r: 30 },
  { id: 'star', name: 'Bintang hilang', x: 150, y: 80, r: 16 },
  { id: 'lantern2', name: 'Warna lentera', x: 380, y: 85, r: 20 },
  { id: 'stall', name: 'Lampu warung padam', x: 430, y: 190, r: 36 },
  { id: 'boat3', name: 'Perahu lentera pindah', x: 230, y: 435, r: 46 },
  { id: 'cat2', name: 'Kucing muncul', x: 520, y: 480, r: 20, panels: 'right' },
  { id: 'flag3', name: 'Warna bendera', x: 120, y: 140, r: 18 },
];
export function drawScene3(ctx, diffs) {
  sky(ctx, '#141b3a', '#2e2a55');
  river(ctx, '#1d2f5e', '#101a3a');
  moon(ctx, 560, 90, 28, diffs.has('moon'));
  if (!diffs.has('star')) star(ctx, 150, 80, 9);
  star(ctx, 90, 140, 7); star(ctx, 260, 55, 8); star(ctx, 480, 60, 7); star(ctx, 350, 130, 6);
  // lantern string with glow
  ctx.strokeStyle = '#0a0a14'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 56); ctx.quadraticCurveTo(312, 76, 624, 56); ctx.stroke();
  const lxs = [80, 180, 280, 380, 480, 580];
  lxs.forEach((x, i) => {
    const c = i === 3 && diffs.has('lantern2') ? '#2fa8a0' : '#ff9a2e';
    lantern(ctx, x, 76 + (i % 2 ? 8 : 0), c, true);
  });
  // stalls with warm light + goods on shelves
  ctx.fillStyle = '#3a2a1a'; ctx.fillRect(80, 200, 130, 90);
  ctx.fillStyle = '#ffb347'; ctx.fillRect(92, 212, 106, 66);
  ctx.fillStyle = '#7a3b12'; ctx.fillRect(80, 196, 130, 10);
  ctx.fillStyle = '#c65a2e'; circle(ctx, 112, 240, 8); circle(ctx, 136, 240, 8);
  ctx.fillStyle = '#2fa8a0'; circle(ctx, 160, 240, 8); circle(ctx, 184, 240, 8);
  ctx.fillStyle = '#7a5fc0'; ctx.fillRect(104, 256, 14, 14); ctx.fillRect(128, 256, 14, 14);
  ctx.fillStyle = '#d94f3d'; ctx.fillRect(152, 256, 14, 14); ctx.fillRect(176, 256, 14, 14);
  ctx.fillStyle = '#3a2a1a'; ctx.fillRect(430, 190, 140, 100);
  if (!diffs.has('stall')) {
    ctx.fillStyle = '#ffb347'; ctx.fillRect(442, 202, 116, 76);
    ctx.fillStyle = '#2fa8a0'; circle(ctx, 466, 228, 8); circle(ctx, 490, 228, 8);
    ctx.fillStyle = '#e14b7a'; circle(ctx, 514, 228, 8); circle(ctx, 538, 228, 8);
    ctx.fillStyle = '#7a5fc0'; ctx.fillRect(458, 248, 14, 14); ctx.fillRect(482, 248, 14, 14);
    ctx.fillStyle = '#ff8c1a'; ctx.fillRect(506, 248, 14, 14); ctx.fillRect(530, 248, 14, 14);
  } else { ctx.fillStyle = '#241a12'; ctx.fillRect(442, 202, 116, 76); }
  ctx.fillStyle = '#7a3b12'; ctx.fillRect(430, 186, 140, 10);
  house(ctx, 250, 170, 110, 120, '#2a2a3e', '#1a1a2a', null);
  flag(ctx, 120, 140, diffs.has('flag3') ? '#2fa8a0' : '#d94f3d', false);
  dock(ctx);
  if (diffs.has('boat3')) boat(ctx, 260, 450, '#7a5fc0', '#ffe9a8');
  else boat(ctx, 200, 420, '#7a5fc0', '#ffe9a8');
  boat(ctx, 420, 430, '#2f6fb2', '#fff3d6');
  lantern(ctx, 200, 400, '#ff9a2e', true); lantern(ctx, 420, 408, '#ff9a2e', true);
  // river reflections
  ctx.fillStyle = 'rgba(255,170,60,0.25)';
  for (const x of [80, 180, 280, 380, 480]) ctx.fillRect(x - 4, 320, 8, 130);
  fish(ctx, 330, 495, '#7ac74f');
  if (diffs.has('cat2')) cat(ctx, 520, 480);
  cat(ctx, 300, 165, '#e8912d');
}

export const SCENE_DRAW = [drawScene1, drawScene2, drawScene3];
export const SCENE_DIFFS = [DIFFS_1, DIFFS_2, DIFFS_3];
