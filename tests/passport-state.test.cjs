const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
function api(){const file=path.join(__dirname,'../passport-state.js');assert.ok(fs.existsSync(file),'passport state must be implemented');return require(file);}
const arrivals={'five-color-pond':'2026-10-08T00:00:00Z','jinsha-pudi':'2026-10-08T00:00:00Z'};
test('practice cannot unlock collections and duplicate observations never add rewards',()=>{
  const p=api(),s=p.create();
  assert.equal(p.sample(s,'color',{depth:20,clarity:90},{}).status,'practice');
  assert.deepEqual(s.observations,{});
  assert.equal(p.sample(s,'color',{depth:20,clarity:90},arrivals).status,'recorded');
  assert.equal(p.sample(s,'color',{depth:20,clarity:90},arrivals).status,'duplicate');
  assert.equal(p.inventory(s,arrivals).filter(x=>x.kind==='sticker').length,0);
  p.sample(s,'color',{depth:85,clarity:90},arrivals);
  assert.equal(p.sample(s,'color',{depth:85,clarity:20},arrivals).status,'earned');
  assert.equal(p.inventory(s,arrivals).filter(x=>x.kind==='sticker').length,1);
  assert.equal(p.sample(s,'color',{depth:85,clarity:20},arrivals).status,'duplicate');
  assert.equal(p.inventory(s,{}).length,0,'no local experiment can invent a place arrival');
});
test('experiments require distinct causal observations and finite in-range input',()=>{
  const p=api(),s=p.create();
  for(const values of [{depth:NaN,clarity:80},{depth:200,clarity:80},{depth:20},{depth:'20',clarity:80}])assert.equal(p.sample(s,'color',values,arrivals).status,'invalid');
  assert.equal(p.sample(s,'flow',{slope:20,supply:45},arrivals).status,'recorded');
  assert.equal(p.sample(s,'flow',{slope:80,supply:45},arrivals).status,'recorded');
  assert.equal(p.sample(s,'flow',{slope:80,supply:0},arrivals).status,'earned');
  p.sample(s,'mineral',{release:0,time:90},arrivals);
  p.sample(s,'mineral',{release:90,time:10},arrivals);
  assert.equal(p.sample(s,'mineral',{release:90,time:90},arrivals).status,'earned');
  assert.equal(p.experimentView('mineral',{release:0,time:100}).growth,0);
  assert.ok(p.experimentView('mineral',{release:90,time:90}).growth>.6);
});
test('theme completion counts distinct scenic places and never facilities or practice',()=>{
  const p=api(),s=p.create();
  assert.equal(p.milestones(s,arrivals).find(x=>x.id==='gentle').earned,true);
  assert.equal(p.milestones(s,arrivals).find(x=>x.id==='observer').earned,false);
  assert.equal(p.milestones(s,{'visitor-center':arrivals['five-color-pond']}).some(x=>x.earned),false);
  p.sample(s,'color',{depth:20,clarity:90},arrivals);p.sample(s,'color',{depth:85,clarity:90},arrivals);p.sample(s,'color',{depth:85,clarity:20},arrivals);
  assert.equal(p.milestones(s,arrivals).find(x=>x.id==='observer').earned,true);
  assert.ok(p.inventory(s,arrivals).some(x=>x.id==='badge:observer'),'completed theme is a usable notebook collectible');
});
test('notebook allows only owned art, bounds transforms and preserves personal edits on reload',()=>{
  const p=api(),s=p.create(),page=s.pages[0];
  assert.equal(p.addItem(s,page.id,'stamp:flying-waterfall',arrivals),null);
  const item=p.addItem(s,page.id,'stamp:five-color-pond',arrivals);
  assert.ok(item);
  assert.equal(p.moveItem(s,page.id,item.id,{x:Infinity,y:NaN}),false);
  p.moveItem(s,page.id,item.id,{x:400,y:-90,size:1000,rotation:700});
  assert.ok(item.x<=100&&item.y>=0&&item.size<=42&&item.rotation<=30);
  p.updatePage(s,page.id,{title:'水与时间',note:'池沿在光下像一条细线。',paper:'mineral',date:'2026-10-08'});
  const restored=p.restore(JSON.stringify(s));
  assert.equal(restored.pages[0].note,'池沿在光下像一条细线。');assert.equal(restored.pages[0].items.length,1);
  assert.equal(restored.pages[0].title,'水与时间');
  assert.equal(p.removeItem(s,page.id,item.id),true);
  assert.equal(p.removeItem(s,page.id,item.id),false);
});
test('corrupted or oversized storage is normalized without affecting legacy arrivals',()=>{
  const p=api();
  for(const raw of ['broken','[]','null','{"version":99}'])assert.equal(p.restore(raw).pages.length,1);
  const s=p.restore(JSON.stringify({version:1,profile:{name:'a'.repeat(90),theme:'unknown'},observations:{color:['shallow','shallow','invented'],bad:['x']},pages:[{id:'a',title:'x'.repeat(200),items:[{id:'b',art:'unknown',x:100000,y:null,size:3}],note:'n'.repeat(10000)}]}));
  assert.ok(s.profile.name.length<=20);assert.equal(s.profile.theme,'gentle');assert.deepEqual(s.observations.color,['shallow']);
  assert.ok(s.pages[0].title.length<=32&&s.pages[0].note.length<=320);assert.equal(s.pages[0].items.length,0);
  assert.deepEqual(p.inventory(s,{'five-color-pond':'not a date','welcome-pond':true}),[]);
  for(let n=0;n<20;n++)p.addPage(s);
  assert.equal(s.pages.length,12);
});

test('notebook identity is safe for DOM selectors and rotated art stays in its drawing area',()=>{
  const p=api(),s=p.restore(JSON.stringify({version:1,pages:[{id:'bad"id',items:[{id:'bad]"id',art:'stamp:five-color-pond',size:42,rotation:30,x:0,y:100}]}]}));
  assert.match(s.pages[0].id,/^[a-zA-Z0-9_-]+$/);
  const item=s.pages[0].items[0];assert.match(item.id,/^[a-zA-Z0-9_-]+$/);
  assert.ok(item.y<=100-item.size*.7*640/480,'vertical bounds account for the rectangular drawing area');
});
