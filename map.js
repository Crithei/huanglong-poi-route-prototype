/* Map exploration and facility routing. Curated itinerary rules remain in app.js. */
const MAP_CATEGORIES = [
  ['all','全部','map-pinned'], ['scenic','景点','mountain'], ['toilet','厕所','accessibility'],
  ['transport','索道接驳','tram-front'], ['shop','商店补给','store'], ['medical','医疗','cross'], ['service','便民','info']
];
const mapUi = { category:'scenic', query:'', selectedId:'welcome-pond', size:'peek', originId:'visitor-center', requestId:0, catalog:null, routeResult:null, routeLine:null, routeEnds:[], entranceMarker:null, markerSignature:'', busy:false };
const html = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function getMapPois() {
  if (mapUi.catalog) return mapUi.catalog;
  const facilities = window.HUANGLONG_FACILITIES?.pois || [];
  const byId = new Map(facilities.map(p=>[p.id,p]));
  const oldIds = new Set(POIS.map(p=>p.id));
  mapUi.catalog = POIS.map(p=>({...p, ...byId.get(p.id), aliases:[...new Set([p.name,...p.aliases,...(byId.get(p.id)?.aliases||[])])], groups:byId.get(p.id)?.groups || [p.kind==='scenic'?'scenic':/索道|观光车/.test(p.name)?'transport':/医疗/.test(p.name)?'medical':'service']})).concat(facilities.filter(p=>!oldIds.has(p.id)));
  return mapUi.catalog;
}

function straightDistance(a,b) {
  const rad=x=>x*Math.PI/180;
  const dlat=rad(b[1]-a[1]), dlng=rad(b[0]-a[0]);
  const v=Math.sin(dlat/2)**2+Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(dlng/2)**2;
  return 6371000*2*Math.atan2(Math.sqrt(v),Math.sqrt(1-v));
}

function filteredMapPois() {
  const query=normalizeText(mapUi.query);
  const origin=getPoi(mapUi.originId);
  return getMapPois().filter(p=>(mapUi.category==='all'||p.groups.includes(mapUi.category)) && (!query||normalizeText([p.name,p.address,p.category,...p.aliases].join(' ')).includes(query)))
    .sort((a,b)=>straightDistance(origin.location,a.location)-straightDistance(origin.location,b.location));
}

function renderExplorer() {
  const pois=filteredMapPois();
  if (!pois.some(p=>p.id===mapUi.selectedId)) mapUi.selectedId=pois[0]?.id || null;
  document.querySelector('#mapCategories').innerHTML=MAP_CATEGORIES.map(([id,label,icon])=>`<button type="button" data-map-category="${id}" class="category-chip ${mapUi.category===id?'active':''}" aria-pressed="${mapUi.category===id}"><i data-lucide="${icon}" aria-hidden="true"></i>${label}</button>`).join('');
  document.querySelector('#clearMapSearch').hidden=!mapUi.query;
  const category=MAP_CATEGORIES.find(c=>c[0]===mapUi.category);
  document.querySelector('#mapSearch').placeholder=mapUi.category==='all'?'搜景点、厕所、索道、小卖部':`在${category[1]}中搜索`;
  document.querySelector('#mapResultTitle').textContent=mapUi.query?`“${mapUi.query}”的结果`:mapUi.category==='scenic'?'彩池与山林之间':`${category[1]}，沿途找得到`;
  document.querySelector('#mapResultCount').textContent=`${pois.length} 处地点 · 距${shortPoiName(getPoi(mapUi.originId))}由近到远`;
  const picked=getPoi(mapUi.selectedId);
  const shown=mapUi.size==='expanded'?pois:picked?[picked]:[];
  document.querySelector('#mapResults').innerHTML=shown.length?shown.map(p=>{
    const category=p.groups[0];
    const icon=MAP_CATEGORIES.find(c=>c[0]===category)?.[2]||'map-pin';
    return `<article class="place-row ${mapUi.selectedId===p.id?'is-active':''}">
      <button class="place-main" type="button" data-map-select="${html(p.id)}" aria-label="在地图上查看${html(p.name)}"><span class="place-symbol ${category}"><i data-lucide="${icon}" aria-hidden="true"></i></span><span class="place-text"><strong>${html(p.name)}</strong><small>${html(p.category)} · 距起点直线 ${formatDistance(straightDistance(getPoi(mapUi.originId).location,p.location))}</small></span><i data-lucide="chevron-right" aria-hidden="true"></i></button>
      <div class="place-actions"><button type="button" data-poi-detail-id="${html(p.id)}">${p.kind==='scenic'?'景点介绍':'设施详情'}<i data-lucide="arrow-up-right" aria-hidden="true"></i></button><button type="button" class="directions-action" data-walk-to="${html(p.id)}"><i data-lucide="footprints" aria-hidden="true"></i>到这里</button></div>
    </article>`;
  }).join(''):`<div class="map-empty"><i data-lucide="search-x" aria-hidden="true"></i><strong>没有找到相关地点</strong><p>试试其他名称，或切换到全部类别。</p><button type="button" id="resetMapFilter">查看全部地点</button></div>`;
  const date=(window.HUANGLONG_FACILITIES?.queriedAt||'').slice(0,10);
  document.querySelector('#facilitySource').textContent=`设施来源：高德地点资料 · 查询于 ${date}。位置与开放情况以现场为准。`;
  document.querySelector('#mapCaption').textContent=mapUi.query?`${pois.length} 处匹配地点`:`${getMapPois().length} 处景点与设施 · 黄龙沟`;
  document.querySelector('#placeSheet').dataset.size=mapUi.size;
  const grip=document.querySelector('#togglePlaceSheet');
  grip.setAttribute('aria-expanded',String(mapUi.size==='expanded'));
  grip.setAttribute('aria-label',mapUi.size==='expanded'?'收起地点列表':`展开${pois.length}处地点列表`);
  document.querySelector('#collapsePlaceSheet').setAttribute('aria-label',mapUi.size==='closed'?'展开地点卡片':'收起地点卡片');
  refreshIcons();
}

function setSheetSize(size) {
  mapUi.size=size;
  renderExplorer();
  if(size==='peek' && mapUi.routeLine)fitMapCoordinates(walkingFitPoints(),17);
}

function shortPoiName(poi) { return poi.id==='visitor-center'?'游客中心':poi.name; }

function setMapCategory(category) {
  window.clearTimeout(mapUi.searchTimer);
  mapUi.category=category;
  closeWalkingPanel();
  if (mapUi.size==='closed') mapUi.size='peek';
  renderExplorer();
  syncAmapPlan(appState.currentPlan);
  fitMapPois();
}

function selectMapPoi(id, pan=true) {
  if (!getPoi(id)) return;
  mapUi.selectedId=id;
  mapUi.size='peek';
  closeWalkingPanel();
  renderExplorer();
  syncAmapPlan(appState.currentPlan);
  if (pan && mapRuntime.map) {
    mapRuntime.map.setZoomAndCenter(Math.max(16,mapRuntime.map.getZoom()),getPoi(id).location);
  }
}

function updateMapStatus(message,state) {
  const status=document.querySelector('#mapStatus');
  status.textContent=message;
  status.dataset.state=state;
}
function showMapFallback(title,copy) {
  const fallback=document.querySelector('#mapFallback');
  fallback.hidden=false;
  fallback.querySelector('strong').textContent=title;
  fallback.querySelector('span').textContent=copy;
}
function hideMapFallback() { document.querySelector('#mapFallback').hidden=true; }

function renderMap(plan) {
  mapRuntime.latestPlan=plan;
  renderExplorer();
  if (appState.activeView!=='map') return;
  if (mapRuntime.map) { syncAmapPlan(plan); return; }
  ensureAmap();
}

function ensureAmap() {
  if (mapRuntime.map) return Promise.resolve(mapRuntime.map);
  if (mapRuntime.initPromise) return mapRuntime.initPromise;
  if (mapRuntime.hasFailed) return Promise.resolve(null);
  const config=window.__HUANGLONG_RUNTIME_CONFIG||{};
  if (!config.amapJsapiKey||!config.amapSecurityJsCode||!window.AMapLoader) {
    showMapFallback('地图暂时未连接','仍可查询下方地点资料。请通过本机预览服务打开，并检查网络连接。');
    updateMapStatus('地图未连接','warning');
    mapRuntime.hasFailed=true;
    return Promise.resolve(null);
  }
  window._AMapSecurityConfig={securityJsCode:config.amapSecurityJsCode};
  updateMapStatus('正在加载高德地图','loading');
  mapRuntime.initPromise=window.AMapLoader.load({key:config.amapJsapiKey,version:'2.0',plugins:['AMap.Scale','AMap.Walking']}).then(AMap=>{
    AMap.getConfig().appname = 'amap-jsapi-skill';
    mapRuntime.AMap=AMap;
    mapRuntime.map=new AMap.Map('amapMap',{viewMode:'3D',zoom:14,zooms:[11,19],center:[103.831,32.74],pitch:0,rotation:0,mapStyle:'amap://styles/fresh',dragEnable:true,zoomEnable:true,scrollWheel:true,touchZoom:true,resizeEnable:true});
    mapRuntime.map.addControl(new AMap.Scale({position:'LB',offset:new AMap.Pixel(12,10)}));
    mapRuntime.map.on('complete',()=>{
      hideMapFallback();
      updateMapStatus('高德地图已加载','ready');
      if(appState.activeView==='map') { mapRuntime.map.resize();syncAmapPlan(mapRuntime.latestPlan);if(mapUi.routeResult)fitMapCoordinates(walkingFitPoints(),17);else fitMapPois(); }
    });
    mapRuntime.resizeObserver=new ResizeObserver(()=>{
      if(appState.activeView==='map' && document.querySelector('#amapMap').clientHeight) requestAnimationFrame(()=>mapRuntime.map?.resize());
    });
    mapRuntime.resizeObserver.observe(document.querySelector('#amapMap'));
    hideMapFallback();
    syncAmapPlan(mapRuntime.latestPlan);
    return mapRuntime.map;
  }).catch(()=>{
    showMapFallback('地图暂时未连接','请检查网络后重试，下方地点资料仍可使用。');
    updateMapStatus('高德地图未加载','warning');
    mapRuntime.hasFailed=true;
    mapRuntime.initPromise=null;
    return null;
  });
  return mapRuntime.initPromise;
}

function createMapMarkerContent(poi,selected) {
  const group=poi.groups[0];
  const glyph={scenic:'景',toilet:'WC',transport:'乘',shop:'店',medical:'＋',service:'i'}[group];
  const picked=poi.id===mapUi.selectedId;
  return `<div class="map-pin-wrap ${picked?'picked':''}"><button class="amap-poi-marker ${group} ${selected?'selected':''}" type="button" aria-label="${html(poi.name)}">${glyph}</button>${picked?`<span class="map-pin-label">${html(poi.name)}</span>`:''}</div>`;
}

function syncAmapPlan(plan) {
  if(!mapRuntime.map||!mapRuntime.AMap||!plan||appState.activeView!=='map') return;
  const {AMap,map}=mapRuntime;
  const includedIds=new Set(plan.included.map(p=>p.id));
  const walkingVisible=!document.querySelector('#walkingPanel').hidden;
  const pois=walkingVisible?[getPoi(document.querySelector('#walkOrigin').value),getPoi(document.querySelector('#walkDestination').value)].filter(Boolean):filteredMapPois();
  const signature=JSON.stringify([pois.map(p=>p.id),[...includedIds],mapUi.selectedId]);
  if(signature!==mapUi.markerSignature) {
    mapRuntime.markers.forEach(marker=>marker.setMap(null));
    mapRuntime.markers=pois.map(p=>{
      const marker=new AMap.Marker({position:p.location,content:createMapMarkerContent(p,includedIds.has(p.id)),offset:new AMap.Pixel(-20,-20),title:p.name,zIndex:p.id===mapUi.selectedId?180:120});
      marker.on('click',()=>selectMapPoi(p.id,false));
      marker.setMap(map);
      return marker;
    });
    mapUi.markerSignature=signature;
  }
  if(mapRuntime.scenicSpine)mapRuntime.scenicSpine.setMap(null);
  const scenicPath=plan.included.filter(p=>p.routeRole==='spine').sort((a,b)=>a.routeOrder-b.routeOrder).map(p=>p.location);
  mapRuntime.scenicSpine=null;
  if(scenicPath.length>1) {
    mapRuntime.scenicSpine=new AMap.Polyline({path:scenicPath,strokeColor:'#4b877b',strokeWeight:4,strokeOpacity:.7,strokeStyle:'dashed',strokeDasharray:[8,7],zIndex:70});
    mapRuntime.scenicSpine.setMap(map);
  }
  if(mapUi.routeResult&&!mapUi.routeLine)drawWalkingRoute(false);
}

function fitMapPois() {
  if(!mapRuntime.map||appState.activeView!=='map')return;
  fitMapCoordinates(filteredMapPois().map(p=>p.location),16);
}
function walkingFitPoints() {
  const result=mapUi.routeResult;
  return result?[...result.path,result.origin.location,result.destination.location]:[];
}
// Fit to the unobscured rectangle, using the actual CSS viewport dimensions.
// Include both route geometry and chosen endpoints when calculating the view.
function fitMapCoordinates(points,maxZoom) {
  if(!points.length||!mapRuntime.map||appState.activeView!=='map')return;
  const container=document.querySelector('#amapMap');
  const width=container.clientWidth,height=container.clientHeight;
  if(!width||!height)return;
  const top=142,right=65,left=38;
  const sheetHeight=document.querySelector('#placeSheet').getBoundingClientRect().height;
  const bottom=Math.min(sheetHeight+40,height*.62);
  const mercator=([lng,lat])=>[(lng+180)/360,(1-Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))/Math.PI)/2];
  const projected=points.map(mercator);
  const xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const zoom=Math.max(11,Math.min(maxZoom,Math.log2(Math.min(Math.max(70,width-left-right)/(256*Math.max(maxX-minX,1e-9)),Math.max(70,height-top-bottom)/(256*Math.max(maxY-minY,1e-9))))));
  const world=256*2**zoom;
  const x=(minX+maxX)/2+(right-left)/2/world,y=(minY+maxY)/2+(bottom-top)/2/world;
  mapRuntime.map.setPitch(0);
  mapRuntime.map.setRotation(0);
  document.querySelector('#toggleMapPitch').classList.remove('active');
  mapRuntime.map.setZoomAndCenter(zoom,[x*360-180,Math.atan(Math.sinh(Math.PI*(1-2*y)))*180/Math.PI],true);
}
function resetMapView() {
  mapUi.entranceMarker?.setMap(null);mapUi.entranceMarker=null;
  closeWalkingPanel();
  if(!mapRuntime.map){mapRuntime.hasFailed=false;ensureAmap();return;}
  mapRuntime.map.setPitch(0);mapRuntime.map.setRotation(0);
  document.querySelector('#toggleMapPitch').classList.remove('active');
  fitMapPois();
}
function formatDistance(distance) {
  return !Number.isFinite(distance)?'未提供':distance<1000?`${Math.round(distance)} 米`:`${(distance/1000).toFixed(1)} 公里`;
}
function formatMinutes(seconds) {
  return Number.isFinite(seconds)?`${Math.max(1,Math.round(seconds/60))} 分钟`:'未提供';
}

function invalidateWalking() {
  mapUi.requestId++;
  window.clearTimeout(mapUi.requestTimeout);
  mapUi.busy=false;
  document.querySelector('#planFacilityWalk').disabled=false;
  mapRuntime.walking?.clear();mapRuntime.walking=null;
  mapUi.routeResult=null;
  mapUi.routeLine?.setMap(null);mapUi.routeLine=null;
  mapUi.routeEnds.forEach(m=>m.setMap(null));mapUi.routeEnds=[];
}
function closeWalkingPanel() {
  invalidateWalking();
  document.querySelector('#walkingPanel').hidden=true;
  document.querySelector('#mapResults').hidden=false;
  document.querySelector('#walkingSteps').replaceChildren();
  if(appState.currentPlan)syncAmapPlan(appState.currentPlan);
}

function openWalkingTo(id) {
  const destination=getPoi(id);
  if(!destination)return;
  window.clearTimeout(mapUi.searchTimer);
  closePoiDetail();
  setActiveView('map');
  invalidateWalking();
  mapUi.size='expanded';mapUi.selectedId=id;
  if(!filteredMapPois().some(p=>p.id===id)){mapUi.category='all';mapUi.query='';document.querySelector('#mapSearch').value='';}
  renderExplorer();syncAmapPlan(appState.currentPlan);
  const options=getMapPois().map(p=>`<option value="${html(p.id)}">${html(p.name)}</option>`).join('');
  document.querySelector('#walkOrigin').innerHTML=options;
  document.querySelector('#walkDestination').innerHTML=options;
  document.querySelector('#walkOrigin').value=mapUi.originId;
  document.querySelector('#walkDestination').value=id;
  document.querySelector('#walkingPanel').hidden=false;
  document.querySelector('#mapResults').hidden=true;
  document.querySelector('#walkingSummary').textContent='选好出发点，再查看高德步行距离和用时。';
  document.querySelector('#walkCoordinateNote').textContent=/原型定位/.test(destination.coordinateNote)?destination.coordinateNote+'；路线终点为附近参考位置。':'';
  document.querySelector('#sheetBody').scrollTop=0;
  syncAmapPlan(appState.currentPlan);
  document.querySelector('#mapResultTitle').textContent='这一段，步行前往';
  document.querySelector('#mapResultCount').textContent=`${shortPoiName(getPoi(mapUi.originId))} → ${shortPoiName(destination)}`;
}

function planFacilityWalking() {
  const origin=getPoi(document.querySelector('#walkOrigin').value);
  const destination=getPoi(document.querySelector('#walkDestination').value);
  const summary=document.querySelector('#walkingSummary');
  invalidateWalking();
  document.querySelector('#walkingSteps').replaceChildren();
  if(!origin||!destination)return;
  if(origin.id===destination.id||straightDistance(origin.location,destination.location)<1){summary.textContent='起点和终点相同，请换一个地点。';return;}
  const requestId=mapUi.requestId;
  mapUi.busy=true;
  document.querySelector('#planFacilityWalk').disabled=true;
  summary.textContent=`正在查询 ${origin.name} → ${destination.name}…`;
  const finish=()=>{
    window.clearTimeout(mapUi.requestTimeout);
    mapUi.busy=false;
    document.querySelector('#planFacilityWalk').disabled=false;
  };
  mapUi.requestTimeout=window.setTimeout(()=>{
    if(requestId!==mapUi.requestId)return;
    invalidateWalking();
    summary.textContent='查询暂未返回，请稍后再试。';
    updateMapStatus('步行查询超时','warning');
  },18000);
  ensureAmap().then(map=>{
    if(requestId!==mapUi.requestId)return;
    if(!map){finish();summary.textContent='地图尚未连接，暂时无法查询步行路线。';return;}
    const walking=new mapRuntime.AMap.Walking();
    mapRuntime.walking=walking;
    updateMapStatus('正在查询步行路线','loading');
    walking.search(origin.location,destination.location,(status,result)=>{
      if(requestId!==mapUi.requestId)return;
      finish();
      const route=result?.routes?.[0];
      const routePath=(route?.steps||[]).flatMap(step=>step.path||[]).map(p=>[Number(p.lng ?? p[0]),Number(p.lat ?? p[1])]).filter(p=>p.every(Number.isFinite));
      if(status==='complete'&&route&&routePath.length>1){
        mapUi.routeResult={path:routePath,origin,destination};
        summary.textContent=`${origin.name} → ${destination.name}：约 ${formatDistance(Number(route.distance))} · ${formatMinutes(Number(route.time))}。以现场栈道与通行指引为准。`;
        document.querySelector('#walkingSteps').innerHTML=`<details><summary>查看步行指引 · ${route.steps.length} 段</summary><ol>${route.steps.map(step=>`<li>${html(step.instruction||'沿步行道路前行')}</li>`).join('')}</ol></details>`;
        drawWalkingRoute(true);
        updateMapStatus('高德步行路线已显示','ready');
      }else{
        summary.textContent='高德暂未返回这两点间的步行路线。可以更换起点，或查看现场导览。';
        updateMapStatus('未取得步行路线','warning');
      }
    });
  }).catch(()=>{
    if(requestId!==mapUi.requestId)return;
    finish();summary.textContent='步行查询暂时失败，请稍后再试。';
  });
}

function drawWalkingRoute(fit) {
  if(!mapUi.routeResult||appState.activeView!=='map'||!mapRuntime.map)return;
  const {AMap,map}=mapRuntime;
  mapUi.routeLine?.setMap(null);
  mapUi.routeEnds.forEach(m=>m.setMap(null));
  mapUi.routeLine=new AMap.Polyline({path:mapUi.routeResult.path,strokeColor:'#087df1',strokeWeight:6,strokeOpacity:.9,lineJoin:'round',zIndex:100});
  mapUi.routeLine.setMap(map);
  mapUi.routeEnds=[mapUi.routeResult.origin,mapUi.routeResult.destination].map((p,i)=>new AMap.Marker({position:p.location,map,offset:new AMap.Pixel(-16,-16),content:`<span class="walk-endpoint ${i?'end':''}">${i?'终':'起'}</span>`,zIndex:200}));
  if(fit) {
    fitMapCoordinates(walkingFitPoints(),17);
  }
}

function renderPoiDialog(id) {
  const poi=getPoi(id);if(!poi)return;
  const service=poi.kind==='service';
  document.querySelector('#poiDialogCategory').textContent=`${service?'沿途设施':'黄龙景点'} / ${poi.category}`;
  document.querySelector('#poiDialogTitle').textContent=poi.name;
  document.querySelector('#poiDialogSummary').textContent=poi.introduction;
  document.querySelector('#poiDialogFacts').innerHTML=service?
    `<span><i data-lucide="map-pin" aria-hidden="true"></i>${html(poi.address||'黄龙景区')}</span><span><i data-lucide="clock-3" aria-hidden="true"></i>${poi.openingHours?`资料开放时间 ${html(poi.openingHours)}`:'开放时间未提供'}</span>${poi.phone?`<a href="tel:${html(poi.phone.split(';')[0])}"><i data-lucide="phone" aria-hidden="true"></i>${html(poi.phone.split(';')[0])}</a>`:''}`:
    `<span><i data-lucide="clock-3" aria-hidden="true"></i>建议停留 ${poi.minutes} 分钟</span><span><i data-lucide="footprints" aria-hidden="true"></i>${effortLabel(poi.effort)}</span><span><i data-lucide="map-pin" aria-hidden="true"></i>${html(poi.coordinateNote)}</span>`;
  document.querySelector('#poiHighlightsHeading').textContent=service?'到这里之前':'为什么值得停留';
  document.querySelector('#poiDialogHighlights').innerHTML=service?
    `<li>可在地图上查看位置，并手动选择起点查询步行路线。</li><li>${poi.entranceLocation?'高德收录了入口坐标，可单独查看入口位置。':'高德未提供独立入口坐标，当前标记为设施位置。'}</li><li>${html(poi.verificationNote||'营业、排队与可用情况以现场为准。')}</li>`:
    poi.highlights.map(item=>`<li>${html(item)}</li>`).join('');
  document.querySelector('#poiTipHeading').textContent=service?'地点资料':'这次怎么安排';
  document.querySelector('#poiDialogTip').textContent=service?
    `${poi.source?'高德地图':'景区设施目录'}${poi.queriedAt?' · 查询于 '+poi.queriedAt.slice(0,10):''}。${poi.tip}`:poi.tip;
  document.querySelector('#poiDialogFacts').insertAdjacentHTML('beforeend',`${poi.entranceLocation?'<button type="button" id="focusPoiEntrance"><i data-lucide="door-open" aria-hidden="true"></i>查看入口位置</button>':''}${service?`<button type="button" data-set-origin="${html(poi.id)}"><i data-lucide="flag" aria-hidden="true"></i>设为步行起点</button>`:''}`);
  const toggle=document.querySelector('#togglePoiFromDialog');
  delete toggle.dataset.poiId;delete toggle.dataset.walkTo;
  if(service){toggle.dataset.walkTo=poi.id;toggle.innerHTML='<i data-lucide="footprints" aria-hidden="true"></i>到这里';}
  else { const selected=appState.selectedPoiIds.has(id);toggle.dataset.poiId=id;toggle.innerHTML=`<i data-lucide="${selected?'circle-check-big':'plus-circle'}" aria-hidden="true"></i>${selected?'已加入行程':'加入行程'}`; }
  refreshIcons();
}
function openPoiDetail(id) {
  if(!getPoi(id))return;
  appState.activePoiId=id;renderPoiDialog(id);
  const dialog=document.querySelector('#poiDialog');if(!dialog.open)dialog.showModal();
}
function closePoiDetail(){document.querySelector('#poiDialog').close();}
function focusPoiOnMap(entrance=false) {
  const poi=getPoi(appState.activePoiId);if(!poi)return;
  closePoiDetail();setActiveView('map');
  mapUi.category=poi.groups[0];mapUi.query='';document.querySelector('#mapSearch').value='';
  mapUi.selectedId=poi.id;mapUi.size='peek';
  closeWalkingPanel();renderExplorer();
  ensureAmap().then(map=>{
    if(!map||appState.activeView!=='map')return;
    map.resize();syncAmapPlan(appState.currentPlan);
    mapUi.entranceMarker?.setMap(null);mapUi.entranceMarker=null;
    const point=entrance===true&&poi.entranceLocation?poi.entranceLocation:poi.location;
    map.setZoomAndCenter(17,point);
    if(entrance===true&&poi.entranceLocation)mapUi.entranceMarker=new mapRuntime.AMap.Marker({position:point,map,offset:new mapRuntime.AMap.Pixel(-16,-16),content:'<span class="walk-endpoint">入</span>',title:'高德收录入口位置',zIndex:220});
  });
}

function bindMapEvents() {
  document.addEventListener('click',event=>{
    const target=event.target.closest('button');if(!target)return;
    if(target.dataset.mapCategory){setMapCategory(target.dataset.mapCategory);return;}
    if(target.dataset.openFacility){setActiveView('map');mapUi.query='';document.querySelector('#mapSearch').value='';setMapCategory(target.dataset.openFacility);return;}
    if(target.dataset.mapSelect){selectMapPoi(target.dataset.mapSelect);return;}
    if(target.dataset.walkTo){openWalkingTo(target.dataset.walkTo);return;}
    if(target.dataset.setOrigin){
      mapUi.originId=target.dataset.setOrigin;closePoiDetail();setActiveView('map');closeWalkingPanel();renderExplorer();return;
    }
    if(target.id==='focusPoiEntrance'){focusPoiOnMap(true);return;}
    if(target.id==='resetMapFilter'){document.querySelector('#mapSearch').value='';mapUi.query='';setMapCategory('all');}
  });
  document.querySelector('#mapSearch').addEventListener('input',event=>{
    mapUi.query=event.target.value;
    closeWalkingPanel();mapUi.size='peek';renderExplorer();syncAmapPlan(appState.currentPlan);
    window.clearTimeout(mapUi.searchTimer);mapUi.searchTimer=window.setTimeout(fitMapPois,250);
  });
  document.querySelector('#clearMapSearch').addEventListener('click',()=>{
    document.querySelector('#mapSearch').value='';mapUi.query='';setMapCategory(mapUi.category);
  });
  document.querySelector('#togglePlaceSheet').addEventListener('click',()=>setSheetSize(mapUi.size==='expanded'?'peek':'expanded'));
  document.querySelector('#collapsePlaceSheet').addEventListener('click',()=>setSheetSize(mapUi.size==='closed'?'peek':'closed'));
  document.querySelector('#zoomIn').addEventListener('click',()=>mapRuntime.map?.zoomIn());
  document.querySelector('#zoomOut').addEventListener('click',()=>mapRuntime.map?.zoomOut());
  document.querySelector('#toggleMapPitch').addEventListener('click',event=>{
    if(!mapRuntime.map)return;
    const tilted=mapRuntime.map.getPitch()>0;
    mapRuntime.map.setPitch(tilted?0:40);event.currentTarget.classList.toggle('active',!tilted);
  });
  document.querySelector('#retryMap').addEventListener('click',()=>{mapRuntime.hasFailed=false;ensureAmap();});
  document.querySelector('#closeWalking').addEventListener('click',()=>{closeWalkingPanel();setSheetSize('peek');});
  for(const id of ['walkOrigin','walkDestination'])document.querySelector('#'+id).addEventListener('change',()=>{
    invalidateWalking();document.querySelector('#walkingSteps').replaceChildren();
    mapUi.originId=document.querySelector('#walkOrigin').value;
    document.querySelector('#walkingSummary').textContent='起终点已更改，请重新查询。';
    const destination=getPoi(document.querySelector('#walkDestination').value);
    document.querySelector('#walkCoordinateNote').textContent=/原型定位/.test(destination.coordinateNote)?destination.coordinateNote+'；路线终点为附近参考位置。':'';
    document.querySelector('#mapResultCount').textContent=`${shortPoiName(getPoi(mapUi.originId))} → ${shortPoiName(getPoi(document.querySelector('#walkDestination').value))}`;
    syncAmapPlan(appState.currentPlan);
  });
  let startY=null;
  const grip=document.querySelector('#togglePlaceSheet');
  grip.addEventListener('touchstart',event=>{startY=event.touches[0].clientY;},{passive:true});
  grip.addEventListener('touchend',event=>{
    const delta=startY===null?0:event.changedTouches[0].clientY-startY;startY=null;
    if(Math.abs(delta)>30){event.preventDefault();setSheetSize(delta<0?'expanded':'peek');}
  });
  window.addEventListener('pagehide',event=>{
    if(event.persisted)return;
    mapRuntime.resizeObserver?.disconnect();invalidateWalking();mapRuntime.map?.destroy();mapRuntime.map=null;
  });
}
