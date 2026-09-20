const {test}=require('node:test');
const assert=require('node:assert/strict');

async function scene(id){return (await import('../src/water-processes.mjs')).createProcessScene(id);}
function named(model,name){const object=model.root.getObjectByName(name);assert.ok(object,'missing '+name);return object;}
function vectors(model){const values=[];model.root.traverse(o=>values.push(...o.position.toArray(),...o.scale.toArray(),...o.rotation.toArray().slice(0,3)));return values;}

test('three physical flow junctions route continuously into the aquifer only when connected',async()=>{
  const model=await scene('flow');
  assert.deepEqual(model.interactables.map(o=>[o.action,o.value]),[['turn',0],['turn',1],['turn',2]]);
  assert.deepEqual(model.flowGraph.map(({point,next})=>next[0]<point[0]?1:0),[1,0,1]);
  model.update(0,{channels:[0,0,0]},0,true);
  assert.equal(named(model,'flow-aquifer-entry').visible,false);
  const source=named(model,'flow-source-particles').children[0],initial=source.position.clone();
  model.update(1,{channels:[0,0,0]},0,true);assert.ok(source.position.distanceTo(initial)>.05,'source always flows');
  model.update(1,{channels:[1,0,1],runoff:1,won:true},0,true);
  assert.equal(named(model,'flow-aquifer-entry').visible,true);
  const water=named(model,'flow-aquifer-particles').children[0],before=water.position.clone();
  model.update(3,{channels:[1,0,1],runoff:1,won:true},0,true);
  assert.ok(water.position.distanceTo(before)>.05,'aquifer entry keeps flowing after winning');
  model.update(4,{channels:[1,1,1],runoff:0},0,true);
  assert.equal(named(model,'flow-aquifer-entry').visible,false);model.dispose();
});

test('CO2 charge automatically dissolves rocks over time and releases carried solute',async()=>{
  const model=await scene('dissolution');assert.ok(model.dropTarget?.isObject3D);assert.deepEqual(model.markers,[]);
  model.update(0,{charged:false,elapsed:0},0,true);
  assert.equal(named(model,'dissolution-stream').visible,false);
  const rocks=[0,1,2].map(i=>named(model,'dissolving-limestone-'+i));const start=rocks.map(o=>o.scale.x);
  model.update(4,{charged:true,elapsed:4},0,true);
  assert.equal(named(model,'dissolution-stream').visible,true);
  assert.ok(rocks[0].scale.x<start[0]);assert.ok(rocks[1].scale.x<start[1]);assert.equal(rocks[2].scale.x,start[2]);
  model.update(8,{charged:true,elapsed:8,won:true},0,true);
  rocks.forEach((o,i)=>assert.ok(o.scale.x<start[i]*.6));
  const solute=named(model,'dissolved-minerals-2');assert.equal(solute.visible,true);
  const position=solute.children[0].position.clone();model.update(9,{charged:true,elapsed:8,won:true},0,true);
  assert.ok(solute.children[0].position.distanceTo(position)>.01);model.dispose();
});

test('mountain spring responds only to water table crossing 65 and continues after completion',async()=>{
  const model=await scene('emergence');assert.deepEqual(model.interactables,[]);assert.deepEqual(model.markers,[]);
  assert.ok(named(model,'mountain-cutaway'));const spring=named(model,'emergence-spring'),table=named(model,'emergence-water-table');
  model.update(0,{level:64,exposure:0},0,true);assert.equal(spring.visible,false);const low=table.position.y;
  model.update(0,{level:65,exposure:0},0,true);assert.equal(spring.visible,true);assert.ok(table.position.y>low);
  const particles=named(model,'emergence-spring-particles'),before=particles.children[0].position.clone();
  model.update(1,{level:100,exposure:4,won:true},0,true);assert.equal(spring.visible,true);assert.ok(particles.children[0].position.distanceTo(before)>.01);
  assert.equal(named(model,'emergence-co2-bubbles').visible,true);
  model.update(2,{level:0,exposure:4,won:true},0,true);assert.equal(spring.visible,false);model.dispose();
});

test('normal animation eases rotation, rock shrinkage and water-table movement between states',async()=>{
  const flow=await scene('flow'),pivot=named(flow,'rotating-channel-0');flow.update(0,{channels:[0,0,0]},0,true);const angle=pivot.rotation.y;
  flow.update(.016,{channels:[1,0,0]},.016);assert.ok(pivot.rotation.y<angle&&pivot.rotation.y>-.6);flow.dispose();
  const dissolution=await scene('dissolution'),rock=named(dissolution,'dissolving-limestone-0');dissolution.update(0,{charged:false,elapsed:0},0,true);const scale=rock.scale.x;
  dissolution.update(.016,{charged:true,elapsed:8},.016);assert.ok(rock.scale.x<scale&&rock.scale.x>scale*.38);dissolution.dispose();
  const emergence=await scene('emergence'),table=named(emergence,'emergence-water-table');emergence.update(0,{level:0},0,true);const bottom=table.position.y;
  emergence.update(.016,{level:100},.016);assert.ok(table.position.y>bottom&&table.position.y<2.4);assert.equal(named(emergence,'emergence-spring').visible,false,'spring waits for displayed level to reach its elevation');emergence.dispose();
});

test('fluid scenes stay finite, reuse their geometry, and snap to reproducible states',async()=>{
  for(const id of ['flow','dissolution','emergence']){
    const model=await scene(id),geometries=new Set();let triangles=0;
    model.root.traverse(o=>{if(o.geometry){geometries.add(o.geometry);triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));}});
    assert.ok(triangles<18000,id+' mobile geometry budget');
    const state={channels:[1,0,1],charged:true,elapsed:8,level:80,exposure:4,runoff:1,won:true};
    model.update(0,state,0,true);const first=vectors(model),settledGeometry=[...geometries].map(g=>Array.from(g.attributes.position.array));
    for(const t of [.016,1,10,10000]){model.update(t,state,.016);vectors(model).forEach(v=>assert.ok(Number.isFinite(v)));model.root.traverse(o=>{if(o.geometry){assert.ok(geometries.has(o.geometry),'frame updates must reuse geometry');for(const value of o.geometry.attributes.position.array)assert.ok(Number.isFinite(value));}});}
    model.update(0,state,0,true);assert.deepEqual(vectors(model),first,'snap resets every animated transform');
    assert.deepEqual([...geometries].map(g=>Array.from(g.attributes.position.array)),settledGeometry,'snap restores animated vertices as well as transforms');
    const disposed=new Set();geometries.forEach(g=>g.addEventListener('dispose',()=>disposed.add(g)));model.dispose();assert.equal(disposed.size,geometries.size);
  }
});
