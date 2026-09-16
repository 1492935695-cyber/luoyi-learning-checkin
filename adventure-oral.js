/* Microphone access starts only after a click. Clips stay in memory and are never uploaded. */
(() => {
  'use strict';const $=id=>document.getElementById(id);let recorder=null,stream=null,url=null,timer=null,request=0,audio=new Audio(),disposed=true;
  const say=text=>window.AdventureLessons.ruby($('oral-status'),text);
  function stop(){clearTimeout(timer);if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(t=>t.stop());stream=null;$('oral-stop').hidden=true;$('oral-record').disabled=false;}
  function dispose(){disposed=true;request++;stop();audio.pause();audio.removeAttribute('src');if(url)URL.revokeObjectURL(url);url=null;$('oral-play').disabled=true;}
  async function record(){
    disposed=false;const id=++request;if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){say('这台设备暂时不能录音，可以直接读给家人听。');return;}
    $('oral-record').disabled=true;window.speechSynthesis?.cancel();audio.pause();say('请允许麦克风，只在这里回听。');
    try{const tracks=await navigator.mediaDevices.getUserMedia({audio:true});if(id!==request||disposed){tracks.getTracks().forEach(t=>t.stop());return;}stream=tracks;const chunks=[];recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=()=>{if(disposed||id!==request)return;if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));audio.src=url;$('oral-play').disabled=false;window.AdventureReport.event('recording');say('声音留在这里了。可以听听自己。');};recorder.onerror=()=>{stop();say('录音没有成功，可以直接读给家人听。');};recorder.start();$('oral-stop').hidden=false;say('珞伊，慢慢读一句就好。');timer=setTimeout(stop,20000);}catch(_){stop();say('没有打开麦克风。直接读给家人听也可以。');}
  }
  function initialize(){
    $('oral-record').onclick=record;$('oral-stop').onclick=stop;$('oral-play').onclick=()=>{audio.play().catch(()=>say('回听没有开始，可以再点一次。'));};
    $('oral-dialog').addEventListener('close',dispose);document.addEventListener('visibilitychange',()=>{if(document.hidden)dispose();});addEventListener('pagehide',dispose);
    document.querySelectorAll('input[name=oral-observation]').forEach(input=>input.addEventListener('change',()=>{window.AdventureReport.event('oral',input.value);}));
  }
  window.AdventureOral={initialize,dispose,prepare:()=>{disposed=false;say('愿意的话，读一句给朋友听。');document.querySelectorAll('input[name=oral-observation]').forEach(x=>x.checked=false);},inspect:()=>({recording:recorder?.state==='recording',tracks:stream?.getTracks().filter(t=>t.readyState==='live').length||0,hasClip:!!url})};
})();
