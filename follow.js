// Travel journal UI; kept separate from route calculation and the 3D renderer.
window.HuanglongFollow=(()=>{
  const engine=window.HuanglongJournal,key='huanglong.travel-journal.v1';
  let journal=engine.create(),context=null,scene=null,bound=false,guideMode='play',paused=false,toastTimer;
  const $=selector=>document.querySelector(selector);
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const chapterCopy={
    flow:{scene:'01 / 森林坡面与水道',copy:'三段水槽还没有接上。点击编号转向，顺着左、右、左三个低处连接水路，再放水试试。',finish:'放水，检验我的水路',science:'重力让水沿地势流动。转动水槽是虚拟游戏，现场请留在栈道观察薄水与坡面。',fallback:'山坡来水 → 三段水槽 → 下游。用下方按钮转向接通。'},
    dissolution:{scene:'02 / 岩层里的微小旅程',copy:'先让水带上二氧化碳，再轻点岩层里的 ①②③。观察岩石轮廓与水中亮点怎样变化，把看不见的溶解过程放大。',finish:'记录这次岩层发现',science:'含二氧化碳的水在适当条件下可溶解碳酸盐岩。亮点代表溶解物，不是碎石。地下剖面为科普示意，不代表洗身洞实测结构，也不要求入洞。',fallback:'含 CO₂ 的水 → 接触岩石 → 携带溶解物。下方三个观察点对应图中编号。'},
    emergence:{scene:'03 / 从地下，到地表',copy:'寻找能连通地表的裂隙，再把地下水位推到金色出口线以上。看看泉水什么时候出现，怎样流过跌坎。',finish:'记录泉水出露',science:'出露是地下水来到地表；二氧化碳逸出是气体离开水体，两者不同。这里借飞瀑理解过程，不把景点认定为已核实的地下水源口。',fallback:'地下水位达到出口 → 开放裂隙 → 泉水出流。选择中间出口，把水位提升到 65% 以上。'},
    deposition:{scene:'04 / 时间留下的彩池',copy:'选择三处池沿，分别推演多轮水流。让每一处浅色沉积逐渐增厚，最后拼出属于这滴水的彩池。',finish:'收下彩池营造印记',science:'二氧化碳逸出等条件可促使碳酸钙沉积。累积需要时间，滑杆没有真实年限比例；水滴本身不会变成石头。',fallback:'水携带溶解物 → 合适条件下沉积 → 池沿长期累积。选择三处池沿，再分别推动时间。'},
  };
  const games={
    'five-color-pond':{title:'找一条属于你的彩池弧线',task:'先看整片池群，再选三处形状不同的池沿。试着用手指在空中描出它们的弧线，看看哪一段最像扇面。',photo:'让池沿带着视线向远处走',compose:'选一条弯曲池沿作为画面起点，把后方彩池留在上半部。拍完全景，再选相邻的两种水色拍一张局部。',tip:'只在开放栈道选角度；附近休息亭不一定就是全景机位。'},
    'jinsha-pudi':{title:'看见金色坡面上的一层薄水',task:'找一段能看清水流的坡面，先看流动方向，再看钙华的纹理。同一段滩面，远看和近看有哪些不同？',photo:'让金色纹理成为主角',compose:'沿坡面的延伸方向取景，让金色滩流形成一条斜线，边缘留一点树林。光线柔和时，可以缩小画面专拍细流。',tip:'“金沙”是观感，眼前是钙华。留在栈道上，用取景代替靠近。'},
    'bonsai-pond':{title:'找一盆天然的小小山水',task:'找一处池沿绕着树根弯转的地方，把树根、池水和一小片草木放在同一视野里。哪一组最像天然盆景？',photo:'给池沿一个前景的位置',compose:'让近处池沿落在画面下方，树木放在一侧，后方留出水面。轻轻换一个站位，看看层次如何变化。',tip:'站位以允许通行范围为准，不踏入池堤或植被。'},
  };
  function save(){try{localStorage.setItem(key,JSON.stringify(journal));$('#journalStorage').textContent='进度与印章保存在此设备。';}catch{$('#journalStorage').textContent='当前浏览器无法保存进度；本次仍可体验，关闭后可能丢失。';}}
  function restoreInto(state,pois){
    let raw=null;try{raw=localStorage.getItem(key);if(raw&&JSON.parse(raw)?.version===1&&!localStorage.getItem(key+'.backup'))localStorage.setItem(key+'.backup',raw);}catch{}
    journal=engine.restore(raw,pois.map(p=>p.id));
    if(journal.selected!==null)state.selectedPoiIds=new Set(journal.selected);
    state.completedPoiIds=new Set(journal.completed);state.preferences={...state.preferences,...journal.preferences};
  }
  function current(){return context?.plan.included.find(p=>!context.state.completedPoiIds.has(p.id));}
  function announce(text){$('#journalAnnouncement').textContent=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('#journalAnnouncement').textContent='';},3200);}
  function stamp(poi,earned=true){
    const color=earned?'#48755e':'#899483';
    const paths=poi?.collection==='culture'?'<path d="M24 48L50 31 76 48M30 47h40M35 49v24m30-24v24M29 73h42M44 56v17m12-17v17"/>':poi?.collection==='waterfall'?'<path d="M29 36h41M34 36c12 13-6 23 5 38m13-38c12 13-7 25 3 38m11-38c-7 16 7 23-3 38M29 75h41"/>':poi?.collection==='landform'?'<path d="M25 68l19-28 11 17 10-23 13 34M27 76c13-9 29 6 47-2M38 61l5-8 5 7"/>':'<path d="M24 46c3-12 39-17 50-4 8 11-37 21-50 10m0 3c4 13 45 9 52-4M24 61c6 14 43 11 51-1M29 73c9 9 34 7 43-1"/>';
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="45" fill="#f2f1dc" stroke="${color}" stroke-width="1.5"/><circle cx="50" cy="50" r="40" fill="none" stroke="${color}" stroke-width=".7" stroke-dasharray="2 3"/><g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</g><text x="50" y="25" text-anchor="middle" font-size="6" font-family="sans-serif" letter-spacing="1.4" fill="${color}">HUANGLONG</text><circle cx="23" cy="31" r="1.6" fill="${color}"/><circle cx="77" cy="31" r="1.6" fill="${color}"/></svg>`;
  }
  function waterStamp(){return '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 4l13 8 15 1 5 14 11 12-5 15 1 16-14 8-9 14-17-3-16 3-10-14-14-8 1-16-5-15 11-12 5-14 15-1z" fill="#d8deb3" stroke="#99ac76"/><circle cx="50" cy="49" r="32" fill="#f9f7df"/><path d="M50 25c-5 12-17 20-17 30a17 17 0 0034 0c0-10-12-18-17-30z" fill="#66b4ac"/><path d="M39 56c0 7 4 10 8 11" fill="none" stroke="#ddf4dd" stroke-width="3" stroke-linecap="round"/><circle cx="46" cy="53" r="1.5" fill="#385d4b"/><circle cx="57" cy="53" r="1.5" fill="#385d4b"/></svg>';}
  function renderBook(){
    const earned=engine.CHAPTERS.filter(c=>journal.chapters[c.id].earnedAt);
    $('#stampCount').textContent=`${Object.keys(journal.stamps).length+earned.length+(journal.waterBadge?1:0)+(journal.chapterBadgeAt?1:0)} 枚印章`;
    $('#waterBadgeSlot').innerHTML=(journal.waterBadge?`<div class="water-badge-card">${waterStamp()}<div><strong>水的见证者</strong><p>初版一滴水体验纪念 · 已保留</p></div></div>`:'')+(journal.chapterBadgeAt?`<div class="water-badge-card chapter-grand-badge">${waterStamp()}<div><strong>山水同行者</strong><p>四处相遇，读懂一滴水的旅程。<br>四章全部完成</p></div></div>`:'')+`<div class="chapter-reward-grid">${engine.CHAPTERS.map(c=>`<div class="chapter-reward ${journal.chapters[c.id].earnedAt?'earned':''}"><i data-lucide="${c.icon}" aria-hidden="true"></i><strong>${c.reward}</strong><small>${journal.chapters[c.id].earnedAt?'已收下':c.label+'章待完成'}</small></div>`).join('')}</div>`;
    $('#stampGrid').innerHTML=context.pois.filter(p=>p.kind==='scenic'||journal.stamps[p.id]).map(p=>`<div class="stamp-item ${journal.stamps[p.id]?'':'locked'}">${stamp(p,!!journal.stamps[p.id])}<strong>${escape(p.name)}</strong><small>${journal.stamps[p.id]?'已收集 · '+new Date(journal.stamps[p.id]).toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'}):'尚未抵达'}</small></div>`).join('');
  }
  function renderGuide(poi){
    const panel=$('#fieldGuidePanel');$('#fieldGuideTitle').textContent=poi?`${poi.name} · 小发现`:'先挑一处想看的风景';
    for(const b of document.querySelectorAll('[data-guide-mode]')){const active=b.dataset.guideMode===guideMode;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;}
    panel.setAttribute('aria-labelledby',guideMode==='play'?'playGuideTab':'photoGuideTab');
    if(!poi){panel.innerHTML='<p class="guide-tip">到“发现”页挑选景点，本站攻略会跟着行程更新。水滴章节可预览，到关联景点后打卡解锁互动。</p>';return;}
    const specific=games[poi.id];
    if(guideMode==='photo')panel.innerHTML=`<div class="photo-frame" aria-label="构图示意，不代表实际机位"><span>构图示意 · 非实景机位</span></div><div class="guide-prompt"><span class="guide-number">↗</span><div><h3>${escape(specific?.photo||'试着这样构图')}</h3><p>${escape(specific?.compose||poi.photoTip||poi.description)}</p></div></div><p class="guide-tip">${escape(specific?.tip||'先站稳再拍摄，在开放栈道内寻找自己的角度。')}</p>`;
    else panel.innerHTML=`<div class="guide-prompt"><span class="guide-number">01</span><div><h3>${escape(specific?.title||'先留意眼前这个细节')}</h3><p>${escape(specific?.task||poi.visitGuide?.viewing||poi.introduction)}</p></div></div><div class="guide-prompt"><span class="guide-number">02</span><div><h3>带着发现，多看一眼</h3><p>${escape(poi.highlights?.[0]||poi.description)}。${escape(poi.visitGuide?.expectation||'结合现场说明，了解这处景观。')}</p></div></div>`;
  }
  function renderGame(){
    const id=journal.activeChapter,c=engine.CHAPTERS.find(c=>c.id===id),copy=chapterCopy[id],p=journal.chapters[id],unlocked=engine.isChapterUnlocked(journal,id);
    const name=poiId=>context.pois.find(p=>p.id===poiId)?.name||poiId;
    $('#waterJourneyCount').textContent=engine.CHAPTERS.filter(c=>journal.chapters[c.id].earnedAt).length+' / 4 章';
    $('#waterChapterGrid').innerHTML=engine.CHAPTERS.map((c,i)=>{const unlocked=engine.isChapterUnlocked(journal,c.id),earned=journal.chapters[c.id].earnedAt;return `<button type="button" class="chapter-card ${c.id===id?'active':''} ${earned?'earned':''}" data-water-chapter="${c.id}" aria-pressed="${c.id===id}"><span class="chapter-card-top"><span>0${i+1} / ${c.label}</span><i data-lucide="${earned?'circle-check':unlocked?c.icon:'lock-keyhole'}" aria-hidden="true"></i></span><strong>${({flow:'穿过山林',dissolution:'走进岩层',emergence:'遇见天空',deposition:'长成彩池'})[c.id]}</strong><small>${escape(c.poiIds.map(name).join(' / '))}</small><span class="chapter-card-state">${earned?'已完成 · 可重玩':unlocked?'已解锁 · 开始探索':'到站解锁'}</span></button>`;}).join('');
    $('#waterScene').dataset.chapter=id;
    $('#waterSceneLabel').textContent=copy.scene;$('#waterSceneState').textContent=p.won?'本章已完成':unlocked?'已到站 · 可互动':'模型预览 · 互动未解锁';
    $('#waterFallbackTitle').textContent=c.label+'过程示意';$('#waterFallbackCopy').textContent=copy.fallback;
    $('#waterStageLabel').textContent=c.label.toUpperCase()+' / '+c.poiIds.map(name).join(' · ');$('#waterStageTitle').textContent=c.title;$('#waterStageCopy').textContent=copy.copy;$('#waterScience').textContent=copy.science;
    const unlock=$('#waterUnlock');unlock.hidden=unlocked;
    unlock.innerHTML=unlocked?'':`<div class="unlock-title"><i data-lucide="map-pin" aria-hidden="true"></i><strong>到达关联景点，打开这一章</strong></div><p>任意到达下列一处即可。当前使用手动打卡。</p><label for="chapterArrivalPoi">我此刻在</label><select id="chapterArrivalPoi">${c.poiIds.map(poiId=>`<option value="${poiId}">${escape(name(poiId))}</option>`).join('')}</select><div><button type="button" class="journal-primary" data-chapter-checkin>我已到达 · 打卡解锁</button><button type="button" class="journal-secondary" data-chapter-poi>景点介绍</button></div>`;
    const controls=$('#waterGameControls');controls.disabled=!unlocked||p.won;
    const button=(action,value,label,selected=false)=>`<button type="button" data-game-action="${action}" data-game-value="${value}" aria-pressed="${selected}" class="game-choice ${selected?'selected':''}">${label}</button>`;
    if(id==='flow')controls.innerHTML=`<legend>接通三段水路</legend><div class="game-three">${p.channels.map((v,i)=>button('turn',i,`<span>水槽 ${i+1}</span><strong>${v?'↙ 向左':'↘ 向右'}</strong>`,v===[1,0,1][i])).join('')}</div><p>从上往下，低处依次在左、右、左。点击水槽转向。</p>`;
    if(id==='dissolution')controls.innerHTML=`<legend>岩层观察实验</legend>${button('charge','',p.charged?'✓ 含 CO₂ 的水已进入':'① 让水带上二氧化碳',p.charged)}<div class="game-three">${[0,1,2].map(i=>button('observe',i,`<span>溶解点 ${i+1}</span><strong>${p.sites.includes(i)?'✓ 已观察':'轻点观察'}</strong>`,p.sites.includes(i))).join('')}</div><p>先准备水，再观察岩石。再次点击同一点不重复计数。</p>`;
    if(id==='emergence')controls.innerHTML=`<legend>寻找出露的条件</legend><div class="game-three">${['封闭支路','开放裂隙','岩层阻挡'].map((label,i)=>button('outlet',i,`<span>出口 ${i+1}</span><strong>${label}</strong>`,p.outlet===i)).join('')}</div><label class="game-range-label" for="groundwaterLevel">地下水位 <output id="groundwaterValue">${Math.round(p.level)}%</output></label><input id="groundwaterLevel" type="range" min="0" max="100" value="${p.level}" data-game-slider="level"/><p>金色标线是出口高度：65%。水位高于开放出口时，地表开始出流。</p>`;
    if(id==='deposition')controls.innerHTML=`<legend>给彩池留下一圈时间</legend><div class="game-three">${p.layers.map((n,i)=>button('rim',i,`<span>池沿 ${i+1}</span><strong>${Math.round(n*100)}%</strong>`,p.rim===i)).join('')}</div><label class="game-range-label" for="depositTime">池沿 ${p.rim+1} · 累积过程 <output id="depositValue">${Math.round(p.layers[p.rim]*100)}%</output></label><input id="depositTime" type="range" min="0" max="100" value="${p.layers[p.rim]*100}" data-game-slider="time"/><p>把时间推至右端，再换下一处池沿。进度代表演示过程，不是真实年限。</p>`;
    const action=$('#waterAction');action.textContent=p.won?'重新体验本章':unlocked?copy.finish:'到站打卡后开始';action.disabled=!unlocked;action.classList.toggle('completed',p.won);
    $('#waterGameFeedback').textContent=p.won?'已收下「'+c.reward+'」。你可以按自己的游线，继续解锁其他章节。':unlocked?'已解锁，试试上方模型编号或下方控件。':'模型可预览，小游戏等待你到达。';
    syncGame();
  }
  function syncGame(){
    const id=journal.activeChapter,p=journal.chapters[id],c=engine.CHAPTERS.find(c=>c.id===id);
    $('#waterGameProgress').textContent=id==='flow'?`${p.channels.filter((v,i)=>v===[1,0,1][i]).length} / 3 段方向正确`:id==='dissolution'?`${p.sites.length} / 3 处已观察`:id==='emergence'?(p.outlet===1&&p.level>=65?'泉水已经出露':'等待水位与出口连通'):`${p.layers.filter(v=>v===1).length} / 3 处沉积完成`;
    $('#waterGameReward').textContent=p.earnedAt?'✓ '+c.reward:'本章印记 · '+c.reward;
    scene?.setChapter(id,p,engine.isChapterUnlocked(journal,id));
  }
  function play(action,value,slider=false){
    const result=engine.playChapter(journal,journal.activeChapter,action,value);save();
    if(slider){syncGame();const p=journal.chapters[journal.activeChapter];if(action==='level')$('#groundwaterValue').textContent=Math.round(p.level)+'%';if(action==='time'){$('#depositValue').textContent=Math.round(p.layers[p.rim]*100)+'%';$('#depositTime').value=p.layers[p.rim]*100;const choices=$('#waterGameControls').querySelectorAll('.game-choice strong');choices[p.rim].textContent=Math.round(p.layers[p.rim]*100)+'%';}}
    else{renderGame();renderBook();context.refreshIcons();}
    $('#waterGameFeedback').textContent=result.message;
    if(result.earned)announce(result.message+(journal.chapterBadgeAt?' 四章集齐，获得「山水同行者」！':''));
  }
  function downloadJournal(){
    const places=context.pois.filter(p=>journal.stamps[p.id]);
    const canvas=document.createElement('canvas');canvas.width=720;canvas.height=Math.max(850,710+Math.ceil(places.length/2)*94);
    const c=canvas.getContext('2d');if(!c)return;
    c.fillStyle='#f8f5e7';c.fillRect(0,0,720,canvas.height);c.strokeStyle='#b4c39d';c.lineWidth=2;c.strokeRect(25,25,670,canvas.height-50);
    c.fillStyle='#718d70';c.font='14px sans-serif';c.fillText('HUANGLONG   /   FIELD NOTES',55,79);
    c.fillStyle='#244e40';c.font='40px serif';c.fillText('我的黄龙山水印记',55,147);
    c.font='17px sans-serif';c.fillStyle='#8b9c7d';c.fillText(new Date().toLocaleDateString('zh-CN')+'  ·  '+places.length+' 处到达记录',55,188);
    c.fillStyle='#e4ecda';c.fillRect(45,220,630,320);
    for(let i=0;i<5;i++){
      const y=472-i*42,rx=217-i*24,x=355+Math.sin(i*1.6)*32;
      c.beginPath();c.ellipse(x,y+10,rx,51-i*4,-.13,0,Math.PI*2);c.fillStyle='#beac7d';c.fill();
      c.beginPath();c.ellipse(x,y,rx,51-i*4,-.13,0,Math.PI*2);c.fillStyle='#e2d5a6';c.fill();
      c.beginPath();c.ellipse(x,y-2,rx-12,39-i*4,-.13,0,Math.PI*2);c.fillStyle=['#68bfb0','#38b7b1','#85c9b5','#53b9a6','#9dcfb9'][i];c.fill();
    }
    c.fillStyle='#577b5f';c.font='21px serif';c.fillText(journal.chapterBadgeAt?'✧ 山水同行者 · 水滴四章完成':`水滴旅程 · ${engine.CHAPTERS.filter(c=>journal.chapters[c.id].earnedAt).length} / 4 章`,55,594);
    c.font='17px sans-serif';c.fillStyle='#3f6752';
    places.forEach((p,i)=>{const x=55+(i%2)*312,y=653+Math.floor(i/2)*94;c.strokeStyle='#a5b98f';c.lineWidth=1;c.beginPath();c.arc(x+18,y,17,0,Math.PI*2);c.stroke();c.fillText('✓',x+10,y+6);c.fillText(p.name,x+48,y+6);});
    if(!places.length){c.fillStyle='#8b9c7d';c.fillText('旅程刚刚开始，风景在前方。',55,660);}
    c.fillStyle='#8a9b7b';c.font='13px sans-serif';c.fillText('澄路 · 地点由游客手动确认，纪念此行。',55,canvas.height-60);
    const data=canvas.toDataURL('image/png');$('#journalCardPreview').hidden=false;$('#journalCardImage').onload=()=>$('#journalCardPreview').scrollIntoView({block:'start',behavior:'instant'});$('#journalCardImage').src=data;$('#journalCardDownload').href=data;
  }
  function bind(){
    if(bound)return;bound=true;
    $('#openStampBook').addEventListener('click',()=>{renderBook();context.refreshIcons();$('#stampDialog').showModal();});
    $('#closeStampBook').addEventListener('click',()=>$('#stampDialog').close());
    $('#stampDialog').addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.close();});
    $('#downloadJournal').addEventListener('click',downloadJournal);
    $('#followDetail').addEventListener('click',()=>{const poi=current()||context.plan.included.at(-1);if(poi)context.openPoiDetail(poi.id);});
    for(const button of document.querySelectorAll('[data-guide-mode]')){
      button.addEventListener('click',()=>{guideMode=button.dataset.guideMode;renderGuide(current()||context.plan.included.at(-1));});
      button.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const id=e.key==='Home'?'playGuideTab':e.key==='End'?'photoGuideTab':guideMode==='play'?'photoGuideTab':'playGuideTab';$('#'+id).click();$('#'+id).focus();});
    }
    for(const button of document.querySelectorAll('[data-scene-control]'))button.addEventListener('click',()=>{
      const action=button.dataset.sceneControl;if(action==='left')scene?.rotate(-1);if(action==='right')scene?.rotate(1);if(action==='reset')scene?.reset();if(action==='zoom')scene?.zoom(1);
      if(action==='pause'){paused=!paused;scene?.pause(paused);button.setAttribute('aria-pressed',String(paused));button.setAttribute('aria-label',paused?'继续场景动画':'暂停场景动画');button.innerHTML=`<i data-lucide="${paused?'play':'pause'}" aria-hidden="true"></i>`;context.refreshIcons();}
    });
    $('#waterChapterGrid').addEventListener('click',e=>{const b=e.target.closest('[data-water-chapter]');if(!b)return;journal.activeChapter=b.dataset.waterChapter;save();renderGame();context.refreshIcons();$(`[data-water-chapter="${journal.activeChapter}"]`).focus({preventScroll:true});});
    $('#waterUnlock').addEventListener('click',e=>{
      if(e.target.closest('[data-chapter-poi]'))context.openPoiDetail($('#chapterArrivalPoi').value);
      if(!e.target.closest('[data-chapter-checkin]'))return;
      const id=$('#chapterArrivalPoi').value,c=engine.CHAPTERS.find(c=>c.id===journal.activeChapter);
      if(!c.poiIds.includes(id))return;
      if(current()?.id===id)engine.arrive(journal,id,context.pois.map(p=>p.id));else engine.checkIn(journal,id,context.pois.map(p=>p.id));
      save();context.renderAll();announce('已记录到达，解锁「'+c.label+'」章节');$('#waterAction').focus({preventScroll:true});
    });
    $('#waterGameControls').addEventListener('click',e=>{const b=e.target.closest('[data-game-action]');if(!b)return;const action=b.dataset.gameAction,value=b.dataset.gameValue;play(action,value===''?undefined:Number(value));$(`[data-game-action="${action}"][data-game-value="${value}"]`)?.focus({preventScroll:true});});
    $('#waterGameControls').addEventListener('input',e=>{if(e.target.dataset.gameSlider)play(e.target.dataset.gameSlider,Number(e.target.value),true);});
    $('#waterAction').addEventListener('click',()=>{if(journal.chapters[journal.activeChapter].won){engine.resetChapter(journal,journal.activeChapter);save();renderGame();context.refreshIcons();}else play('finish');});
    window.addEventListener('pagehide',event=>{if(!event.persisted){scene?.dispose();scene=null;}});
  }
  function render(next){
    context=next;bind();const state=context.state,plan=context.plan;
    journal.selected=[...state.selectedPoiIds];journal.completed=[...state.completedPoiIds];journal.preferences={...state.preferences};
    if(journal.arrived&&!plan.included.some(p=>p.id===journal.arrived))journal.arrived=null;
    const poi=current(),done=plan.included.filter(p=>state.completedPoiIds.has(p.id)).length,arrived=poi&&journal.arrived===poi.id;
    $('#followProgressText').textContent=plan.included.length?`${arrived?'正在游览':'沿着今天的游线'} · ${done} / ${plan.included.length} 站已完成`:'先选一条自己的游线';
    $('#followTitle').textContent=poi?`${arrived?'此刻在':'下一站'}：${poi.name}`:plan.included.length?'这一程，收进旅行册。':'把想看的风景放进行程';
    $('#followDescription').textContent=poi?(arrived?'慢慢看，逛完再前往下一站。':`${poi.area||'沿途'} · 参考停留 ${poi.minutes} 分钟`):'已解锁的水滴章节与印章册，可以随时回看。';
    $('#completeStop').textContent=arrived?'逛完了 · 前往下一站':'我已到达 · 收下印章';$('#completeStop').disabled=!poi;$('#followDetail').disabled=!plan.included.length;
    $('#followMeter').style.width=(plan.included.length?done/plan.included.length*100:0)+'%';$('#followMeterCopy').textContent=`${done} 站完成 · ${Object.keys(journal.stamps).length} 处到达记录`;
    $('#followRouteStrip').innerHTML=plan.included.map(p=>`<button type="button" class="journal-stop" data-poi-detail-id="${escape(p.id)}"><span class="mini-stamp">${stamp(p,!!journal.stamps[p.id])}</span><span><strong>${escape(p.name)}</strong><small>${state.completedPoiIds.has(p.id)?'已游览':journal.arrived===p.id?'正在游览':journal.stamps[p.id]?'印章已收集':'沿途待发现'}</small></span><i data-lucide="arrow-up-right" aria-hidden="true"></i></button>`).join('')||'<p class="journal-storage">选好景点后，这里会留下你的旅行顺序。</p>';
    if(state.activeView==='follow'&&!scene){scene=window.HuanglongWaterScene?.mount($('#waterScene'),{onInteract:(action,value)=>play(action,value)});if(!scene)$('#waterScene').dataset.renderState='fallback';}
    renderGuide(poi||plan.included.at(-1));renderBook();renderGame();save();
  }
  function completeCurrent(){const poi=current();if(!poi)return;if(journal.arrived===poi.id){if(engine.depart(journal,poi.id))context.state.completedPoiIds.add(poi.id);}else if(engine.arrive(journal,poi.id,context.pois.map(p=>p.id))){const c=engine.CHAPTERS.find(c=>c.poiIds.includes(poi.id));if(c)journal.activeChapter=c.id;announce(`收下「${poi.name}」风景印章${c?'，解锁「'+c.label+'」章节':''}`);}save();context.renderAll();}
  return {restoreInto,render,completeCurrent};
})();
