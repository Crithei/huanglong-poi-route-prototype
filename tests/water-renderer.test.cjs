const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

// Execute the real controller without a browser. Only the GPU, model content,
// observers and frame clock are substituted; Three's scene/camera remain real.
async function harness(onTick=()=>{},reducedMotion=false){
  const THREE=await import('three');
  const {frameDelta}=await import('../src/water-timing.mjs');
  const frames=new Map(),models=[],updates=[];
  let frameId=0,draws=0,disposed=0,intersection;
  const events=()=>{const handlers=new Map();return {
    addEventListener(type,handler){if(!handlers.has(type))handlers.set(type,new Set());handlers.get(type).add(handler);},
    removeEventListener(type,handler){handlers.get(type)?.delete(handler);},
    emit(type,event={}){for(const handler of handlers.get(type)||[])handler(event);},
  };};
  const canvas={...events(),setAttribute(){},remove(){}};
  const media={...events(),matches:reducedMotion};
  const document={...events(),hidden:false};
  class Renderer{
    constructor(){this.domElement=canvas;this.shadowMap={};}
    setPixelRatio(){}setClearColor(){}setSize(){}
    render(){draws++;}
    dispose(){disposed++;}
  }
  const host={dataset:{},clientWidth:360,clientHeight:405,prepend(){},querySelector(){return null;}};
  const sandbox={
    THREE:{...THREE,WebGLRenderer:Renderer},frameDelta,
    createProcessScene(id){const model={root:new THREE.Group(),update(...args){updates.push({id,args});},dispose(){model.disposed=true;}};models.push(model);return model;},
    window:{devicePixelRatio:1,matchMedia:()=>media},document,
    requestAnimationFrame(callback){const id=++frameId;frames.set(id,callback);return id;},
    cancelAnimationFrame(id){frames.delete(id);},
    IntersectionObserver:class{constructor(callback){intersection=callback;}observe(){intersection([{isIntersecting:true}]);}disconnect(){}},
    ResizeObserver:class{observe(){}disconnect(){}},
  };
  const source=fs.readFileSync(path.join(__dirname,'../src/water-scene.mjs'),'utf8').replace(/^import .*;\r?\n/gm,'');
  vm.runInNewContext(source,sandbox,{filename:'water-scene.mjs'});
  const api=sandbox.window.HuanglongWaterScene.mount(host,{onTick});
  return {api,host,canvas,media,document,models,updates,
    get pending(){return frames.size;},get draws(){return draws;},get disposed(){return disposed;},
    frame(time){const ready=[...frames.values()];frames.clear();for(const callback of ready)callback(time);return ready.length;},
    visible(value){intersection([{isIntersecting:value}]);},
    hidden(value){document.hidden=value;document.emit('visibilitychange');},
  };
}

test('phase changes inside onTick cannot create parallel animation loops',async()=>{
  let scene,phaseChange=false,ticks=0;
  const h=await harness(()=>{ticks++;if(phaseChange)scene.setChapter('flow',{channels:[1,0,1]},true);});scene=h.api;
  try{
    assert.equal(h.pending,1);
    for(let i=0;i<12;i++){
      phaseChange=i%2===0;
      const before=h.draws;
      assert.equal(h.frame(i*16),1,'one callback must own each display frame');
      assert.equal(h.pending,1,'phase rerender must reuse the already scheduled frame');
      assert.equal(h.draws-before,phaseChange?2:1,'only explicit phase refresh adds an immediate render');
    }
    assert.equal(ticks,12);
  }finally{scene.dispose();}
  assert.equal(h.pending,0,'all scheduled callbacks must remain cancellable');
});

test('pause, hidden page and offscreen scene stop time and resume with a fresh frame',async()=>{
  let seconds=0,ticks=0;
  const h=await harness((id,dt)=>{seconds+=dt;ticks++;});
  try{
    h.frame(0);h.frame(16);
    assert.equal(seconds,.016);
    h.api.pause(true);h.frame(32);
    assert.equal(h.pending,0);assert.equal(seconds,.016);assert.equal(ticks,2);
    h.api.setChapter('emergence',{level:80},true);h.frame(48);
    assert.equal(h.updates.at(-1).args[1].level,80);
    assert.equal(h.updates.at(-1).args[3],true,'manual changes must remain visible while time is paused');
    assert.equal(seconds,.016);assert.equal(h.pending,0);
    h.api.pause(false);h.frame(10000);
    assert.equal(seconds,.016,'resuming must not count the time spent paused');
    h.frame(10016);assert.equal(seconds,.032);
    h.hidden(true);assert.equal(h.pending,0);
    h.hidden(false);assert.equal(h.pending,1);h.frame(20000);
    assert.equal(seconds,.032,'returning to the page starts a new clock');
    h.visible(false);assert.equal(h.pending,0);
    h.visible(true);assert.equal(h.pending,1);h.frame(30000);
    assert.equal(seconds,.032,'offscreen time never advances the chapter');
    h.frame(30016);assert.equal(seconds,.048);
  }finally{h.api.dispose();}
  assert.equal(h.pending,0);assert.equal(h.disposed,1);
  assert.ok(h.models.every(model=>model.disposed));
});

test('reduced motion renders static snapshots and never advances chapter time',async()=>{
  let ticks=0;
  const h=await harness(()=>ticks++,true);
  try{
    h.api.setChapter('emergence',{level:80},true);
    h.frame(0);
    assert.equal(ticks,0);assert.equal(h.pending,0);
    assert.ok(h.updates.every(update=>update.args[3]===true),'static mode must snap model interpolation');
    h.api.setChapter('emergence',{level:25},true);h.frame(16);
    assert.equal(ticks,0);assert.equal(h.pending,0);
    h.media.matches=false;h.media.emit('change');h.frame(32);
    assert.equal(ticks,1);assert.equal(h.pending,1);
  }finally{h.api.dispose();}
});

test('context loss suspends the renderer and disposal prevents later scheduling',async()=>{
  let ticks=0;
  const h=await harness(()=>ticks++);
  h.frame(0);
  let prevented=false;
  h.canvas.emit('webglcontextlost',{preventDefault(){prevented=true;}});
  assert.equal(prevented,true);assert.equal(h.host.dataset.renderState,'fallback');assert.equal(h.pending,0);
  h.api.setChapter('flow',{},true);assert.equal(h.pending,0);
  h.canvas.emit('webglcontextrestored');assert.equal(h.host.dataset.renderState,'ready');assert.equal(h.pending,1);
  h.frame(10000);assert.equal(ticks,2);
  h.api.dispose();assert.equal(h.pending,0);
  h.hidden(true);h.hidden(false);h.media.emit('change');assert.equal(h.pending,0);
});
