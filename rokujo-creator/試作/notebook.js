'use strict';
(function(root){
 const definitions=[
  ['networkPanel','街の設備',15],['industryPanel','工房',21],['voicesPanel','人々の声',24],['academyPanel','発明',27],['surveyPanel','測量',30],['lawPanel','基本法',37],['expeditionPanel','探査資料',43],['contactPanel','対話の紙片',49],['civicPanel','文明の歩み',56],['developmentPanel','街区の暮らし',66],['planningPanel','都市模型',67],['encounterPanel','防衛と交流',76]
 ];
 function create({getState,onSelect=()=>{}}){
  const $=id=>document.getElementById(id),host=$('fieldNotebook'),pages=$('notebookPages'),tabs=$('notebookTabs'),picker=$('notebookSelect');
  const topics=definitions.map(([id,title,phase])=>{const panel=$(id),wrap=document.createElement('div');wrap.className='notebook-page';wrap.id='notebookPage-'+id;wrap.dataset.notebookPage=id;wrap.setAttribute('role','tabpanel');wrap.setAttribute('aria-labelledby','notebookTab-'+id);wrap.tabIndex=0;pages.append(wrap);wrap.append(panel);return {id,title,phase,panel,wrap};});
  let selected='',lastPhase=-1,optionKey='';
  const available=()=>topics.filter(x=>!x.panel.hidden);
  function choose(id,focus=false){if(!available().some(x=>x.id===id))return;onSelect();selected=id;render();if(focus)$('notebookTab-'+id)?.focus({preventScroll:true});}
  function render(){
   const state=getState();if(!state)return;const items=available(),phase=state.narrative.step;host.hidden=!items.length;
   if(!items.length){selected='';lastPhase=phase;for(const t of topics)t.wrap.hidden=true;return;}
   if(lastPhase!==phase||!items.some(x=>x.id===selected))selected=items.reduce((a,b)=>a.phase>b.phase?a:b).id;lastPhase=phase;
   const key=items.map(x=>x.id).join(',');if(key!==optionKey){
    const previous=optionKey.split(','),current=items.find(x=>x.id===selected),unlocked=items.filter(x=>!previous.includes(x.id)&&x.phase>(current?.phase??-1));if(unlocked.length)selected=unlocked.reduce((a,b)=>a.phase>b.phase?a:b).id;
    tabs.replaceChildren(...items.map(t=>{const b=document.createElement('button');b.type='button';b.id='notebookTab-'+t.id;b.dataset.notebookTab=t.id;b.setAttribute('role','tab');b.setAttribute('aria-controls',t.wrap.id);b.textContent=t.title;b.onclick=()=>choose(t.id,true);b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const list=available(),i=list.findIndex(x=>x.id===t.id),next=e.key==='Home'?0:e.key==='End'?list.length-1:(i+(e.key==='ArrowRight'?1:-1)+list.length)%list.length;choose(list[next].id,true);};return b;}));
    picker.replaceChildren(...items.map(t=>{const o=document.createElement('option');o.value=t.id;o.textContent=t.title;return o;}));optionKey=key;
   }
   for(const t of topics){t.wrap.hidden=t.id!==selected;const b=$('notebookTab-'+t.id);if(b){b.setAttribute('aria-selected',String(t.id===selected));b.tabIndex=t.id===selected?0:-1;}}
   picker.value=selected;$('notebookPageName').textContent=items.find(x=>x.id===selected)?.title||'';
  }
  picker.onchange=()=>choose(picker.value);
  return Object.freeze({render,reset(){selected='';lastPhase=-1;},select:choose});
 }
 root.RokujoNotebook=Object.freeze({create});
})(globalThis);
