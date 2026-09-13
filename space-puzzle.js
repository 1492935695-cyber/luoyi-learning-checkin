const levels=[
 {t:[1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1],s:[0,1,2,0,1,2,0,1,2,0,1,2,0,1,2,0]},
 {t:[3,1,2,2,1,3,2,1,1,2,3,1,2,1,3,2],s:[2,0,1,1,0,2,0,1,0,1,2,0,1,0,2,1]},
 {t:[2,3,1,3,2,1,3,2,1,2,1,3,1,3,2,1],s:[1,1,0,2,0,1,1,0,0,2,0,2,1,0,1,0]},
 {t:[1,3,2,1,3,2,2,1,3,2,1,3,3,2,1,2],s:[0,2,1,0,1,0,1,0,2,1,0,2,2,0,1,1]},
 {t:[3,2,3,1,1,2,1,3,2,3,1,2,3,1,2,3],s:[2,1,2,0,0,1,0,2,1,2,0,1,1,0,2,1]},
 {t:[2,1,3,2,3,1,2,3,1,3,2,1,2,1,3,2],s:[0,0,2,1,1,0,1,1,0,2,1,0,1,0,2,0]},
 {t:[3,3,1,2,2,1,3,1,2,1,3,2,1,2,3,1],s:[1,2,0,1,0,0,2,0,1,0,2,1,0,1,1,0]},
 {t:[1,2,1,3,3,2,1,2,3,1,2,3,2,1,3,2],s:[0,1,0,1,2,1,0,0,2,0,1,2,1,0,2,0]},
 {t:[2,3,2,1,3,1,2,1,3,2,3,1,1,2,1,3],s:[1,0,1,0,2,0,0,1,1,1,2,0,0,0,1,2]},
 {t:[3,1,2,3,1,2,3,2,1,3,2,1,2,3,1,2],s:[2,0,1,2,0,1,2,1,0,2,1,0,1,2,0,1]},
 {t:[2,1,3,1,2,3,2,1,3,1,3,2,1,2,3,1],s:[0,1,2,0,1,2,1,0,2,0,2,1,0,1,2,0]},
 {t:[3,2,1,3,2,1,2,3,1,2,1,3,1,3,2,2],s:[1,1,0,2,0,1,1,2,0,1,0,2,0,2,1,1]}
];
let level=0,state=[],history=[],moves=0,start=Date.now(),timer;
const scene=document.querySelector('#scene'),levelsNav=document.querySelector('#levels');
function loadLevel(n){level=n;state=[...levels[n].s];history=[];moves=0;start=Date.now();clearInterval(timer);timer=setInterval(updateTime,1000);render();}
function updateTime(){const s=Math.floor((Date.now()-start)/1000);document.querySelector('#timeText').textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
function render(){const data=levels[level];scene.innerHTML='';const board=document.createElement('div');board.className='board';data.t.forEach((target,i)=>{const cell=document.createElement('div');cell.className='cell';cell.style.setProperty('--h',state[i]);cell.style.setProperty('--color',i%3===0?'#58c4bd':i%3===1?'#f5bb57':'#ef8f70');cell.style.setProperty('--dark',i%3===0?'#278983':i%3===1?'#b47e28':'#b65d48');cell.style.setProperty('--dark2',i%3===0?'#1d6d70':i%3===1?'#8e6023':'#914637');cell.innerHTML=`<div class="target" style="--target:${target}" data-n="${target}"></div><div class="top"></div><div class="front"></div><div class="side"></div>`;cell.addEventListener('click',()=>bump(i));board.appendChild(cell)});scene.appendChild(board);document.querySelector('#levelText').textContent=`${level+1} / ${levels.length}`;document.querySelector('#movesText').textContent=moves;document.querySelector('#undoBtn').disabled=!history.length;document.querySelector('#nextBtn').hidden=!isSolved();document.querySelector('#tipText').textContent=isSolved()?'太棒了！你把空间搭桥完成了。':'点击方块，让每一列的高度和目标点一致。';[...levelsNav.children].forEach((b,i)=>b.className=`level ${i===level?'active ':''}${i<level?'done':''}`)}
function bump(i){if(isSolved())return;history.push([...state]);state[i]=(state[i]+1)%4;moves++;render();if(isSolved())clearInterval(timer)}
function isSolved(){return state.every((v,i)=>v===levels[level].t[i])}
levels.forEach((_,i)=>{const b=document.createElement('button');b.className='level';b.textContent=i+1;b.onclick=()=>loadLevel(i);levelsNav.appendChild(b)});
document.querySelector('#resetBtn').onclick=()=>loadLevel(level);document.querySelector('#undoBtn').onclick=()=>{if(history.length){state=history.pop();moves=Math.max(0,moves-1);render()}};document.querySelector('#nextBtn').onclick=()=>{if(level<levels.length-1)loadLevel(level+1)};document.querySelector('#helpBtn').onclick=()=>document.querySelector('#helpDialog').showModal();document.querySelector('#closeHelp').onclick=()=>document.querySelector('#helpDialog').close();loadLevel(0);
