const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..'),key='huanglong.travel-journal.v1';
async function page(saved){
  const errors=[],console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://prototype.test/?view=follow',runScripts:'outside-only',virtualConsole:console});
  const w=dom.window;w.HTMLElement.prototype.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  if(saved)w.localStorage.setItem(key,saved);
  for(const file of ['data/facilities.js','data/scenic.js','map.js','follow-state.js','follow.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),dom.getInternalVMContext(),{filename:file});
  await Promise.resolve();
  const $=s=>w.document.querySelector(s),click=s=>{assert.ok($(s),'missing '+s);$(s).click();},slider=(s,n)=>{$(s).value=n;$(s).dispatchEvent(new w.Event('input',{bubbles:true}));};
  return {dom,w,$,click,slider,errors,save:()=>w.localStorage.getItem(key)};
}
test('page events complete four different games, with arrival unlock, fallback and reload',async()=>{
  const p=await page();
  try{
    assert.equal(p.$('#waterAction').disabled,true);assert.equal(p.$('#waterScene').dataset.renderState,'fallback');
    assert.equal(p.$('#waterChapterGrid').children.length,4);
    // Reverse visit order is allowed. Checking in outside the route cannot skip a stop.
    const itinerary=p.$('#followProgressText').textContent;
    p.click('[data-water-chapter="deposition"]');p.click('[data-chapter-checkin]');
    assert.equal(p.$('#waterGameControls').disabled,false);assert.equal(p.$('#followProgressText').textContent,itinerary);
    for(let i=0;i<3;i++){p.click(`[data-game-action="rim"][data-game-value="${i}"]`);p.slider('#depositTime',100);}
    p.click('#waterAction');assert.equal(p.$('#waterAction').textContent,'重新体验本章');
    p.click('[data-water-chapter="emergence"]');p.click('[data-chapter-checkin]');p.click('[data-game-action="outlet"][data-game-value="1"]');p.slider('#groundwaterLevel',80);p.click('#waterAction');
    p.click('[data-water-chapter="dissolution"]');p.click('[data-chapter-checkin]');p.click('[data-game-action="charge"]');for(let i=0;i<3;i++)p.click(`[data-game-action="observe"][data-game-value="${i}"]`);p.click('#waterAction');
    p.click('[data-water-chapter="flow"]');p.click('[data-chapter-checkin]');p.click('[data-game-action="turn"][data-game-value="0"]');p.click('[data-game-action="turn"][data-game-value="2"]');p.click('#waterAction');
    assert.equal(p.$('#waterJourneyCount').textContent,'4 / 4 章');assert.match(p.$('#waterBadgeSlot').textContent,/山水同行者/);
    const reward=JSON.parse(p.save()).chapterBadgeAt;p.click('#waterAction');assert.equal(p.$('#waterGameControls').disabled,false);assert.equal(JSON.parse(p.save()).chapterBadgeAt,reward);
    const q=await page(p.save());try{assert.equal(q.$('#waterJourneyCount').textContent,'4 / 4 章');assert.equal(q.$('#waterGameControls').disabled,false);assert.equal(q.$('#waterUnlock').hidden,true);assert.deepEqual(q.errors,[]);}finally{q.dom.window.close();}
    assert.deepEqual(p.errors,[]);
  }finally{p.dom.window.close();}
});
test('legacy browser save is backed up before migration and existing arrival unlocks chapter',async()=>{
  const old=JSON.stringify({version:1,selected:['welcome-pond'],stamps:{'welcome-pond':'2026-09-20T03:00:00Z'},gameStep:3});
  const p=await page(old);try{assert.equal(p.w.localStorage.getItem(key+'.backup'),old);assert.equal(JSON.parse(p.save()).version,2);assert.equal(p.$('#waterUnlock').hidden,true);assert.equal(p.$('#waterJourneyCount').textContent,'0 / 4 章');assert.match(p.$('#waterBadgeSlot').textContent,/初版/);assert.deepEqual(p.errors,[]);}finally{p.dom.window.close();}
});
