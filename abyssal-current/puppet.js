/* Cutout rig: independent images, hierarchical joints and detached debris. */
window.AbyssalPuppets = (() => {
  const sheets={}, missing=[],layouts={};
  const canvas=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
  function cut(img,rect,transparent,isolate=null){
    const [x,y,w,h]=rect,c=canvas(Math.max(1,Math.round(w)),Math.max(1,Math.round(h))),g=c.getContext('2d',{willReadFrequently:true});
    g.drawImage(img,x,y,w,h,0,0,c.width,c.height);
    if(!transparent&&!isolate)return c;
    const f=g.getImageData(0,0,c.width,c.height),d=f.data;
    // Pure neutral white is the requested matte; teal/amber highlights are retained.
    let l=c.width,t=c.height,r=0,b=0;
    for(let py=0;py<c.height;py++)for(let px=0;px<c.width;px++){
      const k=(py*c.width+px)*4,lo=Math.min(d[k],d[k+1],d[k+2]),hi=Math.max(d[k],d[k+1],d[k+2]);
      if(transparent&&lo>222&&hi-lo<25)d[k+3]=Math.round(d[k+3]*(1-Math.min(1,(lo-222)/20)));
      if(isolate){const ix=Math.floor((x+px)*isolate.scale),iy=Math.floor((y+py)*isolate.scale);let own=false;
        for(let dy=-1;dy<=1&&!own;dy++)for(let dx=-1;dx<=1;dx++){const nx=ix+dx,ny=iy+dy;if(nx>=0&&nx<isolate.width&&ny>=0&&ny<isolate.height&&isolate.labels[ny*isolate.width+nx]===isolate.tag){own=true;break;}}
        if(!own)d[k+3]=0;
      }
      if(d[k+3]>40){l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,py);b=Math.max(b,py);}
    }
    g.putImageData(f,0,0);if(l>r)return c;
    const out=canvas(r-l+3,b-t+3);out.getContext('2d').drawImage(c,l,t,r-l+1,b-t+1,1,1,r-l+1,b-t+1);return out;
  }
  function locateParts(img,rows,cols){
    const scale=Math.min(1,1024/img.width),w=Math.round(img.width*scale),h=Math.round(img.height*scale),c=canvas(w,h),cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(img,0,0,w,h);
    const d=cx.getImageData(0,0,w,h).data,mask=new Uint8Array(w*h),seen=new Uint8Array(w*h),labels=new Int32Array(w*h),queue=new Int32Array(w*h),blobs=[];let tag=0;
    let alpha=0;for(let i=0;i<w*h;i++){const k=i*4,lo=Math.min(d[k],d[k+1],d[k+2]),hi=Math.max(d[k],d[k+1],d[k+2]);if(d[k+3]<100)alpha++;mask[i]=d[k+3]>90&&!(lo>224&&hi-lo<25)?1:0;}
    for(let seed=0;seed<w*h;seed++){if(!mask[seed]||seen[seed])continue;let head=0,tail=1,l=w,r=0,top=h,bottom=0;queue[0]=seed;seen[seed]=1;tag++;
      while(head<tail){const i=queue[head++],x=i%w,y=Math.floor(i/w);labels[i]=tag;l=Math.min(l,x);r=Math.max(r,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||nx>=w||ny<0||ny>=h)continue;const ni=ny*w+nx;if(mask[ni]&&!seen[ni]){seen[ni]=1;queue[tail++]=ni;}}
      }
      if(tail>100)blobs.push({area:tail,x:l,y:top,w:r-l+1,h:bottom-top+1,cy:(top+bottom)/2,tag});
    }
    blobs.sort((a,b)=>b.area-a.area);const selected=blobs.slice(0,rows*cols).sort((a,b)=>a.cy-b.cy),rects=[],tags=[];
    for(let row=0;row<rows;row++){const group=selected.slice(row*cols,(row+1)*cols).sort((a,b)=>a.x-b.x);tags.push(group.map(b=>b.tag));rects.push(group.map(b=>[Math.max(0,b.x-3)/scale,Math.max(0,b.y-3)/scale,Math.min(w-b.x,b.w+6)/scale,Math.min(h-b.y,b.h+6)/scale]));}
    return {rects,tags,labels,width:w,height:h,scale,found:selected.length,expected:rows*cols,preserveAlpha:alpha>w*h*.01};
  }
  async function load(defs){
    await Promise.all(Object.entries(defs).map(async([key,def])=>{
      const ready=window.ABYSSAL_PREPARED?.[key];
      if(ready){
        try{sheets[key]=await Promise.all(ready.map(row=>Promise.all(row.map(async src=>{const im=new Image();im.src=src;await im.decode();return im;}))));
          if(def.cutout)layouts[key]={found:def.rows*def.cols,expected:def.rows*def.cols,preserveAlpha:true};
        }catch{missing.push(key);}return;
      }
      const source=window.ABYSSAL_ART_DATA?.[key];if(!source){missing.push(key);return;}
      const img=new Image();img.src=source;
      try{await img.decode();}catch{missing.push(key);return;}
      const located=def.cutout?locateParts(img,def.rows,def.cols):null;
      if(located)layouts[key]={found:located.found,expected:located.expected,preserveAlpha:located.preserveAlpha};
      sheets[key]=Array.from({length:def.rows},(_,row)=>Array.from({length:def.cols},(_,col)=>{
        const measured=window.ABYSSAL_LAYOUTS?.[key]?.[row]?.[col];
        const rect=measured?measured.map((v,i)=>v*(i%2===0?img.width:img.height)/1024):located?.found===located?.expected&&located?located.rects[row][col]:[col*img.width/def.cols,row*img.height/def.rows,img.width/def.cols,img.height/def.rows];
        const isolate=!measured&&located?.found===located?.expected&&located?{...located,tag:located.tags[row][col]}:null;
        return cut(img,rect,def.cutout&&!located?.preserveAlpha,isolate);
      }));
    }));
    // Temporary rigs keep the game playable while Gemini is rate-limited.
    // The gallery explicitly labels these as provisional; raw assets stay intact.
    const legacy={};
    for(const key of ['player','nautilus','ray','medusa','leviathan','background']){
      const src=window.ABYSSAL_ART_DATA?.[key];if(!src)continue;
      const im=new Image();im.src=src;await im.decode();legacy[key]=key==='background'?im:cut(im,[0,0,im.width,im.height],true);
    }
    const sliced=(im)=>{
      const rects=[[.15,.19,.64,.62],[.76,.15,.24,.7],[.2,0,.53,.23],[.2,.78,.53,.22]];
      return rects.map(([x,y,w,h])=>cut(im,[x*im.width,y*im.height,w*im.width,h*im.height],false));
    };
    if(!sheets.playerRig&&legacy.player){const im=legacy.player;sheets.playerRig=[sliced(im)];}
    for(let i=1;i<=4;i++){
      if(!sheets[`enemies${i}`]&&sheets.enemies1)sheets[`enemies${i}`]=sheets.enemies1;
      if(!sheets[`bosses${i}`])sheets[`bosses${i}`]=Array.from({length:3},(_,r)=>sliced(legacy[['nautilus','ray','medusa','leviathan'][(i*3+r-3)%4]]));
      if(!sheets[`backgrounds${i}`])sheets[`backgrounds${i}`]=Array.from({length:3},()=>[legacy.background]);
    }
    return {loaded:Object.keys(defs).filter(k=>!missing.includes(k)),missing};
  }
  const part=(key,row,col=0)=>sheets[key]?.[row]?.[col];
  function image(g,img,w,h,ax=.5,ay=.5){if(!img)return;const s=Math.min(w/img.width,h/img.height);g.drawImage(img,-img.width*s*ax,-img.height*s*ay,img.width*s,img.height*s);}
  function nodes(kind,id,t,activity=0){
    const player=kind==='player',slow=kind==='boss',freq=slow?2.1:player?7:4+(id%5),a=Math.sin(t*freq+id)*.24;
    const tall=(!player&&[4,10,12,14].includes(id)&&!slow)||(slow&&[2,4,6,7].includes(id));
    const ns=[
      {parent:-1,col:0,x:0,y:0,angle:Math.sin(t*1.7)*.025+(player?activity*.055:0),w:player?.83:tall?.58:.8,h:player?.44:tall?.78:.58,ax:.5,ay:.5},
      {parent:0,col:1,x:player?-.29:tall?.08:.28,y:tall?.22:0,angle:a*(player?.3:1),w:player?.35:tall?.55:.46,h:tall?.55:.52,ax:player?.85:.12,ay:.5},
      {parent:0,col:2,x:player?-.12:0,y:player?-.08:tall?-.05:-.15,angle:-.25+a*.9-activity*.1,w:player?.45:.52,h:player?.33:.45,ax:.45,ay:.85},
      {parent:0,col:3,x:player?-.1:0,y:player?.08:tall?.14:.15,angle:.25-a*.8+activity*.1,w:player?.43:.5,h:player?.3:.43,ax:.45,ay:.15}
    ];
    const key=player?'playerRig':slow?`bosses${1+Math.floor(id/3)}`:`enemies${1+Math.floor(id/5)}`,body=part(key,player?0:slow?id%3:id%5,0);
    if(body&&!tall&&!player){const scale=Math.min(ns[0].w/body.width,ns[0].h/body.height),bw=body.width*scale,bh=body.height*scale;ns[1].x=bw*.42;ns[2].y=-bh*.28;ns[3].y=bh*.28;}
    if(!player&&!slow&&id===4){ns[2].w=.2;ns[2].h=.17;ns[2].x=.1;ns[3].w=.17;ns[3].h=.18;ns[3].x=-.13;ns[1].x=.02;ns[1].y=.26;ns[1].angle=a+.15;}
    if(!player&&!slow&&[10,11,12,14].includes(id)){
      ns[1].x=-.1;ns[1].y=.2;ns[1].angle=Math.PI*.45+a*.4;
      ns[2].x=-.16;ns[2].y=.1;ns[2].ax=.1;ns[2].ay=.5;ns[2].angle=1.2+a;
      ns[3].x=.1;ns[3].y=.15;ns[3].ax=.1;ns[3].ay=.5;ns[3].angle=1.7-a;
    }
    if(!player&&!slow&&[5,6,7,8,9].includes(id)){ns[2].x=-.15;ns[3].x=-.17;ns[2].angle=-.65+a;ns[3].angle=.45-a;}
    if(slow&&id===2){ns[1].x=0;ns[1].y=.26;ns[1].angle=1.45+a*.4;ns[2].x=-.14;ns[2].y=.23;ns[2].ay=.1;ns[2].angle=2.65+a*.6;ns[3].x=.13;ns[3].y=.23;ns[3].angle=.2-a*.6;}
    if(slow&&[3,6].includes(id)){ns[2].x=-.15;ns[3].x=-.17;ns[2].angle=-.7+a;ns[3].angle=.5-a;}
    if(slow&&id===7){ns[1].x=.25;ns[1].y=-.05;ns[2].x=-.22;ns[2].y=-.1;ns[3].x=-.22;ns[3].y=.1;ns[2].angle=-.8+a;ns[3].angle=.8-a;}
    if(slow&&id===1)ns[1].x=.2;
    if(slow&&id===6){ns[1].x=.17;ns[1].y=.02;}
    return ns;
  }
  function transforms(ns){return ns.map((n,i)=>{if(n.parent<0)return {...n};const p=ns[n.parent],c=Math.cos(p.angle),s=Math.sin(p.angle);return {...n,x:p.x+n.x*c-n.y*s,y:p.y+n.x*s+n.y*c,angle:p.angle+n.angle};});}
  function draw(g,def,x,y,size,t,kind='enemy',options={}){
    const key=kind==='player'?'playerRig':def.sheet,row=kind==='player'?0:def.row;
    const ns=transforms(nodes(kind,def.id||0,t,options.activity||0));
    const broken=options.broken||[];
    g.save();g.translate(x,y);g.rotate(options.tilt||0);
    // Rear appendages behind the hull; lower arm in front.
    for(const index of [1,2,0,3]){if(broken.includes(index))continue;const n=ns[index],img=part(key,row,n.col);g.save();g.translate(n.x*size,n.y*size);g.rotate(n.angle);image(g,img,n.w*size,n.h*size,n.ax,n.ay);g.restore();}
    if(options.flash){g.globalCompositeOperation='screen';g.fillStyle=`rgba(210,255,255,${options.flash*.25})`;g.beginPath();g.arc(0,0,size*.22,0,Math.PI*2);g.fill();}
    g.restore();return ns;
  }
  function prop(g,key,row,col,x,y,size,t){
    const img=part(key,row,col);if(!img)return;g.save();g.translate(x,y);
    if(!col){image(g,img,size,size,.5,1);g.restore();return;}
    const horizontal=img.width>img.height*2,scale=size/Math.max(img.width,img.height),dw=img.width*scale,dh=img.height*scale;
    if(horizontal)g.rotate(-Math.PI/2);
    for(let i=0;i<4;i++){
      g.rotate(Math.sin(t*.9+row+i*.5)*.035);
      if(horizontal){g.drawImage(img,i*img.width/4,0,img.width/4,img.height,0,-dh/2,dw/4,dh);g.translate(dw/4,0);}
      else{g.drawImage(img,0,img.height*(3-i)/4,img.width,img.height/4,-dw/2,-dh/4,dw,dh/4);g.translate(0,-dh/4);}
    }
    g.restore();
  }
  return {load,part,image,draw,prop,nodes,transforms,missing,sheets,layouts};
})();
