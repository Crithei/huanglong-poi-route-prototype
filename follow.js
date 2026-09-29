// Travel journal UI; kept separate from route calculation and the 3D renderer.
window.HuanglongFollow=(()=>{
  const engine=window.HuanglongJournal,key='huanglong.travel-journal.v1';
  let journal=engine.create(),context=null,scene=null,bound=false,guideMode='play',paused=false,toastTimer,dragState=null,saveClock=0,uiClock=0,fallbackTimer=null;
  const motion=window.matchMedia?.('(prefers-reduced-motion: reduce)')||{matches:false};
  const $=selector=>document.querySelector(selector);
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const chapterCopy={
    flow:{scene:'源流 / 一直向前的水',copy:'山间的水源一直在流。轻点三段水槽，让水沿坡面接续向前。接通后，跟着径流看看它怎样进入地下。',science:'水流受地形与连通条件影响。转向水槽为虚拟互动，渗流与地下空间是科普示意。',fallback:'源水持续流动 → 三段水槽 → 径流进入地下。使用下方转向按钮。'},
    dissolution:{scene:'溶解 / 水带走山的一点点',copy:'把轻轻飘动的 CO₂ 气团拖到水滴身上。随后静静看：水流进入岩层，石灰岩逐渐缩小，溶解物随水向前。',science:'含 CO₂ 的水在适当条件下可溶解碳酸盐岩。金色粒子表示溶解物，不是石块碎屑。剖面为科普示意，不要求游客入洞。',fallback:'把 CO₂ 拖给水滴，或使用下方加入按钮。过程会自动演示，不需要再点击观察点。'},
    emergence:{scene:'出露 / 山的另一面',copy:'轻推水位，看看山体剖面里的水慢慢升高。达到出口高度时，泉水从岩层渗出，CO₂ 随着水来到地表逐渐逸散。',science:'出露指地下水来到地表，CO₂ 逸出指气体离开水体。山体剖面是解释模型，非现场测绘；水位刻度无实际海拔含义。',fallback:'调整水位；达到 65% 的出口高度后，观察泉水出流与气体逸出。'},
    deposition:{scene:'沉积 / 让风景慢慢长出来',copy:'这一滴水会一直陪着你。把它拖到下一处淡淡的光环里，或点下方按钮带它过去；抵达后，池沿慢慢长起，水蓄满，再溢向下一片低处。',science:'池沿生长、蓄水与溢流在自然界相互交织，这里分段呈现便于观察；演示时间不对应真实年限。沉积来自溶解物，水不会变成石头。',fallback:'把水滴拖到下一处，或点击按钮带它过去。随后依次播放：池沿生长 → 蓄水 → 溢流，共三池。'},
  };
  const games={
    'five-color-pond':{title:'找一条属于你的彩池弧线',task:'先看整片池群，再选三处形状不同的池沿。试着用手指在空中描出它们的弧线，看看哪一段最像扇面。',photo:'让池沿带着视线向远处走',compose:'选一条弯曲池沿作为画面起点，把后方彩池留在上半部。拍完全景，再选相邻的两种水色拍一张局部。',tip:'只在开放栈道选角度；附近休息亭不一定就是全景机位。'},
    'jinsha-pudi':{title:'看见金色坡面上的一层薄水',task:'找一段能看清水流的坡面，先看流动方向，再看钙华的纹理。同一段滩面，远看和近看有哪些不同？',photo:'让金色纹理成为主角',compose:'沿坡面的延伸方向取景，让金色滩流形成一条斜线，边缘留一点树林。光线柔和时，可以缩小画面专拍细流。',tip:'“金沙”是观感，眼前是钙华。留在栈道上，用取景代替靠近。'},
    'bonsai-pond':{title:'找一盆天然的小小山水',task:'找一处池沿绕着树根弯转的地方，把树根、池水和一小片草木放在同一视野里。哪一组最像天然盆景？',photo:'给池沿一个前景的位置',compose:'让近处池沿落在画面下方，树木放在一侧，后方留出水面。轻轻换一个站位，看看层次如何变化。',tip:'站位以允许通行范围为准，不踏入池堤或植被。'},
  };
  function save(){try{localStorage.setItem(key,JSON.stringify(journal));$('#journalStorage').textContent='进度与印章保存在此设备。';}catch{$('#journalStorage').textContent='当前浏览器无法保存进度；本次仍可体验，关闭后可能丢失。';}}
  function restoreInto(state,pois){
    let raw=null;try{raw=localStorage.getItem(key);if(raw){const version=JSON.parse(raw)?.version,backup=version===1?key+'.backup':key+'.v2.backup';if([1,2].includes(version)&&!localStorage.getItem(backup))localStorage.setItem(backup,raw);}}catch{}
    journal=engine.restore(raw,pois.map(p=>p.id));
    if(journal.selected!==null)state.selectedPoiIds=new Set(journal.selected);
    state.completedPoiIds=new Set(journal.completed);state.preferences={...state.preferences,...journal.preferences};
  }
  function current(){return context?.plan.included.find(p=>!context.state.completedPoiIds.has(p.id));}
  function announce(text){$('#journalAnnouncement').textContent=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('#journalAnnouncement').textContent='';},3200);}
  function stamp(poi,earned=true){
    const catalog=window.HUANGLONG_STAMPS||{};
    const design=catalog[poi?.id]||catalog.default||{title:poi?.name||'黄龙一见',motto:'山水相逢 · 留下一枚印记',color:'#4e8068',accent:'#c3d47d',motif:'default'};
    const color=earned?design.color:'#899483', accent=earned?design.accent:'#c6cdbf', motif=design.motif;
    const motifArt={
      pond:`<path d="M25 48c8-7 30-8 48 0-10 10-37 12-48 3zm2 9c12 6 34 5 45-2m-39 10c10 4 25 4 35-1"/><path d="M39 39l11-14 11 14"/><path d="M44 33l6-8 7 8"/>`,
      waterfall:`<path d="M30 35h40M34 35c9 12-4 23 5 39m13-39c10 12-6 25 3 39m11-39c-6 14 7 24-3 39"/><path d="M29 75h42"/><path d="M29 43h9m24 0h8"/>`,
      landform:`<path d="M24 67l14-17 10 8 13-21 15 30"/><path d="M27 73c13-7 28 5 47-2"/><path d="M35 63l6-7 6 6"/><path d="M58 57l6-7 7 7"/>`,
      culture:`<path d="M24 45l26-17 26 17M29 45h42M34 48v24m32-24v24M29 73h42M43 56v16m14-16v16"/><path d="M39 36l11-8 11 8"/>`,
      default:`<path d="M24 46c3-12 39-17 50-4 8 11-37 21-50 10m0 3c4 13 45 9 52-4M24 61c6 14 43 11 51-1M29 73c9 9 34 7 43-1"/>`
    }[motif]||'';
    const fiveColor=poi?.id==='five-color-pond'?'<g fill="'+accent+'"><circle cx="36" cy="67" r="2"/><circle cx="45" cy="70" r="2"/><circle cx="55" cy="70" r="2"/><circle cx="64" cy="67" r="2"/><circle cx="50" cy="65" r="2"/></g>':'';
    const locked=!earned?' stamp-locked':'';
    return `<svg class="travel-stamp${locked}" data-stamp-id="${escape(poi?.id||'default')}" viewBox="0 0 100 100" role="img" aria-label="${escape(design.title)}印章"><title>${escape(design.title)} · ${escape(design.motto)}</title><path d="M50 3l8 3 9-1 6 7 9 3 2 9 7 7-2 9 4 9-4 9 2 9-7 7-2 9-9 3-6 7-9-1-8 3-8-3-9 1-6-7-9-3-2-9-7-7 2-9-4-9 4-9-2-9 7-7 2-9 9-3 6-7 9 1z" fill="#f4f1dc" stroke="${color}" stroke-width="1.6"/><circle cx="50" cy="50" r="39" fill="none" stroke="${color}" stroke-width=".85" stroke-dasharray="1.5 3"/><path d="M22 28h56" stroke="${accent}" stroke-width="1.4"/><g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${motifArt}</g>${fiveColor}<text x="50" y="22" text-anchor="middle" font-size="5.2" font-family="sans-serif" font-weight="700" letter-spacing="1.1" fill="${color}">HUANGLONG</text><text x="50" y="86" text-anchor="middle" font-size="5.6" font-family="sans-serif" font-weight="700" letter-spacing=".45" fill="${color}">${escape(design.title)}</text><circle cx="27" cy="22" r="1.4" fill="${accent}"/><circle cx="73" cy="22" r="1.4" fill="${accent}"/></svg>`;
  }
  function waterStamp(){return '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 4l13 8 15 1 5 14 11 12-5 15 1 16-14 8-9 14-17-3-16 3-10-14-14-8 1-16-5-15 11-12 5-14 15-1z" fill="#d8deb3" stroke="#99ac76"/><circle cx="50" cy="49" r="32" fill="#f9f7df"/><path d="M50 25c-5 12-17 20-17 30a17 17 0 0034 0c0-10-12-18-17-30z" fill="#66b4ac"/><path d="M39 56c0 7 4 10 8 11" fill="none" stroke="#ddf4dd" stroke-width="3" stroke-linecap="round"/><circle cx="46" cy="53" r="1.5" fill="#385d4b"/><circle cx="57" cy="53" r="1.5" fill="#385d4b"/></svg>';}
  function renderBook(){
    const earned=engine.CHAPTERS.filter(c=>journal.chapters[c.id].earnedAt);
    $('#stampCount').textContent=`${Object.keys(journal.stamps).length+earned.length+(journal.waterBadge?1:0)+(journal.chapterBadgeAt?1:0)} 枚印章`;
    $('#waterBadgeSlot').innerHTML=(journal.waterBadge?`<div class="water-badge-card">${waterStamp()}<div><strong>水的见证者</strong><p>初版一滴水体验纪念 · 已保留</p></div></div>`:'')+(journal.chapterBadgeAt?`<div class="water-badge-card chapter-grand-badge">${waterStamp()}<div><strong>山水同行者</strong><p>四处相遇，读懂一滴水的旅程。<br>四章全部完成</p></div></div>`:'')+`<div class="chapter-reward-grid">${engine.CHAPTERS.map(c=>`<div class="chapter-reward ${journal.chapters[c.id].earnedAt?'earned':''}"><i data-lucide="${c.icon}" aria-hidden="true"></i><strong>${c.reward}</strong><small>${journal.chapters[c.id].earnedAt?'已收下':c.label+'章待完成'}</small></div>`).join('')}</div>`;
    $('#stampGrid').innerHTML=context.pois.filter(p=>p.kind==='scenic'||journal.stamps[p.id]).map(p=>{const d=(window.HUANGLONG_STAMPS||{})[p.id]||(window.HUANGLONG_STAMPS||{}).default;return `<div class="stamp-item ${journal.stamps[p.id]?'':'locked'}">${stamp(p,!!journal.stamps[p.id])}<strong>${escape(d?.title||p.name)}</strong><small class="stamp-motto">${escape(d?.motto||p.description||'山水相逢')}</small><small>${journal.stamps[p.id]?'已收集 · '+new Date(journal.stamps[p.id]).toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'}):'尚未抵达'}</small></div>`;}).join('');
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
    const controls=$('#waterGameControls');controls.disabled=!unlocked;
    const button=(action,value,label)=>`<button type="button" data-game-action="${action}" data-game-value="${value}" class="game-choice">${label}</button>`;
    if(id==='flow')controls.innerHTML=`<legend>转动水槽，让水自己找到路</legend><div class="game-three flow-switches">${p.channels.map((v,i)=>button('turn',i,`<span>${['上游','中游','下游'][i]}</span><strong>${v?'↙':'↘'} 转向</strong>`)).join('')}</div><p>轻点模型中的水槽也可以转向，水源会一直流动。</p>`;
    if(id==='dissolution')controls.innerHTML=`<legend>让水带上 CO₂</legend>${p.charged?'<p class="process-observation">顺着水流看，石灰岩的轮廓正在慢慢改变。</p>':button('charge','','也可点击，把 CO₂ 交给水滴')}<div class="process-meter"><span id="processMeterFill"></span></div>`;
    if(id==='emergence')controls.innerHTML=`<legend>山体中的地下水位</legend><label class="game-range-label" for="groundwaterLevel">低处汇水 <output id="groundwaterValue">${Math.round(p.level)}%</output></label><input id="groundwaterLevel" type="range" min="0" max="100" value="${p.level}" data-game-slider="level"/><p>慢慢推过出口线，观察泉流与逸出的气泡。完成后仍可调整水位。</p>`;
    if(id==='deposition')controls.innerHTML=`<legend>${p.sequence===9?'三片新彩池，连成一段风景':'正在生成第 '+(Math.floor(p.sequence/3)+1)+' 片新彩池'}</legend><div class="pool-phase-track">${['池沿生长','水流积累','水流溢出'].map((label,i)=>`<span class="${p.sequence<9&&p.sequence%3===i?'current':''}">${label}</span>`).join('')}</div><div class="process-meter"><span id="processMeterFill"></span></div><p>拖动同一滴水到光环处，也可用下方按钮带它前往。</p>`;
    $('#co2Interaction').hidden=id!=='dissolution'||!unlocked||p.charged;
    $('#waterDropInteraction').hidden=id!=='deposition'||!unlocked||p.running||p.won;
    if(dragState&&$('#'+dragState.overlay).hidden)cancelDrag();
    $('#waterGesture').textContent=id==='flow'?'轻点水槽转向 · 左右轻拖旋转山水':id==='dissolution'?'拖动气团，把 CO₂ 交给水滴':id==='emergence'?'拖动下方水位 · 看地下水如何遇见天空':'拖动水滴去下一处 · 也可点按钮带它出发';
    $('#waterGameFeedback').textContent=p.won?'已收下「'+c.reward+'」，过程动画仍可继续观看。':unlocked?'准备好了，让过程在眼前发生。':'模型可预览，互动等待你到达。';
    syncGame();
  }
  function syncGame(updateScene=true){
    const id=journal.activeChapter,p=journal.chapters[id],c=engine.CHAPTERS.find(c=>c.id===id),unlocked=engine.isChapterUnlocked(journal,id);
    const status=id==='flow'?(p.channels.every((v,i)=>v===[1,0,1][i])?'径流正在进入地下':'源水流动中 · 转动水槽连接水路'):id==='dissolution'?(p.charged?(p.elapsed>=8?'溶解物随水流向远方':'石灰岩正在溶解…'):'等待水带上 CO₂'):id==='emergence'?(p.level>=65?'泉水出露 · CO₂ 缓缓逸散':'地下水位尚未到达出口'):p.sequence===9?'三片新彩池已生成':p.running&&p.travel<1?'水滴正在前往下一片低处…':p.running?['池沿正在生长…','水正在蓄满新池…','水正越过池沿…'][p.sequence%3]:'等待下一片彩池生成';
    $('#waterGameProgress').textContent=status;$('#waterGameReward').textContent=p.earnedAt?'✓ '+c.reward:'完成后收下 · '+c.reward;
    const fill=$('#processMeterFill');if(fill)fill.style.width=(id==='dissolution'?p.elapsed/8*100:id==='deposition'?(p.sequence===9?100:(p.sequence%3+p.fraction)/3*100):0)+'%';
    const action=$('#waterAction');action.hidden=unlocked&&!p.won&&id!=='deposition';action.disabled=!unlocked||(id==='deposition'&&p.running);action.textContent=!unlocked?'到站打卡后开始':p.won?'重新体验本章':p.running?status:p.sequence===0?'带水滴去第一处 · 生长彩池':'带水滴去下一处 · 继续生长';action.classList.toggle('completed',p.won);
    $('#waterMotionStep').hidden=!motion.matches||!unlocked||p.won;
    $('#waterMotionStep').disabled=id==='flow'?!p.channels.every((v,i)=>v===[1,0,1][i]):id==='dissolution'?!p.charged:id==='emergence'?p.level<65:!p.running;
    if(updateScene)scene?.setChapter(id,p,unlocked);
  }
  function play(action,value,slider=false){
    const result=engine.playChapter(journal,journal.activeChapter,action,value);save();
    if(slider){syncGame();if(action==='level')$('#groundwaterValue').textContent=Math.round(journal.chapters.emergence.level)+'%';}
    else{renderGame();renderBook();context.refreshIcons();}
    $('#waterGameFeedback').textContent=result.message;
  }
  function tickAnimation(id,dt,force=false){
    if(!context||context.state.activeView!=='follow'||id!==journal.activeChapter||((paused||motion.matches||document.hidden)&&!force))return;
    const result=engine.tickChapter(journal,id,dt);if(!result.changed)return;
    saveClock+=dt;uiClock+=dt;
    if(result.phaseChanged){renderGame();renderBook();context.refreshIcons();save();saveClock=0;}else if(uiClock>.12){syncGame(false);uiClock=0;}
    if(saveClock>=1){save();saveClock=0;}
    if(result.earned)announce(result.message+(journal.chapterBadgeAt?' 四章已集齐。':''));
  }
  function cancelDrag(accepted=false){
    if(!dragState)return;const active=dragState;dragState=null;
    try{active.token.releasePointerCapture?.(active.id);}catch{}
    active.token.style.transform='';active.token.classList.remove('dragging');active.target.classList.remove('receiving');
    if(active.modeled)scene?.endDrag(accepted);
  }
  function bindDrag({source,target,overlay,chapter,action}){
    const token=$('#'+source),destination=$('#'+target);
    const isOver=(x,y)=>{const rect=destination.getBoundingClientRect();return rect.width>0&&x>=rect.left-8&&x<=rect.right+8&&y>=rect.top-8&&y<=rect.bottom+8;};
    token.addEventListener('pointerdown',e=>{
      if(e.button!==0||dragState||$('#'+overlay).hidden||journal.activeChapter!==chapter)return;
      const modeled=$('#waterScene').dataset.renderState==='ready'&&!!scene?.beginDrag;
      if(modeled&&scene.beginDrag(e.clientX,e.clientY)===false)return;
      e.preventDefault();dragState={id:e.pointerId,x:e.clientX,y:e.clientY,token,target:destination,overlay,modeled};
      try{token.setPointerCapture?.(e.pointerId);}catch{cancelDrag();return;}
      token.classList.add('dragging');
    });
    token.addEventListener('pointermove',e=>{
      if(!dragState||dragState.token!==token||dragState.id!==e.pointerId)return;
      if(dragState.modeled)scene.moveDrag(e.clientX,e.clientY);
      else token.style.transform='translate(calc(-50% + '+(e.clientX-dragState.x)+'px),calc(-50% + '+(e.clientY-dragState.y)+'px))';
      destination.classList.toggle('receiving',isOver(e.clientX,e.clientY));
    });
    token.addEventListener('pointerup',e=>{
      if(!dragState||dragState.token!==token||dragState.id!==e.pointerId)return;
      const moved=Math.hypot(e.clientX-dragState.x,e.clientY-dragState.y)>=8,accepted=moved&&isOver(e.clientX,e.clientY);
      cancelDrag(accepted);if(accepted)play(action);else $('#waterGameFeedback').textContent=chapter==='dissolution'?'把气团拖到水滴身上，再松开。':'把水滴拖到下一处光环里，再松开；也可点下方按钮出发。';
    });
    for(const event of ['pointercancel','lostpointercapture'])token.addEventListener(event,()=>{if(dragState?.token===token)cancelDrag();});
    token.addEventListener('click',e=>{if(e.detail===0&&!$('#'+overlay).hidden)play(action);});
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
      const action=button.dataset.sceneControl;cancelDrag();if(action==='left')scene?.rotate(-1);if(action==='right')scene?.rotate(1);if(action==='reset')scene?.reset();if(action==='zoom')scene?.zoom(1);
      if(action==='pause'){paused=!paused;scene?.pause(paused);button.setAttribute('aria-pressed',String(paused));button.setAttribute('aria-label',paused?'继续场景动画':'暂停场景动画');button.innerHTML=`<i data-lucide="${paused?'play':'pause'}" aria-hidden="true"></i>`;context.refreshIcons();}
    });
    $('#waterChapterGrid').addEventListener('click',e=>{const b=e.target.closest('[data-water-chapter]');if(!b)return;cancelDrag();journal.activeChapter=b.dataset.waterChapter;save();renderGame();context.refreshIcons();$(`[data-water-chapter="${journal.activeChapter}"]`).focus({preventScroll:true});});
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
    $('#waterAction').addEventListener('click',()=>{cancelDrag();if(journal.chapters[journal.activeChapter].won){engine.resetChapter(journal,journal.activeChapter);save();renderGame();context.refreshIcons();}else if(journal.activeChapter==='deposition')play('start');});
    $('#waterMotionStep').addEventListener('click',()=>{const id=journal.activeChapter,p=journal.chapters[id],step=p.sequence;for(let i=0;i<34&&!p.won;i++){tickAnimation(id,.25,true);if(id==='deposition'&&p.sequence!==step)break;}renderGame();});
    bindDrag({source:'co2Token',target:'co2DropTarget',overlay:'co2Interaction',chapter:'dissolution',action:'charge'});
    bindDrag({source:'waterDropHandle',target:'waterDropNextTarget',overlay:'waterDropInteraction',chapter:'deposition',action:'start'});
    $('#waterScene').addEventListener('webglcontextlost',()=>cancelDrag(),true);
    fallbackTimer=window.setInterval(()=>{if((!scene||$('#waterScene').dataset.renderState==='fallback')&&!document.hidden){const rect=$('#waterScene').getBoundingClientRect();if(rect.bottom>0&&rect.top<window.innerHeight&&rect.width>0)tickAnimation(journal.activeChapter,.1);}},100);
    motion.addEventListener?.('change',()=>{renderGame();context.refreshIcons();});
    window.addEventListener('pagehide',event=>{save();cancelDrag();if(!event.persisted){window.clearInterval(fallbackTimer);scene?.dispose();scene=null;}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelDrag();save();}});
  }
  function render(next){
    context=next;bind();const state=context.state,plan=context.plan;if(state.activeView!=='follow')cancelDrag();
    journal.selected=[...state.selectedPoiIds];journal.completed=[...state.completedPoiIds];journal.preferences={...state.preferences};
    if(journal.arrived&&!plan.included.some(p=>p.id===journal.arrived))journal.arrived=null;
    const poi=current(),done=plan.included.filter(p=>state.completedPoiIds.has(p.id)).length,arrived=poi&&journal.arrived===poi.id;
    $('#followProgressText').textContent=plan.included.length?`${arrived?'正在游览':'沿着今天的游线'} · ${done} / ${plan.included.length} 站已完成`:'先选一条自己的游线';
    $('#followTitle').textContent=poi?`${arrived?'此刻在':'下一站'}：${poi.name}`:plan.included.length?'这一程，收进旅行册。':'把想看的风景放进行程';
    $('#followDescription').textContent=poi?(arrived?'慢慢看，逛完再前往下一站。':`${poi.area||'沿途'} · 参考停留 ${poi.minutes} 分钟`):'已解锁的水滴章节与印章册，可以随时回看。';
    $('#completeStop').textContent=arrived?'逛完了 · 前往下一站':'我已到达 · 收下印章';$('#completeStop').disabled=!poi;$('#followDetail').disabled=!plan.included.length;
    $('#followMeter').style.width=(plan.included.length?done/plan.included.length*100:0)+'%';$('#followMeterCopy').textContent=`${done} 站完成 · ${Object.keys(journal.stamps).length} 处到达记录`;
    $('#followRouteStrip').innerHTML=plan.included.map(p=>`<button type="button" class="journal-stop" data-poi-detail-id="${escape(p.id)}"><span class="mini-stamp">${stamp(p,!!journal.stamps[p.id])}</span><span><strong>${escape(p.name)}</strong><small>${state.completedPoiIds.has(p.id)?'已游览':journal.arrived===p.id?'正在游览':journal.stamps[p.id]?'印章已收集':'沿途待发现'}</small></span><i data-lucide="arrow-up-right" aria-hidden="true"></i></button>`).join('')||'<p class="journal-storage">选好景点后，这里会留下你的旅行顺序。</p>';
    if(state.activeView==='follow'&&!scene){scene=window.HuanglongWaterScene?.mount($('#waterScene'),{onInteract:(action,value)=>play(action,value),onTick:tickAnimation,onDragCancel:cancelDrag});if(!scene)$('#waterScene').dataset.renderState='fallback';}
    renderGuide(poi||plan.included.at(-1));renderBook();renderGame();save();
  }
  function completeCurrent(){const poi=current();if(!poi)return;if(journal.arrived===poi.id){if(engine.depart(journal,poi.id))context.state.completedPoiIds.add(poi.id);}else if(engine.arrive(journal,poi.id,context.pois.map(p=>p.id))){const c=engine.CHAPTERS.find(c=>c.poiIds.includes(poi.id));if(c)journal.activeChapter=c.id;announce(`收下「${poi.name}」风景印章${c?'，解锁「'+c.label+'」章节':''}`);}save();context.renderAll();}
  return {restoreInto,render,completeCurrent};
})();
