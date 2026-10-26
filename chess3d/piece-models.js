import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {wireModel} from './fleet-models.js?v=20261024f';

const files={k:'king',q:'queen',r:'rook',b:'bishop',n:'knight',p:'pawn'};
const folders={druid:'celtic-pieces-lite',standard:'standard-pieces',lattice:'lattice-pieces',crown:'crown-pieces',fantasyMeshy:'fantasy-pieces-hq',fantasyMeshyLite:'fantasy-pieces'};
// Team colours multiply the model texture: [white, black, metalness, roughness].
const teamColors={
  druid:{white:[0xffe6b9,.12,.8],black:[0x8094cf,.36,.57]},
  standard:{white:[0xf4e3c4,.08,.82],black:[0x644933,.08,.82]},
  lattice:{white:[0xffffff,.05,.7],black:[0x3e322c,.1,.55]},
  crown:{white:[0xffffff,.25,.45],black:[0x4a4f66,.35,.4]},
  fantasyMeshy:{white:[0xffe1a3,.18,.67],black:[0x8c89d7,.26,.56]},
  fantasyMeshyLite:{white:[0xffe1a3,.18,.67],black:[0x8c89d7,.26,.56]}
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
const pendingThemes=new Map();
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
// Readable low-poly fantasy silhouettes. Each figure stays inside one square.
const fantasyModels=new Map();
const FANTASY_HEIGHT={k:1.35,q:1.2,r:1.24,b:1.3,n:1.18,p:.72};
function fantasyObject(kind,side){
  const key=`${kind}:${side}`;
  if(fantasyModels.has(key))return fantasyModels.get(key).clone(true);
  const light=side==='white';
  const mat=(color,metalness=0,roughness=.7)=>new THREE.MeshStandardMaterial({color,metalness,roughness,side:THREE.DoubleSide});
  const armor=mat(light?0xd9b778:0x7654a2,.38,.45);
  const metal=mat(light?0xffe5a0:0xc7a4f1,.7,.28);
  const cloth=mat(light?0x3c7d88:0x47305f,.03,.88);
  const dark=mat(light?0x273e4a:0x211a37,.05,.76);
  const skin=mat(light?0xf3cfa4:0xae89c1,.02,.8);
  const glow=new THREE.MeshStandardMaterial({color:light?0x8affde:0xd8a5ff,emissive:light?0x32bfa3:0x9b57df,emissiveIntensity:.8,metalness:.05,roughness:.4,transparent:true,opacity:.92,side:THREE.DoubleSide});
  const fire=new THREE.MeshStandardMaterial({color:light?0xffac5b:0xff75b4,emissive:light?0xe86420:0xcc368a,emissiveIntensity:.9,roughness:.45});
  const group=new THREE.Group();
  const add=(geometry,material,x,y,z,rx=0,ry=0,rz=0)=>{
    const part=new THREE.Mesh(geometry,material);part.position.set(x,y,z);part.rotation.set(rx,ry,rz);group.add(part);return part;
  };
  const ball=(radius,material,x,y,z,sx=1,sy=1,sz=1)=>{
    const part=add(new THREE.SphereGeometry(radius,10,7),material,x,y,z);part.scale.set(sx,sy,sz);return part;
  };
  const limb=(a,b,r,material)=>{
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),direction=end.clone().sub(start);
    const part=add(new THREE.CylinderGeometry(r*.85,r,direction.length(),7),material,...start.clone().add(end).multiplyScalar(.5).toArray());
    part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());return part;
  };
  const wing=(sign)=>{
    const vertices=new Float32Array([
      sign*.18,.88,-.04, sign*.5,1.34,-.12, sign*.47,.72,-.27,
      sign*.18,.88,-.04, sign*.47,.72,-.27, sign*.24,.65,-.16
    ]);
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(vertices,3));geometry.computeVertexNormals();
    add(geometry,armor,0,0,0);
    limb([sign*.18,.88,-.04],[sign*.5,1.34,-.12],.025,metal);
  };
  add(new THREE.CylinderGeometry(.31,.34,.09,12),dark,0,.055,0);
  add(new THREE.TorusGeometry(.285,.025,6,20),metal,0,.1,0,Math.PI/2);
  if(kind==='p'){
    ball(.23,glow,0,.52,0,1,1.18,.85);
    add(new THREE.ConeGeometry(.13,.31,7),glow,0,.82,0);
    for(const x of [-.15,.15])add(new THREE.ConeGeometry(.065,.2,6),glow,x,.72,0,0,0,-x*1.8);
    add(new THREE.TorusGeometry(.25,.023,6,16),metal,0,.43,0,Math.PI/2);
  }else if(kind==='q'){
    ball(.25,armor,0,.64,0,1,.72,1.14);
    for(const x of [-.16,.16])for(const z of [-.17,.16])limb([x,.52,z],[x*1.2,.24,z+.04],.055,dark);
    limb([0,.76,.12],[0,1.05,.25],.105,armor);
    ball(.17,armor,0,1.08,.3,1,.73,1.1);
    add(new THREE.BoxGeometry(.17,.09,.18),metal,0,1.04,.46);
    for(const sign of [-1,1]){
      ball(.035,fire,sign*.105,1.14,.4);
      add(new THREE.ConeGeometry(.055,.23,6),metal,sign*.11,1.34,.2,0,0,sign*.22);
      wing(sign);
    }
    limb([0,.63,-.2],[0,.43,-.34],.065,armor);
    add(new THREE.ConeGeometry(.085,.16,5),metal,0,.41,-.4,Math.PI/2);
    ball(.05,fire,0,1.01,.56);
  }else if(kind==='r'){
    for(const x of [-.11,.11]){
      add(new THREE.BoxGeometry(.13,.2,.16),dark,x,.22,.01);
      add(new THREE.BoxGeometry(.12,.06,.19),metal,x,.15,.05);
    }
    add(new THREE.BoxGeometry(.32,.4,.23),armor,0,.55,0);
    add(new THREE.BoxGeometry(.23,.14,.026),metal,0,.65,.13);
    add(new THREE.BoxGeometry(.35,.5,.045),cloth,0,.54,-.16,.16);
    limb([-.18,.68,0],[-.29,.48,.03],.065,armor);
    limb([.18,.68,0],[.3,.48,.03],.065,armor);
    ball(.115,skin,0,.89,.025);
    add(new THREE.CylinderGeometry(.15,.14,.13,8),metal,0,1.005,.025);
    add(new THREE.ConeGeometry(.065,.19,6),cloth,0,1.13,-.005);
    const shield=add(new THREE.CylinderGeometry(.18,.18,.05,7),metal,-.34,.53,.08,0,0,Math.PI/2);
    shield.scale.z=.8;
    add(new THREE.BoxGeometry(.055,.54,.055),metal,.36,.77,.06);
    add(new THREE.ConeGeometry(.055,.16,5),metal,.36,1.1,.06);
    add(new THREE.BoxGeometry(.18,.045,.07),dark,.36,.48,.06);
  }else if(kind==='b'){
    add(new THREE.CylinderGeometry(.15,.27,.62,9),cloth,0,.42,0);
    add(new THREE.CylinderGeometry(.17,.19,.12,9),armor,0,.69,0);
    ball(.115,skin,0,.82,.04);
    add(new THREE.CylinderGeometry(.27,.27,.045,10),metal,0,.94,0);
    add(new THREE.ConeGeometry(.235,.42,9),cloth,0,1.15,0,0,0,-.12);
    add(new THREE.CylinderGeometry(.23,.23,.05,9),metal,0,.99,0);
    limb([.32,.2,.03],[.32,1.13,.03],.035,dark);
    ball(.11,glow,.32,1.18,.03);
    add(new THREE.TorusGeometry(.145,.018,5,12),metal,.32,1.18,.03,.3);
    limb([-.13,.63,.01],[-.27,.5,.1],.055,armor);
  }else if(kind==='n'){
    add(new THREE.CylinderGeometry(.17,.26,.59,8),cloth,0,.42,0);
    ball(.2,armor,0,.79,0,1,1.04,.9);
    ball(.12,dark,0,.78,.12,1,1,.55);
    for(const sign of [-1,1]){
      limb([sign*.14,.64,0],[sign*.3,.9,.03],.05,armor);
      ball(.055,glow,sign*.32,.96,.04);
    }
    ball(.12,glow,0,1.13,.06);
    add(new THREE.TorusGeometry(.22,.024,6,18),metal,0,1.11,.06,.25);
  }else if(kind==='k'){
    add(new THREE.CylinderGeometry(.18,.28,.65,10),cloth,0,.43,0);
    add(new THREE.BoxGeometry(.32,.31,.23),armor,0,.61,0);
    ball(.12,skin,0,.89,.03);
    add(new THREE.CylinderGeometry(.18,.18,.1,10),metal,0,1.02,0);
    for(let i=0;i<5;i++){
      const angle=i*Math.PI*2/5;
      add(new THREE.ConeGeometry(.055,.2,5),metal,Math.cos(angle)*.145,1.15,Math.sin(angle)*.145);
    }
    limb([.3,.27,.02],[.3,1.08,.02],.035,metal);
    ball(.09,glow,.3,1.14,.02);
  }
  const bounds=new THREE.Box3().setFromObject(group),size=bounds.getSize(new THREE.Vector3());
  group.userData.modelHeight=size.y;
  group.userData.modelFootprint=Math.max(size.x,size.z);
  fantasyModels.set(key,group);
  return group.clone(true);
}
function addFantasyPiece(cell,kind,side){
  const group=fantasyObject(kind,side);pieces.add(group);
  entries.push({cell,group,height:group.userData.modelHeight,footprint:group.userData.modelFootprint,kind,side,fantasy:true});
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
  entries.push({cell,group,height:size.y,footprint:Math.max(size.x,size.z),kind,side,fantasy:activeTheme==='fantasyMeshy'||activeTheme==='fantasyMeshyLite'});
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
    // Meshy dragons have a long tail, so a strict one-square footprint makes
    // their body look much smaller than the other fantasy characters.
    const fantasyFootprint=kind==='q'&&(activeTheme==='fantasyMeshy'||activeTheme==='fantasyMeshyLite')?1.12:.84;
    const scale=fleet?size/footprint:fantasy?Math.min(size*FANTASY_HEIGHT[kind]/height,size*fantasyFootprint/footprint):Math.min(size*KING_HEIGHT*pieceHeights[kind]/height,size*MAX_FOOTPRINT/footprint);
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

function loadTheme(theme){
  if(pendingThemes.has(theme))return pendingThemes.get(theme);
  const pending=Promise.all(Object.entries(files).map(async([kind,name])=>{
    const gltf=await loader.loadAsync(`assets/${folders[theme]}/${name}.glb`);
    const box=new THREE.Box3().setFromObject(gltf.scene);
    models.set(`${theme}:${kind}`,{scene:gltf.scene,box,center:box.getCenter(new THREE.Vector3())});
  })).catch(error=>{pendingThemes.delete(theme);throw error;});
  pendingThemes.set(theme,pending);
  return pending;
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
    // Load the selected theme first. Large fantasy models wait until selected.
    if(folders[activeTheme])await loadTheme(activeTheme);
    if(folders[activeTheme]&&!models.has(`${activeTheme}:king`))await loadTheme(activeTheme);
    ready=true;
    viewer.classList.add('models-ready');
    window.dispatchEvent(new Event('piece-models-ready'));
    new ResizeObserver(()=>window.dispatchEvent(new Event('piece-models-resize'))).observe(viewport);
  }catch(error){
    console.error('駒の3Dモデルを読み込めませんでした。文字駒で表示します。',error);
    renderer?.dispose();renderer?.domElement.remove();renderer=null;
  }
}

export function setPieceTheme(theme){
  if((!folders[theme]&&theme!=='fleet'&&theme!=='fantasy')||theme===activeTheme)return;
  activeTheme=theme;
  pieces.clear();entries=[];
  if(!ready)return;
  if(folders[theme]&&!models.has(`${theme}:king`)){
    viewer.classList.remove('models-ready');
    loadTheme(theme).then(()=>{if(theme===activeTheme){viewer.classList.add('models-ready');syncPieceModels(latestCameraState);}}).catch(error=>console.error(theme,error));
    return;
  }
  viewer.classList.add('models-ready');
  syncPieceModels(latestCameraState);
}

export function syncPieceModels(cameraState){
  if(!ready||viewer.hidden)return;
  latestCameraState=cameraState;
  activeUntil=performance.now()+260;
  if(framePending)return;
  framePending=true;
  requestAnimationFrame(drawFrame);
}
