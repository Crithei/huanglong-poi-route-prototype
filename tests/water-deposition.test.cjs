const {test}=require('node:test');
const assert=require('node:assert/strict');

async function scene(){const {createDepositionScene}=await import('../src/water-deposition.mjs');return createDepositionScene();}
const state=(sequence,fraction=0,running=false)=>({sequence,fraction,running,won:sequence===9});
function part(model,pond,role){return model.root.getObjectByName(`Pond ${pond} ${role}`);}
function settle(model,sequence,fraction=0,running=false){model.update(0,state(sequence,fraction,running),0,true);}

test('lower three ponds, including every decoration, are absent until their own rim starts',async()=>{
  const m=await scene();
  for(let i=1;i<=3;i++)assert.equal(part(m,i,'assembly').visible,false);
  assert.equal(m.markers.length,0);
  assert.ok(m.root.getObjectByName('Water surface 3'));
  assert.equal(m.root.getObjectByName('Water surface 4'),undefined);
  assert.equal(m.root.getObjectByName('Overflow 2'),undefined,'the static source cannot flow into a future pond');
  settle(m,0,0,true);
  assert.equal(part(m,1,'assembly').visible,false,'starting at zero must not pop in a full-sized terrace');
  for(const sequence of [0,3,6]){
    settle(m,sequence);
    const next=sequence/3+1;
    assert.equal(part(m,next,'assembly').visible,false,'waiting must not reveal the next pond');
    for(let i=next+1;i<=3;i++)assert.equal(part(m,i,'assembly').visible,false);
  }
  m.dispose();
});

test('rim is built progressively before water rises and overflow can begin',async()=>{
  const m=await scene();
  for(let pond=1;pond<=3;pond++){
    const sequence=(pond-1)*3;
    settle(m,sequence,.08,true);
    const rim=part(m,pond,'rim'),water=part(m,pond,'water'),overflow=part(m,pond,'overflow');
    assert.equal(part(m,pond,'assembly').visible,true);
    assert.equal(water.visible,false);assert.equal(overflow.visible,false);
    const earlyCount=rim.geometry.drawRange.count,earlyHeight=rim.scale.y;
    settle(m,sequence,.85,true);
    assert.ok(rim.geometry.drawRange.count>earlyCount,'more of the rim must be constructed');
    assert.ok(rim.scale.y>earlyHeight,'the wall must visibly rise');
    settle(m,sequence+1,.1,true);
    const lowWater=water.position.y,smallArea=water.scale.x;
    assert.equal(water.visible,true);assert.equal(overflow.visible,false);
    settle(m,sequence+1,.9,true);
    assert.ok(water.position.y>lowWater+.2,'water level must visibly rise');
    assert.ok(water.scale.x>smallArea,'the wet area grows while filling');
    assert.equal(overflow.visible,false);
    settle(m,sequence+2,.4,true);
    assert.equal(overflow.visible,true);
    if(pond<3)assert.equal(part(m,pond+1,'assembly').visible,false);
  }
  m.dispose();
});

test('completed ponds retain water and flowing overflow while the next pond waits',async()=>{
  const m=await scene();settle(m,3);
  assert.equal(part(m,1,'overflow').visible,true);
  assert.equal(part(m,1,'water').visible,true);
  assert.equal(part(m,2,'assembly').visible,false);
  const bead=part(m,1,'overflow droplets').children[0],before=bead.position.clone();
  m.update(2,state(3),1/60);
  assert.ok(bead.position.distanceTo(before)>.01,'finished overflow continues moving');
  settle(m,9);
  for(let pond=1;pond<=3;pond++)for(const role of ['assembly','rim','water','overflow'])assert.equal(part(m,pond,role).visible,true);
  settle(m,0);
  for(let pond=1;pond<=3;pond++)assert.equal(part(m,pond,'assembly').visible,false,'replay clears every lower pond');
  m.dispose();
});

test('one waterdrop travels to each empty pond and waits at the completed pond between cycles',async()=>{
  const {POOLS}=await import('../src/water-landscape.mjs');
  const m=await scene();
  assert.ok(m.dragSource?.isObject3D,'the renderer needs a draggable protagonist');
  assert.equal(m.drop,m.dragSource);assert.ok(m.drop.getObjectByName('water-drop-body'));
  assert.ok(m.dropTarget?.isObject3D,'the next empty area must expose a world-space target');
  const sameDrop=m.drop;
  for(const sequence of [0,3,6]){
    settle(m,sequence);
    const index=sequence/3,previous=POOLS[index+2],next=POOLS[index+3];
    assert.equal(m.drop.visible,true);assert.equal(m.dropTarget.visible,true);
    assert.equal(m.drop.position.x,previous.x);assert.equal(m.drop.position.z,previous.z);
    assert.equal(m.dropTarget.position.x,next.x);assert.equal(m.dropTarget.position.z,next.z);
    const before=m.drop.position.clone();
    m.update(0,{...state(sequence,0,true),travel:0},0,true);
    assert.ok(m.drop.position.distanceTo(before)<1e-9,'starting a cycle must not teleport to the next pond');
    assert.equal(m.dropTarget.visible,false);
    m.update(0,{...state(sequence,0,true),travel:.5},0,true);
    assert.ok(m.drop.position.z>previous.z&&m.drop.position.z<next.z,'the drop passes through the gap');
    assert.equal(part(m,index+1,'assembly').visible,false,'the future pond remains absent during travel');
    m.update(0,{...state(sequence,0,true),travel:1},0,true);
    assert.equal(m.drop.position.x,next.x);assert.equal(m.drop.position.z,next.z);
    const landed=m.drop.position.clone();
    settle(m,sequence+1,.5,true);assert.ok(m.drop.position.distanceTo(landed)<1e-9);
    settle(m,sequence+3);assert.ok(m.drop.position.distanceTo(landed)<1e-9,'finishing a pond must retain the current anchor');
    assert.equal(m.drop,sameDrop,'all pond cycles keep the same protagonist');
  }
  assert.equal(m.dropTarget.visible,false);assert.equal(m.drop.visible,true);
  assert.equal(m.drop.position.x,POOLS[5].x);assert.equal(m.drop.position.z,POOLS[5].z);
  m.dispose();
});

test('external drag transforms cannot poison the waterdrop animation and old saves land correctly',async()=>{
  const {POOLS}=await import('../src/water-landscape.mjs');
  const m=await scene();
  assert.ok(m.dragSource?.isObject3D);
  settle(m,3);const anchor=m.dragSource.position.clone();
  m.dragSource.position.set(100,100,100);
  m.update(0,state(3),1/60);
  assert.ok(m.dragSource.position.distanceTo(anchor)<1e-9,'model easing must use an internal position, not the dragged object');
  settle(m,3,0,true);
  assert.equal(m.dragSource.position.x,POOLS[4].x);assert.equal(m.dragSource.position.z,POOLS[4].z,'old running saves without travel are already landed');
  m.update(0,{...state(3,.2,true),travel:0},0,true);
  assert.equal(m.dragSource.position.z,POOLS[4].z,'a started rim phase overrides stale travel');
  settle(m,0);assert.equal(m.dropTarget.visible,true);assert.equal(m.dragSource.position.z,POOLS[2].z);
  m.dispose();
});

test('accepted drag has a stable hover landing above the terrain target throughout travel',async()=>{
  const m=await scene();
  assert.ok(m.dropLanding?.isObject3D);
  assert.equal(m.dropLanding.parent,m.root);
  for(const sequence of [0,3,6]){
    m.update(1.25,state(sequence),0,true);
    const landing=m.dropLanding.position.clone();
    assert.equal(landing.x,m.dropTarget.position.x);assert.equal(landing.z,m.dropTarget.position.z);
    assert.ok(landing.y>m.dropTarget.position.y+.6,'successful drops hover above the ground');
    for(const travel of [0,.4,1]){
      m.update(1.25,{...state(sequence,0,true),travel},0,true);
      assert.ok(m.dropLanding.position.distanceTo(landing)<1e-9,'the destination remains stable during flight');
    }
    assert.ok(m.drop.position.distanceTo(landing)<1e-9,'the landing anchor includes the same hover bob');
  }
  settle(m,9);assert.ok(m.dropLanding.position.distanceTo(m.drop.position)<1e-9);
  m.dispose();
});

test('scene stays finite, settles deterministically, and disposes each resource once',async()=>{
  const m=await scene();
  for(const time of [0,.016,60,10000])for(let sequence=0;sequence<=9;sequence++)m.update(time,state(sequence,.5,true),.016);
  settle(m,4,.6,true);const first=part(m,2,'water').position.y;
  settle(m,0);settle(m,4,.6,true);assert.equal(part(m,2,'water').position.y,first);
  let triangles=0;const geometry=new Set(),materials=new Set();
  m.root.traverse(o=>{
    for(const n of [...o.position.toArray(),...o.scale.toArray()])assert.ok(Number.isFinite(n));
    if(o.isMesh){triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));geometry.add(o.geometry);for(const material of Array.isArray(o.material)?o.material:[o.material])materials.add(material);}
  });
  assert.ok(triangles<18000,`triangle budget exceeded: ${triangles}`);
  const disposed=new Map();for(const resource of [...geometry,...materials])resource.addEventListener('dispose',()=>disposed.set(resource,(disposed.get(resource)||0)+1));
  m.dispose();m.dispose();
  for(const resource of [...geometry,...materials])assert.equal(disposed.get(resource),1);
});
