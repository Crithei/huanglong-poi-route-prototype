(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HuanglongJournal=api;})(typeof window==='undefined'?globalThis:window,()=>{
  const preferences=()=>({hours:6,pace:'平衡',cableCar:false,shortageMinutes:0});
  const CHAPTERS=Object.freeze([
    {id:'flow',label:'水流',title:'顺着山势，找到一条水路',poiIds:['jinsha-pudi','welcome-pond'],icon:'route',reward:'循流者'},
    {id:'dissolution',label:'溶解',title:'走进岩层，带上山的礼物',poiIds:['wash-body-viewpoint'],icon:'gem',reward:'岩层探访者'},
    {id:'emergence',label:'出露',title:'穿过裂隙，重新遇见天空',poiIds:['flying-waterfall','liantai-fall'],icon:'waves',reward:'寻泉者'},
    {id:'deposition',label:'沉积',title:'留下微小的一层，长成彩池',poiIds:['five-color-pond','zhengyan-chi','bonsai-pond'],icon:'layers',reward:'彩池营造者'},
  ].map(c=>Object.freeze({...c,poiIds:Object.freeze(c.poiIds)})));
  const blankChapter=id=>({won:false,earnedAt:null,...({flow:{channels:[0,0,0]},dissolution:{charged:false,sites:[]},emergence:{outlet:0,level:0},deposition:{rim:0,layers:[0,0,0]}}[id])});
  const create=()=>({version:2,selected:null,preferences:preferences(),arrived:null,completed:[],stamps:{},gameStep:0,growth:0,waterBadge:false,waterBadgeAt:null,activeChapter:'flow',chapters:Object.fromEntries(CHAPTERS.map(c=>[c.id,blankChapter(c.id)])),chapterBadgeAt:null});
  function checkIn(s,id,allowed){if(!allowed.includes(id)||s.stamps[id])return false;s.stamps[id]=new Date().toISOString();return true;}
  function arrive(s,id,allowed){if(!allowed.includes(id)||s.completed.includes(id)||s.arrived===id)return false;s.arrived=id;checkIn(s,id,allowed);return true;}
  const isChapterUnlocked=(s,id)=>!!CHAPTERS.find(c=>c.id===id)?.poiIds.some(p=>s.stamps[p]);
  const solved=(id,p)=>id==='flow'?p.channels.every((v,i)=>v===[1,0,1][i]):id==='dissolution'?p.charged&&p.sites.length===3:id==='emergence'?p.outlet===1&&p.level>=65:id==='deposition'?p.layers.every(v=>v===1):false;
  function resetChapter(s,id){if(!isChapterUnlocked(s,id))return false;const earnedAt=s.chapters[id].earnedAt;s.chapters[id]={...blankChapter(id),earnedAt};return true;}
  function playChapter(s,id,action,value){
    const result=(ok,message,completed=false,earned=false)=>({ok,message,completed,earned});
    if(!isChapterUnlocked(s,id))return result(false,'到关联景点打卡后，才能开始本章。');
    const p=s.chapters[id],index=Number.isInteger(value)&&value>=0&&value<3;
    if(action==='finish'){
      if(!solved(id,p))return result(false,({flow:'水道还没接通：从上往下，找到左、右、左三个低处。',dissolution:'先让水带上二氧化碳，再观察三处岩石的变化。',emergence:'选择中间的开放裂隙，让水位超过 65% 的出口标线。',deposition:'三处池沿都需要经历足够的水流与时间。'})[id]);
      const earned=!p.earnedAt;p.won=true;p.earnedAt=p.earnedAt||new Date().toISOString();
      if(CHAPTERS.every(c=>s.chapters[c.id].earnedAt))s.chapterBadgeAt=s.chapterBadgeAt||new Date().toISOString();
      return result(true,'本章完成，收下「'+CHAPTERS.find(c=>c.id===id).reward+'」印记。',true,earned);
    }
    if(p.won)return result(false,'本章已经完成，可以重新体验。');
    if(id==='flow'&&action==='turn'&&index){p.channels[value]=1-p.channels[value];return result(true,'水槽已转向，浅色箭头指向下一段低处。');}
    if(id==='dissolution'&&action==='charge'){p.charged=true;return result(true,'含二氧化碳的水进入裂隙。现在观察 ①②③ 三处溶解点。');}
    if(id==='dissolution'&&action==='observe'&&index&&p.charged){if(!p.sites.includes(value))p.sites.push(value);return result(true,'岩石中的一部分物质进入水中。亮点是溶解物示意，不是岩石碎块。');}
    if(id==='emergence'&&action==='outlet'&&index){p.outlet=value;return result(true,value===1?'这条裂隙连通地表，试着提升水位。':'这条支路被岩层阻挡，寻找能通向地表的裂隙。');}
    if(id==='emergence'&&action==='level'&&typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=100){p.level=value;return result(true,value>=65&&p.outlet===1?'水已从出口出露；来到地表后，二氧化碳也可以逐渐逸出。':'地下水位正在变化，水位到达开放出口后才能出流。');}
    if(id==='deposition'&&action==='rim'&&index){p.rim=value;return result(true,'已选择池沿 '+(value+1)+'，推演多轮水流留下的沉积。');}
    if(id==='deposition'&&action==='time'&&typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=100){p.layers[p.rim]=Math.max(p.layers[p.rim],value/100);return result(true,'沉积物正在累积。换一处池沿，看看彩池怎样慢慢长成。');}
    return result(false,'这一步暂时不能进行。');
  }
  function depart(s,id){if(s.arrived!==id||s.completed.includes(id))return false;s.completed.push(id);s.arrived=null;return true;}
  function advanceGame(s,expected){if(s.gameStep!==expected||expected<0||expected>=3||(expected===2&&s.growth<1))return false;s.gameStep++;if(s.gameStep===3){s.waterBadge=true;s.waterBadgeAt=s.waterBadgeAt||new Date().toISOString();}return true;}
  function setGrowth(s,value){if(s.gameStep!==2||!Number.isFinite(value))return false;s.growth=Math.min(1,Math.max(0,value));return true;}
  function restartGame(s){s.gameStep=0;s.growth=0;}
  function restore(raw,allowed){
    const s=create();let saved;try{saved=JSON.parse(raw);}catch{return s;}
    if(!saved||Array.isArray(saved)||![1,2].includes(saved.version))return s;
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
    if(saved.version===2){
      const date=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT/.test(v)&&Number.isFinite(Date.parse(v))?v:null;
      if(CHAPTERS.some(c=>c.id===saved.activeChapter))s.activeChapter=saved.activeChapter;
      for(const c of CHAPTERS){
        const v=saved.chapters?.[c.id],p=s.chapters[c.id];if(!v||!isChapterUnlocked(s,c.id))continue;
        if(c.id==='flow'&&Array.isArray(v.channels)&&v.channels.length===3)p.channels=v.channels.map(n=>n===1?1:0);
        if(c.id==='dissolution'){p.charged=v.charged===true;p.sites=p.charged&&Array.isArray(v.sites)?[...new Set(v.sites.filter(n=>Number.isInteger(n)&&n>=0&&n<3))]:[];}
        if(c.id==='emergence'){p.outlet=Number.isInteger(v.outlet)&&v.outlet>=0&&v.outlet<3?v.outlet:0;p.level=Number.isFinite(v.level)?Math.min(100,Math.max(0,v.level)):0;}
        if(c.id==='deposition'){p.rim=Number.isInteger(v.rim)&&v.rim>=0&&v.rim<3?v.rim:0;if(Array.isArray(v.layers)&&v.layers.length===3)p.layers=v.layers.map(n=>Number.isFinite(n)?Math.min(1,Math.max(0,n)):0);}
        p.won=v.won===true&&solved(c.id,p);p.earnedAt=date(v.earnedAt);
        if(p.won&&!p.earnedAt)p.won=false;
      }
      if(CHAPTERS.every(c=>s.chapters[c.id].earnedAt))s.chapterBadgeAt=date(saved.chapterBadgeAt)||CHAPTERS.map(c=>s.chapters[c.id].earnedAt).sort().at(-1);
    }
    return s;
  }
  return {create,arrive,depart,advanceGame,setGrowth,restartGame,restore,CHAPTERS,checkIn,isChapterUnlocked,playChapter,resetChapter};
});
