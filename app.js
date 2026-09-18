const POIS = [
  {
    id: "visitor-center",
    name: "黄龙游客中心",
    aliases: ["游客中心", "黄龙游客中心", "景区游客中心"],
    category: "服务设施",
    kind: "service",
    minutes: 12,
    effort: 0,
    rank: 2,
    routeOrder: 0,
    routeRole: "entry",
    description: "入园前可在这里确认票务、咨询和当天的游览安排。",
    introduction: "把它当作游线的起点，而不是一个需要赶时间的景点。正式版可在这里接入票务、班车和景区公告。",
    highlights: ["作为设施步行规划的固定起点", "适合在入园前确认返程与天气信息"],
    tip: "建议预留 10 到 15 分钟完成咨询、补水和集合；服务状态在当前原型中不代表实时信息。",
    location: [103.819546, 32.749693],
    coordinateNote: "高德 POI 坐标",
    tint: "#d2d8d4",
  },
  {
    id: "ticket-office",
    name: "黄龙售票处",
    aliases: ["售票处", "黄龙售票处", "景区售票处"],
    category: "服务设施",
    kind: "service",
    minutes: 5,
    effort: 0,
    rank: 1,
    routeOrder: 0.1,
    routeRole: "entry",
    description: "靠近游客中心的票务节点，适合在出发前核对入园事项。",
    introduction: "原型将票务节点单独放入目录，便于后续接入预约、检票与排队状态。",
    highlights: ["可作为入园事项的检查点", "预留票务与排队状态的扩展接口"],
    tip: "当前只作为静态 POI 展示，票务规则应以官方渠道当天信息为准。",
    location: [103.820121, 32.749669],
    coordinateNote: "高德 POI 坐标",
    tint: "#d2d8d4",
  },
  {
    id: "cable-car-service-center",
    name: "索道服务中心",
    aliases: ["索道服务中心", "黄龙索道", "索道"],
    category: "索道服务",
    kind: "service",
    minutes: 12,
    effort: 1,
    rank: 3,
    routeOrder: 0.2,
    routeRole: "service",
    description: "索道相关服务节点，适合在偏好中考虑索道上行时查看。",
    introduction: "它用于表达交通设施如何参与规划。正式版应接入班次、开放状态、排队时长和购票规则。",
    highlights: ["可作为高德设施步行规划目的地", "预留索道状态和排队数据接口"],
    tip: "是否可用、班次与现场组织须由景区服务确认，原型不会将其视为实时状态。",
    location: [103.83592, 32.75572],
    coordinateNote: "高德 POI 坐标",
    tint: "#c4d4ef",
  },
  {
    id: "cable-car-upper-ticket",
    name: "索道上站售票点",
    aliases: ["索道上站", "索道上站售票点"],
    category: "索道服务",
    kind: "service",
    minutes: 6,
    effort: 1,
    rank: 2,
    routeOrder: 0.3,
    routeRole: "service",
    description: "索道上站附近的票务定位点，便于后续处理索道换乘场景。",
    introduction: "原型以此表示索道上站的服务节点；它不表示实时售票或可达性。",
    highlights: ["辅助表达索道换乘的起止节点", "可扩展为班次和客流提示"],
    tip: "当前坐标仅用于原型地图定位，现场服务以景区告示为准。",
    location: [103.839632, 32.747282],
    coordinateNote: "高德 POI 坐标",
    tint: "#c4d4ef",
  },
  {
    id: "sightseeing-bus-ticket",
    name: "观光车售票点",
    aliases: ["观光车", "观光车售票点", "景区观光车"],
    category: "观光车服务",
    kind: "service",
    minutes: 6,
    effort: 0,
    rank: 2,
    routeOrder: 0.4,
    routeRole: "service",
    description: "观光车服务定位点，供后续衔接接驳与排队信息。",
    introduction: "将交通服务作为 POI 目录的一部分，方便游客按自身偏好把它纳入行程。",
    highlights: ["面向接驳安排的服务 POI", "可以扩展车辆位置与等候时间"],
    tip: "原型只展示位置和产品意图，不提供观光车运营承诺。",
    location: [103.839301, 32.747387],
    coordinateNote: "高德 POI 坐标",
    tint: "#c4d4ef",
  },
  {
    id: "welcome-pond",
    name: "迎宾池",
    aliases: ["迎宾池", "迎宾彩池"],
    category: "彩池",
    kind: "scenic",
    minutes: 15,
    effort: 1,
    rank: 4,
    routeOrder: 1,
    routeRole: "spine",
    description: "从沟口进入彩池景观的第一处停留，适合建立对水色和钙华的第一印象。",
    introduction: "迎宾池适合作为低负担的开场停留。它在游线中靠前，因此也能用来判断当天节奏是否合适。",
    highlights: ["游线前段的彩池景观", "适合作为第一处拍照与调整节奏的停留"],
    tip: "若希望轻松游览，可短暂停留后继续向上，把更长的时间留给后段核心彩池。",
    location: [103.825555, 32.749031],
    coordinateNote: "高德 POI 坐标",
    tint: "#d5ef87",
  },
  {
    id: "liantai-fall",
    name: "莲台飞瀑",
    aliases: ["莲台飞瀑", "飞瀑", "莲台瀑布"],
    category: "瀑布钙华",
    kind: "scenic",
    minutes: 18,
    effort: 1,
    rank: 6,
    routeOrder: 2,
    routeRole: "spine",
    description: "水流沿钙华台地形成层次感强的瀑布段，适合短暂停留观察。",
    introduction: "这里把流动的水和钙华形态放在同一视野中，适合在路线前半段安排一段明确的驻足。",
    highlights: ["水流与钙华台地共同构成的景观段", "停留成本较低，适合平衡节奏"],
    tip: "雨后、枯水期和现场通行组织都会影响观感与停留长度，原型中的建议时间仅用于规划演示。",
    location: [103.828038, 32.747202],
    coordinateNote: "高德 POI 坐标",
    tint: "#9fd9d4",
  },
  {
    id: "wash-body-viewpoint",
    name: "洗身洞观景台",
    aliases: ["洗身洞", "洗身洞观景台"],
    category: "观景台",
    kind: "scenic",
    minutes: 15,
    effort: 2,
    rank: 5,
    routeOrder: 3,
    routeRole: "spine",
    description: "游线中的观察节点，适合补充体力感受并决定是否继续加深后段游览。",
    introduction: "洗身洞观景台被放在中段检查点的位置：游客可在这里确认体力、时间和拍照需求，再继续向核心景观前进。",
    highlights: ["适合观察游线中段环境", "可作为现场调整路线的自然节点"],
    tip: "若同行成员体力差异较大，可在这里进行一次明确的时间核对。",
    location: [103.828682, 32.746221],
    coordinateNote: "高德 POI 坐标",
    tint: "#b6d9bf",
  },
  {
    id: "medical-point",
    name: "洗身洞医疗点",
    aliases: ["医疗点", "洗身洞医疗点", "医务室"],
    category: "医疗服务",
    kind: "service",
    minutes: 8,
    effort: 0,
    rank: 3,
    routeOrder: 3.1,
    routeRole: "service",
    description: "靠近洗身洞的服务点，作为行程中的安全设施定位。",
    introduction: "医疗点不需要被当作游览目标，但应在随行模式中可见。它为后续接入服务时间和应急流程保留了位置。",
    highlights: ["游线中段附近的安全设施定位", "可作为高德设施步行规划的目的地"],
    tip: "原型不显示服务能力或营业状态；出现身体不适时应优先遵循景区现场指引。",
    location: [103.82818, 32.745855],
    coordinateNote: "高德 POI 坐标",
    tint: "#efc0b9",
  },
  {
    id: "jinsha-pudi",
    name: "金沙铺地",
    aliases: ["金沙铺地", "金沙铺地池"],
    category: "钙华景观",
    kind: "scenic",
    minutes: 20,
    effort: 1,
    rank: 7,
    routeOrder: 4,
    routeRole: "spine",
    description: "浅色钙华台地与水流交错的开阔段，适合用更从容的节奏观察。",
    introduction: "金沙铺地用舒展的台地形态建立了中段的开阔感。对想保留一处从容停留的游客，它是很好的选择。",
    highlights: ["开阔的钙华台地和水流景观", "在核心彩池前提供一段节奏缓冲"],
    tip: "原型定位使用临近休息亭坐标，适合用于路线表达，不应用作精确集合或安全导航。",
    location: [103.829811, 32.745359],
    coordinateNote: "原型定位点：金沙铺地休息亭附近",
    tint: "#f4d778",
  },
  {
    id: "mirror-pond",
    name: "明镜倒影池",
    aliases: ["明镜倒影池", "倒影池", "明镜池"],
    category: "彩池",
    kind: "scenic",
    minutes: 18,
    effort: 1,
    rank: 6,
    routeOrder: 5,
    routeRole: "spine",
    description: "适合慢下来观察水面与周边景观关系的彩池段。",
    introduction: "明镜倒影池作为中后段的静观节点，提供了和大尺度钙华台地不同的观看方式。",
    highlights: ["更适合观察水面层次的停留点", "可作为进入核心彩池前的中途节点"],
    tip: "原型定位使用临近休息亭坐标；名称与点位在正式版应由景区目录继续校验。",
    location: [103.832644, 32.743202],
    coordinateNote: "原型定位点：明镜倒影池休息亭附近",
    tint: "#9bded7",
  },
  {
    id: "zhengyan-chi",
    name: "争艳彩池",
    aliases: ["争艳池", "争艳彩池", "争艳彩池群"],
    category: "彩池",
    kind: "scenic",
    minutes: 25,
    effort: 2,
    rank: 9,
    routeOrder: 6,
    routeRole: "spine",
    description: "层叠彩池密集，是希望感受黄龙水色层次时的核心停留。",
    introduction: "争艳彩池优先级较高，因为它以密集的彩池层次提供了明确的游览价值。时间紧张时，规划器会倾向保留它。",
    highlights: ["彩池层次集中，适合完整观看", "作为时间取舍中的高优先级节点"],
    tip: "建议留出拍照与缓步观察时间；高海拔环境下请根据自己的体感调整节奏。",
    location: [103.833738, 32.738781],
    coordinateNote: "高德 POI 坐标",
    tint: "#9ee1d8",
  },
  {
    id: "huanglong-middle-temple",
    name: "黄龙中寺",
    aliases: ["黄龙中寺", "中寺"],
    category: "人文自然",
    kind: "scenic",
    minutes: 20,
    effort: 2,
    rank: 5,
    routeOrder: 7,
    routeRole: "spine",
    description: "游线中后段的人文节点，为自然景观之间增加不同的停留理由。",
    introduction: "中寺让游线从单一景观浏览转为自然与人文交替的体验。适合偏好慢行与多样内容的游客。",
    highlights: ["自然景观中的人文停留节点", "适合深度节奏的路线安排"],
    tip: "尊重现场秩序与环境；开放情况和可进入区域应以现场管理要求为准。",
    location: [103.834268, 32.730684],
    coordinateNote: "高德 POI 坐标",
    tint: "#cfbf91",
  },
  {
    id: "huanglong-ancient-temple",
    name: "黄龙古寺",
    aliases: ["黄龙古寺", "古寺", "黄龙寺"],
    category: "人文自然",
    kind: "scenic",
    minutes: 30,
    effort: 2,
    rank: 7,
    routeOrder: 8,
    routeRole: "spine",
    description: "位于游线高段的人文停留点，适合把它放入深度游览的节奏中。",
    introduction: "古寺适合愿意为人文内容留出时间的游客。它与五彩池相邻，但在时间有限时可由规划器解释是否留白。",
    highlights: ["高段游线中的人文目标", "与核心彩池可形成不同风格的停留组合"],
    tip: "若总可用时间较短，先确认五彩池等核心目标，再决定是否安排完整停留。",
    location: [103.835029, 32.724665],
    coordinateNote: "高德 POI 坐标",
    tint: "#cfbf91",
  },
  {
    id: "five-color-pond",
    name: "五彩池",
    aliases: ["五彩池", "黄龙五彩池", "五彩池群"],
    category: "彩池",
    kind: "scenic",
    minutes: 45,
    effort: 3,
    rank: 10,
    routeOrder: 9,
    routeRole: "spine",
    description: "高优先级核心 POI，建议留出完整停留时间感受彩池层次。",
    introduction: "五彩池是原型中权重最高的核心景观。规划器会优先保留它，并把其他选择的取舍说清楚。",
    highlights: ["黄龙游览愿望清单中的核心节点", "适合留出较完整的观察和拍照时间"],
    tip: "高段行程需同时考虑返程缓冲、天气和体力；原型停留时长不是官方游览建议。",
    location: [103.834717, 32.722579],
    coordinateNote: "原型定位点：五彩池休息亭附近",
    tint: "#64c8ce",
  },
  {
    id: "five-color-pond-rest-stop",
    name: "五彩池休息亭",
    aliases: ["五彩池休息亭", "休息亭"],
    category: "休息设施",
    kind: "service",
    minutes: 10,
    effort: 0,
    rank: 2,
    routeOrder: 9.1,
    routeRole: "service",
    description: "核心景观附近的服务定位点，为后续补水、休息与设施状态提示预留接口。",
    introduction: "服务设施被纳入目录后，随行模式可以围绕游客实际需要补充休息与安全信息，而不是只展示景点。",
    highlights: ["核心景观附近的休息定位", "可扩展为休息、补给与拥挤提示"],
    tip: "当前仅作为位置示意，设施可用性和服务状态需要景区数据源支持。",
    location: [103.834717, 32.722579],
    coordinateNote: "高德 POI 坐标",
    tint: "#d8d8c2",
  },
];

const appState = {
  activeView: "map",
  selectedPoiIds: new Set(["welcome-pond", "zhengyan-chi", "five-color-pond"]),
  completedPoiIds: new Set(),
  candidates: [],
  activePoiId: null,
  preferences: {
    hours: 6,
    pace: "平衡",
    cableCar: false,
    shortageMinutes: 0,
  },
  followMessage: "",
  currentPlan: null,
};

const mapRuntime = {
  AMap: null,
  map: null,
  initPromise: null,
  markers: [],
  scenicSpine: null,
  walking: null,
  latestPlan: null,
  hasFailed: false,
};

const sampleText = "黄龙这次想去五彩池、争艳彩池和莲台飞瀑；如果时间够，也想在黄龙古寺停留。";

function getPoi(id) {
  return (typeof getMapPois === "function" ? getMapPois() : POIS).find((poi) => poi.id === id);
}

function selectedPois() {
  return POIS.filter((poi) => appState.selectedPoiIds.has(poi.id));
}

function effortLabel(effort) {
  return effort ? `${"●".repeat(effort)}${"○".repeat(3 - effort)} 步行负担` : "服务节点";
}

function normalizeText(value) {
  return value
    .toLocaleLowerCase("zh-CN")
    .replace(/[\s、，。；：！？“”‘’（）()【】\[\]—\-]/g, "");
}

function extractPoiCandidates(text) {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  return POIS.map((poi) => {
    const matchedText = [poi.name, ...poi.aliases].find((alias) => normalized.includes(normalizeText(alias)));
    return matchedText ? { poi, matchedText, confidence: 1 } : null;
  }).filter(Boolean);
}

function planBudget(preferences) {
  const base = preferences.hours * 60 - 25 - preferences.shortageMinutes;
  const paceAllowance = { "轻松": -18, "平衡": 0, "深度": 16 }[preferences.pace];
  return Math.max(100, base + paceAllowance);
}

function poiVisitMinutes(poi, preferences) {
  if (poi.kind === "service") return poi.minutes;
  const paceFactor = { "轻松": 1.12, "平衡": 1, "深度": 0.94 }[preferences.pace];
  return Math.round(poi.minutes * paceFactor + poi.effort * 4);
}

function routeMinutes(pois, preferences) {
  if (!pois.length) return 0;
  const hasScenicPoi = pois.some((poi) => poi.kind === "scenic");
  const transit = hasScenicPoi ? (preferences.cableCar ? 93 : 128) : 18;
  const betweenStops = Math.max(0, pois.length - 1) * 9;
  return transit + betweenStops + pois.reduce((total, poi) => total + poiVisitMinutes(poi, preferences), 0);
}

function routeKilometers(pois, preferences) {
  if (!pois.length) return 0;
  const hasScenicPoi = pois.some((poi) => poi.kind === "scenic");
  const baseline = hasScenicPoi ? (preferences.cableCar ? 3.1 : 5.2) : 0.4;
  return Number((baseline + pois.reduce((total, poi) => total + (poi.kind === "scenic" ? 0.42 + poi.effort * 0.09 : 0.12), 0)).toFixed(1));
}

function adjustedRank(poi, preferences) {
  if (preferences.pace === "轻松") return poi.rank - poi.effort * 1.5;
  if (preferences.pace === "深度") return poi.rank + poi.effort * 0.35;
  return poi.rank;
}

function buildPlan(selectedIds, preferences, completedIds) {
  const allSelected = POIS.filter((poi) => selectedIds.has(poi.id)).sort((a, b) => a.routeOrder - b.routeOrder);
  const budget = planBudget(preferences);
  const included = [...allSelected];
  const deferred = [];

  while (included.length && routeMinutes(included, preferences) > budget) {
    const removable = included
      .filter((poi) => !completedIds.has(poi.id))
      .sort((a, b) => adjustedRank(a, preferences) - adjustedRank(b, preferences))[0];

    if (!removable) break;
    included.splice(included.findIndex((poi) => poi.id === removable.id), 1);
    deferred.push(removable);
  }

  const orderedDeferred = deferred.sort((a, b) => a.routeOrder - b.routeOrder);
  const minutes = routeMinutes(included, preferences);
  const remainingBuffer = Math.max(0, budget - minutes);
  let reason = "先从已选 POI 开始，预留返程缓冲后仍可完整安排。";

  if (orderedDeferred.length) {
    const names = orderedDeferred.map((poi) => poi.name).join("、");
    reason = `为保留返程缓冲，本次先把 ${names} 留给下一次；它们仍在愿望清单中。`;
  } else if (preferences.shortageMinutes) {
    reason = "已按更短的可用时间重排后半程，当前保留的节点都能放进新的时间窗口。";
  } else if (preferences.cableCar) {
    reason = "已将索道上行作为原型估算条件，实际班次和开放状态需接景区服务确认。";
  }

  return {
    included,
    deferred: orderedDeferred,
    budget,
    minutes,
    kilometers: routeKilometers(included, preferences),
    buffer: remainingBuffer,
    reason,
  };
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function renderDiscover() {
  const poiGrid = document.querySelector("#poiGrid");
  const count = appState.selectedPoiIds.size;
  document.querySelector("#selectionCount").textContent = `${count} 已加入`;

  poiGrid.innerHTML = POIS.filter((poi) => poi.kind === "scenic").map((poi) => {
    const isSelected = appState.selectedPoiIds.has(poi.id);
    const typeLabel = poi.kind === "service" ? "设施" : "景观";
    return `
      <article class="poi-card ${isSelected ? "selected" : ""}" data-poi-card-id="${poi.id}" tabindex="0" style="--poi-tint: ${poi.tint}">
        <div class="poi-card-content">
          <div class="poi-meta">
            <span class="poi-category">${typeLabel} / ${poi.category}</span>
            <span class="effort">${effortLabel(poi.effort)}</span>
          </div>
          <h3>${poi.name}</h3>
          <p>${poi.description}</p>
          <div class="poi-foot">
            <span class="poi-minutes">建议停留 ${poi.minutes} 分钟</span>
            <div class="poi-card-actions">
              <button class="poi-detail-trigger" type="button" data-poi-detail-id="${poi.id}" aria-label="查看${poi.name}介绍">
                查看介绍 <i data-lucide="arrow-up-right" aria-hidden="true"></i>
              </button>
              <button class="poi-select ${isSelected ? "selected" : ""}" type="button" data-poi-id="${poi.id}" aria-pressed="${isSelected}">
                <i data-lucide="${isSelected ? "circle-check-big" : "plus-circle"}" aria-hidden="true"></i>
                ${isSelected ? "已加入" : "加入行程"}
              </button>
            </div>
          </div>
        </div>
      </article>`;
  }).join("");
}

function renderCandidates() {
  const candidateArea = document.querySelector("#candidateArea");
  if (!appState.candidates.length) return;

  candidateArea.innerHTML = `
    <div class="candidate-heading"><i data-lucide="list-checks" aria-hidden="true"></i>识别到 ${appState.candidates.length} 个黄龙 POI</div>
    <div class="candidate-list">
      ${appState.candidates.map(({ poi, matchedText }) => {
        const added = appState.selectedPoiIds.has(poi.id);
        return `
          <div class="candidate-item">
            <button class="candidate-name-button" type="button" data-poi-detail-id="${poi.id}">
              <span class="candidate-name">${poi.name}</span>
              <span class="matched-text">命中：${matchedText}</span>
            </button>
            <button class="candidate-action ${added ? "added" : ""}" type="button" data-candidate-id="${poi.id}">
              ${added ? "已在行程" : "加入"}
            </button>
          </div>`;
      }).join("")}
    </div>`;
}

function renderRoute() {
  const plan = buildPlan(appState.selectedPoiIds, appState.preferences, appState.completedPoiIds);
  appState.currentPlan = plan;
  const hasRoute = plan.included.length > 0;
  const allSelected = selectedPois();
  const stateLabel = plan.deferred.length
    ? `${allSelected.length} 个已选 POI，${plan.deferred.length} 个留白`
    : `基于 ${allSelected.length} 个已选 POI`;

  document.querySelector("#routeStatusLabel").textContent = stateLabel;
  document.querySelector("#routeHeadline").textContent = hasRoute
    ? `${plan.included.length} 个节点，留出 ${plan.buffer} 分钟缓冲。`
    : "先从黄龙 POI 中挑选想去的地方。";
  document.querySelector("#routeReason").textContent = hasRoute ? plan.reason : "路线会根据可用时间、体力节奏和已选 POI 说明取舍。";
  document.querySelector("#includedCount").textContent = `${plan.included.length} 个节点`;
  document.querySelector("#startFollow").disabled = !hasRoute;

  document.querySelector("#routeMetrics").innerHTML = hasRoute
    ? [
        ["约 " + plan.minutes, "分钟"],
        [plan.kilometers + " km", "原型估算"],
        ["余 " + plan.buffer, "分钟缓冲"],
      ].map(([value, label]) => `<div class="metric"><span class="metric-value">${value}</span><span class="metric-label">${label}</span></div>`).join("")
    : "";

  const timeline = document.querySelector("#routeTimeline");
  timeline.innerHTML = hasRoute
    ? plan.included.map((poi, index) => `
        <li class="timeline-item">
          <span class="timeline-index">${index + 1}</span>
          <div><button class="timeline-name" type="button" data-poi-detail-id="${poi.id}">${poi.name}</button><span class="timeline-note">${poi.category} · ${effortLabel(poi.effort)}</span></div>
          <span class="timeline-minutes">${poiVisitMinutes(poi, appState.preferences)} 分钟</span>
        </li>`).join("")
    : '<li class="empty-route">从“发现”页加入 POI，路线骨架会立刻生成。</li>';

  const deferred = document.querySelector("#deferredList");
  deferred.innerHTML = plan.deferred.length
    ? plan.deferred.map((poi) => `
      <button class="deferred-item" type="button" data-poi-detail-id="${poi.id}"><strong>${poi.name}</strong><span>未纳入原因：当前时间预算优先保留更高优先级的已选 POI。</span></button>`).join("")
    : '<p class="empty-deferred">当前选择可以完整放进这段时间。</p>';

  renderMap(plan);
  syncPreferenceControls();
}

function syncPreferenceControls() {
  document.querySelectorAll("[data-hours]").forEach((button) => {
    button.classList.toggle("selected", Number(button.dataset.hours) === appState.preferences.hours);
  });
  document.querySelectorAll("[data-pace]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.pace === appState.preferences.pace);
  });
  document.querySelector("#cableCar").checked = appState.preferences.cableCar;
}

function renderFollow() {
  const plan = appState.currentPlan || buildPlan(appState.selectedPoiIds, appState.preferences, appState.completedPoiIds);
  const route = plan.included;
  const completed = route.filter((poi) => appState.completedPoiIds.has(poi.id));
  const pending = route.filter((poi) => !appState.completedPoiIds.has(poi.id));
  const current = pending[0];
  const done = completed.length;
  const percent = route.length ? Math.round((done / route.length) * 100) : 0;

  document.querySelector("#followProgressText").textContent = route.length ? `第 ${Math.min(done + 1, route.length)} 站 / 共 ${route.length} 站` : "准备开始";
  const deferredNames = plan.deferred.map((poi) => poi.name).join("、");
  document.querySelector("#followTitle").textContent = current
    ? `下一站：${current.name}`
    : plan.deferred.length
      ? "已将后半程留给下次。"
      : route.length ? "这一段已走完。" : "还没有可跟随的游线。";
  document.querySelector("#followDescription").textContent = current
    ? appState.followMessage || `${current.description} 原型根据当前路线显示下一站，不使用实时定位。`
    : plan.deferred.length
      ? `${deferredNames} 已从本次计划中移出；可回到游线页重新调整时间和偏好。`
      : route.length ? "已完成当前计划里的所有节点，可以回到游线页继续调整。" : "返回游线页选择 POI 后开始。";
  document.querySelector("#followMeter").style.width = `${percent}%`;
  document.querySelector("#followMeterCopy").textContent = `${done} / ${route.length} 已完成`;
  document.querySelector("#completeStop").disabled = !current;
  document.querySelector("#shortenRoute").disabled = pending.length === 0;

  document.querySelector("#followRouteStrip").innerHTML = route.length
    ? route.map((poi) => {
        const isComplete = appState.completedPoiIds.has(poi.id);
        const isCurrent = current?.id === poi.id;
        return `<button class="follow-stop ${isComplete ? "complete" : ""} ${isCurrent ? "current" : ""}" type="button" data-poi-detail-id="${poi.id}"><i data-lucide="${isComplete ? "check" : isCurrent ? "map-pin" : "circle"}" aria-hidden="true"></i>${poi.name}</button>`;
      }).join("")
    : '<span class="follow-stop">未开始</span>';

  const stateView = {
    selectedPoiIds: [...appState.selectedPoiIds],
    preferences: appState.preferences,
    completedPoiIds: [...appState.completedPoiIds],
    deferredPoiIds: plan.deferred.map((poi) => poi.id),
  };
  document.querySelector("#stateOutput").textContent = JSON.stringify(stateView, null, 2);
}

function renderAll() {
  renderDiscover();
  renderCandidates();
  renderRoute();
  renderFollow();
  if (appState.activePoiId && document.querySelector("#poiDialog")?.open) renderPoiDialog(appState.activePoiId);
  refreshIcons();
}

function setActiveView(viewName) {
  appState.activeView = viewName;
  document.body.dataset.activeView = viewName;
  document.querySelectorAll("[data-view-panel]").forEach((panel) => {
    const active = panel.dataset.viewPanel === viewName;
    panel.hidden = !active;
    panel.classList.toggle("active", active);
  });
  document.querySelectorAll("[data-view]").forEach((button) => {
    const active = button.dataset.view === viewName;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  if (viewName === "map") {
    renderMap(appState.currentPlan || buildPlan(appState.selectedPoiIds, appState.preferences, appState.completedPoiIds));
    window.setTimeout(() => { mapRuntime.map?.resize(); syncAmapPlan(appState.currentPlan); }, 60);
  }
  document.querySelector("main").scrollTo({ top: 0 });
}

function clearShortageMode() {
  appState.preferences.shortageMinutes = 0;
  appState.followMessage = "";
}

function togglePoi(id) {
  if (appState.selectedPoiIds.has(id)) {
    appState.selectedPoiIds.delete(id);
    appState.completedPoiIds.delete(id);
  } else {
    appState.selectedPoiIds.add(id);
  }
  clearShortageMode();
  renderAll();
}

function addCandidate(id) {
  appState.selectedPoiIds.add(id);
  clearShortageMode();
  renderAll();
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setActiveView(button.dataset.view));
  });

  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    const actionMap = {
      "go-discover": "discover",
      "go-import": "import",
      "go-route": "route",
      "go-map": "map",
    };
    if (actionMap[action]) {
      setActiveView(actionMap[action]);
      return;
    }

    const detailButton = event.target.closest("[data-poi-detail-id]");
    if (detailButton) {
      openPoiDetail(detailButton.dataset.poiDetailId);
      return;
    }

    const poiButton = event.target.closest("[data-poi-id]");
    if (poiButton) {
      togglePoi(poiButton.dataset.poiId);
      return;
    }

    const candidateButton = event.target.closest("[data-candidate-id]");
    if (candidateButton) {
      addCandidate(candidateButton.dataset.candidateId);
      return;
    }

    const poiCard = event.target.closest("[data-poi-card-id]");
    if (poiCard && !event.target.closest("button, input, label, a")) openPoiDetail(poiCard.dataset.poiCardId);
  });

  document.addEventListener("keydown", (event) => {
    const poiCard = event.target.closest?.("[data-poi-card-id]");
    if (poiCard && event.target === poiCard && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openPoiDetail(poiCard.dataset.poiCardId);
    }
  });

  document.querySelector("#fillSample").addEventListener("click", () => {
    document.querySelector("#sourceText").value = sampleText;
    document.querySelector("#sourceText").focus();
  });

  document.querySelector("#extractText").addEventListener("click", () => {
    const text = document.querySelector("#sourceText").value;
    appState.candidates = extractPoiCandidates(text);
    const candidateArea = document.querySelector("#candidateArea");
    if (!appState.candidates.length) {
      candidateArea.innerHTML = '<p class="empty-state">没有发现目录中的黄龙 POI。可以尝试输入“五彩池、争艳彩池、莲台飞瀑”等名称。</p>';
    } else {
      renderCandidates();
      refreshIcons();
    }
  });

  document.querySelector("#imageInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    document.querySelector("#imageStatus").textContent = file
      ? `已选择“${file.name}”；当前原型先聚焦地图与 POI，OCR 会在后续接入同一匹配器。`
      : "未选择图片";
  });

  document.querySelector("#readUrl").addEventListener("click", () => {
    const url = document.querySelector("#sourceUrl").value.trim();
    document.querySelector("#urlStatus").textContent = url
      ? "链接已记录；当前原型暂不读取外部页面，后续由服务端按平台规则处理公开内容。"
      : "请先输入公开攻略链接。";
  });

  document.querySelectorAll("[data-hours]").forEach((button) => {
    button.addEventListener("click", () => {
      appState.preferences.hours = Number(button.dataset.hours);
      clearShortageMode();
      renderAll();
    });
  });

  document.querySelectorAll("[data-pace]").forEach((button) => {
    button.addEventListener("click", () => {
      appState.preferences.pace = button.dataset.pace;
      clearShortageMode();
      renderAll();
    });
  });

  document.querySelector("#cableCar").addEventListener("change", (event) => {
    appState.preferences.cableCar = event.target.checked;
    clearShortageMode();
    renderAll();
  });

  document.querySelector("#startFollow").addEventListener("click", () => {
    appState.followMessage = "游览开始后，这里会基于已确认 POI 显示下一站与可调整的后半程。";
    setActiveView("follow");
    renderFollow();
    refreshIcons();
  });

  document.querySelector("#completeStop").addEventListener("click", () => {
    const current = appState.currentPlan?.included.find((poi) => !appState.completedPoiIds.has(poi.id));
    if (!current) return;
    appState.completedPoiIds.add(current.id);
    appState.followMessage = `已记录抵达 ${current.name}。下一站会根据剩余路线继续显示。`;
    renderAll();
  });

  document.querySelector("#shortenRoute").addEventListener("click", () => {
    appState.preferences.shortageMinutes += 110;
    appState.followMessage = "已模拟减少 110 分钟可用时间，优先保留后半程中价值更高的 POI。";
    renderAll();
  });

  document.querySelector("#stateToggle").addEventListener("click", () => {
    const button = document.querySelector("#stateToggle");
    const output = document.querySelector("#stateOutput");
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    output.hidden = expanded;
  });

  bindMapEvents();
  document.querySelector("#planFacilityWalk").addEventListener("click", planFacilityWalking);
  document.querySelector("#resetMapView").addEventListener("click", resetMapView);
  document.querySelector("#focusPoiOnMap").addEventListener("click", focusPoiOnMap);
  document.querySelector("#poiDialogClose").addEventListener("click", closePoiDetail);
  document.querySelector("#poiDialog").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closePoiDetail();
  });
}

bindEvents();
renderAll();
