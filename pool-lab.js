window.HuanglongPoolLab=(()=>{
  const M=window.HuanglongPoolModel,Scene=window.HuanglongPoolScene,KEY='huanglong.pool-lab.v1';
  const esc=window.HuanglongPassportArt.esc;
  const controls=[
    {id:'flow',label:'来水量',ends:'少 → 多',help:'先改变上游补给，再逐级影响水位与溢流'},
    {id:'calcium',label:'溶解钙供给',ends:'低 → 高',help:'改变新来水携带的溶解物，池中已有的不会消失'},
    {id:'exchange',label:'CO₂ 逸散条件',ends:'弱 → 强',help:'适宜条件下，促进水中碳酸钙析出'},
    {id:'light',label:'光照',ends:'柔 → 明',help:'改变观看效果，不直接制造沉积'}
  ];
  const presets={steady:{flow:75,calcium:60,exchange:55,light:70},low:{flow:5},grow:{calcium:90,exchange:90},shade:{light:20}};
  const clock=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t)%60).padStart(2,'0')}`;
  function mount(host,bridge){
    let world=M.create(),baseline=M.snapshot(world),records=[],selected=3,compare=false,split=.5,speed=3;
    let active=false,inFrame=null,lastTime=null,lastText=0,lastSaved=0,visible=true,storageWarning='',dragPointer=null;
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    try{const stored=JSON.parse(localStorage.getItem(KEY));if(stored?.version===1){
      world=M.restore(stored.world);baseline=M.restore(stored.baseline);
      records=(Array.isArray(stored.records)?stored.records:[]).filter(r=>r?.world?.version===1).slice(0,6).map(r=>({world:M.restore(r.world),selected:Number.isInteger(r.selected)&&r.selected>=0&&r.selected<4?r.selected:3}));
      selected=Number.isInteger(stored.selected)&&stored.selected>=0&&stored.selected<4?stored.selected:3;
      speed=[1,3,6].includes(stored.speed)?stored.speed:3;
    }}catch{storageWarning='未能读取本机观察记录，本次仍可探索。';}
    host.innerHTML=`<div class="pool-heading"><div><p class="passport-kicker">A LIVING LANDSCAPE</p><h2>彩池演化实验室</h2></div><span class="pool-edition">水 · 石 · 时间</span></div>
      <p class="pool-lead">同一片池群，慢慢变。<br>改变来水，看看水先去哪里，石又留在哪里。</p>
      <div class="pool-workbench"><div class="pool-stage" id="poolStage"><div class="pool-stage-top"><span class="pool-live" id="poolRunState">等待开始</span><button type="button" id="poolPlay" class="passport-primary">▶ 开始演化</button></div><span id="poolClock" class="pool-clock">演示 00:00</span>
        <div class="pool-canvas-wrap"><canvas id="poolCanvas" aria-label="相连的四片彩池；可用下方按钮选择池子查看剖面" role="img"></canvas>
        <p id="poolCanvasFallback" hidden>当前浏览器未能显示池群画面；仍可通过剖面、状态与文字观察演化。</p>
        <div class="pool-compare-labels" id="poolCompareLabels" hidden><span>对照起点</span><span>此刻</span></div></div>
        <div class="pool-stage-bottom"><span>含钙来水 → 蓄水 → 溢流</span><button type="button" id="poolCompare" aria-pressed="false">◫ 起点对照</button></div>
        <div id="poolCompareTools" class="pool-compare-tools" hidden><label for="poolWipe">拖动画面分界线，或滑动这里比较前后</label><input type="range" id="poolWipe" min="5" max="95" value="50"/><button type="button" id="poolSetBaseline">此刻设为起点</button></div>
      </div>
      <div class="pool-transport"><button type="button" id="poolStep">推演一段</button><label class="pool-speed">速度<select id="poolSpeed" aria-label="演示速度"><option value="1">1×</option><option value="3">3×</option><option value="6">6×</option></select></label><button type="button" id="poolReset" aria-label="复位池群演化，保留观察记录和收藏">↺ 复位</button></div>
      <p class="pool-time-note" id="poolMotionNote">时间已压缩，不对应真实年限。离开页面会暂停。</p>
      <section class="pool-inputs" aria-label="环境条件">${controls.map(c=>`<label class="pool-control" for="poolInput-${c.id}"><span><strong>${c.label}</strong><output id="poolValue-${c.id}"></output></span><input id="poolInput-${c.id}" type="range" min="0" max="100" data-pool-input="${c.id}" aria-describedby="poolHelp-${c.id}"/><small id="poolHelp-${c.id}">${c.help}</small></label>`).join('')}</section>
      <div class="pool-presets" aria-label="改变环境条件"><button type="button" data-pool-preset="steady">补给充足</button><button type="button" data-pool-preset="low">来水减少</button><button type="button" data-pool-preset="grow">增强沉积条件</button><button type="button" data-pool-preset="shade">柔光观察</button></div>
      <p class="pool-time-note">预设只调整条件，池群会接着当前状态演化。</p></div>
      <section class="pool-insight"><div class="pool-select" aria-label="选择观察的池子">${M.POOLS.map((p,i)=>`<button type="button" data-pool-select="${i}" aria-pressed="${selected===i}">${p.name}</button>`).join('')}</div>
        <p class="passport-kicker">LOOK CLOSER / 此刻发生了什么</p><h3 id="poolWhyTitle"></h3><p id="poolWhy"></p><div id="poolSignals" class="pool-signals"></div><p id="poolNext" class="pool-next"></p>
        <details class="pool-section"><summary><span id="poolSectionName">下游池</span>的剖面 <small>虚线是初始池沿</small></summary><div id="poolSection"></div></details>
      </section>
      <div class="pool-record-bar"><button type="button" class="passport-primary" id="poolRecord">＋ 留下这次观察</button><span>保留状态，可以回来对照</span></div>
      <p id="poolFeedback" class="pool-feedback" role="status"></p><div id="poolRecords" class="pool-records"></div>
      <details class="pool-collection"><summary>我的池群发现 <span id="poolCollectionCount"></span></summary><p>自由探索也能留下发现。到站后记录水路连通、水位下降和池沿积累三类状态，可收下「池群观察者」贴纸。</p><div id="poolCollection"></div><div class="pool-pois"><button type="button" data-passport-place="five-color-pond">五彩池 ↗</button><button type="button" data-passport-place="jinsha-pudi">金沙铺地 ↗</button><button type="button" data-passport-place="zhengyan-chi">争艳彩池 ↗</button><button type="button" data-passport-place="welcome-pond">迎宾池 ↗</button></div><p>未到站可预习、写手账；旧版发现贴纸继续保留。</p></details>
      <details class="pool-science"><summary>演示能说明什么，不能说明什么</summary><p>来水先蓄积，水面高过池沿后向下游溢流。假定水化学条件适宜，CO₂逸散促进部分溶解物析出，形成池沿与池底薄层。光照、水深和浅色池底共同影响这里的水色。</p><p>这是定性观察模型。水文与地貌时间分别压缩到可见尺度，所有输入均为相对强弱，不是黄龙实测流量、温度或浓度。这里没有计算完整碳酸盐平衡、藻类、天气、侵蚀或真实地形，不能据此判断景区状态或推算年限。</p><p>现场再看：在开放栈道比较水面、池沿、池底和溢流；不进入彩池，不触碰或取走钙华。</p></details><p id="poolStorage" class="pool-time-note"></p>`;
    const $=s=>host.querySelector(s),renderer=Scene.mount($('#poolCanvas'));
    $('#poolCanvasFallback').hidden=!!renderer;
    $('#poolSpeed').value=String(speed);
    function persist(){
      try{localStorage.setItem(KEY,JSON.stringify({version:1,world,baseline,records,selected,speed}));storageWarning='';}
      catch{storageWarning='本机未能保存实验进度；请将重要观察写入手账并导出。';}
      $('#poolStorage').textContent=storageWarning||'实验与观察保存在此设备 · 最多保留 6 条，较早记录可先写入手账';
    }
    function drawing(){renderer?.draw(world,{selected,baseline:compare?baseline:null,split});}
    function refreshControls(){for(const c of controls){const v=world.inputs[c.id],label=v===0?'关闭':v<30?'较弱':v<70?'适中':'较强';
      const input=$(`[data-pool-input="${c.id}"]`);input.value=v;input.setAttribute('aria-valuetext',`${label}，相对值 ${v}`);$('#poolValue-'+c.id).textContent=label;input.style.setProperty('--range',v+'%');}
    }
    function refreshCollection(){
      const info=bridge.collection(),goals=window.HuanglongPassportData.experiments.find(e=>e.id==='pool').goals;
      $('#poolCollectionCount').textContent=info.notes.length+' / 3';
      $('#poolCollection').innerHTML=`<p>${info.unlocked?'已到站 · 可以收集发现':'预习模式 · 尚未确认到达'}</p><ul>${goals.map(g=>`<li class="${info.notes.includes(g.id)?'collected':''}">${info.notes.includes(g.id)?'✓':'○'} ${g.label}</li>`).join('')}</ul>${info.notes.length===3?'<img src="assets/passport/sticker-pool.svg" alt="池群观察者贴纸"/>':''}`;
    }
    function refresh(){
      const d=M.describe(world,selected);$('#poolClock').textContent='演示 '+clock(world.elapsed);
      $('#poolRunState').textContent=world.running?'● 正在演化':world.elapsed?'Ⅱ 已暂停':'○ 等待开始';$('#poolRunState').classList.toggle('running',world.running);
      $('#poolPlay').textContent=world.running?'Ⅱ 暂停观察':world.elapsed?'▶ 继续演化':'▶ 开始演化';
      $('#poolPlay').hidden=media.matches;$('#poolStep').disabled=world.running;
      $('#poolMotionNote').textContent=media.matches?'减少动态效果已开启：点击「推演一段」逐步观察。时间不对应真实年限。':'时间已压缩，不对应真实年限。离开页面会暂停。';
      $('#poolWhyTitle').textContent=d.title;$('#poolWhy').textContent=d.reason;$('#poolNext').textContent=d.next;
      $('#poolSignals').innerHTML=`<span><i class="signal-water"></i>${d.water}</span><span><i class="signal-flow"></i>${d.flow}</span><span><i class="signal-rim"></i>${d.mineral}</span>`;
      $('#poolSectionName').textContent=d.name;$('#poolSection').innerHTML=Scene.section(world,selected);
      for(const b of host.querySelectorAll('[data-pool-select]'))b.setAttribute('aria-pressed',String(Number(b.dataset.poolSelect)===selected));
      $('#poolCompare').setAttribute('aria-pressed',String(compare));$('#poolCompareTools').hidden=!compare;$('#poolCompareLabels').hidden=!compare;$('#poolCanvas').classList.toggle('comparing',compare);
      drawing();
    }
    function note(record){const d=M.describe(record.world,record.selected);return `${d.name} · ${d.title}\n${d.reason}\n演示时刻 ${clock(record.world.elapsed)}；来水 ${record.world.inputs.flow}、溶解钙供给 ${record.world.inputs.calcium}、逸散 ${record.world.inputs.exchange}、光照 ${record.world.inputs.light}（相对值）。这是定性演示，不是现场监测。`;}
    function renderRecords(){
      $('#poolRecords').innerHTML=records.length?records.map((r,i)=>{const d=M.describe(r.world,r.selected);return `<article><div class="pool-record-top"><span>观察 ${String(i+1).padStart(2,'0')}</span><span>${clock(r.world.elapsed)} · ${d.name}</span></div><h4>${esc(d.title)}</h4><p>${esc(d.reason)}</p><div><button type="button" data-pool-baseline="${i}">与此刻对照</button><button type="button" data-pool-notebook="${i}">写进手账 ↗</button></div></article>`;}).join(''):'<p class="pool-empty">先让水流起来，再留下一个让你好奇的时刻。</p>';
    }
    function stopFrame(){if(inFrame!==null){window.cancelAnimationFrame?.(inFrame);inFrame=null;}lastTime=null;}
    function stopDrag(){if(dragPointer!==null){try{$('#poolCanvas').releasePointerCapture(dragPointer);}catch{}dragPointer=null;}}
    function pause(message){world.running=false;stopFrame();stopDrag();refresh();persist();if(message)$('#poolFeedback').textContent=message;}
    function frame(now){
      inFrame=null;if(!world.running||!active||!visible||document.hidden||media.matches){pause();return;}
      if(lastTime===null)lastTime=now;
      const dt=Math.min(.1,(now-lastTime)/1000);lastTime=now;M.tick(world,dt*speed);
      if(now-lastText>180){refresh();lastText=now;}else drawing();
      if(now-lastSaved>2500){persist();lastSaved=now;}
      inFrame=window.requestAnimationFrame(frame);
    }
    $('#poolPlay').addEventListener('click',()=>{
      if(world.running){pause();return;}if(!active||media.matches)return;
      visible=true;world.running=true;lastTime=null;refresh();persist();inFrame=window.requestAnimationFrame?.(frame)??null;
    });
    $('#poolStep').addEventListener('click',()=>{if(world.running||!active)return;M.advance(world,5);refresh();persist();});
    $('#poolSpeed').addEventListener('change',e=>{speed=[1,3,6].includes(Number(e.target.value))?Number(e.target.value):3;persist();});
    host.addEventListener('input',e=>{if(e.target.dataset.poolInput){M.setInput(world,e.target.dataset.poolInput,Number(e.target.value));refreshControls();refresh();persist();}});
    host.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.poolPreset&&presets[b.dataset.poolPreset]){for(const [k,v] of Object.entries(presets[b.dataset.poolPreset]))M.setInput(world,k,v);refreshControls();refresh();persist();$('#poolFeedback').textContent='条件已改变。'+(world.running?'继续看池群怎样响应。':'点击继续演化或推演一段，观察接下来的变化。');}
      if(b.hasAttribute('data-pool-select')){selected=Number(b.dataset.poolSelect);refresh();persist();}
      if(b.hasAttribute('data-pool-baseline')){baseline=M.snapshot(records[Number(b.dataset.poolBaseline)].world);compare=true;refresh();persist();$('#poolStage').scrollIntoView({block:'start',behavior:'instant'});}
      if(b.hasAttribute('data-pool-notebook')){const r=records[Number(b.dataset.poolNotebook)];pause();const ok=bridge.notebook({title:'彩池观察 · '+M.POOLS[r.selected].name,note:note(r)});if(!ok)$('#poolFeedback').textContent='手账已满 12 页，请先在手账中整理一页后再添加。';}
    });
    $('#poolCanvas').addEventListener('click',e=>{if(!renderer||compare)return;const rect=e.currentTarget.getBoundingClientRect();const hit=renderer.hit((e.clientX-rect.left)/rect.width,(e.clientY-rect.top)/rect.height);if(hit>=0){selected=hit;refresh();persist();}});
    function moveSplit(value){split=Math.min(.95,Math.max(.05,value));$('#poolWipe').value=String(Math.round(split*100));drawing();}
    $('#poolCanvas').addEventListener('pointerdown',e=>{
      if(!compare||!active||e.button!==0)return;const rect=e.currentTarget.getBoundingClientRect();
      if(rect.width<=0||Math.abs(e.clientX-rect.left-rect.width*split)>28)return;
      dragPointer=e.pointerId;try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}
    });
    $('#poolCanvas').addEventListener('pointermove',e=>{
      if(dragPointer!==e.pointerId||!compare)return;const rect=e.currentTarget.getBoundingClientRect();
      if(rect.width>0)moveSplit((e.clientX-rect.left)/rect.width);
    });
    for(const event of ['pointerup','pointercancel','lostpointercapture'])$('#poolCanvas').addEventListener(event,stopDrag);
    $('#poolCompare').addEventListener('click',()=>{stopDrag();compare=!compare;refresh();});
    $('#poolWipe').addEventListener('input',e=>moveSplit(Number(e.target.value)/100));
    $('#poolSetBaseline').addEventListener('click',()=>{baseline=M.snapshot(world);refresh();persist();$('#poolFeedback').textContent='已把此刻设为对照起点。接下来改变一个条件，再观察。';});
    $('#poolReset').addEventListener('click',()=>{pause();world=M.create();baseline=M.snapshot(world);compare=false;refreshControls();refresh();persist();$('#poolFeedback').textContent='池群已回到开始。你的观察记录、贴纸和手账仍然保留。';});
    $('#poolRecord').addEventListener('click',()=>{
      const record={world:M.snapshot(world),selected};
      const signature=JSON.stringify({...world,running:false});
      const duplicate=records.some(r=>r.selected===selected&&JSON.stringify({...r.world,running:false})===signature);
      if(!duplicate){records.push(record);if(records.length>6)records.shift();}
      const result=bridge.record(M.discoveries(world));$('#poolFeedback').textContent=result.message||(duplicate?'这个时刻已经留在观察记录里。':'已留下这次观察。');
      renderRecords();refreshCollection();persist();
    });
    document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
    window.addEventListener('pagehide',()=>pause());
    media.addEventListener?.('change',()=>{pause();refresh();});
    if(window.IntersectionObserver){const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible&&world.running)pause();},{threshold:0});observer.observe($('#poolCanvas'));}
    refreshControls();refresh();refreshCollection();renderRecords();persist();
    return {pause,refresh:refreshCollection,setActive(value){if(active===value)return;active=value;if(!active)pause();else{refresh();refreshCollection();}}};
  }
  return {mount};
})();
