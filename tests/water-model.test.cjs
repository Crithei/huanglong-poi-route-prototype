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
    assert.doesNotThrow(()=>{scene?.setChapter('emergence',{outlet:1,level:80},true);scene?.rotate(1);scene?.zoom(1);scene?.reset();scene?.pause(true);scene?.dispose();});
  }finally{delete global.window;delete global.document;}
});
test('four distinct process scenes keep finite geometry and bounded mobile complexity',async()=>{
  const {createProcessScene,PROCESS_IDS}=await import('../src/water-processes.mjs');
  const names=new Set();
  for(const id of PROCESS_IDS){
    const model=createProcessScene(id);names.add(model.root.name);assert.equal(model.markers.length,3);
    for(const t of [0,.016,60,10000])for(const p of [{},{channels:[1,0,1],charged:true,sites:[0,1,2],outlet:1,level:100,layers:[1,.3,0],won:true}]){
      model.update(t,p);model.root.traverse(o=>{for(const n of [...o.position.toArray(),...o.scale.toArray()])assert.ok(Number.isFinite(n));});
    }
    let triangles=0;model.root.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));}});
    assert.ok(triangles<16000,id+' exceeds mobile triangle budget');model.dispose();
  }
  assert.equal(names.size,4);assert.throws(()=>createProcessScene('unknown'));
});
test('winning water directions connect the next visible downhill junction',async()=>{
  const {createProcessScene}=await import('../src/water-processes.mjs');const f=require('../follow-state.js');const model=createProcessScene('flow'),s=f.create();f.checkIn(s,'welcome-pond',['welcome-pond']);
  for(const [i,{point,next}] of model.flowGraph.entries()){const target=next[0]<point[0]?1:0;if(target)f.playChapter(s,'flow','turn',i);assert.ok(next[1]<point[1],'next junction must be downhill');}
  assert.equal(f.playChapter(s,'flow','finish').completed,true,'model connections and game solution must agree');model.dispose();
});
test('model touch labels stay inside portrait frames and cannot overlap',async()=>{
  const THREE=await import('three'),{createProcessScene,PROCESS_IDS}=await import('../src/water-processes.mjs'),{layoutPins}=await import('../src/water-pin-layout.mjs');
  for(const id of PROCESS_IDS){const model=createProcessScene(id);
    for(const width of [320,390,480])for(const yaw of [.12,.65,1.2])for(const zoom of [1,1.45]){
      const height=width===320?330:365,camera=new THREE.PerspectiveCamera(34,width/height,.1,80);camera.position.set(10,11.5,15);camera.lookAt(0,1,0);camera.zoom=zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld();model.root.rotation.y=yaw;model.root.updateMatrixWorld();
      const points=model.markers.map(m=>{const v=m.position.clone().applyMatrix4(model.root.matrixWorld).project(camera);return {x:(v.x+1)*width/2,y:(1-v.y)*height/2};});
      const layout=layoutPins(points,width,height);layout.forEach((p,i)=>{assert.ok(p.x>=26&&p.x<=width-26&&p.y>=74&&p.y<=height-82,id+' label outside frame');for(const q of layout.slice(0,i))assert.ok(Math.abs(p.x-q.x)>=48||Math.abs(p.y-q.y)>=48,id+' touch labels overlap');});
    }model.dispose();
  }
});
