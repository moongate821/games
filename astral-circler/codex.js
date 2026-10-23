// 魔法陣の説明書:合成・設置・連鎖を達成すると項目が開放される(進行は localStorage `asc_codex`)
const CDX_TIPS={
 helios:'道に沿って細長く置くと、一直線に並んだ敵をまとめて貫く。焼かれた敵は防御が下がり、足元に炎が残る。',
 entropy:'道の曲がり角に置くと敵が引き寄せられて固まり、周期的な凍結で一気に止まる。止めている間に他の陣で仕留める。',
 gamma:'密集した敵に強い。狙った敵を撃つと、周りの敵へ光の針が放射状に飛ぶ。',
 magnetar:'敵を吸い寄せながら雷で痺れさせる。足止め役として、前線に置くと頼りになる。',
 cinferno:'範囲の敵を遅くし、燃焼ダメージを一気に稼ぐ。長く足止めできる場所が向いている。',
 supernova:'単体に大爆発を起こし、跡に炎を残す。ボスや硬い敵の足元に置きたい。',
 zero:'強力な減速と、短い間隔での凍結。ボスの進行を遅らせる切り札になる。',
 kaleido:'電光が最大6体まで連鎖する。数の多いウェーブを一掃しやすい。',
 chrono:'敵を大きく押し戻して遅くする。後続を一か所に溜めて、他の陣に任せる使い方が強い。',
 aurora:'5本のビームが同時に敵を焼く。群れに強く、プリズムが隣にあるとさらに増える。',
 steam:'先頭の敵に範囲爆発を起こし、当たった敵を鈍足にする。突破してきた先頭を止めるのに向く。',
 hyper:'重ねた陣の効果をそのまま使い、狙う敵の数を増やして射程を1.5倍にする。',
 photon:'単体を持続照射。当て続けるほど威力が上がるので、硬い敵やボスに。',
 plasma:'電撃が敵から敵へ跳ねる。微スタンつき。数の多い敵に。',
 void:'範囲の敵を大幅に減速し、少しずつ引き戻す。他の陣の火力を活かす土台。',
 solar:'燃焼ゾーンを設置。継続ダメージに加えて敵の防御を下げる。',
 crystal:'範囲に冷気。同じ敵に3回当たると完全凍結する。',
 tachyon:'周期的な衝撃波で敵を押し戻す。時間稼ぎの要。',
 prism:'自分は攻撃しない。隣に置いた陣の標的数と射程を増やす。合成の素材としても重要。'
};
const CDX_HYPER_TIP={void:'ヴォイド版:引き寄せと減速の範囲が1.5倍に広がり、遠くの敵まで固める。',solar:'ソーラー版:燃焼ゾーンを2か所に設置して広く焼く。',crystal:'クリスタル版:冷気の範囲が1.5倍になり、広い範囲を凍結させる。',tachyon:'タキオン版:衝撃波の範囲が1.5倍になり、敵をまとめて押し戻す。'};
const CHAIN_INFO=[null,
 {n:'CHAIN!',need:8,d:'連鎖を8回つなぐと開放。全陣から波紋が広がり、ファンファーレが鳴る。'},
 {n:'SUPER CHAIN!!',need:20,d:'20連鎖。画面の縁が光り、波紋が大きくなる。'},
 {n:'ULTRA CHAIN!!!',need:36,d:'36連鎖。陣から敵へ稲妻が走る。'},
 {n:'MAXIMUM CHAIN',need:60,d:'60連鎖。画面いっぱいの巨大な魔法陣が全敵を襲う(12秒に1回)。隣り合う陣を増やして連結を長くつなごう。'}];
const CODEX=[];
Object.entries(FD).forEach(([k,f])=>{if(k!=='hyper')CODEX.push({sec:'f',key:'f:'+k,a:f.from[0],b:f.from[1],res:k,def:f,tip:CDX_TIPS[k]})});
['void','solar','crystal','tachyon'].forEach(sb=>CODEX.push({sec:'f',key:'f:hyper:'+sb,a:'prism',b:sb,res:'hyper',
 def:{...FD.hyper,desc:'重ねた陣の効果を使い、狙う敵の数が増え、射程が1.5倍になる。',col:TD[sb].col,el:TD[sb].el,range:TD[sb].range,sides:TD[sb].sides,n:'ハイパー・リフレクター('+TD[sb].n.split('・')[0]+')'},tip:CDX_TIPS.hyper+' '+CDX_HYPER_TIP[sb]}));
Object.entries(TD).forEach(([k,d])=>CODEX.push({sec:'b',key:'b:'+k,res:k,def:d,tip:CDX_TIPS[k]}));
for(let i=1;i<=4;i++)CODEX.push({sec:'c',key:'c:'+i,lv:i,def:{n:CHAIN_INFO[i].n,desc:CHAIN_INFO[i].d}});
const CDX_SEC={f:'合成',b:'魔法陣',c:'連鎖'};
function cdxGet(){try{return new Set(JSON.parse(localStorage.getItem('asc_codex')||'[]'))}catch(e){return new Set()}}
function codexAdd(key){const s=cdxGet();if(s.has(key))return false;s.add(key);try{localStorage.setItem('asc_codex',JSON.stringify([...s]))}catch(e){}return true}
function codexNew(key){
 const e=CODEX.find(x=>x.key===key);if(!e)return;
 const W=cv.width,H=cv.height,name=e.def.n,s=cdxGet(),sec=CODEX.filter(x=>x.sec===e.sec),n=sec.filter(x=>s.has(x.key)).length;
 addFx(2.2,(c,k)=>{c.save();c.globalAlpha=k<.1?k*10:1-Math.pow((k-.1)/.9,2);c.translate(W/2,H*.4);
  c.fillStyle='#000b';c.fillRect(-250,-34,500,68);c.strokeStyle='#ffd34d';c.lineWidth=2;c.strokeRect(-250,-34,500,68);
  c.textAlign='center';c.textBaseline='middle';c.fillStyle='#ffd34d';c.font='700 14px sans-serif';c.fillText(`説明書に記録(${CDX_SEC[e.sec]} ${n}/${sec.length})`,0,-14);
  c.fillStyle='#fff';c.font='900 24px sans-serif';c.shadowColor='#ffd34d';c.shadowBlur=12;c.fillText(name,0,12);c.restore()});
 [0,.09,.18].forEach((d,i)=>tone('triangle',[784,988,1319][i],d,.35,.04));
 if(e.sec==='f'&&sec.every(x=>s.has(x.key)))setTimeout(()=>msg('合成コンプリート!  すべての組み合わせを発見した'),1200);
}
// ---- 画面 ----
let cdxTab='f',cdxOpen=false,cdxIcons=[];
function cdxIcon(parent,def,locked,fused){
 const cvs=document.createElement('canvas');cvs.width=cvs.height=80;parent.appendChild(cvs);cdxIcons.push({c:cvs.getContext('2d'),def,locked,fused});
}
function openCodex(){
 cdxOpen=true;paused=true;$('#codex').style.display='block';renderCodex();
}
function closeCodex(){cdxOpen=false;paused=false;$('#codex').style.display='none'}
function renderCodex(){
 const s=cdxGet(),g=$('#cdxgrid');g.innerHTML='';cdxIcons=[];
 const total=CODEX.length,got=CODEX.filter(x=>s.has(x.key)).length;
 $('#cdxprog').textContent=`発見 ${got} / ${total}`;
 $('#cdxbar i').style.width=(got/total*100)+'%';
 document.querySelectorAll('.cdxtab').forEach(b=>{const sec=CODEX.filter(x=>x.sec===b.dataset.s);b.textContent=`${CDX_SEC[b.dataset.s]} ${sec.filter(x=>s.has(x.key)).length}/${sec.length}`;b.classList.toggle('on',b.dataset.s===cdxTab)});
 for(const e of CODEX.filter(x=>x.sec===cdxTab)){
  const ok=s.has(e.key),el=document.createElement('div');el.className='cdxcard'+(ok?'':' lock');
  const row=document.createElement('div');row.className='cdxrow';
  if(e.sec==='f'){
   cdxIcon(row,TD[e.a],!ok&&false,false);
   if(ok){const p=document.createElement('span');p.textContent='+';row.appendChild(p);cdxIcon(row,TD[e.b],false,false);const q=document.createElement('span');q.textContent='=';row.appendChild(q);cdxIcon(row,e.def,false,true)}
   else{const p=document.createElement('span');p.textContent='+';row.appendChild(p);cdxIcon(row,null,true,false);const q=document.createElement('span');q.textContent='=';row.appendChild(q);cdxIcon(row,null,true,false)}
  }else if(e.sec==='b')cdxIcon(row,e.def,!ok,false);
  else cdxIcon(row,null,!ok,false);
  el.appendChild(row);
  const t=document.createElement('div');t.className='cdxtxt';
  if(e.sec==='f')t.innerHTML=ok?`<b>${e.def.n}</b><em>${e.def.el.map(x=>ELN[x]).join('・')||'支援'}</em><p>${e.def.desc}</p><p class="tip">${e.tip}</p>`:`<b>？？？？？</b><p class="hint">ヒント:${TD[e.a].n}に、別の陣を重ねてみよう。</p>`;
  else if(e.sec==='b')t.innerHTML=ok?`<b>${e.def.n}</b><small>${e.def.sub}</small><em>${e.def.el.map(x=>ELN[x]).join('・')||'支援'}</em><p>${e.def.desc}</p><p class="tip">${e.tip}</p>`:`<b>？？？？？</b><p class="hint">この陣を一度設置すると開放される。</p>`;
  else t.innerHTML=ok?`<b>${e.def.n}</b><p>${e.def.desc}</p>`:`<b>？？？？？</b><p class="hint">連鎖を${CHAIN_INFO[e.lv].need}回つなぐと開放される。</p>`;
  el.appendChild(t);g.appendChild(el);
 }
}
function drawCodexIcons(t){
 for(const ic of cdxIcons){const c=ic.c;c.clearRect(0,0,80,80);
  if(ic.locked||!ic.def){c.save();c.strokeStyle='#4a5a9a';c.lineWidth=2;c.setLineDash([4,4]);c.lineDashOffset=-t*10;c.beginPath();c.arc(40,40,28,0,TAU);c.stroke();c.setLineDash([]);c.fillStyle='#6a7ab8';c.font='900 30px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('?',40,42);c.restore();continue}
  const D=ic.def;drawMagic(c,40,40,ic.fused?30:26,D.col,t,{sides:D.sides,lv:1,fused:ic.fused,col2:D.col2,sides2:D.sides2})}
}
document.addEventListener('keydown',e=>{if(e.key==='h'||e.key==='H'){cdxOpen?closeCodex():openCodex()}else if(e.key==='Escape'&&cdxOpen)closeCodex()});
(function loop(){if(cdxOpen)drawCodexIcons(performance.now()/1000);requestAnimationFrame(loop)})();
$('#cdxbtn').onclick=openCodex;$('#cdx2').onclick=openCodex;$('#cdxclose').onclick=closeCodex;
document.querySelectorAll('.cdxtab').forEach(b=>b.onclick=()=>{cdxTab=b.dataset.s;renderCodex()});
