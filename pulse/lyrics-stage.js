'use strict';
// Typography is independent of the chart engine. AUTO timing is explicitly approximate.
(()=>{
  const byId=id=>document.getElementById(id);
  const stored=(()=>{try{return JSON.parse(localStorage.getItem('pulse-lyric-stage-v1'))||{};}catch{return {};}})();
  const settings={visible:true,motion:!matchMedia('(prefers-reduced-motion: reduce)').matches,motionPower:90,font:'auto',color:'auto',...stored};
  settings.motionPower=Math.max(0,Math.min(100,Number.isFinite(Number(settings.motionPower))?Number(settings.motionPower):90));
  const palette=['#dcff83','#c2b1ff','#8ee9f4','#ffc1dd'];
  const fonts={clean:'"Bahnschrift","Hiragino Sans","Yu Gothic UI",sans-serif',serif:'"Yu Mincho","Hiragino Mincho ProN",serif',bold:'"Arial Black","Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif'};
  const panel=document.createElement('section');panel.id='kineticLyrics';panel.className='kinetic-lyrics';panel.setAttribute('aria-label','再生中の歌詞');
  panel.innerHTML='<div class="lyric-meta"><span id="kineticMode">LYRICS</span><span class="lyric-controls"><button id="lyricPrev" aria-label="歌詞を1行戻す">‹</button><span id="lyricShift">±0 行</span><button id="lyricNext" aria-label="歌詞を1行進める">›</button></span></div><div class="lyric-viewport"><div id="lyricEcho" class="lyric-echo" aria-hidden="true"></div><div id="kineticCurrent" class="kinetic-current"></div></div><div id="kineticNext" class="kinetic-next"></div><div class="lyric-beat-line" aria-hidden="true"><i></i></div>';
  byId('playScreen').insertBefore(panel,document.querySelector('.play-layout'));
  const interlude=document.createElement('div');interlude.className='interlude-notes';interlude.setAttribute('aria-hidden','true');panel.append(interlude);
  const musicNotes=Array.from({length:9},(_,i)=>{const note=document.createElement('span');note.textContent=['♪','♫','♬'][i%3];interlude.append(note);return note;});
  const glow=new PulseLyricGlow(panel);
  const controls=document.createElement('div');controls.className='lyric-design-controls';
  controls.innerHTML='<label>歌詞の書体<select id="lyricFont"><option value="auto">フレーズごとに切り替え</option><option value="clean">シャープ</option><option value="serif">明朝・シネマ</option><option value="bold">太字・ライブ</option></select></label><label>歌詞の色<select id="lyricColor"><option value="auto">フレーズごとに切り替え</option><option value="lime">ライム</option><option value="violet">紫</option><option value="white">白</option></select></label><label class="lyric-motion-check"><input id="lyricMotion" type="checkbox">拍に合わせた文字の動き・発光</label><p>音声から一致した歌詞の表示時刻を推定しています。未一致の行は自動表示しません。ずれる場合は下の秒数で調整するかLRCを読み込めます。文字の動きは拍に合わせた演出です。</p>';
  const modal=byId('lyricsDialog');modal.insertBefore(controls,byId('lyricsStatus'));
  const motionControl=document.createElement('label');motionControl.className='lyric-motion-power';motionControl.innerHTML='文字の動きの強さ <output id="lyricMotionPowerOutput"></output><input id="lyricMotionPower" type="range" min="0" max="100" step="5">';controls.insertBefore(motionControl,controls.querySelector('p'));
  const toggle=document.createElement('button');toggle.id='lyricStageToggle';document.querySelector('.lyric-strip').insertBefore(toggle,byId('lyricCurrent'));
  function save(){try{localStorage.setItem('pulse-lyric-stage-v1',JSON.stringify(settings));}catch{}}
  function apply(){panel.hidden=!settings.visible;byId('lyricFont').value=settings.font;byId('lyricColor').value=settings.color;byId('lyricMotion').checked=settings.motion;byId('lyricMotionPower').value=settings.motionPower;byId('lyricMotionPowerOutput').textContent=settings.motionPower+'%';toggle.textContent=settings.visible?'歌詞を隠す':'歌詞を表示';toggle.setAttribute('aria-pressed',settings.visible?'true':'false');}
  toggle.addEventListener('click',()=>{settings.visible=!settings.visible;save();apply();});
  for(const [id,key] of [['lyricFont','font'],['lyricColor','color']])byId(id).addEventListener('change',e=>{settings[key]=e.target.value;save();lastIndex=-999;});
  byId('lyricMotion').addEventListener('change',e=>{settings.motion=e.target.checked;save();});
  byId('lyricMotionPower').addEventListener('input',e=>{settings.motionPower=Number(e.target.value);save();byId('lyricMotionPowerOutput').textContent=settings.motionPower+'%';});
  let trackId=null,autoLines=[],lastIndex=-999,glyphs=[],shift=0,lastTrack=null,lastSource=null,segments=[],enteredAt=-Infinity,fit=1,measuredWidth=0,needsMeasure=true;
  const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter('ja',{granularity:'grapheme'}):null;
  const chars=text=>segmenter?[...segmenter.segment(text)].map(s=>s.segment):Array.from(text);
  // Without measured timestamps, show full lyrics in the dialog rather than
  // guessing singing positions from song length and line character counts.
  function autoTimeline(track){return [];}
  function changeShift(amount){shift+=amount;lastIndex=-999;byId('lyricShift').textContent=`${shift>0?'+':shift<0?'':'±'}${shift} 行`;}
  byId('lyricPrev').addEventListener('click',()=>changeShift(-1));byId('lyricNext').addEventListener('click',()=>changeShift(1));
  function display(line,index){
    const text=line?.text||'♪';
    const current=byId('kineticCurrent');current.replaceChildren();segments=chars(text);glow.resetLine();
    glyphs=segments.map((letter,i)=>{const span=document.createElement('span');span.className='lyric-glyph';span.textContent=letter===' '?'\u00a0':letter;current.append(span);return span;});
    current.setAttribute('aria-label',text);glyphs.forEach(g=>g.setAttribute('aria-hidden','true'));
    const family=settings.font==='auto'?['clean','clean','serif','clean','bold','serif'][Math.max(0,index)%6]:settings.font;
    current.style.fontFamily=fonts[family]||fonts.clean;
    const color=settings.color==='auto'?palette[Math.max(0,index)%palette.length]:settings.color==='lime'?palette[0]:settings.color==='violet'?palette[1]:'#f1f3f8';
    panel.style.setProperty('--lyric-accent',color);byId('lyricEcho').textContent=text;byId('lyricEcho').style.fontFamily=current.style.fontFamily;
    enteredAt=app.state==='playing'?clock():-Infinity;needsMeasure=true;
    lastIndex=index;
  }
  function frame(){
    requestAnimationFrame(frame);
    if(typeof app==='undefined'||app.screen!=='play'||!app.game)return;
    if(trackId!==app.track.id||lastTrack!==app.game){trackId=app.track.id;lastTrack=app.game;autoLines=autoTimeline(app.track);shift=0;lastIndex=-999;lastSource=null;byId('lyricShift').textContent='±0 行';}
    const synced=typeof timedLyrics!=='undefined'&&timedLyrics.length>0,lines=synced?timedLyrics:autoLines;
    if(lastSource!==lines){lastSource=lines;lastIndex=-999;}
    const songTime=clock()-Core.LEAD,t=songTime-(Number(lyricOffsets[app.track.id])||0);
    let raw=-1;for(let i=0;i<lines.length&&lines[i].time<=t;i++)raw=i;
    const index=raw<0&&shift<=0?-1:Math.min(lines.length-1,Math.max(0,raw+shift));
    byId('kineticMode').textContent=synced?(lrcFiles[app.track.id]?'LRC SYNC':'音声解析 / 時刻は推定'):'歌詞の全文は ♫ 歌詞 から';
    if(index!==lastIndex){display(lines[index],index);byId('kineticNext').textContent=lines[index+1]?.text||(index<0?'♪' :'♪');}
    if(!settings.visible){glow.bind(app.game);glow.pending=[];return;}
    const beat=60/app.track.bpm,phase=((Math.max(0,songTime)%beat)/beat),pulse=settings.motion&&t>=0?Math.exp(-phase*6):0;
    const betweenLines=!lines[index]?.text?.trim();panel.classList.toggle('is-interlude',betweenLines);
    interlude.hidden=!betweenLines;
    if(betweenLines){
      const dancing=settings.motion&&preferences.effects&&songTime>=0,cycle=Math.max(0,songTime)/beat,intensity=preferences.effects?preferences.fxIntensity/100:0;
      musicNotes.forEach((note,i)=>{const travel=dancing?((cycle*.09+i*.137)%1):.5,wave=dancing?Math.sin(cycle*.8+i*1.7):0;
        note.style.left=(8+i*10.5)+'%';note.style.top=(48+(travel-.5)*34)+'%';note.style.opacity=String(.18+intensity*(.22+Math.sin(travel*Math.PI)*.3));
        note.style.color=settings.color==='auto'?`hsl(${(i*42+(dancing?cycle*18:0))%360} 90% 78%)`:'var(--lyric-accent)';
        note.style.transform=`translate(-50%,-50%) rotate(${wave*12}deg) scale(${.72+(i%3)*.12+(dancing?pulse*.35:0)})`;
      });
    }
    const start=lines[index]?.time??0,end=lines[index+1]?.time??app.track.duration,progress=index>=0?Math.max(0,Math.min(1,(t-start)/Math.max(.2,end-start))):0;
    glow.render({session:app.game,now:clock(),progress,glyphs,settings,prefs:preferences,beat,songTime});
    panel.style.setProperty('--lyric-beat',pulse.toFixed(3));panel.style.setProperty('--lyric-sweep',(progress*100).toFixed(2)+'%');
    const current=byId('kineticCurrent'),viewport=panel.querySelector('.lyric-viewport');
    if(needsMeasure||viewport.clientWidth!==measuredWidth){measuredWidth=viewport.clientWidth;fit=Math.min(1,Math.max(.38,(measuredWidth-24)/(current.offsetWidth*1.22+12)));needsMeasure=false;}
    const gain=settings.motion?settings.motionPower/100:0,compact=innerHeight<540&&innerWidth>innerHeight;
    const entryAge=Math.max(0,clock()-enteredAt),entering=Number.isFinite(enteredAt)&&entryAge<.65?Math.exp(-entryAge*8):0;
    const judgePulse=settings.motion&&preferences.effects?glow.charge.pulse(clock())*preferences.fxIntensity/100:0;
    const cycle=Math.max(0,songTime)/beat,angle=cycle*Math.PI*2;
    const wholeScale=(1+gain*(pulse*.16+judgePulse*.045))*fit;
    const driftX=gain*(Math.sin(angle*.5)*3+entering*(index%2?1:-1)*60),driftY=-gain*(pulse*3+entering*9);
    current.style.transform=`translate3d(${driftX}px,${driftY}px,0) rotate(${Math.sin(angle)*gain*.45}deg) scale(${wholeScale})`;
    current.style.opacity=String(1-entering*gain*.35);
    byId('lyricEcho').style.transform=`translate3d(${gain*(Math.sin(angle*.5)*22-entering*65)}px,${-gain*pulse*5}px,0) scale(${1+gain*pulse*.14})`;
    byId('kineticNext').style.transform=`translateX(${gain*Math.sin(angle*.5)*5}px)`;
    for(let i=0;i<glyphs.length;i++){
      const distance=Math.abs(progress*glyphs.length-i),lit=(glow.charges[i]||0)>0;
      glyphs[i].classList.toggle('lit',lit);
      const wave=Math.sin(angle-i*.6),characterPulse=Math.exp(-(((cycle-i*.055)%1+1)%1)*5);
      const boost=1+glow.charge.level*.055,focus=distance<2.5?Math.sin(Math.max(0,1-distance/2.5)*Math.PI/2):0;
      const lift=gain*(Math.max(0,wave)*9+focus*(3+pulse*4))*(compact?.65:1);
      const sizeX=1+gain*characterPulse*.11*boost,sizeY=1+gain*characterPulse*.29*boost;
      const spin=gain*wave*(index%3===2?5:2.5),sway=gain*wave*(index%3===1?3:1);
      glyphs[i].style.transform=`translate3d(${sway}px,${-lift}px,0) rotate(${spin}deg) scale(${sizeX},${sizeY})`;
    }
  }
  apply();requestAnimationFrame(frame);
})();
