# Changelog

## v0.4.5 — 2026-10-29

- **修复：粘贴长文本后整个界面被顶出屏幕。** 0.4.4 用 `html { overflow: hidden }` 藏掉 zoom 多出来的滚动条带，代价是内容一旦高过视口就被裁掉，聊天框被长 prompt 撑高时顶部内容直接消失且滚不回来
- 改为**回收高度而不是裁掉**：缩放时给应用根容器（`#root` / `body > div:first-of-type` / `body > main`）写入 `height: calc(100vh / s)`，文档高度回到正好一屏，内容不再被裁
- 滚轮兜底：只有当 target 的所有可滚动祖先都已到边界时才 `preventDefault()`，滚轮依然不会把整页推走，但内部滚动和键盘/滚动条滚动保持可用
- 测试同步：`zoom.test.mjs` 现在断言「根高度被写成 `100vh / s`」而不是「overflow 被锁 hidden」


## v0.4.4 — 2026-10-21

- npm 包不再包含 `scripts/`：测试只留在仓库里，由 CI 运行
- 原因：目录站的静态分析会把 tarball 里的 `readFileSync` / `new Function` 记成 `fs-read` / `dynamic-code` 能力标签，一个缩放插件不该背这两条

## v0.4.3 — 2026-10-21

- 验证 Trusted Publishing：首个由 GitHub Actions（OIDC + provenance）发布的版本，不再使用 npm token

## v0.4.2 — 2026-10-21

- 发布流程改为 GitHub Actions + Trusted Publishing：推 * tag 自动发 npm，带 provenance 签名，不再需要 token
- CI 加跑 scripts/zoom.test.mjs，覆盖 Node 18 / 20 / 22 / 24
- README 增加 npm 徽章与「反馈」段落；仓库开启 Discussions，新增 issue 表单

## v0.4.1 — 2026-10-21

- 首次发布到 npm（dsh plugin --profile web add dsh-ui-zoom 现在可用）
- package.json 补上 
epository / homepage / ugs，npm 页面能解析相对图片
- README 的演示 GIF 改用绝对地址，npm 与 GitHub 都能正常显示

## v0.4.0 — 2026-10-21

- 新增 `Ctrl` + `=` / `Ctrl` + `-` 快捷键（配合已有的 `Ctrl` + `0`），和 `Ctrl` + 滚轮同一套节流与边界
- README 重写：功能特性、与其他缩放方案的对比、四种安装方式与选择建议、常见问题
- 新增英文 README（`README.en.md`）与这份 CHANGELOG
- 打包产物 `dsh-ui-zoom-0.4.0.tgz` 附在 Release 上，方便离线安装
- 缩放逻辑与 v0.3.2 一致，没有行为变更

## v0.3.2 — 2026-10-19

- 修复：缩放后把消息列表滚到底、继续滚会把整个 DSH 界面推着上移。原因是 `zoom` 作用在 `<html>` 上会放大根盒子，文档因此多出一截可滚动区域；现在缩放期间锁住根滚动，回到 100% 时把 `<html>` / `<body>` 原来的内联样式原样还原
- `getBoundingClientRect()` 的垫片返回真正的 `DOMRect`，不再破坏 `instanceof` 判断
- 取 getter 时沿原型链查找，描述符不在对象自身时也能正确安装垫片
- 新增 `scripts/zoom.test.mjs`

## v0.3.1 — 2026-10-19

- 首次处理滚动链问题：缩放时锁住根滚动

## v0.2.0 — 2026-10-18

- 度量垫片补全：`Element.clientWidth` / `clientHeight`、`MouseEvent.clientX` / `clientY`
- 右下角常驻「设置」入口

## v0.1.0 — 2026-10-18

- 首个可安装版本：`Ctrl` + 滚轮缩放 60%–180%、百分比 HUD、`localStorage` 记忆
