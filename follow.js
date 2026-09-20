// Travel journal UI; kept separate from route calculation and the 3D renderer.
window.HuanglongFollow=(()=>{
  const engine=window.HuanglongJournal,key='huanglong.travel-journal.v1';
  let journal=engine.create(),context=null,scene=null,bound=false,guideMode='play',paused=false,gameBusy=false,toastTimer;
  const $=selector=>document.querySelector(selector);
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const chapters=[
    {label:'出发 / 水里的秘密',title:'我是一滴水，带着山的礼物。',copy:'经过岩石时，水能在一定条件下携带溶解的矿物质。现在，让我顺着坡面走进这片微缩黄龙。',button:'让水流过岩坎',icon:'droplets'},
    {label:'01 / 流动与释放',title:'越过跌水，气泡轻轻离开。',copy:'水来到地表，二氧化碳可以逸出。这是促成碳酸钙沉积的重要过程之一；白色气泡是过程示意。',button:'观察矿物沉积',icon:'sparkles'},
    {label:'02 / 一点点沉积',title:'把时间，交给指尖。',copy:'拖动模型下方的时间滑杆，看浅色池沿一点点增厚。一次水流留下的很少，这里把许多轮水流与长期积累压缩呈现。',button:'收下水滴纪念章',icon:'award'},
    {label:'03 / 时间留下的风景',title:'一滴很少，时间很多。',copy:'许多轮水流与长期积累，让池沿慢慢成形。你收下了「水的见证者」纪念章，再去看真实的池沿，会不会有新的发现？',button:'再走一遍水的旅程',icon:'rotate-ccw'},
  ];
  const games={
    'five-color-pond':{title:'找一条属于你的彩池弧线',task:'先看整片池群，再选三处形状不同的池沿。试着用手指在空中描出它们的弧线，看看哪一段最像扇面。',photo:'让池沿带着视线向远处走',compose:'选一条弯曲池沿作为画面起点，把后方彩池留在上半部。拍完全景，再选相邻的两种水色拍一张局部。',tip:'只在开放栈道选角度；附近休息亭不一定就是全景机位。'},
    'jinsha-pudi':{title:'看见金色坡面上的一层薄水',task:'找一段能看清水流的坡面，先看流动方向，再看钙华的纹理。同一段滩面，远看和近看有哪些不同？',photo:'让金色纹理成为主角',compose:'沿坡面的延伸方向取景，让金色滩流形成一条斜线，边缘留一点树林。光线柔和时，可以缩小画面专拍细流。',tip:'“金沙”是观感，眼前是钙华。留在栈道上，用取景代替靠近。'},
    'bonsai-pond':{title:'找一盆天然的小小山水',task:'找一处池沿绕着树根弯转的地方，把树根、池水和一小片草木放在同一视野里。哪一组最像天然盆景？',photo:'给池沿一个前景的位置',compose:'让近处池沿落在画面下方，树木放在一侧，后方留出水面。轻轻换一个站位，看看层次如何变化。',tip:'站位以允许通行范围为准，不踏入池堤或植被。'},
  };
  function save(){try{localStorage.setItem(key,JSON.stringify(journal));$('#journalStorage').textContent='进度与印章保存在此设备。';}catch{$('#journalStorage').textContent='当前浏览器无法保存进度；本次仍可体验，关闭后可能丢失。';}}
  function restoreInto(state,pois){
    let raw=null;try{raw=localStorage.getItem(key);}catch{}
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
    $('#stampCount').textContent=`${Object.keys(journal.stamps).length+(journal.waterBadge?1:0)} 枚印章`;
    $('#waterBadgeSlot').innerHTML=journal.waterBadge?`<div class="water-badge-card">${waterStamp()}<div><strong>水的见证者</strong><p>见过微小沉积，也见过时间的力量。<br>一滴水互动 · 已完成</p></div></div>`:'';
    $('#stampGrid').innerHTML=context.pois.filter(p=>p.kind==='scenic'||journal.stamps[p.id]).map(p=>`<div class="stamp-item ${journal.stamps[p.id]?'':'locked'}">${stamp(p,!!journal.stamps[p.id])}<strong>${escape(p.name)}</strong><small>${journal.stamps[p.id]?'已收集 · '+new Date(journal.stamps[p.id]).toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'}):'尚未抵达'}</small></div>`).join('');
  }
  function renderGuide(poi){
    const panel=$('#fieldGuidePanel');$('#fieldGuideTitle').textContent=poi?`${poi.name} · 小发现`:'先挑一处想看的风景';
    for(const b of document.querySelectorAll('[data-guide-mode]')){const active=b.dataset.guideMode===guideMode;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;}
    panel.setAttribute('aria-labelledby',guideMode==='play'?'playGuideTab':'photoGuideTab');
    if(!poi){panel.innerHTML='<p class="guide-tip">到“发现”页挑选景点，本站攻略会跟着行程更新。你也可以先体验一滴水的旅行。</p>';return;}
    const specific=games[poi.id];
    if(guideMode==='photo')panel.innerHTML=`<div class="photo-frame" aria-label="构图示意，不代表实际机位"><span>构图示意 · 非实景机位</span></div><div class="guide-prompt"><span class="guide-number">↗</span><div><h3>${escape(specific?.photo||'试着这样构图')}</h3><p>${escape(specific?.compose||poi.photoTip||poi.description)}</p></div></div><p class="guide-tip">${escape(specific?.tip||'先站稳再拍摄，在开放栈道内寻找自己的角度。')}</p>`;
    else panel.innerHTML=`<div class="guide-prompt"><span class="guide-number">01</span><div><h3>${escape(specific?.title||'先留意眼前这个细节')}</h3><p>${escape(specific?.task||poi.visitGuide?.viewing||poi.introduction)}</p></div></div><div class="guide-prompt"><span class="guide-number">02</span><div><h3>带着发现，多看一眼</h3><p>${escape(poi.highlights?.[0]||poi.description)}。${escape(poi.visitGuide?.expectation||'结合现场说明，了解这处景观。')}</p></div></div>`;
  }
  function renderGame(){
    const step=journal.gameStep,c=chapters[step];$('#waterStageLabel').textContent=c.label;$('#waterStageTitle').textContent=c.title;$('#waterStageCopy').textContent=c.copy;
    const button=$('#waterAction');button.innerHTML=`<i data-lucide="${c.icon}" aria-hidden="true"></i>${c.button}`;button.classList.toggle('completed',step===3);button.disabled=gameBusy||(step===2&&journal.growth<1);
    $('#waterTimeControl').hidden=step!==2;$('#waterTime').value=Math.round(journal.growth*100);$('#waterTimeValue').textContent=Math.round(journal.growth*100)+'%';
    const activeChapter=[0,0,1,2][step];
    for(let i=0;i<3;i++){const el=$('#waterChapter'+i);el.classList.toggle('active',i===activeChapter);el.classList.toggle('done',step===3||i<activeChapter);if(i===activeChapter)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');}
    scene?.setStage(step);
    if(step===2)scene?.setGrowth(journal.growth);
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
    c.fillStyle='#577b5f';c.font='21px serif';c.fillText(journal.waterBadge?'✧ 水的见证者 · 一滴水互动完成':'沿彩池而行，留一点时间给风景。',55,594);
    c.font='17px sans-serif';c.fillStyle='#3f6752';
    places.forEach((p,i)=>{const x=55+(i%2)*312,y=653+Math.floor(i/2)*94;c.strokeStyle='#a5b98f';c.lineWidth=1;c.beginPath();c.arc(x+18,y,17,0,Math.PI*2);c.stroke();c.fillText('✓',x+10,y+6);c.fillText(p.name,x+48,y+6);});
    if(!places.length){c.fillStyle='#8b9c7d';c.fillText('旅程刚刚开始，风景在前方。',55,660);}
    c.fillStyle='#8a9b7b';c.font='13px sans-serif';c.fillText('澄路 · 地点由游客手动确认，纪念此行。',55,canvas.height-60);
    const data=canvas.toDataURL('image/png');$('#journalCardPreview').hidden=false;$('#journalCardImage').onload=()=>$('#journalCardPreview').scrollIntoView({block:'start',behavior:'instant'});$('#journalCardImage').src=data;$('#journalCardDownload').href=data;
  }
  function bind(){
    if(bound)return;bound=true;
    $('#openStampBook').addEventListener('click',()=>{renderBook();$('#stampDialog').showModal();});
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
    $('#waterAction').addEventListener('click',()=>{
      if(gameBusy)return;const before=journal.gameStep;
      if(before===3)engine.restartGame(journal);else engine.advanceGame(journal,before);
      gameBusy=true;save();renderGame();renderBook();context.refreshIcons();
      if(journal.gameStep===3)announce('收下「水的见证者」纪念章');
      setTimeout(()=>{gameBusy=false;$('#waterAction').disabled=journal.gameStep===2&&journal.growth<1;},650);
    });
    $('#waterTime').addEventListener('input',event=>{
      engine.setGrowth(journal,Number(event.target.value)/100);scene?.setGrowth(journal.growth);$('#waterTimeValue').textContent=Math.round(journal.growth*100)+'%';$('#waterAction').disabled=gameBusy||journal.growth<1;save();
    });
    window.addEventListener('pagehide',event=>{if(!event.persisted){scene?.dispose();scene=null;}});
  }
  function render(next){
    context=next;bind();const state=context.state,plan=context.plan;
    journal.selected=[...state.selectedPoiIds];journal.completed=[...state.completedPoiIds];journal.preferences={...state.preferences};
    if(journal.arrived&&!plan.included.some(p=>p.id===journal.arrived))journal.arrived=null;
    const poi=current(),done=plan.included.filter(p=>state.completedPoiIds.has(p.id)).length,arrived=poi&&journal.arrived===poi.id;
    $('#followProgressText').textContent=plan.included.length?`${arrived?'正在游览':'沿着今天的游线'} · ${done} / ${plan.included.length} 站已完成`:'先选一条自己的游线';
    $('#followTitle').textContent=poi?`${arrived?'此刻在':'下一站'}：${poi.name}`:plan.included.length?'这一程，收进旅行册。':'把想看的风景放进行程';
    $('#followDescription').textContent=poi?(arrived?'慢慢看，逛完再前往下一站。':`${poi.area||'沿途'} · 参考停留 ${poi.minutes} 分钟`):'水滴故事与印章册仍可随时打开。';
    $('#completeStop').textContent=arrived?'逛完了 · 前往下一站':'我已到达 · 收下印章';$('#completeStop').disabled=!poi;$('#followDetail').disabled=!plan.included.length;
    $('#followMeter').style.width=(plan.included.length?done/plan.included.length*100:0)+'%';$('#followMeterCopy').textContent=`${done} 站完成 · ${Object.keys(journal.stamps).length} 处到达记录`;
    $('#followRouteStrip').innerHTML=plan.included.map(p=>`<button type="button" class="journal-stop" data-poi-detail-id="${escape(p.id)}"><span class="mini-stamp">${stamp(p,!!journal.stamps[p.id])}</span><span><strong>${escape(p.name)}</strong><small>${state.completedPoiIds.has(p.id)?'已游览':journal.arrived===p.id?'正在游览':journal.stamps[p.id]?'印章已收集':'沿途待发现'}</small></span><i data-lucide="arrow-up-right" aria-hidden="true"></i></button>`).join('')||'<p class="journal-storage">选好景点后，这里会留下你的旅行顺序。</p>';
    if(state.activeView==='follow'&&!scene){scene=window.HuanglongWaterScene?.mount($('#waterScene'));if(!scene)$('#waterScene').dataset.renderState='fallback';}
    renderGuide(poi||plan.included.at(-1));renderBook();renderGame();save();
  }
  function completeCurrent(){const poi=current();if(!poi)return;if(journal.arrived===poi.id){if(engine.depart(journal,poi.id))context.state.completedPoiIds.add(poi.id);}else if(engine.arrive(journal,poi.id,context.pois.map(p=>p.id)))announce(`收下「${poi.name}」风景印章`);save();context.renderAll();}
  return {restoreInto,render,completeCurrent};
})();
