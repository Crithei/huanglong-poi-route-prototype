const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..'),key='huanglong.travel-journal.v1';

async function page(saved,{fallback=false,reducedMotion=false}={}){
  const errors=[],console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://prototype.test/?view=follow',runScripts:'outside-only',virtualConsole:console});
  const w=dom.window,intervals=new Map(),sceneDrag=[];let nextTimer=1,sceneOptions,hidden=false,sceneRect={left:0,top:100,right:600,bottom:460,width:600,height:360};
  const targetRects={co2:{left:240,top:190,right:320,bottom:290,width:80,height:100},water:{left:340,top:310,right:430,bottom:400,width:90,height:90}};
  w.setInterval=callback=>{const id=nextTimer++;intervals.set(id,callback);return id;};w.clearInterval=id=>intervals.delete(id);
  w.setTimeout=()=>nextTimer++;w.clearTimeout=()=>{};
  w.matchMedia=()=>({matches:reducedMotion,addEventListener(){},removeEventListener(){}});
  Object.defineProperty(w.document,'hidden',{get:()=>hidden,configurable:true});
  w.HTMLElement.prototype.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  w.document.querySelector('#waterScene').getBoundingClientRect=()=>sceneRect;
  w.document.querySelector('#co2DropTarget').getBoundingClientRect=()=>targetRects.co2;
  if(w.document.querySelector('#waterDropNextTarget'))w.document.querySelector('#waterDropNextTarget').getBoundingClientRect=()=>targetRects.water;
  if(!fallback)w.HuanglongWaterScene={mount(host,options){sceneOptions=options;host.dataset.renderState='ready';return {setChapter(){},pause(){},rotate(){},zoom(){},reset(){},dispose(){},beginDrag(x,y){sceneDrag.push(['begin',x,y]);return true;},moveDrag(x,y){sceneDrag.push(['move',x,y]);},endDrag(accepted=false){sceneDrag.push(['end',accepted]);}};}};
  if(saved)w.localStorage.setItem(key,saved);
  for(const file of ['data/facilities.js','data/scenic.js','map.js','follow-state.js','follow.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),dom.getInternalVMContext(),{filename:file});
  await Promise.resolve();
  const $=selector=>w.document.querySelector(selector),click=selector=>{assert.ok($(selector),'missing '+selector);$(selector).click();};
  const slider=(selector,n)=>{assert.ok($(selector),'missing '+selector);$(selector).value=n;$(selector).dispatchEvent(new w.Event('input',{bubbles:true}));};
  const pointer=(type,x,y,id=7,source='#co2Token')=>{const event=new w.MouseEvent(type,{bubbles:true,button:0,clientX:x,clientY:y});Object.defineProperty(event,'pointerId',{value:id});$(source).dispatchEvent(event);};
  const drag=(x,y,source='#co2Token')=>{pointer('pointerdown',80,180,7,source);pointer('pointermove',x,y,7,source);pointer('pointerup',x,y,7,source);};
  const advance=(id,seconds)=>{assert.ok(sceneOptions,'animation callback was not mounted');for(let i=0;i<Math.ceil(seconds/.1);i++)sceneOptions.onTick(id,.1);};
  const advanceFallback=seconds=>{for(let i=0;i<Math.ceil(seconds/.1);i++)for(const callback of intervals.values())callback();};
  const save=()=>w.localStorage.getItem(key),state=()=>JSON.parse(save());
  const open=id=>click(`[data-water-chapter="${id}"]`),arrive=id=>{open(id);click('[data-chapter-checkin]');};
  return {dom,w,$,click,slider,pointer,drag,advance,advanceFallback,errors,save,state,open,arrive,sceneDrag,interact:(...args)=>sceneOptions.onInteract(...args),setHidden:value=>{hidden=value;},setSceneRect:value=>{sceneRect=value;},setTargetRect:(id,value)=>{targetRects[id]=value;}};
}

test('page interactions automatically complete all chapters and preserve awards through replay and reload',async()=>{
  const p=await page();
  try{
    assert.equal(p.$('#waterAction').disabled,true);assert.equal(p.$('#waterScene').dataset.renderState,'ready');
    assert.equal(p.$('#waterChapterGrid').children.length,4);
    const itinerary=p.$('#followProgressText').textContent;
    p.arrive('deposition');
    assert.equal(p.$('#waterGameControls').disabled,false);assert.equal(p.$('#followProgressText').textContent,itinerary);
    assert.equal(p.$('#depositTime'),null);assert.equal(p.$('[data-game-action="rim"]'),null);
    for(let pond=0;pond<3;pond++){
      assert.equal(p.state().chapters.deposition.sequence,pond*3);
      p.click('#waterAction');assert.equal(p.$('#waterAction').disabled,true);
      assert.equal(p.state().chapters.deposition.travel,0);
      p.advance('deposition',.4);assert.equal(p.state().chapters.deposition.sequence,pond*3);assert.equal(p.state().chapters.deposition.fraction,0,'the drop travels before the new rim grows');
      p.advance('deposition',3.6);assert.equal(p.state().chapters.deposition.sequence,pond*3+1);
      p.advance('deposition',3);assert.equal(p.state().chapters.deposition.sequence,pond*3+2);
      p.advance('deposition',3);assert.equal(p.state().chapters.deposition.sequence,(pond+1)*3);
      assert.equal(p.state().chapters.deposition.running,false);
      p.advance('deposition',10);assert.equal(p.state().chapters.deposition.sequence,(pond+1)*3,'the next pond waits for another action');
      assert.equal(p.$('#waterAction').disabled,false);
    }
    assert.equal(p.$('#waterAction').textContent,'重新体验本章');
    p.arrive('emergence');
    assert.equal(p.$('[data-game-action="outlet"]'),null);assert.equal(p.$('#waterAction').hidden,true);
    p.slider('#groundwaterLevel',64);p.advance('emergence',5);assert.equal(p.state().chapters.emergence.won,false);
    p.slider('#groundwaterLevel',80);p.advance('emergence',4.1);assert.equal(p.state().chapters.emergence.won,true);
    p.slider('#groundwaterLevel',25);assert.equal(p.state().chapters.emergence.level,25);assert.equal(p.state().chapters.emergence.won,true);
    p.arrive('dissolution');
    assert.equal(p.$('[data-game-action="observe"]'),null);assert.equal(p.$('#waterAction').hidden,true);
    p.drag(280,240);assert.equal(p.state().chapters.dissolution.charged,true);
    p.advance('dissolution',8.1);assert.equal(p.state().chapters.dissolution.won,true);
    p.arrive('flow');assert.equal(p.$('#waterAction').hidden,true);
    p.click('[data-game-action="turn"][data-game-value="0"]');p.click('[data-game-action="turn"][data-game-value="2"]');
    assert.equal(p.state().chapters.flow.won,false,'connecting the route begins the runoff observation');
    p.advance('flow',4.1);assert.equal(p.state().chapters.flow.won,true);
    assert.equal(p.$('#waterJourneyCount').textContent,'4 / 4 章');assert.match(p.$('#waterBadgeSlot').textContent,/山水同行者/);
    assert.equal(p.$('.water-model-pin, [data-model-pin], [data-game-action="finish"]'),null);
    const reward=p.state().chapterBadgeAt,chapterReward=p.state().chapters.flow.earnedAt;
    p.click('#waterAction');assert.equal(p.state().chapters.flow.won,false);assert.equal(p.state().chapters.flow.earnedAt,chapterReward);assert.equal(p.state().chapterBadgeAt,reward);
    const q=await page(p.save());
    try{assert.equal(q.$('#waterJourneyCount').textContent,'4 / 4 章');assert.equal(q.$('#waterGameControls').disabled,false);assert.equal(q.$('#waterUnlock').hidden,true);assert.equal(q.state().chapterBadgeAt,reward);assert.deepEqual(q.errors,[]);}finally{q.dom.window.close();}
    assert.deepEqual(p.errors,[]);
  }finally{p.dom.window.close();}
});

test('CO2 dragging rejects locked, missed and cancelled drops, then starts the entire dissolution process',async()=>{
  const p=await page();
  try{
    p.open('dissolution');assert.equal(p.$('#co2Interaction').hidden,true);
    p.drag(280,240);p.interact('charge');p.advance('dissolution',10);
    assert.equal(p.state().chapters.dissolution.charged,false,'arrival lock also protects scene callbacks');
    p.click('[data-chapter-checkin]');assert.equal(p.$('#co2Interaction').hidden,false);
    p.drag(450,320);
    p.$('#co2Token').dispatchEvent(new p.w.MouseEvent('click',{bubbles:true,detail:1}));
    assert.equal(p.state().chapters.dissolution.charged,false);assert.match(p.$('#waterGameFeedback').textContent,/拖到水滴/);
    assert.equal(p.$('#co2Token').classList.contains('dragging'),false);assert.equal(p.$('#co2Token').style.transform,'');
    p.pointer('pointerdown',80,180);p.pointer('pointermove',280,240);assert.equal(p.$('#co2DropTarget').classList.contains('receiving'),true);
    p.pointer('pointercancel',280,240);p.pointer('pointerup',280,240);
    assert.equal(p.state().chapters.dissolution.charged,false);assert.equal(p.$('#co2DropTarget').classList.contains('receiving'),false);
    p.drag(280,240);assert.equal(p.state().chapters.dissolution.charged,true);assert.equal(p.$('#co2Interaction').hidden,true);
    p.advance('dissolution',4.2);assert.equal(p.state().chapters.dissolution.won,false);assert.ok(p.state().chapters.dissolution.elapsed>3);
    p.open('flow');const before=p.state().chapters.dissolution.elapsed;p.advance('dissolution',10);assert.equal(p.state().chapters.dissolution.elapsed,before,'background chapters do not advance');
    p.open('dissolution');p.advance('dissolution',4.2);assert.equal(p.state().chapters.dissolution.won,true);
    assert.deepEqual(p.errors,[]);
  }finally{p.dom.window.close();}
});

test('keyboard CO2 alternative starts dissolution without requiring a drag',async()=>{
  const p=await page();
  try{p.arrive('dissolution');p.click('#co2Token');assert.equal(p.state().chapters.dissolution.charged,true);p.advance('dissolution',8.1);assert.equal(p.state().chapters.dissolution.won,true);assert.deepEqual(p.errors,[]);}finally{p.dom.window.close();}
});

test('water drop requires arrival and a deliberate drag to the current lower target',async()=>{
  const p=await page();
  try{
    p.open('deposition');assert.equal(p.$('#waterDropInteraction').hidden,true);
    const stamps=JSON.stringify(p.state().stamps);
    p.drag(380,350,'#waterDropHandle');p.click('#waterDropHandle');p.interact('start');p.advance('deposition',12);
    assert.equal(p.state().chapters.deposition.running,false);assert.equal(JSON.stringify(p.state().stamps),stamps,'dragging never creates a POI arrival');
    p.click('[data-chapter-checkin]');assert.equal(p.$('#waterDropInteraction').hidden,false);
    p.drag(280,240,'#waterDropHandle');assert.equal(p.state().chapters.deposition.running,false,'the CO2 target is not a pool target');
    p.pointer('pointerdown',380,350,7,'#waterDropHandle');p.pointer('pointerup',380,350,7,'#waterDropHandle');
    assert.equal(p.state().chapters.deposition.running,false,'a tap at the destination must not count as dragging');
    p.pointer('pointerdown',80,180,7,'#waterDropHandle');p.pointer('pointermove',380,350,7,'#waterDropHandle');p.pointer('pointercancel',380,350,7,'#waterDropHandle');p.pointer('pointerup',380,350,7,'#waterDropHandle');
    assert.equal(p.state().chapters.deposition.running,false);assert.equal(p.$('#waterDropNextTarget').classList.contains('receiving'),false);
    p.drag(380,350,'#waterDropHandle');assert.equal(p.state().chapters.deposition.running,true);assert.equal(p.state().chapters.deposition.travel,0);assert.equal(p.$('#waterDropInteraction').hidden,true);
    assert.ok(p.sceneDrag.some(event=>event[0]==='end'&&event[1]===true),'accepted drop is handed to the renderer');
    p.advance('deposition',.3);p.click('#waterDropHandle');p.interact('start');
    assert.ok(p.state().chapters.deposition.travel>0,'duplicate start must not reset an already travelling drop');
    p.advance('deposition',1.8);
    assert.ok(p.state().chapters.deposition.fraction>0,'duplicate starts must not reset travel or the growth clock');assert.equal(p.state().chapters.deposition.sequence,0);
    p.advance('deposition',10);assert.equal(p.state().chapters.deposition.sequence,3);assert.equal(p.state().chapters.deposition.running,false);assert.equal(p.$('#waterDropInteraction').hidden,false);
    p.setTargetRect('water',{left:480,top:350,right:560,bottom:440,width:80,height:90});
    p.drag(380,350,'#waterDropHandle');assert.equal(p.state().chapters.deposition.running,false,'the previous location cannot trigger the next pool');
    p.drag(520,390,'#waterDropHandle');assert.equal(p.state().chapters.deposition.running,true);
    assert.deepEqual(p.errors,[]);
  }finally{p.dom.window.close();}
});

test('keyboard pool action runs one cycle and reloading preserves travel before growth',async()=>{
  const p=await page();
  try{
    p.arrive('deposition');p.click('#waterDropHandle');assert.equal(p.state().chapters.deposition.running,true);
    p.advance('deposition',.3);
    p.setHidden(true);p.w.document.dispatchEvent(new p.w.Event('visibilitychange'));
    const saved=p.state();assert.ok(saved.chapters.deposition.travel>0&&saved.chapters.deposition.travel<1);assert.equal(saved.chapters.deposition.fraction,0);
    const q=await page(p.save());
    try{
      assert.equal(q.state().chapters.deposition.travel,saved.chapters.deposition.travel);assert.equal(q.$('#waterDropInteraction').hidden,true);
      q.advance('deposition',10);assert.equal(q.state().chapters.deposition.sequence,3);assert.equal(q.state().chapters.deposition.running,false);assert.equal(q.$('#waterDropInteraction').hidden,false);
      assert.deepEqual(q.errors,[]);
    }finally{q.dom.window.close();}
    assert.deepEqual(p.errors,[]);
  }finally{p.dom.window.close();}
});

test('switching chapter, pausing, context loss or leaving page cancels unfinished drags',async()=>{
  for(const trigger of ['switch','pause','contextlost','pagehide']){
    const p=await page();
    try{
      p.arrive('dissolution');p.pointer('pointerdown',80,180);p.pointer('pointermove',280,240);
      if(trigger==='switch')p.open('flow');
      if(trigger==='pause')p.click('[data-scene-control="pause"]');
      if(trigger==='contextlost')p.$('#waterScene').dispatchEvent(new p.w.Event('webglcontextlost',{bubbles:true}));
      if(trigger==='pagehide')p.w.dispatchEvent(new p.w.Event('pagehide'));
      p.pointer('pointerup',280,240);
      assert.equal(p.state().chapters.dissolution.charged,false,trigger+' must not leave an active drop gesture');
      assert.equal(p.$('#co2Token').classList.contains('dragging'),false);assert.equal(p.$('#co2DropTarget').classList.contains('receiving'),false);
      assert.deepEqual(p.errors,[]);
    }finally{p.dom.window.close();}
  }
});

test('older v3 saves without travel continue their existing pool animation',async()=>{
  const earned='2026-09-20T03:00:00Z';
  const raw=JSON.stringify({version:3,activeChapter:'deposition',stamps:{'five-color-pond':earned},chapters:{deposition:{sequence:1,fraction:.4,running:true,won:false,earnedAt:null}}});
  const p=await page(raw);
  try{assert.equal(p.state().chapters.deposition.travel,1);assert.equal(p.state().chapters.deposition.sequence,1);assert.equal(p.$('#waterDropInteraction').hidden,true);p.advance('deposition',6);assert.equal(p.state().chapters.deposition.sequence,3);assert.deepEqual(p.errors,[]);}finally{p.dom.window.close();}
});

test('no-WebGL fallback advances only while visible and unpaused, without real timers',async()=>{
  const p=await page(undefined,{fallback:true});
  try{
    assert.equal(p.$('#waterScene').dataset.renderState,'fallback');p.arrive('dissolution');p.click('[data-game-action="charge"]');
    p.advanceFallback(2.2);const before=p.state().chapters.dissolution.elapsed;assert.ok(before>1);
    p.click('[data-scene-control="pause"]');p.advanceFallback(10);assert.equal(p.state().chapters.dissolution.elapsed,before);
    p.click('[data-scene-control="pause"]');p.setHidden(true);p.advanceFallback(10);assert.equal(p.state().chapters.dissolution.elapsed,before);
    p.setHidden(false);p.setSceneRect({left:0,top:-500,right:600,bottom:-100,width:600,height:400});p.advanceFallback(10);assert.equal(p.state().chapters.dissolution.elapsed,before);
    p.setSceneRect({left:0,top:100,right:600,bottom:460,width:600,height:360});p.advanceFallback(6.1);assert.equal(p.state().chapters.dissolution.won,true);
    assert.equal(p.$('#waterAction').textContent,'重新体验本章');assert.deepEqual(p.errors,[]);
  }finally{p.dom.window.close();}
});

test('reduced-motion mode advances deliberately through the same deposition phases',async()=>{
  const p=await page(undefined,{reducedMotion:true});
  try{
    p.arrive('deposition');p.click('#waterAction');assert.equal(p.$('#waterMotionStep').hidden,false);
    p.advance('deposition',12);assert.equal(p.state().chapters.deposition.sequence,0);
    for(let phase=1;phase<=3;phase++){p.click('#waterMotionStep');assert.equal(p.state().chapters.deposition.sequence,phase);}
    assert.equal(p.state().chapters.deposition.running,false);assert.equal(p.$('#waterAction').disabled,false);assert.deepEqual(p.errors,[]);
  }finally{p.dom.window.close();}
});

test('legacy browser save is backed up before v3 migration and keeps the original badge',async()=>{
  const old=JSON.stringify({version:1,selected:['welcome-pond'],stamps:{'welcome-pond':'2026-09-20T03:00:00Z'},gameStep:3});
  const p=await page(old);
  try{assert.equal(p.w.localStorage.getItem(key+'.backup'),old);assert.equal(p.state().version,3);assert.equal(p.$('#waterUnlock').hidden,true);assert.equal(p.$('#waterJourneyCount').textContent,'0 / 4 章');assert.match(p.$('#waterBadgeSlot').textContent,/初版/);assert.deepEqual(p.errors,[]);}finally{p.dom.window.close();}
});

test('v2 chapter rewards migrate with a separate backup and survive replay',async()=>{
  const earned='2026-09-20T03:00:00Z';
  const old=JSON.stringify({version:2,activeChapter:'deposition',gameStep:3,chapterBadgeAt:earned,stamps:{'welcome-pond':earned,'wash-body-viewpoint':earned,'liantai-fall':earned,'five-color-pond':earned},chapters:Object.fromEntries(['flow','dissolution','emergence','deposition'].map(id=>[id,{won:true,earnedAt:earned,channels:[1,0,1],charged:true,sites:[0,1,2],level:80,outlet:1,layers:[1,1,1]}]))});
  const p=await page(old);
  try{
    assert.equal(p.w.localStorage.getItem(key+'.v2.backup'),old);assert.equal(p.w.localStorage.getItem(key+'.backup'),null);
    assert.equal(p.state().version,3);assert.equal(p.state().chapters.deposition.sequence,9);assert.equal(p.$('#waterJourneyCount').textContent,'4 / 4 章');
    assert.match(p.$('#waterBadgeSlot').textContent,/初版/);assert.match(p.$('#waterBadgeSlot').textContent,/山水同行者/);
    p.click('#waterAction');assert.equal(p.state().chapters.deposition.sequence,0);assert.equal(p.state().chapters.deposition.won,false);assert.equal(p.state().chapters.deposition.earnedAt,earned);assert.equal(p.state().chapterBadgeAt,earned);
    assert.deepEqual(p.errors,[]);
  }finally{p.dom.window.close();}
});
