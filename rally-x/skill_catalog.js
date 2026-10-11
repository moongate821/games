'use strict';
// Eight families × eight modules, plus 32 two-module evolutions = 96 skills.
// The first tier has deliberately modest, specialised effects; evolutions combine them.
const SKILL_SLOTS = 8;
const SKILL_FAMILIES = [
  {id:'spark', name:'火花', color:'#ffd45a', dark:'#654514', symbol:'spear', stat:'damage', words:['火花','針','火線','燐光','尾灯','火花雨','雷針','閃光']},
  {id:'blast', name:'爆発', color:'#ff7752', dark:'#66301e', symbol:'mine', stat:'blast', words:['小爆竹','発火石','火薬箱','衝撃弾','噴火口','爆芯','火柱','誘爆輪']},
  {id:'scan', name:'走査', color:'#61e9a5', dark:'#176249', symbol:'radar', stat:'pulse', words:['短波','照準線','反射鏡','索敵点','周波針','緑光','環状波','追跡波']},
  {id:'drive', name:'走行', color:'#58caff', dark:'#18476d', symbol:'speed', stat:'speed', words:['軽量輪','補助ギア','小型タービン','滑走板','青い車軸','急加速','旋回翼','残像輪']},
  {id:'collect', name:'収集', color:'#78baff', dark:'#263d79', symbol:'magnet', stat:'pickup', words:['磁石片','吸引針','青い糸','収集灯','小型ドローン','誘導波','拾得輪','宝石探知']},
  {id:'smoke', name:'煙幕', color:'#c78cff', dark:'#4a2870', symbol:'fuel', stat:'smoke', words:['薄煙','紫ガス','噴射瓶','煙の芯','拡散弁','迷彩粉','煙の輪','紫雲']},
  {id:'guard', name:'装甲', color:'#a0ed6d', dark:'#3b662b', symbol:'shield', stat:'guard', words:['鉄片','補修板','小盾','防弾布','圧縮材','緩衝輪','反射板','鋼の芯']},
  {id:'volt', name:'出力', color:'#ff83b6', dark:'#71304e', symbol:'bolt', stat:'rate', words:['微電池','導線','赤い端子','過電流','蓄電輪','増幅管','電磁芯','高圧回路']},
];
const EXTRA_SKILLS = {};
const EXTRA_LOOK = {};
for (const f of SKILL_FAMILIES) for (let i=0;i<8;i++) {
  const k=`${f.id}${i+1}`;
  const value=+(0.012 + i*.003).toFixed(3);
  EXTRA_SKILLS[k]={name:f.words[i], desc:()=>`${f.name}系の小改造。${f.stat} +${Math.round(value*100)}%／Lv。合成素材にもなる`, passive:1, stat:f.stat, value, family:f.id};
  EXTRA_LOOK[k]={family:f.name,color:f.color,dark:f.dark,symbol:f.symbol};
}
const FUSION_RECIPES=[];
const FUSION_NAMES=['雷鳴ランス','爆裂スキャナー','ファントム・ドライブ','磁気嵐','装甲花火','紫電煙幕','回収ミサイル','鋼鉄ダッシュ','稲妻サイクロン','溶岩スピン','生命磁場','超速雷光','反射地雷','黒煙レーザー','電磁バリア','宝石爆撃','シャドー・ターボ','連鎖砲','鉄壁パルス','磁気タービン','毒煙爆破','炎上シールド','極光レーダー','電撃回収','流星ドライブ','鉄鋼爆風','スモーク・ストーム','永久機関','レーザー・マイン','オーバー・シールド','次元レール','究極連鎖'];
for(let i=0;i<32;i++) {
  const a=SKILL_FAMILIES[i%8], b=SKILL_FAMILIES[(i+1+Math.floor(i/8))%8],
    left=`${a.id}${1+Math.floor(i/8)}`, right=`${b.id}${1+Math.floor(i/8)}`, key=`fusion${i+1}`;
  FUSION_RECIPES.push({key,left,right});
  EXTRA_SKILLS[key]={name:FUSION_NAMES[i],desc:()=>`「${a.words[Math.floor(i/8)]}」+「${b.words[Math.floor(i/8)]}」。両効果を増幅し、周囲へ連鎖波`,passive:1,fusion:1,stats:[a.stat,b.stat],value:.09+i*.003,family:a.id};
  EXTRA_LOOK[key]={family:`${a.name}×${b.name}`,color:a.color,dark:b.dark,symbol:a.symbol};
}
function equippedSkills(){return Object.keys(G.w).filter(k=>G.w[k]>0 && WEAPONS[k] && !WEAPONS[k].filler);}
function allEquippedMax(){const keys=equippedSkills();return keys.length===SKILL_SLOTS && keys.every(k=>G.w[k]>=10);}
function skillStat(stat){let v=0;for(const k of equippedSkills()){const q=WEAPONS[k],n=G.w[k];if(q.stat===stat)v+=q.value*n;if(q.stats&&q.stats.includes(stat))v+=q.value*n;}return v;}
function fusionOptions(){return FUSION_RECIPES.filter(r=>lv(r.left)>0&&lv(r.right)>0&&!lv(r.key));}
