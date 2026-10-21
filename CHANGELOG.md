# Changelog

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
