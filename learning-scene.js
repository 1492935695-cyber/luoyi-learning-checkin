/* Original low-poly teaching world. All geometry and materials are bundled locally. */
(() => {
  'use strict';
  const T = window.THREE;
  class LearningWorld {
    constructor(host, labels, onPick) {
      this.host=host; this.labels=labels; this.onPick=onPick; this.objects=[]; this.mode='home'; this.selected=[]; this.rotated=false; this.elapsed=0;
      this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(!T) throw new Error('3D engine unavailable');
      this.renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
      this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));
      this.renderer.outputColorSpace=T.SRGBColorSpace;
      this.renderer.shadowMap.enabled=true; this.renderer.shadowMap.type=T.PCFSoftShadowMap;
      this.renderer.setClearColor(0x000000,0); host.appendChild(this.renderer.domElement);
      this.scene=new T.Scene();
      this.camera=new T.PerspectiveCamera(35,1,.1,100); this.camera.position.set(9,10.3,14);
      this.scene.add(new T.HemisphereLight(0xfff9df,0x859f87,2.2));
      const sun=new T.DirectionalLight(0xfff3d5,3.1);sun.position.set(-5,12,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:35});sun.shadow.normalBias=.06;this.scene.add(sun);
      this.ground=new T.Group();this.scene.add(this.ground);
      this.dynamic=new T.Group();this.scene.add(this.dynamic);
      this.ray=new T.Raycaster();this.pointer=new T.Vector2();this.target=new T.Vector3(0,3.8,0);this.look=new T.Vector3(0,.7,0);
      this.makeIsland();this.dragon=this.makeDragon();this.dragon.position.copy(this.target);this.scene.add(this.dragon);
      this.rabbit=this.makeRabbit();this.scene.add(this.rabbit);this.rabbit.position.set(2,.53,-.65);
      host.addEventListener('pointerdown',e=>{this.down={x:e.clientX,y:e.clientY};});
      host.addEventListener('pointerup',e=>{if(!this.down||Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)>14)return;this.pick(e);});
      host.addEventListener('webglcontextlost',()=>{document.getElementById('scene-fallback').hidden=false;},true);
      this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);
      this.resize();this.setMode('home',{});this.frame=this.frame.bind(this);requestAnimationFrame(this.frame);
    }
    material(color,extra={}){return new T.MeshStandardMaterial({color,roughness:.85,...extra});}
    mesh(geometry,color,parent,x=0,y=0,z=0,extra={}){const m=new T.Mesh(geometry,this.material(color,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
    ball(parent,color,x,y,z,sx,sy=sx,sz=sx){const m=this.mesh(new T.SphereGeometry(1,20,14),color,parent,x,y,z);m.scale.set(sx,sy,sz);return m;}
    box(parent,color,x,y,z,sx,sy,sz){return this.mesh(new T.BoxGeometry(sx,sy,sz),color,parent,x,y,z);}
    cylinder(parent,color,x,y,z,rt,rb,h,sides=40){return this.mesh(new T.CylinderGeometry(rt,rb,h,sides),color,parent,x,y,z);}
    tube(parent,points,color,r=.025){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));return this.mesh(new T.TubeGeometry(curve,20,r,6,false),color,parent);}
    makeIsland(){
      this.cylinder(this.ground,0x8ba87c,0,-.25,0,4.9,4.6,.65,64);
      this.cylinder(this.ground,0xc7d89d,0,.08,0,4.88,4.88,.14,64);
      const pool=this.cylinder(this.ground,0x9ccdc6,0,.2,.25,3.9,3.92,.12,64);pool.scale.z=.84;
      const water=this.cylinder(this.ground,0xaddcd4,0,.27,.25,3.7,3.7,.025,64);water.scale.z=.82;
      for(const [x,z,r] of [[-2.5,1.8,.65],[2.7,1.5,.5],[1.8,-1.8,.6],[-2,-1.6,.48],[-3.2,-.1,.48],[.5,2.4,.46]])this.lily(x,z,r);
      this.lotus(-2.55,1.75,.65);this.lotus(2.65,1.4,.48);this.lotus(-2.1,-1.5,.45);
      for(let i=0;i<3;i++){const ring=this.mesh(new T.RingGeometry(.55+i*.18,.565+i*.18,50),0xe5f3e1,this.ground,-1.5,.3,.7,{transparent:true,opacity:.48,side:T.DoubleSide});ring.rotation.x=-Math.PI/2;}
      // A little reading house, placed behind the teaching platform.
      const house=new T.Group();house.position.set(.1,.4,-2.55);house.rotation.y=.12;this.ground.add(house);
      this.box(house,0xf4e5bf,0,.55,0,1.75,1.1,1.1);
      const roof=this.mesh(new T.ConeGeometry(1.53,.95,4),0x709159,house,0,1.55,0);roof.rotation.y=Math.PI/4;roof.scale.z=.82;
      this.box(house,0x826e45,0,.42,.565,.44,.82,.045);this.ball(house,0xe9d899,.15,.4,.615,.035);
      for(const x of [-.58,.58]){this.box(house,0x92bcc0,x,.62,.57,.35,.38,.045);this.box(house,0xf9edcc,x,.62,.61,.04,.38,.03);}
      this.box(house,0xe4d5ab,0,.03,.85,2,.12,.75);
      const bridge=new T.Group();bridge.position.set(2.8,.3,-.8);bridge.rotation.y=-.45;this.ground.add(bridge);
      for(let i=0;i<7;i++)this.box(bridge,0xdac598,0,.03,i*.22-.65,1.45,.15,.18);
      for(const x of [-.66,.66])for(const z of [-.62,.62]){this.cylinder(bridge,0xa28a62,x,.4,z,.045,.045,.8,8);}
      for(const x of [-.66,.66])this.box(bridge,0xc3ad7c,x,.75,0,.07,.07,1.45);
      // Trees and reeds frame the scene without hiding the interactive objects.
      for(const [x,z,s] of [[-3.5,-1.9,1],[3,-2.4,.85],[-3.6,1,.6]]){
        this.cylinder(this.ground,0x9b8862,x,.75,z,.08,.12,1.3,8);
        this.ball(this.ground,0x9bb879,x,1.75*s,z,.62*s,.83*s,.6*s);this.ball(this.ground,0xb5cd8e,x+.2,2.1*s,z-.06,.43*s,.5*s,.44*s);
      }
      for(let i=0;i<8;i++){const a=i*.73;const x=Math.cos(a)*4.2,z=Math.sin(a)*3.65;this.tube(this.ground,[[x,.18,z],[x+.06,.58,z],[x+.15,.78,z]],0x749455,.026);}
      // Neutral wood tray for objects; keep the picture readable from a phone.
      this.tray=this.cylinder(this.ground,0xe8d5a5,0,.43,.75,2.38,2.42,.14,48);this.tray.scale.z=.72;
    }
    lily(x,z,r){const shape=new T.Shape();shape.moveTo(0,0);for(let i=0;i<=48;i++){const a=.16+(Math.PI*2-.34)*i/48;shape.lineTo(Math.cos(a)*r,Math.sin(a)*r);}shape.lineTo(0,0);const leaf=this.mesh(new T.ShapeGeometry(shape),0x83ab71,this.ground,x,.33,z,{side:T.DoubleSide});leaf.rotation.x=-Math.PI/2;leaf.rotation.z=x*.7;
      for(let i=0;i<7;i++){const a=i*.85+.2;this.tube(this.ground,[[x,.345,z],[x+Math.cos(a)*r*.8,.345,z+Math.sin(a)*r*.8]],0xa8c28b,.008);}return leaf;}
    lotus(x,z,r){for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const p=this.ball(this.ground,i%2?0xeda8ad:0xf4c5bb,x+Math.cos(a)*r*.23,.43,z+Math.sin(a)*r*.23,r*.2,r*.2,r*.37);p.rotation.y=-a;p.rotation.z=.25;}this.ball(this.ground,0xeec26b,x,.49,z,r*.16,.1,r*.16);}
    makeDragon(){
      const g=new T.Group();g.scale.setScalar(.72);this.wings=[];
      for(const side of [-1,1])for(const row of [0,1]){const pivot=new T.Group();pivot.position.set(side*.12,-.15-row*.23,0);g.add(pivot);const wing=this.ball(pivot,0xaed7e3,side*.62,0,-.04,.76,.13,.29);wing.rotation.z=side*(row?-.23:.28);wing.material.transparent=true;wing.material.opacity=.9;this.wings.push({pivot,side,row});}
      for(let i=0;i<5;i++)this.ball(g,i%2?0x8bb24f:0x9bbc58,0,-.45-i*.19,0,.22-i*.027,.19,.18-i*.015);
      this.ball(g,0x79a847,0,-.14,0,.32,.4,.29);this.ball(g,0xa7ca68,0,.4,.08,.52,.47,.37);
      for(const side of [-1,1]){this.ball(g,0xfff8e9,side*.23,.48,.36,.245,.285,.14);this.ball(g,0x3e4430,side*.23,.48,.49,.12,.145,.064);this.ball(g,0xffffff,side*.2,.55,.54,.038);this.ball(g,0xf0b494,side*.32,.25,.38,.12,.063,.034);this.tube(g,[[side*.2,.77,.07],[side*.35,1.16,.06],[side*.52,1.17,.04],[side*.52,1.04,.04]],0x6b8c3e,.022);}
      this.tube(g,[[-.09,.24,.425],[0,.19,.45],[.09,.24,.425]],0x456132,.015);g.userData.kind='companion';return g;
    }
    makeRabbit(){
      const g=new T.Group();this.ball(g,0xf5eee0,0,.52,0,.33,.48,.26);this.ball(g,0xf9f0de,0,1.08,0,.39,.36,.31);
      for(const side of [-1,1]){const ear=this.ball(g,0xf6eddd,side*.19,1.59,0,.115,.38,.1);ear.rotation.z=-side*.15;const inner=this.ball(g,0xeeb9b0,side*.19,1.61,.09,.055,.25,.02);inner.rotation.z=-side*.15;this.ball(g,0x354b3b,side*.135,1.12,.28,.043,.06,.032);this.ball(g,0xeebdb0,side*.25,1.0,.25,.075,.04,.026);this.ball(g,0xefe3ca,side*.2,.13,.1,.17,.12,.24);}
      this.ball(g,0xd59a92,0,1,.324,.042,.028,.025);this.box(g,0x88ac75,0,.58,.14,.57,.5,.21);this.ball(g,0xf9f2df,-.35,.63,.06,.12,.25,.12);
      this.arm=new T.Group();this.arm.position.set(.33,.75,.05);g.add(this.arm);this.ball(this.arm,0xf9f2df,0,-.12,0,.12,.23,.12);
      this.can=new T.Group();this.arm.add(this.can);this.can.position.set(.13,-.28,.12);this.cylinder(this.can,0x7bb7bf,0,0,0,.19,.15,.3,16);this.tube(this.can,[[.1,.03,0],[.38,.18,0],[.45,.15,0]],0x629fa9,.055);this.tube(this.can,[[-.1,.13,0],[-.3,.17,0],[-.3,-.04,0],[-.1,-.05,0]],0x629fa9,.034);
      this.book=new T.Group();g.add(this.book);this.book.position.set(0,.85,.44);this.box(this.book,0x659da1,-.19,0,0,.38,.07,.42).rotation.z=.2;this.box(this.book,0x659da1,.19,0,0,.38,.07,.42).rotation.z=-.2;this.box(this.book,0xfff4d7,-.18,.04,0,.33,.04,.36);this.box(this.book,0xfff4d7,.18,.04,0,.33,.04,.36);this.book.visible=false;return g;
    }
    clearDynamic(){this.objects=[];this.labels.replaceChildren();while(this.dynamic.children.length){const c=this.dynamic.children[0];this.dynamic.remove(c);c.traverse(o=>{o.geometry?.dispose();if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});}}
    seed(x,z,i){const g=new T.Group();g.position.set(x,.63,z);g.userData={kind:'seed',index:i};this.dynamic.add(g);this.ball(g,0xebc46a,0,.15,0,.25,.27,.22);this.ball(g,0xf4d68a,-.08,.29,.1,.066,.035,.035);this.tube(g,[[.02,.4,0],[.03,.49,0]],0x87a255,.025);const hit=this.ball(g,0xffffff,0,.2,0,.37,.42,.35);hit.material.visible=false;this.objects.push(g);return g;}
    basket(x,z,i){const g=new T.Group();g.position.set(x,.56,z);g.userData={kind:'basket',index:i};this.dynamic.add(g);this.cylinder(g,0xb89765,0,.05,0,.42,.32,.19,24);this.cylinder(g,0xf5dfb3,0,.153,0,.34,.34,.014,24);this.tube(g,[[-.36,.16,0],[-.25,.55,0],[.25,.55,0],[.36,.16,0]],0xa08052,.034);this.objects.push(g);return g;}
    setMode(mode,state={}){
      this.mode=mode;this.state=state;this.clearDynamic();this.tray.visible=!['home','story','read','celebrate'].includes(mode);this.rabbit.visible=true;this.rabbit.position.set(2,.53,-.65);this.rabbit.rotation.y=-.3;this.rabbit.scale.setScalar(1);this.can.visible=false;this.book.visible=false;this.arm.rotation.z=0;this.target.set(-.1,3.15,.05);this.look.set(0,.8,0);
      if(['seeds','spread'].includes(mode)){
        const pos=mode==='spread'?[[-1.65,.4],[-.82,.4],[0,.4],[.82,.4],[1.65,.4]]:[[-1.15,.4],[-.35,1.2],[.38,.22],[1.17,1.3],[-1.35,1.7]];
        pos.forEach(([x,z],i)=>{const s=this.seed(x,z,i);if((state.counted||[]).includes(i))this.mark(s,(state.counted||[]).indexOf(i)+1);});
        this.target.set(-.8,2.35,-.65);
      }
      if(mode==='share'){
        const positions=[[-1.38,.38],[-.47,.38],[.47,.38],[1.38,.38]];
        positions.forEach(([x,z],i)=>{const b=this.basket(x,z,i);if((state.filled||[]).includes(i)){this.ball(b,0xebc46a,0,.32,0,.2,.22,.19);this.mark(b,'✓');}});
        const left=5-(state.filled||[]).length;for(let i=0;i<left;i++)this.seed(-1.3+i*.65,1.5,i+10);
      }
      if(mode==='story'||mode==='read'){
        this.rabbit.position.set(.1,.38,.9);this.rabbit.rotation.y=.08;this.rabbit.scale.setScalar(1.3);this.target.set(-1.15,3.05,.3);
        if(mode==='story'){
          this.can.visible=true;this.arm.rotation.z=.55;
          this.cylinder(this.dynamic,0xb68062,1.08,.57,1.15,.37,.26,.5,24);this.cylinder(this.dynamic,0x766e43,1.08,.83,1.15,.31,.31,.025,24);this.tube(this.dynamic,[[1.08,.85,1.15],[1.04,1.26,1.15],[1.15,1.52,1.15]],0x6f914b,.035);
          for(let i=0;i<6;i++){const a=i*Math.PI/3;this.ball(this.dynamic,0xf2bbac,1.15+Math.cos(a)*.18,1.56+Math.sin(a)*.18,1.15,.14,.15,.1);}this.ball(this.dynamic,0xe6c358,1.15,1.56,1.25,.105);
          this.drops=[];for(let i=0;i<7;i++){const d=this.ball(this.dynamic,0x81c6d8,.67,1.12,1.1,.035,.06,.035);this.drops.push(d);}
        }else{this.book.visible=true;this.box(this.dynamic,0xc9b487,.1,.24,.9,1.3,.35,.8);}
      } else this.drops=[];
      if(mode==='home'){this.rabbit.position.set(2,.42,-.3);this.book.visible=true;this.target.set(.05,2.8,.2);}
      if(mode==='celebrate'){
        this.target.set(0,2.25,1);this.rabbit.position.set(1.35,.4,.6);
        for(let i=0;i<9;i++){const a=i*2.4;this.ball(this.dynamic,i%2?0xf4ce83:0xe8b5b3,Math.cos(a)*2,.7+Math.sin(i)*.12,Math.sin(a)*1.8,.07,.07,.07);}
      }
      this.updateLabels();
    }
    mark(g,text){g.userData.mark=String(text);const el=document.createElement('span');el.className='object-tag';el.textContent=text;this.labels.appendChild(el);g.userData.label=el;}
    count(index,number){const g=this.objects.find(o=>o.userData.kind==='seed'&&o.userData.index===index);if(g&&!g.userData.label){this.mark(g,number);g.scale.setScalar(1.1);this.flyTo(g.position.x,g.position.z);}}
    flyTo(x,z){this.target.set(x,2,z);}
    rearrange(){this.setMode('seeds',this.state);this.mode='spread';this.objects.forEach((g,i)=>{g.userData.destination=new T.Vector3(-1.65+i*.825,.63,.4);if(this.reduced)g.position.copy(g.userData.destination);});this.target.set(0,2.3,-.6);}
    pick(e){const r=this.renderer.domElement.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hits=this.ray.intersectObjects(this.objects,true);if(hits.length){let o=hits[0].object;while(o.parent&&o.parent!==this.dynamic)o=o.parent;if(o.userData.kind){this.onPick(o.userData.kind,o.userData.index);return;}}
      const plane=new T.Plane(new T.Vector3(0,1,0),-.4);const p=new T.Vector3();if(this.ray.ray.intersectPlane(plane,p)&&Math.hypot(p.x,p.z)<5){this.flyTo(p.x,p.z);if(this.mode==='story'||this.mode==='read')this.onPick('rabbit',0);}
    }
    turn(){this.rotated=!this.rotated;this.resize();}
    resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;const scale=w/h<1?1.26:1;this.camera.position.set((this.rotated?-7:7)*scale,9.7*scale,13.5*scale);this.camera.lookAt(this.look);this.camera.updateProjectionMatrix();this.updateLabels();}
    updateLabels(){for(const g of this.objects){if(!g.userData.label)continue;const p=g.position.clone();p.y+=.75;p.project(this.camera);g.userData.label.style.left=(p.x+1)/2*this.host.clientWidth+'px';g.userData.label.style.top=(1-p.y)/2*this.host.clientHeight+'px';}}
    frame(ms){requestAnimationFrame(this.frame);if(document.hidden)return;const t=ms/1000;const dt=Math.min(.05,this.last? (ms-this.last)/1000:.016);this.last=ms;this.dragon.position.lerp(this.target,Math.min(1,dt*3));if(!this.reduced){this.dragon.position.y+=Math.sin(t*2)*.004;this.dragon.rotation.y=Math.sin(t*.7)*.12;for(const w of this.wings)w.pivot.rotation.z=w.side*Math.sin(t*13+w.row*.4)*.15;for(let i=0;i<(this.drops||[]).length;i++){const phase=(t*.65+i/7)%1;this.drops[i].position.set(.61+phase*.43,1.19-phase*.34,1.12);}}
      for(const g of this.objects)if(g.userData.destination)g.position.lerp(g.userData.destination,Math.min(1,dt*3));
      this.renderer.render(this.scene,this.camera);this.updateLabels();
    }
    inspect(){return {ready:true,mode:this.mode,objectCount:this.objects.length,position:this.dragon.position.toArray(),target:this.target.toArray(),triangles:this.renderer.info.render.triangles};}
  }
  window.LearningWorld=LearningWorld;
})();
