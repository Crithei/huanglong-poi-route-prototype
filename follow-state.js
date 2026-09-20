(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HuanglongJournal=api;})(typeof window==='undefined'?globalThis:window,()=>{
  const preferences=()=>({hours:6,pace:'平衡',cableCar:false,shortageMinutes:0});
  const CHAPTERS=Object.freeze([
    {id:'flow',label:'水流',title:'顺着山势，找到一条水路',poiIds:['jinsha-pudi','welcome-pond'],icon:'route',reward:'循流者'},
    {id:'dissolution',label:'溶解',title:'走进岩层，带上山的礼物',poiIds:['wash-body-viewpoint'],icon:'gem',reward:'岩层探访者'},
    {id:'emergence',label:'出露',title:'穿过裂隙，重新遇见天空',poiIds:['flying-waterfall','liantai-fall'],icon:'waves',reward:'寻泉者'},
    {id:'deposition',label:'沉积',title:'留下微小的一层，长成彩池',poiIds:['five-color-pond','zhengyan-chi','bonsai-pond'],icon:'layers',reward:'彩池营造者'},
  ].map(c=>Object.freeze({...c,poiIds:Object.freeze(c.poiIds)})));
  const blankChapter=id=>({won:false,earnedAt:null,...({flow:{channels:[0,0,0],runoff:0},dissolution:{charged:false,elapsed:0},emergence:{level:0,exposure:0},deposition:{sequence:0,fraction:0,running:false}}[id])});
  const create=()=>({version:3,selected:null,preferences:preferences(),arrived:null,completed:[],stamps:{},gameStep:0,growth:0,waterBadge:false,waterBadgeAt:null,activeChapter:'flow',chapters:Object.fromEntries(CHAPTERS.map(c=>[c.id,blankChapter(c.id)])),chapterBadgeAt:null});
  function checkIn(s,id,allowed){if(!allowed.includes(id)||s.stamps[id])return false;s.stamps[id]=new Date().toISOString();return true;}
  function arrive(s,id,allowed){if(!allowed.includes(id)||s.completed.includes(id)||s.arrived===id)return false;s.arrived=id;checkIn(s,id,allowed);return true;}
  const isChapterUnlocked=(s,id)=>!!CHAPTERS.find(c=>c.id===id)?.poiIds.some(p=>s.stamps[p]);
  const flowConnected=p=>p.channels.every((v,i)=>v===[1,0,1][i]);
  const solved=(id,p)=>id==='flow'?flowConnected(p)&&p.runoff>=1:id==='dissolution'?p.charged&&p.elapsed>=8:id==='emergence'?p.exposure>=4:id==='deposition'?p.sequence===9:false;
  const result=(ok,message='',completed=false,earned=false)=>({ok,message,completed,earned});
  function award(s,id){const p=s.chapters[id],earned=!p.earnedAt;p.won=true;p.earnedAt=p.earnedAt||new Date().toISOString();if(CHAPTERS.every(c=>s.chapters[c.id].earnedAt))s.chapterBadgeAt=s.chapterBadgeAt||new Date().toISOString();return result(true,'收下「'+CHAPTERS.find(c=>c.id===id).reward+'」印记，水的旅程还在继续。',true,earned);}
  function resetChapter(s,id){if(!isChapterUnlocked(s,id))return false;const earnedAt=s.chapters[id].earnedAt;s.chapters[id]={...blankChapter(id),earnedAt};return true;}
  function playChapter(s,id,action,value){
    if(!isChapterUnlocked(s,id))return result(false,'到关联景点打卡后，才能开始本章。');
    const p=s.chapters[id],index=Number.isInteger(value)&&value>=0&&value<3;
    if(action==='finish')return solved(id,p)?award(s,id):result(false,'让眼前的过程继续发生，完成后会自动收下印记。');
    if(id==='flow'&&action==='turn'&&index){p.channels[value]=1-p.channels[value];if(!p.won&&!flowConnected(p))p.runoff=0;return result(true,flowConnected(p)?'水路接通了，跟着径流看看它怎样进入地下。':'水源一直在流动，转动水槽改变它的去向。');}
    if(id==='dissolution'&&action==='charge'&&!p.charged){p.charged=true;return result(true,'水带上了 CO₂。看看石灰岩如何缓慢溶解，溶解物随水迁移。');}
    if(id==='emergence'&&action==='level'&&typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=100){p.level=value;if(value<65&&!p.won)p.exposure=0;return result(true,value>=65?'地下水到达出露高度。看泉水涌出、气泡缓缓逸散。':'慢慢抬升水位，观察山体剖面中的含水空间。');}
    if(id==='deposition'&&action==='start'&&!p.won&&!p.running&&p.sequence<9&&p.sequence%3===0){p.running=true;return result(true,'先长出池沿，再让水蓄满，最后溢向下一片低处。');}
    return result(false,'这一步暂时不能进行。');
  }
  function tickChapter(s,id,seconds){
    if(!Number.isFinite(seconds)||seconds<=0||!isChapterUnlocked(s,id))return {changed:false};
    const dt=Math.min(seconds,.25),p=s.chapters[id];if(p.won)return {changed:false};let changed=false,phaseChanged=false;
    if(id==='flow'&&flowConnected(p)){p.runoff=Math.min(1,p.runoff+dt/4);changed=true;}
    if(id==='dissolution'&&p.charged){p.elapsed=Math.min(8,p.elapsed+dt);changed=true;}
    if(id==='emergence'&&p.level>=65){p.exposure=Math.min(4,p.exposure+dt);changed=true;}
    if(id==='deposition'&&p.running){p.fraction=Math.min(1,p.fraction+dt/[3,3,2.5][p.sequence%3]);changed=true;if(p.fraction>=1-1e-9){p.sequence++;p.fraction=0;phaseChanged=true;if(p.sequence%3===0)p.running=false;}}
    if(solved(id,p))return {...award(s,id),changed:true,phaseChanged:true};
    return {changed,phaseChanged};
  }
  function depart(s,id){if(s.arrived!==id||s.completed.includes(id))return false;s.completed.push(id);s.arrived=null;return true;}
  function advanceGame(s,expected){if(s.gameStep!==expected||expected<0||expected>=3||(expected===2&&s.growth<1))return false;s.gameStep++;if(s.gameStep===3){s.waterBadge=true;s.waterBadgeAt=s.waterBadgeAt||new Date().toISOString();}return true;}
  function setGrowth(s,value){if(s.gameStep!==2||!Number.isFinite(value))return false;s.growth=Math.min(1,Math.max(0,value));return true;}
  function restartGame(s){s.gameStep=0;s.growth=0;}
  function restore(raw,allowed){
    const s=create();let saved;try{saved=JSON.parse(raw);}catch{return s;}
    if(!saved||Array.isArray(saved)||![1,2,3].includes(saved.version))return s;
    const ids=value=>Array.isArray(value)?[...new Set(value.filter(id=>allowed.includes(id)))]:[];
    s.selected=Array.isArray(saved.selected)?ids(saved.selected):null;
    s.completed=ids(saved.completed);
    s.arrived=allowed.includes(saved.arrived)&&!s.completed.includes(saved.arrived)?saved.arrived:null;
    for(const id of allowed){const date=saved.stamps?.[id];if(typeof date==='string'&&/^\d{4}-\d\d-\d\dT/.test(date)&&Number.isFinite(Date.parse(date)))s.stamps[id]=date;}
    s.gameStep=Number.isInteger(saved.gameStep)&&saved.gameStep>=0&&saved.gameStep<=3?saved.gameStep:0;
    s.growth=s.gameStep===3?1:Number.isFinite(saved.growth)?Math.max(0,Math.min(1,saved.growth)):0;
    s.waterBadgeAt=typeof saved.waterBadgeAt==='string'&&/^\d{4}-\d\d-\d\dT/.test(saved.waterBadgeAt)&&Number.isFinite(Date.parse(saved.waterBadgeAt))?saved.waterBadgeAt:null;
    s.waterBadge=s.gameStep===3||(saved.waterBadge===true&&s.waterBadgeAt!==null);
    const p=saved.preferences||{};
    if([4.5,6,8].includes(p.hours))s.preferences.hours=p.hours;
    if(['轻松','平衡','深度'].includes(p.pace))s.preferences.pace=p.pace;
    s.preferences.cableCar=p.cableCar===true;
    if(Number.isFinite(p.shortageMinutes)&&p.shortageMinutes>=0&&p.shortageMinutes<=1440)s.preferences.shortageMinutes=p.shortageMinutes;
    if(saved.version>=2){
      const date=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT/.test(v)&&Number.isFinite(Date.parse(v))?v:null;
      if(CHAPTERS.some(c=>c.id===saved.activeChapter))s.activeChapter=saved.activeChapter;
      for(const c of CHAPTERS){
        const v=saved.chapters?.[c.id],p=s.chapters[c.id];if(!v||!isChapterUnlocked(s,c.id))continue;
        const clamp=(n,max)=>Number.isFinite(n)?Math.min(max,Math.max(0,n)):0;
        p.earnedAt=date(v.earnedAt);
        if(c.id==='flow'&&Array.isArray(v.channels)&&v.channels.length===3)p.channels=v.channels.map(n=>n===1?1:0);
        if(c.id==='emergence')p.level=clamp(v.level,100);
        if(saved.version===3){
          if(c.id==='flow')p.runoff=flowConnected(p)?clamp(v.runoff,1):0;
          if(c.id==='dissolution'){p.charged=v.charged===true;p.elapsed=p.charged?clamp(v.elapsed,8):0;}
          if(c.id==='emergence')p.exposure=p.level>=65?clamp(v.exposure,4):0;
          if(c.id==='deposition'){p.sequence=Number.isInteger(v.sequence)&&v.sequence>=0&&v.sequence<=9?v.sequence:0;p.fraction=p.sequence<9?clamp(v.fraction,1):0;p.running=p.sequence<9&&(v.running===true||p.sequence%3!==0);}
          p.won=v.won===true&&!!p.earnedAt;
          if(c.id==='deposition'&&p.sequence===9&&!p.earnedAt){p.sequence=0;p.fraction=0;p.running=false;}
        }else if(v.won===true&&p.earnedAt){
          p.won=true;
          if(c.id==='flow'){p.channels=[1,0,1];p.runoff=1;}
          if(c.id==='dissolution'){p.charged=true;p.elapsed=8;}
          if(c.id==='emergence'){p.level=Math.max(65,p.level);p.exposure=4;}
          if(c.id==='deposition')p.sequence=9;
        }
      }
      if(CHAPTERS.every(c=>s.chapters[c.id].earnedAt))s.chapterBadgeAt=date(saved.chapterBadgeAt)||CHAPTERS.map(c=>s.chapters[c.id].earnedAt).sort().at(-1);
    }
    return s;
  }
  return {create,arrive,depart,advanceGame,setGrowth,restartGame,restore,CHAPTERS,checkIn,isChapterUnlocked,playChapter,resetChapter,tickChapter};
});
