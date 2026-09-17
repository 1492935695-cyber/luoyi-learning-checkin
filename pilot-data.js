export const PILOT_VERSION='pilot-20260917-discovery1';
export const PEOPLE={
 narrator:{name:'旁白',voice:'zh-CN-YunyangNeural',gender:'Male'},
 luoyi:{name:'珞伊',voice:'zh-CN-XiaoyiNeural',gender:'Female'},
 li:{name:'李老师',voice:'zh-CN-XiaoxiaoNeural',gender:'Female',file:'teacher-li.glb',height:2.05},
 wang:{name:'王老师',voice:'zh-CN-YunjianNeural',gender:'Male',file:'teacher-wang.glb',height:2.10},
 friend:{name:'李欣袆',voice:'zh-TW-HsiaoChenNeural',gender:'Female',file:'../cinema/actor-live-friend.glb',height:1.50},
 yang:{name:'杨诗然',voice:'zh-TW-HsiaoYuNeural',gender:'Female',file:'../cinema/actor-live-girl.glb',height:1.53},
 tang:{name:'汤葭荟',voice:'zh-CN-XiaoyiNeural',pitch:'+12Hz',gender:'Female',file:'../cinema/actor-live-tang.glb',height:1.43},
 brother:{name:'乔治哥哥',voice:'zh-CN-YunxiNeural',gender:'Male',file:'../cinema/actor-live-brother.glb',height:1.77},
 squirrel:{name:'松鼠阿栗',voice:'zh-CN-YunxiaNeural',gender:'Male'}
};
const line=(id,who,text,shot,action)=>({id,who,text,shot,action});
const task=(id,kind,title,py,who,text,goal,stage='independent')=>({id,kind,title,py,who,text,goal,stage,shot:'action'});
export const PILOTS={
 math:{id:'math',title:'小灯车的长队魔法',subject:'数学',lesson:'1～5的认识',pages:'12—16',color:'#dd9850',characters:['wang','yang','tang'],intro:'一盏灯，真的会变成两盏吗？',beats:[
 line('m01','luoyi','咦，小灯车怎么不走了？阿栗，你把灯藏到哪里去了？','wide','arrival'),
 line('m02','squirrel','没有藏！我把三盏排得长长的。嘿嘿，这下是不是变成五盏啦？','squirrel','spread-demo'),
 line('m03','wang','珞伊，我们来试一试！先给小车装三盏灯，再看看阿栗的魔法。','wang','point'),
 task('m04','pack','装好三盏，再点铃','zhuāng hǎo sān zhǎn zài diǎn líng','wang','小车要带三盏灯。点灯装车，也能点车上的灯拿回来。你觉得够了，就点红色车铃出发。',3),
 line('m05','squirrel','看我的长队魔法！一，二……咦，怎么还是你刚才装的那些？','wide','spread'),
 task('m06','return','把灯叫回来','bǎ dēng jiào huí lái','wang','点一下跑开的灯，让它回到自己的车位。',3,'guided'),
 line('m07','luoyi','原来只是位置变了！阿栗，灯可不会自己变多哦。','wide','glow'),
 line('m08','yang','珞伊，又来了一只小鸭。它也想带一盏灯去看演出！','yang','duck-arrive'),
 task('m09','supply','给新伙伴备灯','gěi xīn huǒ bàn bèi dēng','yang','小车有三盏灯，现在来了四只小鸭。每只带一盏。珞伊，点一组新灯，让每只都有。',4),
 line('m10','tang','还有一只小鸭追来啦！它的小帽子都跑歪了。','tang','duck-more'),
 task('m11','supply','让每只都有灯','ràng měi zhī dōu yǒu dēng','tang','这回是五只小鸭，小车有四盏灯。你来选一组，看看怎样刚好够。',5),
 line('m12','wang','三盏添一盏是四盏，四盏再添一盏是五盏。真的添了灯，数量才增加。','wang','point'),
 line('m13','squirrel','报告珞伊导演！小桥还有空灯座。可是，这回没有人告诉我拿几盏。','bridge','bridge-reveal'),
 task('m14','bridge','给灯座配灯','gěi dēng zuò pèi dēng','wang','看，上面这些蓝绿色的小台子就是灯座。一个灯座放一盏灯，点下面刚好够用的一组。',4),
 line('m14a','squirrel','我给灯扣上了小盖子！原来有五盏灯，现在外面只看见三盏。珞伊，盖子下面藏着几盏呢？','wide','mystery'),
 {...task('m14b','hidden','找回藏着的灯','zhǎo huí cáng zhe de dēng','wang','五盏灯一盏也没有拿走，外面看见三盏。点一组灯，猜猜盖子下面藏着几盏，再打开看看。',2),lesson:'课内延伸｜5的分与合 · 第20—21页'},
 line('m15','luoyi','灯都找到了，小桥也亮啦！阿栗，带着小鸭出发吧！','wide','depart'),
 line('m16','squirrel','我的长队魔法没成功，珞伊的办法成功啦！下一站，蜻蜓小剧场！','journey','celebrate')
 ],coverage:'本集包含自主装三盏并决定出发、数量与排列、为新增伙伴选择补灯量、一一对应；延伸到5可分成3和2。没有观察数字书写、拨珠或本页全部纸笔活动。数字和点数是可见支持，不等同无提示测验。',oral:'珞伊，小灯车到了！可以收好故事去休息，也可以自愿帮小动物分一次点心。'},
 chinese:{id:'chinese',title:'风把名字吹跑了',subject:'语文',lesson:'识字第1课《天地人》',pages:'8',color:'#72b2b0',characters:['li','friend','brother'],intro:'送错地方的信，等珞伊来找主人。',beats:[
 line('c01','luoyi','李老师，天上的信怎么钻进泥土里了？','wide','letters-fly'),
 line('c02','squirrel','风把名字吹乱了！我把天空的信塞进了地里，蚯蚓还以为下雪啦！','squirrel','confused'),
 line('c03','li','先看看它们的家。头顶是天，脚下是地，我们都是人。','world','teach-world'),
 task('c04','mail','点亮边，送出信','diǎn liàng biān sòng chū xìn','li','看信上的字。白云、泥土、伙伴都有亮边收信口，点一下合适的收信处，信就飞过去。',['天','地','人'],'guided'),
 line('c05','friend','珞伊，三封都送对啦！还有几封信，写着我、你、他。','friend','letter'),
 line('c06','squirrel','我把所有写着我的信，全放进自己口袋里！哎？怎么人人都说是我的？','squirrel','pockets'),
 line('c07','li','谁正在说话，谁就用我称自己。听听这一封是谁在说。','li','point'),
 task('c08','pronoun','我','wǒ','friend','我拿着风筝。把这封写着我的信，交给我吧。','friend','guided'),
 task('c09','pronoun','我','wǒ','brother','现在我来啦！这回写着我的信，该交给谁？','brother'),
 line('c10','li','换了说话的人，我指的人也会变。看，你又收到一封。','li','smile'),
 task('c11','receive','你','nǐ','friend','珞伊，我把这封信交给你。伸手收好吧。','luoyi','guided'),
 task('c12','pronoun','他','tā','friend','最后这封交给他，就是桥边的乔治哥哥。','brother','guided'),
 line('c13','squirrel','我收回刚才的话！我不是一个固定的人名，不能把所有信都塞进我的口袋。','squirrel','laugh'),
 line('c14','brother','风又来了！珞伊，帮邮局把六枚印章找齐，我们再去送最后几封信。','bridge','letters-fly'),
 task('c15','seals','找到印章','zhǎo dào yìn zhāng','li','听清要找的字，点一下对应的印章。',['人','天','地','我','你','他']),
 line('c15a','squirrel','糟糕，最后几封信的名字被雨点洗掉啦！还好，里面藏着小线索。珞伊，能请你帮我送到吗？','squirrel','confused'),
 task('c15b','clue','听线索，送出信','tīng xiàn suǒ sòng chū xìn','li','这次不看名字，听听信里说了什么，再点亮边收信处。想再听就点再听一次。',['地','天','人']),
 line('c16','luoyi','名字找对，信就不会迷路啦。阿栗，这回你可以放心送信了！','wide','depart'),
 line('c17','squirrel','收到！寄给天的信，我可不再请蚯蚓代收啦！','journey','celebrate')
 ],coverage:'天、地、人、你、我、他六字有情境接触和听音找字，另有称呼变化、三条生活线索的意思推断。字卡带拼音，点击完成不等于独立认读；线索推断不等于识字。朗读另由家长观察，本课不强加写字。',oral:'珞伊，挑两个字读给家人听吧。也可以先歇一歇，下次再读。'},
 math_bonus:{id:'math_bonus',title:'阿栗的点心野餐',subject:'数学拓展',lesson:'公平分与等量分组',pages:'',characters:['wang','yang','tang'],bonus:true,beats:[
 line('b01','squirrel','演出前开个小野餐！我有四块点心，两只小鸭都想吃。可别让一只的盘子堆成山呀！','wide','picnic'),
 task('b02','share','给两位伙伴公平分','gěi liǎng wèi huǒ bàn gōng píng fēn','wang','四块点心，两只小鸭一样多。点盘子放一块。分完后，再点盘子能拿回一块。分好了就点铃，请它们开吃。',2),
 line('b03','yang','原来两块和两块合起来，正好是四块！珞伊，它们想给朋友打包。','yang','smile'),
 task('b04','boxes','每盒装两块','měi hé zhuāng liǎng kuài','wang','还是这四块点心，每个盒子装两块。点一组盒子，让四块都装下，每盒也都装满。',2),
 line('b05','squirrel','分点心和装盒子，都要把一份一份看清楚。珞伊，谢谢你！我们去野餐啦！','journey','celebrate')
 ],coverage:'自愿拓展，不是《1～5的认识》本课达标要求。体验4分成同样多的两份、每份2；以及4个按每组2个可装2组。为加减、乘除意义提供直观经验，不考乘除口诀、符号或声称掌握运算。',oral:'珞伊，点心装好啦。故事先收好，去活动一下吧。'}
};
export const EXTRA_SPEECH=[
 {id:'good-seals',who:'li',text:'找齐啦，珞伊！六枚印章是天、地、人、你、我、他。',heading:'六枚印章找齐啦！',learn:'天 地 人 你 我 他',py:'tiān dì rén nǐ wǒ tā'},
 ...['天','地','人','你','我','他'].map((w,i)=>({id:'word-'+i,who:'li',text:w})),
 ...['天','地','人','我','你','他'].map((w,i)=>({id:'find-'+i,who:'li',text:'点一下写着'+w+'的印章。'})),
 {id:'hint-load',who:'wang',text:'看前面亮着边框的灯，点一盏，它就会到小车上。我们一盏一盏来。'},
 {id:'hint-return',who:'wang',text:'点地上的灯，把它们送回蓝绿色的车位。每盏灯都有自己的位置。'},
 {id:'hint-add',who:'wang',text:'小车上已经有灯了。点前面这盏新灯，再添进去一盏。'},
 {id:'hint-mail',who:'li',text:'天在头顶，地在脚下，人是我们。再看看这封信。'},
 {id:'hint-pronoun',who:'li',text:'先找正在说话的人，听听他想把信交给谁。'},
 {id:'hint-bridge',who:'wang',text:'箭头指着蓝绿色的灯座。先数数灯座，再看看下面哪组灯刚好够用。'},
 {id:'retry-bridge-less',who:'wang',text:'还差一盏呢。你看，有一个灯座还空着。我们再选一组试试。',heading:'还差一盏，再试试',learn:'少一盏',py:'shǎo yì zhǎn'},
 {id:'retry-bridge-more',who:'wang',text:'多出一盏啦。你看，灯座都配上了，还有一盏没地方放。再选一组吧。',heading:'多出一盏，再试试',learn:'多一盏',py:'duō yì zhǎn'},
 {id:'retry',who:'li',text:'再看一眼，故事等着你，不着急。'},
 {id:'done-math',who:'wang',text:'珞伊，小灯车到站啦。今天的故事收好，我们歇一歇。'},
 {id:'done-chinese',who:'li',text:'珞伊，信送到啦。你可以挑一个字读给家人听，然后歇一歇。'},
 ...['一','两','三','四','五'].map((n,i)=>({id:'count-'+(i+1),who:'wang',text:i===0?'第一盏放好啦！小车上现在有一盏灯。':`又放好一盏，现在一共有${n}盏灯。`,heading:i===0?'第一盏放好啦':'又放好一盏',learn:`一共${n}盏灯`,py:`yí gòng ${['yì','liǎng','sān','sì','wǔ'][i]} zhǎn dēng`,count:i+1})),
 ...['一','二','三'].map((n,i)=>({id:'return-'+(i+1),who:'wang',text:i===2?'太好了，三盏灯都回到原来的车位啦！换了位置，还是三盏。':`第${n}盏灯回到原来的车位啦。`,heading:i===2?'三盏灯都回来了':`第${n}盏回来了`,learn:i===2?'数量没有变':'找到原来的位置',py:i===2?'shù liàng méi yǒu biàn':'zhǎo dào yuán lái de wèi zhì',count:i===2?3:null})),
 {id:'good-load',who:'wang',text:'对啦，珞伊！三盏灯装好了，不多也不少。',heading:'对啦，珞伊！',learn:'一共三盏灯',py:'yí gòng sān zhǎn dēng',count:3},
 {id:'good-add4',who:'wang',text:'放对啦！原来有三盏，又添一盏，现在一共有四盏灯。',heading:'放对啦！',learn:'三盏添一盏是四盏',py:'sān zhǎn tiān yì zhǎn shì sì zhǎn',count:4},
 {id:'good-add5',who:'wang',text:'又帮到一位小伙伴！四盏再添一盏，现在一共有五盏灯。',heading:'又帮到一位小伙伴！',learn:'四盏添一盏是五盏',py:'sì zhǎn tiān yì zhǎn shì wǔ zhǎn',count:5},
 {id:'good-bridge',who:'wang',text:'选对啦，珞伊！四盏灯配四个灯座，每个都有，一盏也没多。小桥亮起来啦！',heading:'选对啦，小桥亮了！',learn:'四盏灯配四个灯座',py:'sì zhǎn dēng pèi sì gè dēng zuò',count:4},
 ...['天','地','人','你','我','他'].map((w,i)=>({id:'good-word-'+i,who:'li',text:`找对啦！这个字读${w}。`,heading:'找对啦！',learn:w,py:['tiān','dì','rén','nǐ','wǒ','tā'][i]})),
 {id:'good-friend',who:'li',text:'送对啦！刚才是李欣袆在说话，她用我称自己。',heading:'信送对啦！',learn:'我',py:'wǒ'},
 {id:'good-brother',who:'li',text:'对啦，换成乔治哥哥说话，我就指乔治哥哥了。你听清是谁在说话啦！',heading:'你听清是谁在说话啦！',learn:'我',py:'wǒ'},
 {id:'good-receive',who:'li',text:'接到啦！李欣袆对珞伊说你，你就是珞伊。',heading:'珞伊接到信啦！',learn:'你',py:'nǐ'},
 {id:'good-he',who:'li',text:'送对啦！这次说的他，是桥边的乔治哥哥。',heading:'又送对一封！',learn:'他',py:'tā'}
 ,{id:'hint-pack',who:'wang',text:'小车要三盏。你可以一盏一盏点，数够了点红色车铃；多装的灯还能点回去。'}
 ,{id:'pack-less',who:'wang',text:'还没有三盏，车上还有空位置呢。再看看要添几盏。',heading:'还可以再装一点',learn:'还不够三盏',py:'hái bú gòu sān zhǎn'}
 ,{id:'pack-more',who:'wang',text:'已经超过三盏了。点车上的灯拿回来，留三盏再出发。',heading:'多的可以拿回来',learn:'留下三盏',py:'liú xià sān zhǎn'}
 ,{id:'pack-remove',who:'wang',text:'这盏拿回来了。再看看车上还剩几盏。',heading:'可以调整自己的办法',learn:'拿走一盏',py:'ná zǒu yì zhǎn'}
 ,{id:'hint-supply',who:'wang',text:'先看看小车已经有几盏，再看看小鸭有几只。每只配一盏，只添缺少的灯。'}
 ,{id:'supply-more',who:'wang',text:'你看，每只小鸭都有一盏，还多出一盏呢。试试另一组。',heading:'有一盏多出来了',learn:'只添缺少的',py:'zhǐ tiān quē shǎo de'}
 ,{id:'hint-hidden',who:'wang',text:'一共有五盏。外面三盏，里面的和外面的合起来，要刚好是五盏。你可以用手指想一想。'}
 ,{id:'hidden-less',who:'wang',text:'我们打开看看，里面有两盏呢。三盏加上你选的这一盏，还不到五盏。',heading:'打开验证，再想一想',learn:'三和二合成五',py:'sān hé èr hé chéng wǔ',count:5}
 ,{id:'hidden-more',who:'wang',text:'打开看看，里面是两盏。三盏加上你选的三盏，会超过原来的五盏。',heading:'打开验证，再想一想',learn:'三和二合成五',py:'sān hé èr hé chéng wǔ',count:5}
 ,{id:'good-hidden',who:'wang',text:'找到了！外面三盏，里面两盏，合起来五盏。知道总数和一部分，就能想出藏着的部分。',heading:'藏着的灯找到了！',learn:'三和二合成五',py:'sān hé èr hé chéng wǔ',count:5}
 ,{id:'clue-0',who:'li',text:'种子在这里发芽，小蜗牛在这里爬。把这封信送到这里。'}
 ,{id:'clue-1',who:'li',text:'风筝飞到这里，云朵也在这里。想一想，这封信要去哪里？'}
 ,{id:'clue-2',who:'li',text:'收信的会说话，会和你一起玩。请把信交给这个伙伴。'}
 ,{id:'hint-clue',who:'li',text:'把信里的两条线索合起来想。看看白云、泥土和伙伴，哪一个都符合？'}
 ,{id:'good-clue-0',who:'li',text:'送对啦！种子发芽、蜗牛爬过，线索说的是地。',heading:'你找到线索的意思啦',learn:'地',py:'dì'}
 ,{id:'good-clue-1',who:'li',text:'对啦！风筝和云朵都在天上，这封信该送给天。',heading:'两条线索合起来想',learn:'天',py:'tiān'}
 ,{id:'good-clue-2',who:'li',text:'送到啦！会说话、一起玩的伙伴是人。三封没有名字的信也找到家啦！',heading:'没有名字，也能找到家',learn:'人',py:'rén'}
 ,{id:'hint-share',who:'wang',text:'两只小鸭要一样多。你可以给左边一块，再给右边一块，看看有没有分完。'}
 ,{id:'share-leftover',who:'wang',text:'托盘里还有点心呢。把四块都分完，再看看两个盘子是不是一样多。',heading:'还有点心等着分',learn:'四块都分完',py:'sì kuài dōu fēn wán'}
 ,{id:'share-unequal',who:'wang',text:'两个盘子还不一样多。点多的盘子拿回一块，再点少的盘子，把这一块分过去试试。',heading:'让两位伙伴一样多',learn:'一样多',py:'yí yàng duō'}
 ,{id:'good-share',who:'wang',text:'分好啦！左边两块，右边两块，两只小鸭一样多。两块和两块合起来是四块。',heading:'两位伙伴都开心啦',learn:'二和二合成四',py:'èr hé èr hé chéng sì',count:4}
 ,{id:'hint-boxes',who:'wang',text:'每个盒子放两块。先想一盒放了两块，还剩多少，再看看还要几个盒子。'}
 ,{id:'boxes-less',who:'wang',text:'一盒放了两块，还有两块没有装下。再找一组盒子。',heading:'点心还没装完',learn:'一盒装两块',py:'yì hé zhuāng liǎng kuài'}
 ,{id:'boxes-more',who:'wang',text:'四块都装好了，却空着一个盒子。试试刚好装满的那一组。',heading:'有一个空盒子',learn:'每盒都装满',py:'měi hé dōu zhuāng mǎn'}
 ,{id:'good-boxes',who:'wang',text:'正好两个盒子！每盒两块，两盒就是四块。我们把点心送去吧！',heading:'不多不少，装好啦',learn:'每盒两块，共两盒',py:'měi hé liǎng kuài gòng liǎng hé',count:4}
 ,{id:'done-math_bonus',who:'wang',text:'珞伊，今天的野餐准备好啦！可以说说你怎么分的，也可以先去休息。'}
];
