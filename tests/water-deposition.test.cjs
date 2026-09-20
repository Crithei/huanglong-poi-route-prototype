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
