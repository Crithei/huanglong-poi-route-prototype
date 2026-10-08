(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.HuanglongPassportData=factory();})(typeof window==='undefined'?globalThis:window,()=>({
  places:[
    {id:'welcome-pond',name:'迎宾池',mark:'初见叠水',caption:'水以层层浅池，向山外来客问好。',detail:'看池沿怎样把水面分成不同高度。在开放栈道停一停，找一处上下相接的小落水。',palette:'jade'},
    {id:'flying-waterfall',name:'飞瀑流辉',mark:'流光分岔',caption:'一面岩壁，让同一股水分出许多光。',detail:'从安全的观景处，找一条细流如何沿岩壁分开、又汇合。瀑布的水势随季节和来水改变。',palette:'blue'},
    {id:'jinsha-pudi',name:'金沙铺地',mark:'薄水金纹',caption:'金色来自钙华，流动藏在一层薄水里。',detail:'比较滩面缓坡与小落差处的水流。它并不是一地金沙；薄水下的钙华纹理才是观察重点。',palette:'gold'},
    {id:'bonsai-pond',name:'盆景池',mark:'水中微林',caption:'树根、池沿与水，组成不用搬走的盆景。',detail:'用眼睛沿着池沿走，看看它怎样绕开树根和草木。不离开栈道，也能找到一幅微小山水。',palette:'moss'},
    {id:'zhengyan-chi',name:'争艳彩池',mark:'万形相邻',caption:'大小与深浅相邻，水色也有了不同表情。',detail:'选相邻的两个池，比较边缘形态、水色与周围倒影。颜色的差异不能简单归因于一种因素。',palette:'plum'},
    {id:'five-color-pond',name:'五彩池',mark:'水的见证者',caption:'看见彩池，也看见水留下的时间。',detail:'先看池群，再看某一段池沿与薄薄的溢流。这里的纪念章用艺术化池形表达层叠，并非实测地图。',palette:'blue'}
  ],
  themes:[
    {id:'gentle',title:'慢看两站',need:2,labs:0,reward:'山水初见',description:'六枚主章任意两枚。可以折返，也可以慢慢走。'},
    {id:'wander',title:'山水漫游',need:3,labs:0,reward:'山水同行',description:'六枚主章任意三枚，不限顺序、不赶时间。'},
    {id:'observer',title:'自然观察',need:2,labs:1,reward:'细节发现者',description:'任意两枚主章，加一枚实验贴纸。多看一眼也算一段旅程。'}
  ],
  experiments:[
    {id:'color',title:'水色不是颜料',eyebrow:'LIGHT / DEPTH',poiIds:['five-color-pond','zhengyan-chi','bonsai-pond'],reward:'一池水色',icon:'◒',duration:'约 1 分钟',question:'同样的池底，换一个水深，眼里的颜色会怎样？',controls:[{id:'depth',label:'示意水深',low:'浅',high:'深',initial:20},{id:'clarity',label:'清澈程度',low:'浑浊',high:'清澈',initial:90}],goals:[{id:'shallow',label:'浅水透底',hint:'保持清澈，把水调浅。'},{id:'deep',label:'深水对照',hint:'保持清澈，只增加水深。'},{id:'turbid',label:'浑浊遮底',hint:'再降低清澈程度，看看池底。'}],conclusion:'水深改变光在水中经过的路程；散射、吸收、浅色池底和周围倒影共同影响水色。清澈不等于无色，彩池也不是水里加了颜料。',field:'在同一观景处比较相邻池面，先留意深浅，再看天空和树木的倒影。',boundary:'这是定性的色彩示意。真实水色还受光照、观看角度、池底与生物等影响，滑杆不能反推现场水深。'},
    {id:'flow',title:'一层水，几种走法',eyebrow:'SLOPE / FLOW',poiIds:['jinsha-pudi','flying-waterfall','welcome-pond'],reward:'薄水金纹',icon:'≈',duration:'约 1 分钟',question:'供水相近时，缓坡与陡坡上的水会留下什么不同的形态？',controls:[{id:'slope',label:'坡面倾斜',low:'缓坡',high:'陡坡',initial:20},{id:'supply',label:'来水多少',low:'无来水',high:'较多',initial:45}],goals:[{id:'film',label:'缓坡薄水',hint:'用少量到中等来水，观察缓坡。'},{id:'fall',label:'陡坡落水',hint:'保持来水在中等范围，只把坡面变陡。'},{id:'dry',label:'断水对照',hint:'暂时关闭来水，比较水流与岩面。'}],conclusion:'同一股水会受到坡度、岩面形状和来水量共同影响。缓坡可见薄水漫流，落差集中处会出现跌水。水流停下，原先的岩面与钙华并不会随之消失。',field:'在金沙铺地看薄水，在飞瀑流辉看跌水；只在开放栈道观察，不踩入滩面。',boundary:'来水和坡度仅用于形态对照，未计算真实流速、流量或侵蚀速率。现实地形比这个剖面复杂。'},
    {id:'mineral',title:'水离开，石留下',eyebrow:'CO₂ / TIME',poiIds:['five-color-pond','zhengyan-chi','jinsha-pudi'],reward:'时间薄片',icon:'≋',duration:'约 1 分钟',question:'含有溶解物的水来到地表，为什么有时会留下一层钙华？',controls:[{id:'release',label:'CO₂ 逸散条件',low:'弱',high:'强',initial:10},{id:'time',label:'示意时间',low:'刚开始',high:'较长',initial:85}],goals:[{id:'retained',label:'保留 CO₂',hint:'先保持逸散弱，把时间推长。'},{id:'early',label:'刚刚逸散',hint:'增强逸散，把时间退回开始。'},{id:'layered',label:'积累薄层',hint:'保持较强逸散，再慢慢推动时间。'}],conclusion:'在适当化学条件下，CO₂ 逸散可促进碳酸钙析出；长时间积累才可能形成可见钙华。留下的是水中溶解物形成的固体，水本身没有变成石头。',field:'看池沿的浅色细边，把眼前轮廓想成许多微小变化的累积。不要触摸、刮取或带走钙华。',boundary:'假定有持续含钙来水且条件适合沉积。本图不模拟完整平衡，也不将动画时长对应真实年限；温度、生物活动等因素未展开。'}
  ]
}));
