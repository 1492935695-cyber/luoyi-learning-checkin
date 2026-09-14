/* Mimi's Adventure Island — real WebGL geometry, no remote assets or accounts. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id), app=$('app');
  $('reloadBtn').onclick=()=>location.reload();
  function fail(message) { $('loading').hidden=true;$('failure').hidden=false;$('failureText').textContent=message; }
  if(!window.THREE || !window.IslandLogic) { fail('游戏文件没有加载完整，请连上网络后重新打开。');return; }
  const G=window.IslandLogic, T=window.THREE, SAVE='mimi-island-v1', reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let levelIndex=0,l=G.levels[0],state=G.initial(l),history=[],completed=new Set(),started=false,ready=false;
  let renderer,scene,camera,board,avatar,avatarBody,feet=[],ears=[],eyes=[],stars=[],boxes=[],plates=[],bridges=[],goals=[],sparks=[];
  let houseLamp,homeRing,moveTween=null,cameraQuarter=0,cameraAngle=.38,desiredAngle=.38,wonTimer=null,sessionWins=0;
  let hintCount=0,hintRequest=0,hintWorker=null,hintTimer=null,lastFrame=0,sound=false,audio=null,saveOK=true;
  let savedStates={};
  const geometryCache=new Map(),materialCache=new Map(),textures=[],raycaster=new T.Raycaster(),pointer=new T.Vector2();
  const point=new T.Vector3(),groundPlane=new T.Plane(new T.Vector3(0,1,0),-.06),cameraTarget=new T.Vector3();
  function clone(s){return {p:s.p,boxes:[...s.boxes],stars:s.stars,open:s.open,moves:s.moves};}
  try {
    const data=JSON.parse(localStorage.getItem(SAVE)||'null');
    if(data&&data.version===1){
      completed=new Set((Array.isArray(data.done)?data.done:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<G.levels.length));
      if(Number.isInteger(data.level)&&G.levels[data.level])levelIndex=data.level;
      for(const [n,v] of Object.entries(data.states||{})) if(G.levels[n]&&G.valid(G.levels[n],v.state))
        savedStates[n]={state:clone(v.state),history:Array.isArray(v.history)?v.history.filter(s=>G.valid(G.levels[n],s)).slice(-200).map(clone):[]};
      sound=data.sound===true;
    }
  } catch(_){saveOK=false;}
  function save(){
    if(started)savedStates[levelIndex]={state:clone(state),history:history.slice(-200).map(clone)};
    try{localStorage.setItem(SAVE,JSON.stringify({version:1,level:levelIndex,done:[...completed],states:savedStates,sound}));saveOK=true;}
    catch(_){saveOK=false;}
    $('saveStatus').textContent=saveOK?'在这台设备自动保存':'浏览器未允许保存，请保持页面打开';
  }
  function mat(color,extra={}) {
    const key=String(color)+JSON.stringify(extra);
    if(!materialCache.has(key))materialCache.set(key,new T.MeshStandardMaterial({color,roughness:.84,metalness:0,...extra}));
    return materialCache.get(key);
  }
  function geo(key,create){if(!geometryCache.has(key))geometryCache.set(key,create());return geometryCache.get(key);}
  function mesh(parent,g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function ball(parent,color,x,y,z,sx,sy=sx,sz=sx){const o=mesh(parent,geo('sphere',()=>new T.SphereGeometry(1,16,12)),mat(color),x,y,z);o.scale.set(sx,sy,sz);return o;}
  function cube(parent,color,x,y,z,w,h,d){const o=mesh(parent,geo('cube',()=>new T.BoxGeometry(1,1,1)),mat(color),x,y,z);o.scale.set(w,h,d);return o;}
  function round(parent,color,x,y,z,w,h,d,r=.08){
    const k=`round:${w},${h},${d},${r}`;
    const g=geo(k,()=>{const s=new T.Shape(),a=-w/2,b=-d/2;
      s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);s.lineTo(a+w,b+d-r);s.quadraticCurveTo(a+w,b+d,a+w-r,b+d);s.lineTo(a+r,b+d);s.quadraticCurveTo(a,b+d,a,b+d-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);
      const bevel=Math.min(r/2,h*.2);
      const g=new T.ExtrudeGeometry(s,{depth:h-2*bevel,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:Math.min(r/2,.04),bevelThickness:bevel,curveSegments:3});g.rotateX(-Math.PI/2);g.translate(0,-h/2+bevel,0);return g;});
    return mesh(parent,g,mat(color),x,y,z);
  }
  function cylinder(parent,color,x,y,z,radius,height,radial=16){const k=`c:${radius},${height},${radial}`;return mesh(parent,geo(k,()=>new T.CylinderGeometry(radius,radius,height,radial)),mat(color),x,y,z);}
  function ring(parent,color,x,y,z,radius=.3,tube=.025){const o=mesh(parent,geo(`ring:${radius},${tube}`,()=>new T.TorusGeometry(radius,tube,8,32)),mat(color),x,y,z);o.rotation.x=-Math.PI/2;return o;}
  function at(p){return {x:p%l.width-(l.width-1)/2,z:Math.floor(p/l.width)-(l.height-1)/2};}
  function starGeometry(){return geo('star',()=>{const s=new T.Shape();for(let i=0;i<10;i++){const angle=Math.PI/2+i*Math.PI/5,r=i%2?.14:.3,x=Math.cos(angle)*r,y=Math.sin(angle)*r;i?s.lineTo(x,y):s.moveTo(x,y);}s.closePath();const g=new T.ExtrudeGeometry(s,{depth:.10,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.025});g.translate(0,0,-.05);return g;});}
  function flower(parent,x,z,color=0xfff2cf,scale=1){
    const g=new T.Group();g.position.set(x,.06,z);g.scale.setScalar(scale);parent.add(g);
    cylinder(g,0x6c9968,0,.12,0,.018,.24,6);
    for(let j=0;j<5;j++){const a=j*Math.PI*2/5;ball(g,color,Math.cos(a)*.065,.24+Math.sin(a)*.055,0,.06,.055,.033);}
    ball(g,0xf1b34b,0,.24,.026,.036);
  }
  function tree(parent,x,z,size=1,color=0x89b188){
    const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(size);parent.add(g);
    cylinder(g,0xa4815c,0,.55,0,.105,1.1,8);
    ball(g,color,0,1.4,0,.6,.82,.58);ball(g,color,-.28,1.25,.1,.36,.45,.38);
    ball(g,0xb2c994,.19,1.74,.03,.19,.24,.2);
    ball(g,0xdccb99,0,.08,0,.26,.08,.24);
    return g;
  }
  function bunny(parent){
    const a=new T.Group(),body=new T.Group();parent.add(a);a.add(body);avatarBody=body;
    ball(body,0xfff4df,0,.50,0,.285,.35,.235);
    ball(body,0x72aa9b,0,.39,.02,.278,.24,.24);
    round(body,0x609989,0,.55,.212,.28,.26,.045,.03);
    ball(body,0xf6d889,-.10,.63,.244,.026);ball(body,0xf6d889,.10,.63,.244,.026);
    ball(body,0xfff9ee,0,.90,.01,.34,.31,.29);
    ears=[];for(const sign of [-1,1]){
      const ear=new T.Group();ear.position.set(sign*.145,1.13,0);ear.rotation.z=sign*-.15;body.add(ear);
      ball(ear,0xfff6e8,0,.23,0,.105,.33,.10);ball(ear,0xe8b8af,0,.23,.073,.052,.25,.025);ears.push(ear);
    }
    eyes=[ball(body,0x354b42,-.115,.94,.273,.028,.043,.019),ball(body,0x354b42,.115,.94,.273,.028,.043,.019)];
    for(const sign of [-1,1]){
      ball(body,0xffffff,sign*.115-.006,.952,.290,.008);
      ball(body,0xe9b6a3,sign*.209,.843,.221,.055,.028,.018);
      ball(body,0xfffcf2,sign*.052,.832,.274,.070,.055,.034);
      const hand=ball(body,0xfff4df,sign*.30,.50,.03,.09,.145,.10);hand.rotation.z=sign*.3;
    }
    ball(body,0xbc8276,0,.86,.311,.035,.026,.016);
    cube(body,0x977a70,0,.819,.311,.011,.031,.008);
    ball(body,0xfff8e8,0,.40,-.27,.105);
    feet=[ball(a,0xfff1d9,-.15,.12,.10,.123,.11,.20),ball(a,0xfff1d9,.15,.12,.10,.123,.11,.20)];
    round(body,0xd3a757,0,.57,-.235,.33,.35,.17,.065);
    round(body,0xe1c078,0,.67,-.329,.34,.12,.035,.03);
    const leaf=ball(body,0x6f9f70,.13,1.15,.12,.14,.045,.07);leaf.rotation.z=.35;
    a.userData.face=0;return a;
  }
  function crate(p){
    const {x,z}=at(p),g=new T.Group();board.add(g);g.position.set(x,.07,z);g.userData.cell=p;
    round(g,0xd8ac70,0,.29,0,.65,.58,.65,.055);
    for(const h of [.10,.45])for(const sign of [-1,1])cube(g,0xb8874d,0,h,sign*.337,.68,.065,.033);
    for(const sign of [-1,1]){cube(g,0xeac991,sign*.23,.29,.343,.065,.52,.035);cube(g,0xbd9055,sign*.343,.29,0,.035,.52,.065);}
    const badge=mesh(g,geo('badge',()=>new T.CylinderGeometry(.13,.13,.018,6)),mat(0xf5dc87),0,.29,.354);badge.rotation.x=Math.PI/2;
    return g;
  }
  function house(p){
    const {x,z}=at(p),g=new T.Group();board.add(g);g.position.set(x,.03,z);
    round(g,0xffedc4,0,.4,-.11,.77,.78,.66,.08);
    const roof=mesh(g,geo('roof',()=>new T.ConeGeometry(.66,.55,4)),mat(0xcb927f),0,1.01,-.1);roof.rotation.y=Math.PI/4;roof.scale.z=.93;
    round(g,0x678f7f,0,.26,.243,.27,.48,.035,.07);
    ball(g,0xf3d38e,.075,.27,.268,.021);
    cylinder(g,0xecd8ac,.25,1.05,-.28,.085,.42,8);
    houseLamp=ball(g,0xf9da80,-.26,.57,.24,.080,.090,.02);
    houseLamp.material=mat(0xf9da80,{emissive:0xffcc66,emissiveIntensity:.3});
    round(g,0xe5d5ae,0,.028,.34,.60,.07,.25,.02);
    homeRing=ring(board,0xe7ce7a,x,.06,z,.42,.032);
  }
  function makeScene(){
    renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;
    renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
    $('world').appendChild(renderer.domElement);
    scene=new T.Scene();scene.background=new T.Color(0xe5efe8);scene.fog=new T.Fog(0xe5efe8,23,65);
    camera=new T.OrthographicCamera(-8,8,6,-6,.1,90);
    scene.add(new T.HemisphereLight(0xfff6df,0x729787,2.2));
    const sun=new T.DirectionalLight(0xffedcc,3.1);sun.position.set(-5,12,7);sun.castShadow=true;
    sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:.5,far:32});
    sun.shadow.bias=-.0005;sun.shadow.normalBias=.035;sun.shadow.radius=3;scene.add(sun);
    const fill=new T.DirectionalLight(0xd4e7ff,.6);fill.position.set(7,4,-7);scene.add(fill);
    const water=mesh(scene,geo('water',()=>new T.PlaneGeometry(180,180)),mat(0xc4ddce),0,-1.35,0);water.rotation.x=-Math.PI/2;water.castShadow=false;
    // Soft scenery, placed away from playable tiles.
    for(const [x,z,s] of [[-9,-7,1.4],[9,-8,1.8],[12,5,1.2],[-11,8,1.5]]){
      const island=new T.Group();island.position.set(x,-.75,z);scene.add(island);
      ball(island,0x9bba96,0,-.1,0,1.3*s,.45,1*s);tree(island,0,0,s*.75,0x8aac83);
    }
    for(let i=0;i<6;i++){
      const cloud=new T.Group();cloud.position.set((i-2.5)*5,-.5,-10-(i%2)*3);scene.add(cloud);
      for(let j=0;j<4;j++){const b=ball(cloud,0xf6f5e6,j*.45,Math.sin(j)*.15,0,.55,.27,.35);b.castShadow=false;}
    }
    board=new T.Group();scene.add(board);
    renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();ready=false;save();fail('画面暂时休息了。进度已尝试保存，请点“重新打开”。');});
    renderer.domElement.addEventListener('pointerdown',onSceneTap);
    window.addEventListener('resize',resize);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){save();if(audio)audio.suspend();}else{lastFrame=0;if(audio&&sound)audio.resume().catch(()=>{});}});
  }
  function buildBoard(){
    board.traverse(o=>{if(o.isInstancedMesh)o.dispose();});
    while(board.children.length)board.remove(board.children[0]);
    stars=[];boxes=[];plates=[];bridges=[];goals=[];sparks=[];moveTween=null;
    const theme=G.chapters[l.chapter];scene.background.set(theme.sky);scene.fog.color.set(theme.sky);
    round(board,theme.side,0,-.64,0,l.width+.25,.9,l.height+.20,.4);
    round(board,theme.ground,0,-.20,0,l.width+.36,.19,l.height+.32,.35);
    for(let p=0;p<l.cells.length;p++){
      const c=l.cells[p],{x,z}=at(p);
      if(c==='~'){round(board,0x8cbbba,x,-.1,z,.98,.10,.98,.025);continue;}
      if(c==='='){
        const g=new T.Group();g.position.set(x,-.55,z);g.userData.cell=p;board.add(g);
        round(board,0x86b6b7,x,-.10,z,.97,.06,.97,.015);
        for(let j=0;j<5;j++)round(g,0xe3c491,-.40+j*.20,0,0,.16,.12,.85,.015);
        for(const sign of [-1,1]){cube(g,0xb19369,0,-.12,sign*.31,.98,.12,.08);}
        bridges.push(g);continue;
      }
      const color=c==='#'?theme.ground:((p+Math.floor(p/l.width))%2===0?0xf0dfb8:0xf5e8ce);
      const tile=round(board,color,x,-.04,z,.95,.14,.95,.045);tile.userData.cell=p;
      if(c==='#'){
        const h=(p*13%7)/40;
        round(board,l.chapter===3?0xa596b8:l.chapter===2?0x93abc7:0x83a77b,x,.20+h/2,z,.85,.38+h,.85,.15);
        if(p%6===0)flower(board,x+.10,z,0xfbe4b2,.7);
        if(p%9===0)ball(board,0xb5c391,x-.18,.47+h,z-.03,.15,.06,.11);
      }else{
        if(c==='s'){
          const o=mesh(board,starGeometry(),mat(0xffd26a,{emissive:0xdd8c19,emissiveIntensity:.13}),x,.62,z);
          o.userData.cell=p;o.userData.star=l.stars.indexOf(p);stars.push(o);
          ring(board,0xe2cc96,x,.058,z,.21,.012);
        }
        if(c==='o'){
          const pad=round(board,0xf4c16d,x,.054,z,.71,.026,.71,.08);goals.push(pad);pad.userData.cell=p;
          const inner=ring(board,0xab7e3c,x,.075,z,.205,.027);inner.rotation.z=Math.PI/4;inner.scale.set(1,1,1);
          for(const sign of [-1,1])cube(board,0xab7e3c,x+sign*.27,.082,z,.03,.015,.53);
        }
        if(c==='t'){
          cylinder(board,0x749899,x,.071,z,.31,.10,24);
          const plate=cylinder(board,0xc3e4df,x,.132,z,.237,.065,24);plate.userData.cell=p;plates.push(plate);
          ring(board,0x4f7777,x,.17,z,.13,.018);
        }
        if(c==='H')house(p);
        if(c==='b')boxes.push(crate(p));
      }
    }
    // Garden props sit outside the movement grid, so they never hide a required route.
    for(const [x,z,s] of [[-l.width/2+.1,-l.height/2+.05,.8],[l.width/2-.1,-l.height/2+.02,.7],[-l.width/2+.05,l.height/2-.1,.55]])
      tree(board,x,z,s,l.chapter===3?0xbaa6cc:l.chapter===2?0x95b5c5:0x85ac7c);
    for(let i=0;i<12;i++){const x=-l.width/2+.35+i*(l.width-.7)/11,z=l.height/2+.05;flower(board,x,z,i%3===0?0xe7aeac:0xfff4db,.65+(i%2)*.2);}
    // Layered earth and small stones make the floating island read as a solid object.
    for(let i=0;i<7;i++)ball(board,0xbaa78b,-l.width/2+.4+i*.9,-.65,l.height/2+.04,.15,.08,.025);
    batchScenery();
    avatar=bunny(board);avatar.position.set(at(state.p).x,.05,at(state.p).z);avatar.rotation.y=.2;
    syncObjects();resize();
  }
  function batchScenery(){
    // Draw repeated flowers, tiles and shrubs in batches for tablet GPUs.
    const excluded=new Set([homeRing,houseLamp,...stars,...plates,...goals]);
    for(const group of [...boxes,...bridges])group.traverse(o=>excluded.add(o));
    const buckets=new Map();board.updateMatrixWorld(true);
    board.traverse(o=>{if(!o.isMesh||excluded.has(o))return;const k=o.geometry.uuid+o.material.uuid;
      if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(o);});
    for(const list of buckets.values()){
      if(list.length<2)continue;
      const batch=new T.InstancedMesh(list[0].geometry,list[0].material,list.length);batch.castShadow=true;batch.receiveShadow=true;
      list.forEach((o,i)=>{batch.setMatrixAt(i,o.matrixWorld);o.parent.remove(o);});batch.instanceMatrix.needsUpdate=true;board.add(batch);
    }
  }
  function syncObjects(){
    for(const s of stars)s.visible=!(state.stars&(1<<s.userData.star));
    // Rebuild only movable crate groups on undo/load; shared geometries are reused.
    for(const b of boxes)board.remove(b);boxes=state.boxes.map(crate);
    for(const b of bridges)b.position.y=state.open?.03:-.55;
    for(const p of plates){const active=state.open||state.p===p.userData.cell||state.boxes.includes(p.userData.cell);p.material=mat(active?0xf3d17e:0xc3e4df);p.position.y=active?.10:.132;}
    for(const g of goals)g.material=mat(state.boxes.includes(g.userData.cell)?0xa4c990:0xf4c16d);
    const done=state.stars===G.allStars(l)&&l.goals.every(g=>state.boxes.includes(g));
    homeRing.material=mat(done?0xffc951:0xb3bea0,{emissive:done?0xdda63b:0,emissiveIntensity:.22});
  }
  function resize(){
    if(!renderer)return;const w=app.clientWidth,h=app.clientHeight;renderer.setSize(w,h,false);updateCamera();
  }
  function updateCamera(){
    const w=app.clientWidth,h=app.clientHeight,aspect=w/h,mobile=w<=650,short=h<530;
    const angle=cameraAngle,elevation=.86,s=Math.sin(angle),c=Math.cos(angle);
    const boardWidth=Math.abs(c)*(l.width+.9)+Math.abs(s)*(l.height+.9);
    const boardHeight=(Math.abs(s)*l.width+Math.abs(c)*l.height)*Math.sin(elevation)+2.0;
    let areaWidth,areaHeight,centerX,centerY;
    if(!started){areaWidth=mobile?w*.98:w*.58;areaHeight=mobile?Math.max(180,h-440):h*.75;centerX=mobile?.5:.69;centerY=mobile?.54:.53;}
    else{areaWidth=mobile?w*.98:w*.82;areaHeight=mobile?Math.max(180,h-400):short?Math.max(150,h-190):h*.67;centerX=.5;centerY=mobile?.445:short?(110+areaHeight/2)/h:.46;}
    const scale=Math.max(boardWidth/areaWidth,boardHeight/areaHeight);
    const viewH=h*scale,viewW=w*scale;
    camera.left=-viewW/2;camera.right=viewW/2;camera.top=viewH/2;camera.bottom=-viewH/2;camera.updateProjectionMatrix();
    const right=new T.Vector3(c,0,-s),up=new T.Vector3(-s*Math.sin(elevation),Math.cos(elevation),-c*Math.sin(elevation));
    cameraTarget.set(0,.25,0).addScaledVector(right,(.5-centerX)*viewW).addScaledVector(up,(centerY-.5)*viewH);
    camera.position.copy(cameraTarget).add(new T.Vector3(s*Math.cos(elevation),Math.sin(elevation),c*Math.cos(elevation)).multiplyScalar(24));camera.lookAt(cameraTarget);camera.updateMatrixWorld();
  }
  function say(text){$('message').textContent=text;}
  function updateHud(){
    const n=state.stars.toString(2).replace(/0/g,'').length;
    $('starCount').textContent=`${n} / ${l.stars.length}`;
    $('chapterText').textContent=`珞伊专属 · ${G.chapters[l.chapter].name} · ${String(levelIndex+1).padStart(2,'0')} / 24`;
    $('levelTitle').textContent=l.name;$('completedCount').textContent=`${completed.size}/24`;
    let text='找齐星星，回到小屋';
    if(l.goals.length)text=`木箱就位 ${l.goals.filter(g=>state.boxes.includes(g)).length}/${l.goals.length}`;
    if(l.bridges.length)text+=(l.goals.length?' · ':' · ')+(state.open?'小桥已打开':'先踩圆形机关');
    if(n===l.stars.length&&l.goals.every(g=>state.boxes.includes(g)))text='都准备好啦，去小屋！';
    $('objectiveText').textContent=text;$('undoBtn').disabled=!history.length;
    $('world').setAttribute('aria-label',`${l.name}，米米位于第${Math.floor(state.p/l.width)+1}行第${state.p%l.width+1}列，已收集${n}颗星星。可用方向按钮移动。`);
  }
  function clearHint(){hintRequest++;clearTimeout(hintTimer);if(hintWorker){hintWorker.terminate();hintWorker=null;}$('hintBtn').disabled=false;document.querySelectorAll('.hint-pulse').forEach(b=>b.classList.remove('hint-pulse'));}
  function loadLevel(n,restart=false){
    clearTimeout(wonTimer);clearHint();levelIndex=n;l=G.levels[n];hintCount=0;
    const entry=!restart?savedStates[n]:null;
    state=entry?clone(entry.state):G.initial(l);history=entry?entry.history.map(clone):[];
    if(G.won(l,state)){state=G.initial(l);history=[];}
    cameraQuarter=0;desiredAngle=.38;cameraAngle=.38;
    buildBoard();updateHud();say(entry&&state.moves?'接着上次的路走吧。'+l.tip:l.story);save();
  }
  function begin(n=levelIndex){
    if(!ready)return;started=true;app.classList.remove('is-welcome');$('welcome').hidden=true;$('sceneCaption').hidden=true;
    $('gameHud').hidden=false;$('gameBottom').hidden=false;loadLevel(n);enableAudio();
  }
  function blockedMessage(d){
    const p=G.adjacent(l,state.p,d);
    if(l.cells[p]==='=')return '桥还没醒来。先把圆形机关同时压住。';
    if(state.boxes.includes(p))return '箱子前面没有空位啦。换个方向，或退一步试试。';
    return '这边被挡住了，看看旁边的小路吧。';
  }
  function move(d){
    if(!started||!ready||moveTween||document.querySelector('dialog[open]')||G.won(l,state))return;
    const n=G.step(l,state,d);if(!n){say(blockedMessage(d));tone(190,.05,.015);return;}
    clearHint();const prev=clone(state);history.push(prev);if(history.length>200)history.shift();state=clone(n);
    const from=at(prev.p),to=at(state.p),oldCrate=n.moved?boxes.find(b=>b.userData.cell===n.moved.from):null;
    avatar.userData.face=Math.atan2(G.dirs[d].x,G.dirs[d].z);
    moveTween={start:performance.now(),duration:reduced?55:205,from,to,crate:oldCrate,crateFrom:n.moved?at(n.moved.from):null,crateTo:n.moved?at(n.moved.to):null};
    for(const s of stars)s.visible=!(state.stars&(1<<s.userData.star));
    if(n.moved&&oldCrate)oldCrate.userData.cell=n.moved.to;
    if(state.stars!==prev.stars){spark(to.x,to.z);tone(740,.16,.055);say(['找到第一颗了！接下来想往哪边走？','又找到一颗。记得看看有没有没走过的小路。',l.goals.length?'星星齐了！完成木箱任务后，就能回小屋啦。':'星星齐了！走到小屋门前，我们就到家啦。'][state.stars.toString(2).replace(/0/g,'').length-1]);}
    else if(state.open&&!prev.open){tone(520,.3,.055);say('机关一起亮了，小桥升起来啦！桥会一直保持打开。');}
    else if(n.moved){tone(230,.065,.025);say(l.goals.includes(n.moved.to)?'这一箱送到了！再看看还有什么要完成。':'推得动！下一步要不要绕到另一边？');}
    else tone(350,.035,.012);
    if(state.p===l.home&&!G.won(l,state))say('小屋在这里。先找齐三颗星星，把木箱送到垫子上，再回来吧。');
    updateHud();save();
    if(G.won(l,state)){
      completed.add(levelIndex);sessionWins++;save();updateHud();
      wonTimer=setTimeout(showWin,reduced?100:650);
    }
  }
  function showWin(){
    if(!G.won(l,state))return;
    tone(660,.18,.06);setTimeout(()=>tone(880,.28,.045),130);
    $('winTitle').textContent=completed.size===24?'珞伊，四座小岛都亮起来了！':'珞伊，星星到家啦！';
    $('winEyebrow').textContent=`${G.chapters[l.chapter].name} · 第 ${levelIndex+1} 个小谜题`;
    $('winMessage').textContent=sessionWins>=3?'珞伊今天已经探索了几个谜题，可以让眼睛休息一下啦。':'珞伊带着米米完成了这一次探索。';
    $('reflection').textContent=['你先去了哪颗星星那里？为什么？','如果想把箱子推向左边，你要站在哪一边？','小桥为什么会升起来？木箱帮了什么忙？','你先开桥还是先推箱子？说说你的安排。'][l.chapter];
    $('nextBtn').innerHTML=levelIndex===23?'回到冒险地图 <span>→</span>':'去下一站 <span>→</span>';
    $('restBtn').textContent=saveOK?'先休息，已经保存好了':'先休息，保留当前页面';$('winDialog').showModal();
  }
  function undo(){if(!history.length)return;clearTimeout(wonTimer);clearHint();state=history.pop();moveTween=null;
    avatar.position.set(at(state.p).x,.05,at(state.p).z);avatarBody.position.y=0;syncObjects();say('退回来啦。换个办法试试，没关系。');updateHud();save();}
  function onSceneTap(event){
    if(!started||event.button>0||document.querySelector('dialog[open]'))return;
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);if(!raycaster.ray.intersectPlane(groundPlane,point))return;
    const x=Math.round(point.x+(l.width-1)/2),z=Math.round(point.z+(l.height-1)/2);if(x<0||x>=l.width||z<0||z>=l.height)return;
    const p=z*l.width+x,d=G.dirs.findIndex((_,i)=>G.adjacent(l,state.p,i)===p);
    if(d>=0)move(d);else if(p===state.p){say('我在这儿！点我旁边的一块地，就能走一步。');}else say('一次走一格。点米米旁边的地块，或用右下角方向按钮。');
  }
  function rotate(delta){cameraQuarter=(cameraQuarter+delta+4)%4;desiredAngle+=delta*Math.PI/2;clearHint();}
  function worldDirection(screenDirection){return (screenDirection-cameraQuarter+4)%4;}
  function map(){
    $('islandMap').innerHTML='';
    const colors=['#e9eedb','#f4e8cb','#e4eaf4','#eee4ef'];
    G.chapters.forEach((chapter,c)=>{
      const section=document.createElement('section');section.className='map-chapter';section.style.setProperty('--chapter-bg',colors[c]);
      const title=document.createElement('h3');title.textContent=chapter.name;const sub=document.createElement('span');sub.textContent=chapter.subtitle;title.appendChild(sub);section.appendChild(title);
      const grid=document.createElement('div');grid.className='level-grid';
      G.levels.filter(level=>level.chapter===c).forEach(level=>{
        const b=document.createElement('button');b.className='level-card'+(completed.has(level.id)?' done':'')+(level.id===levelIndex?' current':'');b.dataset.level=level.id;
        b.innerHTML=`<strong>${String(level.id+1).padStart(2,'0')}</strong><small>${level.name}</small>`;
        b.setAttribute('aria-label',`第${level.id+1}关 ${level.name}${completed.has(level.id)?' 已完成':''}`);
        b.onclick=()=>{if(started)save();$('mapDialog').close();begin(level.id);};grid.appendChild(b);
      });section.appendChild(grid);$('islandMap').appendChild(section);
    });$('mapDialog').showModal();
  }
  function hint(){
    if(!started||G.won(l,state))return;hintCount++;
    if(hintCount===1){say(l.tip+' 还想看一步方向，可以再点“小提示”。');return;}
    clearHint();const request=hintRequest;$('hintBtn').disabled=true;say('米米正在看看接下来可以怎么走…');
    try{
      hintWorker=new Worker('island-hint-worker.js?v=20260914c');
      hintWorker.onmessage=event=>{
        if(event.data.request!==hintRequest)return;const {path,status}=event.data;clearHint();
        if(path&&path.length){const screenD=(path[0]+cameraQuarter)%4;document.querySelector(`[data-dir="${screenD}"]`).classList.add('hint-pulse');say(`可以先往画面的${G.dirs[screenD].name}方走一步。亮起来的按钮就是这个方向。`);}
        else say(status==='blocked'?'木箱现在挡住了后面的安排。点“退一步”，回到推箱子之前，再换个方向试试。':'这个局面比较复杂。先退回最近一次推箱子之前，给转身留出位置。');
      };
      hintWorker.onerror=()=>{clearHint();say(l.tip);};
      hintWorker.postMessage({level:levelIndex,state:clone(state),request});
      hintTimer=setTimeout(()=>{clearHint();say(l.tip+' 也可以退一步，试试另一边。');},6000);
    }catch(_){clearHint();say(l.tip);}
  }
  function enableAudio(){if(!sound)return;try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch(_){sound=false;updateSound();}}
  function tone(f,duration,gain){if(!sound||document.hidden)return;enableAudio();if(!audio||audio.state!=='running')return;
    const osc=audio.createOscillator(),volume=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(f,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(f*.75,audio.currentTime+duration);
    volume.gain.setValueAtTime(gain,audio.currentTime);volume.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.connect(volume);volume.connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration);
  }
  function updateSound(){$('soundBtn').setAttribute('aria-pressed',String(sound));$('soundBtn').setAttribute('aria-label',sound?'关闭音效':'开启音效');}
  function read(){
    if(!('speechSynthesis'in window)){say($('message').textContent+'（这台浏览器暂时不能朗读，可以请爸爸妈妈读一读。）');return;}
    speechSynthesis.cancel();const u=new SpeechSynthesisUtterance($('message').textContent);u.lang='zh-CN';u.rate=.85;
    const voice=speechSynthesis.getVoices().find(v=>v.lang.startsWith('zh')&&v.localService)||speechSynthesis.getVoices().find(v=>v.lang.startsWith('zh'));if(voice)u.voice=voice;
    u.onerror=()=>{$('readBtn').title='朗读暂时不可用，可以请爸爸妈妈读一读';};speechSynthesis.speak(u);
  }
  function spark(x,z){if(reduced)return;for(let i=0;i<9;i++){const o=ball(board,i%2?0xffd96e:0xfff6dc,x,.7,z,.034);o.castShadow=false;sparks.push({o,born:performance.now(),vx:Math.cos(i*7)*.012,vz:Math.sin(i*7)*.012});}}
  function animate(now){
    requestAnimationFrame(animate);if(document.hidden||!ready)return;
    const dt=lastFrame?Math.min((now-lastFrame)/16.67,3):1;lastFrame=now;
    if(Math.abs(desiredAngle-cameraAngle)>.0005){cameraAngle=reduced?desiredAngle:cameraAngle+(desiredAngle-cameraAngle)*Math.min(1,.16*dt);updateCamera();}
    if(moveTween){
      const m=moveTween,t=Math.min(1,(now-m.start)/m.duration),ease=t*t*(3-2*t);
      avatar.position.set(T.MathUtils.lerp(m.from.x,m.to.x,ease),.05+(reduced?0:Math.sin(t*Math.PI)*.10),T.MathUtils.lerp(m.from.z,m.to.z,ease));
      if(m.crate)m.crate.position.set(T.MathUtils.lerp(m.crateFrom.x,m.crateTo.x,ease),.07,T.MathUtils.lerp(m.crateFrom.z,m.crateTo.z,ease));
      feet.forEach((f,i)=>f.rotation.x=Math.sin(t*Math.PI*2+i*Math.PI)*.35);
      if(t===1){moveTween=null;feet.forEach(f=>f.rotation.x=0);syncObjects();}
    }else if(!reduced){avatarBody.position.y=Math.sin(now*.002)*.012;ears.forEach((e,i)=>e.rotation.x=Math.sin(now*.0015+i)*.035);}
    const target=avatar.userData.face||0;let diff=target-avatar.rotation.y;diff=Math.atan2(Math.sin(diff),Math.cos(diff));avatar.rotation.y+=diff*Math.min(1,.25*dt);
    if(!started){avatar.rotation.y=.2;if(!reduced)avatarBody.rotation.z=Math.sin(now*.0015)*.025;}
    else avatarBody.rotation.z=0;
    if(!reduced){const blink=now%4900>4750;eyes.forEach(e=>e.scale.y=blink?.009:.043);}
    stars.forEach((s,i)=>{if(!reduced){s.rotation.y=now*.001+i;s.position.y=.64+Math.sin(now*.002+i)*.09;}});
    for(const b of bridges){const target=state.open?.03:-.55;b.position.y+=(target-b.position.y)*Math.min(1,.16*dt);}
    for(let i=sparks.length-1;i>=0;i--){const s=sparks[i],age=now-s.born;s.o.position.x+=s.vx*dt;s.o.position.z+=s.vz*dt;s.o.position.y+=.014*dt;s.o.scale.setScalar(.034*Math.max(0,1-age/650));if(age>650){board.remove(s.o);sparks.splice(i,1);}}
    renderer.render(scene,camera);
  }
  $('startBtn').onclick=()=>begin();$('welcomeMapBtn').onclick=map;$('mapBtn').onclick=map;
  $('undoBtn').onclick=undo;$('resetBtn').onclick=()=>{if(moveTween)return;$('resetDialog').showModal();};
  $('confirmReset').onclick=()=>{$('resetDialog').close();loadLevel(levelIndex,true);};
  $('hintBtn').onclick=hint;$('helpBtn').onclick=()=>$('helpDialog').showModal();$('readBtn').onclick=read;
  $('soundBtn').onclick=()=>{sound=!sound;updateSound();enableAudio();tone(660,.14,.05);save();};
  $('rotateLeft').onclick=()=>rotate(-1);$('rotateRight').onclick=()=>rotate(1);
  $('nextBtn').onclick=()=>{$('winDialog').close();if(levelIndex===23)map();else loadLevel(levelIndex+1);};
  $('restBtn').onclick=()=>{$('winDialog').close();save();started=false;app.classList.add('is-welcome');$('welcome').hidden=false;$('sceneCaption').hidden=false;$('gameHud').hidden=true;$('gameBottom').hidden=true;$('startBtn').innerHTML='珞伊下次接着探险 <span>→</span>';resize();};
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
  document.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>move(worldDirection(Number(b.dataset.dir))));
  document.addEventListener('keydown',event=>{
    if(!started||event.ctrlKey||event.metaKey||event.altKey||document.querySelector('dialog[open]'))return;
    const keys={ArrowUp:0,w:0,W:0,ArrowRight:1,d:1,D:1,ArrowDown:2,s:2,S:2,ArrowLeft:3,a:3,A:3};
    if(Object.prototype.hasOwnProperty.call(keys,event.key)){event.preventDefault();move(worldDirection(keys[event.key]));}
    if(event.key==='z'||event.key==='Z'){event.preventDefault();undo();}
  });
  window.addEventListener('pagehide',()=>{save();if('speechSynthesis'in window)speechSynthesis.cancel();});
  try{
    makeScene();l=G.levels[levelIndex];state=savedStates[levelIndex]?clone(savedStates[levelIndex].state):G.initial(l);buildBoard();updateHud();updateSound();
    ready=true;$('loading').hidden=true;$('startBtn').disabled=false;
    $('startBtn').innerHTML=(completed.size||state.moves?'珞伊继续探险':'珞伊和米米一起出发')+' <span>→</span>';
    requestAnimationFrame(animate);
    // Read-only diagnostics for rendering and automated gameplay validation.
    window.mimiGame={getState:()=>({level:levelIndex,state:clone(state),history:history.length,done:[...completed],started,moving:!!moveTween,cameraQuarter,ready,drawCalls:renderer.info.render.calls}),
      projectCell:p=>{const pos=at(p),v=new T.Vector3(pos.x,.06,pos.z).project(camera);return{x:(v.x+1)/2*app.clientWidth,y:(1-v.y)/2*app.clientHeight};}};
    if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  }catch(error){console.error(error);fail('这台浏览器暂时无法显示 3D 小岛。请用较新版 Safari、Chrome 或 Edge 重新打开；已保存的进度会保留。');}
})();
