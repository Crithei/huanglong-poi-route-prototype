// Planning reference layer. Coordinates are illustrative unless marked as verified.
// Do not use this layer as a live opening, capacity, or navigation source.
window.HUANGLONG_PLANNING = {
  source: {
    title: "《黄龙风景名胜区总体规划（2021—2035）》文本与说明书",
    version: "2021—2035",
    checkedAt: "2026-09-29",
    status: "规划资料，仅作数字导览与方案表达"
  },
  summary: {
    scenicResourceCount: 103,
    naturalResourceCount: 85,
    culturalResourceCount: 18,
    visitorCenters: 4,
    servicePoints: 14,
    emergencyShelters: 20
  },
  areas: [
    { id: "huanglong-gou", name: "黄龙沟景区", shortName: "黄龙沟", theme: "钙华彩池与森林游览", capacity: 20200, limit: 25250, center: [103.831, 32.74], color: "#2e8d78", status: "重点游览区" },
    { id: "muni-gou", name: "牟尼沟景区", shortName: "牟尼沟", theme: "高原湖泊与钙华瀑布", capacity: 13880, limit: 17350, center: [103.53, 32.62], color: "#568eac", status: "重点游览区" },
    { id: "qizang-gou", name: "七藏沟景区", shortName: "七藏沟", theme: "高寒喀斯特与彩林湿地", capacity: 11600, limit: 14500, center: [103.72, 32.87], color: "#668b5b", status: "生态徒步区" },
    { id: "xuebaoding", name: "雪宝鼎景区", shortName: "雪宝鼎", theme: "雪山冰川与登山探索", capacity: 2680, limit: 3350, center: [103.94, 32.93], color: "#7d9ab4", status: "高山探索区" },
    { id: "changzheng", name: "长征总碑景区", shortName: "长征总碑", theme: "红色文化与纪念景观", capacity: 4790, limit: 5950, center: [103.79, 32.76], color: "#a66a53", status: "文化游览区" },
    { id: "xueshan-liangzi", name: "雪山梁子景区", shortName: "雪山梁子", theme: "云海日出与高山观景", capacity: 2800, limit: 3500, center: [103.88, 32.82], color: "#9a8462", status: "观景探索区" },
    { id: "minjiang-source", name: "岷江源景区", shortName: "岷江源", theme: "湿地保育与江源文化", capacity: 4700, limit: 5900, center: [103.66, 32.96], color: "#4d8d91", status: "湿地保育区" }
  ],
  zones: [
    { id: "strict", name: "核心景源保护区", type: "保护分区", description: "资源价值最高的区域，以保护、监测和低干扰游览为主。", center: [103.835, 32.724], radius: 1050, color: "#d58b75", opacity: 0.13, status: "规划示意" },
    { id: "recreation", name: "风景游览区", type: "功能分区", description: "景源集中、适合组织步行游览与科普解说的区域。", center: [103.831, 32.74], radius: 2300, color: "#4c9a83", opacity: 0.1, status: "规划示意" },
    { id: "service", name: "旅游服务区", type: "功能分区", description: "游客中心、换乘和服务设施集中布局的区域。", center: [103.819, 32.749], radius: 850, color: "#6f91bf", opacity: 0.12, status: "规划示意" }
  ],
  facilities: [
    { id: "planning-center-hlg", name: "黄龙沟立体游客中心", type: "游客中心", areaId: "huanglong-gou", location: [103.8195, 32.7497], status: "规划提升", note: "规划提出结合索道下站建立立体游客中心。" },
    { id: "planning-center-muni", name: "牟尼沟复合型游客中心", type: "游客中心", areaId: "muni-gou", location: [103.53, 32.62], status: "规划提升", note: "规划提出结合现状游客中心提升改造。" },
    { id: "planning-center-changzheng", name: "长征总碑游客中心", type: "游客中心", areaId: "changzheng", location: [103.79, 32.76], status: "规划提升", note: "规划提出改造提升现状游客中心。" },
    { id: "planning-center-qizang", name: "七藏沟游客中心", type: "游客中心", areaId: "qizang-gou", location: [103.72, 32.87], status: "规划提升", note: "规划提出改造提升现状游客中心。" },
    { id: "planning-emergency-hlg", name: "黄龙沟应急避难点", type: "应急设施", areaId: "huanglong-gou", location: [103.824, 32.744], status: "规划设置", note: "规划资料中的应急避灾设施示意点。" },
    { id: "planning-guide-hlg", name: "黄龙沟集中解说点", type: "导览设施", areaId: "huanglong-gou", location: [103.832, 32.732], status: "规划设置", note: "可承载图文、语音和终端导览内容。" }
  ],
  routes: [
    { id: "core-calcite", name: "黄龙沟钙华核心线", areaId: "huanglong-gou", kind: "观光核心", status: "规划游线示意", points: [[103.8195,32.7497],[103.8282,32.7459],[103.832,32.732],[103.8347,32.7226]] },
    { id: "forest-water", name: "森林与水文科普线", areaId: "huanglong-gou", kind: "科普研学", status: "内容组织建议", points: [[103.8195,32.7497],[103.825,32.742],[103.831,32.735],[103.8347,32.7226]] },
    { id: "low-load", name: "服务点低负担线", areaId: "huanglong-gou", kind: "低负担", status: "内容组织建议", points: [[103.8195,32.7497],[103.824,32.744],[103.8282,32.7459],[103.8195,32.7497]] }
  ],
  resources: [
    { name: "五彩池", type: "潭池", level: "特级", areaId: "huanglong-gou", location: [103.8347, 32.7226], tags: ["钙华", "彩池", "摄影"] },
    { name: "争艳彩池", type: "潭池", level: "特级", areaId: "huanglong-gou", location: [103.832, 32.732], tags: ["钙华", "彩池", "水文"] },
    { name: "金沙铺地", type: "滩涂", level: "一级", areaId: "huanglong-gou", location: [103.8282, 32.7459], tags: ["钙华", "沉积", "科普"] },
    { name: "莲台飞瀑", type: "瀑布跌水", level: "一级", areaId: "huanglong-gou", location: [103.8272, 32.7485], tags: ["水流", "摄影"] },
    { name: "黄龙后寺", type: "风景建筑", level: "一级", areaId: "huanglong-gou", location: [103.8334, 32.727], tags: ["文化", "建筑"] },
    { name: "扎嘎瀑布", type: "瀑布跌水", level: "特级", areaId: "muni-gou", location: [103.53, 32.62], tags: ["瀑布", "钙华"] },
    { name: "二道海", type: "湖泊", level: "特级", areaId: "muni-gou", location: [103.535, 32.625], tags: ["高原湖泊", "摄影"] },
    { name: "红星海子", type: "湖泊", level: "一级", areaId: "qizang-gou", location: [103.72, 32.87], tags: ["冰川", "徒步"] },
    { name: "岷江源湿地", type: "沼泽滩涂", level: "特级", areaId: "minjiang-source", location: [103.66, 32.96], tags: ["湿地", "保育"] },
    { name: "雪宝鼎冰川", type: "冰雪冰川", level: "特级", areaId: "xuebaoding", location: [103.94, 32.93], tags: ["雪山", "科考"] }
  ]
};

