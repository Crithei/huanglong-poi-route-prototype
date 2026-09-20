(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HuanglongJournal=api;})(typeof window==='undefined'?globalThis:window,()=>{
  const preferences=()=>({hours:6,pace:'平衡',cableCar:false,shortageMinutes:0});
  const create=()=>({version:1,selected:null,preferences:preferences(),arrived:null,completed:[],stamps:{},gameStep:0,growth:0,waterBadge:false,waterBadgeAt:null});
  function arrive(s,id,allowed){if(!allowed.includes(id)||s.completed.includes(id)||s.arrived===id)return false;s.arrived=id;if(!s.stamps[id])s.stamps[id]=new Date().toISOString();return true;}
  function depart(s,id){if(s.arrived!==id||s.completed.includes(id))return false;s.completed.push(id);s.arrived=null;return true;}
  function advanceGame(s,expected){if(s.gameStep!==expected||expected<0||expected>=3||(expected===2&&s.growth<1))return false;s.gameStep++;if(s.gameStep===3){s.waterBadge=true;s.waterBadgeAt=s.waterBadgeAt||new Date().toISOString();}return true;}
  function setGrowth(s,value){if(s.gameStep!==2||!Number.isFinite(value))return false;s.growth=Math.min(1,Math.max(0,value));return true;}
  function restartGame(s){s.gameStep=0;s.growth=0;}
  function restore(raw,allowed){
    const s=create();let saved;try{saved=JSON.parse(raw);}catch{return s;}
    if(!saved||Array.isArray(saved)||saved.version!==1)return s;
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
    return s;
  }
  return {create,arrive,depart,advanceGame,setGrowth,restartGame,restore};
});
