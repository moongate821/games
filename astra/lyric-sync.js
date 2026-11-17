/* Media-time selection: newer phrases take priority, never a wall-clock timer. */
(function(root){
 'use strict';
 function lineAt(lines,time){let lo=0,hi=lines.length;while(lo<hi){const mid=(lo+hi)>>>1;if(lines[mid].time<=time)lo=mid+1;else hi=mid;}const line=lines[lo-1];return line&&time<line.end?line:null;}
 function wordAt(words,index,time){return words.find(w=>index>=w.glyphStart&&index<w.glyphEnd&&time>=w.time&&time<w.end)||null;}
 const api={lineAt,wordAt};root.AstraLyricSync=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
