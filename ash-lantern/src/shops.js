'use strict';
/* 店と売買。物語上の大切な道具は売れず、装備中の品は所持数に含まれない。 */
const SHOP_ROOMS = {
  SHOP_ITEM: { name: '灯守村・旅の道具屋', type: 'item', to: 'V', x: 30, y: 21, keeper: '道具屋の店主', img: 'npc_innkeeper' },
  SHOP_WEAPON: { name: '灯守村・武器工房', type: 'w', to: 'V', x: 13, y: 21, keeper: '武器職人', img: 'npc_blacksmith' },
  SHOP_ARMOR: { name: '川霧の町・防具と装飾の店', type: 'a', to: 'K', x: 17, y: 6, keeper: '防具屋の店主', img: 'npc_carpenter' }
};
Object.assign(ITEMS, { rare_elixir: { name: '星灯の秘薬', desc: '星の光を封じた希少な薬。HPを180回復。', hp: 180 }, dg_potion: { name:'濃縮回復薬', desc:'濃く調合した薬。HPを100回復する。', hp:100 }, dg_ether: { name:'高級魔力薬', desc:'澄んだ青い薬。MPを30回復する。', mp:30 } });
Object.assign(GEAR, {
  dg_thief_dagger: {name:'盗賊の短剣',slot:'w',atk:3,spd:1,desc:'軽さを重視した短剣。攻撃+3、素早さ+1。'},
  dg_steel_sword: {name:'鋼鉄の剣',slot:'w',atk:12,desc:'丈夫な鋼の旅剣。攻撃+12。'},
  dg_leather_armor: {name:'革の胸当て',slot:'a',def:5,desc:'動きやすい革の胸当て。防御+5。'},
  dg_iron_armor: {name:'鉄の鎧',slot:'a',def:10,desc:'丁寧に鍛えられた鎧。防御+10。'},
  rare_dawn_blade: { name: '暁灯の剣', slot: 'w', atk: 16, desc: '旅人の帰りを願い鍛えた希少な剣。' },
  rare_lantern_coat: { name: '灯守の外套', slot: 'a', def: 12, desc: 'かすかな灯りを織り込んだ希少な外套。' },
  rare_promise_charm: { name: '約束の護符', slot: 'c', spd: 5, def: 2, desc: '離れた人を思う気持ちを込めた護符。' }
});
// 進行フラグは到達後も残る。希少品は後半まで販売しない。
const SHOP_STOCK = {
  item: [ ['potion',25], ['bread',15], ['ether',40], ['revival_tonic',90], ['scroll_heal',65], ['weakening_powder',100,'c2_start'], ['armorbreak_powder',125,'c3_start'], ['scroll_fire',80,'c2_start'], ['scroll_gale',150,'c5_start'], ['caravan_ration',45,'c2_start'], ['star_ether',120,'c8_start'], ['rare_elixir',300,'c12_start',true], ['scroll_cataclysm',900,'c12_start',true], ['dg_potion',130,'c5_start'], ['dg_ether',165,'c8_start'] ],
  w: [ ['iron_sword',110], ['herb_staff',95], ['salt_knife',150,'c2_start'], ['moon_staff',300,'c8_start'], ['rare_dawn_blade',680,'c12_start',true], ['dg_thief_dagger',130,'c2_start'], ['dg_steel_sword',420,'c8_start'] ],
  a: [ ['work_coat',80], ['leather_vest',110], ['bell_charm',140], ['caravan_coat',150,'c2_start'], ['sand_goggles',260,'c8_start'], ['rare_lantern_coat',600,'c12_start',true], ['rare_promise_charm',540,'c12_start',true], ['dg_leather_armor',190,'c2_start'], ['dg_iron_armor',400,'c8_start'] ]
};
const SHOP_ICONS = { scroll_fire:'dg_icon_3506', scroll_heal:'dg_icon_3512', scroll_gale:'dg_icon_3522', revival_tonic:'shop_elixir', dg_potion:'dg_icon_3006', dg_ether:'dg_icon_3012', dg_thief_dagger:'dg_icon_1003', dg_steel_sword:'dg_icon_1052', dg_leather_armor:'dg_icon_1310', dg_iron_armor:'dg_icon_1311', potion:'shop_potion', bread:'shop_bread', ether:'shop_ether', caravan_ration:'shop_bread', star_ether:'shop_ether', rare_elixir:'shop_elixir', iron_sword:'shop_sword', herb_staff:'shop_staff', salt_knife:'shop_knife', moon_staff:'shop_staff', rare_dawn_blade:'shop_sword', work_coat:'shop_armor', leather_vest:'shop_armor', caravan_coat:'shop_coat', rare_lantern_coat:'shop_coat', bell_charm:'shop_charm', sand_goggles:'shop_charm', rare_promise_charm:'shop_charm' };
Object.assign(SHOP_ICONS, { weakening_powder:'shop_potion', armorbreak_powder:'shop_potion', scroll_cataclysm:'dg_icon_3522' }); // 既存の仮アイコン
function shopInfo(id) { return Object.prototype.hasOwnProperty.call(ITEMS,id) ? ITEMS[id] : Object.prototype.hasOwnProperty.call(GEAR,id) ? GEAR[id] : null; }
function shopIcon(id) { return SHOP_ICONS[id] || (GEAR[id] ? (GEAR[id].slot === 'w' ? 'shop_sword' : GEAR[id].slot === 'a' ? 'shop_armor' : 'shop_charm') : 'shop_potion'); }
function shopPrice(id) {
  for (const rows of Object.values(SHOP_STOCK)) { const r = rows.find(x => x[0] === id); if (r) return r[1]; }
  const d = shopInfo(id); if (!d) return 0;
  return Math.max(10, Math.round(((d.hp || 0) + (d.mp || 0) * 3 + (d.atk || 0) * 20 + (d.def || 0) * 20 + (d.spd || 0) * 20) / 5) * 5);
}
function shopUnlocked(row) { return !row[2] || (STAGES.includes(row[2]) && atLeast(row[2])); }
// 店ごとに引き取った品数。通常商品の在庫は従来どおり無制限。
function cleanShopStock(data) {
  const out = {}; if (!data || typeof data !== 'object' || Array.isArray(data)) return out;
  for (const store of [...Object.keys(SHOP_ROOMS), 'C12_SEA']) {
    const entry = data[store]; if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const clean = {};
    for (const [id,n] of Object.entries(entry)) if (shopInfo(id) && !shopInfo(id).key && Number.isSafeInteger(n) && n > 0 && n <= 9999) clean[id] = n;
    if (Object.keys(clean).length) out[store] = clean;
  }
  return out;
}
function shopTypeOf(id) { const d=shopInfo(id); return !d ? null : ITEMS[id] ? ((d.hp || d.mp || d.revive || d.damage || d.weaken || d.armorbreak) && !d.key ? 'item' : null) : d.slot === 'w' ? 'w' : (d.slot === 'a' || d.slot === 'c') ? 'a' : null; }
function shopCurrentStock(type) { return G.shop && G.shop.type === type && S.shopStock ? (S.shopStock[G.shop.store] || {}) : {}; }
function shopInventory(type) {
  const base=SHOP_STOCK[type].filter(r => shopInfo(r[0]) && shopUnlocked(r));
  const sold=shopCurrentStock(type), rows=[];
  for (const [id,n] of Object.entries(sold)) {
    if (!(n > 0) || shopTypeOf(id)!==type) continue;
    const normal=base.find(r=>r[0]===id);
    rows.push(normal ? [normal[0],normal[1],normal[2] || null,!!normal[3],n,false] : [id,shopPrice(id),null,false,n,true]);
  }
  return rows.concat(base.filter(r=>!sold[r[0]]));
}
function shopSellables(type) {
  const source = type === 'item' ? ITEMS : GEAR, held = type === 'item' ? S.items : S.gear;
  return Object.keys(source).filter(id => held[id] > 0 && !source[id].key && (type === 'item' ? !!(source[id].hp || source[id].mp || source[id].revive || source[id].damage || source[id].weaken || source[id].armorbreak) : type === 'w' ? source[id].slot === 'w' : source[id].slot === 'a' || source[id].slot === 'c'));
}
function shopBuy(id, price) {
  if (!shopInfo(id) || !Number.isSafeInteger(price) || price < 0 || S.gold < price) return false;
  const bag = ITEMS[id] ? S.items : S.gear; if ((bag[id] || 0) >= 99) return false;
  if (G.shop) {
    const row=shopInventory(G.shop.type).find(r=>r[0]===id && r[1]===price); if (!row) return false;
    const sold=shopCurrentStock(G.shop.type); if (sold[id] > 0) { sold[id]--; if (!sold[id]) delete sold[id]; }
  }
  S.gold -= price; bag[id] = (bag[id] || 0) + 1; return true;
}
function shopSell(id) {
  const d = shopInfo(id); if (!d || d.key) return false;
  const bag = ITEMS[id] ? S.items : S.gear; if (!(bag[id] > 0)) return false;
  if (G.shop) {
    if (shopTypeOf(id) !== G.shop.type) return false;
    S.shopStock = S.shopStock || {}; const stock = S.shopStock[G.shop.store] = S.shopStock[G.shop.store] || {};
    if ((stock[id] || 0) >= 9999) return false;
    stock[id] = (stock[id] || 0) + 1;
  }
  bag[id]--; S.gold = Math.min(999999, S.gold + Math.floor(shopPrice(id) / 2)); return true;
}
function battleGold(ids) { return Math.max(20, Math.min(500, Math.round(ids.reduce((n,id) => n + ((ENEMIES[id] && ENEMIES[id].mhp) || 30), 0) / 4))); }
async function shopBrowse(type, selling) {
  let page = 0;
  while (true) {
    if (G.shop) G.shop.view = 'browse';
    const rows = selling ? shopSellables(type).map(id => [id, Math.floor(shopPrice(id)/2)]) : shopInventory(type);
    if (!rows.length) { await narrate(selling ? '売れる品物を持っていません。装備中の品は売れません。' : '今は品切れです。'); return; }
    const pages = Math.ceil(rows.length / 4); page = Math.min(page, pages - 1);
    const shown = rows.slice(page*4, page*4+4);
    const labels = shown.map(r => `${r[3] ? '★ ' : ''}${shopInfo(r[0]).name}　${r[1]} G${selling ? '　×' + (ITEMS[r[0]] ? S.items[r[0]] : S.gear[r[0]]) : (r[4] ? '　引取×' + r[4] : '')}`);
    if (pages > 1) labels.push('次のページ'); labels.push('戻る');
    const k = await choose(labels, `${selling ? '売る' : '買う'}　所持金 ${S.gold} G　${page+1}/${pages}`, { cancel:true, icons:shown.map(r => shopIcon(r[0])), desc:i => shown[i] ? shopInfo(shown[i][0]).desc : '' });
    if (k < 0 || k === labels.length-1) return;
    if (k >= shown.length) { page = (page+1)%pages; continue; }
    const [id,price] = shown[k], d = shopInfo(id);
    if (!selling && S.gold < price) { await narrate('所持金が足りません。'); continue; }
    if (!selling && ((ITEMS[id] ? S.items[id] : S.gear[id]) || 0) >= 99) { await narrate('これ以上持てません。'); continue; }
    if (G.shop) G.shop.view = 'confirm';
    const c = await choose([selling ? '売る' : '買う', 'やめる'], `${d.name}を ${price} G で${selling ? '売ります' : '買います'}か？`, {cancel:true});
    if (c !== 0) continue;
    if (selling ? shopSell(id) : shopBuy(id,price)) await narrate(`${d.name}を${selling ? '売った' : '買った'}。所持金 ${S.gold} G。`);
  }
}
async function openShop(type) {
  G.shop = { type, view: 'main', store: map.id };
  try {
    while (true) {
      G.shop.view = 'main';
      const c = await choose(['買う','売る','店を出る'], `いらっしゃい。所持金 ${S.gold} G`, { cancel:true });
      if (c < 0 || c === 2) return;
      await shopBrowse(type, c === 1);
    }
  } finally { G.shop = null; }
}

// お店の背景を残し、品揃え・所持金・会話・選択肢を離して見せる。
function drawShopChoice(c) {
  const stock = shopInventory(G.shop.type), browsing = G.shop.view === 'browse';
  ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  if (!browsing) {
    panel(18, 18, 330, 303);
    ctx.fillStyle = '#f4d694'; ctx.font = 'bold 20px ' + FONT; ctx.fillText('売っているもの', 36, 43);
    ctx.font = '18px ' + FONT;
    stock.slice(0, 7).forEach((r,i) => { const d=shopInfo(r[0]); const img=IMG[shopIcon(r[0])]; const y=75+i*32; if(img) ctx.drawImage(img,35,y-13,26,26); ctx.fillStyle=r[3]?'#ffe09a':'#f1e8da'; ctx.fillText((r[3]?'★ ':'')+d.name+(r[4]?' ×'+r[4]:''),68,y,190); ctx.textAlign='right';ctx.fillText(r[1]+' G',330,y);ctx.textAlign='left'; });
    if (stock.length > 7) { ctx.fillStyle='#cfc6b0'; ctx.font='15px '+FONT; ctx.fillText(`ほか ${stock.length - 7} 件（買うから確認）`,36,304,290); }
    panel(18, 330, 330, 53); ctx.fillStyle='#f4d694';ctx.font='19px '+FONT;ctx.fillText('所持金',36,356);ctx.textAlign='right';ctx.fillStyle='#fff';ctx.fillText(S.gold+' G',330,356);ctx.textAlign='left';
  }
  const x=browsing?24:690, y=browsing?28:225, w=browsing?405:240, h=48+c.list.length*42;
  panel(x,y,w,h); ctx.fillStyle='#f3d39a';ctx.font='bold 19px '+FONT;ctx.fillText(browsing?'品物を選ぶ':'ご用件',x+18,y+25);
  c.list.forEach((label,i)=>{ const ry=y+48+i*42; if(i===c.idx){ctx.fillStyle='rgba(196,147,78,.38)';roundRect(ctx,x+8,ry,w-16,38,4);ctx.fill();ctx.fillStyle='#ffe3a1';ctx.font='20px '+FONT;ctx.fillText('▶',x+15,ry+20);} const icon=c.icons&&IMG[c.icons[i]];if(icon)ctx.drawImage(icon,x+40,ry+3,32,32);ctx.fillStyle=i===c.idx?'#fff':'#d8d0c3';ctx.font='20px '+FONT;ctx.fillText(label,x+(icon?80:43),ry+20,w-(icon?95:55)); });
  if (browsing) { panel(568,28,365,92);ctx.fillStyle='#f4d694';ctx.font='20px '+FONT;ctx.fillText('所持金',590,55);ctx.textAlign='right';ctx.fillStyle='#fff';ctx.fillText(S.gold+' G',910,55);ctx.textAlign='left';ctx.font='16px '+FONT;ctx.fillStyle='#dfd2bd';ctx.fillText('決定：Z / Enter　戻る：X',590,91,320); }
  panel(200,420,560,98);ctx.fillStyle='#f4d694';ctx.font='bold 19px '+FONT;ctx.fillText(({item:'道具屋',w:'武器屋',a:'防具屋'})[G.shop.type],220,447);
  const desc=c.desc&&c.desc(c.idx);ctx.fillStyle='#fff';ctx.font='20px '+FONT;ctx.fillText(desc || (G.shop.view==='main'?'いらっしゃい。何をお探しですか？':c.prompt),220,480,520);
  ctx.restore();
}
function placeShopkeeper(id) { const d=SHOP_ROOMS[id]; addActor({id:'shopkeeper',img:d.img,x:5,y:3,dir:'down',name:d.keeper,talk:()=>openShop(d.type)}); }
for (const [id,d] of Object.entries(SHOP_ROOMS)) {
  MAPS[id] = { id, name:d.name, indoor:true, tiles:buildMapOps({w:12,h:9,ops:[['fill','x'],['rect',1,2,10,7,'o'],['set',5,8,'d']]}), points:{start:[5,7]} };
  // 店種ごとに陳列物を変え、店主と出入口の間は空ける。
  const displays = { item: 'prop_shop_supplies', w: 'prop_shop_weapons', a: 'prop_shop_armor' };
  const messages = { item: '薬瓶や食料が、使いやすいように棚へ並んでいる。', w: '旅人向けの武器が手入れされて並んでいる。', a: '旅の安全を願って作られた防具が並んでいる。' };
  const extras = d.type === 'item' ? [
    {img:'furn_cauldron',x:11,y:2,w:1,h:1,dw:54,say:'薬草を煮出す小鍋。'},
    {img:'furn_flowerpot',x:1,y:4,w:1,h:1,dw:34,say:'香りのよい薬草が育っている。'},
    {img:'furn_crate',x:11,y:6,w:1,h:1,dw:49,say:'旅に持っていく食料が入った木箱。'},
    {img:'furn_chest',x:10,y:5,w:1,h:1,dw:45,say:'薬草の種や包み紙を入れた箱。'},
    {img:'furn_barrel',x:12,y:4,w:1,h:1,dw:44,say:'乾いた食材を入れた樽。'}
  ] : d.type === 'w' ? [
    {img:'furn_bench_orthogonal',x:9,y:2,w:3,h:1,dw:142,say:'刃の手入れに使う作業台。'},
    {img:'furn_barrel',x:1,y:5,w:1,h:1,dw:44,say:'長い道具をしまう樽。'},
    {img:'furn_crate',x:11,y:6,w:1,h:1,dw:49,say:'武具の材料が入っている。'},
    {img:'furn_chest',x:10,y:5,w:1,h:1,dw:46,say:'砥石や金具を入れた道具箱。'},
    {img:'furn_stove',x:12,y:4,w:1,h:1,dw:46,say:'鉄を温める小さな炉。'}
  ] : [
    {img:'furn_bench_orthogonal',x:9,y:2,w:3,h:1,dw:130,say:'防具を仕立て直す作業台。'},
    {img:'furn_chest',x:1,y:5,w:1,h:1,dw:46,say:'大切に磨かれた金具がしまわれている。'},
    {img:'furn_flowerpot',x:12,y:5,w:1,h:1,dw:34,say:'店先を明るくする小さな鉢。'},
    {img:'furn_crate',x:11,y:6,w:1,h:1,dw:49,say:'布や革の手入れ道具が入っている。'},
    {img:'furn_chair_orthogonal',x:10,y:5,w:1,h:1,dw:36,say:'採寸を待つ人の椅子。'}
  ];
  // 旧家具の右側を2マス内側に寄せ、狭い部屋でも壁に収める。
  for (const f of extras) if (f.x >= 9) f.x -= 2;
  LAYOUT[id] = { doorX:5, windows:[5*T+6], rug:{x:2.4,y:5.1,w:235}, wall:[{img:'furn_jarshelf_orthogonal',x:1.15,y:14,w:105}], furn:[
    {img:'furn_bookshelf_orthogonal',art:displays[d.type],x:1,y:2,w:2,h:1,dw:d.type === 'w' ? 150 : 125,say:messages[d.type]},
    ...(d.type === 'item' ? [{img:'furn_table_orthogonal',x:6,y:2,w:2,h:1,dw:95,say:'店の帳簿と品物を置く机。'}] : []),
    {img:'furn_barrel',x:2,y:6,w:1,h:1,dw:44},
    {img:'furn_table_orthogonal',art:'prop_shop_counter',x:3,y:4,w:5,h:1,dw:240,shop:d.type},
    ...extras
  ] };
  CHREG.warps.push({map:id,at:[5,8],to:d.to,to_at:[d.x,d.y],dir:'down'});
}
CHREG.warps.push({map:'V',at:[30,20],to:'SHOP_ITEM',to_at:[5,7],dir:'up'}, {map:'V',at:[13,20],to:'SHOP_WEAPON',to_at:[5,7],dir:'up'}, {map:'K',at:[17,5],to:'SHOP_ARMOR',to_at:[5,7],dir:'up'});

// 灰の海まで同行した行商人。後戻りできない終盤でも希少品を手に取れる。
function placeTravelingMerchant() { addActor({id:'traveling_merchant',img:'npc_innkeeper',x:7,y:10,dir:'down',name:'旅の行商人',talk:openTravelingShop}); }
async function openTravelingShop() {
  while (true) {
    const c = await choose(['道具を見る','武器を見る','防具と装飾を見る','別れる'], `行商人　所持金 ${S.gold} G`, {cancel:true});
    if (c < 0 || c === 3) return;
    await openShop(['item','w','a'][c]);
  }
}

// 通路や人物・イベント位置を空け、市場と行商人の荷物を増やす。
LAYOUT.C3_MARKET.decor.push(
  {art:'prop_market_stall',x:14,y:9,aw:138,blockW:3},
  {img:'furn_crate',x:13,y:10,scale:0.28},
  {img:'furn_barrel',x:29,y:15,scale:0.30}
);
LAYOUT.C12_SEA.decor.push(
  {img:'furn_crate',x:9,y:10,scale:0.30},
  {img:'furn_barrel',x:5,y:10,scale:0.27}
);
