import {PILOTS,PEOPLE,PILOT_VERSION,EXTRA_SPEECH} from './pilot-data.js?v=discovery1';
import {PilotWorld} from './pilot-world.js?v=discovery1';
const $=id=>document.getElementById(id),audio=$('voice'),KEY='luoyi-pilots-v1',py={天:'tiān',地:'dì',人:'rén',我:'wǒ',你:'nǐ',他:'tā'};
const responses=Object.fromEntries(EXTRA_SPEECH.map(x=>[x.id,x])),findWords=['天','地','人','我','你','他'],readWords=['天','地','人','你','我','他'];
const blank=()=>({version:1,...Object.fromEntries(Object.keys(PILOTS).map(k=>[k,{index:0,done:false,events:[]}])),oral:'未观察',note:''});
let save;try{const d=JSON.parse(localStorage.getItem(KEY));if(d.version!==1||!['math','chinese'].every(k=>Number.isInteger(d[k]?.index)&&d[k].index>=0&&d[k].index<PILOTS[k].beats.length&&Array.isArray(d[k].events)&&d[k].events.length<=1500))throw Error();d.math_bonus||={index:0,done:false,events:[]};save=d;}catch{save=blank();}
if(save.contentVersion!==PILOT_VERSION){for(const s of ['math','chinese']){const oldId=(s==='math'?'m':'c')+String(save[s].index+1).padStart(2,'0');const found=PILOTS[s].beats.findIndex(b=>b.id===oldId);save[s].index=Math.max(0,found);}save.contentVersion=PILOT_VERSION;}
let world,manifest,ep,index=0,phase='home',task,step=0,token=0,locked=false,paused=false,cue=null,resolveAudio,afterRetry,loadingSubject,noticeTimer,pendingAdvance=false;
function persist(){try{localStorage.setItem(KEY,JSON.stringify(save));}catch{notice('浏览器未能保存，请在家长手记保存报告。');}}
function event(kind,more={}){if(!ep)return;save[ep.id].events.push({time:new Date().toISOString(),version:PILOT_VERSION,beat:ep.beats[index]?.id,kind,...more});save[ep.id].events=save[ep.id].events.slice(-1500);persist();}
function notice(s){$('notice').textContent=s;$('notice').classList.add('show');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').classList.remove('show'),2200);}
function stopAudio(){audio.pause();resolveAudio?.(false);resolveAudio=null;afterRetry=null;cue=null;$('audio-retry').hidden=true;if(world){world.speaker=null;world.level=0;}}
function play(id){stopAudio();const c=manifest.lines[id];if(!c){notice('这一句声音还没准备好，请稍后重试。');return Promise.resolve(false);}cue=c;audio.src='assets/pilot/'+c.file+'?v='+PILOT_VERSION;world.speaker=c.who;world.level=0;return new Promise(resolve=>{resolveAudio=resolve;audio.onended=()=>{world.level=0;world.speaker=null;resolveAudio=null;resolve(true);};audio.onerror=()=>{$('audio-retry').textContent='声音没加载好，点一下重试';$('audio-retry').hidden=false;afterRetry=()=>{audio.load();return audio.play();};};afterRetry=()=>audio.play();audio.play().then(()=>{$('audio-retry').hidden=true;}).catch(()=>{$('audio-retry').textContent='点一下，听朋友说话';$('audio-retry').hidden=false;});});}
$('audio-retry').onclick=async()=>{try{await afterRetry?.();$('audio-retry').hidden=true;}catch{notice('请检查网络后再试一下。');}};
function ensureWorld(){if(world)return;world=new PilotWorld($('world'),pick);world.onFrame=()=>{if(cue&&!audio.paused&&audio.currentTime>=cue.introDuration){const n=Math.floor(audio.currentTime/.04);world.level=cue.envelope[n]||0;}else world.level=0;$('help').disabled=paused||locked;$('listen').disabled=paused||(locked&&!['talk','feedback'].includes(phase));};}
function lessonText(e){return e.bonus?'自愿益智彩蛋｜公平分与分组 · 非本课要求':`${e.subject}｜${e.lesson} · 第${e.pages}页${e.id==='math'?'选练':''}`;}
async function start(subject){const mine=++token;pendingAdvance=false;loadingSubject=subject;phase='loading';$('loading').hidden=false;$('loading-message').textContent='朋友正在走进画面…';$('retry-load').hidden=true;$('home').hidden=true;if($('finish').open)$('finish').close();try{ensureWorld();world.active=true;world.paused=false;await Promise.all([world.load(PILOTS[subject]),manifest?Promise.resolve():fetch('assets/pilot/voices.json?v='+PILOT_VERSION).then(r=>{if(!r.ok)throw Error('voices');return r.json();}).then(d=>manifest=d)]);if(mine!==token)return;ep=PILOTS[subject];index=save[subject].done?0:save[subject].index;world.build(ep);$('loading').hidden=true;$('hud').hidden=false;$('pause').hidden=false;$('lesson').textContent=lessonText(ep);event('进入故事');show();}catch(e){console.error(e);if(mine!==token)return;$('loading-message').textContent='画面还没加载好，联网后再试一下。';$('retry-load').hidden=false;}}
function ruby(el,text,phonetic){el.replaceChildren();const r=document.createElement('ruby');r.append(document.createTextNode(text));const rt=document.createElement('rt');rt.textContent=phonetic;r.append(rt);el.append(r);}
async function waitActive(ms,mine=token){while(ms>0&&mine===token){await new Promise(r=>setTimeout(r,80));if(!paused)ms-=80;}}
function hideFeedback(){$('feedback').hidden=true;$('pilot-app').classList.remove('has-feedback');}
async function respond(id,mine=token){const r=responses[id];if(!r)return;phase='feedback';$('feedback').hidden=false;$('pilot-app').classList.add('has-feedback');$('feedback-speaker').textContent=PEOPLE[r.who].name+'说';$('feedback-title').textContent=r.heading||'珞伊，看看这里';ruby($('feedback-learning'),r.learn||'',r.py||'');$('feedback-text').textContent=r.text;$('feedback-quantity').hidden=!r.count;$('feedback-number').textContent=r.count||'';$('feedback-dots').replaceChildren();for(let i=0;i<(r.count||0);i++){const dot=document.createElement('i');$('feedback-dots').append(dot);}if(/^(good-|count-|return-)/.test(id))world.celebrate();const ok=await play(id);if(mine!==token||!ok)return;await waitActive(520,mine);if(mine===token)hideFeedback();}
function instructions(b){$('instruction').hidden=!b;$('help').hidden=!b;$('pilot-app').dataset.kind=b?.kind||'';$('pilot-app').classList.toggle('task',!!b);if(!b){$('letter').hidden=true;return;}const r=$('instruction-ruby');r.querySelector('span').textContent=b.kind==='pronoun'?'点收信的人':b.kind==='receive'?'点一下，收好信':b.title;r.querySelector('rt').textContent=b.kind==='pronoun'?'diǎn shōu xìn de rén':b.kind==='receive'?'diǎn yí xià shōu hǎo xìn':b.py;const word=b.kind==='mail'?b.goal[step]:['pronoun','receive'].includes(b.kind)?b.title:null;$('letter').hidden=!word;if(word)ruby($('letter'),word,py[word]);}
async function show(){const mine=++token;stopAudio();hideFeedback();paused=false;world.paused=false;locked=true;task=null;step=0;const b=ep.beats[index];save[ep.id].index=index;persist();phase='talk';$('lesson').textContent=b.lesson||lessonText(ep);$('progress').textContent=`${index+1} / ${ep.beats.length}`;$('speaker').textContent=PEOPLE[b.who].name+'说';$('dialogue').textContent=b.text;instructions(null);world.beat(b);
 if(b.kind){task=b;world.setup(b);instructions(b);$('pilot-app').classList.remove('task');}
 const ok=await play(b.id);if(mine!==token||!ok)return;
 if(b.kind){phase='task';locked=false;$('pilot-app').classList.add('task');if(['seals','clue'].includes(b.kind))await sealPrompt(mine);}else{await new Promise(r=>setTimeout(r,240));if(mine===token&&!paused)next();}
}
async function sealPrompt(mine=token){locked=true;const target=task.goal[step];await play(task.kind==='clue'?'clue-'+step:'find-'+findWords.indexOf(target));if(mine===token)locked=false;}
function next(){if(paused){pendingAdvance=true;return;}pendingAdvance=false;if(index+1>=ep.beats.length){completeEpisode();return;}index++;show();}
function countedTask(){return ['load','return','add'].includes(task?.kind);}
async function pick(id){if(phase!=='task'||paused||locked||!task)return;locked=true;const mine=token,b=task;let correct=false;
 if(['pack','share'].includes(b.kind)){
  if(id!=='bell'){
   const moved=b.kind==='pack'?await world.toggleLamp(id):await world.shareCake(id);if(mine!==token)return;
   if(moved){event(b.kind==='pack'?'调整装灯':'调整分点心',{target:id,count:b.kind==='pack'?world.packed.size:[...world.plateCounts]});}
   if(b.kind==='pack'&&moved){const n=world.packed.size;await respond(moved==='remove'?'pack-remove':'count-'+n,mine);}
   if(mine===token){phase='task';locked=false;}return;
  }
  const enough=b.kind==='pack'?world.packed.size===b.goal:world.plateCounts.every(n=>n===2);
  if(!enough){event('需再试',{target:id,count:b.kind==='pack'?world.packed.size:[...world.plateCounts]});await respond(b.kind==='pack'?(world.packed.size<3?'pack-less':'pack-more'):(world.plateCounts.reduce((a,n)=>a+n,0)<4?'share-leftover':'share-unequal'),mine);if(mine===token){phase='task';locked=false;}return;}
  event('操作',{target:id});if(b.kind==='pack')world.finishPack();await respond(b.kind==='pack'?'good-load':'good-share',mine);if(mine!==token)return;event('完成互动',{stage:'independent',kindOfTask:b.kind});phase='transition';next();return;
 }
 if(['supply','hidden','boxes'].includes(b.kind)){
  const n=Number(id.split('-')[1]),goal=b.kind==='supply'?1:b.goal;correct=n===goal;event(correct?'操作':'需再试',{target:id,step});
  if(b.kind==='supply')await world.deliverSupply(n);else if(b.kind==='hidden'){if(!correct)event('观看验证',{reason:'打开遮挡'});await world.revealHidden();}else await world.fillBoxes(n);
  if(mine!==token)return;
  const speech=b.kind==='supply'?(correct?'good-add'+b.goal:'supply-more'):b.kind==='hidden'?(correct?'good-hidden':n<goal?'hidden-less':'hidden-more'):(correct?'good-boxes':n<goal?'boxes-less':'boxes-more');
  await respond(speech,mine);if(mine!==token)return;
  if(!correct){world.setup(b);phase='task';locked=false;return;}
  event('完成互动',{stage:b.stage,kindOfTask:b.kind});phase='transition';next();return;
 }
 if(countedTask())correct=id.startsWith('lamp-');else if(b.kind==='bridge')correct=id==='bundle-'+b.goal;else if(['mail','seals','clue'].includes(b.kind))correct=id===b.goal[step];else if(b.kind==='pronoun')correct=id===b.goal;else if(b.kind==='receive')correct=id==='letter';
 event(correct?'操作':'需再试',{target:id,step});
 if(!correct){
  if(b.kind==='bridge'){const n=Number(id.split('-')[1]);await world.fillBridge(n);if(mine!==token)return;await respond(n<b.goal?'retry-bridge-less':'retry-bridge-more',mine);if(mine!==token)return;world.setup(b);}
  else {world.hint();await play(b.kind==='mail'?'hint-mail':b.kind==='clue'?'clue-'+step:b.kind==='seals'?'find-'+findWords.indexOf(b.goal[step]):'hint-pronoun');}
  if(mine===token){phase='task';locked=false;}return;
 }
 if(countedTask()){
  step++;const n=b.kind==='add'?b.goal:step;await world.collect(id,n,b.goal);if(mine!==token)return;const goal=b.kind==='add'?1:b.goal;
  const speech=b.kind==='return'?'return-'+step:b.kind==='add'?'good-add'+n:step===goal?'good-load':'count-'+n;
  await respond(speech,mine);if(mine!==token)return;
  if(step<goal){phase='task';locked=false;return;}world.tidyLamps();
 }
 else if(b.kind==='bridge'){await world.fillBridge();if(mine!==token)return;await respond('good-bridge',mine);}
 else if(['mail','seals','clue'].includes(b.kind)){const found=b.goal[step];await world.reward(id);if(mine!==token)return;await respond(b.kind==='clue'?'good-clue-'+step:'good-word-'+readWords.indexOf(found),mine);step++;if(mine!==token)return;if(step<b.goal.length){world.setup(b,step);instructions(b);phase='task';if(['seals','clue'].includes(b.kind))await sealPrompt(mine);else locked=false;return;}}
 else{await world.reward(id);if(mine!==token)return;await respond({c08:'good-friend',c09:'good-brother',c11:'good-receive',c12:'good-he'}[b.id],mine);}
 if(mine!==token)return;event('完成互动',{stage:b.stage,kindOfTask:b.kind});phase='transition';await new Promise(r=>setTimeout(r,400));if(mine===token)next();
}
async function help(){if(phase!=='task'||paused||locked)return;const mine=token;locked=true;event('使用提示');world.hint();let id=['pack','supply','hidden','share','boxes','clue'].includes(task.kind)?'hint-'+task.kind:task.kind==='bridge'?'hint-bridge':task.kind==='mail'?'hint-mail':task.kind==='seals'?'find-'+findWords.indexOf(task.goal[step]):['pronoun','receive'].includes(task.kind)?'hint-pronoun':task.kind==='return'?'hint-return':task.kind==='add'?'hint-add':'hint-load';await play(id);if(mine===token)locked=false;}
function pause(){if(!ep||phase==='home'||phase==='loading'||paused)return;paused=true;world.paused=true;audio.pause();$('rest').showModal();}
function resume(){paused=false;world.paused=false;$('rest').close();if(pendingAdvance){next();return;}if(cue&&audio.currentTime<audio.duration-.08){audio.play().catch(()=>{$('audio-retry').hidden=false;});}else if(phase==='talk'){next();}}
function home(){++token;stopAudio();hideFeedback();task=null;phase='home';paused=false;locked=false;if(world){world.paused=true;world.active=false;}$('home').hidden=false;$('hud').hidden=true;$('loading').hidden=true;$('pause').hidden=true;$('lesson').textContent='选择今天的故事';$('pilot-app').classList.remove('task');for(const id of ['rest','finish'])if($(id).open)$(id).close();}
async function completeEpisode(){phase='finish';task=null;instructions(null);save[ep.id].done=true;event('完成故事');$('finish-title').textContent=ep.id==='math'?'珞伊，小灯车出发啦！':ep.bonus?'珞伊，点心准备好啦！':'珞伊，信都送到啦！';$('finish-text').textContent=ep.oral;$('finish-bonus').hidden=ep.id!=='math';$('finish-words').hidden=ep.id!=='chinese';$('finish-words').replaceChildren();if(ep.id==='chinese')for(const w of readWords){const item=document.createElement('span');ruby(item,w,py[w]);$('finish-words').append(item);}$('finish').showModal();await play('done-'+ep.id);}
function makeReport(){
 const lines=['珞伊的故事手记',new Date().toLocaleDateString('zh-CN'),''];
 const names={c08:'“我”指正在说话的朋友',c09:'换人说话后，“我”指哥哥',c11:'接收说给珞伊的“你”',c12:'“他”指第三个人',c15:'六字听音找字（带拼音）',c15b:'结合两条生活线索送信（不等于识字）',m04:'自己装灯并决定何时够三盏',m06:'灯换位置，数量不变',m09:'从两组中选择3到4需要补的灯',m11:'从两组中选择4到5需要补的灯',m14:'为四个灯座配灯',m14b:'由总数5和看见3推想隐藏部分',b02:'把4块分给两位伙伴且一样多',b04:'4块按每盒2块选择盒子数'};
 for(const s of ['chinese','math','math_bonus']){
  const e=PILOTS[s],d=save[s];lines.push(`${e.subject}｜${e.title}`,e.bonus?'自愿拓展：公平分与等量分组，不是本课达标要求':`教材：${e.lesson} 第${e.pages}页${s==='math'?'选练':''}`,`故事状态：${d.done?'已看完（可重新体验）':d.events.length?'进行中':'尚未开始'}`);
  for(const b of e.beats.filter(b=>b.kind)){
   const es=d.events.filter(x=>x.beat===b.id),completed=es.filter(x=>x.kind==='完成互动'),done=completed.length>0,help=es.filter(x=>x.kind==='使用提示').length,wrong=es.filter(x=>x.kind==='需再试').length,replay=es.filter(x=>x.kind==='重听要求').length;
   let state='未完成';const guided=b.stage==='guided'||['load','return','add'].includes(b.kind);
   if(done)state=help||wrong?'经提示或重试后完成':guided?'跟随情境引导完成':s==='chinese'?'无额外提示完成（有拼音支持）':'无额外提示选对';
   if(b.id==='c15'&&done&&!completed.some(x=>['pilot-20260917-feedback2',PILOT_VERSION].includes(x.version)))state='上版完成记录；本版六字任务尚未完整观察';
   if(['m04','m09','m11','c04'].includes(b.id)&&done&&!completed.some(x=>x.version===PILOT_VERSION))state='旧版完成记录；本版新操作待观察';
   if(es.some(x=>x.kind==='观看验证')&&done)state='看过揭晓或提示后完成';
   lines.push(`• ${names[b.id]||b.title}：${state}${help||wrong?`；提示${help}次，再试${wrong}次（保留历次记录）`:''}${replay?`；重听${replay}次`:''}`);
  }
  lines.push('覆盖边界：'+e.coverage,'');
 }
 lines.push('语文朗读：'+save.oral,'家长观察：'+(save.note||'未填写'),'','下一次只观察一件事：');
 if(save.math.events.some(x=>x.beat==='m14'&&x.kind==='需再试'))lines.push('用四个杯垫配小物品，让珞伊自己试着一一对应，说说有没有多或少。');
 else if(save.chinese.events.some(x=>x.kind==='完成互动'))lines.push('从六字里挑两个，遮住拼音，请珞伊自愿读给家人听；未读出时再一起读，不追加刷关。');
 else lines.push('先选一集，留意珞伊自己作了什么决定，不急着下学习能力结论。');
 lines.push('','重听是正常的学习支持，不据此判断会不会。','这些记录反映游戏中的表现，不等同于整课掌握、考试成绩或专注力测评。','记录只在当前浏览器；老师和 Codex 不会自动收到。');return lines.join('\n');
}
function openReport(){if(phase!=='home'&&phase!=='finish'&&!paused)pause();$('observation').value=save.note;$('oral').value=save.oral;$('report').textContent=makeReport();$('parents').showModal();}
function saveObservation(){save.note=$('observation').value;save.oral=$('oral').value;persist();$('report').textContent=makeReport();}
document.querySelectorAll('[data-subject]').forEach(b=>b.onclick=()=>start(b.dataset.subject));$('pause').onclick=pause;$('resume').onclick=resume;$('back').onclick=home;$('loading-home').onclick=home;$('retry-load').onclick=()=>start(loadingSubject);$('finish-home').onclick=home;$('finish-bonus').onclick=()=>start('math_bonus');$('parent').onclick=openReport;$('finish-report').onclick=openReport;$('close-report').onclick=()=>{$('parents').close();};$('help').onclick=help;
$('listen').onclick=async()=>{if(paused||!ep)return;if(['talk','feedback'].includes(phase)&&cue){audio.currentTime=0;audio.play().catch(()=>{$('audio-retry').hidden=false;});return;}if(locked)return;const mine=token;locked=true;if(task)event('重听要求');await play(task?.kind==='clue'?'clue-'+step:task?.kind==='seals'?'find-'+findWords.indexOf(task.goal[step]):task?.id||ep.beats[index].id);if(mine===token)locked=false;};
$('observation').onchange=saveObservation;$('oral').onchange=saveObservation;$('download').onclick=()=>{saveObservation();const blob=new Blob([makeReport()],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='珞伊的故事手记.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);$('report-status').textContent='报告已生成，可由家长发给老师或上传到对话。';};$('copy').onclick=async()=>{saveObservation();try{await navigator.clipboard.writeText(makeReport());$('report-status').textContent='已复制。';}catch{$('report-status').textContent='此浏览器未允许复制，请点“保存报告”。';}};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&['talk','task','feedback','transition'].includes(phase))pause();});$('rest').addEventListener('cancel',e=>{e.preventDefault();resume();});
window.pilotInspect=()=>({version:PILOT_VERSION,subject:ep?.id,index,phase,paused,locked,step,task:task&&{id:task.id,kind:task.kind,goal:task.goal},packed:world?.packed&&[...world.packed],plates:world?.plateCounts,audio:{id:cue?.file,who:cue?.who,voice:cue?.voice,text:cue?.text,intro:cue?.introDuration,time:audio.currentTime,duration:audio.duration,paused:audio.paused},feedback:{visible:!$('feedback').hidden,text:$('feedback-text').textContent,count:$('feedback-number').textContent},guidance:{markers:world?.guides.filter(g=>g.g.visible).length,sockets:world?.sockets?.length},positions:world?.positions(),speaker:world?.speaker,level:world?.level,mouths:world&&Object.fromEntries([...world.actors].map(([k,a])=>[k,Math.max(0,...a.morphs.map(m=>m.morphTargetInfluences[m.morphTargetDictionary.speak]||0))])),events:ep&&save[ep.id].events,report:makeReport()});window.cinemaReady=true;
if(navigator.serviceWorker?.controller)navigator.serviceWorker.getRegistration().then(r=>r?.update()).catch(()=>{});
