# 项目交接 · 从这里接手

交接日期：2026-10-13。面向第一次接触本项目的开发者或 AI 编程助手。无需读取之前的聊天或登录飞书即可理解并运行项目。

## 先读这几项

- 项目：**澄路**，黄龙景区移动端导览与自然观察网页原型，目标平台最终为微信小程序。
- 仓库：<https://github.com/Crithei/huanglong-poi-route-prototype>，交接版本以默认 `main` 为入口；`feature/fluid-water-story` 保留同版开发历史。
- 在线演示：<https://huanglong-route.itsmephrynx.workers.dev/>。这是既有 Cloudflare 站点，不是 GitHub Pages。
- 当前功能基线：`549ade8`（2026-10-08 连续彩池实验室），本次增加交接资料并同步之前未推送的提交。
- [图文产品总览](docs/PROJECT-OVERVIEW.md)：发现、地图、游线、随行、护照、互动、实验、手账的真实界面。
- 最近目标：让网站形成完整且可解释的游客体验。**下一项具体开发需求尚未确定**；下面的改进建议不是已获授权的新任务。
- 仓库当前为私有；网址可作为唯一交接材料入口，但接手账号仍需仓库读取权限。运行非地图功能不需要拥有原作者任何密钥。

## 产品意图与必须保留的决定

黄龙内部可选路径有限，重点是让游客理解景点、选择停留内容与合理分配时间，再将到站观察转成可收藏的记忆。完整体验为：发现景点 → 查地图与设施 → 调整游线 → 随行攻略 → 到达打卡与科普互动 → 收集 → 数字手账。

1. **手机竖屏优先。** 地图要占较大画幅，底部地点卡片可收起；发现页方形卡片在320–469px为两列，470px起为三列。
2. **攻略服务于选点。** 社媒导入只需提取并匹配已有POI，由用户确认；不做游记体验评分。导入优先级较低，不能将截图OCR和链接抓取写成已实现。
3. **内容要具体。** 景点讲清看哪里、怎么取舍、怎么玩、怎么拍；故事与来源可以展开。不要将示意图当实景或将照片机位当可达地点。
4. **四章3D与实验室各司其职。** 前者以同一滴水串起水流、溶解、出露、沉积的短互动；后者是在同一片池群中持续改变条件、观察并比较结果。不要退回互不关联的点击动画或单纯问答。
5. **到达不等于游完。** 手动到达收章、解锁章节；“逛完了”才推进游线。重玩、改路线或切主题不能扣除收藏。
6. **原型的真实性边界。** 手动打卡不核验位置，不可换实物；路线里程和时间是规则估算；钙华模型是定性科普，不能推算真实地质年限。
7. **实物联动目前只做策划。** 要体现薄水、层积、池沿和观察的黄龙特征，避免仅做通用网红文创。
8. **不用私人域名。** 继续使用当前 workers.dev 入口，不恢复旧私人域名绑定。
9. **激进改动前留Git回退点。** 保留现有用户改动、存档迁移与标签；不能靠清空浏览器存储解决升级问题。
10. 若再改飞书汇报，仅修改《第一次汇报各部分汇总》的“打卡系统”章节；其他章节不得改动。仓库图文总览独立可读，飞书不是交接前置条件。

## 当前实现与边界

| 模块 | 已实现 | 仍未实现或需要校核 |
|---|---|---|
| 发现 | 14处景点、搜索与分类、方形卡片、详情与来源、愿望清单 | 更广景源不等于已全部建成可选POI；内容需持续审校 |
| 地图 | 高德JSAPI、68条景点及设施目录、类别查询、手选起终点的高德步行 | 设施是2026-09-18快照；无实时开放、用户定位或封路数据 |
| 规划视角 | 景源、分区、设施与游线示意；总规资料统计 | 103项规划景源与14处可选景点口径不同；图层非官方导航边界 |
| 游线 | 时长、节奏、主题、索道条件；排序、估算、缓冲及暂缓原因 | 非最短路求解；尚未用景区实测路网和耗时标定 |
| 随行 | 手动进度、本站介绍、玩法和摄影建议、调整游线 | 无GPS自动到站、实时客流/天气自动改线 |
| 四章3D | 水槽转向、CO₂气团拖动、水位调节、水滴逐池移动；过渡、粒子、到站解锁 | 科普简化，需地学和游客可用性评估 |
| 护照 | 六枚景点章、三种主题、发现贴纸、去重与旧进度迁移 | 无账号、跨设备同步、可信到达凭证 |
| 实验室 | 四池连续演化、参数、暂停/步进、拖动前后对照、单池剖面、观察记录与奖励 | Canvas与SVG定性模型，非水动力/碳酸盐平衡仿真 |
| 手账 | 最多12页、每页6枚素材；标题/短记、拖动缩放旋转；PNG/SVG导出 | 无云端手账、多人协作或完整离线缓存 |
| 攻略导入 | 粘贴文字按本地目录名称/别名匹配 | 外链解析、OCR、社媒抓取仅预留 |
| 线下联动 | 策划书、结构概念图与阅读版 | 未制作、未运营，无库存或核销后台 |

## 克隆并运行

统一建议 **Node.js 22+**，本轮使用Node 24.15.0 / npm 11.12.1。源码为普通HTML/CSS/JavaScript，没有React/Vue或数据库。

```sh
git clone https://github.com/Crithei/huanglong-poi-route-prototype.git
cd huanglong-poi-route-prototype
npm ci
npm test
npm start
```

打开 <http://127.0.0.1:4173/>。Windows可用`npm.cmd`代替`npm`。端口被占用时运行`node server.js 4175`，或使用`start-demo.ps1`自动选择空闲端口。默认进入地图，通过底部导航进入其他页。

没有高德凭据时，景点内容、选线、护照、3D、实验室与手账仍可体验；地图提示未连接。直接双击HTML不具备地图运行时配置端点，不作为完整验收方式。

### 高德本机配置

运行服务前在当前终端设置自己的`AMAP_JSAPI_KEY`及`AMAP_JSAPI_SECURITY_CODE`（也兼容`AMAP_SECURITY_JS_CODE`）。可参考[变量模板](.env.example)，但`server.js`**不会自动读取.env**，请通过进程环境注入。可用Node的`--env-file`显式加载自行创建的`.env`：

```sh
node --env-file=.env server.js
```

JSAPI key属于网页端服务；刷新设施资料另需`AMAP_WEBSERVICE_KEY`，不能互换。本机服务仅监听127.0.0.1，其运行时端点包含本机安全码，不可作为公网服务器。生产安全码只放Cloudflare Secrets，浏览器使用同源代理。

## 按修改目标找源码

| 目标 | 起点 |
|---|---|
| 页面结构/导航/景点详情 | `index.html`、`app.js`、`style.css`、`mobile.css` |
| POI文案、别名、配图和来源 | `data/scenic.js`；服务节点组合在`app.js` |
| 地图、设施、步行 | `map.js`、`data/facilities.js`、`scripts/refresh-facilities.cjs` |
| 规划资料与选线 | `data/planning.js`、`app.js`中的`buildPlan`与估算函数 |
| 随行与旧存档 | `follow.js`、`follow-state.js`、`follow.css` |
| 四章玩法状态与3D | `src/water-processes.mjs`、`src/water-deposition.mjs`、`src/water-scene.mjs`、其他`src/water-*.mjs` |
| 护照/手账规则和界面 | `data/passport.js`、`passport-state.js`、`passport.js`、`passport-art.js`、`passport.css` |
| 连续实验室 | `pool-lab-state.js`（模型）、`pool-lab-scene.js`（Canvas/SVG）、`pool-lab.js`（交互和桥接）、`pool-lab.css` |
| 章图 | `assets/passport/`、`data/stamps.js`；`scripts/build-passport-art.cjs`重建部分素材，五彩池为手绘母版 |
| 服务/部署 | `server.js`、`cloudflare/worker.mjs`、`wrangler.jsonc`、`scripts/build-cloudflare.cjs` |
| 验证 | `tests/*.test.cjs`：Node test runner、jsdom；不需高德凭据 |

`assets/water-scene.js`和`assets/models/*.glb`是已提交的构建产物。改3D源码后运行`npm run build:water`，检查并提交相应产物；不要只改打包文件。实验室的`pool-lab-*.js`直接由页面加载，不属于Three.js打包场景。新增前端资源时也要更新Cloudflare显式白名单，否则本机正常但线上缺文件。

## 存档与不可破坏的行为

| localStorage键 | 所属内容 |
|---|---|
| `huanglong.travel-journal.v1` | 随行、到达、旧章、四章3D进度；键名虽为v1，内部存在版本迁移 |
| `huanglong.passport.v1` | 护照名、主题、发现、数字手账 |
| `huanglong.pool-lab.v1` | 池群状态、对照基准、选中池、速度、最多6条观察 |

不要改POI ID来改显示名称。升级前读状态模块及迁移测试，已有旧版本备份逻辑必须保留。实验室恢复后为暂停；切标签、离开随行、后台或场景不可见时暂停，不追赶后台时间。复位实验不删除观察卡、手账或收藏。未到站可完整探索并记录，但不获得正式发现贴纸；到达关联地点后收集水路连通、水位下降、池沿积累三类发现才获“池群观察者”。

本机存储按域名和端口隔离；在线站、本机4173和4175不会自动共享记录。浏览器清理会丢失数据，没有云端备份。实验观察“写进手账”写入文字和已有收藏，不会自动将Canvas截图贴进去。

## 验证与发布

2026-10-13在已有功能基线重新执行：`npm ci`成功，`npm test` **100/100通过**，`npm run build:cloudflare`成功，45个公开资源，环境凭据扫描通过；构建后原有打包文件无差异。本轮只更新GitHub和交接文档，没有重新部署Cloudflare，也未重新做整套浏览器验收。

2026-10-08的320/390/430px实机视口检查、实验交互与部署记录见[实验室说明](docs/pool-lab-guide.md)。2026-10-09为图文汇报检查过景点/地图/游线界面，高德游客中心至二号停车场厕所返回约248米、3分钟；这只是当日查询证据，不能当成当前实时状态。

首次接手建议按顺序走一遍：选景点并看详情 → 调整游线 → 选择设施并查步行 → 手动到达盖章 → 完成一章3D → 实验改条件/比较/留观察 → 写手账/导出 → 刷新核对存档。界面改动需重看320、390、430px及减少动态效果模式。自动化测试不能代替高德在线服务或地学内容核验。

部署步骤详见[CLOUDFLARE.md](CLOUDFLARE.md)。同账号维护需要独立取得授权；仓库不含可用密钥。当前配置含原项目account_id，迁移到自己的账号必须改为自己的account_id及Worker名，保留`workers_dev: true`、`routes: []`。

```sh
npx wrangler login
npx wrangler secret put AMAP_JSAPI_KEY
npx wrangler secret put AMAP_JSAPI_SECURITY_CODE
npm run deploy:cloudflare
```

Secrets只在首次配置或有意轮换时设置；现有部署脚本使用`--keep-vars`。不要因接手而覆盖现有Secrets。`dist/`仅允许白名单公开资源，不部署文档、测试、源码配置或凭据。发布后需实测站点、底图及一次步行查询。当前没有仓库CI/CD，**推送GitHub不会自动发布网站**。

## 版本与回退

保留历史分支，默认main用于交接。稳定功能基线`549ade8`；回退点：

- `archive/pre-pool-lab-20261008` → `8b4e9e3`：保留护照，回到旧三实验。
- `archive/pre-passport-20261008` → `22496e8`：回到护照扩展之前。
- `archive/2026-09-20-before-water-anchor`：回到水滴锚点交互之前。

先在独立分支预览旧版本，避免重置正在工作的分支：

```sh
git fetch origin --tags
git switch -c review/pre-pool-lab archive/pre-pool-lab-20261008
npm ci
npm test
npm start
```

要回退线上，还需在旧分支确认免费域名配置、构建并部署；切换Git提交本身不会回退线上。老版本配置可能包含旧私人域名，不能直接照搬。不要删除localStorage来回退。

## 下一步建议与待办

这些是接手时应优先评估的事项，不代表已有现场数据或承诺交付时间：

1. 用游客试用验证“从选点到手账”的理解和操作；特别核对实验条件变化是否能被用自己的话解释。
2. 校核景区路网、坐标、开放条件与时间估算，再考虑定位到站和动态改线；先区分规划数据与运营数据。
3. 由地学人员审校钙华科普与模型边界，保持同一水滴和连续观察的产品意图。
4. 规划小程序适配、云端保存与可靠核验，再讨论纪念品领取；保留现有存档迁移路径。
5. 检查开发依赖审计结果并单独升级验证，不直接运行`npm audit fix --force`。本轮`npm ci`报告4项high依赖告警，涉及Wrangler及其工具链依赖miniflare、sharp、undici；测试和构建通过不代表这些告警已解决。
6. 社媒导入等较低优先级项在范围确认后推进；不得假设任意登录平台可稳定抓取。原用户允许截图阅读与复制小红书内容，但不允许批量下载图片。

## 文档入口与外部材料

- [产品图文总览](docs/PROJECT-OVERVIEW.md)：仓库内图片，离线也能阅读。
- [景点内容](SCENIC-CONTENT-GUIDE.md) / [游客导向的POI介绍](docs/POI-VISITOR-GUIDE.md)。
- [移动端地图](MOBILE-MAP-GUIDE.md) / [水滴四章](docs/WATER-DROP-GUIDE.md) / [护照](docs/passport-guide.md) / [实验室](docs/pool-lab-guide.md)。
- [实体纪念品策划](docs/黄龙山水护照与实体纪念品联动策划.md) / [HTML阅读版](docs/passport-proposal.html) / [结构概念图](docs/souvenir-structures.svg)。HTML阅读版可启动本机服务后访问`/docs/passport-proposal.html`，不在公开部署白名单。
- 原始总规ZIP、完整研究素材不在仓库；现有整理数据在`data/planning.js`。研究追溯需要另行取得原件，不应凭整理数据声称已完成全量原文校核。
- 飞书汇报仅为可选外部副本：<https://z08x25d4edh.feishu.cn/docx/OVKfdsRkhoZ471xnJxOcvjUEnug>。“打卡系统”包含整站图文；其他章节由其他内容构成。

历史计划文档用于理解设计沿革，若与当前实现冲突，以源码、当前模块说明和实际验证为准。图文截图日期为2026-10-09，采用本地演示记录，不是游客运营数据。

## 给下一位AI助手的一段话

> 请先阅读本仓库README.md、HANDOFF.md与docs/PROJECT-OVERVIEW.md，再查看git status和用户本轮目标。项目是黄龙手机竖屏导览原型，保留发现、地图、解释性游线、随行、四章3D、连续彩池实验室、护照与手账。先运行测试，辨别既有功能与待开发项；不得清空存档、恢复私人域名或将估算宣传成实测。针对目标读取对应模块，先留回退点，改动后测试和必要的手机视口验证。未经用户要求，不改飞书其他章节，也不擅自扩大开发范围或部署。

可用时建议采用高德JSAPI技能处理地图、系统化排错技能处理故障、飞书文档技能处理外部汇报；本仓库的运行不依赖安装这些AI技能。
