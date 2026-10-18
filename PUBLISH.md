# 发布步骤

这个目录已经是一个可安装的 dsh 插件包：`lib/index.js` 是宿主侧空插件，
`lib/client.js` 是浏览器侧 bundle，`cordis.patch.yml` 负责把插件插进 profile。

下面三步按需做：**GitHub 必做**，npm 和插件市场可选。

---

## 0. 本地先验一遍

```powershell
cd C:\Users\sjrzh\Documents\dsh-ui-zoom
node --check lib\client.js
node scripts\smoke.mjs
npm pack --dry-run
```

`smoke: ok` 表示 bundle 能被宿主加载、`apply()` 能跑、overlay 能渲染。

---

## 1. GitHub

仓库已经在本地初始化好，文件也都 `git add` 过了，只差一次提交和推送。

先在网页上建一个空仓库（不要勾 README / .gitignore / LICENSE）：

<https://github.com/new> → 名字 `dsh-ui-zoom` → Public → Create。

然后在本地：

```powershell
cd C:\Users\sjrzh\Documents\dsh-ui-zoom
git config user.name "你的名字"
git config user.email "你的邮箱"
git commit -m "feat: Ctrl+wheel page zoom and a bottom-right settings entry"
git remote add origin https://github.com/OWNER/dsh-ui-zoom.git
git push -u origin main
```

把 `OWNER` 换成你的 GitHub 用户名或组织名。第一次 push 会弹出浏览器/凭据管理器让你登录。

---

## 2. npm（可选，但市场一键装更顺）

```powershell
cd C:\Users\sjrzh\Documents\dsh-ui-zoom
npm login
npm publish --access public
```

- 包名 `dsh-ui-zoom` 目前没被占用（我查过 registry，404）。
- `package.json` 里的 `files` 已经把测试脚本和备份挡在包外。
- 发布后再 `npm view dsh-ui-zoom version` 确认。

如果不发 npm，插件仍然能从 GitHub 装：

```powershell
dsh plugin --profile web add github:OWNER/dsh-ui-zoom
```

---

## 3. 上架插件市场

市场（dshmarket / dshmarket.com / awesome-dsh-plugin.com）的目录来自这个仓库的
精选列表，**不是**给市场仓库提 PR：

<https://github.com/awesome-dsh-plugin/awesome-dsh-plugin>

### 3.1 Fork 并改两个文件

在 `README.md` 的 `### UI Enhancements` 段落下加一行（按字母序放好位置）：

```markdown
- [OWNER/dsh-ui-zoom](https://github.com/OWNER/dsh-ui-zoom) - Ctrl+wheel page zoom (60–180%, remembered) plus a bottom-right Settings entry and Ctrl+0 reset.
```

在 `README.zh.md` 对应段落下加：

```markdown
- [OWNER/dsh-ui-zoom](https://github.com/OWNER/dsh-ui-zoom) - Ctrl+滚轮整页缩放（60%–180%，记住比例），右下角常驻「设置」入口，Ctrl+0 复位。
```

### 3.2 提 PR

```powershell
gh repo fork awesome-dsh-plugin/awesome-dsh-plugin --clone
# 或网页上 Fork → 改文件 → Create pull request
```

PR 标题建议：

```
Add dsh-ui-zoom (UI Enhancements)
```

PR 描述里写清楚三件事，评审会照着核对：

- 安装方式：`dsh plugin --profile web add dsh-ui-zoom`（或 `github:OWNER/dsh-ui-zoom`）
- 一行描述与行为一致：Ctrl+滚轮缩放 60%–180%、记住比例、右下角设置入口、Ctrl+0 复位
- 纯客户端插件，宿主侧 `apply()` 为空；不读写文件、不发网络请求（只写 localStorage 一个键）
- 维护者：你本人

合并后市场 CI 每天刷一次目录，通常一天内能在市场里搜到；不用再往市场仓库提 PR。

---

## 4. 装到自己的 profile

```powershell
dsh plugin --profile web add dsh-ui-zoom
# 或
dsh plugin --profile desktop add dsh-ui-zoom
```

装完重启一次。之后 `Ctrl+滚轮`、`Ctrl+0`、右下角「设置」就直接可用；
想换档位范围就改 `lib/client.js` 顶部的 `ZOOM_MIN` / `ZOOM_MAX` / `ZOOM_STEP`。
