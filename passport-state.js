(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./data/passport.js'));else root.HuanglongPassport=factory(root.HuanglongPassportData);})(typeof window==='undefined'?globalThis:window,D=>{
  const uid=()=>globalThis.crypto?.randomUUID?.()||'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,9);
  const text=(v,max)=>typeof v==='string'?v.slice(0,max):'';
  const date=()=>{const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;};
  const validDate=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\d$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const blankPage=()=>({id:uid(),title:'把这一眼，留在纸上',date:date(),note:'',paper:'ivory',items:[]});
  const create=()=>({version:1,profile:{name:'山水旅人',theme:'gentle'},observations:{},pages:[blankPage()]});
  const hasArrival=(stamps,id)=>typeof stamps?.[id]==='string'&&/^\d{4}-\d\d-\d\dT/.test(stamps[id])&&Number.isFinite(Date.parse(stamps[id]));
  const unlocked=(id,stamps)=>D.experiments.find(e=>e.id===id)?.poiIds.some(p=>hasArrival(stamps,p))||false;
  const full=(s,e)=>e.goals.every(g=>s.observations[e.id]?.includes(g.id));
  const validId=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(v);
  function experimentView(id,v){
    const e=D.experiments.find(e=>e.id===id);
    if(!e||id==='pool'||!v||e.controls.some(c=>!Number.isFinite(v[c.id])||v[c.id]<0||v[c.id]>100))return null;
    if(id==='color'){
      const goal=v.clarity<=35?'turbid':v.clarity>=70?(v.depth<=35?'shallow':v.depth>=75?'deep':null):null;
      return {goal,depth:v.depth/100,clarity:v.clarity/100,caption:goal==='turbid'?'悬浮物遮住了池底，透明度降低。':v.depth>=75?'水更深，光在水中经过的路程变长。':'浅水中，明亮的池底更容易被看见。'};
    }
    if(id==='flow'){
      const goal=v.supply===0?'dry':v.supply>=30&&v.supply<=60?(v.slope<=30?'film':v.slope>=70?'fall':null):null;
      return {goal,slope:v.slope/100,supply:v.supply/100,caption:v.supply===0?'来水停止了，钙华岩面仍然留下。':v.slope>=70?'落差更集中，水沿陡坡形成跌落。':'缓坡上的水展开成薄薄一层。'};
    }
    const goal=v.release<=25&&v.time>=70?'retained':v.release>=75?(v.time<=20?'early':v.time>=70?'layered':null):null;
    return {goal,growth:Math.max(0,(v.release-30)/70)*v.time/100,gas:v.release/100,caption:goal==='retained'?'这个示意条件下，仅延长时间没有出现明显薄层。':v.time<=20?'CO₂ 开始逸出，可见的薄层尚未积累。':'适当条件下，碳酸钙析出并逐渐积成薄层。'};
  }
  function sample(s,id,v,stamps){
    const view=experimentView(id,v),e=D.experiments.find(e=>e.id===id);
    if(!view)return {status:'invalid'};
    if(!unlocked(id,stamps))return {status:'practice',message:'这是预习。到关联景点确认到达后，再记录观察即可收集贴纸。'};
    if(!view.goal)return {status:'explore',message:'这一刻也值得观察；试着按下方提示，留下一种新的对照。'};
    const notes=s.observations[id]||(s.observations[id]=[]);
    if(notes.includes(view.goal))return {status:'duplicate',message:'这类观察已收好，换一个条件看看。'};
    notes.push(view.goal);const earned=full(s,e);
    return {status:earned?'earned':'recorded',message:earned?`三种观察已集齐，收下「${e.reward}」贴纸。`:`已记下「${e.goals.find(g=>g.id===view.goal).label}」。再改变一个条件。`};
  }
  const POOL_GOALS=['connected','low-water','rim-grown'];
  function recordPoolObservation(s,goals,stamps){
    if(!unlocked('pool',stamps))return {status:'practice',message:'这是预习。到关联景点确认到达后，再记录池群观察即可收集贴纸。'};
    const known=(Array.isArray(goals)?goals:[]).filter(g=>POOL_GOALS.includes(g));
    const notes=s.observations.pool||(s.observations.pool=[]),newGoals=[...new Set(known)].filter(g=>!notes.includes(g));
    if(!newGoals.length)return {status:known.length?'duplicate':'explore',message:known.length?'这类池群观察已收好，继续改变条件看看。':'这一刻已留在观察记录里，继续推演看看池群如何变化。'};
    notes.push(...newGoals);const earned=POOL_GOALS.every(g=>notes.includes(g));
    return {status:earned?'earned':'recorded',message:earned?'三类池群观察已集齐，收下「池群观察者」贴纸。':`记下 ${newGoals.length} 类新发现。继续观察水路、退水和池沿的变化。`};
  }
  function inventory(s,stamps){return [
    ...D.places.filter(p=>hasArrival(stamps,p.id)).map(p=>({id:'stamp:'+p.id,kind:'stamp',title:p.name,src:'assets/passport/'+p.id+'.svg'})),
    ...D.experiments.filter(e=>unlocked(e.id,stamps)&&full(s,e)).map(e=>({id:'sticker:'+e.id,kind:'sticker',title:e.reward,src:'assets/passport/sticker-'+e.id+'.svg'})),
    ...milestones(s,stamps).filter(t=>t.earned).map(t=>({id:'badge:'+t.id,kind:'badge',title:t.reward,src:'assets/passport/badge-'+t.id+'.svg'}))
  ];}
  function milestones(s,stamps){const n=D.places.filter(p=>hasArrival(stamps,p.id)).length,labs=D.experiments.filter(e=>unlocked(e.id,stamps)&&full(s,e)).length;return D.themes.map(t=>({...t,count:n,labCount:labs,earned:n>=t.need&&labs>=t.labs}));}
  function updateProfile(s,v){s.profile.name=text(v.name??s.profile.name,20);if(D.themes.some(t=>t.id===v.theme))s.profile.theme=v.theme;}
  function addPage(s){if(s.pages.length>=12)return null;const page=blankPage();s.pages.push(page);return page;}
  function updatePage(s,id,v){const p=s.pages.find(p=>p.id===id);if(!p)return false;if('title'in v)p.title=text(v.title,32);if('note'in v)p.note=text(v.note,320);if(validDate(v.date))p.date=v.date;if(['ivory','mineral','night'].includes(v.paper))p.paper=v.paper;return true;}
  // x/y are centers inside the illustration area; an item stays within its edges even at 30 degrees.
  function normalizeItem(i){const size=clamp(Number.isFinite(i.size)?i.size:28,16,42),mx=size*.7,my=mx*640/480;return {id:validId(i.id)?i.id:uid(),art:i.art,size,rotation:clamp(Number.isFinite(i.rotation)?i.rotation:0,-30,30),x:clamp(Number.isFinite(i.x)?i.x:50,mx,100-mx),y:clamp(Number.isFinite(i.y)?i.y:50,my,100-my)};}
  function addItem(s,pageId,art,stamps){const page=s.pages.find(p=>p.id===pageId);if(!page||page.items.length>=6||!inventory(s,stamps).some(a=>a.id===art))return null;const i=normalizeItem({id:uid(),art,x:30+(page.items.length%2)*40,y:25+Math.floor(page.items.length/2)*25,size:28,rotation:page.items.length%2?5:-5});page.items.push(i);return i;}
  function moveItem(s,pageId,id,v){const i=s.pages.find(p=>p.id===pageId)?.items.find(i=>i.id===id);if(!i||Object.keys(v).some(k=>!['x','y','rotation','size'].includes(k)||!Number.isFinite(v[k])))return false;Object.assign(i,normalizeItem({...i,...v}));return true;}
  function removeItem(s,pageId,id){const p=s.pages.find(p=>p.id===pageId);if(!p)return false;const n=p.items.length;p.items=p.items.filter(i=>i.id!==id);return n!==p.items.length;}
  function removePage(s,id){if(s.pages.length<=1)return false;const n=s.pages.length;s.pages=s.pages.filter(p=>p.id!==id);return n!==s.pages.length;}
  function restore(raw){
    const s=create();let v;try{v=JSON.parse(raw);}catch{return s;}if(!v||Array.isArray(v)||v.version!==1)return s;
    if(v.profile&&typeof v.profile==='object')updateProfile(s,v.profile);
    for(const e of D.experiments){const list=v.observations?.[e.id];if(Array.isArray(list))s.observations[e.id]=e.goals.map(g=>g.id).filter(id=>list.includes(id));}
    const known=[...D.places.map(p=>'stamp:'+p.id),...D.experiments.map(e=>'sticker:'+e.id),...D.themes.map(t=>'badge:'+t.id)];
    if(Array.isArray(v.pages)&&v.pages.length){
      const ids=new Set();s.pages=[];
      for(const value of v.pages.filter(p=>p&&typeof p==='object').slice(0,12)){
        const p=blankPage();if(validId(value.id)&&!ids.has(value.id))p.id=value.id;ids.add(p.id);s.pages.push(p);updatePage(s,p.id,value);
        const itemIds=new Set();p.items=(Array.isArray(value.items)?value.items:[]).filter(i=>i&&known.includes(i.art)).slice(0,6).map(i=>{const next=normalizeItem(i);if(itemIds.has(next.id))next.id=uid();itemIds.add(next.id);return next;});
      }
      if(!s.pages.length)s.pages=[blankPage()];
    }
    return s;
  }
  return {create,restore,hasArrival,unlocked,experimentView,sample,recordPoolObservation,inventory,milestones,updateProfile,addPage,updatePage,addItem,moveItem,removeItem,removePage};
});
