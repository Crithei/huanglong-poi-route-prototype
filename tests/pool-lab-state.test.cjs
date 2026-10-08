const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
function api(){const file=path.join(__dirname,'../pool-lab-state.js');assert.ok(fs.existsSync(file),'continuous pool model must exist');return require(file);}
function run(E,s,n){for(let t=0;t<n;t++)E.advance(s,1);return s;}
const sum=(s,key)=>s.pools.reduce((n,p)=>n+p[key],0);

test('inputs change conditions without replacing the pool state, and pause freezes time',()=>{
 const E=api(),s=E.create(),pools=JSON.stringify(s.pools);
 E.setInput(s,'flow',10);assert.equal(JSON.stringify(s.pools),pools);
 E.tick(s,1);assert.equal(s.elapsed,0);s.running=true;E.tick(s,1);assert.ok(s.elapsed>0);
 const before=E.snapshot(s);s.running=false;E.tick(s,5);assert.equal(s.elapsed,before.elapsed);
 assert.equal(E.setInput(s,'flow',NaN),false);assert.equal(E.setInput(s,'unknown',50),false);
});
test('connected pools fill, decline on low supply and overflow again without losing the rims',()=>{
 const E=api(),s=E.create();E.setInput(s,'flow',90);run(E,s,80);
 assert.ok(E.discoveries(s).includes('connected'));const filled=sum(s,'water');
 const rims=s.pools.map(p=>p.rim);E.setInput(s,'flow',0);run(E,s,180);
 assert.ok(sum(s,'water')<filled*.6);assert.ok(s.pools.every((p,i)=>p.rim>=rims[i]));
 assert.ok(E.discoveries(s).includes('low-water'));
 E.setInput(s,'flow',90);run(E,s,120);assert.ok(E.discoveries(s).includes('connected'));
});
test('deposition needs dissolved supply and gas exchange; sunlight alone cannot build stone',()=>{
 const E=api(),s=E.create();E.setInput(s,'exchange',0);run(E,s,100);assert.equal(sum(s,'deposited'),0);
 const dry=E.create();dry.pools.forEach(p=>p.calcium=0);E.setInput(dry,'calcium',0);run(E,dry,100);assert.equal(sum(dry,'deposited'),0);
 const a=E.create(),b=E.create();E.setInput(a,'light',0);E.setInput(b,'light',100);run(E,a,80);run(E,b,80);assert.deepEqual(a.pools,b.pools);
 assert.ok(E.discoveries(a).includes('rim-grown'));assert.ok(sum(a,'deposited')>0);
});
test('water and dissolved calcium balance across transfers, leakage, outlets and deposits',()=>{
 const E=api(),s=E.create(),initialW=sum(s,'water'),initialC=sum(s,'calcium');
 for(let t=0;t<600;t++){E.setInput(s,'flow',t%130);E.setInput(s,'calcium',t%100);E.advance(s,1);}
 assert.ok(Math.abs(initialW+s.ledger.waterIn-s.ledger.waterOut-s.ledger.waterLost-sum(s,'water'))<1e-8);
 assert.ok(Math.abs(initialC+s.ledger.calciumIn-s.ledger.calciumOut-s.ledger.calciumLost-sum(s,'calcium')-sum(s,'deposited'))<1e-8);
 for(const p of s.pools)for(const value of Object.values(p).filter(v=>typeof v==='number'))assert.ok(Number.isFinite(value)&&value>=0);
});
test('comparison snapshots remain independent and restoring never resumes unattended time',()=>{
 const E=api(),s=E.create(),before=E.snapshot(s);run(E,s,25);assert.equal(before.elapsed,0);
 s.running=true;const restored=E.restore(JSON.stringify(s));assert.equal(restored.running,false);assert.equal(restored.elapsed,s.elapsed);assert.deepEqual(restored.pools,s.pools);
 for(const raw of ['null','[]','bad','{"version":99}'])assert.deepEqual(E.restore(raw),E.create());
 const bad=E.snapshot(s);bad.pools[0].water=-100;bad.inputs.flow=Infinity;
 const repaired=E.restore(JSON.stringify(bad));assert.ok(repaired.pools.every(p=>p.water>=0));assert.ok(Number.isFinite(repaired.inputs.flow));
});

test('observation text follows the selected pool water balance, including weak supply and drained pools',()=>{
 const E=api(),s=E.create();E.setInput(s,'flow',5);
 const before=E.depth(s,0);run(E,s,5);assert.ok(E.depth(s,0)>before);
 assert.equal(E.describe(s,0).trend,'rising');assert.doesNotMatch(E.describe(s,0).title,/变浅|退下/);
 const waiting=E.create();E.setInput(waiting,'flow',0);run(E,waiting,2);
 assert.equal(waiting.pools[3].outflow,0);assert.equal(E.describe(waiting,3).trend,'falling');
 assert.match(E.describe(waiting,3).flow,/下降/);
 run(E,waiting,200);E.setInput(waiting,'flow',90);
 assert.equal(E.describe(waiting,0).trend,'rising');assert.doesNotMatch(E.describe(waiting,0).reason,/补给不足/);
 const noCalcium=E.create();noCalcium.pools.forEach(p=>p.calcium=0);E.setInput(noCalcium,'calcium',0);run(E,noCalcium,80);
 assert.doesNotMatch(E.describe(noCalcium,3).title,/开始留下痕迹|薄层正积累/);
});
