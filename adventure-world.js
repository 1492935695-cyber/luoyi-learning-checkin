/* Original Three.js scenery and characters. No photographs or external runtime assets. */
(() => {
  'use strict';
  const T=window.THREE, {ruby}=window.AdventureLessons;
  class AdventureWorld {
    constructor(host,labels,events){
      this.host=host;this.labelHost=labels;this.events=events;this.items=[];this.sockets=[];this.tags=[];this.keys=new Set();this.axis={x:0,z:0};this.active=false;this.paused=false;this.path=null;this.carry=null;this.time=0;
      this.motion=matchMedia('(prefers-reduced-motion: reduce)');this.reduced=this.motion.matches;this.motion.addEventListener('change',e=>{this.reduced=e.matches;});
      this.scene=new T.Scene();this.scene.background=new T.Color(0xc4e8ef);this.scene.fog=new T.Fog(0xc4e8ef,42,100);
      this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.18;
      this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.host.append(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-label','珞伊的国风三维荷塘');
      this.camera=new T.OrthographicCamera(-12,12,9,-9,.1,180);this.camera.position.set(0,14,19);this.camera.lookAt(0,.35,-.5);
      this.scene.add(new T.HemisphereLight(0xffffee,0x769d9c,2.3));const sun=new T.DirectionalLight(0xffebc7,3.6);sun.position.set(-9,18,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-14,right:14,top:15,bottom:-15,near:1,far:60});sun.shadow.normalBias=.03;this.scene.add(sun);
      this.static=new T.Group();this.dynamic=new T.Group();this.scene.add(this.static,this.dynamic);this.ray=new T.Raycaster();this.pointer=new T.Vector2();this.plane=new T.Plane(new T.Vector3(0,1,0),-.12);
      this.makeScenery();for(const g of [...this.static.children])if(g.isGroup&&g!==this.gate)this.batch(g);this.avatar=this.person(0x469d8f,0xe6a1b8,true);this.avatar.position.set(0,.14,3.3);this.avatar.rotation.y=.2;this.scene.add(this.avatar);
      this.carrier=new T.Group();this.carrier.position.set(0,1.05,.66);this.avatar.add(this.carrier);
      this.dragon=this.dragonfly();this.scene.add(this.dragon);
      this.destinationRing=this.mesh(new T.RingGeometry(.19,.25,32),0xe8c25f,this.scene,0,.15,0);this.destinationRing.rotation.x=-Math.PI/2;this.destinationRing.visible=false;
      host.addEventListener('pointerdown',e=>{this.down={x:e.clientX,y:e.clientY};});host.addEventListener('pointerup',e=>{if(this.down&&Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)<14)this.pick(e);this.down=null;});host.addEventListener('pointercancel',()=>{this.down=null;});
      this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.paused=true;events.error();});
      addEventListener('keydown',e=>{if(!this.active||this.paused||/INPUT|TEXTAREA/.test(e.target.tagName))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D',' '].includes(e.key)){e.preventDefault();if(e.key===' '&&!e.repeat)this.interactNearest();else this.keys.add(e.key.toLowerCase());}});
      addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>this.clearInput());
      this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.resize();this.frame=this.frame.bind(this);requestAnimationFrame(this.frame);
    }
    material(color,extra={}){return new T.MeshStandardMaterial({color,roughness:.74,metalness:0,...extra});}
    mesh(geo,color,parent,x=0,y=0,z=0,extra={}){const m=new T.Mesh(geo,this.material(color,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
    ball(p,c,x,y,z,a,b=a,d=a){const m=this.mesh(new T.SphereGeometry(1,16,12),c,p,x,y,z);m.scale.set(a,b,d);return m;}
    box(p,c,x,y,z,w,h,d){return this.mesh(new T.BoxGeometry(w,h,d),c,p,x,y,z);}
    cyl(p,c,x,y,z,a,b,h,n=32){return this.mesh(new T.CylinderGeometry(a,b,h,n),c,p,x,y,z);}
    tube(p,c,pts,r=.04){return this.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(q=>new T.Vector3(...q))),24,r,7,false),c,p);}
    group(p,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);p.add(g);return g;}
    batch(root){
      root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),groups=new Map();
      root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;const key=JSON.stringify([o.geometry.type,o.geometry.parameters,o.material.color.getHex(),o.material.side,o.material.roughness]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);});
      for(const meshes of groups.values()){if(meshes.length<2)continue;const first=meshes[0],instances=new T.InstancedMesh(first.geometry.clone(),first.material.clone(),meshes.length);instances.castShadow=true;instances.receiveShadow=true;meshes.forEach((o,i)=>instances.setMatrixAt(i,inverse.clone().multiply(o.matrixWorld)));root.add(instances);for(const o of meshes){o.parent.remove(o);o.geometry.dispose();o.material.dispose();}}
    }
    makeScenery(){
      this.water=this.mesh(new T.PlaneGeometry(120,120,1,1),0x65bfc5,this.static,0,-.42,-8,{roughness:.36,metalness:.18});this.water.rotation.x=-Math.PI/2;
      // The courtyard is unframed and continuous with the surrounding landscape.
      this.box(this.static,0x739d89,0,-.35,0,14,.75,14);this.box(this.static,0xcce1c1,0,.04,0,13.8,.12,13.8);
      this.courtyard=this.box(this.static,0xf2e9cf,0,.11,.15,9.4,.09,11.9);this.tiles=[];
      for(let x=-4;x<=4;x+=1)for(let z=-5;z<=5;z+=1){this.tiles.push(this.box(this.static,(x+z)%2===0?0xe2e4d7:0xe9ecdf,x,.163,z,.965,.018,.965));}
      for(const x of [-5.2,5.2]){this.box(this.static,0xaccdc0,x,.18,.5,1.0,.17,10);for(let z=-4.5;z<6;z+=1.25)this.box(this.static,0xd8ded1,x,.31,z,.65,.16,.88);}
      this.river=this.box(this.static,0x67c4c8,0,.21,-3.55,9.25,.03,1.6);
      this.fixedBridge=this.group(this.static);for(let i=0;i<3;i++)this.box(this.fixedBridge,0xf1e8d3,0,.29,-2.98-i*.55,2.15,.17,.53);
      const houseStart=this.static.children.length;this.pavilion(-7.3,-5,1.05);this.pavilion(7.7,-7.4,1.05);this.pavilions=this.static.children.slice(houseStart);
      this.gate=this.group(this.static,0,.18,-6);this.box(this.gate,0xede8d4,0,.06,0,3.7,.12,1.6);
      for(const x of [-1.3,1.3]){this.cyl(this.gate,0x9c4547,x,1.42,0,.16,.2,2.7);this.cyl(this.gate,0xe8d2a4,x,.23,0,.24,.24,.25);}
      this.roof(this.gate,0,2.8,0,3.6,1.6,0x457b78);this.box(this.gate,0x93474b,0,2.52,0,2.8,.27,.28);
      this.doorL=this.group(this.gate,-1.18,.1,.01);this.box(this.doorL,0xbe6561,.56,1.13,0,1.13,2.26,.15);this.doorR=this.group(this.gate,1.18,.1,.01);this.box(this.doorR,0xbe6561,-.56,1.13,0,1.13,2.26,.15);
      for(const [door,sign] of [[this.doorL,1],[this.doorR,-1]])for(let j=0;j<3;j++)for(let i=0;i<2;i++)this.ball(door,0xf4dca7,sign*(.25+i*.45),.55+j*.5,.12,.047);
      const treeStart=this.static.children.length;for(const [x,z,s] of [[-6.1,0,1.25],[6.3,2.2,1.0],[-9.1,-9,1.5],[9.7,-1,1.3]])this.tree(x,z,s);this.trees=this.static.children.slice(treeStart);
      const bambooStart=this.static.children.length;for(const [x,z] of [[-5.8,-3],[6,-4],[-5.7,4.5]])this.bamboo(x,z);this.bamboos=this.static.children.slice(bambooStart);
      for(let i=0;i<22;i++){const a=i*2.399;const x=Math.cos(a)*(8+(i%4)*1.15),z=Math.sin(a)*8-1;this.lotus(this.static,x,-.29,z,.5+(i%3)*.12,i%3===0);}
      for(let i=0;i<16;i++){const x=(i-8)*5;const m=this.mesh(new T.ConeGeometry(3.8,11+(i%3)*3,7),i%2?0x86b6b1:0x9bc5c1,this.static,x,1,-23-(i%3)*8);m.scale.set(1,1.3,1.1);}
      for(let i=0;i<9;i++){const x=-18+i*4.5;this.ball(this.static,0xe9f8f6,x,9+(i%2),-28,3,1.0,1.3);}
      const sun=this.ball(this.static,0xfff0b3,-13,13,-28,2.0);sun.material.emissive.setHex(0xead393);sun.material.emissiveIntensity=.3;
      for(const x of [-4.9,4.9])for(const z of [-5.7,5.7]){this.cyl(this.static,0x9aada0,x,.6,z,.15,.2,1.0);this.box(this.static,0xf7e4ab,x,1.23,z,.44,.48,.44);this.roof(this.static,x,1.48,z,.8,.8,0x527d79);}
    }
    roof(p,x,y,z,w,d,color){
      const g=this.group(p,x,y,z),vertices=[],indices=[],segments=12;
      for(let j=0;j<=1;j++)for(let i=0;i<=segments;i++){const u=i/segments*2-1;vertices.push(u*w/2,.58*(1-Math.abs(u))+.18*Math.pow(Math.abs(u),8),(j-.5)*d);}
      for(let i=0;i<segments;i++){const a=i,b=i+1,c=i+segments+1,e=i+segments+2;indices.push(a,c,b,b,c,e);}
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();this.mesh(geo,color,g,0,0,0,{side:T.DoubleSide});
      for(const zz of [-d/2,d/2])this.tube(g,0xe0c48e,[[-w/2,.18,zz],[-w*.33,.2,zz],[0,.62,zz],[w*.33,.2,zz],[w/2,.18,zz]],.05);
      for(let i=0;i<=12;i++){const xx=(i/12-.5)*w,u=Math.abs(xx/(w/2));this.box(g,color,xx,.58*(1-u)+.18*u**8+.035,0,.045,.035,d);}
      return g;
    }
    pavilion(x,z,s){const g=this.group(this.static,x,.15,z);g.scale.setScalar(s);this.box(g,0xe1daca,0,.15,0,3.6,.3,3);for(const a of [-1.25,1.25])for(const b of [-1,1])this.cyl(g,0xa75352,a,1.5,b,.115,.14,2.7);this.box(g,0xf2efe0,0,1.3,-1.12,2.5,2.0,.18);this.roof(g,0,2.8,0,4,3.4,0x4a7d7c);this.roof(g,0,3.5,0,2.6,2.3,0x508586);for(const a of [-1.1,1.1])this.lantern(g,a,2,-1,.45);}
    tree(x,z,s){const g=this.group(this.static,x,.12,z);g.scale.setScalar(s);this.tube(g,0x88786b,[[0,0,0],[-.18,1.4,0],[.3,2.3,.1],[.8,3.4,0]],.18);for(const side of [-1,1])this.tube(g,0x88786b,[[.05,1.7,0],[side*.8,2.5,.05],[side*1.5,2.7,.1]],.09);for(let i=0;i<17;i++){const a=i*2.4,r=.25+(i%4)*.4;this.ball(g,[0xf2b7c5,0xedc9d2,0xe99eb8,0xf5d9dc][i%4],Math.cos(a)*r,2.8+Math.sin(i*1.7)*.48,Math.sin(a)*r*.6,.62,.45,.58);}}
    bamboo(x,z){const g=this.group(this.static,x,.14,z);for(let i=0;i<4;i++){const xx=i*.19;this.cyl(g,0x5d9979,xx,1.2+i*.14,0,.045,.055,2.4+i*.28,8);for(let j=0;j<4;j++){this.cyl(g,0xb3ce94,xx,.35+j*.55,0,.055,.055,.05,8);const leaf=this.ball(g,0x80b68b,xx+(j%2?-.3:.3),.8+j*.4,.04,.4,.07,.12);leaf.rotation.z=j%2?-.5:.5;}}}
    lotus(p,x,y,z,s,flower=true){const g=this.group(p,x,y,z);g.scale.setScalar(s);const shape=new T.Shape();shape.moveTo(0,0);for(let i=0;i<=40;i++){const a=.12+i/40*(Math.PI*2-.3);shape.lineTo(Math.cos(a),Math.sin(a)*.83);}shape.closePath();const leaf=this.mesh(new T.ShapeGeometry(shape),0x5ea486,g,0,0,0,{side:T.DoubleSide});leaf.rotation.x=-Math.PI/2;for(let i=0;i<7;i++){const a=.3+i*.82;this.tube(g,0x9bcc9f,[[0,.025,0],[Math.cos(a)*.88,.025,Math.sin(a)*.7]],.009);}if(flower){for(let i=0;i<9;i++){const a=i*Math.PI*2/9;const petal=this.ball(g,i%2?0xf2bad1:0xf6d1d8,Math.cos(a)*.19,.22,Math.sin(a)*.19,.15,.28,.38);petal.rotation.y=-a;petal.rotation.z=.25;}this.ball(g,0xe8c66b,0,.25,0,.15,.12,.15);}return g;}
    lantern(p,x,y,z,s=1){const g=this.group(p,x,y,z);g.scale.setScalar(s);this.ball(g,0xe98570,0,0,0,.3,.39,.3);for(const yy of [-.34,.34])this.cyl(g,0xd9b65e,0,yy,0,.22,.22,.06,20);this.tube(g,0xeac365,[[0,-.37,0],[0,-.65,0]],.03);this.cyl(g,0xd9b65e,0,-.67,0,.06,.03,.15,8);return g;}
    person(coat,skirt,girl){
      const g=new T.Group(),body=this.group(g);g.userData.body=body;g.userData.limbs=[];
      for(const side of [-1,1]){const leg=this.group(body,side*.16,.61,0);this.box(leg,0xedece1,0,-.18,0,.16,.4,.18);this.ball(leg,0x405568,0,-.47,.09,.14,.095,.23);g.userData.limbs.push(leg);}
      this.cyl(body,skirt,0,.71,0,.3,.52,.85,20);this.cyl(body,coat,0,1.2,0,.28,.36,.54,20);
      this.tube(body,0xf8f0dc,[[-.25,1.44,.18],[.1,1.06,.32],[.27,.98,.18]],.045);this.box(body,0xc56e78,0,.97,.01,.69,.09,.59);this.ball(body,0xeace83,.2,.96,.34,.085);
      for(const side of [-1,1]){const arm=this.group(body,side*.36,1.33,0);arm.rotation.z=side*.16;this.cyl(arm,coat,0,-.18,0,.15,.21,.46,12);this.ball(arm,0xf7d4b7,0,-.43,0,.125,.14,.12);g.userData.limbs.push(arm);}
      const head=this.group(body,0,1.9,0);this.ball(head,0x333849,0,.1,-.04,.55,.57,.46);this.ball(head,0xf9d7bb,0,0,.06,.49,.45,.43);
      this.ball(head,0x333849,0,.37,.12,.5,.19,.37);
      for(const side of [-1,1]){const fringe=this.ball(head,0x333849,side*.34,.18,.38,.135,.29,.11);fringe.rotation.z=-side*.28;this.ball(head,0xf3c8ad,side*.48,-.02,.03,.09,.13,.09);this.ball(head,0x302e3c,side*.19,.03,.453,.067,.095,.035);this.ball(head,0xffffff,side*.174,.067,.477,.02);this.ball(head,0xeaaa9e,side*.3,-.14,.41,.085,.045,.02);this.tube(head,0x4c3d40,[[side*.27,.18,.425],[side*.19,.2,.44],[side*.13,.18,.45]],.014);
        if(girl){this.ball(head,0x353746,side*.46,.48,-.02,.23);this.ball(head,0xdda0b2,side*.49,.49,.17,.11,.07,.06);this.tube(head,0xe3b7c4,[[side*.54,.5,.1],[side*.63,.18,.05],[side*.6,-.05,.05]],.033);}}
      this.ball(head,0xf0bb9b,0,-.05,.48,.035,.055,.04);this.tube(head,0xb37171,[[-.07,-.2,.448],[0,-.22,.46],[.07,-.2,.448]],.013);
      if(!girl)this.ball(head,0x333849,0,.66,-.12,.18,.2,.18);this.batch(head);
      return g;
    }
    dragonfly(){const g=new T.Group();g.scale.setScalar(.64);this.wings=[];for(const side of [-1,1])for(const row of [0,1]){const wing=this.ball(g,0xb9e5ec,side*.58,0,-row*.35,.65,.06,.25);wing.rotation.y=side*.3;this.wings.push(wing);}this.ball(g,0x88b669,0,0,-.35,.16,.15,.63);this.ball(g,0xa3cd76,0,.17,.28,.3,.27,.25);for(const s of [-1,1]){this.ball(g,0xfdfbea,s*.16,.2,.46,.13,.15,.085);this.ball(g,0x354c39,s*.16,.2,.53,.061,.08,.025);}return g;}
    tag(object,text,y=1,className=''){const el=document.createElement('span');el.className='world-label '+className;ruby(el,text);this.labelHost.append(el);this.tags.push({object,el,y});return el;}
    clearDynamic(){this.items=[];this.sockets=[];this.tags.forEach(t=>t.el.remove());this.tags=[];this.carry=null;for(const root of [this.dynamic,this.carrier]){while(root.children.length){const o=root.children[0];root.remove(o);o.traverse(x=>{x.geometry?.dispose();if(x.material){x.material.map?.dispose();x.material.dispose();}});}}}
    load(lesson,state){
      this.clearDynamic();this.lesson=lesson;this.saved=state;this.clearInput();this.setTheme(lesson.id);this.avatar.position.set(0,.14,3.6);this.avatar.rotation.y=.25;this.path=null;this.fixedBridge.visible=this.hasRiver;this.gateOpen=false;this.doorL.rotation.y=0;this.doorR.rotation.y=0;
      this.jumpMove=null;
      if(lesson.kind==='jump'){this.makeHopCourse(state);this.resize();return;}
      const supply=lesson.supply||lesson.total||lesson.words.length;
      const positions=supply===5?[[-3.3,3],[-1.7,2.7],[0,2.9],[1.7,2.7],[3.3,3]]:supply===4?[[-3.3,3],[-1.4,1.8],[1.4,1.8],[3.3,3]]:[[-3.1,2.6],[0,2.35],[3.1,2.6]];
      positions.forEach(([x,z],i)=>{const item=this.group(this.dynamic,x,.24,z);item.userData={kind:'item',index:i,word:lesson.words?.[i],origin:[x,z],used:state.used.includes(i)};
        if(lesson.kind==='friends'){const npc=this.person([0x7c9fca,0xe3b565,0xa2bd79,0xc783a5][i],0xaec8b5,i%2===1);npc.scale.setScalar(.84);item.add(npc);this.tag(item,'朋友',2.6,'small');}
        else if(lesson.kind==='explore'){
          if(i===0){this.cyl(item,0x887a64,0,1,0,.12,.17,2);this.ball(item,0x79b78f,0,2,0,.78,.8,.65);this.ball(item,0xa9cc93,.25,2.55,0,.49,.43,.45);}
          if(i===1){for(const x of [-.55,.55])this.box(item,0x819c97,x,.25,0,.13,.5,.65);this.box(item,0xc2a887,0,.55,0,1.65,.13,.7);this.box(item,0xc2a887,0,.97,-.27,1.65,.6,.12);}
          if(i===2){this.cyl(item,0xaabdab,0,.14,0,.83,.83,.28);this.lotus(item,0,.32,0,.65,true);}
          this.tag(item,['树','长凳','花坛'][i],i===0?3.2:1.7,'small');
        }
        else if(lesson.kind==='count'){if(lesson.object==='stone'){const stone=this.box(item,0x91afb5,0,.22,0,.95,.42,.7);stone.rotation.y=.15;}if(lesson.object==='flower')this.lotus(item,0,.23,0,.45,true);if(lesson.object==='lantern')this.lantern(item,0,.6,0,1.0);}
        else{this.cyl(item,0xb4755d,0,.2,0,.39,.46,.4,24);this.cyl(item,0xf4e8c7,0,.44,0,.37,.37,.07,24);this.tag(item,lesson.words[i],1.18);}
        const hit=this.box(item,0xffffff,0,.7,0,1.15,1.5,1.1);hit.material.visible=false;this.items.push(item);if(item.userData.used&&lesson.kind!=='explore')item.visible=false;});
      const n=lesson.total||3;
      for(let i=0;i<n;i++){
        if(lesson.kind==='explore')break;
        const pos=lesson.kind==='friends'?[(i-(n-1)/2)*1.65,-.9]:lesson.id==='bridge'?[0,-2.9-i*.55]:lesson.kind==='count'?[ (i-(n-1)/2)*1.65,-.9]:[[-3.1,-1.15],[0,-1.4],[3.1,-1.15]][i];
        const socket=this.group(this.dynamic,pos[0],.2,pos[1]);socket.userData={kind:'socket',index:i,word:lesson.kind==='pronouns'?['我','你','他'][i]:lesson.kind==='words'?['天','地','人'][i]:null,filled:state.filled.includes(i)};
        this.cyl(socket,0xc4d9c0,0,.05,0,.65,.73,.1,32);
        const ring=this.mesh(new T.RingGeometry(.53,.61,40),0xe2c063,socket,0,.112,0,{side:T.DoubleSide});ring.rotation.x=-Math.PI/2;socket.userData.ring=ring;
        if(lesson.id==='bridge'){this.box(socket,0x469fab,0,.0,0,2,.03,.51);socket.scale.set(1,1,1);}
        else if(lesson.kind==='count'){
          if(lesson.object==='flower'){this.cyl(socket,0xb47e72,0,.3,0,.49,.32,.52);this.cyl(socket,0x60574a,0,.565,0,.44,.44,.025);}
          else{this.cyl(socket,0x6e9290,0,.5,0,.12,.18,.85);this.box(socket,0xe0ca9e,0,1.0,0,.8,.07,.65);}
        }else if(lesson.kind==='friends'){for(let k=0;k<6;k++){const a=k*Math.PI/3;this.ball(socket,0xe6a8bb,Math.cos(a)*.64,.14,Math.sin(a)*.64,.14,.045,.14);}}else this.semanticLandmark(socket,socket.userData.word);
        const hit=this.box(socket,0xffffff,0,.55,0,1.18,1.15,1.0);hit.material.visible=false;this.sockets.push(socket);
        if(socket.userData.filled)this.showPlaced(socket,i+1);
      }
      this.exit=this.group(this.dynamic,0,.15,-5.2);this.exit.userData={kind:'exit',index:0};const hit=this.box(this.exit,0xffffff,0,1.2,0,2.4,2.4,.8);hit.material.visible=false;
      if(lesson.id==='lantern'){this.basket=this.group(this.dynamic,-3.4,.18,4.6);this.cyl(this.basket,0xad8762,0,.2,0,.55,.4,.4);this.tube(this.basket,0xa07855,[[-.5,.3,0],[-.35,1.0,0],[.35,1.0,0],[.5,.3,0]],.05);this.basket.userData={kind:'basket',index:0};this.tag(this.basket,'留一盏',1.1,'small');}else this.basket=null;
      if(lesson.id==='team'){const center=this.group(this.dynamic,0,.18,.7);this.mesh(new T.RingGeometry(.46,.54,32),0x7ba799,center).rotation.x=-Math.PI/2;this.tag(center,'珞伊',.35,'small');}
      if(state.ready)this.openGate();this.resize();
    }
    setTheme(id){
      this.animatedProps=[];this.theme=this.group(this.dynamic);this.theme.name='theme-'+id;
      this.hasRiver=id==='welcome'||id==='hops';this.river.visible=this.hasRiver;
      this.pavilions.forEach(x=>x.visible=id==='welcome');this.trees.forEach(x=>x.visible=id==='welcome'||id==='team');this.bamboos.forEach(x=>x.visible=id==='hops');
      const palettes={welcome:[0xe5e9d9,0x68bfc5],campus:[0xd8e1eb,0x8bbfc2],team:[0xdae6c5,0x88bbc2],hops:[0xb8d6c0,0x61b8c3]};const [floor,water]=palettes[id];this.tiles.forEach((m,i)=>{m.material.color.setHex(floor);if(i%2)m.material.color.multiplyScalar(.97);});this.courtyard.material.color.setHex(floor);this.water.material.color.setHex(water);
      if(id==='welcome'){
        const flag=this.group(this.theme,4.5,.2,-3.8);this.cyl(flag,0xc2c8b8,0,1.7,0,.035,.05,3.4);const c=document.createElement('canvas');c.width=600;c.height=400;const ctx=c.getContext('2d');ctx.fillStyle='#de2910';ctx.fillRect(0,0,600,400);ctx.fillStyle='#ffde00';const star=(x,y,r,angle)=>{ctx.beginPath();for(let i=0;i<10;i++){const a=angle+i*Math.PI/5,rr=i%2?r*.382:r;const xx=x+Math.cos(a)*rr,yy=y+Math.sin(a)*rr;if(i)ctx.lineTo(xx,yy);else ctx.moveTo(xx,yy);}ctx.closePath();ctx.fill();};star(100,100,60,-Math.PI/2);for(const [x,y]of[[200,40],[240,80],[240,140],[200,180]])star(x,y,20,Math.atan2(100-y,100-x));const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const cloth=this.mesh(new T.PlaneGeometry(1.35,.9,12,1),0xffffff,flag,.71,2.92,.01,{map:texture,side:T.DoubleSide});this.animatedProps.push({object:cloth,kind:'flag'});
        for(const side of [-1,1]){const boat=this.group(this.theme,side*7.5,-.15,3.8);this.ball(boat,0x9a735a,0,0,0,.7,.19,1.7);this.ball(boat,0xd0b987,0,.16,0,.54,.11,1.4);this.tube(boat,0x98765a,[[0,.2,-.9],[0,1.2,-.2],[0,1.2,.5],[0,.2,1]],.04);this.animatedProps.push({object:boat,kind:'boat',x:boat.position.x,z:boat.position.z});}
      }
      if(id==='campus'){
        for(const side of [-1,1]){const building=this.group(this.theme,side*6.5,.15,-2.3);this.box(building,0xf3f0df,0,1.8,0,2.7,3.6,5.3);this.roof(building,0,3.5,0,3.5,6,0x527b8e);
          for(let i=0;i<3;i++){this.box(building,0x87b4c5,-side*1.37,1.95,-1.65+i*1.65,.05,1.45,1.12);this.box(building,0xf4e2bd,-side*1.42,1.95,-1.65+i*1.65,.07,.06,1.12);}
        }
        const books=this.group(this.theme,5.4,.28,3.2);for(let i=0;i<4;i++){this.box(books,[0x6598b0,0xbd7b7e,0x83a783,0xceb579][i],0,i*.19,0,1.4,.15,.92);this.box(books,0xf6edda,0,i*.19+.08,.02,1.32,.04,.83);}
        const clock=this.group(this.theme,-5.2,.3,2.3);this.cyl(clock,0x8f9f99,0,1.5,0,.07,.1,3);const face=this.mesh(new T.CircleGeometry(.6,40),0xffffeb,clock,0,3,0);this.mesh(new T.TorusGeometry(.62,.06,8,40),0xb3885d,clock,0,3,.03);
        this.tube(clock,0x3c6470,[[0,3,.07],[0,2.54,.07]],.027);this.tube(clock,0x3c6470,[[0,3,.09],[-.32,2.91,.09]],.034);this.tag(clock,'八点半',3.95,'small');
      }
      if(id==='team'){
        for(const side of [-1,1])for(let i=0;i<3;i++){const g=this.group(this.theme,side*(5.3+i*.8),.15,-3+i*2.7);this.tube(g,0x9c7d6e,[[0,0,0],[side*.1,1.6,0],[side*.45,2.5,0]],.14);for(let j=0;j<7;j++){const a=j*2.4;this.ball(g,j%2?0xeac0cf:0xdba0bb,Math.cos(a)*.7,2.6+Math.sin(j)*.35,Math.sin(a)*.7,.56,.43,.5);}}
        for(let i=0;i<9;i++){const petal=this.ball(this.theme,0xe8abbf,(i%3-1)*3,2+(i%4)*.5,Math.floor(i/3)*2-2,.09,.025,.14);this.animatedProps.push({object:petal,kind:'petal',x:petal.position.x,z:petal.position.z,index:i});}
      }
      if(id==='hops'){
        this.box(this.theme,0x78c9ca,0,.183,.95,3.65,.025,6.25);
        for(const side of [-1,1])for(let i=0;i<8;i++){const x=side*(5.2+(i%2)*.8),z=-4+i*1.2;this.cyl(this.theme,0x639d7b,x,1.6,z,.05,.07,3.2,8);for(let j=0;j<3;j++){const leaf=this.ball(this.theme,0x84b993,x+side*.25,1.0+j*.7,z,.36,.065,.1);leaf.rotation.z=side*.5;}}
        const wheel=this.group(this.theme,-6.2,1.2,.6);this.mesh(new T.TorusGeometry(1,.09,8,36),0x9e8164,wheel);for(let i=0;i<10;i++){const a=i*Math.PI/5;const spoke=this.box(wheel,0xb3946b,0,0,0,.09,2,.1);spoke.rotation.z=a;this.box(wheel,0xab8860,Math.sin(a)*.95,Math.cos(a)*.95,0,.32,.16,.52);}this.animatedProps.push({object:wheel,kind:'wheel'});
      }
      const animated=new Set(this.animatedProps.map(p=>p.object));for(const g of [...this.theme.children])if(g.isGroup&&!animated.has(g))this.batch(g);
    }
    semanticLandmark(socket,word){
      if(word==='天'){this.cyl(socket,0x79b3b4,0,.57,0,.09,.12,1.0);for(let i=0;i<3;i++)this.ball(socket,0xffffff,(i-1)*.32,1.45+(i===1?.1:0),0,.36,.26,.22);}
      if(word==='地'){this.box(socket,0x9a8164,0,.18,0,1.3,.22,.9);for(let i=0;i<3;i++){this.tube(socket,0x71a379,[[(i-1)*.35,.3,0],[(i-1)*.35,.6,0]],.025);this.ball(socket,0xa6cda0,(i-1)*.35,.58,0,.18,.08,.1);}}
      if(word==='人'||word==='你'||word==='他'){const npc=this.person(word==='他'?0x779abd:0xe6b75f,0x8fb69c,false);npc.scale.setScalar(.72);npc.position.z=-.23;socket.add(npc);socket.userData.npc=npc;}
      if(word==='我'){const mirror=this.mesh(new T.CircleGeometry(.64,40),0xc4e5e8,socket,0,1,0,{metalness:.4,roughness:.2});const edge=this.mesh(new T.TorusGeometry(.65,.055,8,40),0xcba365,socket,0,1,0);mirror.rotation.x=-.1;edge.rotation.x=-.1;this.cyl(socket,0xac9877,0,.45,0,.08,.1,.9);const mini=this.person(0x469d8f,0xe6a1b0,true);mini.scale.setScalar(.36);mini.position.set(0,.57,.08);socket.add(mini);}
    }
    showPlaced(socket,count){
      if(socket.userData.marked)return;socket.userData.marked=true;socket.userData.ring.material.color.setHex(0x438b72);
      if(this.lesson.kind==='friends'){const order=this.saved.filled.indexOf(socket.userData.index),source=order>=0?this.saved.used[order]:socket.userData.index;const npc=this.person([0x7c9fca,0xe3b565,0xa2bd79,0xc783a5][source%4],0xaec8b5,source%2===1);npc.scale.setScalar(.84);npc.position.z=-.25;socket.add(npc);socket.userData.npc=npc;if(this.lesson.id==='team')this.tag(socket,String(count),2.6,'number');}
      else if(this.lesson.id==='bridge'){this.box(socket,0xebdbc0,0,.15,0,2,.25,.52);this.tag(socket,String(count),.6,'number');}
      else if(this.lesson.object==='flower'){this.lotus(socket,0,.67,0,.63,true);this.tag(socket,String(count),1.25,'number');}
      else if(this.lesson.object==='lantern'){const light=this.lantern(socket,0,1.42,0,1.12);light.traverse(o=>{if(o.material){o.material.emissive.setHex(0xd07b45);o.material.emissiveIntensity=.15;}});this.tag(socket,String(count),2,'number');}
      else {this.tag(socket,socket.userData.word,2.2);if(socket.userData.word==='地')this.lotus(socket,0,.55,0,.57,true);}
    }
    makeHopCourse(state){
      this.hops=[];for(let i=0;i<6;i++){const x=i%2===0?-.8:.8,z=3.1-i*.85,g=this.group(this.dynamic,x,.2,z);g.userData={kind:'hop',index:i,type:i%2===0?'double':'single'};const geo=i%2===0?new T.RingGeometry(.45,.56,40):new T.RingGeometry(.5,.65,3);const shape=this.mesh(geo,state.filled.includes(i)?0x4d9c7b:i%2===0?0xdba053:0x5686be,g,0,.12,0,{side:T.DoubleSide});shape.rotation.x=-Math.PI/2;if(i%2)shape.rotation.z=Math.PI/2;const pad=this.cyl(g,0xe9e7d4,0,.05,0,i%2?.78:.7,i%2?.78:.7,.12,i%2?3:40);if(i%2)pad.rotation.y=Math.PI;this.hops.push(g);}
      this.avatar.position.set(0,.14,4.35);if(state.filled.length){const hop=this.hops[state.filled.length-1];this.avatar.position.set(hop.position.x,.14,hop.position.z);}
      this.exit=this.group(this.dynamic,0,.15,-5.2);this.exit.userData={kind:'exit',index:0};const hit=this.box(this.exit,0xffffff,0,1.2,0,2.4,2.4,.8);hit.material.visible=false;this.basket=null;if(state.ready)this.openGate();
    }
    jump(type,index){if(this.paused||!this.active||this.jumpMove||!this.hops?.[index])return false;const target=this.hops[index];if(target.userData.type!==type){this.events.message(target.userData.type==='double'?'圆圈，双脚一起跳。':'三角形，单脚轻轻跳。');return false;}this.path=null;this.jumpMove={from:this.avatar.position.clone(),to:new T.Vector3(target.position.x,.14,target.position.z),time:0,type,index};return true;}
    openGate(){if(this.gateOpen)return;this.gateOpen=true;}
    clearInput(){this.keys.clear();this.axis.x=0;this.axis.z=0;this.path=null;this.destinationRing.visible=false;}
    setPaused(value){this.paused=value;this.clearInput();}
    walkable(x,z){if(x< -4.25||x>4.25||z>5.3||z< -5.5)return false;if(this.hasRiver&&z< -2.48&&z> -4.5&&Math.abs(x)>.92)return false;if(z< -4.5&&!this.gateOpen)return false;return true;}
    navigate(x,z,target){
      if(!this.active||this.paused||this.jumpMove)return;
      if(this.lesson.kind==='jump'&&!this.gateOpen){this.events.message('圆圈双脚跳，三角单脚跳。');return;}
      if(target?.userData.kind==='socket')z+=this.lesson.id==='bridge'?1.0:1.15;
      if(target?.userData.kind==='exit'){if(!this.gateOpen){this.events.message('小路还在等你完成。');return;}this.path=[new T.Vector3(0,.14,-2),new T.Vector3(0,.14,-4.65),new T.Vector3(0,.14,-5.15)];}
      else{z=T.MathUtils.clamp(z,-2.1,5.1);x=T.MathUtils.clamp(x,-4.15,4.15);this.path=[new T.Vector3(x,.14,z)];}
      this.pending=target||null;this.destinationRing.position.set(x,.18,z);this.destinationRing.visible=true;
    }
    pick(e){if(!this.active||this.paused)return;this.scene.updateMatrixWorld(true);this.camera.updateMatrixWorld(true);const rect=this.host.getBoundingClientRect();this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height)*2+1);this.ray.setFromCamera(this.pointer,this.camera);
      const objects=[...this.items.filter(o=>o.visible&&!o.userData.used&&o!==this.carry),...this.sockets,this.exit,...(this.basket?[this.basket]:[])];const hits=this.ray.intersectObjects(objects,true);if(hits.length){let o=hits[0].object;while(o.parent&&!o.userData.kind)o=o.parent;if(o.userData.kind){const pos=o.getWorldPosition(new T.Vector3());this.navigate(pos.x,pos.z,o);return;}}
      const p=new T.Vector3();if(this.ray.ray.intersectPlane(this.plane,p))this.navigate(p.x,p.z,null);
    }
    interactNearest(){if(!this.active||this.paused)return;let list=this.carry?[...this.sockets,...(this.basket?[this.basket]:[])]:this.items.filter(x=>x.visible&&!x.userData.used);if(this.gateOpen)list.push(this.exit);let best=null,dist=1.85;for(const o of list){const p=o.getWorldPosition(new T.Vector3());const d=Math.hypot(p.x-this.avatar.position.x,p.z-this.avatar.position.z);if(d<dist){best=o;dist=d;}}if(best)this.events.interact(best.userData);else this.events.message('走近一点，再试试。');}
    take(index){const item=this.items[index];if(!item||item.userData.used||this.carry)return false;this.carry=item;if(this.lesson.kind!=='friends'){this.carrier.add(item);item.position.set(0,0,0);item.scale.setScalar(.62);}return true;}
    put(index,count){const socket=this.sockets[index],item=this.carry;if(!item||socket.userData.filled)return false;item.userData.used=true;item.visible=false;this.carry=null;socket.userData.filled=true;this.showPlaced(socket,count);return true;}
    drop(){if(!this.carry)return;const item=this.carry;this.dynamic.add(item);item.position.set(...[item.userData.origin[0],.24,item.userData.origin[1]]);item.scale.setScalar(1);this.carry=null;}
    highlight(index){this.sockets.forEach((s,i)=>s.userData.ring.material.color.setHex(i===index?0xe89e59:s.userData.filled?0x438b72:0xe2c063));}
    resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);const aspect=w/h,halfW=aspect<.8?5.15:aspect<1.3?7.2:Math.max(10.5,aspect*7.5),halfH=halfW/aspect;Object.assign(this.camera,{left:-halfW,right:halfW,top:halfH,bottom:-halfH});this.camera.updateProjectionMatrix();this.labels();}
    project(kind,index){const o=kind==='item'?this.items[index]:kind==='socket'?this.sockets[index]:kind==='basket'?this.basket:kind==='avatar'?this.avatar:this.exit;if(!o||!o.visible)return null;const p=o.getWorldPosition(new T.Vector3());p.y+=kind==='avatar'?1.6:kind==='socket'?.6:.5;p.project(this.camera);const r=this.host.getBoundingClientRect();return{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};}
    labels(){for(const t of this.tags){let visible=t.object.visible;let ancestor=t.object.parent;while(ancestor){visible=visible&&ancestor.visible;ancestor=ancestor.parent;}if(!visible){t.el.hidden=true;continue;}const p=t.object.getWorldPosition(new T.Vector3());p.y+=t.y*(t.object===this.carry&&this.lesson.kind!=='friends'?.62:1);p.project(this.camera);t.el.hidden=p.z>1||Math.abs(p.x)>1;const x=(p.x+1)*this.host.clientWidth/2,y=(1-p.y)*this.host.clientHeight/2;t.el.style.left=x+'px';t.el.style.top=y+'px';}}
    frame(ms){requestAnimationFrame(this.frame);const wallDt=this.last?Math.min(1,(ms-this.last)/1000):0,dt=Math.min(.05,wallDt);this.last=ms;if(document.hidden)return;if(!this.paused)this.time+=dt;let moving=false;
      if(this.active&&!this.paused){let ax=this.axis.x+(this.keys.has('arrowright')||this.keys.has('d')?1:0)-(this.keys.has('arrowleft')||this.keys.has('a')?1:0),az=this.axis.z+(this.keys.has('arrowdown')||this.keys.has('s')?1:0)-(this.keys.has('arrowup')||this.keys.has('w')?1:0);if(this.lesson.kind==='jump'&&!this.gateOpen){ax=0;az=0;}const direct=Math.hypot(ax,az)>.12;
        if(direct){this.path=null;this.pending=null;}else if(this.path?.length){const d=this.path[0].clone().sub(this.avatar.position);ax=d.x;az=d.z;if(Math.hypot(ax,az)<.08){this.path.shift();if(!this.path.length){this.path=null;this.destinationRing.visible=false;const target=this.pending;this.pending=null;if(target)this.events.interact(target.userData);}ax=0;az=0;}}
        const l=Math.hypot(ax,az);if(l>.01){const step=Math.min(3.2*dt,l);ax=ax/l*step;az=az/l*step;const p=this.avatar.position;const nx=p.x+ax,nz=p.z+az;if(this.walkable(nx,nz)){p.set(nx,.14,nz);moving=true;}else if(this.walkable(nx,p.z)){p.x=nx;moving=Math.abs(ax)>.001;}else if(this.walkable(p.x,nz)){p.z=nz;moving=Math.abs(az)>.001;}this.avatar.rotation.y=Math.atan2(ax,az);}
        if(this.jumpMove){const j=this.jumpMove;j.time+=dt;const t=Math.min(1,j.time/.65);this.avatar.position.lerpVectors(j.from,j.to,t);this.avatar.position.y+=Math.sin(Math.PI*t)*.85;this.avatar.rotation.y=Math.atan2(j.to.x-j.from.x,j.to.z-j.from.z);moving=true;if(t===1){this.hops[j.index].children[0].material.color.setHex(0x4d9c7b);this.jumpMove=null;this.events.hopped(j.index);}}
        if(this.carry&&this.lesson.kind==='friends'){const p=this.avatar.position;this.carry.position.lerp(new T.Vector3(p.x+.6,.2,p.z+.65),Math.min(1,dt*5));this.carry.rotation.y=this.avatar.rotation.y;}
        this.events.tick(wallDt);
      }
      const body=this.avatar.userData.body,limbs=this.avatar.userData.limbs;body.position.y=!this.reduced&&moving?Math.abs(Math.sin(this.time*10))*.065:0;for(let i=0;i<2;i++)limbs[i].rotation.x=this.jumpMove?.type==='single'&&i===0?-1.1:!this.reduced&&moving?Math.sin(this.time*10+i*Math.PI)*.45:0;for(let i=2;i<4;i++)limbs[i].rotation.x=this.carry&&this.lesson.kind!=='friends'?-.75:!this.reduced&&moving?Math.sin(this.time*10+(i-1)*Math.PI)*.3:0;
      const follow=this.avatar.position;this.dragon.position.set(follow.x+1.0,3.2+(!this.reduced?Math.sin(this.time*2.5)*.12:0),follow.z-.6);if(!this.reduced&&!this.paused){this.wings.forEach((w,i)=>w.rotation.z=Math.sin(this.time*23+i)*.2);for(const prop of this.animatedProps||[]){if(prop.kind==='boat'){prop.object.position.z=prop.z+Math.sin(this.time*.3)*1.15;prop.object.rotation.z=Math.sin(this.time)*.025;}if(prop.kind==='wheel')prop.object.rotation.z=this.time*.22;if(prop.kind==='petal'){prop.object.position.y=3-((this.time*.3+prop.index*.3)%3);prop.object.position.x=prop.x+Math.sin(this.time+prop.index)*.35;prop.object.rotation.z=this.time*.6;}}
        for(const item of this.items){const npc=item.children.find(c=>c.userData.limbs);if(!npc||!item.visible)continue;if(item===this.carry){npc.userData.limbs[0].rotation.x=Math.sin(this.time*9)*.38;npc.userData.limbs[1].rotation.x=-Math.sin(this.time*9)*.38;}else npc.userData.limbs[2].rotation.z=-.4+Math.sin(this.time*2+item.userData.index)*.18;}
      }
      const door=this.gateOpen?Math.PI*.62:0;this.doorL.rotation.y=T.MathUtils.lerp(this.doorL.rotation.y,door,this.reduced?1:.08);this.doorR.rotation.y=-this.doorL.rotation.y;
      this.renderer.render(this.scene,this.camera);this.labels();
    }
    inspect(){return{ready:true,position:this.avatar.position.toArray(),carry:this.carry?.userData.index??null,open:this.gateOpen,moving:!!this.path,triangles:this.renderer.info.render.triangles,items:this.items.map(x=>({...x.userData,visible:x.visible})),sockets:this.sockets.map(x=>({index:x.userData.index,word:x.userData.word,filled:x.userData.filled})),reduced:this.reduced,paused:this.paused};}
  }window.AdventureWorld=AdventureWorld;
})();
