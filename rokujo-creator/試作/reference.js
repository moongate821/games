(()=>{
'use strict';
const baseWidth=1600,baseHeight=1050,preferenceKey='rokujo_creator_reference_display_v1';
const viewport=document.getElementById('displayViewport'),space=document.getElementById('frameSpace'),frame=document.getElementById('referenceGame'),toolbar=document.querySelector('.display-controls'),output=document.getElementById('viewScale');
let mode='fit',scale=1;
try{const saved=JSON.parse(localStorage.getItem(preferenceKey));if(saved&&saved.mode==='manual'&&Number.isFinite(saved.scale)&&saved.scale>=.15&&saved.scale<=2){mode='manual';scale=saved.scale;}}catch{}
function savePreference(){try{localStorage.setItem(preferenceKey,JSON.stringify({mode,scale}));}catch{}}
function redraw(){const availableWidth=document.documentElement.clientWidth,availableHeight=Math.max(150,innerHeight-toolbar.getBoundingClientRect().height);viewport.style.height=availableHeight+'px';if(mode==='fit')scale=Math.min(availableWidth/baseWidth,availableHeight/baseHeight);scale=Math.max(.15,Math.min(2,scale));frame.style.transform='scale('+scale+')';space.style.width=baseWidth*scale+'px';space.style.height=baseHeight*scale+'px';output.value=Math.round(scale*100)+'%';document.getElementById('fitView').setAttribute('aria-pressed',String(mode==='fit'));document.getElementById('actualView').setAttribute('aria-pressed',String(mode==='manual'&&scale===1));}
function viewCenter(){return {x:Math.max(0,Math.min(baseWidth,(viewport.scrollLeft+viewport.clientWidth/2-space.offsetLeft)/scale)),y:Math.max(0,Math.min(baseHeight,(viewport.scrollTop+Math.min(viewport.clientHeight,baseHeight*scale)/2)/scale))};}
function manualZoom(next){const center=viewCenter();mode='manual';scale=Math.max(.15,Math.min(2,next));redraw();viewport.scrollTo({left:space.offsetLeft+center.x*scale-viewport.clientWidth/2,top:center.y*scale-Math.min(viewport.clientHeight,baseHeight*scale)/2,behavior:'instant'});savePreference();}
document.getElementById('fitView').onclick=()=>{mode='fit';redraw();viewport.scrollTo(0,0);savePreference();};
document.getElementById('actualView').onclick=()=>manualZoom(1);
document.getElementById('zoomIn').onclick=()=>manualZoom(scale*1.25);
document.getElementById('zoomOut').onclick=()=>manualZoom(scale/1.25);
document.getElementById('fullView').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{document.getElementById('displayMessage').textContent='全画面にできない場合も、拡大・縮小で調整できます。';}};
addEventListener('resize',redraw);document.addEventListener('fullscreenchange',redraw);
const source=new URL('index.html',location.href),params=new URLSearchParams(location.search);params.set('inside-frame','1');source.search=params.toString();frame.src=source.href;redraw();
})();
