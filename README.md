# 星夜消消 · Classic H5 在线预览

这是 [pkinfran/popstar-recreation](https://github.com/pkinfran/popstar-recreation) 项目中 `classic-h5/` 的**独立静态发布副本**，只用于 Classic 经典点消模式的手机浏览器试玩及可视化验收。

- **在线地址（启用 GitHub Pages 后）：** https://pkinfran.github.io/tap_test/
- **发布仓库：** https://github.com/pkinfran/tap_test
- **开发仓库：** `pkinfran/popstar-recreation`（私有，仅仓库授权者可访问）
- **资源：** `index.html`、`src/*.mjs`、`src/*.css`、`assets/*.svg`
- 不上传原 APK、APK 逆向产物、原始棋盘记录、研究文档或测试工件；所有网页客户端代码按 Web 特性公开可见。
- 游戏为非官方的原创 H5 研究复刻，非原 APK，不包含原作美术与音频素材。

## GitHub Pages 实际部署状态

GitHub Pages 已经启用，[2026-10-11 Pages 构建与部署](https://github.com/pkinfran/tap_test/actions/runs/38111098199) 任务 **SUCCESS**，GitHub 提供的正式地址为 https://pkinfran.github.io/tap_test/ 。下游线上真实 Chromium 桌面和 Pixel 7 浏览器测试详见 `.github/workflows/production-smoke.yml`，与仓库代码静态检查相互独立。

## 开发源自动同步

私有仓库中的 `.github/workflows/publish-classic-to-tap-test.yml` 提供 **Classic H5 验证成功后同步**。

需要一次性在私有源仓库 `popstar-recreation` 的 **Settings → Secrets and variables → Actions** 添加 **Repository secret**：

- 名称：`TAP_TEST_DEPLOY_TOKEN`
- 值：仅授权 `pkinfran/tap_test` 的 GitHub fine-grained Personal Access Token，**Contents: Read and write**。

凭据只存 GitHub Actions secret，**不要粘贴到公开仓库、源码或聊天中**。没配置时仍可手动同步，自动同步会跳过。公开仓库 `main` 的发布内容不应直接手工修改，以免下次同步覆盖。

## 安全与验证

私有源仓库的 Classic H5 单元测试、原版统计对齐审计和 Playwright 手机浏览器交互测试通过后才触发自动发布。当前页面的公开发布只是 H5 演示，**不代表与 APK 画面及全部逻辑达到 1:1**。
