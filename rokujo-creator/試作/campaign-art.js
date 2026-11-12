'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RokujoCampaignArt=api;})(globalThis,()=>{
 const definitions={
  rivaria:['漂流都市リヴァリア',46],whitecity:['白都・神の庭',65],hope:['世界船「希望」',132],
  outer:['外界・光の潮流',137],archive:['記録の海と管理施設',216],memorial:['ガルドの遺した工房',270],
  marine:['海洋世界の都市',140],aerl:['浮遊世界アエル',223],ending:['骨董屋・空になった棚',300],
  crystal:['結晶世界クリスタリア',148],worldtree:['世界樹の最初の苗',117],recordroom:['記録室と庭',300]
 };
 const assets=Object.freeze(Object.fromEntries(Object.entries(definitions).map(([key,[title,first]])=>[key,Object.freeze({key,id:'concept.late.'+key,title,first,src:'../画像/concept/concept.late.'+key+'.v1.png'})])));
 // Images illustrate their named places, not every statement or every possible episode.
 // A missing match deliberately leaves a reading page without a misleading location.
 function select(episode,text){
  const t=String(text),n=Number(episode);
  if(n===300&&/骨董|店主|棚/.test(t))return assets.ending;
  if(n===300&&/記録室/.test(t))return assets.recordroom;
  if(n>=270&&/ガルド/.test(t)&&/工房|椅子|遺した|八十四|逝/.test(t))return assets.memorial;
  if(n>=216&&/記録の海|第一管理施設|情報の海/.test(t))return assets.archive;
  if(n>=223&&/アエル|浮遊世界/.test(t))return assets.aerl;
  if(n>=148&&/クリスタリア|結晶世界/.test(t))return assets.crystal;
  if(n>=117&&n<=120&&/世界樹/.test(t))return assets.worldtree;
  if(n>=140&&/アクアリウム|海洋連邦|海洋世界/.test(t))return assets.marine;
  if(n>=137&&/外界/.test(t)&&/光|境界|潮流/.test(t))return assets.outer;
  if(n>=132&&/世界船|希望改二|「希望」/.test(t))return assets.hope;
  if(n>=65&&/白都|神の庭/.test(t)&&!/六畳|パソコン/.test(t))return assets.whitecity;
  if(n>=46&&/リヴァリア|漂流都市/.test(t))return assets.rivaria;
  return null;
 }
 function cue({episode,kind,tab,endingTrack=false}){
  if(tab!=='story')return 'daily';
  if(episode===300&&endingTrack)return 'inheritance';
  if(episode===270||kind==='care')return 'farewell';
  if(kind==='navigation'||[65,100,117,132,135,137,183,216,223].includes(episode))return 'discovery';
  return 'daily';
 }
 return Object.freeze({assets,select,cue});
});
