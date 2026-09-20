const {test}=require('node:test');
const assert=require('node:assert/strict');
test('animation first frame cannot move backwards when RAF predates scheduling',async()=>{
  const {frameDelta}=await import('../src/water-timing.mjs');
  assert.equal(frameDelta(554,555.1),0);
  assert.equal(frameDelta(15000,10),.05);
  assert.equal(frameDelta(10,null),0);
  assert.equal(frameDelta(1016,1000),.016);
});
test('landscape remains finite through every chapter and a long running session',async()=>{
  const {createLandscape}=await import('../src/water-landscape.mjs');
  const model=createLandscape();
  for(const time of [0,.016,60,10000])for(let stage=0;stage<4;stage++){
    model.update(time,stage,stage/3);
    model.root.traverse(o=>{for(const n of [o.position.x,o.position.y,o.position.z,o.scale.x,o.scale.y,o.scale.z])assert.ok(Number.isFinite(n));});
  }
  let triangles=0;model.root.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});
  assert.ok(triangles<15000,'mobile miniature must stay within its geometry budget');
  model.dispose();
});
test('unavailable WebGL leaves a null scene so every story control can safely continue',async()=>{
  global.window={matchMedia:()=>({matches:false})};global.document={createElementNS(){throw Error('WebGL unavailable');}};
  try{
    await import('../src/water-scene.mjs');
    const host={dataset:{}};const scene=window.HuanglongWaterScene.mount(host);
    assert.equal(host.dataset.renderState,'fallback');
    assert.equal(scene,null);
    assert.doesNotThrow(()=>{scene?.setChapter('emergence',{level:80},true);scene?.rotate(1);scene?.zoom(1);scene?.reset();scene?.pause(true);scene?.dispose();});
  }finally{delete global.window;delete global.document;}
});
test('four distinct process scenes keep finite geometry and bounded mobile complexity',async()=>{
  const {createProcessScene,PROCESS_IDS}=await import('../src/water-processes.mjs');
  const names=new Set();
  for(const id of PROCESS_IDS){
    const model=createProcessScene(id);names.add(model.root.name);assert.equal((model.markers||[]).length,0,'numbered scene labels have been removed');
    for(const t of [0,.016,60,10000])for(const p of [{},{channels:[1,0,1],runoff:1,charged:true,elapsed:8,level:100,exposure:4,sequence:9,fraction:0,won:true}]){
      model.update(t,p);model.root.traverse(o=>{for(const n of [...o.position.toArray(),...o.scale.toArray()])assert.ok(Number.isFinite(n));});
    }
    let triangles=0;model.root.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));}});
    assert.ok(triangles<18000,id+' exceeds mobile triangle budget');model.dispose();
  }
  assert.equal(names.size,4);assert.throws(()=>createProcessScene('unknown'));
});
test('winning water directions connect the next visible downhill junction',async()=>{
  const {createProcessScene}=await import('../src/water-processes.mjs');const f=require('../follow-state.js');const model=createProcessScene('flow'),s=f.create();f.checkIn(s,'welcome-pond',['welcome-pond']);
  for(const [i,{point,next}] of model.flowGraph.entries()){const target=next[0]<point[0]?1:0;if(target)f.playChapter(s,'flow','turn',i);assert.ok(next[1]<point[1],'next junction must be downhill');}
  for(let i=0;i<45;i++)f.tickChapter(s,'flow',.1);assert.equal(s.chapters.flow.won,true,'model connections and game solution must agree');model.dispose();
});
