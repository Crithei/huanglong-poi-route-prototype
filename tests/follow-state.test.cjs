const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const target=path.join(__dirname,'../follow-state.js');
function api(){assert.ok(fs.existsSync(target),'follow state module must exist');return require(target);}
const ids=['five-color-pond','bonsai-pond','jinsha-pudi'];
test('arrival awards one stamp but completion requires a separate departure',()=>{
  const f=api(),s=f.create();
  assert.equal(f.depart(s,ids[0]),false);
  assert.equal(f.arrive(s,ids[0],ids),true);
  assert.deepEqual(s.completed,[]);
  assert.equal(f.arrive(s,ids[0],ids),false);
  assert.equal(Object.keys(s.stamps).length,1);
  assert.equal(f.depart(s,ids[1]),false);
  assert.equal(f.depart(s,ids[0]),true);
  assert.deepEqual(s.completed,[ids[0]]);
  assert.equal(s.arrived,null);
});
test('game actions cannot skip chapters or award a location stamp',()=>{
  const f=api(),s=f.create();
  assert.equal(f.advanceGame(s,2),false);
  for(let step=0;step<2;step++)assert.equal(f.advanceGame(s,step),true);
  assert.equal(f.advanceGame(s,2),false,'time interaction must be completed first');
  f.setGrowth(s,.5);assert.equal(f.advanceGame(s,2),false);
  f.setGrowth(s,1);assert.equal(f.advanceGame(s,2),true);
  assert.equal(f.advanceGame(s,2),false);
  assert.equal(s.waterBadge,true);
  assert.equal(Object.keys(s.stamps).length,0);
  f.restartGame(s);
  assert.equal(s.gameStep,0);
  assert.equal(s.waterBadge,true);
  assert.equal(f.restore(JSON.stringify(s),ids).waterBadge,true);
  f.advanceGame(s,0);
  assert.equal(f.restore(JSON.stringify(s),ids).waterBadge,true,'replaying must not erase an earned badge after reload');
});
test('a saved journey restores selection, arrival, stamps and completed stops',()=>{
  const f=api(),s=f.create();s.selected=ids;s.preferences={hours:6,pace:'平衡',cableCar:true,shortageMinutes:0};
  f.arrive(s,ids[0],ids);f.depart(s,ids[0]);f.arrive(s,ids[1],ids);
  const restored=f.restore(JSON.stringify(s),ids);
  assert.deepEqual(restored.selected,ids);
  assert.equal(restored.arrived,ids[1]);
  assert.deepEqual(restored.completed,[ids[0]]);
  assert.equal(Object.keys(restored.stamps).length,2);
});
test('corrupt or future saves cannot create invalid stops, preferences or rewards',()=>{
  const f=api();
  for(const raw of ['broken','null','[]','{"version":99}'])assert.deepEqual(f.restore(raw,ids),f.create());
  const s=f.restore(JSON.stringify({version:1,selected:[ids[0],'unknown',ids[0]],arrived:'unknown',completed:['unknown'],stamps:{unknown:'today',[ids[0]]:true},gameStep:99,waterBadge:true,preferences:{hours:-1,pace:'bad',cableCar:'yes',shortageMinutes:Infinity}}),ids);
  assert.deepEqual(s.selected,[ids[0]]);assert.equal(s.arrived,null);assert.deepEqual(s.completed,[]);
  assert.deepEqual(s.stamps,{});assert.equal(s.gameStep,0);assert.equal(s.waterBadge,false);
  assert.equal(s.preferences.hours,6);assert.equal(s.preferences.cableCar,false);
});
