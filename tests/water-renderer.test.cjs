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
  let frameId=0,draws=0,disposed=0,intersection,lastCamera;
  const events=()=>{const handlers=new Map();return {
    addEventListener(type,handler){if(!handlers.has(type))handlers.set(type,new Set());handlers.get(type).add(handler);},
    removeEventListener(type,handler){handlers.get(type)?.delete(handler);},
    emit(type,event={}){for(const handler of handlers.get(type)||[])handler(event);},
    dispatchEvent(event){for(const handler of handlers.get(event.type)||[])handler(event);return true;},
  };};
  const rect={left:40,top:70,width:360,height:405,right:400,bottom:475};
  const canvas={...events(),setAttribute(){},remove(){},getBoundingClientRect:()=>rect};
  const media={...events(),matches:reducedMotion};
  const document={...events(),hidden:false};
  class Renderer{
    constructor(){this.domElement=canvas;this.shadowMap={};}
    setPixelRatio(){}setClearColor(){}setSize(){}
    render(scene,camera){draws++;scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);lastCamera=camera;}
    dispose(){disposed++;}
  }
  const anchors=Object.fromEntries(['co2Token','co2DropTarget','waterDropHandle','waterDropNextTarget'].map(id=>[id,{style:{},dataset:{},setAttribute(){},hidden:false}]));
  const host={...events(),dataset:{},clientWidth:360,clientHeight:405,prepend(){},getBoundingClientRect:()=>rect,querySelector(selector){return anchors[selector.slice(1)]||null;}};
  const browserWindow={...events(),devicePixelRatio:1,matchMedia:()=>media};
  const sandbox={
    THREE:{...THREE,WebGLRenderer:Renderer},frameDelta,
    createProcessScene(id){
      const root=new THREE.Group(),source=new THREE.Group(),target=new THREE.Group(),landing=new THREE.Group(),start=new THREE.Vector3(-1.4,3.5,.6);
      source.name='draggable-mesh';source.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.1,0),new THREE.MeshBasicMaterial()));root.add(source,target,landing);
      const model={root,dragSource:source,dropTarget:target,dropLanding:id==='deposition'?landing:undefined,start,update(...args){
        updates.push({id,args});const progress=args[1]||{};source.position.copy(start);target.position.set(.7,1.8,1.3);landing.position.copy(target.position);landing.position.y+=.5;source.visible=true;
        if(id==='dissolution')source.visible=!(progress.charged&&progress.elapsed>=.7);
        if(id==='deposition'&&progress.running)source.position.lerp(landing.position,progress.travel||0);
      },dispose(){model.disposed=true;source.children[0].geometry.dispose();source.children[0].material.dispose();}};
      models.push(model);return model;
    },
    window:browserWindow,document,CustomEvent:class{constructor(type,options={}){this.type=type;Object.assign(this,options);}},
    requestAnimationFrame(callback){const id=++frameId;frames.set(id,callback);return id;},
    cancelAnimationFrame(id){frames.delete(id);},
    IntersectionObserver:class{constructor(callback){intersection=callback;}observe(){intersection([{isIntersecting:true}]);}disconnect(){}},
    ResizeObserver:class{observe(){}disconnect(){}},
  };
  const source=fs.readFileSync(path.join(__dirname,'../src/water-scene.mjs'),'utf8').replace(/^import .*;\r?\n/gm,'');
  vm.runInNewContext(source,sandbox,{filename:'water-scene.mjs'});
  const api=sandbox.window.HuanglongWaterScene.mount(host,{onTick});
  return {api,host,canvas,media,document,models,updates,anchors,window:browserWindow,
    screen(object){const point=object.getWorldPosition(new THREE.Vector3()).project(lastCamera);return {x:rect.left+(point.x+1)*rect.width/2,y:rect.top+(1-point.y)*rect.height/2};},
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

test('drag handles are projected onto models and move the mesh rather than a detached overlay',async()=>{
  const h=await harness();
  try{
    h.api.setChapter('dissolution',{charged:false,elapsed:0},true);h.frame(0);
    const model=h.models.at(-1),start=model.dragSource.position.clone(),source=h.screen(model.dragSource),target=h.screen(model.dropTarget);
    for(const id of ['co2Token','co2DropTarget'])for(const coordinate of ['left','top'])assert.ok(Number.isFinite(parseFloat(h.anchors[id].style[coordinate])),id+' must follow a projected model position');
    h.api.beginDrag(source.x,source.y);h.api.moveDrag(target.x-25,target.y+15);
    assert.ok(model.dragSource.position.distanceTo(start)>.1,'the real mesh follows dragging');
    const dragged=h.screen(model.dragSource);
    assert.ok(Math.hypot(dragged.x-(target.x-25),dragged.y-(target.y+15))<2,'the mesh stays under the pointer');
    h.frame(16);assert.ok(model.dragSource.position.distanceTo(start)>.1,'model.update must not undo an active drag');
    h.api.endDrag(false);for(let i=2;i<40;i++)h.frame(i*16);
    assert.ok(model.dragSource.position.distanceTo(start)<.01,'a rejected release returns to the source');
    assert.equal(h.pending,1);
  }finally{h.api.dispose();}
});

test('accepted CO2 stays at the droplet until model absorption removes it',async()=>{
  const h=await harness();
  try{
    const progress={charged:false,elapsed:0};h.api.setChapter('dissolution',progress,true);h.frame(0);
    const model=h.models.at(-1),source=h.screen(model.dragSource),target=h.screen(model.dropTarget);
    h.api.beginDrag(source.x,source.y);h.api.moveDrag(target.x,target.y);h.api.endDrag(true);
    progress.charged=true;h.api.setChapter('dissolution',progress,true);h.frame(16);
    assert.ok(model.dragSource.position.distanceTo(model.start)>.1,'accepted release never returns to its starting point');
    for(let i=2;i<=20;i++)h.frame(i*16);
    assert.ok(model.dragSource.position.distanceTo(model.dropTarget.position)<.01,'accepted CO2 must not flash back to its starting point');
    progress.elapsed=1;h.frame(336);assert.equal(model.dragSource.visible,false);
    h.api.setChapter('dissolution',{charged:false,elapsed:0},true);h.frame(352);
    assert.ok(model.dragSource.position.distanceTo(model.start)<.01,'replay must not keep a stale accepted drag');
  }finally{h.api.dispose();}
});

test('pool drop uses its own projected anchors and releases its accepted hold after travel',async()=>{
  const h=await harness();
  try{
    const progress={sequence:0,fraction:0,running:false,travel:0};h.api.setChapter('deposition',progress,true);h.frame(0);
    const model=h.models.at(-1),source=h.screen(model.dragSource),target=h.screen(model.dropTarget);
    for(const id of ['waterDropHandle','waterDropNextTarget'])assert.ok(Number.isFinite(parseFloat(h.anchors[id].style.left)));
    h.api.beginDrag(source.x,source.y);h.api.moveDrag(target.x,target.y);h.api.endDrag(true);
    progress.running=true;h.api.setChapter('deposition',progress,true);h.frame(16);
    assert.ok(model.dragSource.position.distanceTo(model.start)>.1);
    for(let i=2;i<=20;i++)h.frame(i*16);
    assert.ok(model.dragSource.position.distanceTo(model.dropLanding.position)<.01,'the drop lands above the target ring, using the model landing anchor');
    progress.travel=1;h.frame(336);
    progress.sequence=3;progress.running=false;h.api.setChapter('deposition',progress,true);h.frame(352);
    for(let i=23;i<=45;i++)h.frame(i*16);
    assert.ok(model.dragSource.position.distanceTo(model.start)<.01,'new pool must be able to provide a fresh draggable source');
  }finally{h.api.dispose();}
});

test('locks and interrupted gestures cannot leave a model detached from its source',async()=>{
  for(const interruption of ['pause','hidden','contextlost','end']){
    const h=await harness();
    try{
      h.api.setChapter('dissolution',{charged:false,elapsed:0},false);h.frame(0);
      const model=h.models.at(-1),source=h.screen(model.dragSource),target=h.screen(model.dropTarget);
      h.api.beginDrag(source.x,source.y);h.api.moveDrag(target.x,target.y);
      assert.ok(model.dragSource.position.distanceTo(model.start)<.01,'locked chapters refuse model dragging');
      h.api.setChapter('dissolution',{charged:false,elapsed:0},true);
      h.api.beginDrag(source.x,source.y);h.api.moveDrag(target.x,target.y);
      assert.ok(model.dragSource.position.distanceTo(model.start)>.1);
      if(interruption==='pause')h.api.pause(true);
      if(interruption==='hidden')h.hidden(true);
      if(interruption==='contextlost')h.canvas.emit('webglcontextlost',{preventDefault(){}});
      if(interruption==='end')h.api.endDrag(false);
      if(interruption==='hidden')h.hidden(false);
      if(interruption==='contextlost')h.canvas.emit('webglcontextrestored');
      for(let i=1;i<40;i++)h.frame(i*16);
      assert.ok(model.dragSource.position.distanceTo(model.start)<.01,interruption+' cancels the dragged pose');
    }finally{h.api.dispose();}
  }
});
