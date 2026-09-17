// Bounded, cancellable first-load requests for Safari and embedded browsers.
export const LOAD_VERSION='mobile1';
export const MODELS={
 li:{file:'li.glb.gz',bytes:3264427},wang:{file:'wang.glb.gz',bytes:1834292},
 friend:{file:'friend.glb.gz',bytes:3242503},brother:{file:'brother.glb.gz',bytes:3239556}
};
export const abortError=()=>new DOMException('Loading cancelled','AbortError');

export async function loadBytes(url,{signal,onProgress=()=>{},idleMs=12000,totalMs=90000,attempts=2}={}){
 for(let attempt=1;attempt<=attempts;attempt++){
  if(signal?.aborted)throw abortError();
  try{return await new Promise((resolve,reject)=>{
   const xhr=new XMLHttpRequest();let idle,settled=false;
   const finish=(err,value)=>{if(settled)return;settled=true;clearTimeout(idle);signal?.removeEventListener('abort',cancel);err?reject(err):resolve(value);};
   const cancel=()=>{finish(abortError());xhr.abort();};
   const stalled=()=>{finish(new Error('Resource transfer stopped'));xhr.abort();};
   const arm=()=>{clearTimeout(idle);idle=setTimeout(stalled,idleMs);};
   signal?.addEventListener('abort',cancel,{once:true});
   xhr.open('GET',url);xhr.responseType='arraybuffer';xhr.timeout=totalMs;
   xhr.onprogress=e=>{arm();onProgress({loaded:e.loaded,total:e.lengthComputable?e.total:0,attempt});};
   xhr.onload=()=>{if(xhr.status>=200&&xhr.status<300&&xhr.response?.byteLength){onProgress({loaded:xhr.response.byteLength,total:xhr.response.byteLength,attempt});finish(null,xhr.response);}else finish(new Error('Resource HTTP '+xhr.status));};
   xhr.onerror=()=>finish(new Error('Resource network error'));
   xhr.ontimeout=()=>finish(new Error('Resource deadline exceeded'));
   xhr.onabort=()=>finish(abortError());
   onProgress({loaded:0,total:0,attempt});arm();xhr.send();
  });}catch(e){if(signal?.aborted||e.name==='AbortError'||attempt===attempts)throw e;}
 }
}

export function withDeadline(promise,signal,ms=20000){
 return new Promise((resolve,reject)=>{
  let finished=false;
  const done=(e,v)=>{if(finished)return;finished=true;clearTimeout(timer);signal?.removeEventListener('abort',cancel);e?reject(e):resolve(v);};
  const cancel=()=>done(abortError()),timer=setTimeout(()=>done(new Error('Resource decoding timed out')),ms);
  signal?.addEventListener('abort',cancel,{once:true});
  if(signal?.aborted)cancel();
  promise.then(v=>done(null,v),e=>done(e));
 });
}
