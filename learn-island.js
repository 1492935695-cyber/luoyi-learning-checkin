(() => {
  'use strict';
  const $=id=>document.getElementById(id), lessons=window.LUOYI_LESSONS, KEY='luoyi-learning-island-v1';
  const empty=()=>({version:1,progress:{},completed:[],last:null});
  let data=empty(), course=null, stage=null, world=null, audioOn=false, speechSerial=0;
  const fresh=()=>({step:0,counted:[],filled:[],sentence:[],answered:false,rearranged:false});
  function clean(raw){
    if(!raw||raw.version!==1||!raw.progress||typeof raw.progress!=='object')throw Error('文件格式不对');
    const out=empty();
    for(const id of Object.keys(lessons)){
      const p=raw.progress[id];if(!p)continue;
      if(!Number.isInteger(p.step)||p.step<0||p.step>=lessons[id].steps.length)throw Error('课程记录不完整');
      const ints=(v,max)=>Array.isArray(v)?[...new Set(v.filter(n=>Number.isInteger(n)&&n>=0&&n<max))]:[];
      out.progress[id]={...fresh(),step:p.step,counted:ints(p.counted,5),filled:ints(p.filled,4),sentence:ints(p.sentence,3),answered:p.answered===true,rearranged:p.rearranged===true};
    }
    out.completed=Array.isArray(raw.completed)?[...new Set(raw.completed.filter(id=>lessons[id]))]:[];
    out.last=lessons[raw.last]?raw.last:null;return out;
  }
  try{const saved=localStorage.getItem(KEY);if(saved)data=clean(JSON.parse(saved));}catch(_){data=empty();}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(data));}catch(_){$('connection').textContent='当前浏览器无法保存进度，可以继续玩';}}
  function stopSpeech(){speechSerial++;window.speechSynthesis?.cancel();audioOn=false;$('listen').querySelector('span').textContent='听一听';}
  function speak(text){
    stopSpeech();if(!('speechSynthesis'in window)){feedback('这台设备暂时不能朗读，请身边的大人读一下文字。');return;}
    const voices=speechSynthesis.getVoices(),chinese=voices.find(v=>/zh[-_]CN/i.test(v.lang))||voices.find(v=>/^zh/i.test(v.lang));
    if(voices.length&&!chinese){feedback('还没有可用的中文声音，请身边的大人读一下文字。');return;}
    const serial=speechSerial, u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=.85;u.pitch=1.05;if(chinese)u.voice=chinese;
    u.onend=()=>{if(serial===speechSerial){audioOn=false;$('listen').querySelector('span').textContent='再听一次';}};
    u.onerror=e=>{if(serial!==speechSerial||e.error==='interrupted'||e.error==='canceled')return;audioOn=false;$('listen').querySelector('span').textContent='听一听';feedback('声音暂时没播放出来，可以请大人读一下提示。');};
    audioOn=true;$('listen').querySelector('span').textContent='停止朗读';speechSynthesis.speak(u);
  }
  function feedback(text){$('feedback').textContent=text;}
  function button(text,fn,cls='choice'){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=text;b.addEventListener('click',fn);return b;}
  function status(){for(const id of Object.keys(lessons))$(id+'-status').textContent=data.completed.includes(id)?'玩过这一节 · 再发现 →':data.progress[id]?'接着上次 →':id==='math'?'去发现 →':'去讲述 →';$('resume').hidden=!data.last||!data.progress[data.last];}
  function home(){stopSpeech();course=null;stage=null;$('app').className='is-home';$('welcome').hidden=false;$('courses').hidden=false;$('lesson-panel').hidden=true;$('completion').hidden=true;$('world-tag').textContent='珞伊的小荷塘';$('world-hint').textContent='点一点荷塘，小蜻蜓会飞过去';world?.setMode('home');status();window.scrollTo({top:0,behavior:'auto'});}
  function start(id){stopSpeech();course=id;if(!data.progress[id])data.progress[id]=fresh();data.last=id;save();$('app').className='is-lesson';$('welcome').hidden=true;$('courses').hidden=true;$('lesson-panel').hidden=false;$('completion').hidden=true;render();window.scrollTo({top:0,behavior:'auto'});}
  function current(){return data.progress[course];}
  function passed(message){const p=current();p.answered=true;save();feedback(message||stage.success);$('next').hidden=false;$('next').textContent=p.step===lessons[course].steps.length-1?'收好珞伊的发现 →':'下一步 →';}
  function worldPick(kind,index){if(!course)return;if(stage.type==='count'&&kind==='seed')count(index);else if(stage.type==='share'&&kind==='basket')share(index);else if(kind==='rabbit')feedback('看一看小兔的动作，再把你的发现说出来。');}
  function count(index){const p=current();if(index<0||index>4||p.answered)return;if(p.counted.includes(index)){feedback('这颗已经有记号了，不用重复数。找找还没做记号的。');return;}
    p.counted.push(index);world?.count(index,p.counted.length);save();renderControls();if(p.counted.length===5)passed();else feedback('已经数到 '+p.counted.length+'。沿着自己的路线，继续找下一颗。');}
  function share(index){const p=current();if(index<0||index>3||p.answered)return;if(p.filled.includes(index)){feedback('这个篮子已经有 1 颗了，找一个空篮子吧。');return;}p.filled.push(index);save();world?.setMode('share',p);world?.flyTo(-1.38+index*.92,.38);renderControls();if(p.filled.length===4)passed();else feedback('这个篮子分到了。每个篮子只放 1 颗。');}
  function choose(index,btn){const p=current();if(p.answered)return;if(stage.id==='move'&&!p.rearranged){feedback('先点“把莲子排成长队”，观察它们怎样换位置。');return;}
    if(index===stage.answer){btn.classList.add('correct');passed();}else{btn.classList.add('try-again');setTimeout(()=>btn.classList.remove('try-again'),500);feedback(stage.hint);}
  }
  function render(){
    stopSpeech();const p=current(),lesson=lessons[course];stage=lesson.steps[p.step];$('subject-tag').textContent=lesson.name;$('lesson-count').textContent=`第 ${p.step+1} / ${lesson.steps.length} 步`;$('task-title').textContent=stage.title;$('task-prompt').textContent=stage.prompt;$('world-tag').textContent=course==='math'?'珞伊 · 荷塘寻宝':'珞伊 · 荷塘故事';
    $('world-hint').textContent=stage.type==='count'?'点小莲子，记下你数过的顺序':stage.type==='share'?'点一个空篮子，放入一颗莲子':course==='chinese'?'先看清画面，再讲讲你的发现':'看一看，想一想，慢慢来';
    $('step-dots').replaceChildren(...lesson.steps.map((s,i)=>{const dot=document.createElement('span');dot.className=i<p.step?'done':i===p.step?'current':'';return dot;}));
    $('next').hidden=!p.answered;$('next').textContent=p.step===lesson.steps.length-1?'收好珞伊的发现 →':'下一步 →';$('oral-note').hidden=stage.type!=='oral';feedback(p.answered?stage.success:'');
    world?.setMode(stage.id==='move'&&!p.rearranged?'seeds':stage.scene,p);
    renderControls();
  }
  function renderControls(){
    const p=current(),host=$('task-controls');host.replaceChildren();
    if(stage.type==='count'||stage.type==='share'){
      const counting=stage.type==='count',n=counting?p.counted.length:p.filled.length,max=counting?5:4;
      const pill=document.createElement('div');pill.className='counter-pill';const label=document.createElement('span');label.textContent=counting?'我已经数了':'已经分到的篮子';const value=document.createElement('b');value.textContent=n+' / '+max;pill.append(label,value);host.append(pill);
      const controls=document.createElement('div');controls.className='object-buttons';
      for(let i=0;i<max;i++){const done=(counting?p.counted:p.filled).includes(i);const b=button(done?'✓':counting?'':'篮',()=>counting?count(i):share(i),'object-button'+(done?' counted':''));b.setAttribute('aria-label',(counting?'小莲子':'小篮子')+(i+1)+(done?'，已经点过':''));b.dataset.object=i;controls.append(b);}host.append(controls);
      const help=document.createElement('p');help.className='helper';help.textContent='可以点荷塘里的物品，也可以点上面的大按钮。';host.append(help);
      if(stage.type==='count')host.append(button(stage.skip,()=>{p.step=2;p.counted=[];p.answered=false;p.rearranged=false;save();render();},'skip-btn'));
    } else if(stage.type==='choice'){
      if(stage.id==='move'){
        host.append(button(p.rearranged?'再看一次怎样排成长队':'把莲子排成长队',()=>{p.rearranged=true;save();world?.rearrange();renderControls();feedback('没有添进来，也没有拿走。珞伊，看看数量有没有变。');},'secondary'));
      }
      stage.options.forEach((text,i)=>{const b=button(text,()=>choose(i,b),'choice'+(stage.numeric?' numeric':'')+(p.answered&&i===stage.answer?' correct':''));b.dataset.answer=i;if(stage.id==='move'&&!p.rearranged)b.disabled=true;host.append(b);});
    } else if(stage.type==='sentence'){
      const slots=document.createElement('div');slots.className='sentence-slots';slots.setAttribute('aria-label','拼好的句子');
      if(!p.sentence.length){const ph=document.createElement('span');ph.className='sentence-empty';ph.textContent='谁  +  在哪里  +  做什么';slots.append(ph);}
      for(const i of p.sentence){const span=document.createElement('span');span.className='sentence-piece';span.textContent=stage.pieces[i];slots.append(span);}host.append(slots);
      stage.pieces.forEach((text,i)=>{const b=button(text,()=>{if(p.answered||p.sentence.includes(i))return;p.sentence.push(i);save();renderControls();if(p.sentence.length===3){if(p.sentence.every((v,j)=>v===stage.order[j]))passed();else feedback('这次我们试试“谁 → 在哪里 → 做什么”。点“撤回一块”可以调整。');}},'choice'+(p.sentence.includes(i)?' selected':''));b.disabled=p.sentence.includes(i)||p.answered;b.dataset.piece=i;host.append(b);});
      if(!p.answered){const row=document.createElement('div');row.className='sentence-controls';row.append(button('撤回一块',()=>{p.sentence.pop();save();renderControls();feedback('');},'quiet-btn'));host.append(row);}
    } else if(stage.type==='oral'){
      const b=button(p.answered?'珞伊已经分享过了':stage.button||'我讲完了',()=>{passed();renderControls();},'secondary');b.disabled=p.answered;host.append(b);
    }
  }
  function next(){if(!current().answered)return;stopSpeech();const p=current();if(p.step===lessons[course].steps.length-1){finish();return;}p.step++;p.answered=false;p.sentence=[];save();render();$('task-title').focus({preventScroll:true});if(window.innerWidth<=640)window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  function finish(){const id=course,lesson=lessons[id];if(!data.completed.includes(id))data.completed.push(id);delete data.progress[id];data.last=Object.keys(data.progress)[0]||null;save();$('app').className='is-finished';$('lesson-panel').hidden=true;$('completion').hidden=false;$('finish-title').textContent=lesson.finish;$('finish-copy').textContent=lesson.summary;$('discovery-copy').textContent=lesson.discovery;$('transfer-copy').textContent=lesson.transfer;$('world-tag').textContent='珞伊的发现，收好啦';$('world-hint').textContent='下一次，小蜻蜓还会在这里等珞伊';world?.setMode('celebrate');stage=null;course=null;window.scrollTo({top:0,behavior:'auto'});}
  $('back-home').onclick=home;$('finish-home').onclick=home;$('next').onclick=next;$('resume').onclick=()=>{if(data.last)start(data.last);};
  document.querySelectorAll('[data-course]').forEach(b=>b.onclick=()=>start(b.dataset.course));
  $('hint').onclick=()=>feedback(stage.hint);
  $('listen').onclick=()=>{if(audioOn){stopSpeech();return;}speak(stage.voice+(stage.options?'选项是：'+stage.options.join('，')+'。':''));};
  $('view-turn').onclick=()=>world?.turn();
  for(const [trigger,dialog] of [['parent-open','parent-dialog'],['install-help','install-dialog']])$(trigger).onclick=()=>{stopSpeech();$(dialog).showModal();};
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
  $('copy-link').onclick=async()=>{try{await navigator.clipboard.writeText(new URL('learn-island.html',location.href).href);$('copy-message').textContent='已复制，可以发给家人。';}catch(_){$('copy-message').textContent='请直接复制浏览器地址栏里的网址。';}};
  $('export-progress').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='luoyi-learning-progress.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);$('data-message').textContent='已请求下载进度文件。下载完成后，可在另一台设备的同一网页导入。';};
  $('import-progress').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>50000)throw Error('文件太大');const incoming=clean(JSON.parse(await file.text()));data=incoming;save();home();$('data-message').textContent='已导入珞伊的小岛进度。';}catch(_){$('data-message').textContent='这个文件不是有效的小岛进度，原来的记录已保留。';}e.target.value='';};
  try{world=new window.LearningWorld($('scene'),$('scene-labels'),worldPick);}catch(err){$('scene-fallback').hidden=false;$('world-hint').textContent='可以使用下面的大按钮完成游戏';console.warn('3D unavailable; accessible controls remain available.');}
  let offlineReady=false;
  function connection(){if(!navigator.onLine)$('connection').textContent=offlineReady?'离线小岛 · 可以继续玩':'当前离线 · 尚未确认课程已缓存';else $('connection').textContent=offlineReady?'已备好离线小岛 · 进度存在这台设备':'在线小岛 · 正在准备离线课程';}
  async function checkCache(){try{const keys=await caches.keys();const key=keys.find(k=>k==='luoyi-checkin-v7-learning-20260916a');if(!key)return;const cache=await caches.open(key);const needed=['learn-island.html','learn-island.css?v=20260916a','learn-island.js?v=20260916a','learning-scene.js?v=20260916a','learning-lessons.js?v=20260916a','three.min.js'];const matches=await Promise.all(needed.map(f=>cache.match(new URL(f,location.href).href)));offlineReady=matches.every(Boolean);connection();}catch(_){$('connection').textContent='在线可玩 · 当前浏览器没有启用离线保存';}}
  window.addEventListener('online',connection);window.addEventListener('offline',connection);connection();
  if('serviceWorker'in navigator){navigator.serviceWorker.register('service-worker.js').then(reg=>{reg.update().catch(()=>{});return navigator.serviceWorker.ready;}).then(checkCache).catch(()=>{$('connection').textContent='在线可玩 · 离线保存尚未就绪';});navigator.serviceWorker.addEventListener('controllerchange',checkCache);}
  else $('connection').textContent='在线可玩 · 当前浏览器不支持离线保存';
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSpeech();});
  window.learnIsland={getState:()=>({course,stage:stage?.id||null,data:JSON.parse(JSON.stringify(data)),scene:world?.inspect()||{ready:false},offlineReady}),projectObject:(kind,index)=>{const g=world?.objects.find(o=>o.userData.kind===kind&&o.userData.index===index);if(!g)return null;const p=g.position.clone();p.y+=.25;p.project(world.camera);const r=world.host.getBoundingClientRect();return{x:r.left+(p.x+1)/2*r.width,y:r.top+(1-p.y)/2*r.height};}};
  home();
})();
