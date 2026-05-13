# AI 工具箱

> 一站式开发者 AI 工具集合 · 截图转代码 · URL 速读 · 多模型对比

[在线 demo](https://smithylab.com) · [设计文档](./REQUIREMENTS.md) · [Phase 进度](./CLAUDE.md#phase-进度)

<!--
  Demo GIF goes here. Record once with QuickTime/Kap (10-15 sec each):
  1. screenshot-to-code 上传截图 → 流式生成 → Sandpack 渲染
  2. url-digest 粘 URL → 三 tab 切换看 mindmap
  3. model-compare 跑 4 模型并发 → 看耗时排名
  保存为 `docs/demo.gif` 后用下面这行：
-->
<!-- ![Demo](docs/demo.gif) -->

## ✨ 特性

- **截图转代码**：上传 UI 截图 → 流式生成 React + Tailwind 代码 → Sandpack 实时预览
- **URL 速读**：粘贴链接 → AI 抽要点 + Mermaid 思维导图 → 24h KV 缓存
- **多模型对比**：一个 Prompt → 4 模型并发流式 → 性能/成本并排展示
- **BYOK**：用户自带 API Key，仅存 localStorage，永不落库
- **命令面板**：`⌘K` 全站搜索 + 快捷跳转
- **数据透明**：[/stats](https://smithylab.com/stats) 实时展示调用次数 + tokens 消耗 + 作者自掏腰包的实际成本
- **深色模式**：默认深色 · 跟随系统 · 无 FOUC

## 🛠 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | Next.js 16 + App Router + Turbopack |
| 语言 | TypeScript 5（strict, 禁用 `any`） |
| 样式 | Tailwind CSS 4（OKLCH 色彩 · `@theme inline`） |
| UI 组件 | shadcn/ui（base-nova 预设，violet 强调色） |
| AI SDK | Vercel AI SDK 6（OpenAI / Anthropic / Google / DeepSeek 统一接口） |
| 内容提取 | `@mozilla/readability` + `jsdom` |
| 图表 | Mermaid · Shiki 代码高亮 · Sandpack 实时预览 |
| 缓存 | Vercel KV（Upstash Redis · 24h 摘要缓存 + 计数器） |
| 部署 | Vercel |

## 🚀 快速开始

```bash
# 安装依赖（pnpm 推荐）
pnpm install

# 配置环境变量（可选 —— 不配 key 时走 BYOK，用户在前端填）
cp .env.example .env.local

# 启动开发服务器（Turbopack 默认开启）
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)。

## 🧰 常用脚本

| 命令 | 作用 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm start` | 启动生产服务 |
| `pnpm lint` | ESLint 检查 |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm format` | Prettier 格式化全项目 |
| `pnpm format:check` | Prettier 检查（CI 用） |

## 📐 架构

```
app/                          # App Router · Server Components 优先
├── api/                      # Route Handlers · Zod 校验 + rate limit
│   ├── screenshot-to-code/   # streamText 多模态 + onFinish 记 tokens
│   ├── url-digest/           # JSDOM + Readability + generateObject + 24h KV
│   └── model-compare/        # 并发流 · 自定义 text+meta 协议
├── tools/*/                  # 三个工具的客户端页（client 组件懒加载重型库）
├── lab/                      # 纯前端 demo（粒子 / Web Audio / 终端）
├── stats/                    # 数据透明 · ISR 60s · 读 KV 计数器
├── about/                    # 设计原则 + 技术栈
├── opengraph-image.tsx       # 动态 OG 图（社交分享卡片）
├── sitemap.ts · robots.ts    # SEO
└── layout.tsx                # ThemeProvider + Toaster + Header + Footer

components/
├── layout/                   # SiteHeader · SiteFooter · MobileNav (Sheet)
├── tools/                    # ScreenshotUploader · CodeStreamView · LivePreview · MermaidView
├── lab/                      # ParticleField · MiniKeyboard · Terminal
├── sections/ToolsGrid.tsx
├── ui/                       # shadcn 原语
├── BYOKDialog.tsx            # localStorage Key 管理 UI
├── CommandMenu.tsx           # cmdk 命令面板（工具/跳转/主题/BYOK 都在这）
└── icons/GithubIcon.tsx      # 内联 SVG（lucide v1 移除了 Github）

lib/
├── ai/
│   ├── providers.ts          # 4 provider 抽象 + BYOK 优先级
│   ├── models.ts             # 模型目录 + 成本估算
│   └── byok.ts               # x-byok-* header 协议 + localStorage 持久化
├── api.ts                    # apiHandler() 包装：Zod + rate limit + 错误信封
├── rate-limit.ts             # 内存版固定窗口限流
├── kv.ts                     # Vercel KV 优雅降级 + trackUsage()
└── site.ts                   # 站点配置 + 工具清单

hooks/
├── useIsHydrated.ts          # useSyncExternalStore SSR-safe hook
└── useByok.ts                # 跨标签同步的 BYOK 状态
```

## 🔐 安全约束

- ✅ API Key 永不进前端 bundle
- ✅ BYOK 用户 key 仅存 localStorage · 通过 `x-byok-*` HTTP header 转发 · 服务器永不落库
- ✅ 所有 API route 用 Zod 校验
- ✅ 所有用户输入长度限制（图片 ≤ 5MB · URL ≤ 2000 字 · 文本 ≤ 10000 字）
- ✅ 不存任何用户隐私数据
- ✅ 内存限流：10 AI calls/分钟/IP，多实例 best-effort

## 📊 性能目标

- Lighthouse 全维度 ≥ 95（Performance / A11y / Best Practices / SEO）
- 首屏 LCP < 1.5s（4G 网络）
- 所有 AI 调用首 token < 2s

<!--
  Lighthouse screenshot goes here. 跑过一次后扔进去：
  1. 部署到 Vercel
  2. Chrome DevTools → Lighthouse → 跑 Performance / A11y / BP / SEO
  3. 截图保存到 docs/lighthouse.png
  4. 取消下面注释
-->
<!--
![Lighthouse score](docs/lighthouse.png)
-->

## 🐛 踩坑记录

1. **Next.js 16 的 `dynamic({ ssr: false })` 禁用于 Server Component** —— 把所有用 `dynamic` 的页面拆成 server wrapper + client 组件（如 `app/lab/{page.tsx, lab-client.tsx}`）。
2. **React 19.2 新增 `react-hooks/set-state-in-effect` 规则** —— 经典的 `useEffect(() => setMounted(true), [])` 被禁。改用 `useSyncExternalStore` 包装的 [useIsHydrated.ts](hooks/useIsHydrated.ts)。
3. **shadcn base-nova Button 没有 `asChild` prop** —— @base-ui/react 没用 Radix Slot，需要包 Link/`<a>` 时用 `buttonVariants()` 类名生成器代替。
4. **lucide-react v1 重命名 + 删除图标** —— `BarChart` → `ChartBar`；`Github` 被删了（用内联 SVG 在 [GithubIcon.tsx](components/icons/GithubIcon.tsx)）。
5. **Turbopack 冷缓存偶发拉 Google Fonts 失败** —— 重跑或一次 `pnpm build --webpack` 预热缓存。Vercel 自家 CI 不受影响。
6. **Husky 在 monorepo 子目录下不会自动找父级 `.git`** —— `prepare` 脚本里 `cd $(git rev-parse --show-toplevel)` 再跑 `husky ai-toolbox/.husky`；hooks 内 `cd` 进项目目录再跑 `pnpm`。

## 📦 提交规范

[Conventional Commits](https://www.conventionalcommits.org/)，commitlint + husky 强制：

```
feat: 新功能 · fix: bug · chore: 杂项 · docs: 文档
refactor: 重构 · test: 测试 · perf: 性能
```

每次 `git commit` 触发 lint-staged → ESLint --fix + Prettier 格式化 stage 内的 ts/tsx/json/css。


## 📝 License

MIT
