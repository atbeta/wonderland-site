# Wonderland Site

[wonderland.pbeta.dev](https://wonderland.pbeta.dev) —— 跨域灵感日志的发布站。每天把两个陌生的领域撞在一起，引入一项约束命题，记录碰撞出的「火花卡片」。

Astro 4 静态站，部署于 Vercel。

## 命令

```bash
pnpm install
pnpm dev            # 本地开发（默认 4321）
pnpm build          # 生产构建 → dist/
pnpm preview        # 预览构建产物
pnpm sync:archive   # 从 wonderland workspace 同步最新日志到 days/
```

## 内容协议

内容不在本仓库编辑。`days/YYYY-MM-DD.md` 由 `scripts/sync-archive.sh` 从 `~/.openclaw/workspace/wonderland/archive/` 同步而来——那边是唯一事实源。同步会全量覆盖 `days/` 并删除已下架的期数。

每篇日志是无 frontmatter 的 Markdown，结构约定：

- `# Wonderland — YYYY-MM-DD` —— 期标题（可带 `(run N)`）
- `## 组合 N：领域A × 领域B + 约束` —— 碰撞分组
- `### 💥 #N — 标题` —— 火花卡片，后跟 `**碰撞** / **连接点** / **锚点** / **族** / **惊讶度|具体度|可行动度** / **如果要做** / **状态** / **画面**` 字段段落

渲染管道（`astro.config.mjs` 挂载，解析逻辑不要动）：

- `remark-spark-meta.mjs` —— 字段段落 → `<dl class="spark-meta">`，评分 → 进度条
- `rehype-spark-card.mjs` —— `h3 💥` + 相邻 dl → `<section class="spark-card">`

这两个插件输出的 DOM class 是样式锚点，视觉层可以随意重设计。

## 部署

`scripts/deploy.sh`（cron 调用）：sync archive → install → build → `vercel deploy --prod`。需要 `VERCEL_TOKEN`。也可以 push 到 main 让 Vercel 自动构建。

## 设计系统：午夜梦境 / Midnight Wonderland

dark-first 双主题（`data-theme` + localStorage `wonderland-theme`，默认跟随系统）。设计 token 全部在 `src/layouts/BaseLayout.astro` 的全局样式里：

- 暗色基底 `#0B0A12`，accent 是极光渐变（紫 `#A78BFA` → 青 `#67E8F9`，点缀玫瑰 `#F9A8D4`）
- 亮色为晨曦纸白（暖白底 + 深紫 accent）
- 字体：标题 Newsreader（italic 点缀）+ Noto Serif SC 900，正文 Inter + Noto Sans SC，编号/日期 JetBrains Mono
- 全局底层是手写 2D canvas 极光（`#aurora-canvas`，缓慢漂移的光带 + 星野；`prefers-reduced-motion` 静态化，页面隐藏时暂停）
- 滚动显现用 `data-reveal` 属性 + `--rd` 阶梯延迟（IntersectionObserver）
