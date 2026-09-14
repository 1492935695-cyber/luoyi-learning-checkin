/* Pure puzzle rules, shared by the game, hint worker and validation. */
(function (root) {
  'use strict';
  const chapters = [
    { name: '青草森林', subtitle: '观察与找路', color: '#36856b', ground: 0x99cf94, side: 0xdbc19a, sky: 0xd8ede4 },
    { name: '蜂蜜山谷', subtitle: '方向与推箱', color: '#976124', ground: 0xe6cf8e, side: 0xcaa074, sky: 0xf4e4ca },
    { name: '云朵群岛', subtitle: '机关与顺序', color: '#526eab', ground: 0xaec6e4, side: 0x829dc9, sky: 0xe3eaf6 },
    { name: '星光花园', subtitle: '计划与组合', color: '#866697', ground: 0xc8b1dc, side: 0xa58dbb, sky: 0xebe2f2 }
  ];
  // # hedge, ~ water, . path, P rabbit, H home, s star,
  // b movable crate, o crate target, t pressure plate, = retractable bridge.
  const raw = [
    ['初次出发', '我叫米米。一起找齐星星，再回到小屋吧！', '沿着石头小路走，经过星星就能收集。', ['~~~~~~~','~P.s..~','~~~~~.~','~H.s.s~','~~~~~~~']],
    ['花丛的两边', '花丛挡住了路，看看两边能不能绕过去。', '不要急着回家，先看看哪颗星星还没找到。', ['#######','#P.s..#','#.###.#','#s...s#','#.###.#','#..H..#','#######']],
    ['森林小岔路', '三颗星星藏在不同的小路上。', '走到岔路时，先找没去过的方向。', ['#######','#s.#.H#','#..#..#','#..P.s#','#.#.#.#','#s....#','#######']],
    ['绕过大树', '小屋就在那边，不过星星还在等你。', '最短的回家路，不一定经过每颗星星。', ['#######','#P..#s#','###.#.#','#s....#','#.###.#','#s..H.#','#######']],
    ['蝴蝶的回廊', '小路绕了一圈。想好先去哪里了吗？', '试着把三颗星星连成一条自己的路线。', ['#########','#P...s..#','#.#####.#','#s#...#.#','#.#.#.#s#','#...#..H#','#########']],
    ['森林邮递员', '米米要带着三颗星星去拜访朋友。', '先观察每条小路的出口，再选出发方向。', ['#########','#s..#..s#','#.#.#.#.#','#.#.P.#.#','#.###.#.#','#s....#H#','#########']],
    ['第一只木箱', '把木箱推到花纹垫上，小屋就准备好啦。', '站在木箱左边，向右走，就能推木箱。', ['#######','#...s.#','#.....#','#P.boH#','#.....#','#s...s#','#######']],
    ['换一边推', '木箱不会自己拐弯，需要你换个位置。', '想让木箱往上走，就站在它下面。', ['#######','#s.o.H#','#.....#','#..b..#','#.P...#','#s...s#','#######']],
    ['转个小弯', '垫子藏在右上角。箱子该怎么转弯？', '先把木箱推到垫子下面，再绕到箱子下方。', ['#######','#s..oH#','#.....#','#.b...#','#.P.#.#','#s...s#','#######']],
    ['两份蜂蜜', '两只箱子，两块垫子。慢慢安排。', '先选一只箱子，留出绕到另一只后面的路。', ['#######','#s.o.H#','#..b..#','#.P...#','#..b..#','#s.o.s#','#######']],
    ['给转身留地方', '树篱让路变窄了，推之前先看一看。', '箱子进了没有垫子的角落会推不出来，可以退一步。', ['#########','#s..o..H#','#.#...#.#','#..b.b..#','#.#.P.#.#','#s..o..s#','#########']],
    ['蜂蜜搬运家', '三个小伙伴都在等蜂蜜送到。', '可以一箱一箱地送，不需要同时推。', ['#########','#s.o.o.H#','#..b.b..#','#...P...#','#...b...#','#s..o..s#','#########']],
    ['会醒来的桥', '踩一下圆圆的机关，小桥就会升起来。', '先到圆形机关上，再走向桥。桥升起后会保持打开。', ['#########','#P.s#s.H#','#...#...#','#.t.=.s.#','#...#...#','#########']],
    ['先找机关', '这次机关躲在一条小路尽头。', '桥前没路时，回头找带圆圈的机关。', ['#########','#P.s#s.H#','#.#.#.#.#','#.#.=...#','#t..#s..#','#########']],
    ['一起按下去', '两个圆形机关要同时被压住。箱子能帮忙！', '让箱子停在一个机关上，米米踩住另一个。', ['#########','#s..#s.H#','#...#...#','#t.b=.s.#','#.P.#...#','#..t#...#','#########']],
    ['桥边的合作', '把木箱留给一个机关，再去找另一个。', '推箱子前，先确认自己能绕到需要的位置。', ['#########','#s.t#s.H#','#...#...#','#.b.=...#','#..P#.#.#','#t..#s..#','#########']],
    ['云上转弯', '桥和小路连成了弯弯的路线。', '先一起按下两个机关，再去桥另一边收集星星。', ['#########','#s.t#s.H#','#.#.#.#.#','#..b=...#','#.P.#.#.#','#t..#s..#','#########']],
    ['打开两座桥', '同一组机关，能叫醒两座小桥。', '两座桥都会保持打开，先把机关安排好。', ['#########','#s.t=s.H#','#...#.#.#','#.b.#...#','#.P.=.#.#','#t..#s..#','#########']],
    ['星光第一站', '先过桥，再把蜂蜜送到花纹垫。', '机关只要踩亮一次；木箱最后要停在方形花纹垫上。', ['#########','#P.s#s.H#','#...#...#','#.t.=b.o#','#...#s..#','#########']],
    ['木箱也要过桥', '把木箱和星星一起送到对岸。', '先踩机关升桥，再绕到箱子左边，把它推过桥。', ['#########','#P.s#s.H#','#...#...#','#.b.=..o#','#...#...#','#t..#s..#','#########']],
    ['借用小木箱', '先请木箱帮忙开桥，再送它去垫子。', '桥升起后不会落下，箱子可以离开机关。', ['#########','#s..#s.H#','#.t.#...#','#.b.=..o#','#.Pt#...#','#...#s..#','#########']],
    ['两箱过河', '桥有点窄，让两个箱子轮流过去吧。', '过桥后先把第一箱移开，给第二箱留一条路。', ['#########','#s.t#s.H#','#...#...#','#.b.=..o#','#.b.#...#','#P..#s.o#','#########']],
    ['花园小建筑师', '你已经会找路、搬运和开桥了。', '先开桥，再安排箱子；留着箱子后面的位置给自己走。', ['#########','#s..#s.H#','#.t.#...#','#.b.=..o#','#.bt#...#','#P..#s.o#','#########']],
    ['送星星回家', '最后一封星光邀请函，等你送到小屋。', '先让两个机关同时被压住。桥打开后，再把两箱送到对岸。', ['#########','#s..#s.H#','#.t.#...#','#.b.=..o#','#.bt#.#.#','#P..#s.o#','#########']]
  ];
  const dirs = [{ x: 0, z: -1, name: '上' }, { x: 1, z: 0, name: '右' }, { x: 0, z: 1, name: '下' }, { x: -1, z: 0, name: '左' }];
  const levels = raw.map(([name, story, tip, map], i) => {
    const width = map[0].length, cells = map.join(''), find = c => Array.from(cells).flatMap((v, j) => v === c ? [j] : []);
    if (map.some(r => r.length !== width) || find('P').length !== 1 || find('H').length !== 1) throw Error('Invalid level: ' + name);
    return { id: i, chapter: Math.floor(i / 6), name, story, tip, map, width, height: map.length, cells,
      spawn: find('P')[0], home: find('H')[0], stars: find('s'), boxes: find('b'), goals: find('o'), plates: find('t'), bridges: find('=') };
  });
  function initial(l) { return { p: l.spawn, boxes: [...l.boxes].sort((a,b) => a-b), stars: 0, open: false, moves: 0 }; }
  function allStars(l) { return (1 << l.stars.length) - 1; }
  function won(l,s) { return s.p === l.home && s.stars === allStars(l) && l.goals.every(g => s.boxes.includes(g)); }
  function adjacent(l, p, d) {
    const x = p % l.width + dirs[d].x, z = Math.floor(p / l.width) + dirs[d].z;
    return x < 0 || x >= l.width || z < 0 || z >= l.height ? -1 : z * l.width + x;
  }
  function passable(l,p,s) { return p >= 0 && p < l.cells.length && !'#~'.includes(l.cells[p]) && (l.cells[p] !== '=' || s.open); }
  function step(l,s,d) {
    if (!Number.isInteger(d) || d < 0 || d > 3) return null;
    const p = adjacent(l,s.p,d);
    if (!passable(l,p,s)) return null;
    let boxes = s.boxes, moved = null;
    if (boxes.includes(p)) {
      const to = adjacent(l,p,d);
      if (!passable(l,to,s) || boxes.includes(to)) return null;
      boxes = boxes.map(b => b === p ? to : b).sort((a,b) => a-b);
      moved = { from: p, to };
    }
    const star = l.stars.indexOf(p), stars = star < 0 ? s.stars : s.stars | (1 << star);
    const open = s.open || (l.plates.length > 0 && l.plates.every(t => p === t || boxes.includes(t)));
    return { p, boxes, stars, open, moves: s.moves + 1, moved };
  }
  function key(s) { return [s.p, s.stars, s.open ? 1 : 0, ...s.boxes].join(','); }
  function valid(l,s) {
    return s && Number.isInteger(s.p) && typeof s.open === 'boolean' && passable(l,s.p,s) &&
      Array.isArray(s.boxes) && s.boxes.length === l.boxes.length && new Set(s.boxes).size === s.boxes.length &&
      s.boxes.every(b => Number.isInteger(b) && b !== s.p && passable(l,b,s)) &&
      Number.isInteger(s.stars) && s.stars >= 0 && s.stars <= allStars(l) && Number.isInteger(s.moves) && s.moves >= 0;
  }
  function solve(l,start,limit=180000) {
    // Weighted A*: finds a useful route, not a claimed minimum-move solution.
    const distance=(a,b)=>Math.abs(a%l.width-b%l.width)+Math.abs(Math.floor(a/l.width)-Math.floor(b/l.width));
    function estimate(s) {
      let h=0;
      const remaining=l.stars.filter((_,i)=>!(s.stars&(1<<i)));
      let at=s.p;
      while(remaining.length) {
        let best=0;remaining.forEach((p,i)=>{if(distance(at,p)<distance(at,remaining[best]))best=i;});
        h+=distance(at,remaining[best]);at=remaining.splice(best,1)[0];
      }
      h+=distance(at,l.home);
      h+=l.goals.reduce((n,g)=>n+Math.min(...s.boxes.map(b=>distance(b,g)))*2,0);
      if(l.bridges.length&&!s.open) h+=6+l.plates.reduce((n,t)=>n+Math.min(distance(s.p,t),...s.boxes.map(b=>distance(b,t))),0);
      return h;
    }
    const nodes=[{s:start,parent:-1,d:-1,g:0}], heap=[], best=new Map([[key(start),0]]);
    function push(entry) {
      heap.push(entry);let i=heap.length-1;
      while(i>0){const p=(i-1)>>1;if(heap[p].f<=entry.f)break;heap[i]=heap[p];i=p;}heap[i]=entry;
    }
    function pop() {
      const first=heap[0],tail=heap.pop();if(!heap.length)return first;
      let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=tail.f)break;heap[i]=heap[c];i=c;}heap[i]=tail;return first;
    }
    push({i:0,f:estimate(start)*3});let visited=0;
    while(heap.length&&visited<limit) {
      const {i}=pop(),{s,g}=nodes[i];if(g!==best.get(key(s)))continue;visited++;
      if(won(l,s)) {
        const path=[];for(let j=i;nodes[j].parent!==-1;j=nodes[j].parent)path.push(nodes[j].d);
        return {path:path.reverse(),visited,status:'solved'};
      }
      for(let d=0;d<4;d++) {
        const n=step(l,s,d);if(!n)continue;
        const k=key(n);if(best.has(k)&&best.get(k)<=g+1)continue;
        best.set(k,g+1);nodes.push({s:n,parent:i,d,g:g+1});push({i:nodes.length-1,f:g+1+3*estimate(n)});
      }
    }
    return {path:null,visited,status:heap.length?'limit':'blocked'};
  }
  const api={ chapters,levels,dirs,initial,allStars,won,adjacent,passable,step,key,valid,solve };
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.IslandLogic=api;
})(typeof self!=='undefined'?self:globalThis);
