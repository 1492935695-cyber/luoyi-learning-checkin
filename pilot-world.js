import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {PEOPLE} from './pilot-data.js?v=mobile2';
import {MODELS,loadModelBytes,withDeadline,abortError} from './pilot-loading.js?v=mobile2';
import {gunzipSync} from './vendor/fflate.js';

// All interactions take place in the story world. A target represents one complete action.
export class PilotWorld {
 constructor(host,pick){
  this.host=host;this.pick=pick;this.scene=new T.Scene();this.scene.background=new T.Color('#aedcd8');this.scene.fog=new T.Fog('#aedcd8',16,37);
  this.camera=new T.PerspectiveCamera(43,1,.08,65);this.camera.position.set(0,2,7);this.look=new T.Vector3(0,1,-1);this.camTo=this.camera.position.clone();this.lookTo=this.look.clone();
  this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;host.append(this.renderer.domElement);
  this.scene.add(new T.HemisphereLight(0xe4f5ff,0x788758,2.1));const sun=new T.DirectionalLight(0xffe6b1,3.2);sun.position.set(-5,8,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7});sun.shadow.normalBias=.035;this.scene.add(sun);const rim=new T.DirectionalLight(0xc7eaf4,1.4);rim.position.set(4,4,-5);this.scene.add(rim);
  this.root=new T.Group();this.scene.add(this.root);this.taskRoot=new T.Group();this.scene.add(this.taskRoot);this.guideRoot=new T.Group();this.scene.add(this.guideRoot);this.guides=[];this.celebration=0;this.actors=new Map();this.cast=new Map();this.loads=new Map();this.targets=new Map();this.moves=[];this.floaters=[];this.t=0;this.active=true;this.paused=false;this.level=0;this.speaker=null;this.clock=new T.Clock();this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.ray=new T.Raycaster();let down;host.addEventListener('pointerdown',e=>down={x:e.clientX,y:e.clientY});host.addEventListener('pointerup',e=>{if(!down||this.paused)return;const d=down;down=null;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>22)return;this.scene.updateMatrixWorld(true);this.camera.updateMatrixWorld(true);const near=Object.entries(this.positions()).map(([id,p])=>({id,d:Math.hypot(e.clientX-p.x,e.clientY-p.y)})).sort((a,b)=>a.d-b.d)[0];if(near&&near.d<35){this.pick(near.id);return;}const b=host.getBoundingClientRect();this.ray.setFromCamera(new T.Vector2((e.clientX-b.left)/b.width*2-1,1-(e.clientY-b.top)/b.height*2),this.camera);for(const h of this.ray.intersectObjects([...this.targets.values()],true)){let o=h.object;while(o&&!o.userData.target)o=o.parent;if(o&&o.visible){this.pick(o.userData.target);break;}}});
  this.resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.fov=w>h?47:43;this.camera.updateProjectionMatrix();};this.observer=new ResizeObserver(this.resize);this.observer.observe(host);this.resize();this.frame=this.frame.bind(this);requestAnimationFrame(this.frame);
 }
 mat(c,rough=.75){return new T.MeshStandardMaterial({color:c,roughness:rough});}
 mesh(geo,c,g=this.root){const m=new T.Mesh(geo,typeof c==='string'?this.mat(c):c);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
 box(pos,size,c,g=this.root){const m=this.mesh(new T.BoxGeometry(...size),c,g);m.position.set(...pos);return m;}
 ell(pos,size,c,g=this.root){const m=this.mesh(new T.SphereGeometry(1,24,16),c,g);m.position.set(...pos);m.scale.set(...size);return m;}
 tube(points,r,c,g=this.root){return this.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),20,r,8,false),c,g);}
 group(pos,g=this.root){const o=new T.Group();o.position.set(...pos);g.add(o);return o;}
 async load(ep,{signal,onProgress=()=>{}}={}){
  const loader=new GLTFLoader();
  // iOS WeChat omits "Safari" from its UA; use the same image path as Safari.
  if(/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))loader.register(parser=>{
   parser.textureLoader=new T.TextureLoader(parser.options.manager).setCrossOrigin(parser.options.crossOrigin).setRequestHeader(parser.options.requestHeader);
   return{name:'PILOT_IOS_TEXTURES'};
  });
  const queue=ep.characters.filter(key=>{if(this.cast.has(key)){onProgress(key,{loaded:MODELS[key].bytes,ready:true});return false;}return true;});
  const worker=async()=>{while(queue.length){
   if(signal?.aborted)throw abortError();const key=queue.shift(),spec=MODELS[key];
   const packed=await loadModelBytes(key,{signal,onProgress:p=>onProgress(key,p)});
   if(signal?.aborted)throw abortError();onProgress(key,{loaded:spec.bytes,decoding:true});
   // Some proxies decode .gz themselves. Accept either GLB or gzip bytes.
   let bytes=new Uint8Array(packed);if(bytes[0]===31&&bytes[1]===139)bytes=gunzipSync(bytes);
   if(bytes[0]!==103||bytes[1]!==108||bytes[2]!==84||bytes[3]!==70)throw Error('Invalid character data');
   const parsed=loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'assets/pilot/mobile/');
   let expired=false;parsed.then(d=>{if(expired)this.disposeModel(d.scene);},()=>{});
   let d;try{d=await withDeadline(parsed,signal);}catch(e){expired=true;throw e;}
   if(signal?.aborted){this.disposeModel(d.scene);throw abortError();}
   this.cast.set(key,d.scene);onProgress(key,{loaded:spec.bytes,ready:true});
  }};
  await Promise.all([worker(),worker()]);
 }
 disposeModel(scene){const textures=new Set();scene.traverse(o=>{if(!o.isMesh)return;o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const v of Object.values(m))if(v?.isTexture)textures.add(v);m.dispose();}});for(const texture of textures){texture.source?.data?.close?.();texture.dispose();}}
 disposeGroup(g){g.traverse(o=>{if(o.isMesh&&!o.userData.shared){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.dispose();}}});g.clear();}
 build(ep){this.disposeGroup(this.root);this.clearTask();this.ep=ep;this.actors.clear();this.floaters=[];this.moves=[];this.departing=false;
  const ground=this.mesh(new T.PlaneGeometry(70,70),'#78955c');ground.rotation.x=-Math.PI/2;ground.position.y=-.04;
  this.forest();
  const path=this.mesh(new T.PlaneGeometry(3.8,20),'#d7c095');path.rotation.x=-Math.PI/2;path.position.set(0,-.025,-3);
  const water=this.mesh(new T.PlaneGeometry(30,3),new T.MeshStandardMaterial({color:'#559fbc',roughness:.24,metalness:.25}));water.rotation.x=-Math.PI/2;water.position.set(0,-.018,-3.7);this.water=water;
  for(let i=0;i<24;i++){const z=-5.1+(i%2)*2.8,x=(Math.floor(i/2)-5.5)*.85;this.ell([x,.05,z],[.5,.18,.32],i%3?'#7e9678':'#a5aa83');}
  this.bridge=this.group([0,0,-3.7]);for(let i=0;i<12;i++)this.box([0,.20+Math.sin(i/11*Math.PI)*.18,(i-5.5)*.25],[2.35,.13,.23],i%2?'#a1784d':'#bd9163',this.bridge);
  for(const x of [-1.1,1.1]){for(const z of [-1.3,0,1.3])this.box([x,.67,z],[.10,1,.10],'#775031',this.bridge);this.tube([[x,.90,-1.4],[x,1.15,0],[x,.90,1.4]],.06,'#aa7c49',this.bridge);}
  this.hut=this.group([-3.25,0,-5.2]);this.box([0,1,0],[2.15,2,1.7],'#e9c88f',this.hut);for(const x of [-1,1])this.box([x,1,.9],[.14,2.05,.14],'#876044',this.hut);this.box([0,.8,.87],[.75,1.5,.08],'#498e82',this.hut);this.box([.67,1.1,.90],[.45,.64,.10],'#9dcfd0',this.hut);
  for(const side of [-1,1]){const roof=this.box([side*.62,2.18,0],[1.55,.15,2.15],'#426f70',this.hut);roof.rotation.z=-side*.29;}this.tube([[-1.4,1.97,1.06],[0,2.43,1.06],[1.4,1.97,1.06]],.07,'#5e9290',this.hut);
  this.cart=this.makeCart([.95,0,-.05]);this.badge(this.cart,[0,.42,.55],.36);this.cart.visible=ep.id==='math';
  for(let i=0;i<85;i++){const x=Math.sin(i*7.13)*(2.3+(i%9)*.37),z=Math.cos(i*3.37)*6-2;if(Math.abs(x)<2)continue;const g=this.group([x,0,z]);for(let j=0;j<3;j++){const blade=this.mesh(new T.ConeGeometry(.035,.27+(i%3)*.1,3),'#497f50',g);blade.position.set((j-1)*.10,.17,0);blade.rotation.z=(j-1)*.25;}if(i%5===0){this.ell([0,.34,0],[.085,.075,.06],'#e6b5ab',g);this.ell([.01,.38,.04],[.028,.028,.026],'#ffd883',g);}}
  for(let i=0;i<9;i++){const cloud=this.group([-8+i*2.6,5+(i%3)*.6,-12]);for(let j=0;j<3;j++)this.ell([(j-1)*.45,(j%2)*.18,0],[.65,.30,.3],'#eff1d5',cloud);}
  for(const [key,pos]of [[ep.characters[0],[0,0,-1.9]],['friend',[-1.23,0,-1.0]],['brother',[1.3,0,-1.5]]])this.character(key,pos);
  this.squirrel();this.duckRoot=this.group([0,0,0]);this.ducks=[];this.lampRoot=this.group([0,0,0]);this.lamps=[];this.flyRoot=this.group([0,0,0]);this.packed=new Set();this.plateCounts=[0,0];
  if(ep.bonus){this.bridge.visible=false;this.hut.visible=false;this.cart.visible=false;const mat=this.box([0,.01,.45],[3.6,.025,2.8],'#efb184');for(let i=0;i<7;i++)this.box([(i-3)*.48,.027,.45],[.21,.008,2.8],'#fff0c2');this.box([0,.21,-.1],[2.4,.20,1.0],'#b87845');for(const x of [-.93,.93])this.box([x,.1,-.1],[.14,.24,.7],'#77523c');for(const x of [-1.9,1.9]){const g=this.group([x,0,-.2]);this.ell([0,.26,0],[.15,.27,.15],'#ffedce',g);this.ell([0,.52,0],[.36,.19,.34],'#d57055',g);}this.badge(this.root,[0,.43,.43],.3);}
  if(ep.id==='math')for(let i=0;i<3;i++)this.duck([(i-1)*.50,0,-.7]);this.shot('wide');
 }
 badge(g,p,size){const tex=new T.TextureLoader().load('assets/qingting-badge-original.jpg');tex.colorSpace=T.SRGBColorSpace;const m=this.mesh(new T.PlaneGeometry(size,size),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}),g);m.position.set(...p);return m;}
 makeCart(pos){const g=this.group(pos);this.box([0,.42,0],[1.75,.18,1.0],'#7a543b',g);for(let i=0;i<5;i++)this.box([0,.57,(i-2)*.19],[1.76,.10,.17],i%2?'#bd9464':'#d1ab79',g);for(const x of [-.93,.93]){this.box([x,.77,0],[.11,.53,1.06],'#468b7e',g);for(const z of [-.53,.53]){const wheel=this.mesh(new T.CylinderGeometry(.31,.31,.105,32),'#674b35',g);wheel.rotation.x=Math.PI/2;wheel.position.set(x*.75,.28,z);const hub=this.mesh(new T.TorusGeometry(.23,.038,8,24),'#c39c60',g);hub.position.set(x*.75,.28,z+Math.sign(z)*.06);for(let i=0;i<6;i++){const spoke=this.box([x*.75,.28,z+Math.sign(z)*.06],[.035,.46,.035],'#c39c60',g);spoke.rotation.z=i*Math.PI/3;}}}g.userData.handle=this.tube([[-.7,.50,.45],[-.7,.72,1.5],[.7,.72,1.5],[.7,.50,.45]],.04,'#aa8553',g);return g;}
 character(key,pos){const g=this.group(pos),m=this.cast.get(key).clone(true),b=new T.Box3().setFromObject(m),c=b.getCenter(new T.Vector3()),scale=PEOPLE[key].height/b.getSize(new T.Vector3()).y;m.scale.setScalar(scale);m.position.set(-c.x*scale,-b.min.y*scale,-c.z*scale);g.add(m);const morphs=[];m.traverse(o=>{if(o.isMesh){o.userData.shared=true;o.castShadow=true;if(o.morphTargetInfluences)morphs.push(o);}});this.actors.set(key,{g,morphs,base:g.position.clone(),height:PEOPLE[key].height});return g;}
 squirrel(){const g=this.group([-.72,0,.1]),fur='#b87836';this.ell([0,.45,0],[.23,.32,.20],fur,g);this.ell([0,.46,.17],[.15,.22,.07],'#f0d7a6',g);this.ell([0,.86,0],[.28,.25,.23],fur,g);for(const x of [-.17,.17]){this.ell([x,1.08,0],[.08,.16,.06],fur,g);this.ell([x*.85,.91,.20],[.06,.08,.03],'#fff7da',g);this.ell([x*.85,.92,.226],[.029,.045,.025],'#223b33',g);this.ell([x*.85-.01,.94,.245],[.012,.016,.008],'#fff',g);this.ell([x,.09,.1],[.1,.06,.16],'#805128',g);}this.ell([0,.83,.23],[.075,.044,.05],'#65432d',g);const mouth=this.ell([0,.76,.215],[.07,.016,.023],'#522b26',g);this.tube([[.15,.3,-.06],[.43,.55,-.2],[.45,.96,-.1],[.32,1.15,-.07]],.16,fur,g);this.box([0,.57,.21],[.26,.20,.06],'#417e77',g);this.actors.set('squirrel',{g,morphs:[],base:g.position.clone(),mouth,height:1.2});}
 lamp(g,pos=[0,0,0],scale=1){const a=this.group(pos,g);a.scale.setScalar(scale);this.ell([0,.31,0],[.19,.24,.19],new T.MeshStandardMaterial({color:'#ffd168',emissive:'#f19f32',emissiveIntensity:.23,roughness:.46}),a);for(const y of [.08,.53]){const m=this.mesh(new T.CylinderGeometry(.14,.14,.06,20),'#856135',a);m.position.y=y;}const h=this.mesh(new T.TorusGeometry(.11,.015,8,20),'#856135',a);h.position.y=.64;for(let i=0;i<6;i++){const th=i*Math.PI/3;this.tube([[Math.cos(th)*.10,.09,Math.sin(th)*.10],[Math.cos(th)*.19,.31,Math.sin(th)*.19],[Math.cos(th)*.10,.52,Math.sin(th)*.10]],.007,'#bc843f',a);}return a;}
 duck(pos){const g=this.group(pos,this.duckRoot);this.ell([0,.20,0],[.23,.18,.30],'#fff2b4',g);this.ell([0,.48,.10],[.16,.17,.16],'#ffe7a0',g);this.ell([0,.42,.26],[.12,.06,.12],'#ed9a3d',g);for(const x of [-.09,.09])this.ell([x,.50,.23],[.024,.028,.022],'#34413b',g);const hat=this.mesh(new T.ConeGeometry(.21,.15,20),'#6ba69a',g);hat.position.y=.68;hat.rotation.z=.2;this.ducks.push(g);return g;}
 text(han,py,w=.65,h=.68){const c=document.createElement('canvas');c.width=512;c.height=512;const x=c.getContext('2d');x.fillStyle='#fff8df';x.fillRect(0,0,512,512);x.strokeStyle='#b88830';x.lineWidth=12;x.strokeRect(12,12,488,488);x.textAlign='center';x.fillStyle='#123e39';x.font=(han.length>1?'64':'82')+'px Arial';x.fillText(py,256,116);x.font='bold '+(han.length>1?'174':'226')+'px "Microsoft YaHei",sans-serif';x.fillText(han,256,393);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());return this.mesh(new T.BoxGeometry(w,h,.08),[this.mat('#bb9257'),this.mat('#bb9257'),this.mat('#bb9257'),this.mat('#bb9257'),new T.MeshBasicMaterial({map:t,toneMapped:false}),this.mat('#eedcb0')],this.taskRoot);}
 clearTask(){for(const g of this.targets.values()){const h=g.userData.hit;if(h){g.remove(h);h.geometry.dispose();h.material.dispose();delete g.userData.hit;}delete g.userData.target;}this.targets.clear();this.disposeGroup(this.taskRoot);this.disposeGroup(this.guideRoot);this.guides=[];this.sockets=[];this.moves=this.moves.filter(a=>!a.task);this.floaters=[];}
 socket(pos,g=this.taskRoot){const s=this.group(pos,g);const base=this.mesh(new T.CylinderGeometry(.27,.32,.18,32),'#134f59',s);base.position.y=.09;const stem=this.mesh(new T.CylinderGeometry(.14,.18,.22,24),'#217b81',s);stem.position.y=.24;const cup=this.mesh(new T.CylinderGeometry(.27,.23,.10,32),'#113d49',s);cup.position.y=.37;const rim=this.mesh(new T.TorusGeometry(.26,.032,8,40),new T.MeshBasicMaterial({color:'#fff0ad',toneMapped:false}),s);rim.rotation.x=Math.PI/2;rim.position.y=.43;return s;}
 arrow(pos){const g=this.group(pos,this.guideRoot),m=new T.MeshBasicMaterial({color:'#f6b635',toneMapped:false});const stem=this.mesh(new T.CylinderGeometry(.025,.025,.16,10),m,g);stem.position.y=.11;const tip=this.mesh(new T.ConeGeometry(.09,.13,12),m,g);tip.rotation.z=Math.PI;this.guides.push({g,base:g.position.clone(),arrow:true,until:this.t+3});return g;}
 hint(){
  this.disposeGroup(this.guideRoot);this.guides=[];
  if(this.task?.kind==='bridge'){for(const s of this.sockets)this.arrow([s.position.x,.89,s.position.z]);}
  else for(const g of this.targets.values()){const v=new T.Vector3();(g.userData.hit||g).getWorldPosition(v);const radius=['pronoun','receive'].includes(this.task?.kind)?.48:this.task?.kind==='seals'?.47:.38;const ring=this.mesh(new T.TorusGeometry(radius,.027,8,48),new T.MeshBasicMaterial({color:'#ffc74c',transparent:true,opacity:.95,depthTest:false,toneMapped:false}),this.guideRoot);ring.renderOrder=8;ring.position.copy(v);this.guides.push({g:ring,target:g,until:this.t+4});}
 }
 celebrate(){this.celebration=this.t+1.3;}
 target(id,g,center=[0,.3,0],size=[.65,.8,.6]){g.userData.target=id;const hit=this.mesh(new T.BoxGeometry(...size),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),g);hit.position.set(...center);hit.castShadow=false;g.userData.hit=hit;this.targets.set(id,g);return g;}
 move(o,to,d=.7,task=false){return new Promise(resolve=>this.moves.push({o,from:o.position.clone(),to:new T.Vector3(...to),t:0,d,task,resolve}));}
 cameraTo(pos,look,snap=false){this.camTo.set(...pos);this.lookTo.set(...look);if(snap||this.reduced){this.camera.position.copy(this.camTo);this.look.copy(this.lookTo);this.camera.lookAt(this.look);}}
 shot(who){const a=this.actors.get(who);if(a){const h=a.height;this.cameraTo([a.g.position.x+.08,h*.82,a.g.position.z+3.3],[a.g.position.x,h*.70,a.g.position.z]);}else if(who==='bridge')this.cameraTo([0,2.1,2.5],[0,.65,-3.6]);else if(who==='journey')this.cameraTo([0,2.25,6.8],[0,1,-2]);else this.cameraTo([0,1.8,6.2],[0,1,-.7]);}
 resetActors(){for(const a of this.actors.values()){a.g.visible=true;a.g.position.copy(a.base);}this.cart.visible=this.ep.id==='math';this.cart.userData.handle.visible=true;this.lampRoot.visible=true;if(this.duckRoot)this.duckRoot.visible=true;}
 beat(b){this.clearTask();this.resetActors();this.speaker=b.who;this.level=0;this.shot(b.shot);this.action=b.action;
  if(b.action==='spread-demo'||b.action==='spread'){if(!this.lamps.length)for(let i=0;i<3;i++)this.lamps.push(this.lamp(this.lampRoot,[(i-1)*.43,.75,.1]));this.lamps.forEach((o,i)=>this.move(o,[(i-1)*.95,.25,.95],1.4));this.cameraTo([0,2.3,5.9],[0,.7,0]);}
  if(b.action==='duck-arrive'||b.action==='duck-more'){const n=b.action==='duck-arrive'?4:5;while(this.ducks.length<n){const i=this.ducks.length,g=this.duck([3+i*.3,0,-.3]);this.move(g,[(i-(n-1)/2)*.50,0,-.6],1.6);}}
  if(b.action==='depart'){if(this.ep.id==='math'){if(!this.lamps.length)for(let i=0;i<5;i++)this.lamps.push(this.lamp(this.lampRoot,[(i-2)*.30,.75,-.55],.70));this.departing=true;this.move(this.cart,[.8,0,-5.6],5);this.lamps.forEach((l,i)=>this.move(l,[.8+(i-2)*.3,.73,-5.6],5));this.ducks.forEach((d,i)=>this.move(d,[.8+(i-2)*.35,0,-6.1],5));}else{for(let i=0;i<3;i++){const l=this.text(['天','地','人'][i],['tiān','dì','rén'][i],.27,.30);l.position.set((i-1)*.4,1,.6);this.move(l,[-3.25,1,-4.2-i*.2],3.5,true);}this.cameraTo([-1,2.1,5.5],[-1,1,-2]);}}
  if(b.action==='letters-fly'&&b.id!=='c01'){for(let i=0;i<6;i++){const l=this.text(['天','地','人'][i%3],['tiān','dì','rén'][i%3],.24,.28);l.position.set((i-2.5)*.42,1+(i%3)*.4,-.2);this.move(l,[(i-2.5)*.6,2.3+(i%2)*.3,-2],3,true);}}
  if(b.id==='c01'){this.ell([.55,.04,.8],[.65,.16,.35],'#946b42',this.taskRoot);const l=this.text('天','tiān',.54,.60);l.position.set(.55,.26,.8);l.rotation.z=-.18;l.rotation.x=-.45;this.cameraTo([0,1.65,5],[0,.75,0]);}
  if(b.action==='letter'){const l=this.text('我','wǒ',.28,.31),a=this.actors.get('friend');l.position.copy(a.g.position).add(new T.Vector3(.28,.70,.20));}
  if(b.action==='pockets'){for(let i=0;i<3;i++){const l=this.text('我','wǒ',.21,.23),a=this.actors.get('squirrel');l.position.copy(a.g.position).add(new T.Vector3((i-1)*.25,.85,.4));this.move(l,[a.g.position.x,.50,a.g.position.z-.08],2.2+i*.4,true);}}
  if(b.action==='teach-world'){this.wordDestinations(true);this.cameraTo([0,1.8,5.4],[0,1.1,0]);}
 }
 mailbox(g,pos){const m=this.group(pos,g);this.box([0,0,0],[.55,.42,.13],'#14536e',m);this.box([0,.02,.09],[.47,.30,.03],'#fff8da',m);this.tube([[-.22,.15,.115],[0,-.01,.115],[.22,.15,.115]],.015,'#cb743a',m);const edge=this.mesh(new T.TorusGeometry(.37,.035,8,48),new T.MeshBasicMaterial({color:'#ffd268',toneMapped:false}),m);edge.position.z=.12;return m;}
 destinationHalo(pos,r){const h=this.mesh(new T.TorusGeometry(r,.045,10,64),new T.MeshBasicMaterial({color:'#ffe398',toneMapped:false,depthTest:false}),this.taskRoot);h.position.set(...pos);h.renderOrder=2;return h;}
 wordDestinations(labels=false){
  for(const a of this.actors.values())a.g.visible=false;this.cart.visible=false;this.lampRoot.visible=false;
  const sky=this.target('天',this.group([-.91,1.60,.2],this.taskRoot),[0,-.08,.22],[1.14,1.05,.7]);
  const skyDisk=this.mesh(new T.CircleGeometry(.63,48),new T.MeshBasicMaterial({color:'#257aa3',toneMapped:false}),sky);skyDisk.position.z=-.08;
  for(let i=0;i<3;i++)this.ell([(i-1)*.25,.14+(i%2)*.13,.02],[.30,.25,.23],'#ffffff',sky);
  this.mailbox(sky,[0,-.30,.24]);this.destinationHalo([-.91,1.60,.15],.65);
  const earth=this.target('地',this.group([.91,.35,.35],this.taskRoot),[0,.15,.22],[1.15,1.06,.8]);
  this.ell([0,0,0],[.60,.22,.44],'#984c2e',earth);this.ell([0,.09,0],[.51,.14,.37],'#dd9b58',earth);this.tube([[0,.12,0],[0,.78,0]],.038,'#285f38',earth);
  for(const s of [-1,1]){const leaf=this.ell([s*.18,.53,0],[.26,.09,.075],'#448a43',earth);leaf.rotation.z=s*.35;}
  this.mailbox(earth,[0,.02,.50]);this.destinationHalo([.91,.59,.85],.65);
  const a=this.actors.get('brother');a.g.visible=true;a.g.position.set(0,0,-.80);this.target('人',a.g,[0,.72,.25],[.80,1.68,.65]);this.mailbox(this.taskRoot,[0,.78,-.45]);
  const pad=this.mesh(new T.CylinderGeometry(.47,.54,.10,32),'#206d7a',this.taskRoot);pad.position.set(0,.02,-.8);const rim=this.mesh(new T.TorusGeometry(.49,.035,8,48),new T.MeshBasicMaterial({color:'#ffe398',toneMapped:false}),this.taskRoot);rim.rotation.x=-Math.PI/2;rim.position.set(0,.08,-.8);
  if(labels)for(const [w,p,pos]of [['天','tiān',[-.91,2.4,.2]],['地','dì',[.91,1.57,.35]],['人','rén',[0,2.12,-.6]]]){const l=this.text(w,p,.50,.54);l.position.set(...pos);}
 }
 setup(b,step=0){this.clearTask();this.resetActors();this.speaker=null;this.level=0;this.task=b;this.step=step;this.action=null;this.cart.position.set(0,0,-.55);this.cameraTo([0,2.4,5.2],[0,.9,-.1],true);
  this.duckRoot.visible=false;this.cart.userData.handle.visible=false;
  if(['pack','supply','hidden','share','boxes'].includes(b.kind)){this.discoverySetup(b);return;}
  if(['load','return','add'].includes(b.kind)){
   for(const [k,a]of this.actors){a.g.visible=false;}
   this.disposeGroup(this.lampRoot);this.lamps=[];
   const n=b.kind==='load'?5:b.kind==='return'?3:1;
   const base=b.kind==='add'?b.goal-1:0;
   for(let i=0;i<base;i++)this.lamps.push(this.lamp(this.lampRoot,[(i-(b.goal-1)/2)*.30,.71,-.55],.8));
   for(let i=0;i<n;i++){const x=b.kind==='add'?0:n===5?(i<3?(i-1)*.64:(i-3.5)*.68):(i-1)*.64,z=n===5?(i<3?.4:1.18):.8;const g=this.lamp(this.lampRoot,[x,.12,z],1);this.target('lamp-'+i,g,[0,.33,0],[.50,.77,.60]);}
   const sockets=b.kind==='add'?b.goal:3;for(let i=0;i<sockets;i++){const slot=this.mesh(new T.CylinderGeometry(.145,.145,.035,24),'#14515b',this.taskRoot);slot.position.set((i-(sockets-1)/2)*.30,.72,-.55);const rim=this.mesh(new T.TorusGeometry(.14,.022,8,28),new T.MeshBasicMaterial({color:'#ffedab',toneMapped:false}),this.taskRoot);rim.rotation.x=-Math.PI/2;rim.position.set(slot.position.x,.746,-.55);}
   this.hint();
  }else if(b.kind==='bridge'){
   for(const a of this.actors.values())a.g.visible=false;this.cart.visible=false;this.lampRoot.visible=false;
   this.cameraTo([0,3.0,6.8],[0,.70,-.1],true);this.sockets=[];
   for(let i=0;i<4;i++)this.sockets.push(this.socket([(i-1.5)*.68,.06,-.9]));
   const sign=this.text('灯座','dēng zuò',.85,.56);sign.position.set(0,1.20,-1.05);
   this.hint();
   // Identical docks; quantity is the only reliable clue.
   for(const [j,n]of [3,5,4].entries()){const g=this.target('bundle-'+n,this.group([(j-1)*.90,.08,1.0],this.taskRoot),[0,.25,0],[.84,.8,.8]);this.box([0,.015,0],[.85,.10,.84],'#ffdfa0',g);this.box([0,.074,0],[.77,.045,.76],'#225662',g);g.userData.lamps=[];for(let i=0;i<n;i++)g.userData.lamps.push(this.lamp(g,[Math.cos(i*2*Math.PI/n)*.245,.10,Math.sin(i*2*Math.PI/n)*.26],.51));}
  }else if(['mail','clue'].includes(b.kind)){this.wordDestinations(false);this.cameraTo([0,2.3,8.6],[0,1.45,0],true);}
  else if(b.kind==='pronoun'){
   for(const a of this.actors.values())a.g.visible=false;this.cart.visible=false;
   for(const [k,x]of [['friend',-.72],['brother',.72]]){const a=this.actors.get(k);a.g.visible=true;a.g.position.set(x,0,0);this.target(k,a.g,[0,.8,0],[.7,1.65,.6]);}
   if(b.id==='c08'){const f=this.actors.get('friend').g;const kite=this.group([f.position.x-.03,1.97,-.25],this.taskRoot);const s=new T.Shape();s.moveTo(0,.32);s.lineTo(.22,0);s.lineTo(0,-.32);s.lineTo(-.22,0);s.closePath();this.mesh(new T.ShapeGeometry(s),new T.MeshStandardMaterial({color:'#ed9d5b',side:T.DoubleSide,roughness:.85}),kite);this.tube([[0,-.32,0],[.10,-.54,0],[.05,-.70,0]],.01,'#528e89',kite);this.tube([[f.position.x-.26,.62,.12],[f.position.x-.19,1.2,-.04],[f.position.x-.03,1.97,-.25]],.006,'#e9dcc0',this.taskRoot);}
   this.cameraTo([0,1.55,4.7],[0,.96,0],true);
  }else if(b.kind==='receive'){
   for(const [k,a]of this.actors)a.g.visible=k==='friend';this.cart.visible=false;this.actors.get('friend').g.position.set(0,0,-.55);const l=this.text('你','nǐ',.8,.9);l.position.set(0,.95,.75);this.target('letter',l,[0,0,0],[.9,1,.2]);this.cameraTo([0,1.4,3.7],[0,1.05,0],true);
  }else if(b.kind==='seals'){
   for(const a of this.actors.values())a.g.visible=false;this.cart.visible=false;this.lampRoot.visible=false;
   const pool=step<3?['天','地','人']:['我','你','他'],order=step%2?[pool[2],pool[1],pool[0]]:[pool[1],pool[0],pool[2]];for(const [i,w]of order.entries()){const l=this.text(w,{天:'tiān',地:'dì',人:'rén',我:'wǒ',你:'nǐ',他:'tā'}[w],.76,.92);l.position.set((i-1)*.95,1.0,.1);this.target(w,l,[0,0,0],[.8,.96,.25]);const base=this.mesh(new T.CylinderGeometry(.36,.40,.20,32),'#287480',this.taskRoot);base.position.set((i-1)*.95,.40,.1);}this.cameraTo([0,1.6,6.8],[0,1,0],true);
  }
 }
 async collect(id,n,total=3){const g=this.targets.get(id);if(!g)return;this.targets.delete(id);g.userData.target=null;await this.move(g,[(n-1-(total-1)/2)*.30,.75,-.55],.65);this.lamps.push(g);}
 tidyLamps(){for(const[id,g]of this.targets)if(id.startsWith('lamp-')){g.removeFromParent();this.disposeGroup(g);this.targets.delete(id);}}
 async reward(id){const g=this.targets.get(id);if(g){if(['mail','clue'].includes(this.task?.kind)){const to=new T.Vector3();g.userData.hit.getWorldPosition(to);const w=this.task.kind==='mail'?this.task.goal[this.step]:'信',p=this.task.kind==='mail'?{天:'tiān',地:'dì',人:'rén'}[w]:'xìn';const letter=this.text(w,p,.38,.44);letter.position.set(0,.65,3.0);await this.move(letter,[to.x,to.y,to.z+.15],.9,true);const a=this.actors.get('brother');if(id==='人')a.g.rotation.y=-.13;}else{await this.move(g,id==='letter'?[0,.35,2.75]:[g.position.x,g.position.y+.22,g.position.z],id==='letter'?.65:.35,true);}}}
 bell(pos=[1.03,.2,1.35],label='出发',py='chū fā'){
  const g=this.group(pos,this.taskRoot);this.box([0,0,0],[.62,.13,.65],'#165264',g);this.ell([0,.17,0],[.22,.16,.22],'#da654a',g);const tip=this.mesh(new T.CylinderGeometry(.05,.05,.11,16),'#ffe4a4',g);tip.position.y=.35;
  const t=this.text(label,py,.58,.38);t.position.copy(g.position).add(new T.Vector3(0,.63,0));this.target('bell',g,[0,.18,0],[.68,.70,.68]);return g;
 }
 discoverySetup(b){
  for(const a of this.actors.values())a.g.visible=false;this.disposeGroup(this.lampRoot);this.lamps=[];this.lampRoot.visible=true;this.packed=new Set();this.plateCounts=[0,0];this.cameraTo([0,3.25,7.8],[0,.80,0],true);
  if(b.kind==='pack'){
   for(let i=0;i<5;i++){const g=this.lamp(this.lampRoot,[(i%3-1)*.65,.12,.6+Math.floor(i/3)*.80],.82);g.userData.home=g.position.clone();this.target('lamp-'+i,g,[0,.30,0],[.5,.7,.5]);}
   for(let i=0;i<3;i++){const s=this.socket([(i-1)*.37,.61,-.55]);s.scale.setScalar(.52);}this.bell();
  }else if(b.kind==='supply'){
   for(let i=0;i<b.goal-1;i++)this.lamps.push(this.lamp(this.lampRoot,[(i-(b.goal-1)/2)*.35,.75,-.55],.70));
   this.duckRoot.visible=true;this.disposeGroup(this.duckRoot);this.ducks=[];for(let i=0;i<b.goal;i++)this.duck([(i-(b.goal-1)/2)*.5,0,.20]);
   const free=this.socket([(b.goal-1)/2*.35,.40,-.55]);free.scale.setScalar(.5);
   for(const [j,n]of (b.goal===4?[2,1]:[1,2]).entries()){const g=this.target('supply-'+n,this.group([(j-.5)*1.1,.08,1.0],this.taskRoot),[0,.27,0],[.90,.85,.82]);this.box([0,0,0],[.90,.12,.78],'#145365',g);g.userData.lamps=[];for(let i=0;i<n;i++)g.userData.lamps.push(this.lamp(g,[(i-(n-1)/2)*.34,.08,0],.72));}
  }else if(b.kind==='hidden'){
   this.cart.visible=false;
   for(let i=0;i<3;i++)this.lamp(this.taskRoot,[-1.08+i*.38,.20,-.8],.78);
   const chest=this.group([.72,.15,-.8],this.taskRoot);this.box([0,0,0],[1.16,.17,.90],'#376f78',chest);for(let i=0;i<2;i++)this.lamp(chest,[(i-.5)*.44,.05,0],.72);
   this.hiddenLid=this.group([0,0,0],chest);this.box([0,.38,.36],[1.20,.83,.08],'#337f8c',this.hiddenLid);this.box([0,.78,0],[1.20,.08,.84],'#81c1b7',this.hiddenLid);for(const x of [-.56,.56])this.box([x,.38,0],[.08,.82,.84],'#337f8c',this.hiddenLid);
   const total=this.text('共5','gòng',.72,.48);total.position.set(-.18,1.49,-.65);
   for(const[j,n]of [1,3,2].entries()){const g=this.target('hidden-'+n,this.group([(j-1)*.9,.06,1.0],this.taskRoot),[0,.30,0],[.82,.82,.85]);this.box([0,0,0],[.82,.10,.84],'#215c6b',g);for(let i=0;i<n;i++)this.lamp(g,[(i-(n-1)/2)*.23,.08,0],.60);}
  }else if(b.kind==='share'){
   this.cart.visible=false;this.duckRoot.visible=true;this.disposeGroup(this.duckRoot);this.ducks=[];this.sharePlates=[];this.cookieObjects=[];this.cookiePlaces=[-1,-1,-1,-1];
   for(const [i,x]of [-.85,.85].entries()){this.duck([x,0,-.9]);const g=this.group([x,.40,.05],this.taskRoot);const plate=this.mesh(new T.CylinderGeometry(.51,.45,.10,36),'#fff0c3',g);const ring=this.mesh(new T.TorusGeometry(.48,.035,8,48),new T.MeshBasicMaterial({color:'#258796',toneMapped:false}),g);ring.rotation.x=Math.PI/2;ring.position.y=.08;this.sharePlates.push(g);this.target('plate-'+i,g,[0,.1,0],[1.0,.6,1.0]);}
   this.box([-.25,.03,1.3],[1.45,.12,.72],'#296c77',this.taskRoot);for(let i=0;i<4;i++)this.cookieObjects.push(this.cookie([-.76+i*.33,.15,1.3]));this.bell([1.05,.14,1.3],'开吃','kāi chī');
  }else if(b.kind==='boxes'){
   this.cart.visible=false;this.box([0,.36,-.9],[2.3,.12,.7],'#286e78',this.taskRoot);this.boxCookies=[];for(let i=0;i<4;i++)this.boxCookies.push(this.cookie([(i-1.5)*.48,.48,-.9]));
   this.boxChoices=new Map();for(const[j,n]of [1,3,2].entries()){const g=this.group([(j-1)*1.0,.1,.9],this.taskRoot);this.box([0,0,0],[.94,.08,1.08],'#ffe0a0',g);g.userData.boxes=[];for(let i=0;i<n;i++){const box=this.foodBox([0,.10,(i-(n-1)/2)*.33],g,.55);g.userData.boxes.push(box);}this.target('boxes-'+n,g,[0,.20,0],[.92,.85,1.08]);this.boxChoices.set(n,g);}
  }
 }
 async toggleLamp(id){const g=this.targets.get(id);if(!g||!id.startsWith('lamp-'))return false;const removing=this.packed.has(id);if(removing)this.packed.delete(id);else this.packed.add(id);const moves=[];for(const[k,o]of this.targets){if(!k.startsWith('lamp-'))continue;const i=[...this.packed].indexOf(k);const to=i<0?o.userData.home.toArray():[(i-1)*.37,.76,-.55];moves.push(this.move(o,to,.42));}await Promise.all(moves);return removing?'remove':'add';}
 finishPack(){this.lamps=[];for(const[id,g]of [...this.targets]){if(!id.startsWith('lamp-'))continue;if(this.packed.has(id))this.lamps.push(g);else{g.removeFromParent();this.disposeGroup(g);this.targets.delete(id);}}}
 async deliverSupply(n){const g=this.targets.get('supply-'+n);const supplied=g.userData.lamps;for(const o of this.targets.values())o.visible=false;await Promise.all(supplied.map((l,i)=>{this.lampRoot.attach(l);this.lamps.push(l);return this.move(l,[((this.task.goal-1+i)-(this.task.goal-1)/2)*.35,.75,-.55],.7,true);}));}
 async revealHidden(){await this.move(this.hiddenLid,[0,1.18,-.25],.85,true);}
 cookie(pos,g=this.taskRoot){const c=this.group(pos,g);const cake=this.mesh(new T.CylinderGeometry(.14,.15,.14,24),'#d89048',c);cake.position.y=.07;const top=this.mesh(new T.CylinderGeometry(.13,.13,.025,24),'#ffe0a0',c);top.position.y=.15;for(const x of [-.05,.05])this.ell([x,.18,.01],[.025,.025,.025],'#9d5940',c);return c;}
 async shareCake(id){if(!id.startsWith('plate-'))return false;const plate=+id.slice(-1),free=this.cookiePlaces.indexOf(-1);let i,to;
  if(free>=0){i=free;this.cookiePlaces[i]=plate;this.plateCounts[plate]++;}else{i=this.cookiePlaces.lastIndexOf(plate);if(i<0)return false;this.cookiePlaces[i]=-1;this.plateCounts[plate]--;}
  const moves=[];for(let k=0;k<4;k++){const owner=this.cookiePlaces[k],c=this.cookieObjects[k];if(owner<0)to=[-.76+k*.33,.15,1.3];else{const group=this.cookiePlaces.map((v,j)=>v===owner?j:-1).filter(j=>j>=0),rank=group.indexOf(k);to=[(owner? .85:-.85)+(rank%2-.5)*.34,.51,.05+(Math.floor(rank/2)-.5)*.34];}moves.push(this.move(c,to,.35,true));}await Promise.all(moves);return true;}
 foodBox(pos,g=this.taskRoot,scale=1){const box=this.group(pos,g);box.scale.setScalar(scale);this.box([0,0,0],[.95,.08,.5],'#f1c078',box);for(const x of [-.46,.46])this.box([x,.12,0],[.07,.23,.55],'#a77548',box);for(const z of [-.24,.24])this.box([0,.12,z],[.95,.23,.06],'#b37d4b',box);return box;}
 async fillBoxes(n){for(const g of this.targets.values())g.visible=false;for(let i=0;i<n;i++){const box=this.foodBox([(i-(n-1)/2)*1.02,.40,.3]);for(let j=0;j<2&&i*2+j<4;j++){const cake=this.boxCookies[i*2+j];await this.move(cake,[box.position.x+(j-.5)*.35,.49,.3],.30,true);}}}
 async fillBridge(n=4){this.disposeGroup(this.guideRoot);this.guides=[];const group=this.targets.get('bundle-'+n),lamps=group.userData.lamps;const moves=lamps.map((l,i)=>{this.taskRoot.attach(l);l.scale.setScalar(.86);return this.move(l,i<4?[(i-1.5)*.68,.50,-.9]:[1.10,.10,.40],.8,true);});for(const g of this.targets.values())g.visible=false;await Promise.all(moves);if(n<4)this.arrow([this.sockets[3].position.x,.92,-.9]);if(n>4)this.arrow([1.1,.98,.4]);}
 forest(){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#866846';ctx.fillRect(0,0,128,256);for(let i=0;i<80;i++){ctx.strokeStyle=i%2?'#a48358':'#6f533b';ctx.lineWidth=1+i%3;ctx.beginPath();ctx.moveTo((i*47)%128,0);ctx.bezierCurveTo((i*47)%128+8,70,(i*47)%128-6,160,(i*47)%128+3,256);ctx.stroke();}const bark=new T.CanvasTexture(canvas);bark.colorSpace=T.SRGBColorSpace;bark.wrapS=bark.wrapT=T.RepeatWrapping;
  const barkMat=new T.MeshStandardMaterial({map:bark,roughness:.98});
  const leaf=new T.BufferGeometry();leaf.setAttribute('position',new T.Float32BufferAttribute([0,0,0,-.20,.34,.04,-.14,.70,0,0,1,-.07,.14,.70,0,.20,.34,.04,0,.42,.1],3));leaf.setIndex([0,1,6,1,2,6,2,3,6,3,4,6,4,5,6,5,0,6]);leaf.computeVertexNormals();
  const foliage=new T.InstancedMesh(leaf,new T.MeshStandardMaterial({color:'#b5d19c',side:T.DoubleSide,roughness:.9}),22*160);foliage.castShadow=true;foliage.receiveShadow=true;const dummy=new T.Object3D();let idx=0;
  for(let i=0;i<22;i++){const x=i<16?(i%2?-1:1)*(3.8+(i%3)*1.4):(i-18.5)*1.3,z=i<16?-1-Math.floor(i/2)*2.05:-10-(i%2),h=4.2+(i%4)*.6,g=this.group([x,0,z]);const trunk=this.mesh(new T.CylinderGeometry(.13,.25,h,10),barkMat,g);trunk.position.y=h/2;for(let j=0;j<3;j++){const a=j*2.1+i;this.tube([[0,0,0],[Math.cos(a)*.24,.08,Math.sin(a)*.24],[Math.cos(a)*.55,0,Math.sin(a)*.55]],.075,barkMat,g);this.tube([[0,h*.55,0],[Math.cos(a)*.65,h*.82,Math.sin(a)*.65],[Math.cos(a)*1.15,h,Math.sin(a)*1.15]],.085,barkMat,g);}
   for(let j=0;j<160;j++){const a=j*2.399,b=Math.acos(1-2*(j+.5)/160),r=1.25+.35*Math.sin(j*9.1);dummy.position.set(x+Math.cos(a)*Math.sin(b)*r,h+.3+Math.cos(b)*.7,z+Math.sin(a)*Math.sin(b)*r);dummy.rotation.set(.8+Math.sin(j)*.8,a,Math.cos(j)*.6);dummy.scale.setScalar(.45+.35*(j%7)/7);dummy.updateMatrix();foliage.setMatrixAt(idx,dummy.matrix);foliage.setColorAt(idx,new T.Color().setHSL(.24+(j%5)*.012,.35+(j%4)*.035,.32+(j%7)*.036));idx++;}
  }this.root.add(foliage);for(let i=0;i<9;i++)this.ell([(i-4)*4,-1,-20-(i%3)*2],[5,3+(i%3),4],i%2?'#7daf99':'#88baa5');
 }
 positions(){this.scene.updateMatrixWorld(true);this.camera.updateMatrixWorld(true);const b=this.host.getBoundingClientRect();return Object.fromEntries([...this.targets].filter(([k,g])=>g.visible).map(([id,g])=>{const v=new T.Vector3();(g.userData.hit||g).getWorldPosition(v);v.project(this.camera);return[id,{x:b.left+(v.x+.1e-10+1)*b.width/2,y:b.top+(1-v.y)*b.height/2}];}));}
 frame(){requestAnimationFrame(this.frame);const dt=Math.min(this.clock.getDelta(),.07);if(!this.active)return;if(!this.paused){this.t+=dt;this.camera.position.lerp(this.camTo,1-Math.exp(-dt*3));this.look.lerp(this.lookTo,1-Math.exp(-dt*3));for(let i=this.moves.length-1;i>=0;i--){const a=this.moves[i];a.t+=dt;const u=Math.min(1,a.t/a.d);a.o.position.lerpVectors(a.from,a.to,u*u*(3-2*u));if(a.d<2)a.o.position.y+=Math.sin(u*Math.PI)*.25;if(u===1){this.moves.splice(i,1);a.resolve();}}
   for(const[k,a]of this.actors){if(!a.g.visible)continue;const speaking=k===this.speaker&&this.level>.005;const happy=this.celebration>this.t;const blink=Math.pow(Math.max(0,Math.cos(this.t*1.7+k.length)),50);a.g.rotation.y=this.reduced?0:Math.sin(this.t*.65+k.length)*.045;a.g.rotation.z=this.reduced?0:Math.sin(this.t*1.6+k.length)*.008;if(a.mouth)a.mouth.scale.y=.012+(speaking?this.level*.07:0);for(const m of a.morphs){const d=m.morphTargetDictionary||{};for(const n of ['speak','blink','smile','point','nod'])if(d[n]!==undefined)m.morphTargetInfluences[d[n]]=n==='speak'?(speaking?this.level*.78:0):n==='blink'?blink:n==='smile'?(happy?.7:.20):n==='point'?(speaking&&this.action==='point'?.7:0):speaking?.30*Math.max(0,Math.sin(this.t*3)):0;}}
   for(const h of this.guides){if(h.arrow){h.g.position.y=h.base.y+(this.reduced?0:.05*Math.sin(this.t*3));}else{h.g.visible=this.t<h.until;if(h.target?.parent){(h.target.userData.hit||h.target).getWorldPosition(h.g.position);h.g.quaternion.copy(this.camera.quaternion);h.g.scale.setScalar(this.reduced?1:1+.045*Math.sin(this.t*3));}}}
   for(const f of this.floaters)if(f.grow)f.g.scale.lerp(new T.Vector3(.8,.8,.8),.10);
  }this.camera.lookAt(this.look);this.onFrame?.();this.renderer.render(this.scene,this.camera);
 }
}
