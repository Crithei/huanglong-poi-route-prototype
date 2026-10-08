window.HuanglongPassportUI=(()=>{
  const D=window.HuanglongPassportData,P=window.HuanglongPassport,A=window.HuanglongPassportArt,key='huanglong.passport.v1';
  const $=s=>document.querySelector(s),h=A.esc;
  let state=P.create(),context,ready=false,tab='passport',lab='color',pageId=state.pages[0].id,selected='',placeId='',drag=null,exportToken=0;
  const values=Object.fromEntries(D.experiments.map(e=>[e.id,Object.fromEntries(e.controls.map(c=>[c.id,c.initial]))]));
  let warning='';try{state=P.restore(localStorage.getItem(key));pageId=state.pages[0].id;}catch{warning='当前浏览器无法读取进度。本次仍可编辑并导出手账。';}
  const stamps=()=>context?.journal.stamps||{};
  const inventory=()=>P.inventory(state,stamps());
  const page=()=>state.pages.find(p=>p.id===pageId)||state.pages[0];
  function save(){try{localStorage.setItem(key,JSON.stringify(state));warning='';}catch{warning='当前浏览器无法保存；请在离开前导出手账图片。';}$('#passportStorage').textContent=warning||'已自动保存到此设备 · 清除浏览器数据会移除护照与手账';}
  function toast(t){$('#passportNotice').textContent=t;}
  function invalidateExport(){exportToken++;$('#notebookExport').hidden=true;}
  function mount(){
    const host=$('#passportShell');if(!host)return false;
    host.innerHTML=`<nav class="passport-tabs" role="tablist" aria-label="随行内容">${[['trail','旅途'],['passport','护照'],['labs','实验'],['notebook','手账']].map(([id,name])=>`<button type="button" role="tab" id="passportTab-${id}" data-passport-tab="${id}" aria-controls="${id==='trail'?'followTrail':'passportPanel-'+id}">${name}</button>`).join('')}</nav>
    <section id="passportPanel-passport" role="tabpanel" aria-labelledby="passportTab-passport" class="passport-panel">
      <div class="passport-cover"><div><p class="passport-kicker">HUANGLONG · FIELD PASSPORT</p><h2>山水护照</h2><p>一处风景，一枚印记。<br>慢慢看，也能完成自己的旅程。</p><span id="passportSummary"></span></div><img src="assets/passport/five-color-pond.svg" alt="五彩池纪念章"/></div>
      <div class="passport-owner"><label>护照持有人<input id="passportName" maxlength="20" aria-label="护照持有人"/></label><span>仅存于本机<br>没有排名与倒计时</span></div>
      <div id="passportThemes" class="passport-themes"></div><div id="passportMilestone" class="passport-milestone"></div>
      <div class="passport-section-head"><div><p class="passport-kicker">SIX LANDSCAPE SEALS</p><h3>把山水一枚枚收好</h3></div><button type="button" id="passportLegacy">全部印章</button></div>
      <p class="passport-small">轻点纪念章，查看细节、到达打卡或关联实验。</p><div id="passportPlaces" class="passport-places"></div>
      <details class="passport-rules"><summary>打卡与收集规则</summary><ol><li>本原型由你手动确认到达；不验证定位，不代表现场核验。</li><li>六处主章每处只计一枚，顺序自由；其他景点仍保留在全部印章册。</li><li>原有到达记录自动继承。删减路线、重玩游戏不扣除已经获得的章。</li><li>实验可先预习；到达任一关联景点后，记录三种对照才获得该实验的贴纸，重复记录不重复发奖。</li><li>三种主题按各自条件独立完成。切换主题不会清空收藏，无须走完整条沟。</li><li>当前只有数字收藏；不产生实物兑换权益。线下赠品与核销方案见策划案。</li></ol></details>
    </section>
    <section id="passportPanel-labs" role="tabpanel" aria-labelledby="passportTab-labs" class="passport-panel" hidden>
      <div class="passport-section-head"><div><p class="passport-kicker">A SMALL FIELD LAB</p><h2>动手，看见原因</h2></div><span class="passport-small">不计分 · 可反复试</span></div><p class="passport-intro">只改变一个条件，再留下一张观察。三次对照，收一枚发现。</p>
      <div id="passportLabs" class="passport-labs"></div><article id="passportLab" class="passport-lab"></article>
      <button type="button" id="passportWaterStory" class="passport-wide passport-secondary">打开四章 3D 水滴旅程 →</button>
    </section>
    <section id="passportPanel-notebook" role="tabpanel" aria-labelledby="passportTab-notebook" class="passport-panel" hidden>
      <div class="passport-section-head"><div><p class="passport-kicker">MAKE THIS JOURNEY YOURS</p><h2>我的数字手账</h2></div><button type="button" id="notebookAddPage">＋ 新一页</button></div><div id="notebookPages" class="notebook-pages"></div>
      <div class="notebook-fields"><label>这一页的标题<input id="notebookTitle" maxlength="32"/></label><div class="notebook-field-row"><label>日期<input type="date" id="notebookDate"/></label><label>纸色<select id="notebookPaper"><option value="ivory">暖纸白</option><option value="mineral">矿物青</option><option value="night">山林夜</option></select></label></div></div>
      <div id="notebookPreview" class="notebook-preview"></div><p class="passport-small">轻点章或贴纸后拖动排版；键盘方向键也能微调。</p>
      <div id="notebookItemTools" class="notebook-item-tools" hidden><label>大小<input type="range" id="notebookSize" min="16" max="42"/></label><label>旋转<input type="range" id="notebookRotation" min="-30" max="30"/></label><button type="button" id="notebookRemoveItem">移除这一枚</button></div>
      <label class="notebook-note-label">今天想记下的细节<textarea id="notebookNote" maxlength="320" rows="4" placeholder="记下水色、风声，或让你停下来的一眼。"></textarea></label>
      <div class="passport-section-head"><h3>我的章与贴纸</h3><span id="notebookItemCount" class="passport-small"></span></div><p class="passport-small">点一下贴进页面。每页最多 6 枚，可重复使用已有收藏。</p><div id="notebookInventory" class="notebook-inventory"></div>
      <div class="notebook-actions"><button type="button" id="notebookDownload" class="passport-primary">生成这一页的图片</button><button type="button" id="notebookDeletePage" class="passport-secondary">删除本页</button></div><p id="notebookExportStatus" role="status"></p>
      <div id="notebookExport" hidden><img id="notebookExportImage" alt="已导出的数字手账，可长按保存"/><div><a id="notebookPng" download="黄龙山水手账.png">保存高清 PNG</a><a id="notebookSvg" download="黄龙山水手账.svg">保存 SVG</a></div><p class="passport-small">手机也可长按图片保存。导出内容为当前这一页。</p></div>
      <div id="notebookDeleteConfirm" class="passport-delete" hidden><p>删除这页手账？收藏的章与贴纸会保留。</p><button type="button" id="notebookConfirmDelete">删除本页</button><button type="button" id="notebookCancelDelete">保留</button></div>
    </section><p id="passportStorage" class="passport-small passport-storage"></p><p id="passportNotice" role="status" class="passport-notice"></p>`;
    const dialog=document.createElement('dialog');dialog.id='passportPlaceDialog';dialog.className='passport-place-dialog';dialog.setAttribute('aria-labelledby','passportPlaceTitle');dialog.innerHTML=`<button type="button" class="passport-close" data-close-passport-place aria-label="关闭景点纪念章">×</button><div id="passportPlaceArt"></div><p class="passport-kicker" id="passportPlaceMotto"></p><h2 id="passportPlaceTitle"></h2><p id="passportPlaceDetail"></p><p class="passport-small" id="passportPlaceStatus"></p><div class="passport-place-actions"><button type="button" id="passportConfirmArrival" class="passport-primary">我已到达 · 盖下此章</button><button type="button" id="passportPlaceNotebook" class="passport-secondary">放进手账</button><button type="button" id="passportPlaceLab" class="passport-secondary">去做关联实验</button><button type="button" id="passportPlacePoi" class="passport-secondary">景点游览介绍</button></div>`;document.querySelector('.app-shell').append(dialog);
    bind(host,dialog);ready=true;const requested=new URLSearchParams(location.search).get('passportTab');if(['passport','labs','notebook','trail'].includes(requested))tab=requested;$('#passportName').value=state.profile.name;save();return true;
  }
  function switchTab(id){if(!['trail','passport','labs','notebook'].includes(id))return;drag=null;tab=id;
    for(const b of document.querySelectorAll('[data-passport-tab]')){b.setAttribute('aria-selected',String(b.dataset.passportTab===tab));b.tabIndex=b.dataset.passportTab===tab?0:-1;}
    for(const panel of document.querySelectorAll('[id^="passportPanel-"]'))panel.hidden=panel.id!=='passportPanel-'+tab;
    for(const panel of document.querySelectorAll('[data-follow-trail]'))panel.hidden=tab!=='trail';
    if(tab==='passport')renderPassport();if(tab==='labs')renderLab();if(tab==='notebook')renderNotebook();
  }
  function renderPassport(){
    const places=D.places.filter(p=>P.hasArrival(stamps(),p.id)),items=inventory(),milestones=P.milestones(state,stamps()),theme=milestones.find(t=>t.id===state.profile.theme);
    $('#passportSummary').textContent=`${places.length} / 6 枚主章 · ${items.filter(i=>i.kind==='sticker').length} / 3 枚发现贴纸`;
    $('#passportThemes').innerHTML=milestones.map(t=>`<button type="button" data-passport-theme="${t.id}" aria-pressed="${t.id===theme.id}"><strong>${t.title}</strong><small>${t.earned?'✓ '+t.reward:t.need+' 枚主章'+(t.labs?' + 1 贴纸':'')}</small></button>`).join('');
    $('#passportMilestone').innerHTML=`<span>${theme.earned?'✧ 已获得「'+theme.reward+'」':'本次主题 · '+theme.title}</span><p>${h(theme.description)}</p><div class="passport-track"><i style="width:${Math.min(100,theme.count/theme.need*100)}%"></i></div><small>${Math.min(theme.count,theme.need)} / ${theme.need} 枚主章${theme.labs?' · '+Math.min(theme.labCount,theme.labs)+' / 1 枚贴纸':''}</small>`;
    $('#passportPlaces').innerHTML=D.places.map((p,i)=>{const owned=P.hasArrival(stamps(),p.id);return `<button type="button" data-passport-place="${p.id}" class="passport-place ${owned?'owned':'locked'}"><span class="passport-place-no">0${i+1} / ${h(p.mark)}</span><img src="assets/passport/${p.id}.svg" alt="${p.name}纪念章"/><strong>${p.name}</strong><small>${owned?'✓ 已盖章 · 查看收藏':'待相遇 · 查看与打卡'}</small></button>`;}).join('');
  }
  function openPlace(id){const p=D.places.find(p=>p.id===id);if(!p)return;placeId=id;updatePlace();$('#passportPlaceDialog').showModal();}
  function updatePlace(){const p=D.places.find(p=>p.id===placeId),owned=P.hasArrival(stamps(),placeId);$('#passportPlaceArt').innerHTML=`<img src="assets/passport/${p.id}.svg" alt="${p.name}纪念章大图"/>`;$('#passportPlaceMotto').textContent=p.mark;$('#passportPlaceTitle').textContent=p.name;$('#passportPlaceDetail').textContent=p.caption+' '+p.detail;$('#passportPlaceStatus').textContent=owned?'已收藏 · '+new Date(stamps()[placeId]).toLocaleDateString('zh-CN')+' · 手动到达记录':'请到达景点后再确认。本原型使用手动打卡，不做定位核验。';$('#passportConfirmArrival').disabled=owned;$('#passportConfirmArrival').textContent=owned?'✓ 这枚章已收好':'我已到达 · 盖下此章';$('#passportPlaceNotebook').hidden=!owned;}
  function renderLab(){
    const e=D.experiments.find(e=>e.id===lab),unlocked=P.unlocked(lab,stamps());
    $('#passportLabs').innerHTML=D.experiments.map(e=>`<button type="button" data-lab="${e.id}" aria-pressed="${lab===e.id}"><span>${e.icon}</span>${e.title}<small>${inventory().some(i=>i.id==='sticker:'+e.id)?'✓ 已收集':P.unlocked(e.id,stamps())?'已解锁':'可预习'}</small></button>`).join('');
    $('#passportLab').innerHTML=`<div class="lab-heading"><p class="passport-kicker">${e.eyebrow}</p><span>${unlocked?'到站观察': '预习模式'} · ${e.duration}</span></div><h3>${e.question}</h3><div id="labScene" class="lab-scene"></div><p id="labCaption" class="lab-caption" aria-live="polite"></p><div class="lab-controls">${e.controls.map(c=>`<label for="lab-${c.id}">${c.label}<span>${c.low} → ${c.high}</span><input type="range" id="lab-${c.id}" data-lab-control="${c.id}" min="0" max="100" value="${values[lab][c.id]}"/></label>`).join('')}</div><button type="button" id="labRecord" class="passport-primary passport-wide">${unlocked?'记录这一刻':'试着记录 · 预习'}</button><p id="labFeedback" class="lab-feedback" role="status">${unlocked?'调节上方条件，保留三种不同的观察。':'现在可以自由探索；到关联景点后再记录，即可收集贴纸。'}</p><div id="labObservations" class="lab-observations"></div><div id="labConclusion" class="lab-conclusion" hidden></div><div class="lab-places"><span>到任意一处解锁</span>${e.poiIds.map(id=>`<button type="button" data-passport-place="${id}">${h(context.pois.find(p=>p.id===id)?.name||id)} ${P.hasArrival(stamps(),id)?'✓':'↗'}</button>`).join('')}</div><details class="lab-science"><summary>这次实验能说明什么</summary><p>${e.conclusion}</p><p>${e.boundary}</p><p>现场再看：${e.field}</p></details>`;
    renderLabScene();renderObservations();
  }
  function renderLabScene(){const v=P.experimentView(lab,values[lab]);$('#labScene').innerHTML=A.experiment(lab,v);$('#labCaption').textContent=v.caption;}
  function renderObservations(){const e=D.experiments.find(e=>e.id===lab),notes=P.unlocked(lab,stamps())?state.observations[lab]||[]:[];$('#labObservations').innerHTML=e.goals.map(g=>`<div class="${notes.includes(g.id)?'recorded':''}"><span>${notes.includes(g.id)?'✓':'○'}</span><div><strong>${g.label}</strong><p>${g.hint}</p></div></div>`).join('');const won=e.goals.every(g=>notes.includes(g.id));$('#labConclusion').hidden=!won;$('#labConclusion').innerHTML=won?`<img src="assets/passport/sticker-${e.id}.svg" alt="${e.reward}贴纸"/><h4>你留住了一次发现</h4><p>${e.conclusion}</p><button type="button" data-to-notebook class="passport-secondary">把贴纸放进手账 →</button>`:'';}
  function renderNotebook(){
    const p=page();pageId=p.id;const items=inventory();$('#notebookPages').innerHTML=state.pages.map((p,i)=>`<button type="button" data-notebook-page="${h(p.id)}" aria-pressed="${pageId===p.id}">第 ${i+1} 页</button>`).join('');
    $('#notebookTitle').value=p.title;$('#notebookDate').value=p.date;$('#notebookNote').value=p.note;$('#notebookPaper').value=p.paper;$('#notebookDeletePage').disabled=state.pages.length<=1;$('#notebookAddPage').disabled=state.pages.length>=12;
    $('#notebookInventory').innerHTML=items.length?items.map(a=>`<button type="button" data-add-art="${a.id}" aria-label="添加${a.title}" ${p.items.length>=6?'disabled':''}><img src="${a.src}" alt=""/><span>${a.title}</span></button>`).join(''):'<p class="passport-empty">先在护照里确认到达，收下你的第一枚章。你也可以先写下今天的心情。</p>';
    renderPage();
  }
  function renderPage(){const p=page();$('#notebookPreview').innerHTML=A.notebook(p,state.profile,inventory(),selected);$('#notebookItemCount').textContent=p.items.length+' / 6 枚';const i=p.items.find(i=>i.id===selected);$('#notebookItemTools').hidden=!i;if(i){$('#notebookSize').value=i.size;$('#notebookRotation').value=i.rotation;}}
  function changePage(fn){fn();save();invalidateExport();renderPage();}
  function bind(host,dialog){
    host.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.passportTab)switchTab(b.dataset.passportTab);
      if(b.dataset.passportTheme){P.updateProfile(state,{theme:b.dataset.passportTheme});save();renderPassport();}
      if(b.dataset.passportPlace)openPlace(b.dataset.passportPlace);
      if(b.dataset.lab){lab=b.dataset.lab;renderLab();}
      if(b.hasAttribute('data-to-notebook'))switchTab('notebook');
      if(b.dataset.notebookPage){pageId=b.dataset.notebookPage;selected='';invalidateExport();$('#notebookDeleteConfirm').hidden=true;renderNotebook();}
      if(b.dataset.addArt){const i=P.addItem(state,pageId,b.dataset.addArt,stamps());if(i){selected=i.id;save();invalidateExport();renderNotebook();toast('已贴入「'+inventory().find(a=>a.id===i.art).title+'」，拖动它试试。');}}
    });
    host.querySelector('.passport-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const ids=['trail','passport','labs','notebook'],n=ids.indexOf(tab),id=ids[e.key==='Home'?0:e.key==='End'?3:(n+(e.key==='ArrowRight'?1:3))%4];switchTab(id);$('[data-passport-tab="'+id+'"]').focus();});
    $('#passportName').addEventListener('input',e=>{P.updateProfile(state,{name:e.target.value});save();invalidateExport();});
    $('#passportLegacy').addEventListener('click',()=>$('#openStampBook').click());
    $('#passportWaterStory').addEventListener('click',()=>{switchTab('trail');$('#waterTitle').scrollIntoView({block:'start',behavior:'instant'});});
    $('#passportLab').addEventListener('input',e=>{if(e.target.dataset.labControl){values[lab][e.target.dataset.labControl]=Number(e.target.value);renderLabScene();}});
    $('#passportLab').addEventListener('click',e=>{if(!e.target.closest('#labRecord'))return;const r=P.sample(state,lab,values[lab],stamps());save();$('#labFeedback').textContent=r.message||'调整条件后重试。';renderObservations();if(r.status==='earned'){toast(r.message);$('#labConclusion').scrollIntoView({block:'nearest',behavior:'instant'});}});
    dialog.addEventListener('click',e=>{if(e.target===dialog||e.target.closest('[data-close-passport-place]'))dialog.close();});
    $('#passportConfirmArrival').addEventListener('click',()=>{const result=context.checkIn(placeId);updatePlace();$('#passportPlaceArt').classList.remove('just-stamped');void $('#passportPlaceArt').offsetWidth;$('#passportPlaceArt').classList.add('just-stamped');toast(result?'已盖下「'+D.places.find(p=>p.id===placeId).name+'」纪念章。':'这枚章已经收好。');if(tab==='labs')renderLab();});
    $('#passportPlaceNotebook').addEventListener('click',()=>{dialog.close();switchTab('notebook');const i=P.addItem(state,pageId,'stamp:'+placeId,stamps());if(i){selected=i.id;save();invalidateExport();renderNotebook();}else toast('这一页已放满 6 枚，可以新建一页。');});
    $('#passportPlaceLab').addEventListener('click',()=>{lab=D.experiments.find(e=>e.poiIds.includes(placeId))?.id||'color';dialog.close();switchTab('labs');});
    $('#passportPlacePoi').addEventListener('click',()=>{dialog.close();context.openPoiDetail(placeId);});
    for(const [id,field] of [['notebookTitle','title'],['notebookNote','note'],['notebookDate','date'],['notebookPaper','paper']])$('#'+id).addEventListener('input',e=>changePage(()=>P.updatePage(state,pageId,{[field]:e.target.value})));
    $('#notebookAddPage').addEventListener('click',()=>{const p=P.addPage(state);if(p){pageId=p.id;selected='';$('#notebookDeleteConfirm').hidden=true;save();invalidateExport();renderNotebook();}});
    $('#notebookDeletePage').addEventListener('click',()=>{$('#notebookDeleteConfirm').hidden=false;$('#notebookConfirmDelete').focus();});
    $('#notebookCancelDelete').addEventListener('click',()=>{$('#notebookDeleteConfirm').hidden=true;$('#notebookDeletePage').focus();});
    $('#notebookConfirmDelete').addEventListener('click',()=>{P.removePage(state,pageId);pageId=state.pages[0].id;selected='';save();invalidateExport();$('#notebookDeleteConfirm').hidden=true;renderNotebook();});
    $('#notebookRemoveItem').addEventListener('click',()=>{P.removeItem(state,pageId,selected);selected='';save();invalidateExport();renderNotebook();});
    for(const [id,field] of [['notebookSize','size'],['notebookRotation','rotation']])$('#'+id).addEventListener('input',e=>changePage(()=>P.moveItem(state,pageId,selected,{[field]:Number(e.target.value)})));
    bindDrag();
    $('#notebookDownload').addEventListener('click',async()=>{const token=++exportToken,button=$('#notebookDownload');button.disabled=true;$('#notebookExportStatus').textContent='正在生成高清手账…';try{const result=await A.exportPage(JSON.parse(JSON.stringify(page())),{...state.profile},inventory());if(token!==exportToken){$('#notebookExportStatus').textContent='页面已修改，请重新生成图片。';return;}$('#notebookExportImage').src=result.png;$('#notebookPng').href=result.png;$('#notebookSvg').href=result.svg;$('#notebookExport').hidden=false;$('#notebookExportStatus').textContent='图片已生成，可以下载或长按保存。';$('#notebookExport').scrollIntoView({block:'nearest',behavior:'instant'});}catch(err){$('#notebookExportStatus').textContent=err.message||'导出未成功，请重试。';}finally{button.disabled=false;}});
    window.addEventListener('pagehide',()=>{drag=null;save();});
  }
  function bindDrag(){const host=$('#notebookPreview');
    host.addEventListener('pointerdown',e=>{const g=e.target.closest('[data-notebook-item]');if(!g||e.button!==0)return;e.preventDefault();selected=g.dataset.notebookItem;const i=page().items.find(i=>i.id===selected);drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:{...i}};host.setPointerCapture?.(e.pointerId);renderPage();});
    host.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const canvas=$('#notebookCanvas'),rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;P.moveItem(state,pageId,selected,{x:drag.start.x+(e.clientX-drag.x)/rect.width*720/640*100,y:drag.start.y+(e.clientY-drag.y)/rect.height*Number(canvas.getAttribute('height'))/480*100});invalidateExport();renderPage();});
    const stop=e=>{if(!drag||drag.id!==e.pointerId)return;drag=null;try{host.releasePointerCapture?.(e.pointerId);}catch{}save();invalidateExport();host.querySelector(`[data-notebook-item="${selected}"]`)?.focus({preventScroll:true});};
    host.addEventListener('pointerup',stop);host.addEventListener('pointercancel',stop);host.addEventListener('lostpointercapture',stop);
    host.addEventListener('keydown',e=>{const g=e.target.closest('[data-notebook-item]');if(!g)return;selected=g.dataset.notebookItem;const i=page().items.find(i=>i.id===selected);if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(e.key))return;e.preventDefault();if(e.key.startsWith('Arrow')){const amount=e.shiftKey?5:1;P.moveItem(state,pageId,selected,{x:i.x+(e.key==='ArrowRight'?amount:e.key==='ArrowLeft'?-amount:0),y:i.y+(e.key==='ArrowDown'?amount:e.key==='ArrowUp'?-amount:0)});save();invalidateExport();}renderPage();host.querySelector(`[data-notebook-item="${selected}"]`)?.focus();});
  }
  function render(next){context=next;if(!ready&&!mount())return;switchTab(tab);$('#passportStorage').textContent=warning||'已自动保存到此设备 · 清除浏览器数据会移除护照与手账';}
  return {render};
})();
