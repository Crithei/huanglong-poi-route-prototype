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
    assert.doesNotThrow(()=>{scene?.setStage(2);scene?.setGrowth(1);scene?.rotate(1);scene?.zoom(1);scene?.reset();scene?.pause(true);scene?.dispose();});
  }finally{delete global.window;delete global.document;}
});
