const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function load(){
  const context=vm.createContext({window:{},console});
  for(const file of ['data/scenic.js','data/facilities.js','map.js','app.js']){
    const full=path.join(__dirname,'..',file);
    if(!fs.existsSync(full))continue;
    let source=fs.readFileSync(full,'utf8');
    if(file==='app.js')source=source.replace(/bindEvents\(\);\s*renderAll\(\);\s*$/,'');
    vm.runInContext(source,context);
  }
  vm.runInContext('globalThis.api={POIS,getPoi,getMapPois,extractPoiCandidates,buildPlan,filteredScenicPois:typeof filteredScenicPois==="function"?filteredScenicPois:null,appState}',context);
  return context.api;
}
test('scenic expansion resolves common aliases to one itinerary stop',()=>{
  const api=load();
  for(const [query,id] of [['娑萝映彩池','suoluo-pond'],['明镜倒映池','mirror-pond'],['黄龙后寺','huanglong-ancient-temple'],['飞瀑流辉','flying-waterfall'],['盆景池','bonsai-pond'],['接仙桥','immortal-bridge'],['黄龙洞','huanglong-cave']]){
    const found=api.extractPoiCandidates(query).filter(p=>p.poi.kind==='scenic');
    assert.equal(found.length,1,query+' should resolve without alias collisions');
    assert.equal(found[0].poi.id,id);
  }
});
test('every scenic detail survives map merging with sources and readable content',()=>{
  const api=load(),scenic=api.POIS.filter(p=>p.kind==='scenic');
  assert.ok(scenic.length>=14);
  for(const poi of scenic){
    const detail=api.getPoi(poi.id);
    assert.equal(detail.introduction,poi.introduction);
    assert.ok(detail.story?.length>=2,poi.id+' needs more than a summary');
    assert.ok(detail.story.join('').length>=120,poi.id+' needs substantive detail');
    assert.ok(detail.photoTip?.length>15);
    assert.ok(detail.sources?.length>0);
    for(const source of detail.sources)assert.equal(new URL(source.url).protocol,'https:');
    assert.ok(Number.isFinite(detail.routeOrder));
  }
  assert.match(api.getPoi('bonsai-pond').coordinateNote,/参考/);
  assert.match(api.getPoi('huanglong-cave').tip,/开放|洞口/);
  assert.equal(new Set(api.getMapPois().map(p=>p.id)).size,api.getMapPois().length);
});
test('discovery filters aliases and can show only selected scenic places',()=>{
  const api=load();
  assert.equal(typeof api.filteredScenicPois,'function','discovery should support filtering');
  api.appState.discoverQuery='后寺';
  api.appState.discoverCategory='all';
  assert.deepEqual(Array.from(api.filteredScenicPois(),p=>p.id),['huanglong-ancient-temple']);
  api.appState.discoverQuery='';api.appState.discoverCategory='selected';
  assert.ok(api.filteredScenicPois().every(p=>api.appState.selectedPoiIds.has(p.id)));
  api.appState.discoverCategory='waterfall';
  assert.ok(api.filteredScenicPois().some(p=>p.id==='flying-waterfall'));
  assert.ok(!api.filteredScenicPois().some(p=>p.id==='five-color-pond'));
});
test('expanded itinerary keeps completed stops when time is shortened',()=>{
  const api=load(),ids=new Set(['flying-waterfall','bonsai-pond','suoluo-pond','immortal-bridge','huanglong-cave','five-color-pond']);
  const plan=api.buildPlan(ids,{hours:4.5,pace:'平衡',cableCar:false,shortageMinutes:110},new Set(['flying-waterfall']));
  assert.ok(plan.included.some(p=>p.id==='flying-waterfall'));
  assert.ok(plan.deferred.length>0);
  const order=Array.from(plan.included,p=>p.routeOrder);
  assert.deepEqual(order,[...order].sort((a,b)=>a-b));
});
