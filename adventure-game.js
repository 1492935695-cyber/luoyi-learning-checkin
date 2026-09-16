(() => {
  'use strict';
  const $=id=>document.getElementById(id),{lessons,ruby,syllables}=window.AdventureLessons,KEY='luoyi-adventure-v2';
  const fresh=()=>({version:2,current:'welcome',progress:{},visited:[]});
  function validate(value){
    if(!value||value.version!==2||!lessons.some(l=>l.id===value.current)||!value.progress||typeof value.progress!=='object'||!Array.isArray(value.visited))throw Error('Invalid progress');
    const data=fresh();data.current=value.current;
    if(value.visited.some(id=>!lessons.some(l=>l.id===id)))throw Error('Unknown lesson');data.visited=[...new Set(value.visited)];
    for(const l of lessons){if(!Object.prototype.hasOwnProperty.call(value.progress,l.id))continue;const p=value.progress[l.id],total=l.total||3,supply=l.supply||total;
      for(const [key,max] of [['used',supply],['filled',total]]){if(!Array.isArray(p[key])||p[key].some(i=>!Number.isInteger(i)||i<0||i>=max)||new Set(p[key]).size!==p[key].length)throw Error('Invalid operation');}
      if(typeof p.ready!=='boolean'||typeof p.extra!=='boolean'||p.used.length!==p.filled.length+(p.extra?1:0)||(p.extra&&(l.id!=='lantern'||p.filled.length!==total))||(p.ready&&(p.filled.length!==total||(l.id==='lantern'&&!p.extra))))throw Error('Inconsistent progress');
      data.progress[l.id]={used:[...p.used],filled:[...p.filled],ready:p.ready,extra:p.extra};
    }return data;
  }
  let data;try{const stored=localStorage.getItem(KEY);data=stored?validate(JSON.parse(stored)):fresh();}catch(_){data=fresh();}
  let lesson=lessons.find(l=>l.id===data.current),world,started=false,sound=false,voice=null,offlineReady=false,activeSeconds=0,captionUntil=0,currentSpeech='',wrongTries=0,finished=false;const report=window.AdventureReport;
  document.querySelectorAll('[data-ruby]').forEach(el=>ruby(el,el.textContent.trim()));
  document.querySelectorAll('[title]').forEach(el=>{const label=el.title;el.title=syllables(label).join(' ')+'\n'+label;});
  window.lucide.createIcons();
  function save(){try{localStorage.setItem(KEY,JSON.stringify(data));}catch(_){ruby($('save-warning'),'当前设备暂时不能保存进度。');}}
  function progress(){return data.progress[lesson.id]||(data.progress[lesson.id]={used:[],filled:[],ready:false,extra:false});}
  function updateVoice(){const voices=window.speechSynthesis?.getVoices()||[];voice=voices.find(v=>/^zh[-_]CN$/i.test(v.lang))||voices.find(v=>/^zh/i.test(v.lang))||null;ruby($('voice-note'),voice?'语音使用设备的中文声音，不上传孩子的声音。':'当前未检测到中文语音。拼音仍可用，请家长陪同读一读。');}
  updateVoice();window.speechSynthesis?.addEventListener('voiceschanged',updateVoice);
  function speak(text){if(!sound||!window.speechSynthesis)return;updateVoice();speechSynthesis.cancel();if(!voice)return;const utterance=new SpeechSynthesisUtterance(text);utterance.lang='zh-CN';utterance.voice=voice;utterance.rate=.82;utterance.pitch=1.08;utterance.onerror=()=>ruby($('voice-note'),'语音没有播放，请检查设备声音；拼音仍可用。');speechSynthesis.speak(utterance);}
  const shortIntros={welcome:'珞伊，邀请朋友到荷塘相聚。',campus:'珞伊，找找树、长凳和花坛。',team:'开三朵！两位朋友，加上珞伊。',hops:'圆圈双脚跳，三角单脚跳。'};
  function message(text,spoken=true){currentSpeech=text;ruby($('caption'),text===lesson.intro?shortIntros[lesson.id]:text);captionUntil=performance.now()+11000;if(spoken)speak(text);}
  function soundUI(){const b=$('sound');b.replaceChildren();const i=document.createElement('i');i.dataset.lucide=sound?'volume-2':'volume-x';b.append(i);b.setAttribute('aria-label',sound?'关闭声音':'打开声音');b.title=syllables(b.getAttribute('aria-label')).join(' ')+'\n'+b.getAttribute('aria-label');b.setAttribute('aria-pressed',String(sound));window.lucide.createIcons();}
  function update(){const p=progress();ruby($('chapter'),lesson.subject+' · '+lesson.title);ruby($('objective-text'),p.ready?'小路通了，去前面吧':lesson.goal);$('counter').textContent=lesson.id==='team'?(p.filled.length+1)+' / 3':p.filled.length+' / '+(lesson.total||3);$('drop').hidden=!world?.carry||lesson.kind==='friends';ruby($('act-text'),p.ready?'前进':lesson.kind==='friends'?(world?.carry?'会合':'邀请'):lesson.kind==='explore'?'看看':world?.carry?'放好':'拿起');$('act').hidden=lesson.kind==='jump'&&!p.ready;$('jump-single').hidden=$('jump-double').hidden=lesson.kind!=='jump'||p.ready;ruby($('lesson-source'),lesson.book+'。'+lesson.concept+' '+lesson.after);renderMap();save();}
  function renderMap(){const host=$('chapter-list');host.replaceChildren();for(const l of lessons){const b=document.createElement('button');b.className='chapter-button '+(l.subject==='数学'?'math ':'')+(l.id===lesson.id?'active':'');b.dataset.lesson=l.id;const s=document.createElement('span');s.className='subject';ruby(s,l.subject);const title=document.createElement('strong');ruby(title,l.title);b.append(s,title);if(data.visited.includes(l.id)){const mark=document.createElement('span');mark.className='stamp';ruby(mark,'来过这里');b.append(mark);}b.addEventListener('click',()=>{closeAll();load(l);if(!started)start();});host.append(b);}}
  function load(l){lesson=l;data.current=l.id;finished=false;wrongTries=0;world.load(lesson,progress());world.active=started;update();if(started){report.begin(lesson,progress());message(progress().ready?'珞伊，小路已经通了。':lesson.intro);}}
  function open(id){world.setPaused(true);window.speechSynthesis?.cancel();$(id).showModal();}
  function closeAll(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());world?.setPaused(false);}
  function start(){started=true;sound=true;soundUI();$('start-screen').hidden=true;$('game').classList.remove('is-start');world.active=true;report.begin(lesson,progress());message(progress().ready?'珞伊，小路已经通了。':lesson.intro);$('scene').focus({preventScroll:true});}
  function ready(){const p=progress();if(p.ready)return;p.ready=true;world.openGate();update();message(lesson.finish+' 小路通啦！');}
  function finish(){if(finished||!progress().ready)return;finished=true;report.event('complete');if(!data.visited.includes(lesson.id))data.visited.push(lesson.id);save();ruby($('finish-note'),lesson.finish);$('oral-open').hidden=lesson.id!=='welcome';open('finish-dialog');speak('珞伊，小路通啦。'+lesson.finish);}
  function interact(target){
    const p=progress();
    if(target.kind==='exit'){if(p.ready)finish();else message('先让小路通起来吧。');return;}
    if(p.ready){message('珞伊，去前面的门吧。');return;}
    if(target.kind==='item'){
      if(target.used)return;
      if(lesson.kind==='explore'){target.used=true;p.used.push(target.index);p.filled.push(target.index);world.items[target.index].userData.used=true;report.event('step',target.index);message(lesson.lines[target.index]);update();if(p.filled.length===3)ready();return;}
      if(world.carry){message(lesson.kind==='friends'?'先和这位朋友走到花圈吧。':'先把手里的放好吧。');return;}
      if(lesson.kind==='pronouns'&&target.index!==p.filled.length){message(['先带我字去照镜子。','带你字去面对朋友。','带他字去看看另一位朋友。'][p.filled.length]);return;}
      if(world.take(target.index)){
        const word=target.word;
        if(lesson.kind==='friends')message(lesson.id==='welcome'?'我是中国人。我们一起去荷塘吧。':'邀请到朋友了，一起去花圈吧。');
        else if(word){message({'天':'天，天空的天。','地':'地，大地的地。','人':'人，人物的人。','我':'我，是说话的自己。','你':'你，是我面对的朋友。','他':'他，是我说到的另一位男孩。'}[word]);}
        else message(lesson.object==='stone'?'搬起来了，送到河边吧。':lesson.object==='flower'?'带着荷花，去找空花盆。':'带着灯，去找空灯台。');
        update();
      }return;
    }
    if(target.kind==='basket'){
      if(lesson.id!=='lantern'||p.filled.length!==4){message('先让每座灯台都亮起来。');return;}
      if(!world.carry){message('还有一盏灯，在地上等你。');return;}
      p.used.push(world.carry.userData.index);world.carry.userData.used=true;world.carry.visible=false;world.carry=null;p.extra=true;world.lantern(world.basket,0,.72,0,.72);ready();return;
    }
    if(target.kind==='socket'){
      if(target.filled){message('这里已经放好了。');return;}
      if(!world.carry){message(lesson.kind==='friends'?'去邀请一位朋友吧。':lesson.kind==='count'?'先去拿一件，再送过来。':'先带上一个汉字吧。');return;}
      const item=world.carry.userData;
      if(target.word&&item.word!==target.word){wrongTries++;message({'天':'天在头顶，云下有它的位置。','地':'地在脚下，花田在等它。','人':'人就是人物，去看看朋友。','我':'我说自己，镜子里就是我。','你':'你是我正面对的这位朋友。','他':'他在另一边，我和朋友正说起他。'}[item.word]);if(wrongTries>=2)world.highlight(world.sockets.findIndex(s=>s.userData.word===item.word));return;}
      p.used.push(item.index);p.filled.push(target.index);world.put(target.index,p.filled.length);report.event('step',target.index);wrongTries=0;update();
      if(p.filled.length===(lesson.total||3)){
        if(lesson.id==='lantern'){message('四座都亮了。把剩下的一盏带回篮子。');ruby($('objective-text'),'把剩下的一盏带回篮子');}
        else ready();
      }else if(lesson.kind==='friends')message(lesson.id==='welcome'?lesson.lines[p.filled.length-1]: '珞伊和一位朋友，现在是两个人。');
      else if(lesson.kind==='pronouns')message(p.filled.length===1?'我叫珞伊。现在，对着朋友说：你好！':'你是我的朋友。他，是另一边的男孩。');
      else if(item.word)message(item.word+'，找到它的位置了。');
      else message(['','一','二','三','四','五'][p.filled.length]+(lesson.object==='flower'?'朵花开了。':lesson.object==='stone'?'块石头铺好了。':'盏灯亮了。'));
    }
  }
  try{world=new AdventureWorld($('scene'),$('world-labels'),{interact,message,error:()=>{$('error').hidden=false;},hopped:index=>{const p=progress();if(p.filled.includes(index))return;p.used.push(index);p.filled.push(index);report.event('step',index);update();if(p.filled.length===6)ready();},tick:dt=>{activeSeconds+=dt;report.tick(dt);if(captionUntil&&performance.now()>captionUntil){$('caption').replaceChildren();captionUntil=0;}if(activeSeconds>=480){activeSeconds=0;open('rest-dialog');}}});load(lesson);}catch(error){console.error(error);$('error').hidden=false;}
  if(!world)return;
  $('start').onclick=start;$('retry').onclick=()=>location.reload();$('map-open').onclick=()=>{renderMap();open('map-dialog');};$('parent-open').onclick=()=>{updateVoice();open('parent-dialog');};$('pause').onclick=()=>open('rest-dialog');$('rest-continue').onclick=()=>{activeSeconds=0;closeAll();};
  $('sound').onclick=()=>{sound=!sound;soundUI();if(sound)speak(currentSpeech||lesson.intro);else window.speechSynthesis?.cancel();};$('listen').onclick=()=>{sound=true;soundUI();message(currentSpeech||lesson.intro);};$('drop').onclick=()=>{world.drop();update();message('放回原处了，可以慢慢来。');};$('act').onclick=()=>{if(progress().ready)world.navigate(0,-5.15,world.exit);else world.interactNearest();};
  function jump(type){if(world.paused||world.jumpMove||!world.active||progress().ready)return;report.event('jump');if(!world.jump(type,progress().filled.length))report.event('mismatch');}
  $('jump-single').onclick=()=>jump('single');$('jump-double').onclick=()=>jump('double');$('listen').addEventListener('click',()=>report.event('cue'));
  $('report-open').onclick=()=>{closeAll();report.render($('report-body'),ruby);$('report-text').value=report.text($('parent-observation').value);open('report-dialog');};
  $('report-copy').onclick=async()=>{$('report-text').value=report.text($('parent-observation').value);$('report-text').select();try{await navigator.clipboard.writeText($('report-text').value);ruby($('report-note'),'报告已复制，可以发给家长或老师。');}catch(_){ruby($('report-note'),'报告已显示，长按文字可以复制。');}};
  $('report-print').onclick=()=>{report.render($('report-body'),ruby);if($('parent-observation').value.trim()){const p=document.createElement('p');ruby(p,'家长补充观察：'+$('parent-observation').value.trim());$('report-body').append(p);}window.print();};
  let oralLine=0;window.AdventureOral.initialize();$('oral-open').onclick=()=>{closeAll();oralLine=0;window.AdventureOral.prepare();open('oral-dialog');};$('oral-done').onclick=()=>{closeAll();open('finish-dialog');};$('oral-listen').onclick=()=>{sound=true;soundUI();report.event('cue');speak(lessons[0].lines[oralLine%3]);oralLine++;};
  $('finish-rest').onclick=()=>{closeAll();open('rest-dialog');};$('finish-next').onclick=()=>{const next=lessons[(lessons.indexOf(lesson)+1)%lessons.length];closeAll();load(next);};
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeAll);document.querySelectorAll('dialog').forEach(d=>d.addEventListener('cancel',()=>{world.setPaused(false);}));
  $('replay').onclick=()=>{delete data.progress[lesson.id];closeAll();load(lesson);};
  $('export').onclick=async()=>{$('progress').value=JSON.stringify(data);$('progress').select();try{await navigator.clipboard.writeText($('progress').value);ruby($('import-note'),'进度已复制。');}catch(_){ruby($('import-note'),'进度已显示，长按文字可以复制。');}};
  $('import').onclick=()=>{try{const next=validate(JSON.parse($('progress').value));data=next;load(lessons.find(l=>l.id===data.current));world.setPaused(true);ruby($('import-note'),'进度已导入。');}catch(_){ruby($('import-note'),'这段进度无法导入，原记录已保留。');}};
  const stick=$('stick'),knob=$('stick-knob');let stickId=null;
  function stickMove(e){if(e.pointerId!==stickId)return;const r=stick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dz=e.clientY-r.top-r.height/2,len=Math.hypot(dx,dz),radius=r.width*.29,f=len>radius?radius/len:1;world.axis.x=dx*f/radius;world.axis.z=dz*f/radius;knob.style.transform=`translate(${dx*f}px,${dz*f}px)`;}
  function resetStick(){stickId=null;world.axis={x:0,z:0};knob.style.transform='';}
  stick.addEventListener('pointerdown',e=>{if(!started||world.paused)return;stickId=e.pointerId;stick.setPointerCapture(e.pointerId);stickMove(e);});stick.addEventListener('pointermove',stickMove);stick.addEventListener('pointerup',resetStick);stick.addEventListener('pointercancel',resetStick);stick.addEventListener('lostpointercapture',resetStick);
  document.addEventListener('visibilitychange',()=>{resetStick();world.clearInput();if(document.hidden){world.setPaused(true);window.speechSynthesis?.cancel();}else if(started&&!document.querySelector('dialog[open]'))open('rest-dialog');});
  ruby($('offline-note'),'正在准备离线资源，首次打开需要联网。');
  if('serviceWorker'in navigator){navigator.serviceWorker.register('./service-worker.js').then(()=>navigator.serviceWorker.ready).then(async()=>{const key=(await caches.keys()).find(k=>k.includes('adventure-20260916b'));if(key){offlineReady=true;ruby($('offline-note'),'离线资源已备好。清理缓存后需要重新联网。');}else ruby($('offline-note'),'新版本正在缓存，重新打开后可再检查。');}).catch(()=>ruby($('offline-note'),'当前未备好离线资源，请联网使用。'));}
  window.luoyiAdventure={inspect:()=>({lesson:lesson.id,started,sound,hasChineseVoice:!!voice,offlineReady,activeSeconds,data:JSON.parse(JSON.stringify(data)),observations:report.inspect(),world:world.inspect(),oral:window.AdventureOral.inspect()}),project:(kind,index=0)=>world.project(kind,index)};
})();
