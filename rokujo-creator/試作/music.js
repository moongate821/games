'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RokujoMusic=api;})(globalThis,()=>{
 function select({playing,state,event,view,campaign}){
  if(!playing)return 'title';
  if(campaign)return (typeof module==='object'&&module.exports?require('./campaign-art.js'):globalThis.RokujoCampaignArt).cue(campaign);
  if(event?.id==='story.arcadia.farewell')return 'farewell';
  if(event?.id==='story.arcadia.north_evacuation'||event?.id==='story.arcadia.northern_defense'||event?.id==='story.arcadia.gran_warning'||event?.id==='story.arcadia.frontier_alarm'||event?.id==='story.arcadia.light_sword'||event?.kind==='crisis'||event?.kind==='emergency')return 'crisis';
  if(['story.arcadia.three_peoples_pact','story.arcadia.western_ocean','story.arcadia.dwal_city','story.arcadia.crystal_steel','story.arcadia.first_crystal_blade','story.arcadia.port_city','story.arcadia.land_sighted','story.arcadia.city_beyond_sea'].includes(event?.id)||event?.id==='story.arcadia.return'||event?.kind==='discovery'||event?.id==='story.arcadia.circuit_demonstration')return 'discovery';
  if(state?.narrative.step===2)return 'farewell';
  if(state?.narrative.step===17&&view!=='room')return 'crisis';
  if(state?.world.stage===0&&view!=='room')return 'crisis';
  return 'daily';
 }
 function create({tracks,onChange=()=>{},AudioClass=globalThis.Audio,fadeMs=650}){
  const channels=[new AudioClass(),new AudioClass()];
  for(let i=0;i<channels.length;i++){const a=channels[i];a.preload='metadata';a.volume=0;a.dataset.channel=String(i);a.setAttribute('aria-hidden','true');}
  let active=-1,desired='title',enabled=true,volume=.35,unlocked=false,suspended=false,duck=false,token=0,timer=null,status='locked',failedKey=null,manualRepeat=null;
  const levels=[0,0];
  const snapshot=()=>({status,desired,current:active<0?null:channels[active].dataset.track,enabled,volume,unlocked,suspended,title:tracks[desired]?.title||''});
  const report=()=>onChange(snapshot());
  const apply=()=>channels.forEach((a,i)=>{a.volume=Math.max(0,Math.min(1,levels[i]*volume*(duck?.65:1)));});
  function halt(nextStatus){token++;clearInterval(timer);timer=null;channels.forEach(a=>a.pause());levels.fill(0);apply();status=nextStatus;report();}
  function fade(index,run){
   clearInterval(timer);const start=performance.now(),initial=[...levels];
   timer=setInterval(()=>{
    if(run!==token){clearInterval(timer);timer=null;return;}
    const t=Math.min(1,(performance.now()-start)/fadeMs);
    for(let i=0;i<2;i++)levels[i]=initial[i]+((i===index?1:0)-initial[i])*t;
    apply();
    if(t===1){clearInterval(timer);timer=null;channels.forEach((a,i)=>{if(i!==index)a.pause();});}
   },25);
  }
  async function play(){
   if(!enabled||!unlocked||suspended||!tracks[desired]||failedKey===desired)return;
   const data=tracks[desired];
   // An unchanged cue keeps its playhead, including its one-shot ending.
   if(active>=0&&channels[active].dataset.track===desired&&!channels[active].error){
    const a=channels[active];if(!a.paused||a.ended)return;
    const run=++token;
    try{await a.play();if(run!==token){if(suspended||!enabled)a.pause();return;}status='playing';fade(active,run);report();}
    catch(e){if(run===token){status=e.name==='NotAllowedError'?'blocked':'error';report();}}
    return;
   }
   const index=active===0?1:0,a=channels[index],run=++token;
   clearInterval(timer);timer=null;a.pause();levels[index]=0;apply();a.dataset.track=desired;a.loop=manualRepeat===null?data.loop:manualRepeat;a.src=data.src;active=index;status='loading';report();
   try{
    await a.play();
    if(run!==token){if(suspended||!enabled||active!==index)a.pause();return;}
    status='playing';fade(index,run);report();
   }catch(e){
    if(run!==token)return;
    if(e.name==='NotAllowedError'){status='blocked';}
    else{failedKey=desired;channels.forEach(x=>x.pause());levels.fill(0);apply();status='error';}
    report();
   }
  }
  channels.forEach((a,i)=>{
   a.addEventListener('ended',()=>{if(i===active&&!a.loop){status='ended';report();}});
   a.addEventListener('error',()=>{if(i===active&&a.dataset.track===desired&&enabled&&unlocked&&!suspended){failedKey=desired;halt('error');}});
  });
  return {
   channels,snapshot,
   scene(key,{reading=false,repeat=null}={}){const changed=desired!==key;desired=key;duck=reading;manualRepeat=typeof repeat==='boolean'?repeat:null;if(active>=0&&channels[active].dataset.track===key)channels[active].loop=manualRepeat===null?tracks[key]?.loop:manualRepeat;apply();if(changed)failedKey=null;if(enabled&&unlocked&&!suspended)void play();report();},
   preferences(prefs){enabled=!!prefs.enabled;volume=Math.max(0,Math.min(1,Number(prefs.volume)||0));apply();if(!enabled)halt('muted');else if(!unlocked){status='locked';report();}else if(!suspended)void play();},
   resume(){unlocked=true;suspended=false;failedKey=null;const a=channels[active];if(a?.ended)a.currentTime=0;if(enabled)void play();else report();},
   suspend(){suspended=true;halt('suspended');},
   destroy(){halt('stopped');channels.forEach(a=>{a.removeAttribute('src');a.load();a.remove();});}
  };
 }
 return Object.freeze({create,select});
});
