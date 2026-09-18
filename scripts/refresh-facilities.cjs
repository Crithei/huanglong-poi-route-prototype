// Run locally with AMAP_WEBSERVICE_KEY. Only normalized public POI fields are saved.
const fs = require('node:fs');
const path = require('node:path');
const categories = ['厕所', '索道', '商店', '便利店', '服务', '医疗', '游客中心', '观光车'];
const text = value => typeof value === 'string' ? value : '';
const location = value => {
  const parts = text(value).split(',').map(Number);
  return parts.length === 2 && parts.every(Number.isFinite) ? parts : null;
};
const distance = (a,b) => Math.hypot((a[0]-b[0])*93600,(a[1]-b[1])*111200);
const isGenericToilet = name => /^(公共厕所|黄龙国家重点风景名胜区-公共厕所)$/.test(name);
const legacyIds = { B034500XVY:'visitor-center', B034500XYB:'cable-car-service-center', B0LUDZ7BJB:'cable-car-upper-ticket', B0LUDUC05X:'medical-point' };

function normalize(raw) {
  const excluded = [], merged = [], kept = [];
  const records = raw.pois.map(p => ({ ...p, point: location(p.location) }))
    .filter(p => {
      const keep = p.point && p.adname === '松潘县' && p.point[0] >= 103.818 && p.point[0] <= 103.842 && p.point[1] >= 32.720 && p.point[1] <= 32.758 && !['B0345003WC','B034500XVS','B0H37ZDDY7'].includes(p.id);
      if (!keep) excluded.push({id:p.id,name:p.name,reason:'景区游览与交通服务范围外，或非独立设施'});
      return keep;
    }).sort((a,b) => Number(isGenericToilet(a.name))-Number(isGenericToilet(b.name)));
  for (const p of records) {
    const duplicate = isGenericToilet(p.name) && kept.find(q => /厕所/.test(q.name) && distance(p.point,q.point)<35);
    if (duplicate) {
      (duplicate.mergedSourceIds ||= []).push(p.id);
      merged.push({id:p.id,name:p.name,into:duplicate.id,reason:'35 米内的泛称厕所记录；合并为具名点位，待现场校验'});
      continue;
    }
    kept.push(p);
  }
  const pois = kept.map(p => {
    const group = /厕所/.test(p.name) ? 'toilet' : /索道|观光车/.test(p.name) ? 'transport' : /小卖部|商店|超市|便利店|餐饮/.test(p.name) ? 'shop' : /医疗|医务/.test(p.name) ? 'medical' : 'service';
    const groups = [group];
    if (/医疗/.test(p.name) && group !== 'medical') groups.push('medical');
    const labels = {toilet:'公共厕所',transport:'索道与接驳',shop:'商店与餐饮',medical:'医疗服务',service:'游客服务'};
    const descriptions = {
      toilet:'沿途如厕时可查找这一处设施，提前安排好停留。',
      transport:/索道.*下站/.test(p.name)?'上山前确认乘车与索道安排，在这里衔接下一段旅程。':/索道上站/.test(p.name)?'索道上站的交通节点，抵达后可继续衔接景区游览。':'查看索道与接驳设施的位置，安排这一段交通。',
      shop:'途中需要补给或短暂停留时，可以查看这处商店的位置。',
      medical:'需要医疗帮助时可查找这一处服务点，并向现场工作人员确认。',
      service:'入园前查看咨询、集合与游客服务的位置。'
    };
    return {
      id:legacyIds[p.id] || `amap-${p.id.toLowerCase()}`, amapId:p.id, name:p.name,
      aliases:group==='toilet'?['厕所','卫生间','洗手间','WC']:group==='shop'?['商店','小卖部','补给']:[],
      category:labels[group], groups, kind:'service', minutes:group==='toilet'?5:10, effort:0,
      location:p.point, entranceLocation:location(p.entr_location), exitLocation:location(p.exit_location),
      address:text(p.address), phone:text(p.tel), openingHours:text(p.biz_ext?.open_time)||text(p.biz_ext?.opentime2),
      description:descriptions[group], introduction:descriptions[group],
      highlights:[`位置：${text(p.address)||'高德资料未提供详细地址'}`,`开放时间：${text(p.biz_ext?.open_time)||text(p.biz_ext?.opentime2)||'未提供'}`],
      tip:'开放情况以现场为准；地图路线仅供步行参考。',
      coordinateNote:'高德地点坐标', tint:{toilet:'#d9e9ef',transport:'#c4d4ef',shop:'#f2dfb7',medical:'#efc0b9',service:'#d2d8d4'}[group],
      source:'高德地图 Web Service', queriedAt:raw.queriedAt, mergedSourceIds:p.mergedSourceIds||[],
      sourceType:p.type, sourceTypecode:p.typecode,
      verificationNote:/医务室/.test(p.name)?'高德在游客中心附近收录了两个医务室位置，是否为同一服务点尚待核实。':/医疗巡回/.test(p.name)?'名称包含医疗巡回点，服务时段与能力尚未核实。':''
    };
  });
  return {source:'高德地图 Web Service v3/place/around',queriedAt:raw.queriedAt,coordinateSystem:'GCJ-02',queryCenter:[103.831,32.74],queryRadiusMeters:4500,scope:'黄龙沟游览区及沟口、索道交通服务区；非官方边界',queries:raw.queries,pois,excluded,merged};
}
async function query() {
  const key = process.env.AMAP_WEBSERVICE_KEY;
  if (!key) throw new Error('AMAP_WEBSERVICE_KEY is not set');
  const rows=new Map(), queries=[];
  for (const keywords of categories) {
    for (let page=1;page<=4;page++) {
      const params=new URLSearchParams({key,appname:'amap-lbs-skill',location:'103.831,32.74',radius:'4500',keywords,page:String(page),offset:'25',extensions:'all',sortrule:'distance'});
      const r=await fetch('https://restapi.amap.com/v3/place/around?'+params,{signal:AbortSignal.timeout(15000)}).then(r=>r.json());
      if (r.status!=='1') throw new Error('AMap search did not succeed');
      queries.push({keywords,page,count:r.count,status:r.status});
      (r.pois||[]).forEach(p=>rows.set(p.id,p));
      await new Promise(resolve=>setTimeout(resolve,650));
      if (page*25>=Number(r.count)||!r.pois?.length) break;
    }
  }
  return {queriedAt:new Date().toISOString(),queries,pois:[...rows.values()]};
}
async function main() {
  const fileArg=process.argv.indexOf('--from');
  const raw=fileArg>=0?JSON.parse(fs.readFileSync(process.argv[fileArg+1],'utf8')):await query();
  const result=normalize(raw);
  const output=path.join(__dirname,'../data/facilities.js');
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.writeFileSync(output,'// Public POI snapshot. No API credentials. Refresh using scripts/refresh-facilities.cjs.\nwindow.HUANGLONG_FACILITIES = '+JSON.stringify(result,null,2)+';\n');
  console.log(JSON.stringify({facilities:result.pois.length,groups:result.pois.reduce((acc,p)=>{p.groups.forEach(g=>acc[g]=(acc[g]||0)+1);return acc;},{}),merged:result.merged.length,excluded:result.excluded.length,queriedAt:result.queriedAt}));
}
if(require.main===module)main().catch(()=>{console.error('Facility refresh failed; previous snapshot preserved. Check environment, network and quota.');process.exitCode=1;});
module.exports={normalize};
