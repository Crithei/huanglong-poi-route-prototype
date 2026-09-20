const {test}=require('node:test');
const assert=require('node:assert/strict');
const f=require('../follow-state.js');
const ids=['welcome-pond','jinsha-pudi','wash-body-viewpoint','flying-waterfall','liantai-fall','five-color-pond','bonsai-pond','zhengyan-chi'];
function advance(s,id,seconds){let result;for(let t=0;t<seconds;t+=.1)result=f.tickChapter(s,id,.1);return result;}
function finish(s,id){
  if(id==='flow'){f.playChapter(s,id,'turn',0);f.playChapter(s,id,'turn',2);advance(s,id,5);}
  if(id==='dissolution'){f.playChapter(s,id,'charge');advance(s,id,9);}
  if(id==='emergence'){f.playChapter(s,id,'level',80);advance(s,id,5);}
  if(id==='deposition')for(let i=0;i<3;i++){f.playChapter(s,id,'start');advance(s,id,10);}
  return {completed:s.chapters[id].won,earned:!!s.chapters[id].earnedAt};
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
  for(const c of f.CHAPTERS){assert.equal(f.playChapter(s,c.id,'finish').completed,false);assert.equal(finish(s,c.id).completed,true);const stamp=s.chapters[c.id].earnedAt;f.resetChapter(s,c.id);assert.equal(s.chapters[c.id].earnedAt,stamp);assert.equal(s.chapters[c.id].won,false);finish(s,c.id);assert.equal(s.chapters[c.id].earnedAt,stamp);}
});
test('old observation and outlet actions are removed; time cannot skip animations',()=>{
 const s=f.create();ids.forEach(id=>f.checkIn(s,id,ids));
 for(const [id,action,value] of [['dissolution','observe',0],['emergence','outlet',1],['deposition','time',100],['deposition','rim',2]])assert.equal(f.playChapter(s,id,action,value).ok,false);
 f.playChapter(s,'dissolution','charge');f.tickChapter(s,'dissolution',10000);assert.ok(s.chapters.dissolution.elapsed<=.25);assert.equal(s.chapters.dissolution.won,false);
 for(const value of [NaN,Infinity,-1,101,'100'])assert.equal(f.playChapter(s,'emergence','level',value).ok,false);
 const before=JSON.stringify(s);f.tickChapter(s,'dissolution',NaN);f.tickChapter(s,'dissolution',-1);assert.equal(JSON.stringify(s),before);
});
test('v1 migration preserves real stamps and old badge but does not award new chapter completion',()=>{
  const old={version:1,stamps:{'five-color-pond':'2026-09-20T08:00:00Z'},completed:['five-color-pond'],gameStep:3,waterBadge:true};
  const s=f.restore(JSON.stringify(old),ids);assert.equal(s.version,3);assert.equal(s.waterBadge,true);assert.equal(f.isChapterUnlocked(s,'deposition'),true);assert.equal(s.chapters.deposition.earnedAt,null);assert.equal(s.chapterBadgeAt,null);
});
test('v3 restores partial sequence, earned replay rewards, and rejects progress without arrival',()=>{
 const s=f.create();f.checkIn(s,'five-color-pond',ids);finish(s,'deposition');f.resetChapter(s,'deposition');f.playChapter(s,'deposition','start');advance(s,'deposition',4);
 const restored=f.restore(JSON.stringify(s),ids);assert.equal(restored.chapters.deposition.sequence,1);assert.ok(restored.chapters.deposition.fraction>0);assert.ok(restored.chapters.deposition.earnedAt);assert.equal(restored.chapters.deposition.won,false);
 delete s.stamps['five-color-pond'];const invalid=f.restore(JSON.stringify(s),ids);assert.equal(invalid.chapters.deposition.earnedAt,null);assert.equal(invalid.chapters.deposition.sequence,0);
});
test('v2 migration preserves earned chapters but unfinished old observation tasks restart',()=>{
 const s=f.create();s.version=2;ids.forEach(id=>f.checkIn(s,id,ids));s.chapters.dissolution={charged:true,sites:[0,1],won:false,earnedAt:null};s.chapters.deposition={rim:2,layers:[1,1,1],won:true,earnedAt:'2026-09-20T08:00:00Z'};
 const restored=f.restore(JSON.stringify(s),ids);assert.equal(restored.chapters.dissolution.elapsed,0);assert.equal(restored.chapters.dissolution.won,false);assert.equal(restored.chapters.deposition.sequence,9);assert.equal(restored.chapters.deposition.won,true);
});
test('deposition pauses between ponds and cannot fill a pool before its rim',()=>{
 const s=f.create();f.checkIn(s,'five-color-pond',ids);advance(s,'deposition',20);assert.equal(s.chapters.deposition.sequence,0);
 f.playChapter(s,'deposition','start');advance(s,'deposition',1);assert.equal(s.chapters.deposition.sequence,0);assert.ok(s.chapters.deposition.fraction>0);
 advance(s,'deposition',20);assert.equal(s.chapters.deposition.sequence,3);assert.equal(s.chapters.deposition.running,false);assert.equal(s.chapters.deposition.won,false);
});

test('the travelling drop reaches the next area before a rim grows, including after reload',()=>{
 const s=f.create();f.checkIn(s,'five-color-pond',ids);f.playChapter(s,'deposition','start');
 assert.equal(s.chapters.deposition.travel,0);
 f.tickChapter(s,'deposition',.25);assert.ok(s.chapters.deposition.travel>0&&s.chapters.deposition.travel<1);
 assert.equal(s.chapters.deposition.fraction,0);assert.equal(f.playChapter(s,'deposition','start').ok,false);
 const restored=f.restore(JSON.stringify(s),ids);assert.equal(restored.chapters.deposition.travel,s.chapters.deposition.travel);
 f.tickChapter(restored,'deposition',.25);f.tickChapter(restored,'deposition',.25);assert.equal(restored.chapters.deposition.travel,1);assert.equal(restored.chapters.deposition.fraction,0);
 f.tickChapter(restored,'deposition',.1);assert.ok(restored.chapters.deposition.fraction>0);
 delete s.chapters.deposition.travel;const legacy=f.restore(JSON.stringify(s),ids);assert.equal(legacy.chapters.deposition.travel,1,'existing running saves continue without a new travel stage');
 assert.equal(s.completed.length,0);assert.equal(Object.keys(s.stamps).length,1);
});
