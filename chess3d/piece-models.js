import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';

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

function addPiece(cell,kind,side){
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
  for(const {cell,group,height,footprint,kind,side} of entries){
    const rect=cell.getBoundingClientRect();
    // Keep model size tied to the actual square and zoom, not its projected
    // bounding box, which changes with both tilt and horizontal rotation.
    const size=cell.offsetWidth*latestCameraState.zoom;
    const scale=Math.min(size*KING_HEIGHT*pieceHeights[kind]/height,size*MAX_FOOTPRINT/footprint);
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
  if(!folders[theme]||theme===activeTheme)return;
  activeTheme=theme;
  pieces.clear();entries=[];
  if(ready&&models.has(`${theme}:king`))syncPieceModels(latestCameraState);
}

export function syncPieceModels(cameraState){
  if(!ready||viewer.hidden)return;
  latestCameraState=cameraState;
  activeUntil=performance.now()+260;
  if(framePending)return;
  framePending=true;
  requestAnimationFrame(drawFrame);
}
