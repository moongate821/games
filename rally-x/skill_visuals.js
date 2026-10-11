'use strict';

// The shape as well as the colour identifies each skill. Drawn in code like the cars.
const SKILL_LOOK = {
  lance:   { family: '貫通', color: '#ffd45a', dark: '#654514', symbol: 'spear' },
  mine:    { family: '爆発', color: '#ff7752', dark: '#66301e', symbol: 'mine' },
  radar:   { family: '走査', color: '#61e9a5', dark: '#176249', symbol: 'radar' },
  speed:   { family: '走行', color: '#58caff', dark: '#18476d', symbol: 'speed' },
  antenna: { family: '収集', color: '#78baff', dark: '#263d79', symbol: 'magnet' },
  fuel:    { family: '煙幕', color: '#c78cff', dark: '#4a2870', symbol: 'fuel' },
  hpup:    { family: '装甲', color: '#a0ed6d', dark: '#3b662b', symbol: 'shield' },
  power:   { family: '出力', color: '#ff83b6', dark: '#71304e', symbol: 'bolt' },
};
Object.assign(SKILL_LOOK, EXTRA_LOOK);

function skillSymbol(k, x, y, size, color) {
  const ctx0 = ctx, shape = SKILL_LOOK[k].symbol;
  ctx0.save(); ctx0.translate(x, y); ctx0.scale(size / 40, size / 40);
  ctx0.strokeStyle = color; ctx0.fillStyle = color; ctx0.lineWidth = 3;
  ctx0.lineCap = 'round'; ctx0.lineJoin = 'round';
  const line = (...pts) => { ctx0.beginPath(); ctx0.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx0.lineTo(pts[i], pts[i + 1]); ctx0.stroke(); };
  if (shape === 'spear') { line(-13, 13, 11, -11); line(5, -13, 15, -15, 13, -5); line(-16, 4, -4, 16); }
  if (shape === 'mine') { ctx0.beginPath(); ctx0.arc(0, 0, 8, 0, 7); ctx0.stroke(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; line(Math.cos(a) * 11, Math.sin(a) * 11, Math.cos(a) * 17, Math.sin(a) * 17); } ctx0.fillRect(-2, -2, 4, 4); }
  if (shape === 'radar') { ctx0.beginPath(); ctx0.arc(0, 0, 15, 0, 7); ctx0.stroke(); ctx0.beginPath(); ctx0.arc(0, 0, 7, 0, 7); ctx0.stroke(); line(0, 0, 13, -9); ctx0.fillRect(-2, -2, 4, 4); }
  if (shape === 'speed') { line(-15, -10, -4, 0, -15, 10); line(-2, -10, 9, 0, -2, 10); line(10, -10, 19, 0, 10, 10); }
  if (shape === 'magnet') { line(-12, -4, -12, 7, -7, 12, 7, 12, 12, 7, 12, -4); line(-16, -4, -8, -4); line(8, -4, 16, -4); }
  if (shape === 'fuel') { ctx0.beginPath(); ctx0.moveTo(0, -17); ctx0.bezierCurveTo(-10, -2, -14, 4, -8, 12); ctx0.quadraticCurveTo(0, 19, 8, 12); ctx0.bezierCurveTo(14, 4, 10, -2, 0, -17); ctx0.stroke(); ctx0.fillRect(-3, 3, 6, 6); }
  if (shape === 'shield') { line(0, -17, 14, -11, 12, 6, 0, 17, -12, 6, -14, -11, 0, -17); line(-5, 0, -1, 5, 7, -5); }
  if (shape === 'bolt') { ctx0.beginPath(); ctx0.moveTo(4, -17); ctx0.lineTo(-10, 2); ctx0.lineTo(-1, 2); ctx0.lineTo(-5, 17); ctx0.lineTo(11, -3); ctx0.lineTo(2, -3); ctx0.closePath(); ctx0.fill(); }
  ctx0.restore();
}

function skillPips(k, level, cap, x, y, width) {
  const look = SKILL_LOOK[k];
  ctx.save();
  for (let i = 0; i < cap; i++) {
    const px = x + i * width / cap;
    ctx.fillStyle = i < level ? look.color : 'rgba(190,205,240,.17)';
    ctx.fillRect(px, y, width / cap - 2, 4);
  }
  ctx.restore();
}

function skillAcquire(k, level, cap) {
  const look = SKILL_LOOK[k], maxed = level >= cap && !WEAPONS[k].filler, ultimate = maxed && cap >= 10;
  const tier = WEAPONS[k].filler ? Math.min(5, level) : Math.min(5, Math.max(1, Math.ceil(level / cap * 5)));
  const p = G.p, x = p.cx, y = p.cy;
  G.skillAward = { k, level, cap, maxed, ultimate, tier, at: performance.now(), duration: ultimate ? 3000 : maxed ? 2600 : 1350 };
  ring(x, y, 70 + tier * 10, .38, look.color, 3 + tier);
  glowFx(x, y, 48 + tier * 15, look.color, .45);
  burst(x, y, look.color, 8 + tier * 5 + (maxed ? 45 : 0), 140 + tier * 55, 'spark');
  if(WEAPONS[k].fusion && level===1){ring(x,y,280,.8,look.color,10);ring(x,y,390,1,'#ffffff',4);burst(x,y,look.color,70,620,'spark');flash(.7,look.color);G.shake=.6;G.shakeA=13;G.skillAward.duration=2400;}
  if (tier >= 3) ring(x, y, 120 + tier * 9, .5, '#ffffff', 2);
  if (maxed) {
    ring(x, y, 230, .8, look.color, 9); ring(x, y, 320, 1.0, '#ffffff', 3);
    burst(x, y, '#ffffff', 45, 440, 'spark');
    if (ultimate) { ring(x, y, 390, 1.1, '#ff82e4', 6); burst(x, y, '#ff82e4', 25, 550, 'spark'); }
    flash(.55, look.color); G.freeze = Math.max(G.freeze, .12);
    G.shake = Math.max(G.shake, .25); G.shakeA = 6;
    [392, 523, 659, 784, 1047].forEach((f, i) => sfx(f, .25, 'triangle', .055, 0, i * .08));
  } else {
    flash(.09 + tier * .035, look.color);
    sfx(440 + tier * 90, .16 + tier * .025, 'triangle', .04, 0);
  }
}

function drawSkillAward() {
  const a = G.skillAward; if (!a) return;
  const ms = performance.now() - a.at;
  if (ms >= a.duration) { G.skillAward = null; return; }
  const t = ms / a.duration, look = SKILL_LOOK[a.k];
  const alpha = Math.min(1, ms / 170, (a.duration - ms) / 450);
  const size = a.maxed ? 110 : 54 + a.tier * 9;
  ctx.save(); ctx.globalAlpha = alpha;
  // A compact banner clears the centre of the road after the initial impact.
  const yy = a.maxed ? VH * .30 : VH * .24;
  ctx.fillStyle = '#050919'; ctx.fillRect(VW / 2 - (a.maxed ? 250 : 195), yy - 48, a.maxed ? 500 : 390, a.maxed ? 112 : 84);
  ctx.strokeStyle = look.color; ctx.lineWidth = a.maxed ? 5 : 2; ctx.strokeRect(VW / 2 - (a.maxed ? 250 : 195), yy - 48, a.maxed ? 500 : 390, a.maxed ? 112 : 84);
  if (a.maxed) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 16; i++) { const ang = i * Math.PI / 8 + ms * .001; ctx.strokeStyle = look.color; ctx.globalAlpha = alpha * .4; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(VW / 2 + Math.cos(ang) * 160, yy + Math.sin(ang) * 70); ctx.lineTo(VW / 2 + Math.cos(ang) * 260, yy + Math.sin(ang) * 130); ctx.stroke(); }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = alpha;
  }
  skillSymbol(a.k, VW / 2 - (a.maxed ? 185 : 140), yy + 3, size, look.color);
  txt(a.ultimate ? 'ULTIMATE MAX!' : a.maxed ? 'MAXIMUM!' : `${look.family}  POWER UP`, VW / 2 - (a.maxed ? 122 : 95), yy - 4, a.maxed ? 27 : 19, look.color);
  txt(`${WEAPONS[a.k].name}  Lv${a.level}`, VW / 2 - (a.maxed ? 120 : 95), yy + 28, a.maxed ? 20 : 16, '#ffffff');
  ctx.restore();
}

function drawSkillCard(k, i, selected, tm) {
  const look = SKILL_LOOK[k], level = lv(k), cap = maxLv(k), next = level + 1;
  const e = Math.min(1, Math.max(0, (tm - .08 * i) / .3)), drop = (1 - e) * (1 - e) * -340;
  const x = 90 + i * 270, y = 160 + drop, maxed = next >= cap && !WEAPONS[k].filler;
  ctx.fillStyle = '#0c112c'; ctx.fillRect(x, y, 250, 240);
  ctx.fillStyle = look.dark; ctx.fillRect(x + 4, y + 4, 242, 60);
  ctx.fillStyle = look.color; ctx.fillRect(x, y, 250, 5);
  if (selected || maxed) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(x + 125, y + 95, 160, look.color, selected ? .38 : .19); ctx.restore(); }
  ctx.strokeStyle = maxed ? '#ffffff' : look.color; ctx.lineWidth = selected ? 4 : 2; ctx.strokeRect(x, y, 250, 240);
  skillSymbol(k, x + 38, y + 39, 40, look.color);
  txt(look.family, x + 68, y + 33, 16, look.color);
  txt(`${i + 1}`, x + 228, y + 30, 18, '#ffffff', 'right');
  txt(WEAPONS[k].name, x + 125, y + 93, 19, '#ffffff', 'center');
  txt(WEAPONS[k].fusion && !level ? '★ 合成進化 / 2→1枠 ★' : maxed ? '★ MAXIMUM ★' : level ? `Lv ${level} → ${next}${WEAPONS[k].filler ? ' ∞' : ` / ${cap}`}` : 'NEW  Lv 1', x + 125, y + 120, 16, maxed ? '#fff2a0' : look.color, 'center');
  skillPips(k, Math.min(next, WEAPONS[k].filler ? 5 : cap), WEAPONS[k].filler ? 5 : Math.min(cap, 10), x + 25, y + 132, 200);
  wrapText(WEAPONS[k].desc(level), x + 125, y + 164, 215, 16);
}

function drawSkillHud() {
  let yy = 208;
  for (const k of [...equippedSkills(), 'hpup', 'power']) {
    const level = lv(k); if (!level) continue;
    const look = SKILL_LOOK[k], cap = maxLv(k);
    ctx.fillStyle = 'rgba(3,6,22,.78)'; ctx.fillRect(VW - 177, yy - 13, 164, 27);
    skillSymbol(k, VW - 163, yy, 19, look.color);
    const name = WEAPONS[k].name;
    txt(name, VW - 148, yy + 2, 12, look.color);
    txt(level >= cap && !WEAPONS[k].filler ? 'MAX' : String(level), VW - 17, yy + 2, 12, level >= cap && !WEAPONS[k].filler ? '#fff3ab' : '#ffffff', 'right');
    skillPips(k, Math.min(level, WEAPONS[k].filler ? 5 : cap), WEAPONS[k].filler ? 5 : cap, VW - 145, yy + 7, 122);
    yy += 31;
  }
}
