/* Local-only observations, not grades, diagnoses, or mastery claims. */
(() => {
  'use strict';const KEY='luoyi-learning-observations-v1';let records=[],active=null,unsaved=0,storageOkay=true;
  try{const parsed=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(parsed))records=parsed.filter(r=>r&&typeof r.id==='string'&&typeof r.title==='string'&&Number.isFinite(r.seconds)&&r.seconds>=0&&r.seconds<86400&&Array.isArray(r.steps)&&r.steps.every(Number.isInteger)&&Number.isFinite(r.cues)&&Number.isFinite(r.mismatches)&&Number.isFinite(r.jumpAttempts)&&typeof r.complete==='boolean').slice(-60);}catch(_){}
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(records));unsaved=0;}catch(_){storageOkay=false;}}
  function begin(lesson,progress){persist();active={id:lesson.id,title:lesson.title,book:lesson.book,kind:lesson.kind,at:new Date().toISOString(),seconds:0,steps:[],baseline:progress.filled.length,total:lesson.total,cues:0,mismatches:0,jumpAttempts:0,complete:false,oral:'not-observed',recordings:0};records.push(active);records=records.slice(-60);persist();}
  function event(type,index){if(!active)return;if(type==='step'&&!active.steps.includes(index))active.steps.push(index);if(type==='cue')active.cues++;if(type==='mismatch')active.mismatches++;if(type==='jump')active.jumpAttempts++;if(type==='complete')active.complete=true;if(type==='recording')active.recordings=(active.recordings||0)+1;if(type==='oral'&&['independent','supported','not-observed'].includes(index))active.oral=index;persist();}
  function tick(dt){if(!active)return;active.seconds+=dt;unsaved+=dt;if(unsaved>=5)persist();}
  function lines(){const result=['珞伊的学习过程报告','记录来源：当前浏览器的游戏操作。本报告不是考试成绩、能力诊断或教师评价。','学校当天进度、是否有人协助、口头表达：系统无法自动判断。'];const recent=records.filter(r=>r.seconds>1||r.steps.length).slice(-8);if(!recent.length)result.push('暂时没有足够的游戏记录。');
    for(const r of recent){const date=new Date(r.at),when=Number.isNaN(date.getTime())?'日期未记录':date.toLocaleString('zh-CN',{hour12:false});result.push(`${when} · ${r.title}`,`教材对应：${r.book||'开篇活动'}。`,`活动时间约${Math.max(1,Math.round(r.seconds/60))}分钟；本次新增操作${r.steps.length}步；${r.complete?'已走到终点':'本次未记录走到终点'}。`,`主动重听${r.cues}次。计时不含暂停和离开页面的时间。`);
      if(r.kind==='jump')result.push(`尝试跳跃${r.jumpAttempts}次，其中动作与目标形状暂不匹配${r.mismatches}次。记录包括误触，不能直接判为不理解。`);
      if(r.id==='welcome'){result.push('可观察：参与了结伴与原句听读。系统不分析录音，不判断朗读准确性、背诵或独立识字。');result.push('家长手动观察：'+({independent:'自己读了一句。',supported:'跟读了一句。','not-observed':'暂未观察。'}[r.oral]||'暂未观察。'));if(r.recordings)result.push(`临时录音${r.recordings}次，仅说明使用过回听，不表示读正确了。`);}
      if(r.id==='team')result.push('可观察：邀请伙伴组成三人队。是否理解要把自己算进去，仍需生活中确认。');if(r.id==='campus')result.push('可观察：在场景中寻找事物。是否能独立描述位置，仍需听孩子实际表达。');
      result.push('下一步只做一个小观察：'+({welcome:'请她自愿说一句游戏里听到的话。',campus:'在身边找一样东西，说说它在哪里。',team:'和家人组成三人队，看是否把自己也数进去。',hops:'安全平地上看形状做一次动作，不计时。'}[r.id]||'结合真实课堂反馈。'));
    }result.push('帮助者、设备声音及操作熟练度均可能影响结果；没有比较其他孩子，没有排名。','数据只存本设备，不自动传给老师或人工智能。分享前请家长检查内容。');if(!storageOkay)result.push('当前浏览器不能可靠保存记录，请先复制报告。');return result;
  }
  function render(host,ruby){persist();host.replaceChildren();for(const text of lines()){const p=document.createElement('p');ruby(p,text);host.append(p);}}
  function text(observation=''){return lines().join('\n\n')+(observation.trim()?'\n\n家长补充观察（非系统判定）：\n'+observation.trim():'');}
  addEventListener('pagehide',persist);document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();});window.AdventureReport={begin,event,tick,persist,render,text,inspect:()=>JSON.parse(JSON.stringify(records))};
})();
