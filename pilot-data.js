export const PILOT_VERSION='pilot-20260917-1';
export const PEOPLE={
 narrator:{name:'旁白',voice:'zh-CN-YunyangNeural',gender:'Male'},
 luoyi:{name:'珞伊',voice:'zh-CN-XiaoyiNeural',gender:'Female'},
 li:{name:'李老师',voice:'zh-CN-XiaoxiaoNeural',gender:'Female',file:'teacher-li.glb',height:2.05},
 wang:{name:'王老师',voice:'zh-CN-YunjianNeural',gender:'Male',file:'teacher-wang.glb',height:2.10},
 friend:{name:'李欣袆',voice:'zh-TW-HsiaoChenNeural',gender:'Female',file:'../cinema/actor-live-friend.glb',height:1.50},
 brother:{name:'乔治哥哥',voice:'zh-CN-YunxiNeural',gender:'Male',file:'../cinema/actor-live-brother.glb',height:1.77},
 squirrel:{name:'松鼠阿栗',voice:'zh-CN-YunxiaNeural',gender:'Male'}
};
const line=(id,who,text,shot,action)=>({id,who,text,shot,action});
const task=(id,kind,title,py,who,text,goal,stage='independent')=>({id,kind,title,py,who,text,goal,stage,shot:'action'});
export const PILOTS={
 math:{id:'math',title:'小灯车的长队魔法',subject:'数学',lesson:'1～5的认识',pages:'12—16',color:'#dd9850',characters:['wang','friend','brother'],intro:'一盏灯，真的会变成两盏吗？',beats:[
 line('m01','luoyi','咦，小灯车怎么不走了？阿栗，你把灯藏到哪里去了？','wide','arrival'),
 line('m02','squirrel','没有藏！我把三盏排得长长的。嘿嘿，这下是不是变成五盏啦？','squirrel','spread-demo'),
 line('m03','wang','排得长，不一定变多。珞伊，先给小车装上三盏灯。','wang','point'),
 task('m04','load','点三盏灯','diǎn sān zhǎn dēng','wang','点三盏灯，送上小车。',3),
 line('m05','squirrel','看我的长队魔法！一，二……咦，怎么还是你刚才装的那些？','wide','spread'),
 task('m06','return','把灯叫回来','bǎ dēng jiào huí lái','wang','点一下跑开的灯，让它回到自己的车位。',3,'guided'),
 line('m07','luoyi','每盏灯都有原来的位置。排开了，也没有多出一盏！','wide','glow'),
 line('m08','friend','珞伊，又来了一只小鸭。它也想带一盏灯去看演出！','friend','duck-arrive'),
 task('m09','add','再添一盏','zài tiān yì zhǎn','friend','点一盏新灯，送给刚来的小鸭。',4,'guided'),
 line('m10','brother','还有一只小鸭追来啦！它的小帽子都跑歪了。','brother','duck-more'),
 task('m11','add','再添一盏','zài tiān yì zhǎn','brother','再点一盏灯，给最后这只小鸭。',5,'guided'),
 line('m12','wang','三盏添一盏是四盏，四盏再添一盏是五盏。真的添了灯，数量才增加。','wang','point'),
 line('m13','squirrel','报告珞伊导演！小桥还有空灯座。可是，这回没有人告诉我拿几盏。','bridge','bridge-reveal'),
 task('m14','bridge','点刚好够用的一组','diǎn gāng hǎo gòu yòng de yì zǔ','brother','看清空灯座，点一组刚好够用的灯。',4),
 line('m15','luoyi','每个灯座都亮了，不多也不少！小灯车，可以出发啦！','wide','depart'),
 line('m16','squirrel','我的长队魔法没成功，珞伊的办法成功啦！下一站，蜻蜓小剧场！','journey','celebrate')
 ],coverage:'本集观察按数取物、数量与排列、添1及新情境一一对应。没有观察数字书写、拨珠和本页全部纸笔活动。',oral:'把四个真实小物品排开，让珞伊说说数量有没有变。可选，不要求重复刷关。'},
 chinese:{id:'chinese',title:'风把名字吹跑了',subject:'语文',lesson:'识字第1课《天地人》',pages:'8',color:'#72b2b0',characters:['li','friend','brother'],intro:'送错地方的信，等珞伊来找主人。',beats:[
 line('c01','luoyi','李老师，天上的信怎么钻进泥土里了？','wide','letters-fly'),
 line('c02','squirrel','风把名字吹乱了！我把天空的信塞进了地里，蚯蚓还以为下雪啦！','squirrel','confused'),
 line('c03','li','先看看它们的家。头顶是天，脚下是地，我们都是人。','world','teach-world'),
 task('c04','mail','把信送回家','bǎ xìn sòng huí jiā','li','看看信上的字，点一下它的家。',['天','地','人'],'guided'),
 line('c05','friend','珞伊，三封都送对啦！还有几封信，写着我、你、他。','friend','letter'),
 line('c06','squirrel','我把所有写着我的信，全放进自己口袋里！哎？怎么人人都说是我的？','squirrel','pockets'),
 line('c07','li','谁正在说话，谁就用我称自己。听听这一封是谁在说。','li','point'),
 task('c08','pronoun','我','wǒ','friend','我拿着风筝。把这封写着我的信，交给我吧。','friend','guided'),
 task('c09','pronoun','我','wǒ','brother','现在我来啦！这回写着我的信，该交给谁？','brother'),
 line('c10','li','换了说话的人，我指的人也会变。看，你又收到一封。','li','smile'),
 task('c11','receive','你','nǐ','friend','珞伊，我把这封信交给你。伸手收好吧。','luoyi','guided'),
 task('c12','pronoun','他','tā','friend','最后这封交给他，就是桥边的乔治哥哥。','brother','guided'),
 line('c13','squirrel','我收回刚才的话！我不是一个固定的人名，不能把所有信都塞进我的口袋。','squirrel','laugh'),
 line('c14','brother','风又来了！珞伊，帮邮局把最后三枚印章找齐，信就能出发。','bridge','letters-fly'),
 task('c15','seals','找到印章','zhǎo dào yìn zhāng','li','听清要找的字，点一下对应的印章。',['人','天','地']),
 line('c16','luoyi','名字找对，信就不会迷路啦。阿栗，这回你可以放心送信了！','wide','depart'),
 line('c17','squirrel','收到！寄给天的信，我可不再请蚯蚓代收啦！','journey','celebrate')
 ],coverage:'覆盖天、地、人、你、我、他六字的情境认读及称呼变化；有拼音支持的点击不等于独立认读，口头朗读另由家长观察。本课不强加写字。',oral:'可选：从天、地、人、你、我、他中挑两个读给家人听，再互换说话人讲“我、你”。不录音、不用自动评分卡关。'}
};
export const EXTRA_SPEECH=[
 ...['天','地','人','你','我','他'].map((w,i)=>({id:'word-'+i,who:'li',text:w})),
 ...['天','地','人'].map((w,i)=>({id:'find-'+i,who:'li',text:'点一下写着'+w+'的印章。'})),
 {id:'hint-load',who:'wang',text:'一盏接一盏地点。听，小车会帮你数。'},
 {id:'hint-mail',who:'li',text:'天在头顶，地在脚下，人是我们。再看看这封信。'},
 {id:'hint-pronoun',who:'li',text:'先找正在说话的人，听听他想把信交给谁。'},
 {id:'hint-bridge',who:'wang',text:'看看还有几个空灯座。一盏灯，照亮一个位置。'},
 {id:'retry',who:'li',text:'再看一眼，故事等着你，不着急。'},
 {id:'done-math',who:'wang',text:'珞伊，小灯车到站啦。今天的故事收好，我们歇一歇。'},
 {id:'done-chinese',who:'li',text:'珞伊，信送到啦。你可以挑一个字读给家人听，然后歇一歇。'},
 ...['一','二','三','四','五'].map((n,i)=>({id:'count-'+(i+1),who:'wang',text:n}))
];
