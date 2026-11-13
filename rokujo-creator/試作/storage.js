'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'));else root.RokujoStorage=factory(root.RokujoEngine);})(globalThis,E=>{
 const PREFIX='rokujo_creator_v2_slot_',LEGACY='rokujo_creator_prototype_v1_slot_',RECOVERY='rokujo_creator_v2_recovery';
 function decode(raw){
  if(typeof raw!=='string'||raw.length>4000000)throw Error('記録が大きすぎるか、読み取れません。');
  const v=JSON.parse(raw);
  if(v&&v.formatVersion===2){
   const state=E.upgrade(v.state);if(!E.validate(state))throw Error('記録の内容が壊れています。');
   return {status:'ok',state,savedAt:typeof v.savedAt==='string'?v.savedAt:'日時不明',contentVersion:typeof v.contentVersion==='string'?v.contentVersion:'不明'};
  }
  if(v&&Object.hasOwn(v,'formatVersion'))return {status:'unsupported',reason:'この版では読めない形式です。元の記録は変更していません。'};
  const old=v?.state||v;
  if(old?.version===1)return {status:'legacy',state:E.migrate(old),savedAt:typeof v.date==='string'?v.date:'旧試作の記録',contentVersion:'試作 v1'};
  throw Error('対応するゲームの記録ではありません。');
 }
 function envelope(state){
  if(!E.validate(state))throw Error('保存前の確認に失敗しました。');
  return {formatVersion:2,contentVersion:'0.29-fantasy-modern-ui',saveId:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10),savedAt:new Date().toISOString(),state:E.clone(state)};
 }
 function repository(storage){
  function readKey(key){
   try{const raw=storage.getItem(key);if(raw===null)return {status:'empty'};
    try{return {...decode(raw),raw};}catch(e){return {status:'broken',reason:e.message,raw};}
   }catch{return {status:'unavailable',reason:'ブラウザの保存を利用できません。JSONの書出しを使ってください。'};}
  }
  function legacy(i){return readKey(LEGACY+i);}
  function slot(i){
   if(![1,2,3].includes(i))throw Error('保存枠は1〜3です。');
   const current=readKey(PREFIX+i);return current.status==='empty'?legacy(i):current;
  }
  function commit(key,state){
   const env=envelope(state),raw=JSON.stringify(env),pending=key+'.pending';
   try{
    storage.setItem(pending,raw);
    if(storage.getItem(pending)!==raw)throw Error('書込みを確認できません。');
    storage.setItem(key,raw);
    if(storage.getItem(key)!==raw)throw Error('保存結果を確認できません。');
   }catch{throw Error('保存できませんでした。容量または保存権限を確認し、JSONの書出しで記録を残してください。');}
   try{storage.removeItem(pending);}catch{/* The verified committed record remains usable. */}
   return env;
  }
  return Object.freeze({slot,legacy,recovery:()=>readKey(RECOVERY),write:(i,s)=>{if(![1,2,3].includes(i))throw Error('保存枠は1〜3です。');return commit(PREFIX+i,s);},writeRecovery:s=>commit(RECOVERY,s),decode,exportState:s=>JSON.stringify(envelope(s),null,2)});
 }
 return Object.freeze({repository,decode,envelope,keys:{PREFIX,LEGACY,RECOVERY}});
});
