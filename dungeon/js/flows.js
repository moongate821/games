// ゲームの流れ: 街・施設・ダンジョン・戦闘のボタン、選択→確認→実行の手順。ゲームのルールはC#(GameSession)にある。
'use strict';

const FAC_ICONS = {
    Guild: 'icon_guild', WeaponShop: 'icon_weapon_shop', ArmorShop: 'icon_armor_shop', GeneralShop: 'icon_general_store', Inn: 'icon_inn',
    Blacksmith: 'icon_equip', Temple: 'icon_magic', Warehouse: 'icon_chest', Appraisal: 'icon_runes', TrainingHall: 'icon_attack', MasterShop: 'icon_weapon_shop', Casino: 'icon_runes', Arena: 'icon_attack',
};

const GREETINGS = {
    Guild: '冒険者ギルドへようこそ、{0}さん。登録やクエストの受注はこちらだ。',
    WeaponShop: 'いらっしゃい、{0}さん。なにをお求めですか?',
    ArmorShop: 'いらっしゃい、{0}さん。丈夫な防具が揃っていますよ。',
    GeneralShop: 'いらっしゃい、{0}さん。旅の必需品をどうぞ。',
    Blacksmith: 'おう、{0}さんか。装備の相談なら任せな。',
    Appraisal: '鑑定ですね、{0}さん。未鑑定の巻物をお持ちですか?',
    Temple: 'ようこそ、{0}さん。祈りを捧げに来られたのですね。',
    Warehouse: '{0}さん、荷物の預かりならお任せください。',
    Inn: '冒険者の宿へようこそ、{0}さん。ゆっくり休んでいってね。',
    TrainingHall: '訓練所へようこそ、{0}さん。腕を磨いていきなさい。',
    MasterShop: 'よく来たな、{0}さん。名匠が鍛えた品ばかりだ。値は張るが、腕は確かだぜ。',
    Casino: 'カジノへようこそ、{0}さん。コインは1枚10G。景品は、店では売ってない掘り出し物ばかりだ。',
    Arena: '闘技場へようこそ、{0}さん。勝ち抜くほど賞金も景品も増える。負けても失うのは参加費だけだ。',
};

const STORY_TRIAL =
    'ルミナスの街の地下には、古くから「試練場」と呼ばれる洞窟が口を開けている。\n\n' +
    '一番奥には、洞窟を支配するゴブリンキングが眠るという。王を倒した者は、冒険者ギルドで英雄と呼ばれ、王の遺した宝を手にするだろう。\n\n' +
    '洞窟は地下10階まで続く。浅い階には弱いゴブリンしかいないが、深く潜るほど強い敵が現れ、罠のしかけられた宝箱も増えていく。\n\n' +
    '腹が減っては戦はできない。パンは雑貨屋で買える。傷ついたら街に戻り、宿屋で休むといい。武器と防具を整え、ギルドの依頼をこなしながら、少しずつ深く潜ることだ。\n\n' +
    'さあ、冒険者よ。腕を磨き、仲間とともに試練に挑め。';

const STORY_CREDITS =
    'Dungeon Explorer(ダンジョンエクスプローラー)\n\nWizardry と トルネコの大冒険 に憧れて作られた、\n一人称視点のダンジョンRPG。\n\n' +
    'プログラム: Claude Code(Anthropic)との共同制作\n画像: Gemini、Microsoft 365 Copilot による生成\n効果音: ゲーム内で合成(チップチューン)\n\n' +
    '参考にした作品: Wizardry、Wizardry Variants Daphne、トルネコの大冒険 ほか\n\n遊んでくれて、ありがとう。';

const playerName = () => (G.snap && G.snap.party[0] ? G.snap.party[0].name : '冒険者');
const flag = k => { try { return localStorage.getItem('dg_' + k) === '1'; } catch (_) { return false; } };
const setFlag = k => { try { localStorage.setItem('dg_' + k, '1'); } catch (_) { /* 保存できなくても続ける */ } };

// ---------- ボタンの一覧(状態ごと) ----------
function buildActions() {
    const s = G.snap;
    if (s.state === 'Town') return G.facility ? facilityActions() : townActions();
    if (s.state === 'Dungeon') return dungeonActions();
    if (s.state === 'Battle') return battleActions();
    if (s.state === 'GameOver') return gameOverActions();
    return [];
}

function townActions() {
    const facs = api('facilities').data || [];
    const list = facs.map(f => f.locked
        ? { label: `[${f.name}] Lv${f.needLevel}で解放`, icon: FAC_ICONS[f.type] || 'icon_general_store', cls: 'locked', onClick: () => toast(`[${f.name}]は、レベル${f.needLevel}になると利用できる。`) }
        : { label: `[${f.name}]`, icon: FAC_ICONS[f.type] || 'icon_general_store', onClick: () => enterFacility(f) });
    list.push(
        { label: '持ち物一覧', icon: 'icon_inventory', onClick: inventoryScreen },
        { label: '持ち物を使う', icon: 'icon_inventory', onClick: useItemFlow },
        { label: '装備を変える', icon: 'icon_equip', onClick: equipFlow },
        { label: '呪文を唱える', icon: 'icon_magic', onClick: fieldSpellFlow },
        { label: '試練場の物語', icon: 'icon_runes', onClick: () => showStory('試練場のはじまり', STORY_TRIAL) },
        { label: 'ダンジョンへ', icon: 'icon_dungeon', cls: 'primary', onClick: enterDungeonFlow },
        { label: 'セーブ', icon: 'icon_save', onClick: () => act('save') },
        { label: 'ロード', icon: 'icon_load', onClick: () => act('load') },
        { label: '設定', onClick: showSettings },
    );
    return list;
}

function enterFacility(f) {
    G.facility = { id: f.id, type: f.type, name: f.name, npcId: f.npcId, npcName: f.npcName, speech: (GREETINGS[f.type] || '').replace('{0}', playerName()) };
    G.shopCategory = null;
    if (f.type === 'TrainingHall' && !flag('story')) { setFlag('story'); showStory('試練場のはじまり', STORY_TRIAL); }
    refresh();
}

function leaveFacility() { G.facility = null; G.shopCategory = null; refresh(); }

const slotGroup = it => it.slot === 'Weapon' ? '武器'
    : ['Shield', 'Head', 'Body', 'Arms', 'Legs', 'Cloak', 'Belt'].includes(it.slot) ? '防具'
        : it.slot ? '装飾・特殊' : '道具';

function facilityActions() {
    const f = G.facility;
    const info = api('facilityInfo', { id: f.id }).data;
    const acts = [];
    if (f.type === 'Guild') {
        const q = api('quests').data;
        acts.push(
            { label: 'クエストを受ける', onClick: () => questFlow('受けるクエスト', 'offers', 'questAccept') },
            { label: 'クエストを報告する', onClick: () => questFlow('報告するクエスト', 'reportable', 'questComplete') });
        for (const line of q.progress) acts.push({ label: '受注中: ' + line, cls: 'sub', onClick: () => { } });
    } else if (f.type === 'Appraisal') {
        if (!info.unidentifiedScrolls.length) acts.push({ label: '未鑑定の巻物は無い', onClick: () => { } });
        for (const id of info.unidentifiedScrolls) acts.push({ label: `未鑑定の巻物#${id}を鑑定する(50G)`, onClick: () => act('identify', { itemId: id }) });
    } else if (f.type === 'Inn') {
        acts.push(
            { label: `宿屋に泊まる(${info.innCost}G)`, icon: 'icon_inn', cls: 'primary', onClick: async () => { if (await confirmBox('宿泊の確認', `宿代は${info.innCost}Gです。\n泊まって、全員のHP・MPを回復しますか?`)) act('innStay'); } },
            { label: info.innOffer, cls: 'sub', onClick: () => { } },
            { label: '買い取る', onClick: async () => { if (await confirmBox('購入確認', 'この掘り出し物を買い取りますか?')) act('innBuyOffer'); } },
            { label: '持ち物一覧', icon: 'icon_inventory', onClick: inventoryScreen },
            { label: '持ち物を使う', icon: 'icon_inventory', onClick: useItemFlow },
            { label: '装備を変える', icon: 'icon_equip', onClick: equipFlow },
            { label: '呪文を唱える', icon: 'icon_magic', onClick: fieldSpellFlow });
    } else if (f.type === 'TrainingHall') {
        acts.push({ label: '試練場の物語を読む', onClick: () => showStory('試練場のはじまり', STORY_TRIAL) });
    } else if (f.type === 'Casino') {
        const c = info.casino;
        acts.push(
            { label: c.status, cls: 'sub', onClick: () => { } },
            ...(c.card ? [{ label: `ハイ&ロー: 今のカードは[${c.card}]`, cls: 'sub', onClick: () => { } }] : []),
            { label: `コインを100枚買う(${100 * c.coinPrice}G)`, onClick: () => act('casinoBuy', { coins: 100 }) },
            { label: `コインを1000枚買う(${1000 * c.coinPrice}G)`, onClick: () => act('casinoBuy', { coins: 1000 }) },
            { label: `賭け金を変える(今${c.bet}枚)`, img: `img/mg/CHIP_${c.bet}.webp`, onClick: () => act('casinoBet') },
            { label: '丁(偶数)に賭ける', onClick: () => diceFlow(0) },
            { label: '半(奇数)に賭ける', onClick: () => diceFlow(1) },
            { label: 'スロットを回す', cls: 'primary', onClick: slotFlow },
            { label: 'ハイ(次は大きい)', onClick: () => hiloFlow(1) },
            { label: 'ロー(次は小さい)', onClick: () => hiloFlow(0) },
            { label: '景品と交換する', onClick: casinoPrizeFlow });
    } else if (f.type === 'Arena') {
        const ar = info.arena;
        for (const line of ar.status.split(String.fromCharCode(10))) acts.push({ label: line, cls: 'sub', onClick: () => { } });
        if (ar.active) {
            acts.push(
                { label: '次の試合に挑む', icon: 'icon_attack', cls: 'primary', onClick: () => awardFlow(act('arenaFight')) },
                { label: `休憩する(${ar.restCost}G・HP35%回復)`, onClick: () => act('arenaRest') },
                { label: '棄権して終える', onClick: async () => { if (await confirmBox('棄権の確認', 'ここで挑戦を終えます。(連勝で得た賞金と景品は持ち帰れます)')) act('arenaWithdraw'); } });
        } else {
            acts.push({ label: `参加する(参加費${ar.fee}G)`, icon: 'icon_attack', cls: 'primary', onClick: () => awardFlow(act('arenaStart')) });
        }
    } else {
        let items = info.items;
        if (items.length > 12) {   // 品数が多い店は、分類(武器・防具・装飾・道具)を先に選ぶ
            const groups = [...new Set(items.map(slotGroup))];
            if (!G.shopCategory || !groups.includes(G.shopCategory)) {
                for (const g of groups) acts.push({ label: `${g}(${items.filter(i => slotGroup(i) === g).length}点)`, onClick: () => { G.shopCategory = g; refresh(); } });
                items = [];
            } else {
                acts.push({ label: '◀ 分類を選びなおす', onClick: () => { G.shopCategory = null; refresh(); } });
                items = items.filter(i => slotGroup(i) === G.shopCategory);
            }
        }
        for (const it of items) {
            acts.push({
                label: `${it.name} (${it.price}G)`, itemIcon: it.id,
                onClick: () => buyFlow(f, it),
                onHover: () => { f.speech = `${it.name}(${it.price}G)\n${it.effect}`; requestRedraw(); },
            });
        }
    }
    acts.push({ label: '話す', icon: 'icon_runes', onClick: npcTalkFlow });
    acts.push({ label: '戻る', icon: 'icon_move', onClick: leaveFacility });
    return acts;
}

async function casinoPrizeFlow() {
    const list = api('casinoPrizes').data;
    const coins = api('facilityInfo', { id: G.facility.id }).data.casino.coins;
    const id = await pickDialog(`景品交換(コイン${coins}枚)`, list.map(p => ({ id: p.id, label: `${p.name}  [${p.cost}枚]`, sub: p.effect, icon: p.id })), { okText: '交換する', wide: true });
    if (id !== null) awardFlow(act('casinoExchange', { id }));
}

async function buyFlow(f, it) {
    const ok = await confirmBox('購入確認', `[${it.name}]を${it.price}Gで購入しますか?\n\n${it.effect}\n(所持金 ${G.snap.gold}G / 持っている数 ${it.owned}個)`);
    if (!ok) return;
    act('buy', { facilityId: f.id, itemId: it.id });
    const now = (api('inventory').data.find(x => x.id === it.id) || { count: 0 }).count;
    if (now > it.owned && it.slot) await offerEquip(it);
    refresh();
}

async function offerEquip(it) {
    if (!(await confirmBox('装備', `[${it.name}]を、今すぐ装備しますか?`, '装備する', 'あとで'))) return;
    const m = await pickMember('誰が装備しますか?', false);
    if (m !== null) act('equip', { id: it.id, member: m });
}

async function questFlow(title, key, cmd) {
    const list = api('quests').data[key];
    if (!list.length) { logMessage(key === 'offers' ? '今、受けられるクエストは無い。' : '報告できるクエストは無い。'); refresh(); return; }
    const id = await pickDialog(title, list.map(q => ({ id: q.id, label: q.text })), { wide: true });
    if (id !== null) act(cmd, { id });
}

// ---------- ダンジョン ----------
async function enterDungeonFlow() {
    if (!flag('story')) { setFlag('story'); await showStory('試練場のはじまり', STORY_TRIAL); }
    const ds = api('dungeons').data;
    let id = 1;
    if (ds.length > 1) {
        id = await pickDialog('どのダンジョンに入る?', ds.map(d => ({ id: d.id, label: `${d.name}(地下${d.floorCount}階)${d.unlocked ? '' : `  ※レベル${d.requiredLevel}から`}`, sub: d.description, uiIcon: 'icon_dungeon' })), { wide: true });
        if (id === null) return;
    }
    act('enterDungeon', { id });
}

function dungeonActions() {
    const d = G.snap.dungeon;
    const a = [];
    if (d.pendingChest) {
        a.push(
            { label: '調べる', icon: 'icon_chest', onClick: () => act('inspect') },
            { label: '罠を外す', icon: 'icon_key', onClick: () => act('disarm') },
            { label: '開ける', icon: 'icon_chest', cls: 'primary', onClick: () => act('open') },
            { label: 'あきらめる', icon: 'icon_move', onClick: () => act('abandon') });
    }
    if (d.onInn) a.push({ label: `旅の宿屋に泊まる(${d.dungeonInnCost}G)`, icon: 'icon_inn', cls: 'primary', onClick: async () => { if (await confirmBox('宿泊の確認', `旅の宿屋の宿代は${d.dungeonInnCost}Gです。\n泊まって、全員のHP・MPを回復しますか?(所持金 ${G.snap.gold}G)`)) act('dungeonInnStay'); } });
    if (d.onShop) a.push({ label: '行商の道具屋で買う', icon: 'icon_general_store', cls: 'primary', onClick: dungeonShopFlow });
    if (d.onStairs) a.push({ label: '階段を下りる', icon: 'icon_stairs', cls: 'primary', onClick: () => act('stairs') });
    if (d.secretDoor) a.push({ label: '深淵の底の扉を開ける', sub: '終焉竜ニヒルに挑む', icon: 'icon_stairs', cls: 'primary', onClick: () => act('secretDoor') });
    if (d.bossName && !d.cleared) a.push({ label: `ボス[${d.bossName}]に挑む`, icon: 'icon_attack', onClick: () => act('boss') });
    a.push({ label: '全体マップ', icon: 'icon_map', onClick: showMap });
    if (d.stairsKnown) a.push({ label: '出口へ自動移動', icon: 'icon_stairs', onClick: () => act('autoStairs') });
    a.push({ label: '持ち物一覧', icon: 'icon_inventory', onClick: inventoryScreen });
    a.push({ label: '持ち物を使う', icon: 'icon_inventory', onClick: useItemFlow });
    a.push({ label: '街へ戻る', icon: 'icon_move', cls: 'sub', onClick: async () => { if (await confirmBox('街へ戻る', '街へ戻りますか?')) act('toTown'); } });
    return a;
}

async function dungeonShopFlow() {
    const list = api('dungeonShop').data;
    if (!list.length) return;
    const id = await pickDialog(`行商の道具屋(所持金 ${G.snap.gold}G)`, list.map(it => ({ id: it.id, label: it.name, sub: it.effect, icon: it.id, price: it.price })), { okText: '買う', wide: true });
    if (id !== null) { act('dungeonShopBuy', { id }); }
}

// 移動(ダンジョン)。キー・十字キー・スティック・スワイプから呼ぶ
function moveCmd(cmd) {
    const s = G.snap;
    if (!s || s.state !== 'Dungeon' || Modal.stack.length || G.busy) return;
    act(cmd);
}

// 宝箱の前で決定ボタンを押したときの選択。コントローラーでも選べる。閉じると宝箱はそのまま
async function chestMenu() {
    const id = await pickDialog('宝箱をどうする?', [
        { id: 'inspect', label: '調べる(罠があるか)', uiIcon: 'icon_chest' },
        { id: 'disarm', label: '罠を外す', uiIcon: 'icon_key' },
        { id: 'open', label: '開ける', uiIcon: 'icon_chest' },
        { id: 'abandon', label: 'あきらめる', uiIcon: 'icon_move' },
    ], { okText: '決める' });
    if (id) act(id);
}

// ダンジョンで「決定」ボタンを押したときの、その場の主な操作
function primaryDungeonAction() {
    const s = G.snap;
    if (!s || s.state !== 'Dungeon' || G.busy) return;
    const d = s.dungeon;
    if (d.pendingChest) chestMenu();
    else if (d.onStairs) act('stairs');
    else if (d.onInn) buttonByLabel('旅の宿屋');
    else if (d.onShop) dungeonShopFlow();
    else act('investigate');
}

function buttonByLabel(text) { const b = [...document.querySelectorAll('#actions button')].find(x => x.textContent.includes(text)); if (b) b.click(); }

// ---------- 戦闘 ----------
function battleActions() {
    // ドラクエ風: 「たたかう」で、冒険者1人ずつに命令(たたかう/スキル/どうぐ/ぼうぎょ)を選び、全員分がそろったら1ラウンドを実行する
    return [
        { label: 'たたかう(命令を選ぶ)', icon: 'icon_attack', cls: 'primary', onClick: battleCommandFlow },
        { label: '全員で攻撃', icon: 'icon_attack', onClick: () => act('attack') },
        { label: '自動戦闘', icon: 'icon_wait', onClick: () => act('autoBattle', { stop: G.settings.autoStop }) },
        { label: '逃げる', icon: 'icon_move', onClick: () => act('flee') },
    ];
}

const CMD_LABELS = { Attack: 'たたかう', Skill: 'スキル', Item: 'どうぐ', Defend: 'ぼうぎょ' };

// 1人分の命令を選ぶ窓。'attack' | 'skill' | 'item' | 'defend' | 'back' | 'cancel' を返す
function commandDialog(m, summary, canBack) {
    const rows = [['attack', 'たたかう', 'icon_attack'], ['skill', 'スキル', 'icon_skill'], ['item', 'どうぐ', 'icon_inventory'], ['defend', 'ぼうぎょ', 'icon_defend']];
    const body = h('div', {},
        h('div', { class: 'face-pick', style: 'margin-bottom:8px' }, h('img', { src: m.face, alt: '' }),
            h('div', {}, h('div', { style: 'font-weight:700;color:var(--gold);font-size:17px' }, m.name),
                h('div', { class: 'note' }, `Lv${m.level} ${m.job}  HP${m.hp}/${m.maxHp}  MP${m.mp}/${m.maxMp}`))),
        h('div', { class: 'list' }, rows.map(([v, label, ic]) => h('div', { class: 'row', onclick: () => closeDialog(v) }, icon(ic), h('div', { class: 'grow', style: 'font-size:16px;font-weight:700' }, label)))),
        summary.length ? h('div', { class: 'note', style: 'margin-top:8px' }, 'これまでの命令: ' + summary.join(' / ')) : null);
    return dialog({ title: `${m.name}は どうする?`, body, buttons: [{ text: 'やめる', value: 'cancel' }, { text: '◀ 前の人に戻る', value: 'back', disabled: !canBack }] });
}

async function pickEnemy(title) {
    const enemies = G.snap.battle ? G.snap.battle.enemies : [];
    if (enemies.length <= 1) return 0;
    return pickDialog(title, enemies.map(e => ({ id: e.i, label: e.name, sub: `HP${e.hp}/${e.maxHp}` })));
}

async function pickSkillCommand(member) {
    const skills = api('skills', { member }).data;
    if (!skills.length) { logMessage('使えるスキルが無い。'); refresh(); return null; }
    const id = await pickDialog('スキルを使う', skills.map(k => ({ id: k.id, label: k.text })), { wide: true });
    if (id === null) return null;
    const sk = skills.find(k => k.id === id);
    if (sk.heal) {
        const t = await pickMember('誰を回復しますか?', true);
        return t === null ? null : { member, kind: 'Skill', skillId: id, targetMember: t, _label: skillName(sk) };
    }
    const e = await pickEnemy('どの敵に使う?');
    return e === null ? null : { member, kind: 'Skill', skillId: id, enemy: e, _label: skillName(sk) };
}

async function pickItemCommand(member) {
    const inv = api('inventory').data.filter(i => i.cat === 'Consumable' || i.cat === 'Scroll');
    if (!inv.length) { logMessage('使える道具が無い。'); refresh(); return null; }
    const id = await pickDialog('どうぐを使う', inv.map(i => ({ id: i.id, label: `${i.name} ×${i.count}`, sub: i.effect, icon: i.id })), { wide: true });
    if (id === null) return null;
    const t = await pickMember('誰に使いますか?', true);
    const it = inv.find(i => i.id === id);
    return t === null ? null : { member, kind: 'Item', itemId: id, targetMember: t, _label: it ? it.name : '' };
}

// 2026-09-30(Codex提案「選択済みスキル名を表示」): スキルの表示文(名前+消費など)から、名前だけを取り出す
function skillName(sk) { return String(sk.text || sk.id).split(/[ (　]/)[0]; }

async function battleCommandFlow() {
    if (G.busy || !G.snap || G.snap.state !== 'Battle') return;
    const alive = G.snap.party.filter(m => !m.down).map(m => m.i);
    const chosen = {};
    let step = 0;
    while (step < alive.length) {
        const idx = alive[step], m = G.snap.party[idx];
        const summary = alive.slice(0, step).map(i => `${G.snap.party[i].name}:${chosen[i]._label || CMD_LABELS[chosen[i].kind]}`);
        const choice = await commandDialog(m, summary, step > 0);
        if (choice === null || choice === 'cancel') return;
        if (choice === 'back') { step--; continue; }
        let cmd = null;
        if (choice === 'defend') cmd = { member: idx, kind: 'Defend' };
        else if (choice === 'attack') { const e = await pickEnemy('どの敵を攻撃する?'); if (e === null) continue; cmd = { member: idx, kind: 'Attack', enemy: e }; }
        else if (choice === 'skill') { cmd = await pickSkillCommand(idx); if (!cmd) continue; }
        else if (choice === 'item') { cmd = await pickItemCommand(idx); if (!cmd) continue; }
        chosen[idx] = cmd;
        step++;
    }
    act('round', { commands: Object.values(chosen).map(({ _label, ...c }) => c) });
}

async function skillFlow() {
    const m = await pickMember('誰がスキルを使いますか?', true);
    if (m === null) return;
    const skills = api('skills', { member: m }).data;
    if (!skills.length) { logMessage('使えるスキルが無い。'); refresh(); return; }
    const id = await pickDialog('スキルを使う', skills.map(k => ({ id: k.id, label: k.text })), { wide: true });
    if (id === null) return;
    const sk = skills.find(k => k.id === id);
    let target = null;
    if (sk.heal) {
        target = await pickMember('誰を回復しますか?', true);
        if (target === null) return;
    }
    act('skill', { id, member: m, target });
}

function gameOverActions() {
    const life = G.snap.playerLife;
    const a = [];
    if (life === 'Downed') a.push({ label: '蘇生を試みる', cls: 'primary', onClick: () => act('revive') });
    else if (life === 'Soul') a.push({ label: '霊魂の蘇生を試みる', cls: 'primary', onClick: () => act('soulRevive') });
    a.push({ label: 'ロードして再開', icon: 'icon_load', onClick: () => act('load') });
    return a;
}

// ---------- 冒険者・持ち物 ----------
async function pickMember(title, aliveOnly) {
    const party = G.snap.party.filter(m => !aliveOnly || !m.down);
    return pickDialog(title, party.map(m => ({ id: m.i, label: `${m.name}  Lv${m.level} ${m.job}`, sub: `HP${m.hp}/${m.maxHp} MP${m.mp}/${m.maxMp}${m.down ? ' (戦闘不能)' : ''}`, face: m.face })));
}

async function useItemFlow() {
    const inv = api('inventory').data.filter(i => i.cat === 'Consumable' || i.cat === 'Scroll');
    if (!inv.length) { logMessage('使える道具が無い。'); refresh(); return; }
    const id = await pickDialog('道具を使う', inv.map(i => ({ id: i.id, label: `${i.name} ×${i.count}`, sub: i.effect, icon: i.id })), { wide: true });
    if (id === null) return;
    const m = await pickMember('誰に使いますか?', true);
    if (m !== null) act('useItem', { id, member: m });
}

async function equipFlow() {
    const m = await pickMember('誰の装備を変えますか?', false);
    if (m !== null) showSheet(m);
}

async function fieldSpellFlow() {
    const c = await pickMember('誰が呪文を唱えますか?', true);
    if (c === null) return;
    const spells = api('fieldSpells', { member: c }).data;
    if (!spells.length) { logMessage(`${G.snap.party[c].name}は、戦闘外で使える呪文を覚えていない。`); refresh(); return; }
    const skill = await pickDialog('呪文を選ぶ', spells.map(k => ({ id: k.id, label: k.text })), { wide: true });
    if (skill === null) return;
    const t = await pickMember('誰に唱えますか?', false);
    if (t !== null) act('cast', { skill, caster: c, target: t });
}

// 冒険者1人分のキャラクター画面(能力値・装備・持ち物。装備する・外す・使う)
async function showSheet(start) {
    let idx = start, selEq = null, selInv = null;
    const build = () => {
        const d = api('sheet', { member: idx }).data;
        const m = d.member;
        const head = h('div', { class: 'face-pick' },
            h('img', { src: m.face, alt: '' }),
            h('div', {},
                h('div', { style: 'font-weight:700;color:var(--gold);font-size:17px' }, `${m.name}  Lv${m.level}  ${m.race}・${m.job}`),
                h('div', { class: 'note' }, `HP ${m.hp}/${m.maxHp}  MP ${m.mp}/${m.maxMp}  経験値 ${m.exp}  状態 ${m.status}  性格 ${m.personality}`),
                h('div', { class: 'note' }, `攻撃 ${m.atk}  防御(AC) ${m.ac}`)));
        const stats = h('div', { class: 'kv' }, d.stats.flatMap(s => [h('span', {}, s.name), h('span', {}, s.value || '-')]));
        const eq = h('div', { class: 'list' }, d.equipment.map(e => h('div', { class: 'row' + (selEq === e.slot ? ' sel' : ''), onclick: () => { selEq = selEq === e.slot ? null : e.slot; selInv = null; updateModal(); } },
            h('div', { class: 'grow' }, `${e.label}: ${e.name || '(なし)'}`))));
        const inv = h('div', { class: 'list' }, d.inventory.map(i => {
            const mark = i.slot ? '[装]' : (i.cat === 'Consumable' || i.cat === 'Scroll') ? '[使]' : '    ';
            const by = i.equippedBy.length ? ` (装備:${i.equippedBy.join('・')})` : '';
            return h('div', { class: 'row' + (selInv === i.id ? ' sel' : ''), onclick: () => { selInv = selInv === i.id ? null : i.id; selEq = null; updateModal(); } },
                itemIcon(i.id), h('div', { class: 'grow' }, `${mark} ${i.name} ×${i.count}${by}`, h('div', { class: 'sub' }, i.effect)));
        }));
        if (!d.inventory.length) inv.append(h('div', { class: 'note' }, '持ち物は空です'));
        const wrap = h('div', {}, head, h('div', { class: 'cols', style: 'margin-top:8px' },
            h('div', {}, h('div', { class: 'h3' }, '能力値'), stats, h('div', { class: 'h3', style: 'margin-top:8px' }, '装備'), eq),
            h('div', {}, h('div', { class: 'h3' }, '持ち物(パーティ共有)'), inv)));
        return { wrap, d };
    };
    let last = null;
    const buttons = () => {
        const d = last.d;
        const b = [];
        const it = selInv !== null ? d.inventory.find(i => i.id === selInv) : null;
        const eqSel = selEq !== null ? d.equipment.find(e => e.slot === selEq) : null;
        if (it && it.slot) b.push({ text: '装備する', cls: 'primary', onClick: () => { act('equip', { id: it.id, member: idx }); updateModal(); } });
        if (it && (it.cat === 'Consumable' || it.cat === 'Scroll')) b.push({ text: '使う', cls: 'primary', onClick: () => { act('useItem', { id: it.id, member: idx }); updateModal(); } });
        if (eqSel && eqSel.itemId) b.push({ text: '外す', onClick: () => { act('unequip', { slot: eqSel.slot, member: idx }); updateModal(); } });
        b.push({ text: '詳細ステータス', onClick: () => detailScreen(idx) });
        b.push({ text: '◀ 前の仲間', onClick: () => { idx = (idx + G.snap.party.length - 1) % G.snap.party.length; selEq = selInv = null; updateModal(); } });
        b.push({ text: '次の仲間 ▶', onClick: () => { idx = (idx + 1) % G.snap.party.length; selEq = selInv = null; updateModal(); } });
        b.push({ text: '閉じる', value: true });
        return b;
    };
    const entry = {
        title: '冒険者', wide: true, className: 'sheet',
        body: () => { last = build(); entry.buttons = buttons(); setTimeout(() => refreshModalButtons(entry), 0); return last.wrap; },
        buttons: [],
    };
    // 中身を作るたびに、ボタンも作り直す
    return new Promise(resolve => { entry.resolve = v => { refresh(); resolve(v); }; Modal.stack.push(entry); renderModal(); });
}

function refreshModalButtons(entry) {
    if (Modal.stack[Modal.stack.length - 1] !== entry) return;
    const bar = $('dialog-buttons');
    bar.replaceChildren();
    for (const b of entry.buttons) {
        bar.append(h('button', { class: b.cls || '', disabled: b.disabled, onclick: () => { SND.play('ui'); if (b.onClick) b.onClick(); else closeDialog(b.value); } }, b.text));
    }
    requestFocusReset();
}

// ---------- 地図 ----------
async function showMap() {
    let sel = null;
    const CELL = 14;
    const canvas = h('canvas', {});
    const info = h('div', { class: 'note', style: 'margin-top:4px' });
    const draw = () => {
        const d = api('map').data;
        const rows = d.rows || [];
        const w = rows[0] ? rows[0].length : 40;
        canvas.width = w * CELL; canvas.height = rows.length * CELL;
        const c = canvas.getContext('2d');
        c.fillStyle = '#f4f4f0'; c.fillRect(0, 0, canvas.width, canvas.height);
        c.strokeStyle = '#c8c8c4';
        for (let x = 0; x <= w; x++) { c.beginPath(); c.moveTo(x * CELL, 0); c.lineTo(x * CELL, canvas.height); c.stroke(); }
        for (let y = 0; y <= rows.length; y++) { c.beginPath(); c.moveTo(0, y * CELL); c.lineTo(canvas.width, y * CELL); c.stroke(); }
        rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === ' ') return; c.fillStyle = ch === '@' ? '#ff8c14' : (MAP_COLORS[ch] || '#18181c'); if (ch === '.') c.fillStyle = '#18181c'; c.fillRect(x * CELL + 1, y * CELL + 1, CELL - 1, CELL - 1); }));
        const syms = ['', '★', '!', '?', '◆'], cols = ['', '#ffd246', '#ff6e46', '#5ad2f0', '#78e678'];
        c.font = `bold ${CELL - 2}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        for (const mk of d.marks) { c.fillStyle = cols[mk.mark]; c.fillText(syms[mk.mark], mk.x * CELL + CELL / 2, mk.y * CELL + CELL / 2 + 1); }
        // 2026-09-30(Codex提案「地図で現在の向きを明示」): 現在地(@)に、向いている方向の三角を重ねる
        const face = G.snap && G.snap.dungeon ? G.snap.dungeon.facing : null;
        if (face !== null && face !== undefined) {
            rows.forEach((row, y) => [...row].forEach((ch, x) => {
                if (ch !== '@') return;
                const px = x * CELL + CELL / 2, py = y * CELL + CELL / 2, r = CELL * 0.62;
                const ang = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][face];
                c.save(); c.translate(px, py); c.rotate(ang);
                c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 1.5;
                c.beginPath(); c.moveTo(r, 0); c.lineTo(-r * 0.6, -r * 0.7); c.lineTo(-r * 0.3, 0); c.lineTo(-r * 0.6, r * 0.7); c.closePath();
                c.fill(); c.stroke(); c.restore();
            }));
        }
        if (sel) { c.strokeStyle = '#ff3cc8'; c.lineWidth = 2; c.strokeRect(sel.x * CELL, sel.y * CELL, CELL, CELL); c.lineWidth = 1; }
        const mark = sel ? (d.marks.find(m => m.x === sel.x && m.y === sel.y) || { mark: 0 }).mark : 0;
        info.textContent = T(sel ? `選択: (${sel.x},${sel.y}) 印:${d.markNames[mark]}` : 'マスをタップで選ぶ(通ったマスだけ、印や自動移動ができます)。印: ★重要 !注意 ?調べたい ◆目印  凡例: 緑=旅の宿屋 紫=行商の道具屋 青=階段 赤=強敵 金=鍵のかかった扉 薄緑=落ちている道具');
        return d;
    };
    canvas.addEventListener('pointerdown', e => {
        const r = canvas.getBoundingClientRect();
        sel = { x: Math.floor((e.clientX - r.left) / r.width * canvas.width / CELL), y: Math.floor((e.clientY - r.top) / r.height * canvas.height / CELL) };
        draw();
    });
    const data = api('map').data;
    const wrap = h('div', {}, h('div', { class: 'map-wrap' }, canvas), info);
    const result = await new Promise(resolve => {
        const entry = {
            title: data.title, wide: true, body: () => { setTimeout(draw, 0); return wrap; },
            buttons: [
                { text: '印を切り替え', onClick: () => { if (!sel) return; const d = api('map').data; const cur = (d.marks.find(m => m.x === sel.x && m.y === sel.y) || { mark: 0 }).mark; api('mark', { x: sel.x, y: sel.y, mark: (cur + 1) % d.markNames.length }); draw(); } },
                { text: 'ここへ自動移動', onClick: () => { if (sel) closeDialog({ to: sel }); } },
                { text: '階段へ自動移動', onClick: () => closeDialog({ stairs: true }) },
                { text: '戻る', value: true, cls: 'primary' },
            ],
            resolve,
        };
        Modal.stack.push(entry); renderModal();
    });
    if (result && result.to) act('autoTo', result.to);
    else if (result && result.stairs) act('autoStairs');
    else refresh();
}

// ---------- 物語・設定・操作ガイド ----------
async function showStory(title, text) {
    // 物語とクレジットの間は、BGMを変える
    const prev = G.musicOverride;
    G.musicOverride = text === STORY_TRIAL ? 'story' : text === STORY_CREDITS ? 'ending' : prev;
    updateMusic();
    try { return await dialog({ title, body: h('div', { class: 'msg' }, text), buttons: [{ text: '閉じる', value: true, cls: 'primary' }] }); }
    finally { G.musicOverride = prev; updateMusic(); }
}

const GUIDE =
    'コントローラー(ゲームパッド)\n' +
    '  十字キー/左スティック: 前進(上)・左を向く・右を向く・後ろを向く(下)。ダイアログでは項目の移動\n' +
    '  A: 決定(ダンジョンでは、その場の操作: 宝箱を開ける・階段を下りる・調べる) / B: 戻る\n' +
    '  X: 全体マップ / Y か Start: メニュー / L1・R1: 左右を向く\n\n' +
    'キーボード\n  矢印キー(WASD): 移動と向き / Enter・Space: 決定 / Esc: 戻る・メニュー / M: 地図\n\n' +
    'タッチ(iPhone・スマホ)\n  画面の十字ボタン、または画面のスワイプ(上=前進、左右=向き、下=後ろを向く)\n  右のボタンで操作。左上のキャラをタップで、装備や持ち物。戦闘中は、敵をタップで狙いを変えられる\n\n' +
    'ホーム画面に追加すると、アプリのように、オフラインで遊べます(iPhone: Safariの共有ボタン →「ホーム画面に追加」)。';

const SETTINGS_KEY = 'dungeon_settings';
function loadSettings() { try { Object.assign(G.settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (_) { /* 既定値のまま */ } }
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(G.settings)); } catch (_) { /* 保存できなくても続ける */ } }

async function showSettings() {
    const chips = (key, options) => h('div', { class: 'chips' }, options.map(([v, label]) => h('div', { class: 'chip' + (G.settings[key] === v ? ' sel' : ''), onclick: () => { G.settings[key] = v; saveSettings(); if (key === 'lang') { document.documentElement.lang = v; refresh(); } updateModal(); } }, label)));
    await dialog({
        title: '設定',
        body: () => h('div', {},
            h('div', { class: 'field' }, h('label', {}, '言語 / Language'), chips('lang', [['ja', '日本語'], ['en', 'English']])),
            ...(G.snap && G.snap.state === 'Town' ? [h('div', { class: 'field' }, h('label', {}, '難易度'), h('div', { class: 'chips' }, [[false, '普通'], [true, 'ヘル']].map(([v, label]) => h('div', { class: 'chip' + ((!!G.snap.hell) === v ? ' sel' : ''), onclick: () => { const r = api('setHell', { on: v }); if (r && r.snap) G.snap = r.snap; if (r && r.msg) toast(r.msg, 4200); updateModal(); } }, label))), h('p', { class: 'note' }, 'ヘルモード: 敵のHP×2.2・攻撃×1.5・防御×1.3、罠のダメージ×1.5、宿代×2、敵は逃げない。全滅すると所持金の半分と多くの持ち物を失う。その代わり、経験値とゴールドが1.5倍。街でだけ切り替えられる。'))] : []),
            h('div', { class: 'field' }, h('label', {}, '戦闘のエフェクト'), chips('effects', [['normal', '通常'], ['fast', '2倍速'], ['off', '省略']])),
            h('div', { class: 'field' }, h('label', {}, '効果音'), chips('sound', [[true, 'ON'], [false, 'OFF']])),
            h('div', { class: 'field' }, h('label', {}, 'BGMの音量'), chips('bgm', [[0, '切'], [1, '小'], [2, '中'], [3, '大']])),
            h('div', { class: 'field' }, h('label', {}, 'メッセージの速さ(攻撃・宝箱などを1つずつ見せる間隔)'), chips('msgSpeed', [[0, '一瞬'], [1, 'はやい'], [2, 'ふつう'], [3, 'ゆっくり']])),
            h('div', { class: 'field' }, h('label', {}, '自動戦闘を止めるHP'), chips('autoStop', [[20, '20%'], [35, '35%'], [50, '50%']])),
            h('div', { class: 'field' }, h('label', {}, 'コントローラーの振動'), chips('haptics', [[true, 'ON'], [false, 'OFF']])),
            h('div', { class: 'field' }, h('label', {}, 'スマホの振動(Androidなど。iPhoneのSafariは非対応)'), chips('vibrate', [[true, 'ON'], [false, 'OFF']])),
            h('p', { class: 'note' }, '設定は、この端末に自動で保存されます。')),
        buttons: [{ text: '閉じる', value: true, cls: 'primary' }],
    });
    refresh();
}

function showGuide() { return showStory('操作ガイド', GUIDE); }

// ---------- メニュー(☰) ----------
async function showMenu() {
    const s = G.snap;
    if (!s || s.state === 'Title') return;
    const items = [];
    const add = (id, label, ic) => items.push({ id, label, uiIcon: ic });
    add('items', '持ち物を使う', 'icon_inventory');
    add('party', '冒険者・装備', 'icon_equip');
    add('spell', '呪文を唱える', 'icon_magic');
    if (s.state === 'Dungeon') { add('map', '全体マップ', 'icon_map'); if (s.dungeon.stairsKnown) add('auto', '出口(階段)へ自動移動', 'icon_stairs'); }
    add('log', 'ログを見る', 'icon_item');
    if (s.state !== 'Battle') { add('save', 'セーブする', 'icon_save'); add('load', 'ロードする', 'icon_load'); }
    add('settings', '設定', 'icon_torch');
    add('guide', '操作ガイド', 'icon_key');
    add('title', 'タイトルへ(セーブしていない内容は消えます)', 'icon_move');
    const id = await pickDialog('メニュー', items, { okText: '選ぶ' });
    switch (id) {
        case 'items': return useItemFlow();
        case 'party': return equipFlow();
        case 'spell': return fieldSpellFlow();
        case 'map': return showMap();
        case 'auto': return act('autoStairs');
        case 'log': return showFullLog();
        case 'save': return act('save');
        case 'load': return act('load');
        case 'settings': return showSettings();
        case 'guide': return showGuide();
        case 'title': if (await confirmBox('タイトルへ', 'タイトルに戻ります。セーブしていない内容は消えます。よろしいですか?')) location.reload();
    }
}

// ---------- 開始画面・キャラクター作成 ----------
function showTitle() {
    const menu = $('title-menu');
    menu.replaceChildren();
    const add = (label, fn, disabled) => menu.append(h('button', { disabled, onclick: () => { SND.unlock(); SND.play('ui'); fn(); } }, label));
    add('ゲームを始める', createFlow);
    add(G.hasSave ? 'つづきから' : 'つづきから(セーブなし)', () => { const r = act('load'); }, !G.hasSave);
    add('設定', showSettings);
    add('操作ガイド', showGuide);
    add('クレジット', () => showStory('クレジット', STORY_CREDITS));
    if (window.installPrompt) add('アプリとして追加', async () => { const p = window.installPrompt; window.installPrompt = null; await p.prompt(); showTitle(); });
    $('title-foot').textContent = T(/iPhone|iPad|iPod/.test(navigator.userAgent) ? 'iPhone: Safariの共有ボタン →「ホーム画面に追加」で、アプリのように遊べます' : '');
    $('title').hidden = false;
    $('main').hidden = true;
}

async function createFlow() {
    G.musicOverride = 'create'; updateMusic();
    try { return await createFlowInner(); } finally { G.musicOverride = null; updateMusic(); }
}

async function createFlowInner() {
    const info = api('createInfo').data;
    const st = { name: '', raceId: info.races[0].id, faceIdx: 0, added: new Array(7).fill(0), job: '戦士', personality: '普通' };
    const faceCodes = ['', ...info.races.map(r => 'R' + r.id), ...info.jobFaces.map(j => 'J' + j)];
    const base = () => info.races.find(r => r.id === st.raceId).baseStats;
    const stats = () => base().map((b, i) => b + st.added[i]);
    const remaining = () => info.bonusPoints - st.added.reduce((a, b) => a + b, 0);
    const meets = (job, s) => job === '戦士' ? s[0] >= 10 : job === '魔法使い' ? s[4] >= 11 : job === '僧侶' ? s[5] >= 11 : s[2] >= 10 && s[3] >= 10;
    const auto = () => {
        st.added = new Array(7).fill(0);
        const order = st.job === '戦士' ? [0, 1] : st.job === '魔法使い' ? [4, 1] : st.job === '僧侶' ? [5, 1] : [2, 3, 1];
        for (const i of order.slice(0, -1)) while (!meets(st.job, stats()) && remaining() > 0 && base()[i] + st.added[i] < info.maxValue) st.added[i]++;
        while (remaining() > 0 && base()[1] + st.added[1] < info.maxValue) st.added[1]++;
    };
    auto();
    const faceUrl = () => { const c = faceCodes[st.faceIdx]; return c === '' ? `img/face/race_${st.raceId}.webp` : c[0] === 'R' ? `img/face/race_${c.slice(1)}.webp` : `img/face/job_${c.slice(1)}.webp`; };
    const valid = () => remaining() === 0 && meets(st.job, stats());
    const build = () => {
        const nameIn = h('input', { type: 'text', value: st.name, placeholder: '名もなき勇者', maxlength: 12, oninput: e => { st.name = e.target.value; } });
        const s = stats();
        return h('div', {},
            h('div', { class: 'field' }, h('label', {}, '名前'), nameIn),
            h('div', { class: 'field' }, h('label', {}, '種族'), h('div', { class: 'chips' }, info.races.map(r => h('div', { class: 'chip' + (st.raceId === r.id ? ' sel' : ''), onclick: () => { st.raceId = r.id; auto(); updateModal(); } }, r.name)))),
            h('div', { class: 'field' }, h('label', {}, '顔(◀▶で変える)'),
                h('div', { class: 'face-pick' }, h('button', { onclick: () => { st.faceIdx = (st.faceIdx + faceCodes.length - 1) % faceCodes.length; updateModal(); } }, '◀'), h('img', { src: faceUrl(), alt: '' }), h('button', { onclick: () => { st.faceIdx = (st.faceIdx + 1) % faceCodes.length; updateModal(); } }, '▶'),
                    h('span', { class: 'note' }, faceCodes[st.faceIdx] === '' ? '種族の顔' : faceCodes[st.faceIdx][0] === 'R' ? info.races.find(r => 'R' + r.id === faceCodes[st.faceIdx]).name + 'の顔' : faceCodes[st.faceIdx].slice(1) + 'の絵'))),
            h('div', { class: 'field' }, h('label', {}, `能力値(残りポイント: ${remaining()})`),
                info.statNames.map((n, i) => h('div', { class: 'stat-row' }, h('span', {}, n),
                    h('button', { onclick: () => { if (st.added[i] > 0) { st.added[i]--; updateModal(); } } }, '−'),
                    h('span', { class: 'v' }, s[i]),
                    h('button', { onclick: () => { if (remaining() > 0 && s[i] < info.maxValue) { st.added[i]++; updateModal(); } } }, '+'))),
                h('button', { style: 'margin-top:4px', onclick: () => { auto(); updateModal(); } }, 'おまかせ')),
            h('div', { class: 'field' }, h('label', {}, '職業(条件を満たすものだけ選べる)'), h('div', { class: 'chips' }, info.jobs.map(j => h('div', { class: 'chip' + (st.job === j.name ? ' sel' : '') + (meets(j.name, s) ? '' : ' disabled'), onclick: () => { st.job = j.name; auto(); updateModal(); } }, meets(j.name, s) ? j.name : `${j.name}(${j.requirement})`)))),
            h('div', { class: 'field' }, h('label', {}, '性格'), h('div', { class: 'chips' }, info.personalities.map(p => h('div', { class: 'chip' + (st.personality === p.name ? ' sel' : ''), onclick: () => { st.personality = p.name; updateModal(); } }, p.name))),
                h('div', { class: 'note', style: 'margin-top:4px' }, info.personalities.find(p => p.name === st.personality).description)));
    };
    const r = await new Promise(resolve => {
        const entry = {
            title: 'キャラクター作成', wide: true, body: build, resolve,
            buttons: [{ text: 'やめる', value: null }, { text: 'おまかせで始める', value: 'default' }, { text: '冒険を始める', cls: 'primary', onClick: () => { if (valid()) closeDialog('custom'); else toast('ポイントを使い切り、職業の条件を満たしてください'); } }],
        };
        Modal.stack.push(entry); renderModal();
    });
    if (r === 'custom') act('newCustom', { name: st.name.trim() || '名もなき勇者', raceId: st.raceId, job: st.job, stats: stats(), personality: st.personality, face: faceCodes[st.faceIdx] });
    else if (r === 'default') act('newDefault');
}
