# 一滴水的黄龙旅行：实施与回退

目标：用可复用的低多边形 Three.js 地景，把随行攻略、手动打卡和钙华形成互动故事连起来。用户已批准制作，直接在当前任务执行。

稳定存档：`archive/2026-09-20-before-water-drop`，对应 `57673c9`。实验分支：`feature/water-drop-companion`；main 保留稳定版本。此标签与分支推送至原 GitHub 仓库。

## 实施单元

- [x] 模型：`src/water-landscape.mjs` 生成确定性的低多边形池群、钙华池沿、岩体、杉树、木栈道与水滴。导出 `assets/models/huanglong-water-landscape.glb`，可独立复用，不当作景区精确地形。
- [x] 交互：`src/water-scene.mjs` 管理 Three.js 渲染、镜头旋转/缩放、三步地质故事与沉积生长；仅场景在屏幕内时运行，提供静态回退及减少动态效果支持。
- [x] 随行：`follow.js` / `follow.css` 提供玩法与拍照卡、旅行印章册、当前站到达与完成分离；`follow-state.js` 管理版本化本地恢复和奖励去重。
- [x] 接入：保留现有游线与地图，在 `index.html`、`app.js` 中连接随行模块。Three.js 打包为本地 IIFE，直接打开文件也可看模型，不依赖 CDN 模块导入。
- [x] 验证：进度恢复、奖励去重和游戏完成条件使用 Node 测试；模型几何检查与移动端浏览器截图验证。运行现有 16 项测试与公开资源白名单检查。
- [x] 交付：提交并推送实验分支，部署在线原型；记录准确版本与回退方法。

## 体验边界

页面先给当前站与到达操作，再展示本轮重点的 3D 地景体验，之后提供本站攻略和行程印记。DOM 与视觉顺序保持一致。不要求打卡或游戏完成后才能继续游线。手动到达生成景点印章，游戏只生成学习纪念章，两者不混淆。反复点击不会重复奖励。三个重点景点有专项观察玩法，其余景点复用已有观看/摄影内容。

水是溶解物质的载体，条件合适时碳酸钙沉积；水滴本身不变成石头。几秒动画表达许多轮水流与长期积累，不显示未经证实的精确年限/沉积速率。模型为艺术化过程示意，操作节奏不代表真实化学速率。

## 回退

保留实验后切回稳定代码：`git switch main`，或从标签创建恢复分支 `git switch -c restore/stable-poi archive/2026-09-20-before-water-drop`。先保存未提交修改，不使用强制覆盖。

线上恢复建议从标签建立新目录，避免新旧 `dist` 文件混杂，也保留当前实验代码：

```powershell
git worktree add ../huanglong-stable-restore archive/2026-09-20-before-water-drop
Set-Location ../huanglong-stable-restore
npm.cmd ci
npm.cmd run deploy:cloudflare
```

如果同名目录已经存在，先检查其用途，再另选一个未使用的目录名，不覆盖。也可通过 Cloudflare 部署历史回退到 `af72acad-377e-4ca2-a1ab-1692ebf23e6e`。不要在实验分支直接运行清空式重置；旧版本的构建白名单会拒绝新版本残留文件，故推荐独立恢复目录。
