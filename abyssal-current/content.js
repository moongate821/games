/* Original creatures / Gemini cutout sheets. Rows are species, columns are rig parts. */
window.ABYSSAL_CONTENT = (() => {
  const enemyNames = ['リベット・サーディン','カッパー・ピラニア','グライド・フィッシュ','ニードル・パフ','コイル・ホース','シザー・クラブ','ドリル・シュリンプ','アンカー・ロブスター','シールド・タートル','ローラー・アイソポッド','ランタン・ジェリー','スピンドル・スクイッド','ギア・オクトパス','クリスタル・スター','ベル・アネモネ','リーフ・ドラゴン','ソー・シャーク','ハンマー・スカウト','ミラージュ・レイ','アビス・アンコウ'];
  const modes = ['school','chase','dive','burst','hover','ground','dash','ground','tank','roll','float','dash','spiral','spin','turret','wave','charge','sweep','glide','lure'];
  const enemies = enemyNames.map((name,i)=>({id:i,name,sheet:`enemies${1+Math.floor(i/5)}`,row:i%5,mode:modes[i],size:[58,64,74,62,60,70,70,80,78,70,65,80,80,65,75,80,90,86,90,78][i],hp:[2,3,2,5,3,5,3,7,9,6,3,4,6,5,7,5,7,6,6,8][i],speed:[112,92,175,66,90,65,215,50,48,130,65,195,85,105,35,115,185,140,90,55][i],score:100+i*18}));
  const bossNames = ['IRON NAUTILUS','FURNACE RAY','FROST MEDUSA','WRECK HERMIT','VERDANT HYDRA','PRISM TURTLE','ABYSSAL SPIDER','STORM SQUID','BONE DRAGON','CLOCKWORK WHALE','CROWN ANGLER','LEVIATHAN HEART'];
  const bossJP = ['鉄殻のオウムガイ','炉心マンタ','氷晶クラゲ','沈船ヤドカリ','藻海のヒドラ','結晶ガメ','深淵グモ','雷雲イカ','白骨竜','機巧クジラ','王冠アンコウ','深海機関の心臓'];
  const bosses = bossNames.map((name,i)=>({id:i,name,jp:bossJP[i],sheet:`bosses${1+Math.floor(i/3)}`,row:i%3,size:[270,300,260,275,290,285,290,300,320,330,290,350][i],hp:200+i*35,pattern:i}));
  const zoneNames = ['珊瑚の墓場','熱水の裂け目','硝子の海溝','沈没艦隊','翡翠の藻海','水晶大聖堂','暗黒の縦穴','雷鳴の海底都市','白骨回廊','機巧海底工場','王冠の宮殿','深淵の中枢'];
  const zoneEN = ['CORAL GRAVE','THERMAL RIFT','GLASS TRENCH','WRECK FLEET','JADE KELP','CRYSTAL CATHEDRAL','BLACK CHASM','THUNDER CITY','BONE CORRIDOR','CLOCKWORK WORKS','CROWN PALACE','ABYSSAL CORE'];
  const colors = ['#65dfd2','#ffad73','#9adeff','#bfa088','#89eb9c','#c1a2ff','#817bce','#7ccaff','#e9d5ac','#f3bd72','#ec91ca','#ff8986'];
  const stages = zoneNames.map((name,i)=>({id:i,name,en:zoneEN[i],color:colors[i],boss:i,sheet:`backgrounds${1+Math.floor(i/3)}`,row:i%3,props:`props${1+Math.floor(i/6)}`,propRow:i%6,duration:40+i*1.2,enemies:Array.from({length:6},(_,n)=>(i*2+n)%20)}));
  const weapons = [
    ['パルス','PULSE','#79f8e5',.13,'高速の前方連射'],
    ['ワイド','WIDE','#ffc879',.25,'5方向に広がる扇状弾'],
    ['レーザー','LASER','#8aeaff',.1,'敵を貫通する直線光線'],
    ['ホーミング','HOMING','#ff9bd1',.3,'近い敵を追う誘導ミサイル'],
    ['ウェーブ','WAVE','#b2a1ff',.2,'上下にうねる貫通波動'],
    ['ダブルヘリックス','HELIX','#7effbb',.16,'二重らせん状の双発弾'],
    ['ショットガン','SCATTER','#ff9874',.48,'近距離に強い散弾9発'],
    ['機雷','MINE','#ffe38c',.48,'接近・時間で爆発する機雷'],
    ['チェイン','CHAIN','#b4dfff',.4,'近くの敵へ連鎖する電撃'],
    ['オービット','ORBIT','#e3acff',.22,'周回する子機3機の援護射撃']
  ].map(([name,en,color,cooldown,description],id)=>({id,name,en,color,cooldown,description}));
  const sheets = {playerRig:{file:'player-parts',cols:4,rows:1,cutout:true}};
  for(let i=1;i<=4;i++){sheets[`enemies${i}`]={file:`enemies-${i}`,cols:4,rows:5,cutout:true};sheets[`bosses${i}`]={file:`bosses-${i}`,cols:4,rows:3,cutout:true};sheets[`backgrounds${i}`]={file:`backgrounds-${i}`,cols:1,rows:3,cutout:false};}
  for(let i=1;i<=2;i++)sheets[`props${i}`]={file:`props-${i}`,cols:2,rows:6,cutout:true};
  return {enemies,bosses,stages,weapons,sheets};
})();
