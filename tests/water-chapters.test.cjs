const {test}=require('node:test');
const assert=require('node:assert/strict');
const f=require('../follow-state.js');
const ids=['welcome-pond','jinsha-pudi','wash-body-viewpoint','flying-waterfall','liantai-fall','five-color-pond','bonsai-pond','zhengyan-chi'];
function finish(s,id){
  if(id==='flow'){f.playChapter(s,id,'turn',0);f.playChapter(s,id,'turn',2);}
  if(id==='dissolution'){f.playChapter(s,id,'charge');for(let i=0;i<3;i++)f.playChapter(s,id,'observe',i);}
  if(id==='emergence'){f.playChapter(s,id,'outlet',1);f.playChapter(s,id,'level',80);}
  if(id==='deposition')for(let i=0;i<3;i++){f.playChapter(s,id,'rim',i);f.playChapter(s,id,'time',100);}
  return f.playChapter(s,id,'finish');
}
test('locked chapters refuse all game mutations and choosing POIs never unlocks them',()=>{
  const s=f.create();s.selected=ids;
  for(const c of f.CHAPTERS){assert.equal(f.isChapterUnlocked(s,c.id),false);const before=JSON.stringify(s);assert.equal(f.playChapter(s,c.id,'finish').ok,false);assert.equal(f.playChapter(s,c.id,'time',100).ok,false);assert.equal(JSON.stringify(s),before);}
});
test('arrivals unlock independent chapters, even in reverse route order',()=>{
  const s=f.create();f.checkIn(s,'five-color-pond',ids);
  assert.equal(f.isChapterUnlocked(s,'deposition'),true);assert.equal(f.isChapterUnlocked(s,'flow'),false);
  assert.equal(finish(s,'deposition').completed,true);assert.equal(s.chapterBadgeAt,null);
  for(const [id,poi] of [['emergence','liantai-fall'],['dissolution','wash-body-viewpoint'],['flow','welcome-pond']]){f.checkIn(s,poi,ids);assert.equal(finish(s,id).completed,true);}
  assert.ok(s.chapterBadgeAt);assert.deepEqual(s.completed,[],'chapter check-in must not skip route stops');
  assert.equal(Object.keys(s.stamps).length,4);
});
test('each puzzle requires its own interaction; replay keeps earned rewards without duplication',()=>{
  const s=f.create();ids.forEach(id=>f.checkIn(s,id,ids));
  for(const c of f.CHAPTERS){assert.equal(f.playChapter(s,c.id,'finish').completed,false);assert.equal(finish(s,c.id).completed,true);const stamp=s.chapters[c.id].earnedAt;f.resetChapter(s,c.id);assert.equal(s.chapters[c.id].earnedAt,stamp);assert.equal(s.chapters[c.id].won,false);assert.equal(finish(s,c.id).earned,false);assert.equal(s.chapters[c.id].earnedAt,stamp);}
});
test('invalid actions cannot solve a puzzle and dissolved sites deduplicate',()=>{
  const s=f.create();ids.forEach(id=>f.checkIn(s,id,ids));
  assert.equal(f.playChapter(s,'dissolution','observe',0).ok,false);
  f.playChapter(s,'dissolution','charge');for(let n=0;n<8;n++)f.playChapter(s,'dissolution','observe',0);
  assert.deepEqual(s.chapters.dissolution.sites,[0]);assert.equal(f.playChapter(s,'dissolution','finish').completed,false);
  for(const value of [NaN,Infinity,-1,101,'100'])assert.equal(f.playChapter(s,'emergence','level',value).ok,false);
  assert.equal(f.playChapter(s,'deposition','rim',9).ok,false);assert.equal(f.playChapter(s,'unknown','finish').ok,false);
});
test('v1 migration preserves real stamps and old badge but does not award new chapter completion',()=>{
  const old={version:1,stamps:{'five-color-pond':'2026-09-20T08:00:00Z'},completed:['five-color-pond'],gameStep:3,waterBadge:true};
  const s=f.restore(JSON.stringify(old),ids);assert.equal(s.version,2);assert.equal(s.waterBadge,true);assert.equal(f.isChapterUnlocked(s,'deposition'),true);assert.equal(s.chapters.deposition.earnedAt,null);assert.equal(s.chapterBadgeAt,null);
});
test('v2 restore keeps partial puzzle and replay rewards, rejects reward without arrival',()=>{
  const s=f.create();f.checkIn(s,'five-color-pond',ids);finish(s,'deposition');f.resetChapter(s,'deposition');f.playChapter(s,'deposition','rim',2);f.playChapter(s,'deposition','time',42);
  const restored=f.restore(JSON.stringify(s),ids);assert.equal(restored.chapters.deposition.layers[2],.42);assert.ok(restored.chapters.deposition.earnedAt);assert.equal(restored.chapters.deposition.won,false);
  delete s.stamps['five-color-pond'];const invalid=f.restore(JSON.stringify(s),ids);assert.equal(invalid.chapters.deposition.earnedAt,null);assert.deepEqual(invalid.chapters.deposition.layers,[0,0,0]);
});
