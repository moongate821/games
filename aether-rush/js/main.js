// AETHER RUSH — 全体の進行(メニュー・レース・カメラ・HUD・入力)
import * as THREE from '../lib/three.module.js';
import { COURSES, CUPS, buildTrack, buildTrackMeshes, minimapPath } from './course.js';
import { MACHINES, RIVALS, makeShipModel, makeShadow } from './machines.js';
import { makeShip, placeShip, stepShip, updateProgress, aiInput, collideShips, CFG } from './sim.js';
import { buildScenery, SpeedLines, Particles } from './scenery.js';
import { Snd } from './audio.js';

const $ = (id) => document.getElementById(id);
const q = new URLSearchParams(location.search);
const isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
if (isTouch) document.body.classList.add('touch');
const DT = 1 / 120;
const KMH = 3.1;

// ---------- 描画器 ----------
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.75 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const camera = new THREE.PerspectiveCamera(64, 1, 0.5, 9000);
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

// ---------- 保存 ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem('aether.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('aether.' + k, JSON.stringify(v)); } catch (e) { /* 保存できない環境 */ } },
};

// ---------- 入力 ----------
const keys = {};
const touch = { steer: 0, accel: 0, brake: 0, boost: false, drift: false };   // steer=-1..1(スティックの左右)、accel/brake=0..1(前/後ろ)
const pad = { steer: 0, accel: 0, brake: 0, boost: false, drift: false, connected: false };
const menuEdge = {};
addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) e.preventDefault();
  if (e.repeat) { keys[e.code] = true; return; }
  keys[e.code] = true; Snd.init(); onKey(e.code);
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (mode === 'race' && race && race.state !== 'results') pause(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (mode === 'race' && race && race.state !== 'results') pause(true); Snd.suspend(); } else Snd.resume(); });
function bindTouch(id, key) {
  const el = $(id);
  const on = (e) => { e.preventDefault(); touch[key] = true; el.classList.add('on'); try { el.setPointerCapture(e.pointerId); } catch (x) { /* */ } Snd.init(); };
  const off = (e) => { touch[key] = false; el.classList.remove('on'); };
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('lostpointercapture', off);
}
bindTouch('tBoost', 'boost'); bindTouch('tDrift', 'drift');
// 仮想スティック(画面の左側のどこを触ってもそこが中心になる)。左右=ハンドル、前(上)=アクセル、後ろ(下)=ブレーキ
(() => {
  const zone = $('stickZone'), base = $('stickBase'), knob = $('stickKnob');
  const RAD = 58; let sid = null, cx = 0, cy = 0;
  const reset = () => { touch.steer = touch.accel = touch.brake = 0; knob.style.transform = 'translate(-50%,-50%)'; base.classList.remove('active'); base.style.left = base.style.top = ''; sid = null; };
  const move = (e) => {
    let dx = e.clientX - cx, dy = e.clientY - cy; const len = Math.hypot(dx, dy);
    if (len > RAD) { dx *= RAD / len; dy *= RAD / len; }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    const nx = dx / RAD, ny = dy / RAD, dz = 0.08;
    touch.steer = Math.sign(nx) * Math.pow(Math.max(0, (Math.abs(nx) - dz) / (1 - dz)), 1.15);
    touch.accel = ny < -0.14 ? Math.min(1, (-ny - 0.14) / 0.45) : 0;      // 少し前に倒せばアクセル全開に近づく
    touch.brake = ny > 0.3 ? Math.min(1, (ny - 0.3) / 0.5) : 0;
  };
  zone.addEventListener('pointerdown', (e) => {
    if (sid !== null) return; e.preventDefault(); Snd.init();
    sid = e.pointerId; try { zone.setPointerCapture(sid); } catch (x) { /* */ }
    cx = e.clientX; cy = e.clientY; base.style.left = (cx - 66) + 'px'; base.style.top = (cy - 66) + 'px'; base.classList.add('active'); move(e);
  });
  zone.addEventListener('pointermove', (e) => { if (e.pointerId === sid) { e.preventDefault(); move(e); } });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) zone.addEventListener(ev, (e) => { if (e.pointerId === sid || ev === 'lostpointercapture') reset(); });
})();
$('tPause').addEventListener('pointerdown', (e) => { e.preventDefault(); if (mode === 'race') pause(!paused); });
$('muteBtn').addEventListener('click', () => { Snd.init(); const m = Snd.toggleMute(); $('muteBtn').textContent = m ? '♪ OFF' : '♪ ON'; store.set('mute', m); });
if (store.get('mute', false)) { Snd.setMuted(true); $('muteBtn').textContent = '♪ OFF'; }

function pollPad() {
  const gp = (navigator.getGamepads ? [...navigator.getGamepads()] : []).find((g) => g && g.connected);
  pad.connected = !!gp;
  if (!gp) { pad.steer = pad.accel = pad.brake = 0; pad.boost = pad.drift = false; return; }
  const dz = (v) => (Math.abs(v) < 0.14 ? 0 : v);
  const b = (i) => (gp.buttons[i] ? gp.buttons[i].value || (gp.buttons[i].pressed ? 1 : 0) : 0);
  pad.steer = dz(gp.axes[0] || 0) + (b(15) - b(14));
  pad.accel = Math.max(b(0), b(7), b(5) * 0.0);
  pad.brake = Math.max(b(1), b(6));
  pad.boost = b(2) > 0.5 || b(3) > 0.5;
  pad.drift = b(4) > 0.5 || b(5) > 0.5;
  // メニュー操作
  const edge = (name, down) => { const was = menuEdge[name]; menuEdge[name] = down; return down && !was; };
  const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
  if (edge('l', ax < -0.6 || b(14) > 0.5)) onKey('ArrowLeft');
  if (edge('r', ax > 0.6 || b(15) > 0.5)) onKey('ArrowRight');
  if (edge('u', ay < -0.6 || b(12) > 0.5)) onKey('ArrowUp');
  if (edge('d', ay > 0.6 || b(13) > 0.5)) onKey('ArrowDown');
  if (edge('a', b(0) > 0.5 && mode !== 'race')) onKey('Enter');
  if (edge('b', b(1) > 0.5 && mode !== 'race')) onKey('Escape');
  if (edge('s', b(9) > 0.5)) onKey('KeyP');
}
function playerInput() {
  const k = keys;
  let steer = (k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0);
  if (Math.abs(touch.steer) > Math.abs(steer)) steer = touch.steer;
  if (Math.abs(pad.steer) > Math.abs(steer)) steer = pad.steer;
  steer = Math.max(-1, Math.min(1, steer));
  let accel = (k.ArrowUp || k.KeyW ? 1 : 0), brake = (k.ArrowDown || k.KeyS ? 1 : 0);
  accel = Math.max(accel, touch.accel); brake = Math.max(brake, touch.brake);
  accel = Math.max(accel, pad.accel); brake = Math.max(brake, pad.brake);
  return {
    steer, accel, brake,
    boost: !!(k.Space || k.KeyX || k.KeyB || touch.boost || pad.boost),
    drift: !!(k.ShiftLeft || k.ShiftRight || k.KeyZ || k.KeyV || touch.drift || pad.drift),
  };
}

// ---------- 画面(DOM) ----------
const ui = $('ui');
let mode = 'loading', selMachine = store.get('machine', 0), selCourse = store.get('course', 0), selBtn = 0;
let race = null, paused = false, menuScene = null, menuShip = null, menuCam = null, menuT = 0;

function screen(html, cls = 'dark') { ui.innerHTML = `<div class="screen ${cls}" id="scr">${html}</div>`; }
function stars(n, max = 5) { let s = ''; for (let i = 0; i < max; i++) s += `<i class="${i < n ? 'on' : ''}"></i>`; return s; }
const fmt = (t) => { if (!t || !isFinite(t)) return '--:--.--'; const m = Math.floor(t / 60), s = t - m * 60; return `${m}:${s < 10 ? '0' : ''}${s.toFixed(2)}`; };

function showTitle() {
  mode = 'title'; $('hud').classList.add('hidden'); $('touch').classList.add('hidden'); Snd.bgmStop(); Snd.engineStop();
  useMenuScene(0);
  screen(`<div class="logo">AETHER<br>RUSH</div><div class="sub">反重力ポリゴンレース</div>
    <div class="press" id="go">${isTouch ? 'TAP TO START' : 'PRESS ENTER'}</div>
    <div class="hint">${isTouch ? '画面の左側を押さえてスティック: <b>左右</b> ハンドル　<b>前(上)</b> アクセル　<b>後ろ(下)</b> ブレーキ<br>右側: <b>BOOST</b> ブースト(パワーを消費)　<b>DRIFT</b> ドリフト<br>' : '<b>←→</b> ハンドル　<b>↑</b> アクセル　<b>↓</b> ブレーキ　<b>Space</b> ブースト(パワーを消費)　<b>Shift</b> ドリフト<br>パッドも使えます(スティック/A=アクセル、B=ブレーキ、X=ブースト、LB・RB=ドリフト)。<br>'}
    壁にぶつかるとパワーが減り、0で大破。緑の回復ゾーンで補給。ピンクのジャンプ台でギャップを飛び越えよう。</div>`, 'side');
  $('go').addEventListener('click', () => { Snd.init(); Snd.decide(); showMachineSelect(); });
}

function showMachineSelect() {
  mode = 'machine'; useMenuScene(selMachine);
  const cards = MACHINES.map((m, i) => `<div class="card ${i === selMachine ? 'sel' : ''}" data-i="${i}"><h3>${m.name}</h3><div class="jp">${m.jp}</div>
    <div class="stat"><span>SPEED</span>${stars(m.stars.speed)}</div><div class="stat"><span>ACCEL</span>${stars(m.stars.accel)}</div>
    <div class="stat"><span>HANDLE</span>${stars(m.stars.handling)}</div><div class="stat"><span>BODY</span>${stars(m.stars.body)}</div></div>`).join('');
  screen(`<h2>SELECT MACHINE</h2><div class="desc" id="desc">${MACHINES[selMachine].note}</div><div class="row">${cards}</div>
    <div class="btns"><div class="btn sec" id="back">BACK</div><div class="btn" id="ok">NEXT ▶</div></div>`, 'side');
  ui.querySelectorAll('.card').forEach((c) => c.addEventListener('click', () => { Snd.init(); const i = +c.dataset.i; if (i === selMachine) { Snd.decide(); showCourseSelect(); } else { selMachine = i; Snd.select(); showMachineSelect(); } }));
  $('ok').addEventListener('click', () => { Snd.init(); Snd.decide(); showCourseSelect(); });
  $('back').addEventListener('click', () => { Snd.cancel(); showTitle(); });
}

function showCourseSelect() {
  mode = 'course'; useMenuScene(selMachine);
  const rows = CUPS.map((cup, ci) => {
    const cards = COURSES.slice(ci * 5, ci * 5 + 5).map((c, k) => {
      const i = ci * 5 + k, best = store.get('best.' + c.id, 0);
      return `<div class="ccard ${i === selCourse ? 'sel' : ''}" data-i="${i}"><canvas width="120" height="120" data-c="${i}"></canvas>
      <div class="cn"><b>${String(i + 1).padStart(2, '0')}</b> ${c.name}</div><div class="cb">${best ? 'BEST ' + fmt(best) : '&nbsp;'}</div></div>`;
    }).join('');
    return `<div class="cuplabel">${cup}</div><div class="crow">${cards}</div>`;
  }).join('');
  const c0 = COURSES[selCourse];
  screen(`<h2>SELECT COURSE</h2><div class="cgrid" id="cgrid">${rows}</div>
    <div class="desc" id="desc"><b>${String(selCourse + 1).padStart(2, '0')} ${c0.name}</b> ― ${c0.jp}<br>${c0.desc}</div>
    <div class="btns"><div class="btn sec" id="back">BACK</div><div class="btn" id="ok">START ▶</div></div>`, 'side');
  ui.querySelectorAll('.ccard').forEach((c) => c.addEventListener('click', () => { Snd.init(); const i = +c.dataset.i; if (i === selCourse) { Snd.decide(); store.set('course', selCourse); startRace(selCourse, selMachine); } else { selCourse = i; Snd.select(); showCourseSelect(); } }));
  $('ok').addEventListener('click', () => { Snd.init(); Snd.decide(); store.set('course', selCourse); startRace(selCourse, selMachine); });
  $('back').addEventListener('click', () => { Snd.cancel(); showMachineSelect(); });
  ui.querySelectorAll('canvas[data-c]').forEach((cv) => {
    const i = +cv.dataset.c, tr = trackCache(i), g = cv.getContext('2d'), mp = minimapPath(tr, 120);
    g.clearRect(0, 0, 120, 120); g.lineWidth = 3; g.lineJoin = 'round'; g.strokeStyle = '#' + COURSES[i].pal.neon.toString(16).padStart(6, '0'); g.shadowColor = g.strokeStyle; g.shadowBlur = 6;
    g.beginPath(); mp.pts.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.stroke();
    g.shadowBlur = 0;
    // 滑る区間は紫の点、ジャンプは赤い点
    const dot = (idx, col) => { const [x, y] = mp.map(tr.P[idx * 3], tr.P[idx * 3 + 2]); g.fillStyle = col; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); };
    tr.pads.forEach((pd) => { if (pd.type === 'slip') dot((pd.i0 + (pd.len >> 1)) % tr.N, '#c07aff'); else if (pd.type === 'jump') dot((pd.i0 + 14) % tr.N, '#ff4a6a'); });
    g.fillStyle = '#fff'; g.beginPath(); g.arc(mp.pts[0][0], mp.pts[0][1], 3.5, 0, 7); g.fill();
  });
  const sel = ui.querySelector('.ccard.sel'); if (sel) sel.scrollIntoView({ block: 'nearest' });
}
const _tc = {};
function trackCache(i) { return _tc[i] || (_tc[i] = buildTrack(COURSES[i])); }

function onKey(code) {
  if (mode === 'title') { if (code === 'Enter' || code === 'Space') { Snd.decide(); showMachineSelect(); } return; }
  if (mode === 'machine') {
    if (code === 'ArrowLeft' || code === 'KeyA') { selMachine = (selMachine + MACHINES.length - 1) % MACHINES.length; Snd.select(); showMachineSelect(); }
    else if (code === 'ArrowRight' || code === 'KeyD') { selMachine = (selMachine + 1) % MACHINES.length; Snd.select(); showMachineSelect(); }
    else if (code === 'Enter' || code === 'Space') { Snd.decide(); store.set('machine', selMachine); showCourseSelect(); }
    else if (code === 'Escape') { Snd.cancel(); showTitle(); }
    return;
  }
  if (mode === 'course') {
    if (code === 'ArrowLeft' || code === 'KeyA') { selCourse = (selCourse + COURSES.length - 1) % COURSES.length; Snd.select(); showCourseSelect(); }
    else if (code === 'ArrowRight' || code === 'KeyD') { selCourse = (selCourse + 1) % COURSES.length; Snd.select(); showCourseSelect(); }
    else if (code === 'ArrowUp' || code === 'KeyW') { selCourse = (selCourse + COURSES.length - 5) % COURSES.length; Snd.select(); showCourseSelect(); }
    else if (code === 'ArrowDown' || code === 'KeyS') { selCourse = (selCourse + 5) % COURSES.length; Snd.select(); showCourseSelect(); }
    else if (code === 'Enter' || code === 'Space') { Snd.decide(); store.set('course', selCourse); startRace(selCourse, selMachine); }
    else if (code === 'Escape') { Snd.cancel(); showMachineSelect(); }
    return;
  }
  if (mode === 'race') {
    if (race && race.state === 'results') {
      if (code === 'Enter' || code === 'Space') startRace(race.ci, race.mi);
      else if (code === 'Escape') showCourseSelect();
      return;
    }
    if (code === 'Escape' || code === 'KeyP') pause(!paused);
    else if (paused && (code === 'Enter' || code === 'Space')) pause(false);
    else if (paused && code === 'KeyR') { pause(false); startRace(race.ci, race.mi); }
    else if (paused && code === 'KeyQ') { pause(false); showCourseSelect(); }
    else if (code === 'KeyR' && race && race.player.down) startRace(race.ci, race.mi);
    return;
  }
}

// ---------- メニュー用の舞台 ----------
function useMenuScene(mi) {
  if (!menuScene) {
    menuScene = new THREE.Scene(); menuScene.background = new THREE.Color(0x070420); menuScene.fog = new THREE.Fog(0x070420, 40, 160);
    menuScene.add(new THREE.HemisphereLight(0x9ab8ff, 0x40205a, 1.2));
    const dl = new THREE.DirectionalLight(0xffffff, 2.2); dl.position.set(-6, 10, 8); menuScene.add(dl);
    const dl2 = new THREE.DirectionalLight(0xff2bd6, 1.6); dl2.position.set(8, 2, -6); menuScene.add(dl2);
    const grid = new THREE.GridHelper(300, 60, 0x7a2cff, 0x2a1a6a); grid.position.y = -2.6; menuScene.add(grid);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.07, 6, 48).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x00f0ff })); ring.position.y = -2.5; ring.name = 'ring'; menuScene.add(ring);
    menuCam = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
  }
  if (menuShip) { menuScene.remove(menuShip); menuShip = null; }
  menuShip = makeShipModel(MACHINES[mi]); menuShip.scale.setScalar(1.15); menuScene.add(menuShip);
  menuShip.userData.mi = mi;
}

// ---------- レース ----------
function disposeScene(sc) { if (!sc) return; sc.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); } }); }

function startRace(ci, mi) {
  const opts = { laps: +q.get('laps') || 0 };
  if (race) { camera.remove(race.lines.mesh); race.scene.remove(camera); disposeScene(race.scene); }
  ui.innerHTML = ''; paused = false;
  const def = COURSES[ci], tr = buildTrack(def), scene = new THREE.Scene();
  const meshes = buildTrackMeshes(tr);
  scene.add(new THREE.Mesh(meshes.body, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide })));
  scene.add(new THREE.Mesh(meshes.glow, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
  const scenery = buildScenery(scene, tr, isTouch ? 0.7 : 1);
  const skyObjs = []; scenery.children.forEach((o) => { if (o.userData.sky) { skyObjs.push({ o, off: o.position.clone() }); } });
  const pal = def.pal;
  scene.add(new THREE.HemisphereLight(pal.skyBot, pal.ground, 1.05));
  const sunL = new THREE.DirectionalLight(0xffffff, 2.0); sunL.position.set(-0.5, 1, 0.3); scene.add(sunL);
  const fill = new THREE.DirectionalLight(pal.edge, 0.8); fill.position.set(0.6, 0.3, -0.8); scene.add(fill);
  const parts = new Particles(scene, 360);
  scene.add(camera);
  const lines = new SpeedLines(camera);

  const laps = opts.laps || def.laps;
  const ships = [];
  // 開始位置(8台)。プレイヤーは後ろ寄りの 6 番グリッド
  const slotOf = (k) => k; // 0..7
  const slots = [];
  for (let s = 0; s < 8; s++) slots.push({ i: -(10 + Math.floor(s / 2) * 11), lat: (s % 2 ? 1 : -1) * 12 });
  const playerSlot = 5, aiSlots = [0, 1, 2, 3, 4, 6, 7];
  const mk = (mach, name, isPlayer, paint, skill, lane, slot) => {
    const s = makeShip(mach, { name, isPlayer, skill, lane });
    s.model = makeShipModel(mach, paint); s.model.scale.setScalar(1.4); scene.add(s.model);
    s.shadow = makeShadow(); scene.add(s.shadow);
    placeShip(tr, s, (tr.N + slots[slot].i) % tr.N, slots[slot].lat, 0);
    s.cum = slots[slot].i; s.prevIdx = s.idx; s.lap = -1; s.lapStart = 0; s.lastSafe = s.idx; s.slot = slot;
    ships.push(s); return s;
  };
  const player = mk(MACHINES[mi], 'YOU', true, null, 1, 0, playerSlot);
  const rivals = RIVALS.map((r, k) => mk(MACHINES[r.mach], r.name, false, { body: r.body, accent: r.accent }, r.skill, r.lane, aiSlots[k]));
  const mm = minimapPath(tr, 170);
  race = { ci, mi, def, tr, scene, ships, player, laps, time: -3.6, state: 'countdown', acc: 0, parts, lines, skyObjs, mm, msgT: 0, wrong: 0, camPos: new THREE.Vector3(), camUp: new THREE.Vector3(0, 1, 0), fov: 64, shake: 0, lastCount: 4, resultsT: 0, bot: q.get('bot') === '1', finishedOrder: [], hudCache: {}, bgm: false };
  initCamera();
  buildHud();
  mode = 'race'; $('hud').classList.remove('hidden'); if (isTouch) $('touch').classList.remove('hidden'); else $('touch').classList.add('hidden');
  Snd.init(); Snd.engineStart(); if (!(window.__keepBgm && Snd.bgmOn)) Snd.bgmStart(def.style, def.seed);
  say('', 0);
}

function initCamera() {
  const p = race.player; race.camPos.copy(p.pos).addScaledVector(p.hd, -18).addScaledVector(p.up, 6); race.camUp.copy(p.up);
}

function buildHud() {
  const bar = $('pbar'); bar.innerHTML = ''; for (let i = 0; i < 20; i++) bar.appendChild(document.createElement('i'));
  race.hudCache = {};
}
function setText(id, v) { const c = race.hudCache; if (c[id] !== v) { c[id] = v; $(id).innerHTML = v; } }
function say(text, dur = 1.5, small = false) {
  const el = $('center'); el.textContent = text; el.className = small ? 'small pop' : 'pop'; el.style.display = text ? 'block' : 'none';
  void el.offsetWidth; race && (race.msgT = dur);
}

function evHandler(type, s, val) {
  const p = race.player;
  if (s !== p) { // 相手の効果は近くのときだけ火花
    if (type === 'wall') sparks(s, 6);
    return;
  }
  if (type === 'wall') { Snd.wall(Math.min(1, val / 70)); race.shake = Math.max(race.shake, Math.min(1, val / 60)); sparks(s, 14); flash(); }
  else if (type === 'boostpad') { Snd.boostpad(); race.shake = Math.max(race.shake, 0.5); }
  else if (type === 'jump') Snd.jump();
  else if (type === 'land') { Snd.land(); race.shake = Math.max(race.shake, 0.4); }
  else if (type === 'recover') Snd.recover();
  else if (type === 'lap') { Snd.lap(); say(`LAP ${s.lap + 1}${s.lap + 1 === race.laps ? '  FINAL' : ''}`, 1.6, true); }
  else if (type === 'finish') { Snd.finish(); say('FINISH!', 3); race.resultsT = 3.2; }
  else if (type === 'down') { Snd.explode(); say('MACHINE DOWN', 3, true); race.resultsT = 3.2; explode(s); }
  else if (type === 'respawn') { Snd.respawn(); }
}
function flash() { const f = $('flash'); f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 90); }
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
function sparks(s, n) {
  const col = [0xffd060, 0xffffff, 0xff8a30];
  for (let i = 0; i < n; i++) {
    _a.set(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5).multiplyScalar(40);
    race.parts.emit(s.pos.x, s.pos.y, s.pos.z, s.vel.x * 0.5 + _a.x, s.vel.y * 0.3 + _a.y + 14, s.vel.z * 0.5 + _a.z, col[i % 3], 0.35 + Math.random() * 0.4);
  }
}
function explode(s) {
  for (let i = 0; i < 90; i++) { _a.set(Math.random() - 0.5, Math.random() - 0.2, Math.random() - 0.5).normalize().multiplyScalar(30 + Math.random() * 90); race.parts.emit(s.pos.x, s.pos.y + 1, s.pos.z, _a.x, _a.y, _a.z, i % 2 ? 0xff7a1a : 0xffe08a, 0.8 + Math.random() * 0.9); }
}

function pause(on) {
  if (!race || race.state === 'results') return;
  if (on === paused) return;
  paused = on;
  if (on) {
    Snd.suspend();
    screen(`<h2>PAUSE</h2><div class="btns"><div class="btn" id="b1">RESUME</div><div class="btn sec" id="b2">RETRY (R)</div><div class="btn sec" id="b3">QUIT (Q)</div></div>
      <div class="hint">Esc / P で再開</div>`, 'dark');
    $('b1').addEventListener('click', () => pause(false));
    $('b2').addEventListener('click', () => { paused = false; startRace(race.ci, race.mi); });
    $('b3').addEventListener('click', () => { paused = false; showCourseSelect(); });
  } else { ui.innerHTML = ''; Snd.resume(); }
}

function rankShips() {
  const list = race.ships.slice().sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1; if (b.finished) return 1;
    return b.cum - a.cum;
  });
  list.forEach((s, i) => { s.rank = i + 1; });
  return list;
}

function showResults() {
  race.state = 'results';
  const list = rankShips(), ci = race.def.id;
  const me = race.player;
  // 自己ベスト
  let newBest = false;
  if (!me.down && me.bestLap) { const old = store.get('best.' + ci, 0); if (!old || me.bestLap < old) { store.set('best.' + ci, me.bestLap); newBest = true; } }
  const place = me.rank;
  const rows = list.map((s) => `<tr class="${s === me ? 'me' : ''}"><td>${s.rank}</td><td>${s.isPlayer ? 'YOU' : s.name}</td><td>${s.mach.name}</td><td>${s.finished ? fmt(s.finishTime) : (s.down ? 'DOWN' : '---')}</td><td>${fmt(s.bestLap)}</td></tr>`).join('');
  const msg = me.down ? 'MACHINE DOWN' : place === 1 ? '1ST PLACE!' : `${place}${['TH', 'ST', 'ND', 'RD'][place] && place < 4 ? ['', 'ST', 'ND', 'RD'][place] : 'TH'} PLACE`;
  screen(`<div class="big">${msg}</div><table><tr><th>#</th><th>PILOT</th><th>MACHINE</th><th>TIME</th><th>BEST LAP</th></tr>${rows}</table>
    <div class="desc">${newBest ? 'コースレコード更新! ' : ''}ベストラップ ${fmt(me.bestLap)}</div>
    <div class="btns"><div class="btn" id="r1">RETRY (Enter)</div><div class="btn sec" id="r3">NEXT COURSE</div><div class="btn sec" id="r2">COURSE SELECT (Esc)</div></div>`, 'dark');
  $('r1').addEventListener('click', () => startRace(race.ci, race.mi));
  $('r2').addEventListener('click', () => showCourseSelect());
  $('r3').addEventListener('click', () => { selCourse = (race.ci + 1) % COURSES.length; store.set('course', selCourse); startRace(selCourse, race.mi); });
  Snd.bgmStop();
}

// ---------- 1ステップ ----------
function simStep(dt) {
  const r = race, tr = r.tr;
  r.time += dt;
  if (r.state === 'countdown' && r.time >= 0) { r.state = 'go'; say('GO!', 0.9); Snd.beep(true); }
  const racing = r.state === 'go' || r.state === 'finishing';
  const player = r.player;
  const ev = (t, s, v) => evHandler(t, s, v);
  // ラバーバンド: 先頭との差でAIの速さを少し変える
  const pc = player.cum;
  for (const s of r.ships) {
    let inp;
    if (!racing) inp = { steer: 0, accel: 0, brake: 1, boost: false, drift: false };
    else if (s.isPlayer && !r.bot) inp = playerInput();
    else {
      if (!s.isPlayer) { const d = (pc - s.cum) / (tr.N * 0.12); s.skill = (RIVALS.find((x) => x.name === s.name).skill) * (1 + Math.max(-1, Math.min(1, d)) * 0.045); }
      inp = aiInput(tr, s, r, dt);
      if (s.finished && s.isPlayer) inp = { steer: inp.steer, accel: 1, brake: 0, boost: false, drift: false };
    }
    if (s.finished && !s.isPlayer) { inp = { ...inp, boost: false }; }
    if (!racing) { s.vel.set(0, 0, 0); s.pos.addScaledVector(s.up, 0); }
    if (racing || true) stepShip(tr, s, inp, dt, ev);
    if (!racing) { s.vel.multiplyScalar(0); }
  }
  collideShips(r.ships);
  if (racing) {
    for (const s of r.ships) updateProgress(tr, s, r.time, r.laps, ev);
    if (player.finished && r.state === 'go') r.state = 'finishing';
  }
}

// ---------- カメラ ----------
function updateCamera(dt) {
  const r = race, p = r.player;
  const sr = Math.min(1.4, p.speed / p.mach.top);
  const back = 17.5 + sr * 4.5 + (p.boosting ? 3 : 0), up = 5.9 + sr * 0.7;
  const target = _a.copy(p.pos).addScaledVector(p.hd, -back).addScaledVector(p.up, up);
  const k = 1 - Math.exp(-dt * (p.grounded ? 11 : 6));
  r.camPos.lerp(target, k);
  // 近すぎ/遠すぎの補正
  _b.copy(r.camPos).sub(p.pos); const d = _b.length(); if (d > back * 1.7) r.camPos.copy(p.pos).addScaledVector(_b.normalize(), back * 1.7);
  r.camUp.lerp(p.up, 1 - Math.exp(-dt * 6)).normalize();
  camera.position.copy(r.camPos);
  if (r.shake > 0.01 || p.boosting) {
    const sh = (r.shake * 0.7 + (p.boosting ? 0.1 : 0)) * (1 + sr);
    camera.position.x += (Math.random() - 0.5) * sh; camera.position.y += (Math.random() - 0.5) * sh; camera.position.z += (Math.random() - 0.5) * sh;
  }
  r.shake *= Math.exp(-dt * 6);
  camera.up.copy(r.camUp);
  _b.copy(p.pos).addScaledVector(p.hd, 17).addScaledVector(p.up, 1.0);
  camera.lookAt(_b);
  const tf = 62 + sr * 12 + (p.boosting ? 14 : 0);
  r.fov += (tf - r.fov) * (1 - Math.exp(-dt * 5));
  const fovOut = r.fov * (camera.aspect < 1 ? 1 + (1 - camera.aspect) * 0.55 : 1);
  if (Math.abs(camera.fov - fovOut) > 0.05) { camera.fov = fovOut; camera.updateProjectionMatrix(); }
  for (const s of r.skyObjs) s.o.position.copy(camera.position).add(s.off);
}

const _m = new THREE.Matrix4(), _r = new THREE.Vector3(), _bk = new THREE.Vector3();
function syncModels(dt, time) {
  const r = race;
  for (const s of r.ships) {
    const m = s.model;
    _r.copy(s.hd).cross(s.up).normalize(); _bk.copy(s.hd).negate();
    _m.makeBasis(_r, s.up, _bk); m.quaternion.setFromRotationMatrix(_m);
    m.rotateZ(s.roll); // 傾き(カーブの内側へ)
    m.rotateY(s.slip * 0.35);
    m.position.copy(s.pos).addScaledVector(s.up, 0.15);
    m.visible = !s.down || s.downT < 0.05;
    if (s.invul > 0) m.visible = m.visible && (Math.floor(time * 14) % 2 === 0);
    const sr = Math.min(1.3, s.speed / s.mach.top);
    const fl = m.userData.flames, thr = 0.4 + sr;
    const fb = m.userData.flameBase || 1;
    for (const f of fl) { const k = fb * (1 + (s.boosting ? 0.6 : 0)); f.scale.set(k, k, (0.5 + thr * 2.2 + (s.boosting ? 4 : 0)) * (0.85 + Math.random() * 0.3)); }
    // 影
    const sh = s.shadow; sh.visible = s.grounded && !s.down;
    if (sh.visible) { sh.position.copy(s.pos).addScaledVector(s.up, -(s.h - 0.12)); sh.quaternion.setFromRotationMatrix(_m); const sc = 1 + Math.max(0, s.h - 3) * 0.04; sh.scale.set(sc, 1, sc); }
    // 排気の粒
    if (!s.down && (s.boosting || sr > 0.6) && Math.random() < (s.boosting ? 0.5 : 0.12)) {
      r.parts.emit(s.pos.x - s.hd.x * 4.4, s.pos.y - s.hd.y * 4.4 + 0.2, s.pos.z - s.hd.z * 4.4, -s.vel.x * 0.15 + (Math.random() - 0.5) * 8, (Math.random() - 0.3) * 6, -s.vel.z * 0.15 + (Math.random() - 0.5) * 8, s.boosting ? 0x7affff : 0xff9a50, 0.25 + Math.random() * 0.25);
    }
    if (s.scrape && Math.random() < 0.6) sparks(s, 2);
  }
}

// ---------- HUD ----------
function updateHud(dt) {
  const r = race, p = r.player;
  const list = rankShips();
  setText('pos', `${p.rank}<small>/${r.ships.length}</small>`);
  setText('lap', `LAP ${Math.max(1, Math.min(r.laps, p.lap + 1))}/${r.laps}`);
  const t = Math.max(0, p.finished ? p.finishTime : r.time);
  setText('time', fmt(t));
  setText('best', 'BEST ' + fmt(p.bestLap));
  setText('spd', `${Math.round(p.speed * KMH)}<small>km/h</small>`);
  const on = Math.ceil((p.energy / CFG.ENERGY) * 20), bar = $('pbar');
  if (r.hudCache.pb !== on) { r.hudCache.pb = on; [...bar.children].forEach((e, i) => e.classList.toggle('on', i < on)); bar.classList.toggle('low', on <= 5); }
  $('boostTag').classList.toggle('on', p.boosting);
  // 逆走
  const tr = r.tr, i = p.idx;
  const dotT = p.hd.x * tr.T[i * 3] + p.hd.y * tr.T[i * 3 + 1] + p.hd.z * tr.T[i * 3 + 2];
  r.wrong = (dotT < -0.35 && p.speed > 30) ? r.wrong + dt : 0;
  $('warn').classList.toggle('hidden', r.wrong < 0.8);
  // メッセージの消去
  if (r.msgT > 0) { r.msgT -= dt; if (r.msgT <= 0) $('center').style.display = 'none'; }
  // カウントダウン
  if (r.state === 'countdown') {
    const n = Math.ceil(-r.time);
    if (n !== r.lastCount && n >= 1 && n <= 3) { r.lastCount = n; say(String(n), 1); Snd.beep(false); }
  }
  // ミニマップ
  const cv = $('mini'), g = cv.getContext('2d');
  if (cv.width !== 170) { cv.width = 170; cv.height = 170; }
  g.clearRect(0, 0, 170, 170);
  g.lineJoin = 'round'; g.lineWidth = 5; g.strokeStyle = 'rgba(0,0,0,.55)'; g.beginPath(); r.mm.pts.forEach((q, k) => (k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.stroke();
  g.lineWidth = 2.4; g.strokeStyle = '#' + r.def.pal.neon.toString(16).padStart(6, '0'); g.stroke();
  for (const s of r.ships) { const [x, y] = r.mm.map(s.pos.x, s.pos.z); g.fillStyle = s.isPlayer ? '#ffe14a' : '#ff5ad2'; g.beginPath(); g.arc(x, y, s.isPlayer ? 4.6 : 3, 0, 7); g.fill(); }
  const [sx, sy] = r.mm.map(tr.P[0], tr.P[2]); g.fillStyle = '#fff'; g.fillRect(sx - 4, sy - 1, 8, 2);
}

function raceUpdate(dt) {
  race.acc += dt; let n = 0;
  while (race.acc >= DT && n < 8) { simStep(DT); race.acc -= DT; n++; }
  if (race.acc > DT * 8) race.acc = 0;
  updateCamera(dt); syncModels(dt, race.time);
  race.parts.update(dt);
  const p = race.player, sr = Math.min(1.4, p.speed / p.mach.top);
  race.lines.update(dt, sr, p.boosting);
  Snd.engineUpdate(sr, true, p.boosting, p.down ? 0 : 1);
  updateHud(dt);
  if (race.resultsT > 0 && (race.state === 'finishing' || race.player.down)) { race.resultsT -= dt; if (race.resultsT <= 0) showResults(); }
}

// ---------- メインループ ----------
let last = performance.now(), menuT0 = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if (window.__freeze) return; // テスト用: 画面を固定して撮影する
  let dt = (now - last) / 1000; last = now; if (dt > 0.1) dt = 0.1;
  pollPad();
  if (mode === 'race' && race) {
    if (!paused) raceUpdate(dt);
    renderer.render(race.scene, camera);
  } else if (menuScene) {
    menuT += dt;
    if (menuShip) { menuShip.rotation.y = menuT * 0.7; menuShip.position.y = Math.sin(menuT * 1.6) * 0.25; }
    const asp = innerWidth / innerHeight; menuCam.aspect = asp; menuCam.updateProjectionMatrix();
    const dist = asp < 1 ? 34 : 24; menuCam.position.set(Math.sin(menuT * 0.25) * 4, 7.5, dist); menuCam.lookAt(0, mode === 'title' ? -6.5 : (asp < 1 ? -5.5 : 0.2), 0);
    renderer.render(menuScene, menuCam);
  }
}

// ---------- 起動 ----------
$('loading').classList.add('hidden');
window.__g = { Snd, showMachineSelect, showCourseSelect, selectMachine(i) { selMachine = i; useMenuScene(i); }, selectCourse(i) { selCourse = i; }, get menu() { return { scene: menuScene, cam: menuCam, ship: menuShip, useMenuScene }; }, advance(sec, fps = 60) { const n = Math.round(sec * fps); for (let i = 0; i < n; i++) raceUpdate(1 / fps); renderer.render(race.scene, camera); }, get race() { return race; }, get mode() { return mode; }, startRace, showTitle, store, COURSES, MACHINES, trackCache, camera, renderer, keys, touch, pause };
const qc = q.get('c'), qm = q.get('m');
if (qc != null) { selCourse = +qc; selMachine = +(qm || 0); startRace(selCourse, selMachine); requestAnimationFrame(frame); }
else { showTitle(); requestAnimationFrame(frame); }
