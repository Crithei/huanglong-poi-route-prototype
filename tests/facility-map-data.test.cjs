const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
function load(){
 const context=vm.createContext({window:{},console});
 for(const file of ['data/facilities.js','map.js','app.js']){
  let source=fs.readFileSync(path.join(root,file),'utf8');
  if(file==='app.js')source=source.replace(/bindEvents\(\);\s*renderAll\(\);\s*$/,'');
  vm.runInContext(source,context);
 }
 vm.runInContext('globalThis.api={getMapPois,search:(query,category="all")=>{mapUi.query=query;mapUi.category=category;return filteredMapPois();}}',context);
 return context.api;
}
test('new source data preserves existing names and aliases in search',()=>{
 const api=load();
 for(const query of ['黄龙游客中心','景区游客中心'])assert.ok(api.search(query).some(p=>p.id==='visitor-center'),query);
 assert.equal(new Set(api.getMapPois().map(p=>p.id)).size,api.getMapPois().length,'legacy ids must merge without duplicates');
});
test('facility categories find toilets and cross-listed medical support',()=>{
 const api=load();
 assert.ok(api.search('争艳','toilet').some(p=>p.name==='争艳池厕所'));
 assert.equal(api.search('争艳','toilet').some(p=>p.kind==='scenic'),false);
 assert.ok(api.search('马蹄海','medical').some(p=>p.name.includes('医疗巡回点')));
 assert.ok(api.getMapPois().find(p=>p.name==='黄龙索道下站').entranceLocation?.length===2);
});
