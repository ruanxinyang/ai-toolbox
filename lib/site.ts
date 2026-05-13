import type { LucideIcon } from "lucide-react"
import {
  AudioLines,
  BookOpen,
  Braces,
  Camera,
  Database,
  Eraser,
  FileText,
  FileUp,
  FormInput,
  GitCompareArrows,
  Network,
  Palette,
  Regex,
  TerminalSquare,
  Video,
} from "lucide-react"

export const siteConfig = {
  name: "AI 工具箱",
  shortName: "AI Toolbox",
  description:
    "为开发者打造的 AI 工具集合 —— 截图转代码、URL 速读、多模型对比、代码解释器、Mermaid 自动生成、PDF 问答，开箱即用。",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://smithylab.com",
  githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/ruanxinyang/ai-toolbox",
  authorEmail: "hello@smithylab.com",
  keywords: [
    "AI tools",
    "Next.js",
    "Vercel AI SDK",
    "screenshot to code",
    "URL digest",
    "model compare",
  ],
} as const

export type ToolStatus = "available" | "coming-soon"

export type Tool = {
  slug: string
  name: string
  description: string
  href: string
  icon: LucideIcon
  status: ToolStatus
  tags: string[]
}

export const tools: Tool[] = [
  {
    slug: "screenshot-to-code",
    name: "截图转代码",
    description: "上传 UI 截图，AI 流式生成可运行的 React + Tailwind 代码，Sandpack 实时预览。",
    href: "/tools/screenshot-to-code",
    icon: Camera,
    status: "available",
    tags: ["多模态", "Streaming", "Sandpack"],
  },
  {
    slug: "url-digest",
    name: "URL 速读",
    description: "粘贴链接，AI 抽取要点 + 生成 Mermaid 思维导图，24 小时缓存复用。",
    href: "/tools/url-digest",
    icon: FileText,
    status: "available",
    tags: ["Readability", "Mermaid", "KV Cache"],
  },
  {
    slug: "model-compare",
    name: "多模型对比",
    description: "一个 Prompt，并发流式调用 4 个大模型并排展示，对比响应速度、tokens 与成本。",
    href: "/tools/model-compare",
    icon: GitCompareArrows,
    status: "available",
    tags: ["并发", "Streaming", "成本对比"],
  },
  {
    slug: "code-explain",
    name: "代码解释器",
    description: "粘任意语言的代码，AI 流式 Markdown 解释，分块讲清楚做什么 / 为什么 / 怎么改。",
    href: "/tools/code-explain",
    icon: BookOpen,
    status: "available",
    tags: ["Streaming", "Markdown", "多语言"],
  },
  {
    slug: "mermaid-gen",
    name: "Mermaid 自动生成",
    description: "用自然语言描述图，AI 生成 Mermaid 源码 + 实时预览，支持 8 种图类型。",
    href: "/tools/mermaid-gen",
    icon: Network,
    status: "available",
    tags: ["Mermaid", "结构化输出", "Flowchart"],
  },
  {
    slug: "pdf-qa",
    name: "PDF 问答",
    description: "上传 PDF（≤ 15MB），Gemini 2.5 Pro 原生多模态读取并流式回答任何问题。",
    href: "/tools/pdf-qa",
    icon: FileUp,
    status: "available",
    tags: ["多模态", "Streaming", "Gemini"],
  },
  {
    slug: "api-debug",
    name: "API 调试器",
    description: "浏览器内发 HTTP 请求看响应 + AI 一键生成 curl / fetch / Python / axios 代码。",
    href: "/tools/api-debug",
    icon: TerminalSquare,
    status: "available",
    tags: ["HTTP", "AI 生成", "Postman lite"],
  },
  {
    slug: "meeting-notes",
    name: "会议纪要",
    description: "上传会议录音，Whisper 转写 + Claude 提炼为要点 / 决定 / 待办的结构化纪要。",
    href: "/tools/meeting-notes",
    icon: AudioLines,
    status: "available",
    tags: ["Whisper", "音频", "结构化输出"],
  },
  {
    slug: "form-gen",
    name: "表单生成器",
    description: "用自然语言描述表单，AI 生成 React Hook Form + Zod schema 代码 + Sandpack 预览。",
    href: "/tools/form-gen",
    icon: FormInput,
    status: "available",
    tags: ["RHF", "Zod", "Sandpack"],
  },
  {
    slug: "sql-explain",
    name: "SQL 解释器",
    description: "粘 SQL 语句，AI 用自然语言解释每个子句 + 找出潜在性能 / 正确性问题。",
    href: "/tools/sql-explain",
    icon: Database,
    status: "available",
    tags: ["SQL", "Markdown", "代码审查"],
  },
  {
    slug: "video-notes",
    name: "视频纪要",
    description: "上传视频（≤ 60MB），Gemini 2.5 Pro 原生多模态处理 —— 时间轴章节 + 要点 + 待办。",
    href: "/tools/video-notes",
    icon: Video,
    status: "available",
    tags: ["视频", "Gemini", "时间轴"],
  },
  {
    slug: "bg-remove",
    name: "图片去背景",
    description: "上传图片，Replicate 851-labs/background-remover 一键扣图，前后对比 + PNG 下载。",
    href: "/tools/bg-remove",
    icon: Eraser,
    status: "available",
    tags: ["Replicate", "图像", "PNG"],
  },
  {
    slug: "json-convert",
    name: "JSON 转换",
    description: "粘 JSON，一键生成 TypeScript 类型 / Zod schema / YAML / 格式化 JSON。零后端、零延迟。",
    href: "/tools/json-convert",
    icon: Braces,
    status: "available",
    tags: ["JSON", "TypeScript", "Zod"],
  },
  {
    slug: "regex-tester",
    name: "正则速练",
    description:
      "粘正则 + 样本文本，实时高亮所有 match、显示捕获组、即时反馈无效语法。还有替换模式。",
    href: "/tools/regex-tester",
    icon: Regex,
    status: "available",
    tags: ["Regex", "替换", "纯前端"],
  },
  {
    slug: "image-palette",
    name: "图像调色板",
    description: "上传图片，视觉模型抽 6 色主调 + 配字体推荐 + mood 描述。一键复制 Tailwind palette。",
    href: "/tools/image-palette",
    icon: Palette,
    status: "available",
    tags: ["多模态", "设计 token", "Gemini"],
  },
]

export const navLinks = [
  { href: "/tools", label: "Tools" },
  { href: "/playground", label: "Playground" },
  { href: "/lab", label: "Lab" },
  { href: "/about", label: "About" },
  { href: "/stats", label: "Stats" },
] as const
