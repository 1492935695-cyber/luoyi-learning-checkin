/* Scope: the opening pages supplied by the parent on 2026-09-16, not the whole textbook. */
(() => {
  'use strict';
  const dictionary={'珞伊':'luò yī','珞伊的荷风小境':'luò yī de hé fēng xiǎo jìng','天地人':'tiān dì rén','天地初开':'tiān dì chū kāi','字入山水':'zì rù shān shuǐ','你我相逢':'nǐ wǒ xiāng féng','莲桥初行':'lián qiáo chū xíng','五朵荷花':'wǔ duǒ hé huā','灯火相伴':'dēng huǒ xiāng bàn','重玩本关':'chóng wán běn guān','数一数':'shǔ yī shǔ','一一对应':'yī yī duì yìng','放好':'fàng hǎo','拿起':'ná qǐ','天':'tiān','地':'dì','人':'rén','你':'nǐ','我':'wǒ','他':'tā','再去一处':'zài qù yī chù'};
  const han=/[\u3400-\u9fff]/;
  function syllables(text){return dictionary[text]?.split(' ')||window.pinyinPro.pinyin(text,{type:'array',toneType:'symbol',nonZh:'removed'});}
  function ruby(el,text){el.replaceChildren();el.dataset.plain=text;const sounds=syllables(text);let i=0;for(const char of text){if(han.test(char)){const r=document.createElement('ruby');r.append(document.createTextNode(char));const t=document.createElement('rt');t.textContent=sounds[i++]||'';r.append(t);el.append(r);}else el.append(document.createTextNode(char));}if(i!==sounds.length)console.warn('Pinyin alignment:',text,i,sounds.length);}
  const lessons=[
    {id:'welcome',title:'结伴同行',subject:'语文',kind:'friends',total:3,book:'我上学了 · 我是中国人',goal:'和新朋友一起去荷塘',intro:'珞伊，去认识新朋友，邀请他们到荷塘边相聚吧。我是中国人。',lines:['我是中国人。','我们都是中国人。','中华民族是一家。'],finish:'中华民族是一家。',concept:'依据家长提供的语文开篇图文：我是中国人；我们都是中国人；中华民族是一家。用结伴行动配合原句听读，理解我与我们。不是本课生字听写，也不要求背诵。',after:'离开屏幕后，愿意的话，把一句话说给家人听。'},
    {id:'campus',title:'校园寻踪',subject:'数学',kind:'explore',total:3,book:'数学游戏 · 在校园里找一找',goal:'沿着小路找一找',intro:'珞伊，沿着小路走，看看树、长凳和花坛。小蜻蜓陪你找一找。',lines:['我在小路旁看见了树。','长凳在树和花坛之间。','我在长凳旁看见了花坛。'],finish:'你发现了树、长凳和花坛。',concept:'依据家长提供的在校园里找一找页面，改编为有序观察与位置表达。场景为原创园林校园，不冒充教材原图或学校实景。',after:'现实中找一件东西，说说它在哪里，不继续刷题。'},
    {id:'team',title:'桃花朵朵开',subject:'数学',kind:'friends',total:2,supply:4,book:'数学游戏 · 在操场上玩一玩',goal:'和朋友组成三人队',intro:'桃花朵朵开，开三朵！珞伊，带两位朋友来到花圈，加上自己，正好三个人。',finish:'两位朋友，加上珞伊，正好三个人。',concept:'依据操场游戏中开三朵的口令，亲自邀请两位伙伴，连同自己组成三人队。辨清伙伴数与队伍总人数，不追求速度。',after:'和家人实际站成三人队，确认把自己也数进去了。'},
    {id:'hops',title:'荷塘跳圈',subject:'数学',kind:'jump',total:6,book:'数学游戏 · 在操场上玩一玩',goal:'沿着圈圈跳到前面',intro:'双脚跳进圆圈，单脚跳进三角形。珞伊，沿着小路跳过去吧。',finish:'你用不同的动作，走过了圆圈和三角形。',concept:'依据操场页面的双脚跳进圆圈、单脚跳进三角形规则。看清形状后选择身体动作；不是图形定义测验，屏幕动作不替代真实运动。',after:'在安全平地上由家长陪伴做几次轻跳；不适或疲惫时跳过。'}
  ];window.AdventureLessons={lessons,ruby,syllables,dictionary};
})();
