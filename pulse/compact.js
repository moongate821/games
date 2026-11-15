'use strict';
(()=>{
  const strip=document.querySelector('.lyric-strip'),mode=document.createElement('span');mode.className='compact-mode';strip.prepend(mode);
  const auto=document.createElement('span');auto.className='compact-auto';strip.append(auto);
  const settings=document.createElement('button');settings.id='playSettings';settings.textContent='⚙';settings.setAttribute('aria-label','プレイ設定');strip.append(settings);
  settings.addEventListener('click',()=>{if(app.state==='playing')pause();$('settingsDialog').showModal();});
  // Fine adjustments belong in the lyrics dialog, leaving only the song on stage.
  document.querySelector('.lyric-design-controls').append(document.querySelector('.lyric-controls'));
  const offset=document.createElement('label');offset.className='lyric-motion-power';offset.innerHTML='歌詞の表示タイミング <output id="lyricOffsetOutput"></output><input id="lyricOffset" type="range" min="-8" max="8" step="0.1"><small>＋で歌詞を遅く、−で早く表示（曲ごとに保存）</small>';
  document.querySelector('.lyric-design-controls').append(offset);
  function refreshOffset(){const value=Number(lyricOffsets[app.track.id])||0;$('lyricOffset').value=value;$('lyricOffsetOutput').textContent=(value>0?'+':'')+value.toFixed(1)+'秒';}
  $('lyricsDialog').addEventListener('toggle',refreshOffset);refreshOffset();
  $('lyricOffset').addEventListener('input',e=>{lyricOffsets[app.track.id]=Number(e.target.value);save('pulse-lyric-offsets-v1',lyricOffsets);refreshOffset();app.lyricIndex=-1;});
  function update(){requestAnimationFrame(update);if(app.screen!=='play')return;mode.textContent=app.lanes+' KEY';auto.textContent=app.auto?'AUTO':'';$('mobileGroove').style.setProperty('--groove',(app.game?.groove||0)+'%');}
  requestAnimationFrame(update);
})();
