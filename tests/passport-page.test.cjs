const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..'),key='huanglong.passport.v1';
async function page(saved,{storageFailure=false}={}){
  const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://prototype.test/?view=follow&passportTab=passport',runScripts:'outside-only',virtualConsole:new VirtualConsole()}),w=dom.window;
  w.matchMedia=()=>({matches:true,addEventListener(){}});w.setInterval=()=>1;w.setTimeout=()=>1;
  w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLElement.prototype.scrollTo=()=>{};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  if(saved)for(const [k,v] of Object.entries(saved))w.localStorage.setItem(k,v);
  if(storageFailure)w.Storage.prototype.setItem=function(){throw new Error('quota');};
  for(const f of ['data/facilities.js','data/scenic.js','data/stamps.js','data/passport.js','passport-state.js','passport-art.js','passport.js','map.js','follow-state.js','follow.js','app.js']){assert.ok(fs.existsSync(path.join(root,f)),f+' must exist');vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),dom.getInternalVMContext(),{filename:f});}
  await Promise.resolve();const $=s=>w.document.querySelector(s),click=s=>{assert.ok($(s),s+' exists');$(s).click();};
  const input=(s,v)=>{$(s).value=v;$(s).dispatchEvent(new w.Event('input',{bubbles:true}));};
  const checkin=id=>{click(`[data-passport-place="${id}"]`);assert.equal($('#passportPlaceDialog').open,true);click('#passportConfirmArrival');};
  return {w,dom,$,click,input,checkin,state:()=>JSON.parse(w.localStorage.getItem(key)),saved:()=>Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]))};
}
test('passport connects manual arrival, experiment collection and persisted notebook',async()=>{
  const p=await page();try{
    assert.match(p.$('#passportSummary').textContent,/0/);
    p.checkin('five-color-pond');p.checkin('five-color-pond');
    assert.match(p.$('#passportSummary').textContent,/1/);
    p.click('[data-passport-tab="labs"]');p.click('[data-lab="color"]');
    p.click('#labRecord');p.input('[data-lab-control="depth"]',85);p.click('#labRecord');p.input('[data-lab-control="clarity"]',20);p.click('#labRecord');
    assert.match(p.$('#labFeedback').textContent,/贴纸/);assert.equal(p.state().observations.color.length,3);
    p.click('[data-passport-tab="notebook"]');p.input('#notebookTitle','一滴水的三种颜色');p.input('#notebookNote','今天的倒影很好看。');
    p.click('[data-add-art="stamp:five-color-pond"]');p.click('[data-add-art="sticker:color"]');
    assert.equal(p.$('#notebookCanvas').querySelectorAll('[data-notebook-item]').length,2);
    assert.equal(p.state().pages[0].title,'一滴水的三种颜色');
    const q=await page(p.saved());try{q.click('[data-passport-tab="notebook"]');assert.equal(q.$('#notebookTitle').value,'一滴水的三种颜色');assert.equal(q.$('#notebookNote').value,'今天的倒影很好看。');assert.equal(q.$('#notebookCanvas').querySelectorAll('[data-notebook-item]').length,2);}finally{q.w.close();}
  }finally{p.w.close();}
});
test('practice and missed check-ins cannot leak locked art into the notebook',async()=>{
  const p=await page();try{
    p.click('[data-passport-tab="labs"]');p.click('#labRecord');assert.match(p.$('#labFeedback').textContent,/预习/);assert.deepEqual(p.state().observations,{});
    p.click('[data-passport-tab="notebook"]');assert.equal(p.$('[data-add-art]'),null);
    assert.match(p.$('#notebookInventory').textContent,/到达/);
    p.click('[data-passport-tab="passport"]');p.click('[data-passport-place="five-color-pond"]');p.click('[data-close-passport-place]');
    assert.match(p.$('#passportSummary').textContent,/0/);
  }finally{p.w.close();}
});
test('legacy stamps remain owned and lack of storage is clearly reported',async()=>{
  const p=await page({'huanglong.travel-journal.v1':JSON.stringify({version:3,stamps:{'five-color-pond':'2026-09-29T00:00:00Z'}})});try{assert.match(p.$('#passportSummary').textContent,/1/);p.click('[data-passport-tab="notebook"]');assert.ok(p.$('[data-add-art="stamp:five-color-pond"]'));}finally{p.w.close();}
  const q=await page(undefined,{storageFailure:true});try{q.click('[data-passport-tab="notebook"]');q.input('#notebookTitle','临时手账');assert.match(q.$('#passportStorage').textContent,/无法保存|未能保存/);}finally{q.w.close();}
});

test('new pages dismiss a previous page deletion and dragging invalidates an in-flight export',async()=>{
  const p=await page();try{
    p.checkin('five-color-pond');p.click('[data-close-passport-place]');p.click('[data-passport-tab="notebook"]');p.click('#notebookAddPage');p.click('#notebookDeletePage');assert.equal(p.$('#notebookDeleteConfirm').hidden,false);
    p.click('#notebookAddPage');assert.equal(p.$('#notebookDeleteConfirm').hidden,true);
    p.click('[data-add-art="stamp:five-color-pond"]');
    let finish;p.w.HuanglongPassportArt.exportPage=()=>new Promise(resolve=>{finish=resolve;});p.click('#notebookDownload');
    function pointer(target,type,x,y){const e=new p.w.MouseEvent(type,{bubbles:true,button:0,clientX:x,clientY:y});Object.defineProperty(e,'pointerId',{value:7});target.dispatchEvent(e);}
    pointer(p.$('[data-notebook-item]'),'pointerdown',100,100);p.$('#notebookCanvas').getBoundingClientRect=()=>({width:360,height:520});
    pointer(p.$('#notebookPreview'),'pointermove',140,140);
    finish({png:'data:image/png;base64,AA==',svg:'data:image/svg+xml;base64,AA=='});await new Promise(resolve=>setImmediate(resolve));
    assert.equal(p.$('#notebookExport').hidden,true);assert.match(p.$('#notebookExportStatus').textContent,/修改/);
    pointer(p.$('#notebookPreview'),'pointerup',140,140);
    assert.equal(p.w.document.activeElement.getAttribute('data-notebook-item'),p.$('[data-notebook-item]').getAttribute('data-notebook-item'));
  }finally{p.w.close();}
});
