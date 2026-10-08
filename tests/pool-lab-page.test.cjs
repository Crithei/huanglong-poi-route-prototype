const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..'),key='huanglong.pool-lab.v1';
async function page(saved={},options={}){
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://prototype.test/?view=follow&passportTab=labs',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:new VirtualConsole()}),w=dom.window;
 w.matchMedia=()=>({matches:options.reduced!==false,addEventListener(){}});w.setInterval=()=>1;w.setTimeout=()=>1;
 const frames=new Map();let nextFrame=1;w.requestAnimationFrame=fn=>{const id=nextFrame++;frames.set(id,fn);return id;};w.cancelAnimationFrame=id=>frames.delete(id);
 w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLElement.prototype.scrollTo=()=>{};w.HTMLCanvasElement.prototype.getContext=()=>null;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 for(const [k,v] of Object.entries(saved))w.localStorage.setItem(k,v);
 for(const f of ['data/facilities.js','data/scenic.js','data/stamps.js','data/passport.js','passport-state.js','passport-art.js','pool-lab-state.js','pool-lab-scene.js','pool-lab.js','passport.js','map.js','follow-state.js','follow.js','app.js']){
  assert.ok(fs.existsSync(path.join(root,f)),f+' must exist');vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),dom.getInternalVMContext(),{filename:f});
 }
 await Promise.resolve();const $=s=>w.document.querySelector(s),click=s=>{assert.ok($(s),s);$(s).click();};
 const input=(s,v)=>{$(s).value=v;$(s).dispatchEvent(new w.Event('input',{bubbles:true}));};
 return {w,$,click,input,frames,frame(time){const queued=[...frames.values()];frames.clear();queued.forEach(fn=>fn(time));},state:()=>JSON.parse(w.localStorage.getItem(key)),saved:()=>Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]))};
}
test('one scene advances over time, keeps its state between tabs and restores paused',async()=>{
 const p=await page();try{
  assert.match(p.$('#poolLab').textContent,/彩池演化实验室/);assert.equal(p.$('#passportLabs'),null);
  p.click('#poolStep');const first=p.state().world;assert.ok(first.elapsed>0);
  p.input('[data-pool-input="flow"]',0);assert.equal(p.state().world.elapsed,first.elapsed);
  assert.deepEqual(p.state().world.pools,first.pools,'a condition change must not regenerate the pools');
  p.click('#poolCompare');assert.equal(p.$('#poolCompareTools').hidden,false);
  p.click('[data-passport-tab="passport"]');p.click('[data-passport-tab="labs"]');assert.equal(p.state().world.elapsed,first.elapsed);
  const q=await page(p.saved());try{assert.equal(q.state().world.elapsed,first.elapsed);assert.equal(q.state().world.running,false);}finally{q.w.close();}
 }finally{p.w.close();}
});
test('animation pauses on departure or hidden document and resumes without time catch-up',async()=>{
 const p=await page({}, {reduced:false});try{
  p.click('#poolPlay');assert.equal(p.frames.size,1);p.frame(1000);p.frame(1100);
  p.click('[data-passport-tab="notebook"]');assert.equal(p.frames.size,0);const elapsed=p.state().world.elapsed;assert.ok(elapsed>0);
  p.click('[data-passport-tab="labs"]');assert.equal(p.frames.size,0);
  p.click('#poolPlay');p.frame(100000);assert.equal(p.state().world.elapsed,elapsed);
  p.frame(100100);Object.defineProperty(p.w.document,'hidden',{configurable:true,value:true});p.w.document.dispatchEvent(new p.w.Event('visibilitychange'));
  assert.equal(p.frames.size,0);assert.equal(p.state().world.running,false);assert.ok(p.state().world.elapsed<elapsed+1);
 }finally{p.w.close();}
});

test('leaving the main follow view pauses even without IntersectionObserver',async()=>{
 const p=await page({}, {reduced:false});try{
  assert.equal(typeof p.w.IntersectionObserver,'undefined');
  p.click('#poolPlay');p.frame(1000);p.frame(1100);
  p.click('[data-view="route"]');assert.equal(p.$('#follow-view').hidden,true);
  assert.equal(p.frames.size,0);assert.equal(p.state().world.running,false);
  const elapsed=p.state().world.elapsed;p.frame(999000);assert.equal(p.state().world.elapsed,elapsed);
  p.click('[data-view="follow"]');assert.equal(p.state().world.running,false);
 }finally{p.w.close();}
});
test('observations can be journaled in practice without inventing arrivals or collections',async()=>{
 const p=await page();try{
  p.click('#poolStep');p.click('#poolRecord');assert.equal(p.state().records.length,1);
  assert.match(p.$('#poolFeedback').textContent,/预习/);
  p.click('[data-pool-notebook="0"]');assert.equal(p.$('#passportPanel-notebook').hidden,false);
  assert.match(p.$('#notebookNote').value,/演示/);assert.equal(p.$('[data-add-art]'),null);
  p.click('[data-passport-tab="labs"]');p.click('#poolReset');assert.equal(p.state().world.elapsed,0);assert.equal(p.state().records.length,1);
 }finally{p.w.close();}
});
test('real evolution records award a single new sticker after arrival and do not erase it on reset',async()=>{
 const p=await page({'huanglong.travel-journal.v1':JSON.stringify({version:3,stamps:{'five-color-pond':'2026-10-08T00:00:00Z'}})});try{
  for(let i=0;i<20;i++)p.click('#poolStep');p.click('#poolRecord');
  p.input('[data-pool-input="flow"]',0);for(let i=0;i<40;i++)p.click('#poolStep');p.click('#poolRecord');
  p.click('[data-passport-tab="notebook"]');assert.ok(p.$('[data-add-art="sticker:pool"]'));
  p.click('[data-passport-tab="labs"]');p.click('#poolReset');p.click('[data-passport-tab="notebook"]');assert.ok(p.$('[data-add-art="sticker:pool"]'));
 }finally{p.w.close();}
});

test('comparison can be dragged directly and stops handling the gesture when comparison closes',async()=>{
 const p=await page();try{
  const canvas=p.$('#poolCanvas');canvas.getBoundingClientRect=()=>({left:10,top:0,width:300,height:300});
  canvas.setPointerCapture=()=>{};canvas.releasePointerCapture=()=>{};
  function pointer(type,x){const e=new p.w.MouseEvent(type,{bubbles:true,clientX:x,clientY:100,button:0});Object.defineProperty(e,'pointerId',{value:7});canvas.dispatchEvent(e);}
  p.click('#poolCompare');assert.ok(p.$('#poolStage').contains(p.$('#poolCompareTools')),'comparison controls must stay with the sticky scene');
  pointer('pointerdown',160);pointer('pointermove',220);assert.equal(Number(p.$('#poolWipe').value),70);
  pointer('pointerup',220);pointer('pointermove',100);assert.equal(Number(p.$('#poolWipe').value),70);
  p.input('#poolWipe',30);pointer('pointerdown',100);pointer('pointermove',-100);assert.equal(Number(p.$('#poolWipe').value),5);
  p.click('#poolCompare');pointer('pointermove',300);assert.equal(Number(p.$('#poolWipe').value),5);
 }finally{p.w.close();}
});

test('different trials at the same time and inputs retain both observations',async()=>{
 const p=await page();try{
  p.input('[data-pool-input="flow"]',0);p.click('#poolStep');p.input('[data-pool-input="flow"]',60);p.click('#poolRecord');
  const first=p.state().records[0].world.pools[0].water;
  p.click('#poolReset');p.click('#poolStep');p.click('#poolRecord');
  assert.equal(p.state().records.length,2);assert.notEqual(p.state().records[1].world.pools[0].water,first);
  p.click('#poolRecord');assert.equal(p.state().records.length,2,'recording the exact same state stays deduplicated');
 }finally{p.w.close();}
});
