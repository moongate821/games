import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {wireModel} from './fleet-models.js?v=20261024f';

const files={k:'king',q:'queen',r:'rook',b:'bishop',n:'knight',p:'pawn'};
const folders={druid:'celtic-pieces-lite',standard:'standard-pieces',lattice:'lattice-pieces',crown:'crown-pieces'};
// Team colours multiply the model texture: [white, black, metalness, roughness].
const teamColors={
  druid:{white:[0xffe6b9,.12,.8],black:[0x8094cf,.36,.57]},
  standard:{white:[0xf4e3c4,.08,.82],black:[0x644933,.08,.82]},
  lattice:{white:[0xffffff,.05,.7],black:[0x3e322c,.1,.55]},
  crown:{white:[0xffffff,.25,.45],black:[0x4a4f66,.35,.4]}
};
// The source GLBs were each normalized to nearly the same height. Restore
// chess-like proportions so a rank of pawns does not hide the major pieces.
const pieceHeights={k:1,q:.93,r:.76,b:.86,n:.82,p:.6};
// Piece height of the tallest piece (king) in square widths, and the widest
// footprint allowed in square widths, so large pieces never spill into
// neighbouring squares however the board is rotated.
const KING_HEIGHT=1.5,MAX_FOOTPRINT=.86;
const scene=new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff,0x405070,2.2));
const key=new THREE.DirectionalLight(0xffe6b3,2.7);key.position.set(-4,8,10);scene.add(key);
const fill=new THREE.DirectionalLight(0xabcfff,1.5);fill.position.set(7,2,6);scene.add(fill);
const camera=new THREE.OrthographicCamera(-1,1,1,-1,0.1,2000);
camera.position.z=1000;
const loader=new GLTFLoader();
const models=new Map();
const materials=new WeakMap();
const pieces=new THREE.Group();scene.add(pieces);
let viewport,viewer,renderer,ready=false,framePending=false,activeUntil=0;
let entries=[];
let latestCameraState={tilt:58,yaw:-30};
let renderWidth=0,renderHeight=0;
let activeTheme='druid';

function makeTeamMaterial(source,side){
  let pair=materials.get(source);
  if(!pair){pair={};materials.set(source,pair);}
  if(pair[side])return pair[side];
  const material=source.clone();
  const [color,metalness,roughness]=teamColors[activeTheme][side];
  material.color=new THREE.Color(color);material.metalness=metalness;material.roughness=roughness;
  material.side=THREE.DoubleSide;
  pair[side]=material;
  return material;
}

// 艦隊運用モード: 銀河覇権のワイヤーフレーム艦。白=星冠帝国軍(琥珀)、黒=地球星域防衛軍(青)
const FLEET_CLASS={k:'DN',q:'PL',r:'BB',b:'CV',n:'TB',p:'FR'};
const FLEET_SIZE={k:1.22,q:.95,r:1.1,b:1.04,n:.8,p:.76};   // マス幅に対する艦の長さ
const FLEET_COL={white:[0xffc45a,0xfff0c0],black:[0x5ab8ff,0xd0f4ff]};
function fleetObject(kind,side){
  const m=wireModel(FLEET_CLASS[kind],side==='white'?'empire':'republic');
  const make=(edges,color,opacity)=>{const pos=[];for(const [a,b] of edges)pos.push(...m.v[a],...m.v[b]);
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    return new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color,transparent:true,opacity,depthTest:true}));};
  const [hull,glow]=FLEET_COL[side];
  const root=new THREE.Group();root.add(make(m.e,hull,.6),make(m.acc,glow,1));
  return root;
}
function addFleetPiece(cell,kind,side){
  const group=new THREE.Group(),ship=fleetObject(kind,side);
  const HOVER=.62;ship.position.y=HOVER;   // 盤から浮かせる(艦の長さに対する高さ)
  // 真下の光の輪と、艦と盤をつなぐ浮遊の光線(浮いていることが分かるように)
  const col=FLEET_COL[side][0],ring=[],N=24;
  for(let i=0;i<N;i++){const a=i/N*Math.PI*2,b=(i+1)/N*Math.PI*2;ring.push(Math.cos(a)*.22,0,Math.sin(a)*.22,Math.cos(b)*.22,0,Math.sin(b)*.22);}
  ring.push(0,0,0,0,HOVER-.04,0);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(ring,3));
  group.add(ship,new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:col,transparent:true,opacity:.45})));pieces.add(group);
  entries.push({cell,group,height:1,footprint:1/FLEET_SIZE[kind],kind,side,fleet:true});
}
// Small procedural fantasy figures keep the mode usable without external models.
const fantasyModels=new Map();
function fantasyObject(kind,side){
  const key=`${kind}:${side}`;
  if(fantasyModels.has(key))return fantasyModels.get(key).clone(true);
  const main=new THREE.MeshStandardMaterial({color:side==='white'?0xe7c47e:0x8051b4,metalness:.25,roughness:.52});
  const trim=new THREE.MeshStandardMaterial({color:side==='white'?0xfff1b8:0xce9cff,metalness:.5,roughness:.35});
  const magic=new THREE.MeshBasicMaterial({color:side==='white'?0xffd77a:0xb68bff,transparent:true,opacity:.85,side:THREE.DoubleSide});
  const group=new THREE.Group();
  const add=(geometry,material,x,y,z,rx=0,ry=0,rz=0)=>{
    const part=new THREE.Mesh(geometry,material);part.position.set(x,y,z);part.rotation.set(rx,ry,rz);group.add(part);return part;
  };
  add(new THREE.CylinderGeometry(.32,.38,.1,12),trim,0,.06,0);
  if(kind==='p'){
    add(new THREE.SphereGeometry(.23,12,8),magic,0,.5,0);
    for(const x of [-.16,.16])add(new THREE.ConeGeometry(.075,.27,7),magic,x,.78,0);
  }else{
    add(new THREE.CylinderGeometry(kind==='q'?.24:.16,.25,.55,10),main,0,.37,0);
    if(kind==='k'){
      add(new THREE.TorusGeometry(.22,.055,6,16),trim,0,.69,0,Math.PI/2);
      for(let i=0;i<5;i++){const a=i*Math.PI*2/5;add(new THREE.ConeGeometry(.065,.3,6),trim,Math.cos(a)*.21,.85,Math.sin(a)*.21);}
    }else if(kind==='q'){
      add(new THREE.SphereGeometry(.23,10,8),main,0,.77,0);
      add(new THREE.ConeGeometry(.12,.42,8),trim,0,.75,.29,Math.PI/2);
      for(const dir of [-1,1]){
        add(new THREE.ConeGeometry(.055,.23,6),trim,dir*.13,1.01,-.05);
        add(new THREE.ConeGeometry(.28,.62,3),main,dir*.44,.7,0,0,0,dir*.7);
      }
    }else if(kind==='r'){
      add(new THREE.SphereGeometry(.17,10,8),trim,0,.76,0);
      add(new THREE.BoxGeometry(.065,.58,.065),trim,.31,.81,0);
      add(new THREE.BoxGeometry(.29,.055,.08),main,.31,.56,0);
    }else if(kind==='b'){
      add(new THREE.ConeGeometry(.3,.5,10),trim,0,.9,0);
      add(new THREE.TorusGeometry(.26,.035,5,12),main,0,.66,0,Math.PI/2);
      add(new THREE.CylinderGeometry(.035,.035,.8,6),trim,.3,.57,0);
      add(new THREE.SphereGeometry(.1,8,6),magic,.3,1,0);
    }else if(kind==='n'){
      add(new THREE.SphereGeometry(.16,10,8),magic,0,.8,0);
      add(new THREE.TorusGeometry(.27,.035,6,16),trim,0,.8,0,.35);
      add(new THREE.TorusGeometry(.27,.035,6,16),trim,0,.8,0,-.35);
    }
  }
  fantasyModels.set(key,group);
  return group.clone(true);
}
function addFantasyPiece(cell,kind,side){
  const group=fantasyObject(kind,side);pieces.add(group);
  entries.push({cell,group,height:1,footprint:1,kind,side,fantasy:true});
}
function addPiece(cell,kind,side){
  if(activeTheme==='fleet')return addFleetPiece(cell,kind,side);
  if(activeTheme==='fantasy')return addFantasyPiece(cell,kind,side);
  const source=models.get(`${activeTheme}:${kind}`);
  if(!source)return;
  const root=source.scene.clone(true);
  root.traverse(node=>{if(node.isMesh)node.material=makeTeamMaterial(node.material,side);});
  const group=new THREE.Group();group.add(root);
  root.position.set(-source.center.x,-source.box.min.y,-source.center.z);
  pieces.add(group);
  const size=source.box.getSize(new THREE.Vector3());
  entries.push({cell,group,height:size.y,footprint:Math.max(size.x,size.z),kind,side});
}

function refreshEntries(){
  const cells=[...viewport.querySelectorAll('.cell3d:not(.void) .piece3d')].map(piece=>piece.parentElement);
  if(cells.length===entries.length&&cells.every((cell,index)=>cell===entries[index].cell))return;
  pieces.clear();entries=[];
  for(const cell of cells){
    const piece=cell.querySelector('.piece3d');
    addPiece(cell,piece.dataset.piece,piece.classList.contains('white')?'white':'black');
  }
}

function drawFrame(){
  framePending=false;
  if(!ready||viewer.hidden)return;
  const bounds=viewport.getBoundingClientRect();
  if(!bounds.width||!bounds.height)return;
  if(bounds.width!==renderWidth||bounds.height!==renderHeight){
    renderer.setSize(bounds.width,bounds.height,false);
    renderWidth=bounds.width;renderHeight=bounds.height;
  }
  camera.left=-bounds.width/2;camera.right=bounds.width/2;
  camera.top=bounds.height/2;camera.bottom=-bounds.height/2;
  camera.updateProjectionMatrix();
  refreshEntries();
  const fit=parseFloat(getComputedStyle(viewport.querySelector('.world')).getPropertyValue('--fit'))||1;
  for(const {cell,group,height,footprint,kind,side,fleet,fantasy} of entries){
    const rect=cell.getBoundingClientRect();
    // Keep model size tied to the actual square and zoom, not its projected
    // bounding box, which changes with both tilt and horizontal rotation.
    const size=cell.offsetWidth*latestCameraState.zoom;
    const scale=fleet?size/footprint:fantasy?size*.82:Math.min(size*KING_HEIGHT*pieceHeights[kind]/height,size*MAX_FOOTPRINT/footprint);
    group.scale.setScalar(Math.max(0.001,scale));
    group.rotation.x=THREE.MathUtils.degToRad(90-latestCameraState.tilt);
    group.rotation.y=THREE.MathUtils.degToRad(-latestCameraState.yaw)+(side==='white'?Math.PI:0);
    const screenY=bounds.height/2-(rect.top-bounds.top+rect.height/2);
    // Real depth toward the viewer (board tilt + layer height), so pieces on
    // different squares and layers hide each other correctly.
    const layerZ=((+cell.parentElement.dataset.level||0)-1)*130*fit*latestCameraState.zoom;
    const t=THREE.MathUtils.degToRad(Math.min(latestCameraState.tilt,80));
    group.position.set(rect.left-bounds.left+rect.width/2-bounds.width/2,screenY,
      -screenY*Math.tan(t)+layerZ/Math.cos(t));
  }
  renderer.render(scene,camera);
  if(performance.now()<activeUntil){
    framePending=true;
    requestAnimationFrame(drawFrame);
  }
}

export async function initPieceModels(viewportElement,viewerElement){
  viewport=viewportElement;viewer=viewerElement;
  try{
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.domElement.className='piece-model-layer';
    renderer.domElement.setAttribute('aria-hidden','true');
    viewport.append(renderer.domElement);
    // The selected theme loads first; the others load in the background.
    const loadTheme=theme=>Promise.all(Object.entries(files).map(async([kind,name])=>{
      const gltf=await loader.loadAsync(`assets/${folders[theme]}/${name}.glb`);
      const box=new THREE.Box3().setFromObject(gltf.scene);
      models.set(`${theme}:${kind}`,{scene:gltf.scene,box,center:box.getCenter(new THREE.Vector3())});
    }));
    await loadTheme(activeTheme);
    ready=true;
    viewer.classList.add('models-ready');
    window.dispatchEvent(new Event('piece-models-ready'));
    new ResizeObserver(()=>window.dispatchEvent(new Event('piece-models-resize'))).observe(viewport);
    for(const theme of Object.keys(folders)){
      if(models.has(`${theme}:king`))continue;
      loadTheme(theme).then(()=>{if(theme===activeTheme){pieces.clear();entries=[];syncPieceModels(latestCameraState);}}).catch(error=>console.error(theme,error));
    }
  }catch(error){
    console.error('駒の3Dモデルを読み込めませんでした。文字駒で表示します。',error);
    renderer?.dispose();renderer?.domElement.remove();renderer=null;
  }
}

export function setPieceTheme(theme){
  if((!folders[theme]&&theme!=='fleet'&&theme!=='fantasy')||theme===activeTheme)return;
  activeTheme=theme;
  pieces.clear();entries=[];
  if(ready&&(theme==='fleet'||theme==='fantasy'||models.has(`${theme}:king`)))syncPieceModels(latestCameraState);
}

export function syncPieceModels(cameraState){
  if(!ready||viewer.hidden)return;
  latestCameraState=cameraState;
  activeUntil=performance.now()+260;
  if(framePending)return;
  framePending=true;
  requestAnimationFrame(drawFrame);
}
