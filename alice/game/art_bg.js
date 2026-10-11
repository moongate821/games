/*
 * アリスの挿絵 ― 背景(bgs)と、エンジンに渡す art オブジェクト。640×480 の紙面に描く。
 */
(function () {
  "use strict";
  const P = window.ART_PROPS;
  const INK = "#4b3326";
  const R = (x, y, w, h, f, x2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${x2 || ""}/>`;
  const LG = (id, c1, c2, vert) => `<linearGradient id="${id}" x1="0" y1="0" x2="${vert === false ? 1 : 0}" y2="${vert === false ? 0 : 1}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;
  const RG = (id, c1, c2) => `<radialGradient id="${id}" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient>`;
  const cloud = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#fffdf6" opacity=".92"><ellipse cx="0" cy="0" rx="40" ry="14"/><ellipse cx="-22" cy="-10" rx="22" ry="14"/><ellipse cx="14" cy="-14" rx="26" ry="16"/></g>`;
  const tree = (x, y, s, leaf) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-10,0C-8,-40 -12,-80 -6,-110H8C14,-80 10,-40 12,0Z" fill="#8a6a4a" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="0" cy="-130" rx="62" ry="52" fill="${leaf || "#6aa85e"}" stroke="${INK}" stroke-width="2.4"/><ellipse cx="-30" cy="-116" rx="28" ry="24" fill="#7fbf70" opacity=".7"/><ellipse cx="30" cy="-146" rx="26" ry="22" fill="#5a9a50" opacity=".6"/></g>`;
  const stars = (n, seed, c) => { let s = ""; let v = seed; for (let i = 0; i < n; i++) { v = (v * 9301 + 49297) % 233280; const x = (v / 233280) * 640; v = (v * 9301 + 49297) % 233280; const y = (v / 233280) * 330; s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1 + (i % 3) * .7).toFixed(1)}" fill="${c || "#fff6c8"}"/>`; } return s; };
  const grassTufts = (y0) => { let s = ""; for (let i = 0; i < 14; i++) { const x = 20 + i * 46 + (i % 3) * 9, y = y0 + (i * 37) % 120; s += `<path d="M${x},${y}c-2,-10 -2,-16 -5,-22M${x + 6},${y}c0,-9 2,-15 5,-20" stroke="#5f9a52" stroke-width="2.4" fill="none" stroke-linecap="round"/>`; } return s; };

  // 遠近の廊下(左右の壁に扉がならぶ)
  function corridor(wallL, wallR, back, floor, ceil, doorsL, doorsR) {
    const door = (side, u0, u1, col) => {
      const x = (u) => (side === "L" ? 220 * u : 640 - 220 * u);
      const yT = (u) => 120 * u, yB = (u) => 480 - 120 * u;
      const top = (u) => yT(u) + 0.22 * (yB(u) - yT(u)), bot = (u) => yB(u) - 0.02 * (yB(u) - yT(u));
      return `<path d="M${x(u0)},${top(u0)} L${x(u1)},${top(u1)} L${x(u1)},${bot(u1)} L${x(u0)},${bot(u0)}Z" fill="${col}" stroke="${INK}" stroke-width="2.2"/>`;
    };
    return `<path d="M0,0L220,120L220,360L0,480Z" fill="${wallL}"/><path d="M640,0L420,120L420,360L640,480Z" fill="${wallR}"/>` +
      `<rect x="220" y="120" width="200" height="240" fill="${back}"/><path d="M0,480L220,360H420L640,480Z" fill="${floor}"/><path d="M0,0L220,120H420L640,0Z" fill="${ceil}"/>` +
      doorsL.map((d) => door("L", d[0], d[1], d[2])).join("") + doorsR.map((d) => door("R", d[0], d[1], d[2])).join("") +
      `<path d="M0,0L220,120M640,0L420,120M0,480L220,360M640,480L420,360M220,120H420V360H220Z" stroke="${INK}" stroke-width="2.4" fill="none"/>`;
  }

  const BG = {
    river: () => `<defs>${LG("g-river", "#bfe5ef", "#fdf1d2")}</defs>${R(0, 0, 640, 320, "url(#g-river)")}<circle cx="540" cy="74" r="36" fill="#fff0a8" opacity=".95"/>${cloud(120, 70, 1)}${cloud(330, 40, .8)}${cloud(470, 120, .7)}
<path fill="#a9d1a0" d="M0,250C100,206 200,236 300,228C420,216 520,238 640,214V320H0Z"/><path fill="#8fc9dc" d="M0,282C120,270 240,298 360,286C480,274 560,294 640,282V344H0Z"/>
<path d="M30,300c20,-8 40,8 60,0M200,314c22,-8 40,8 62,0M420,300c20,-8 40,8 62,0" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/>
<path fill="#8cc37f" d="M0,330C160,306 320,338 640,312V480H0Z"/><path fill="#79b46e" d="M0,400C200,384 400,414 640,392V480H0Z"/>${grassTufts(350)}${tree(70, 380, 1.15)}
<g ${""}><circle cx="300" cy="420" r="4" fill="#fffdf6"/><circle cx="360" cy="440" r="4" fill="#fffdf6"/><circle cx="540" cy="410" r="4" fill="#f08a96"/><circle cx="470" cy="452" r="4" fill="#fffdf6"/></g>`,

    meadow: () => `<defs>${LG("g-mead", "#bfe5ef", "#fff0c8")}</defs>${R(0, 0, 640, 330, "url(#g-mead)")}<circle cx="320" cy="80" r="40" fill="#fff0a8"/>${cloud(110, 80, 1)}${cloud(500, 60, .9)}
<path fill="#a9d1a0" d="M0,260C120,220 260,246 380,236C500,226 580,244 640,230V330H0Z"/><path fill="#8cc37f" d="M0,320C200,296 400,330 640,304V480H0Z"/>${grassTufts(350)}`,

    golden: () => `<defs>${LG("g-gold", "#f8c978", "#fde9b4")}</defs>${R(0, 0, 640, 330, "url(#g-gold)")}<circle cx="320" cy="210" r="70" fill="#ffe6a0" opacity=".9"/>${cloud(110, 90, 1)}${cloud(520, 120, .8)}
<path fill="#b9c98a" d="M0,260C120,226 260,250 380,240C500,232 580,246 640,234V330H0Z"/><path fill="#a2b872" d="M0,322C200,300 400,332 640,308V480H0Z"/>${grassTufts(350)}`,

    fall: () => `<defs>${LG("g-fall", "#2d1f3a", "#6b3f55")}${RG("g-fall2", "#f9e7a8", "rgba(249,231,168,0)")}</defs>${R(0, 0, 640, 480, "url(#g-fall)")}<ellipse cx="320" cy="20" rx="130" ry="90" fill="url(#g-fall2)" opacity=".55"/>
${[0, 1, 2, 3].map((i) => { const y = 40 + i * 112; return `<g><rect x="0" y="${y}" width="150" height="14" fill="#8a5a3a" stroke="${INK}" stroke-width="2"/><rect x="490" y="${y}" width="150" height="14" fill="#8a5a3a" stroke="${INK}" stroke-width="2"/>
<rect x="14" y="${y - 38}" width="22" height="38" rx="4" fill="#e89a3c" stroke="${INK}" stroke-width="2"/><rect x="48" y="${y - 30}" width="26" height="30" rx="4" fill="#9bcf8a" stroke="${INK}" stroke-width="2"/><rect x="86" y="${y - 44}" width="30" height="44" fill="#c6a9e8" stroke="${INK}" stroke-width="2"/>
<rect x="520" y="${y - 40}" width="26" height="40" fill="#f08a96" stroke="${INK}" stroke-width="2"/><rect x="558" y="${y - 28}" width="30" height="28" rx="4" fill="#fffdf6" stroke="${INK}" stroke-width="2"/><rect x="600" y="${y - 44}" width="26" height="44" rx="4" fill="#7fb6d8" stroke="${INK}" stroke-width="2"/></g>`; }).join("")}
<path d="M150,0V480M490,0V480" stroke="rgba(0,0,0,.25)" stroke-width="3"/><g fill="#f9e7a8" opacity=".5"><circle cx="220" cy="120" r="3"/><circle cx="420" cy="220" r="2.4"/><circle cx="300" cy="330" r="3"/><circle cx="380" cy="60" r="2.4"/></g>`,

    hole: () => `<defs>${RG("g-hole", "#f9e7a8", "#2d1f3a")}</defs>${R(0, 0, 640, 480, "#2d1f3a")}${[300, 250, 205, 165, 130, 100, 74, 52].map((r, i) => `<ellipse cx="320" cy="240" rx="${r * 1.5}" ry="${r}" fill="none" stroke="${i % 2 ? "#6b3f55" : "#a26a6a"}" stroke-width="${10 - i}"/>`).join("")}<ellipse cx="320" cy="240" rx="40" ry="26" fill="#f9e7a8" opacity=".85"/>`,

    hall: () => `<defs>${LG("g-hall", "#8a5e86", "#5a3a58")}${LG("g-hallf", "#e0c08e", "#c49a68")}</defs>${R(0, 0, 640, 320, "url(#g-hall)")}${R(0, 250, 640, 70, "#7a4f76")}
<path d="M0,250H640" stroke="${INK}" stroke-width="2.4"/>${[40, 140, 240, 340, 440, 540].map((x, i) => `<path d="M${x},320V${220 - (i % 3) * 26}C${x},${190 - (i % 3) * 26} ${x + 52},${190 - (i % 3) * 26} ${x + 52},${220 - (i % 3) * 26}V320Z" fill="${["#d9564b", "#e8a23c", "#6fae6a", "#5f8fd0", "#b79bd6", "#6fb7b0"][i]}" stroke="${INK}" stroke-width="2.2"/><circle cx="${x + 40}" cy="${290}" r="3.4" fill="#f0c24d"/>`).join("")}
<path d="M0,320H640V480H0Z" fill="url(#g-hallf)"/><path d="M0,320H640M0,372H640M0,430H640M80,320L-60,480M240,320L200,480M400,320L440,480M560,320L700,480" stroke="#a97d4a" stroke-width="2" fill="none"/>
<path d="M320,0V40" stroke="${INK}" stroke-width="3"/><path d="M300,40H340L350,70H290Z" fill="#f0c24d" stroke="${INK}" stroke-width="2.4"/><circle cx="320" cy="82" r="6" fill="#fff6a8"/>`,

    hallwall: () => `<defs>${LG("g-hw", "#8a5e86", "#6a4668")}${LG("g-hwf", "#d8b886", "#bf9560")}</defs>${R(0, 0, 640, 330, "url(#g-hw)")}${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 56 + 20},0V330" stroke="#a07aa0" stroke-width="12" opacity=".35"/>`).join("")}
${R(0, 250, 640, 84, "#7a4f76")}<path d="M0,250H640M0,334H640" stroke="${INK}" stroke-width="2.4"/><path d="M0,334H640V480H0Z" fill="url(#g-hwf)"/><path d="M0,372H640M0,424H640M0,334V480" stroke="#a97d4a" stroke-width="2" fill="none"/>`,

    corridor: () => `<defs>${LG("g-cor", "#8a6a8a", "#5a3a58")}</defs>` + corridor("#6e4d6c", "#6e4d6c", "#9a7a9a", "#c9a574", "#4f3350",
      [[0.12, 0.3, "#d9564b"], [0.4, 0.55, "#5f8fd0"], [0.66, 0.78, "#e8a23c"], [0.84, 0.92, "#6fae6a"]],
      [[0.12, 0.3, "#6fae6a"], [0.4, 0.55, "#d9564b"], [0.66, 0.78, "#b79bd6"], [0.84, 0.92, "#5f8fd0"]]),

    room: () => `<defs>${LG("g-room", "#f0c88a", "#e0a868")}</defs>${R(0, 0, 640, 480, "url(#g-room)")}${R(0, 0, 640, 90, "#b97a45")}<path d="M0,90H640" stroke="${INK}" stroke-width="3"/>${[100, 220, 340, 460, 580].map((x) => `<path d="M${x},0V90" stroke="#8a5a2f" stroke-width="10"/>`).join("")}
<rect x="450" y="150" width="130" height="110" fill="#bfe5ef" stroke="${INK}" stroke-width="4"/><path d="M515,150V260M450,205H580" stroke="${INK}" stroke-width="3"/>${R(0, 400, 640, 80, "#a97d4a")}<path d="M0,400H640M0,440H640" stroke="${INK}" stroke-width="2"/>`,

    flood: () => BG.hallwall() + `<path d="M0,330C80,320 160,340 240,330C320,320 400,340 480,330C560,320 600,336 640,330V480H0Z" fill="#7fbcd8" opacity=".78"/><path d="M0,380c40,-8 70,8 110,0M200,420c40,-8 70,8 110,0M400,390c40,-8 70,8 110,0M520,440c40,-8 70,8 110,0" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>`,

    pool: () => `<defs>${LG("g-pool", "#bfe5ef", "#fdf1d2")}${LG("g-poolw", "#8fc9dc", "#4f8fb0")}</defs>${R(0, 0, 640, 200, "url(#g-pool)")}${cloud(120, 60, .9)}${cloud(470, 90, .8)}<path fill="#a9d1a0" d="M0,170C120,140 260,166 380,156C500,148 580,164 640,150V210H0Z"/>${R(0, 196, 640, 284, "url(#g-poolw)")}
<path d="M20,240c30,-10 50,10 80,0M180,300c30,-10 50,10 80,0M360,250c30,-10 50,10 80,0M500,330c30,-10 50,10 80,0M60,400c30,-10 50,10 80,0M300,420c30,-10 50,10 80,0" stroke="#fff" stroke-width="3.4" fill="none" opacity=".7" stroke-linecap="round"/>`,

    shore: () => `<defs>${LG("g-shore", "#bfe5ef", "#fdf1d2")}</defs>${R(0, 0, 640, 210, "url(#g-shore)")}${cloud(140, 70, 1)}${cloud(480, 50, .8)}${R(0, 196, 640, 50, "#8fc9dc")}<path d="M0,246C160,232 360,252 640,238V480H0Z" fill="#ecd9a0"/><path d="M0,330C200,316 400,340 640,322V480H0Z" fill="#e3cd90"/>
<ellipse cx="320" cy="400" rx="260" ry="52" fill="none" stroke="#c9b27a" stroke-width="4" stroke-dasharray="14 10"/>${grassTufts(300)}`,

    forest: () => `<defs>${LG("g-for", "#cfe9c8", "#f3f0cc")}</defs>${R(0, 0, 640, 480, "url(#g-for)")}<path d="M0,230C140,200 260,236 400,222C500,212 580,230 640,218V480H0Z" fill="#9ccc86"/>
<path d="M250,480C290,380 300,300 316,250H334C340,300 360,380 400,480Z" fill="#e7d4a0" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>${tree(70, 330, 1.3, "#5a9a50")}${tree(580, 340, 1.4, "#4f8f4a")}${tree(200, 258, .7, "#6aa85e")}${tree(470, 262, .75, "#5a9a50")}
<path fill="#79b46e" d="M0,420C200,404 400,436 640,414V480H0Z"/>${grassTufts(430)}<g fill="#fffdf6"><circle cx="150" cy="450" r="4"/><circle cx="500" cy="440" r="4"/></g><g fill="#f08a96"><circle cx="400" cy="460" r="4"/><circle cx="90" cy="440" r="4"/></g>`,

    cottage: () => `<defs>${LG("g-cot", "#bfe5ef", "#fdf1d2")}</defs>${R(0, 0, 640, 300, "url(#g-cot)")}${cloud(110, 70, 1)}${cloud(480, 60, .8)}<path fill="#a9d1a0" d="M0,250C120,206 260,236 380,226C500,216 580,238 640,222V320H0Z"/>${tree(60, 330, 1.1)}${tree(600, 330, 1.2, "#5a9a50")}<path fill="#8cc37f" d="M0,320C200,298 400,330 640,306V480H0Z"/><path fill="#79b46e" d="M0,410C200,394 400,424 640,404V480H0Z"/>${grassTufts(350)}`,

    glade: () => `<defs>${LG("g-gl", "#d7efc9", "#f7f1c8")}</defs>${R(0, 0, 640, 480, "url(#g-gl)")}${tree(40, 260, .9, "#5a9a50")}${tree(600, 270, .95, "#4f8f4a")}<path fill="#9ccc86" d="M0,260C140,236 300,262 640,240V480H0Z"/>
${Array.from({ length: 26 }, (_, i) => { const x = 10 + i * 25; const y = 330 + (i * 53) % 140; const hh = 40 + (i * 29) % 50; return `<path d="M${x},${y}c-4,-${hh / 2} -2,-${hh * .8} 2,-${hh}" stroke="#5f9a52" stroke-width="3.2" fill="none" stroke-linecap="round"/>`; }).join("")}
<g ${""}><circle cx="120" cy="420" r="6" fill="#f08a96"/><circle cx="520" cy="440" r="6" fill="#b79bd6"/><circle cx="330" cy="460" r="6" fill="#fff0a8"/></g>`,

    treetop: () => `<defs>${LG("g-tt", "#b8d8c0", "#e0d8b0")}</defs>${R(0, 0, 640, 480, "url(#g-tt)")}${tree(80, 300, 1.2, "#4f8f4a")}${tree(560, 310, 1.3, "#5a9a50")}<path fill="#8cc37f" d="M0,340C200,316 400,350 640,326V480H0Z"/>
<path d="M-10,200C140,170 280,196 420,170C520,152 600,170 660,150V196C600,214 520,196 420,214C280,240 140,214 -10,244Z" fill="#9a7a5a" stroke="${INK}" stroke-width="3"/><path d="M60,196c20,-6 30,4 50,-2M240,200c20,-6 30,4 50,-2" stroke="#7a5a3a" stroke-width="2.4" fill="none"/>`,

    kitchen: () => `<defs>${LG("g-kit", "#a89a88", "#7a6e62")}</defs>${R(0, 0, 640, 340, "url(#g-kit)")}${Array.from({ length: 8 }, (_, r) => Array.from({ length: 9 }, (_, c) => `<rect x="${c * 76 - (r % 2) * 38}" y="${r * 42}" width="74" height="40" fill="none" stroke="#6a5e52" stroke-width="2"/>`).join("")).join("")}
<path d="M200,340V150C200,110 440,110 440,150V340Z" fill="#3a2e2e" stroke="${INK}" stroke-width="3"/><path d="M240,340c0,-40 -20,-70 20,-90c10,30 30,20 36,90Z" fill="#f08a2a"/><path d="M270,340c-4,-24 6,-40 18,-52c6,22 10,30 6,52Z" fill="#ffd25e"/>
<ellipse cx="330" cy="318" rx="68" ry="20" fill="#2b2b33" stroke="${INK}" stroke-width="2.4"/><path d="M262,300C262,268 398,268 398,300Z" fill="#4a4a56" stroke="${INK}" stroke-width="2.4"/><path d="M300,262c-8,-14 10,-18 2,-32M340,262c-8,-14 10,-18 2,-32" stroke="#e8e8f0" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>
<path d="M0,340H640V480H0Z" fill="#8a6a50"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${i * 120},340L${i * 120 - 80},480" stroke="#6a5038" stroke-width="2"/>`).join("")}<path d="M0,400H640" stroke="#6a5038" stroke-width="2"/>`,

    tea: () => `<defs>${LG("g-tea", "#ffe7b0", "#fff6d8")}</defs>${R(0, 0, 640, 480, "url(#g-tea)")}${tree(560, 300, 1.4, "#6aa85e")}${tree(60, 290, 1.2, "#7fbf70")}
<path d="M40,60C160,100 260,60 360,96C460,70 540,100 620,64" stroke="${INK}" stroke-width="2.4" fill="none"/>${[80, 170, 260, 350, 440, 530].map((x, i) => `<path d="M${x},${78 + (i % 2) * 6}l16,0l-8,22z" fill="${["#d9564b", "#e8a23c", "#6fae6a", "#5f8fd0", "#b79bd6", "#f08a96"][i]}" stroke="${INK}" stroke-width="1.8"/>`).join("")}
<path fill="#a9d1a0" d="M0,250C120,226 260,250 380,242C500,236 580,246 640,238V300H0Z"/><path fill="#8cc37f" d="M0,300C200,284 400,312 640,292V480H0Z"/>${grassTufts(380)}`,

    garden: () => `<defs>${LG("g-gar", "#fbd8d0", "#fff2d8")}</defs>${R(0, 0, 640, 300, "url(#g-gar)")}${cloud(120, 60, .9)}${cloud(540, 80, .8)}
<g stroke="${INK}" stroke-width="2.2"><path d="M250,250V150L270,130L290,150V250Z" fill="#f3d0d0"/><path d="M300,250V120L320,96L340,120V250Z" fill="#f3d0d0"/><path d="M350,250V150L370,130L390,150V250Z" fill="#f3d0d0"/><path d="M290,250V180H350V250Z" fill="#e8b8b8"/></g>
<path d="M270,130V104M320,96V68M370,130V104" stroke="${INK}" stroke-width="2.4"/><path d="M270,104l16,6l-16,6zM320,68l18,7l-18,7zM370,104l16,6l-16,6z" fill="#d9433f" stroke="${INK}" stroke-width="1.6"/>
<path fill="#9ccc86" d="M0,250C120,232 260,252 380,246C500,240 580,250 640,244V320H0Z"/><path fill="#8cc37f" d="M0,310C200,292 400,322 640,300V480H0Z"/><path d="M290,480C310,400 320,330 322,290H330C334,330 350,400 380,480Z" fill="#f0e2b4" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>${grassTufts(380)}`,

    maze: () => `<defs>${LG("g-mz", "#cfe9c8", "#f3f0cc")}</defs>` + corridor("#4f9a56", "#4f9a56", "#6bb86a", "#c8d89a", "#bfe5ef",
      [[0.1, 0.36, "#5aa860"], [0.44, 0.7, "#4f9a56"]], [[0.18, 0.5, "#5aa860"], [0.58, 0.9, "#4f9a56"]]) + `<g fill="#7fc87a" opacity=".6"><circle cx="60" cy="200" r="22"/><circle cx="560" cy="260" r="26"/><circle cx="120" cy="320" r="18"/><circle cx="520" cy="150" r="20"/></g>`,

    court: () => `<defs>${LG("g-court", "#7a4a5a", "#4a2a3a")}</defs>${R(0, 0, 640, 330, "url(#g-court)")}
<path d="M0,0H110L70,330H0Z" fill="#c9433f" stroke="${INK}" stroke-width="2.4"/><path d="M640,0H530L570,330H640Z" fill="#c9433f" stroke="${INK}" stroke-width="2.4"/>${[20, 56, 92].map((x) => `<path d="M${x},0L${x - 10},330" stroke="#a8322f" stroke-width="4"/>`).join("")}${[550, 586, 618].map((x) => `<path d="M${x},0L${x + 10},330" stroke="#a8322f" stroke-width="4"/>`).join("")}
<rect x="200" y="110" width="240" height="140" fill="#d9a56c" stroke="${INK}" stroke-width="3"/><path d="M320,110V250M200,180H440" stroke="#b97a45" stroke-width="3"/><path d="M280,140c-10,-12 6,-20 0,-30" stroke="none" fill="none"/>
<path d="M0,330H640V480H0Z" fill="#efe1c0"/>${Array.from({ length: 8 }, (_, r) => Array.from({ length: 12 }, (_, c) => ((r + c) % 2 ? `<rect x="${c * 54 + r * 0}" y="${330 + r * 19}" width="54" height="19" fill="#c9433f" opacity=".35"/>` : "")).join("")).join("")}<path d="M120,330H520L560,350H80Z" fill="#c9a574" stroke="${INK}" stroke-width="2.4"/>`,

    void: () => `<defs>${LG("g-void", "#f7efd8", "#e7dab6")}</defs>${R(0, 0, 640, 480, "url(#g-void)")}${Array.from({ length: 17 }, (_, i) => `<path d="M${50 + (i % 2) * 14},${40 + i * 25}H${590 - (i % 3) * 30}" stroke="#cdbb92" stroke-width="2" stroke-dasharray="${6 + (i % 4) * 8} 5"/>`).join("")}
<g fill="#b9a374" opacity=".7">${Array.from({ length: 20 }, (_, i) => `<circle cx="${(i * 97) % 640}" cy="${(i * 61) % 480}" r="${2 + (i % 3)}"/>`).join("")}</g><path d="M320,0V480" stroke="#b9a374" stroke-width="3" opacity=".6"/>`,

    dusk: () => `<defs>${LG("g-dusk", "#3a2f5a", "#8a5a7a")}</defs>${R(0, 0, 640, 480, "url(#g-dusk)")}${stars(40, 7)}<circle cx="520" cy="90" r="30" fill="#fff0c0" opacity=".9"/><path fill="#4a4068" d="M0,300C120,260 260,290 380,280C500,270 580,290 640,276V480H0Z"/><path fill="#3a3258" d="M0,380C200,360 400,392 640,372V480H0Z"/>`,

    sky: () => `<defs>${LG("g-sky", "#8fd0f0", "#e6f6ff")}</defs>${R(0, 0, 640, 480, "url(#g-sky)")}${cloud(100, 90, 1.3)}${cloud(500, 150, 1.2)}${cloud(300, 380, 1.5)}${cloud(80, 400, 1)}${cloud(560, 420, 1.1)}<circle cx="560" cy="60" r="34" fill="#fff0a8"/>`,

    sea: () => `<defs>${LG("g-sea", "#bfe5ef", "#fdf1d2")}${LG("g-seaw", "#7fbcd8", "#3f7fa8")}</defs>${R(0, 0, 640, 250, "url(#g-sea)")}${cloud(140, 80, 1)}${cloud(480, 60, .9)}<circle cx="320" cy="200" r="30" fill="#fff0a8" opacity=".9"/>${R(0, 240, 640, 240, "url(#g-seaw)")}
<path d="M30,300c30,-10 50,10 80,0M200,360c30,-10 50,10 80,0M380,310c30,-10 50,10 80,0M500,400c30,-10 50,10 80,0M60,440c30,-10 50,10 80,0" stroke="#fff" stroke-width="3.4" fill="none" opacity=".7" stroke-linecap="round"/>`,

    bookpage: () => `<defs>${LG("g-bp", "#efe0bc", "#d9c590", false)}</defs>${R(0, 0, 640, 480, "#8a5a3a")}<path d="M24,40C150,20 270,36 320,70C370,36 490,20 616,40V440C490,420 370,436 320,470C270,436 150,420 24,440Z" fill="url(#g-bp)" stroke="${INK}" stroke-width="3"/><path d="M320,70V470" stroke="#a8905c" stroke-width="3"/>
${Array.from({ length: 9 }, (_, i) => `<path d="M${60 + (i % 2) * 6},${110 + i * 32}H${290 - (i % 3) * 20}M${350 + (i % 2) * 6},${110 + i * 32}H${580 - (i % 3) * 18}" stroke="#c9b48a" stroke-width="2" stroke-dasharray="${8 + (i % 3) * 6} 4"/>`).join("")}`,

    cards: () => `${R(0, 0, 640, 480, "#fffdf6")}${Array.from({ length: 7 }, (_, r) => Array.from({ length: 9 }, (_, c) => `<path d="M${c * 80 + (r % 2) * 40},${r * 80 + 40}l24,-24l24,24l-24,24z" fill="${(r + c) % 2 ? "#c9433f" : "#2d2a38"}" opacity=".16"/>`).join("")).join("")}<rect x="14" y="14" width="612" height="452" rx="22" fill="none" stroke="${INK}" stroke-width="5"/>`,

    tiny: () => `<defs>${LG("g-tiny", "#e4f3c8", "#f7f1c8")}</defs>${R(0, 0, 640, 480, "url(#g-tiny)")}${Array.from({ length: 16 }, (_, i) => `<path d="M${i * 44 - 6},480C${i * 44 + 10},300 ${i * 44 - 16},170 ${i * 44 + 14},${40 + (i * 31) % 90}C${i * 44 + 22},180 ${i * 44 + 34},320 ${i * 44 + 34},480Z" fill="${i % 2 ? "#6aa85e" : "#5a9a50"}" stroke="${INK}" stroke-width="2.4"/>`).join("")}<circle cx="560" cy="60" r="30" fill="#fff0a8" opacity=".6"/>`,

    stars: () => BG.dusk()
  };
  BG.upstairs = BG.room;

  // 表紙の絵
  function cover() {
    return `<svg viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="表紙の絵"><g filter="url(#sb-wc)">${BG.river()}<g transform="translate(470 392) scale(.9)">${P.alice}</g><g transform="translate(180 360) scale(.8)">${P.rabbit}</g><g transform="translate(330 420) scale(.9)">${P.daisies}</g></g></svg>`;
  }

  window.ALICE_ART = {
    w: 640, h: 480,
    bg(name) { const f = BG[name]; if (!f) { console.warn("背景がありません:", name); return BG.river(); } return f(); },
    prop(name) { const p = P[name]; if (!p) { console.warn("小道具がありません:", name); return `<circle r="18" fill="#eee" stroke="#4b3326"/><text y="6" text-anchor="middle" font-size="18">?</text>`; } return p; },
    cover, props: P, bgs: BG
  };
})();
