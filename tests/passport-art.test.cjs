const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {JSDOM}=require('jsdom');
const D=require('../data/passport'),P=require('../passport-state');
function art(){const w={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../passport-art.js'),'utf8'),{window:w});return w.HuanglongPassportArt;}
test('long personal notes stay complete in the shared preview/export SVG',()=>{
  const a=art(),s=P.create(),p=s.pages[0];p.note=Array.from({length:17},(_,i)=>'第'+(i+1)+'行观察').join('\n');
  const svg=a.notebook(p,s.profile,[]),dom=new JSDOM(svg,{contentType:'image/svg+xml'});
  try{assert.match(dom.window.document.documentElement.textContent,/第17行观察/);assert.ok(Number(dom.window.document.documentElement.getAttribute('height'))>1040);}finally{dom.window.close();}
});
test('rendered art cannot promote unowned objects and escapes personal text',()=>{
  const a=art(),s=P.create(),p=s.pages[0];p.title='<script>alert(1)</script>';p.note='A & B';p.items.push({id:'safe',art:'stamp:five-color-pond',x:50,y:50,size:28,rotation:0});
  const svg=a.notebook(p,s.profile,[]);assert.ok(!svg.includes('<image'));assert.ok(!svg.includes('<script>'));assert.match(svg,/A &amp; B/);
});
test('all six seals, stickers and theme badges are standalone, script-free SVGs',()=>{
  const files=[...D.places.map(p=>p.id),...D.experiments.map(e=>'sticker-'+e.id),...D.themes.map(t=>'badge-'+t.id)];
  for(const id of files){const source=fs.readFileSync(path.join(__dirname,'../assets/passport',id+'.svg'),'utf8');const dom=new JSDOM(source,{contentType:'image/svg+xml'});try{assert.ok(dom.window.document.querySelector('svg title'),id);assert.equal(dom.window.document.querySelector('script,image,foreignObject'),null,id+' should contain only local vectors');assert.ok(!source.includes('http:')||source.includes('http://www.w3.org/2000/svg'));}finally{dom.window.close();}}
});
