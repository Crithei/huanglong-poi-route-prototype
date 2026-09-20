# Cloudflare 部署

在线地址：[huanglong-route.itsmephrynx.workers.dev](https://huanglong-route.itsmephrynx.workers.dev/)

本项目部署为独立 Worker `huanglong-route`，使用 Cloudflare 免费 `workers.dev` 域名，`workers_dev: true`、`routes: []`。静态网页和高德代理在同一域名下运行，不依赖本机预览服务。

## 结构

- `wrangler.jsonc`：Worker、静态资源目录与免费域名开关。
- `cloudflare/worker.mjs`：公开运行配置和高德代理。
- `scripts/build-cloudflare.cjs`：只复制白名单内的 21 个公开文件，生成 `dist/`。源码、测试、部署配置和本机凭据不进入公开资源目录。
- `map.js`：在线版使用 `amapServiceHost`；本机 `server.js` 仍支持原开发配置。

网页从 `/runtime-config.js` 获取公开的 JSAPI Key 和同源代理地址。安全密钥只保存在 Worker Secrets 中。`/_AMapService/v4/map/styles` 转发至 `webapi.amap.com`，其余支持的高德 API 路径转发至 `restapi.amap.com`。

代理替换请求中的 Key 和 jscode，不转发用户 Cookie 或 Authorization；限制为 GET / HEAD、固定高德上游，并拒绝上游重定向。高德 JSONP 返回的 MIME 类型会修正为 JavaScript，使浏览器在启用 nosniff 时仍能执行回调。普通 JSON 保持原类型。

## 更新部署

部署需要 Node.js 22 以上与已授权的 Cloudflare 账号；Wrangler 4.127.1 要求 Node.js 22+。仅运行零依赖本机服务仍可使用 Node.js 20。

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run deploy:cloudflare
```

首次在其他账号部署时，修改 `account_id` 和 Worker 名，保留空 `routes`，使用该账号的 Workers 免费子域名，并通过 Cloudflare 控制台或 `wrangler secret bulk` 设置：

| Secret | 用途 |
|---|---|
| `AMAP_JSAPI_KEY` | Web 端 JSAPI Key，通过运行配置公开给浏览器 |
| `AMAP_JSAPI_SECURITY_CODE` | 与 JSAPI Key 对应的安全密钥，只在服务端使用 |

当前设施数据是已经查询的快照，线上展示不需要 Web Service Key。刷新设施目录仍使用本机的 `AMAP_WEBSERVICE_KEY`，运行原有 `refresh:facilities` 脚本后重新构建部署。

本次使用保存的 Wrangler OAuth 登录；环境变量 `CLOUDFLARE_API_TOKEN` 如果仅包含空白，须在命令进程中清除，避免覆盖有效的 OAuth 登录。不应把令牌或安全密钥写入配置文件。

## 飞书展示

飞书文档通过 HTML 内容块中的 iframe 加载在线页面，演示框最大 390px，宽高比 1:2，并附上独立打开入口。在线版使用真实高德底图和步行路线，沿用原型的 POI 资料与规划逻辑。

嵌入壳源码保存在 `cloudflare/feishu-embed.html`，不加入网站公开资源。文档「tjh-游客画像出行决策」已更新为在线版。日后修改 HTML 壳时，先读取当前文档版本与内容块 ID，再定点替换；网站自身更新后，重新打开文档即可加载新版本。

飞书的实际容器权限可能与普通浏览器不同；本地嵌套 iframe 检查不能替代对飞书实际页面的验收。若嵌入加载受限，文档中的在线链接仍可独立使用。

2026-09-18 原域名版本的历史验证：16 项自动检查通过；线上 390px 竖屏浏览器可拖动、缩放、检索 68 处 POI 并打开设施详情。游客中心至洗身洞医疗点查询获得约 1.1 公里、15 分钟的实际步行结果。普通和无同源权限的嵌套 iframe 均获得真实地图及步行结果；后者出现 SDK 窗口访问报错与统计请求失败，测试中的地图与查询仍可用。飞书内容写入后已回读核对，但未通过用户实际登录页面验收其容器显示。

## 已知边界

景区游线总里程、时间预算及索道条件仍属于原型估算；蓝色设施步行路线来自高德实时查询，虚线为游线顺序示意。设施开放状态、排队信息和用户定位尚未接入。Cloudflare 配置不会改变这些产品边界。

2026-09-20 起，按用户要求将免费 `workers.dev` 地址作为唯一项目入口，停止使用私人域名。原型页面、静态资源、高德同源代理继续由同一个 Worker 提供。

本次网络实测：默认 DNS 解析异常，首页与脚本直接请求超时；从另一 DNS 服务取得 Cloudflare IP 后，HTTPS 连接仍被重置。控制面可以访问且确认 workers.dev 已启用。这能核验部署配置，不能证明当前本机网络或其他访客网络可以正常打开网站。未修改系统 DNS、代理或其他网络设置。

浏览器存储按域名隔离，新入口不会自动继承旧域名下的手动打卡与印章。网站代码更新不会清除存储，域名切换需要在新入口重新记录。

回退代码时也要保留 `workers_dev: true`、`routes: []`；历史标签中的配置可能带有旧私人域名，不能未经修改直接部署。Wrangler 配置中清空 routes 可能不会移除已经存在的自定义域名，解绑后还需通过 Cloudflare Domains API/控制台检查实际绑定。

本轮部署版本、域名解绑与飞书入口回读结果待发布后补齐。

参考：[Cloudflare 静态资源](https://developers.cloudflare.com/workers/static-assets/)、[自定义域名](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)、[高德安全密钥](https://lbs.amap.com/api/javascript-api-v2/guide/abc/jscode)。
