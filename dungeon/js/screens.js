// 足りない画面(2026-10-01): 持ち物一覧(分類・効果・所持数・使う/装備)、詳細ステータス(装備補正・状態異常・耐性)、NPCとの会話。
// 内容はC#(GameSession.ItemEntries / EquipPreview / MemberDetail / NpcTalk)が作る。ここは見せるだけ。
'use strict';

const ITEM_GROUPS = ['すべて', '武器', '防具', '装飾・特殊', '道具', '巻物', '素材'];

// ---------- 持ち物一覧 ----------
async function inventoryScreen() {
    if (G.snap && (G.snap.state === 'Battle' || G.snap.state === 'GameOver')) return;
    let group = 'すべて', selId = null, msg = '';
    const entry = {
        title: '持ち物', wide: true, className: 'inv',
        buttons: [],
        body: () => {
            const entries = api('items', { group }).data;
            if (selId === null || !entries.some(e => e.id === selId)) selId = entries.length ? entries[0].id : null;
            const sel = entries.find(e => e.id === selId) || null;
            const tabs = h('div', { class: 'inv-tabs' }, ITEM_GROUPS.map(g => h('button', {
                class: 'abtn' + (g === group ? ' primary' : ''),
                onclick: () => { group = g; selId = null; msg = ''; updateModal(); },
            }, g)));
            const list = h('div', { class: 'list inv-list' }, entries.map(e => h('div', {
                class: 'row' + (e.id === selId ? ' sel' : ''),
                onclick: () => { selId = e.id; msg = ''; updateModal(); },
            },
            itemIcon(e.id),
            h('div', { class: 'grow' }, `${e.name}  ×${e.count}`, h('div', { class: 'sub' }, e.equippedBy.length ? `装備中: ${e.equippedBy.join('・')}` : e.group)),
            h('div', { class: 'price', style: 'font-size:12px;color:#d8c8a4' }, e.rarity))));
            if (!entries.length) list.append(h('div', { class: 'note' }, 'この分類の持ち物は、ありません。'));
            const detail = h('div', { class: 'inv-detail' });
            if (sel) {
                detail.append(
                    h('div', { class: 'inv-head' }, itemIcon(sel.id), h('div', {},
                        h('div', { style: 'font-weight:700;color:var(--gold);font-size:17px' }, sel.name),
                        h('div', { class: 'note' }, `${sel.group}  /  ${sel.rarity}  /  所持数 ${sel.count}`))),
                    h('div', { class: 'h3' }, '効果'),
                    h('div', { class: 'msg' }, sel.effect));
                if (sel.equippedBy.length) detail.append(h('div', { class: 'note', style: 'margin-top:6px' }, `装備している人: ${sel.equippedBy.join('・')}`));
                if (sel.canEquip) {
                    detail.append(h('div', { class: 'h3', style: 'margin-top:8px' }, '着けたときの変化'));
                    for (const line of api('itemPreview', { id: sel.id }).data) detail.append(h('div', { class: 'note' }, line));
                } else if (sel.canUse) {
                    detail.append(h('div', { class: 'note', style: 'margin-top:8px' }, '「使う」で、仲間の1人を選んで使います。'));
                }
            } else {
                detail.append(h('div', { class: 'note' }, '持ち物を選ぶと、効果などが表示されます。'));
            }

            entry.buttons = [];
            if (sel && sel.canUse) entry.buttons.push({ text: '使う', cls: 'primary', onClick: () => useFromInventory(sel) });
            if (sel && sel.canEquip) entry.buttons.push({ text: '装備する', cls: 'primary', onClick: () => equipFromInventory(sel) });
            entry.buttons.push({ text: '閉じる', value: true });
            setTimeout(() => refreshModalButtons(entry), 0);
            return h('div', {}, tabs, h('div', { class: 'cols inv-cols' }, list, detail), h('div', { class: 'note', style: 'min-height:20px;margin-top:6px;color:#ffe2aa' }, msg));
        },
    };
    const useFromInventory = async sel => {
        const id = await pickDialog(`${sel.name}を、誰に使いますか?`, G.snap.party.map(m => ({ id: m.i, label: `${m.name}  Lv${m.level} ${m.job}`, sub: `HP${m.hp}/${m.maxHp} MP${m.mp}/${m.maxMp}${m.down ? ' (戦闘不能)' : ''}`, face: m.face })));
        if (id === null) return;
        const res = api('useItem', { id: sel.id, member: id });
        msg = res.msg; logMessage(res.msg); updateModal();
    };
    const equipFromInventory = async sel => {
        const preview = api('itemPreview', { id: sel.id }).data;
        const id = await pickDialog(`${sel.name}を、誰が装備しますか?`, G.snap.party.map((m, i) => ({ id: m.i, label: `${m.name}  Lv${m.level} ${m.job}`, sub: preview[i] || '', face: m.face })), { wide: true });
        if (id === null) return;
        const res = api('equip', { id: sel.id, member: id });
        msg = res.msg; logMessage(res.msg); updateModal();
    };
    await new Promise(resolve => { entry.resolve = v => { refresh(); resolve(v); }; Modal.stack.push(entry); renderModal(); });
}

// ---------- 詳細ステータス ----------
async function detailScreen(start) {
    let idx = start || 0;
    const entry = {
        title: '詳細ステータス', wide: true, className: 'detail',
        buttons: [],
        body: () => {
            const sections = api('detail', { member: idx }).data;
            const m = G.snap.party[idx];
            entry.buttons = [
                { text: '◀ 前の仲間', onClick: () => { idx = (idx + G.snap.party.length - 1) % G.snap.party.length; updateModal(); } },
                { text: '次の仲間 ▶', onClick: () => { idx = (idx + 1) % G.snap.party.length; updateModal(); } },
                { text: '閉じる', value: true },
            ];
            setTimeout(() => refreshModalButtons(entry), 0);
            return h('div', {}, h('div', { class: 'h3' }, `${m.name}`), sections.map(s => h('div', { class: 'detail-sec' },
                h('div', { class: 'detail-h' }, s.title),
                s.lines.map(l => h('div', { class: 'detail-l' + (l.startsWith('※') ? ' note' : '') }, l)))));
        },
    };
    await new Promise(resolve => { entry.resolve = v => resolve(v); Modal.stack.push(entry); renderModal(); });
}

// ---------- NPCとの会話 ----------
async function npcTalkFlow() {
    const f = G.facility;
    if (!f) return;
    const topics = api('npcTopics', { id: f.id }).data;
    const key = await pickDialog(`${f.npcName || '店の人'}と話す`, topics.map(t => ({ id: t.key, label: t.label })));
    if (key === null) return;
    const res = act('npcTalk', { id: f.id, topic: key, speaker: f.npcName || '店の人' });
    if (res && res.msg) {
        const open = res.msg.indexOf('「');
        f.speech = open >= 0 ? res.msg.slice(open + 1, -1) : res.msg;
        requestRedraw();
    }
}
