/**
 * Minimal cookie-based i18n.
 *
 * Why not next-intl: ~70KB gzipped, route-prefix gymnastics, more than we
 * need. A typed dictionary + cookie + reload covers 95% of portfolio i18n.
 *
 * Add a new locale: add a key to `messages` + extend `LOCALES`. TypeScript
 * checks the dictionary shape matches across locales via the `Messages` type.
 */

export const LOCALES = ["zh", "en"] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "zh"

type ToolName =
  | "screenshot-to-code"
  | "url-digest"
  | "model-compare"
  | "code-explain"
  | "mermaid-gen"
  | "pdf-qa"
  | "api-debug"
  | "meeting-notes"
  | "form-gen"
  | "sql-explain"
  | "video-notes"
  | "bg-remove"
  | "json-convert"
  | "regex-tester"
  | "image-palette"

export type Messages = {
  nav: {
    tools: string
    playground: string
    lab: string
    about: string
    stats: string
    github: string
    settings: string
  }
  hero: {
    badge: string
    titleLine2: string
    description: string
    ctaExplore: string
    ctaPlayground: string
    ctaGithub: string
    features: { byok: string; streaming: string; privacy: string }
  }
  toolsGrid: {
    subtitle: string
    title: string
    description: string
    comingSoon: string
  }
  about: {
    badge: string
    title: string
    intro: string
    sections: { principles: string; stack: string; architecture: string; contact: string }
    principles: Array<{
      key: "byok" | "streaming" | "privacy" | "lighthouse"
      title: string
      desc: string
    }>
    stack: Array<{ name: string; desc: string }>
    architecture: Array<{ key: "edge" | "kv" | "rsc"; title: string; desc: string }>
    contact: {
      title: string
      body: string
      githubBtn: string
      emailBtn: string
    }
  }
  commands: {
    placeholder: string
    triggerSearch: string
    open: string
    empty: string
    groups: { tools: string; navigate: string; theme: string }
    tools: { online: string; coming: string; comingToast: string; comingToastBody: string }
    items: { github: string; email: string; theme: { light: string; dark: string; system: string } }
  }
  tools: {
    byok: { needs: string; configure: string; needsOpenAi: string; needsGoogle: string }
    actions: {
      generate: string
      regenerate: string
      cancel: string
      retry: string
      copy: string
      download: string
      share: string
      history: string
      send: string
    }
    forms: {
      modelLabel: string
      languageLabel: string
      historyEmpty: string
      historyHint: string
      historyClearAll: string
      historyClearedToast: string
      shareCopied: string
      shareFailed: string
      noShareSupport: string
      restoreLabel: string
      deleteLabel: string
    }
    sqlExplain: {
      title: string
      description: string
      dialectLabel: string
      dialects: {
        generic: string
        postgres: string
        mysql: string
        sqlite: string
        mssql: string
        bigquery: string
      }
      placeholder: string
      explainBtn: string
      regenerateBtn: string
      outputTitle: string
      outputEmpty: string
      examples: { nPlusOne: string; cte: string }
    }
    screenshotToCode: {
      notePlaceholder: string
      noteLabel: string
      noteOptional: string
      modelLabel: string
      generateBtn: string
      regenerateBtn: string
      shareCopied: string
      shareCopiedDesc: string
      shareFallback: string
      shareFallbackDesc: string
      errorTitle: string
    }
    urlDigest: {
      placeholder: string
      languageZh: string
      languageEn: string
      languageAria: string
      submitBtn: string
      submitLoadingBtn: string
      cacheHitTitle: string
      cacheHitBody: string
      pipelineCaption: string
      cachedBadge: string
      tabs: { summary: string; mindmap: string; meta: string }
      meta: { title: string; author: string; publishedAt: string; wordCount: string; readingTime: string }
      readingMinutes: (n: number) => string
      errorTitle: string
      a11yAnalyzing: string
    }
    modelCompare: {
      description: (maxModels: number) => string
      selectModelsLabel: string
      selectedHint: (n: number, max: number) => string
      promptPlaceholder: string
      advancedToggle: string
      systemPlaceholder: string
      temperatureLabel: string
      runBtn: (n: number) => string
      cancelBtn: string
      configureMissingKeyBtn: string
      maxModelsToast: (max: number) => string
      leaderboardLabel: string
      waitingLabel: string
      footer: { firstToken: string; totalTime: string; tokens: string; cost: string }
      status: { idle: string; streaming: string; done: string; error: string; aborted: string }
    }
    codeExplain: {
      placeholder: string
      languages: {
        auto: string
        typescript: string
        javascript: string
        tsx: string
        python: string
        go: string
        rust: string
        java: string
        sql: string
        bash: string
      }
      explainBtn: string
      regenerateBtn: string
      cancelBtn: string
      outputTitle: string
      outputEmpty: string
      charCount: (n: number) => string
      errorTitle: string
    }
    mermaidGen: {
      typeLabel: string
      types: Record<
        "flowchart" | "sequence" | "class" | "state" | "er" | "mindmap" | "gantt" | "git",
        { label: string; hint: string }
      >
      promptPlaceholder: string
      generateBtn: string
      regenerateBtn: string
      generateLoadingBtn: string
      previewLabel: string
      copySuccess: string
      copyError: string
      loadingEngine: string
      charCount: (n: number) => string
      errorTitle: string
    }
    pdfQa: {
      questionPlaceholder: string
      questionPlaceholderEmpty: string
      questionAria: string
      modelAria: string
      askBtn: string
      cancelBtn: string
      readingHint: string
      suggested: string[]
      errorTitle: string
    }
    apiDebug: {
      urlPlaceholder: string
      sendBtn: string
      cancelBtn: string
      headersToggle: (n: number) => string
      addHeaderBtn: string
      headerEnableAria: string
      headerKeyPlaceholder: string
      headerValuePlaceholder: string
      deleteHeaderAria: string
      bodyPlaceholderPost: string
      bodyPlaceholderOther: string
      generateTitle: string
      generateBtn: string
      generatingBtn: string
      generateHint: string
      copyBodySuccess: string
      copyError: string
      networkErrorMessage: string
      responseHeaders: (n: number) => string
      copyResponseAria: string
      generationFailed: string
    }
    meetingNotes: {
      audioLanguageLabel: string
      languages: { auto: string; zh: string; en: string }
      submitBtn: string
      loadingBtn: string
      regenerateBtn: string
      pipelineCaption: string
      tabs: { summary: string; actions: string; transcript: string }
      sectionPoints: string
      sectionDecisions: string
      noActionItems: string
      transcriptToggle: string
      errorTitle: string
      errorTitleKey: string
      a11yProcessing: string
    }
    formGen: {
      placeholder: string
      examples: string[]
      submitBtn: string
      loadingBtn: string
      regenerateBtn: string
      copySuccess: string
      copyError: string
      filesCount: (n: number) => string
      previewLabel: string
      errorTitle: string
      loadingEngine: string
    }
    videoNotes: {
      outputLanguageLabel: string
      languages: { auto: string; zh: string; en: string }
      submitBtn: string
      loadingBtn: string
      regenerateBtn: string
      pipelineCaption: string
      tabs: { chapters: string; points: string; actions: string }
      noActionItems: string
      errorTitle: string
      errorTitleKey: string
    }
    bgRemove: {
      uploadHint: string
      uploadPickBtn: string
      removeBtn: string
      regenerateBtn: string
      processingBtn: string
      cancelBtn: string
      originalLabel: string
      resultLabel: string
      downloadBtn: string
      downloadFilename: string
      errorTitle: string
      errorTitleKey: string
      keyNote: string
      modelHint: string
      tooLarge: (mb: number) => string
      invalidImage: string
    }
    jsonConvert: {
      placeholder: string
      targetLabel: string
      targets: { typescript: string; zod: string; yaml: string; json5: string }
      rootNameLabel: string
      copyBtn: string
      downloadBtn: string
      copySuccess: string
      copyError: string
      parseError: string
      outputEmpty: string
      examples: { simple: string; nested: string; arrays: string }
      charCount: (n: number) => string
    }
    regexTester: {
      patternLabel: string
      patternPlaceholder: string
      flagsLabel: string
      flagsHint: string
      sampleLabel: string
      samplePlaceholder: string
      examples: { email: string; url: string; date: string; chinese: string }
      summary: (n: number) => string
      noMatch: string
      invalidRegex: string
      replaceLabel: string
      replacePlaceholder: string
      replaceResultLabel: string
      groupsLabel: string
      groupIndex: (i: number) => string
      copyResult: string
    }
    imagePalette: {
      uploadHint: string
      uploadPickBtn: string
      generateBtn: string
      regenerateBtn: string
      processingBtn: string
      cancelBtn: string
      moodLabel: string
      paletteLabel: string
      fontsLabel: string
      copyHexBtn: string
      copyTailwindBtn: string
      copyCssBtn: string
      copyConfirm: string
      tooLarge: (mb: number) => string
      invalidImage: string
      errorTitle: string
      googleFontsLink: string
    }
    states: { streaming: string; loading: string; idle: string }
    errors: { generic: string; network: string }
    byName: Record<ToolName, { name: string; description: string }>
  }
  playground: {
    badge: string
    title: string
    description: string
    promptPlaceholder: string
    systemPlaceholder: string
    advancedToggle: string
    temperature: string
    run: string
    cancel: string
    output: string
    awaitingOutput: string
  }
  stats: {
    badge: string
    title: string
    intro: string
    kvOffline: { headline: string; body: string }
    sections: {
      cumulative: string
      trend: string
      perTool: string
      perModel: string
      perfTargets: string
    }
    cards: {
      totalCalls: string
      totalTokens: string
      outOfPocket: string
      activeModels: string
    }
    trend: {
      empty: string
      noKv: string
      lastNDays: (n: number) => string
      total: (n: string) => string
    }
    perfTargetsNote: string
    perfLabels: {
      lighthousePerf: string
      lighthouseOthers: string
      lcp: string
      firstToken: string
    }
    emptyModelUsage: string
    generated: (ts: string, status: string) => string
    statusActive: string
    statusOffline: string
  }
  notFound: {
    code: string
    title: string
    body: string
    cta: string
  }
  lab: {
    badge: string
    title: string
    intro: string
    sections: Record<"particles" | "keyboard" | "terminal", { index: string; title: string; desc: string }>
    terminal: {
      welcome: (siteName: string) => string
      help: string
      whoami: string
      lsDefault: string
      catNotFound: (file: string) => string
      catEmpty: string
      readmeTagline: string
      readmeToolsLabel: string
      readmeStackLabel: string
      readmePrinciplesLabel: string
      readmeStackValue: string
      readmePrinciplesValue: string
      readmeFooter: (url: string) => string
      toolsJumping: string
      themeChanged: (theme: string) => string
      themeUsage: string
      rmJoke: string
      rmDenied: (path: string) => string
      sudoers: string
      exit: string
      notFound: (cmd: string) => string
      inputAria: string
    }
  }
  byokDialog: {
    trigger: string
    title: string
    descriptionMain: string
    descriptionEmphasis: string
    descriptionTail: string
    clearAll: string
    cancel: string
    save: string
    getKey: string
    placeholderTemplate: (label: string) => string
    savedConfigured: (n: number) => string
    savedNoKeys: string
    clearedTitle: string
    clearedBody: string
    keyUpdatedTitle: string
  }
  footer: { builtWith: string; about: string; stats: string; contact: string }
  common: { switchLocale: string; close: string }
}

const zh: Messages = {
  nav: {
    tools: "工具",
    playground: "Playground",
    lab: "实验室",
    about: "关于",
    stats: "数据",
    github: "GitHub 仓库",
    settings: "设置 API Key",
  },
  hero: {
    badge: "v0.1 · 真的能用，不是 demo",
    titleLine2: "为开发者打造的 AI 工具集合",
    description:
      "为开发者打造的 AI 工具集合 —— 截图转代码、URL 速读、多模型对比、代码解释器、Mermaid 自动生成、PDF 问答、API 调试器、会议纪要，开箱即用。",
    ctaExplore: "探索工具",
    ctaPlayground: "Playground 试一下",
    ctaGithub: "GitHub",
    features: {
      byok: "BYOK · 自带 Key",
      streaming: "全程流式输出",
      privacy: "零追踪 · 不落库",
    },
  },
  toolsGrid: {
    subtitle: "/ tools",
    title: "十五个真的能用的工具",
    description: "打开就能用 · 无需注册 · BYOK 后走你自己的 quota，作者的默认 key 兜底。",
    comingSoon: "Coming",
  },
  about: {
    badge: "/ about",
    title: "关于这个项目",
    intro:
      "这不是『作品集展示页』，而是真的能用的 AI 工具站。每个工具都跑在你浏览器和我的边缘函数之间，没有中间商赚差价。源码完全开源，欢迎抄。",
    sections: {
      principles: "核心原则",
      stack: "技术栈",
      architecture: "架构要点",
      contact: "联系",
    },
    principles: [
      {
        key: "byok",
        title: "BYOK 优先",
        desc: "你的 API Key 只存在 localStorage，永远不会上传到我的服务器。作者默认 key 仅作 quota 兜底。",
      },
      {
        key: "streaming",
        title: "全程流式",
        desc: "AI 调用不允许『转圈等结果』。从 Provider 一路 stream 到浏览器，第一个 token <2s。",
      },
      {
        key: "privacy",
        title: "零追踪",
        desc: "不收集用户内容、不打分析点、不存历史。只在 Vercel KV 记一个匿名计数器用于公开 stats 页。",
      },
      {
        key: "lighthouse",
        title: "Lighthouse 95+",
        desc: "全维度（性能 / 可达性 / 最佳实践 / SEO）≥ 95，移动端 3G 网络可用。",
      },
    ],
    stack: [
      { name: "Next.js 16", desc: "App Router · Turbopack · React Server Components" },
      { name: "TypeScript 5", desc: "strict 模式 · 禁用 any · Zod 运行时校验" },
      { name: "Tailwind CSS 4", desc: "@theme inline · OKLCH 色彩 · 零运行时 CSS" },
      { name: "shadcn/ui (base-nova)", desc: "可复制的组件 + @base-ui/react 原语" },
      { name: "Vercel AI SDK", desc: "多 Provider 统一接口 · 原生流式输出" },
      { name: "cmdk + sonner", desc: "命令面板 + Toast，键盘可达性优先" },
    ],
    architecture: [
      {
        key: "edge",
        title: "Edge 优先",
        desc: "API route 跑在 Vercel Edge，靠近用户。文章抓取 + Readability 提取在边缘节点完成。",
      },
      {
        key: "kv",
        title: "Vercel KV 双用途",
        desc: "缓存（URL 摘要 24h 复用）+ 计数器（公开 stats 透明展示成本）。",
      },
      {
        key: "rsc",
        title: "Server Components 优先",
        desc: "整站 RSC，只把交互（主题切换、命令面板、流式输出）下沉到 client island。",
      },
    ],
    contact: {
      title: "想要源码或讨论实现？",
      body: "GitHub 直接看代码，或者发邮件给我，我会回的。",
      githubBtn: "GitHub",
      emailBtn: "邮件",
    },
  },
  commands: {
    placeholder: "搜索工具、跳转页面、切换主题...",
    triggerSearch: "搜索工具",
    open: "打开命令面板",
    empty: "没有匹配项",
    groups: { tools: "工具", navigate: "跳转", theme: "主题" },
    tools: {
      online: "在线",
      coming: "Coming",
      comingToast: "即将上线",
      comingToastBody: "Phase 4-6 会陆续接入，先看看其他内容",
    },
    items: {
      github: "GitHub 仓库",
      email: "邮件联系",
      theme: { light: "浅色模式", dark: "深色模式", system: "跟随系统" },
    },
  },
  tools: {
    byok: {
      needs: "需要 API Key",
      configure: "配置 BYOK",
      needsOpenAi: "需要 OpenAI Key（Whisper 用）",
      needsGoogle: "需要 Google Gemini Key",
    },
    actions: {
      generate: "生成",
      regenerate: "重新生成",
      cancel: "取消",
      retry: "重试",
      copy: "复制",
      download: "下载",
      share: "分享",
      history: "历史",
      send: "发送",
    },
    forms: {
      modelLabel: "模型",
      languageLabel: "语言",
      historyEmpty: "还没有记录",
      historyHint: "最多保存近 20 条，仅存在你浏览器的 localStorage（不会上传）。",
      historyClearAll: "清空全部",
      historyClearedToast: "历史已清空",
      shareCopied: "分享链接已复制",
      shareFailed: "复制失败",
      noShareSupport: "这个工具暂不支持分享",
      restoreLabel: "恢复",
      deleteLabel: "删除",
    },
    sqlExplain: {
      title: "SQL 解释器",
      description:
        "粘 SQL 语句，AI 用自然语言解释每个子句 + 标出性能 / 正确性问题。支持 6 种方言。",
      dialectLabel: "方言",
      dialects: {
        generic: "通用 SQL",
        postgres: "PostgreSQL",
        mysql: "MySQL / MariaDB",
        sqlite: "SQLite",
        mssql: "SQL Server",
        bigquery: "BigQuery",
      },
      placeholder: "粘贴 SQL …",
      explainBtn: "解释 SQL",
      regenerateBtn: "重新解释",
      outputTitle: "解释 + 审查意见",
      outputEmpty: "粘 SQL → 点 解释 SQL，结构化的解释和审查意见会显示在这里",
      examples: { nPlusOne: "N+1 嫌疑", cte: "复杂 JOIN + CTE" },
    },
    screenshotToCode: {
      notePlaceholder: '例如："用 dark mode"、"卡片用 glass 效果"',
      noteLabel: "附加说明",
      noteOptional: "（可选）",
      modelLabel: "选择视觉模型",
      generateBtn: "生成代码",
      regenerateBtn: "重新生成",
      shareCopied: "分享链接已复制",
      shareCopiedDesc: "对方打开链接即可看到代码 + Sandpack 预览",
      shareFallback: "链接已写入地址栏",
      shareFallbackDesc: "复制粘贴失败，请手动复制地址栏的 URL",
      errorTitle: "生成失败",
    },
    urlDigest: {
      placeholder: "https://news.ycombinator.com/item?id=...",
      languageZh: "中文输出",
      languageEn: "English",
      languageAria: "输出语言",
      submitBtn: "开始速读",
      submitLoadingBtn: "分析中",
      cacheHitTitle: "命中缓存",
      cacheHitBody: "24 小时内的同一 URL 直接复用结果",
      pipelineCaption: "fetching → readability → ai summary",
      cachedBadge: "cached",
      tabs: { summary: "要点摘要", mindmap: "思维导图", meta: "元数据" },
      meta: {
        title: "标题",
        author: "作者",
        publishedAt: "发布时间",
        wordCount: "字数",
        readingTime: "预估阅读时间",
      },
      readingMinutes: (n) => `约 ${n} 分钟`,
      errorTitle: "速读失败",
      a11yAnalyzing: "正在分析 URL",
    },
    modelCompare: {
      description: (max) =>
        `一个 Prompt，最多 ${max} 个模型并发流式响应，并排展示输出 + 响应时间 + tokens + 估算成本。`,
      selectModelsLabel: "选择模型",
      selectedHint: (n, max) => `已选 ${n} / ${max}`,
      promptPlaceholder: "输入 prompt，所有选中的模型会同时跑...",
      advancedToggle: "高级设置（系统提示 / temperature）",
      systemPlaceholder: "可选系统提示词...",
      temperatureLabel: "Temperature",
      runBtn: (n) => `并发运行 ${n} 个模型`,
      cancelBtn: "全部取消",
      configureMissingKeyBtn: "配置缺失的 Key",
      maxModelsToast: (max) => `最多对比 ${max} 个模型`,
      leaderboardLabel: "总耗时排名",
      waitingLabel: "等待响应…",
      footer: { firstToken: "首 token", totalTime: "总耗时", tokens: "tokens", cost: "估算成本" },
      status: {
        idle: "待开始",
        streaming: "流式中",
        done: "完成",
        error: "失败",
        aborted: "已取消",
      },
    },
    codeExplain: {
      placeholder:
        "粘贴代码片段…\n\nfunction quickSort(arr) {\n  if (arr.length <= 1) return arr\n  ...",
      languages: {
        auto: "自动识别",
        typescript: "TypeScript",
        javascript: "JavaScript",
        tsx: "TSX / React",
        python: "Python",
        go: "Go",
        rust: "Rust",
        java: "Java",
        sql: "SQL",
        bash: "Bash / Shell",
      },
      explainBtn: "开始解释",
      regenerateBtn: "重新解释",
      cancelBtn: "取消",
      outputTitle: "解释",
      outputEmpty: "粘上一段代码，点开始解释，AI 流式输出 Markdown 解释会显示在这里",
      charCount: (n) => `${n.toLocaleString()} / 20,000 chars`,
      errorTitle: "解释失败",
    },
    mermaidGen: {
      typeLabel: "图类型",
      types: {
        flowchart: { label: "流程图", hint: "算法 / 业务流程" },
        sequence: { label: "时序图", hint: "API 调用 / 组件交互" },
        class: { label: "类图", hint: "OOP / 数据模型" },
        state: { label: "状态图", hint: "状态机 / UI 状态切换" },
        er: { label: "ER 图", hint: "数据库 schema" },
        mindmap: { label: "思维导图", hint: "知识树 / 决策树" },
        gantt: { label: "甘特图", hint: "项目时间线" },
        git: { label: "Git 图", hint: "分支演示" },
      },
      promptPlaceholder:
        '例如："用户登录的完整流程，包括失败重试和锁账户" / "Stripe 支付的状态机：created → processing → succeeded/failed"',
      generateBtn: "生成",
      regenerateBtn: "重新生成",
      generateLoadingBtn: "生成中…",
      previewLabel: "预览",
      copySuccess: "Mermaid 代码已复制",
      copyError: "复制失败",
      loadingEngine: "加载渲染引擎…",
      charCount: (n) => `${n} / 4,000`,
      errorTitle: "生成失败",
    },
    pdfQa: {
      questionPlaceholder: "提问这份 PDF…",
      questionPlaceholderEmpty: "先上传 PDF",
      questionAria: "问题",
      modelAria: "模型",
      askBtn: "提问",
      cancelBtn: "取消",
      readingHint: "正在阅读 PDF…",
      suggested: [
        "用 5 个 bullet 总结这份文档",
        "这份文档的核心论点是什么？给出原文支撑",
        "找出文档里所有提到日期 / 数字的地方，整理成表格",
        "用一段话向小学生解释这份文档",
      ],
      errorTitle: "提问失败",
    },
    apiDebug: {
      urlPlaceholder: "https://api.example.com/...",
      sendBtn: "发送",
      cancelBtn: "取消",
      headersToggle: (n) => `Headers · ${n} active`,
      addHeaderBtn: "新增 header",
      headerEnableAria: "启用 header",
      headerKeyPlaceholder: "Header",
      headerValuePlaceholder: "Value",
      deleteHeaderAria: "删除 header",
      bodyPlaceholderPost: '{"key":"value"}',
      bodyPlaceholderOther: "请求体（可选）",
      generateTitle: "生成代码片段",
      generateBtn: "AI 生成",
      generatingBtn: "生成中",
      generateHint: "填好请求 → 选目标语言 → 点 AI 生成。代码会带认证 / Content-Type / 错误处理。",
      copyBodySuccess: "响应体已复制",
      copyError: "复制失败",
      networkErrorMessage: "请求失败 — 可能是 CORS / 网络错误",
      responseHeaders: (n) => `Headers · ${n}`,
      copyResponseAria: "复制响应体",
      generationFailed: "代码生成失败",
    },
    meetingNotes: {
      audioLanguageLabel: "音频语言",
      languages: { auto: "自动识别", zh: "中文", en: "English" },
      submitBtn: "生成纪要",
      loadingBtn: "处理中…",
      regenerateBtn: "重新生成",
      pipelineCaption: "whisper transcription → claude summary",
      tabs: { summary: "要点", actions: "待办", transcript: "原文" },
      sectionPoints: "讨论要点",
      sectionDecisions: "达成的决定",
      noActionItems: "这场会没有产出待办事项",
      transcriptToggle: "Whisper 原始转写（点击展开）",
      errorTitle: "处理失败",
      errorTitleKey: "需要 OpenAI Key（Whisper 用）",
      a11yProcessing: "正在处理音频",
    },
    formGen: {
      placeholder: "例如：用户注册表单，需要邮箱、密码（≥8位含字母+数字）、姓名、出生日期、同意条款勾选",
      examples: [
        "用户注册表单：邮箱、密码（至少 8 位，含数字和字母）、确认密码、姓名、生日、勾选'同意条款'",
        "产品反馈表单：评分 1-5 单选、文本反馈（最多 500 字）、邮箱（可选）、'是否愿意被回访'勾选",
        "公司联系表单：公司名、网址、规模（select：1-10、11-50、51-200、200+）、需求描述",
      ],
      submitBtn: "生成表单",
      loadingBtn: "生成中…",
      regenerateBtn: "重新生成",
      copySuccess: "代码已复制",
      copyError: "复制失败",
      filesCount: (n) => `App.tsx · ${n} fields`,
      previewLabel: "实时预览",
      errorTitle: "生成失败",
      loadingEngine: "加载预览引擎…",
    },
    videoNotes: {
      outputLanguageLabel: "输出语言",
      languages: { auto: "自动识别", zh: "中文输出", en: "English output" },
      submitBtn: "生成纪要",
      loadingBtn: "Gemini 阅读中…",
      regenerateBtn: "重新生成",
      pipelineCaption: "uploading video → gemini 2.5 pro analysis",
      tabs: { chapters: "章节", points: "要点", actions: "待办" },
      noActionItems: "这段视频里没找到明确的待办事项",
      errorTitle: "处理失败",
      errorTitleKey: "需要 Google Gemini Key",
    },
    bgRemove: {
      uploadHint: "拖入或粘贴一张图片（JPG / PNG / WEBP，≤ 10MB）",
      uploadPickBtn: "选择图片",
      removeBtn: "去背景",
      regenerateBtn: "重新生成",
      processingBtn: "AI 处理中…",
      cancelBtn: "取消",
      originalLabel: "原图",
      resultLabel: "去背景结果",
      downloadBtn: "下载 PNG",
      downloadFilename: "removed-bg.png",
      errorTitle: "去背景失败",
      errorTitleKey: "需要 Replicate API Key",
      keyNote: "需要 Replicate Key（不在 BYOK 弹窗里，去 .env 配 REPLICATE_API_KEY 或 header x-byok-replicate）。",
      modelHint: "Replicate · 851-labs/background-remover",
      tooLarge: (mb) => `图片超过 ${mb}MB 上限`,
      invalidImage: "请上传 JPG / PNG / WEBP 图片",
    },
    jsonConvert: {
      placeholder: '{\n  "id": 1,\n  "name": "Ada",\n  "tags": ["admin", "active"]\n}',
      targetLabel: "目标格式",
      targets: { typescript: "TypeScript type", zod: "Zod schema", yaml: "YAML", json5: "格式化 JSON" },
      rootNameLabel: "根类型名",
      copyBtn: "复制",
      downloadBtn: "下载",
      copySuccess: "已复制",
      copyError: "复制失败",
      parseError: "解析失败：",
      outputEmpty: "粘 JSON → 选目标格式，结果会显示在这里",
      examples: { simple: "简单对象", nested: "嵌套结构", arrays: "数组样本" },
      charCount: (n) => `${n.toLocaleString()} 字符`,
    },
    regexTester: {
      patternLabel: "正则表达式",
      patternPlaceholder: "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}",
      flagsLabel: "Flags",
      flagsHint: "g · i · m · s · u · y",
      sampleLabel: "测试样本",
      samplePlaceholder: "把要匹配的文本粘进来…",
      examples: {
        email: "邮箱",
        url: "URL",
        date: "日期 YYYY-MM-DD",
        chinese: "中文字符",
      },
      summary: (n) => `匹配 ${n} 处`,
      noMatch: "没有匹配",
      invalidRegex: "正则无效",
      replaceLabel: "替换为",
      replacePlaceholder: "替换内容（支持 $1 $2 反向引用）",
      replaceResultLabel: "替换结果",
      groupsLabel: "捕获组",
      groupIndex: (i) => `组 ${i}`,
      copyResult: "复制结果",
    },
    imagePalette: {
      uploadHint: "拖入或粘贴一张图片（JPG / PNG / WEBP，≤ 5MB）",
      uploadPickBtn: "选择图片",
      generateBtn: "提取调色板",
      regenerateBtn: "重新提取",
      processingBtn: "AI 阅图中…",
      cancelBtn: "取消",
      moodLabel: "Mood / Vibe",
      paletteLabel: "主色 (6)",
      fontsLabel: "字体推荐",
      copyHexBtn: "复制 Hex 数组",
      copyTailwindBtn: "复制 Tailwind 配置",
      copyCssBtn: "复制 CSS 变量",
      copyConfirm: "已复制",
      tooLarge: (mb) => `图片超过 ${mb}MB 上限`,
      invalidImage: "请上传 JPG / PNG / WEBP 图片",
      errorTitle: "提取失败",
      googleFontsLink: "Google Fonts",
    },
    states: { streaming: "streaming", loading: "处理中…", idle: "等待中" },
    errors: {
      generic: "请求失败",
      network: "网络错误，请检查连接",
    },
    byName: {
      "screenshot-to-code": {
        name: "截图转代码",
        description: "上传 UI 截图，AI 流式生成可运行的 React + Tailwind 代码，Sandpack 实时预览。",
      },
      "url-digest": {
        name: "URL 速读",
        description: "粘贴链接，AI 抽取要点 + 生成 Mermaid 思维导图，24 小时缓存复用。",
      },
      "model-compare": {
        name: "多模型对比",
        description: "一个 Prompt，并发流式调用 4 个大模型并排展示，对比响应速度、tokens 与成本。",
      },
      "code-explain": {
        name: "代码解释器",
        description:
          "粘任意语言的代码，AI 流式 Markdown 解释，分块讲清楚做什么 / 为什么 / 怎么改。",
      },
      "mermaid-gen": {
        name: "Mermaid 自动生成",
        description: "用自然语言描述图，AI 生成 Mermaid 源码 + 实时预览，支持 8 种图类型。",
      },
      "pdf-qa": {
        name: "PDF 问答",
        description: "上传 PDF（≤ 15MB），Gemini 2.5 Pro 原生多模态读取并流式回答任何问题。",
      },
      "api-debug": {
        name: "API 调试器",
        description:
          "浏览器内发 HTTP 请求看响应 + AI 一键生成 curl / fetch / Python / axios 代码。",
      },
      "meeting-notes": {
        name: "会议纪要",
        description: "上传会议录音，Whisper 转写 + Claude 提炼为要点 / 决定 / 待办的结构化纪要。",
      },
      "form-gen": {
        name: "表单生成器",
        description:
          "用自然语言描述表单，AI 生成 React Hook Form + Zod schema 代码 + Sandpack 预览。",
      },
      "sql-explain": {
        name: "SQL 解释器",
        description: "粘 SQL 语句，AI 用自然语言解释每个子句 + 找出潜在性能 / 正确性问题。",
      },
      "video-notes": {
        name: "视频纪要",
        description:
          "上传视频（≤ 60MB），Gemini 2.5 Pro 原生多模态处理 —— 时间轴章节 + 要点 + 待办。",
      },
      "bg-remove": {
        name: "图片去背景",
        description: "上传图片，Replicate 851-labs/background-remover 一键扣图，前后对比 + PNG 下载。",
      },
      "json-convert": {
        name: "JSON 转换",
        description: "粘 JSON，一键生成 TypeScript 类型 / Zod schema / YAML / 格式化 JSON。零后端、零延迟。",
      },
      "regex-tester": {
        name: "正则速练",
        description: "粘正则 + 样本文本，实时高亮所有 match、显示捕获组、即时反馈无效语法。还有替换模式。",
      },
      "image-palette": {
        name: "图像调色板",
        description: "上传图片，视觉模型抽 6 色主调 + 配字体推荐 + mood 描述。一键复制 Tailwind palette。",
      },
    },
  },
  playground: {
    badge: "/ playground",
    title: "Playground",
    description: "面向面试官的开放调用台 —— 任意 prompt + 任意模型 + 任意参数。",
    promptPlaceholder: "在这里写 prompt …",
    systemPlaceholder: "可选系统提示词…",
    advancedToggle: "高级参数（system / temperature）",
    temperature: "Temperature",
    run: "运行",
    cancel: "取消",
    output: "输出",
    awaitingOutput: "在左侧写 prompt 然后点运行，AI 输出会流式显示在这里。",
  },
  stats: {
    badge: "/ stats",
    title: "数据透明",
    intro:
      "这页是公开的：每次工具调用 + 每次 token 消耗都进 Vercel KV 计数器，作者自掏腰包跑这些 quota。数据每分钟刷新一次（Next.js ISR）。",
    kvOffline: {
      headline: "未连接 Vercel KV",
      body: "本地环境或未配置 KV_REST_API_URL + KV_REST_API_TOKEN 时，所有计数显示 0。生产部署接入 KV 后自动开始记录。",
    },
    sections: {
      cumulative: "/ cumulative",
      trend: "/ 7-day-trend",
      perTool: "/ per-tool",
      perModel: "/ per-model",
      perfTargets: "/ performance-targets",
    },
    cards: {
      totalCalls: "累计调用",
      totalTokens: "累计 tokens",
      outOfPocket: "作者自掏腰包",
      activeModels: "活跃模型",
    },
    trend: {
      empty: "暂无近 7 天调用记录（连接 KV 后会自动填充）",
      noKv: "暂无近 7 天调用记录（KV 未连接）",
      lastNDays: (n) => `最近 ${n} 天`,
      total: (n) => `· 总计 ${n} 次`,
    },
    perfTargetsNote: "实际跑分见 README 中 Lighthouse 截图。CI 中接入实时跑分是 v2 的计划。",
    perfLabels: {
      lighthousePerf: "Lighthouse Performance",
      lighthouseOthers: "Lighthouse A11y / BP / SEO",
      lcp: "首屏 LCP",
      firstToken: "AI 首 token",
    },
    emptyModelUsage: "暂无 token 记录。一旦有真实调用，按模型分组的成本将出现在这里。",
    generated: (ts, status) => `Generated at ${ts} · 数据来源 Vercel KV · ${status}`,
    statusActive: "active",
    statusOffline: "offline (no KV creds)",
  },
  notFound: {
    code: "404 · NOT_FOUND",
    title: "这里还没建好",
    body: "这个页面在后续 Phase 才会上线，先回首页看看其他内容。",
    cta: "回首页",
  },
  lab: {
    badge: "/ lab",
    title: "实验室",
    intro: "纯前端 demo · 不联网、不调 AI、不收数据。三个小玩意儿，看看浏览器今天能干什么。",
    sections: {
      particles: {
        index: "01",
        title: "粒子互动场",
        desc: "80 个粒子 · 连线 · 鼠标软斥力 · requestAnimationFrame 60fps · 200 行 Canvas 2D。",
      },
      keyboard: {
        index: "02",
        title: "Web Audio 键盘",
        desc: "13 个琴键 (C 大调) · 鼠标点击或键盘 A-K 演奏 · OscillatorNode + 短淡入淡出 · 4 种波形。",
      },
      terminal: {
        index: "03",
        title: "终端模拟器",
        desc: "`help` 看支持的命令 · ↑/↓ 上下翻命令历史 · 试试 `theme dark` 或 `rm -rf /` 看彩蛋。",
      },
    },
    terminal: {
      welcome: (siteName) => `Welcome to ${siteName}. Type \`help\` to begin.`,
      help: `可用命令:
  help                显示这条帮助
  whoami              当前身份
  ls projects         列出工具项目
  cat README          查看 README 摘要
  tools               跳到工具集
  github              打开 GitHub 仓库
  theme [dark|light|system]  切换主题
  date                当前时间
  echo <文本>         回显
  clear               清屏
  rm -rf /            ...（试试看）`,
      whoami: "guest@ai-toolbox · 你正坐在我的作品集前",
      lsDefault: "projects/  README",
      catNotFound: (file) => `cat: ${file}: 找不到文件`,
      catEmpty: "(空)",
      readmeTagline: "工具:",
      readmeToolsLabel: "工具",
      readmeStackLabel: "栈",
      readmePrinciplesLabel: "理念",
      readmeStackValue: "Next.js 16 · TypeScript · Tailwind 4 · shadcn/ui · Vercel AI SDK",
      readmePrinciplesValue: "BYOK · 流式 · 零追踪",
      readmeFooter: (url) => `完整 README 见 GitHub: ${url}`,
      toolsJumping: "跳转到 /tools...",
      themeChanged: (theme) => `主题已切换 → ${theme}`,
      themeUsage: "用法: theme [dark|light|system]",
      rmJoke:
        "nice try. 这里不是你的服务器，rm 没法删我代码。\n→ 想看真的能跑的代码？ github 命令直达。",
      rmDenied: (path) => `rm: ${path}: 权限不足（前端只读）`,
      sudoers: "guest is not in the sudoers file.",
      exit: "Ctrl+C ... 不行你也关不掉这个 demo 😉",
      notFound: (cmd) => `${cmd}: command not found. 试试 \`help\``,
      inputAria: "终端输入",
    },
  },
  byokDialog: {
    trigger: "设置 Key",
    title: "BYOK · 自带 API Key",
    descriptionMain: "Key 只存在你浏览器的 localStorage，",
    descriptionEmphasis: "不会上传到任何服务器",
    descriptionTail: "，请求时通过 HTTP header 直接转发给对应 Provider。留空则使用作者默认 quota（受每日限额）。",
    clearAll: "清除所有 Key",
    cancel: "取消",
    save: "保存",
    getKey: "获取 Key",
    placeholderTemplate: (label) => `${label} API Key (sk-... / ...)`,
    savedConfigured: (n) => `已配置 ${n} 个 Provider，走你自己的 quota`,
    savedNoKeys: "已切换回作者默认 quota（受每日限额）",
    clearedTitle: "已清除所有 BYOK Key",
    clearedBody: "调用会回退到作者默认 quota",
    keyUpdatedTitle: "Key 已更新",
  },
  footer: {
    builtWith: "Built with Next.js, Tailwind & Vercel AI SDK",
    about: "关于",
    stats: "数据",
    contact: "联系",
  },
  common: {
    switchLocale: "切换语言",
    close: "关闭",
  },
}

const en: Messages = {
  nav: {
    tools: "Tools",
    playground: "Playground",
    lab: "Lab",
    about: "About",
    stats: "Stats",
    github: "GitHub repository",
    settings: "API Key settings",
  },
  hero: {
    badge: "v0.1 · Actually works, not a demo",
    titleLine2: "AI tools built for developers",
    description:
      "An AI toolkit for developers — screenshot to code, URL digest, model compare, code explainer, Mermaid generator, PDF Q&A, API debugger, meeting notes. Pick one and use it now.",
    ctaExplore: "Explore tools",
    ctaPlayground: "Try the Playground",
    ctaGithub: "GitHub",
    features: {
      byok: "BYOK · bring your own key",
      streaming: "Streaming everywhere",
      privacy: "Zero tracking",
    },
  },
  toolsGrid: {
    subtitle: "/ tools",
    title: "Fifteen tools that actually work",
    description:
      "Click and use · no signup · BYOK runs on your own quota with my default key as fallback.",
    comingSoon: "Coming",
  },
  about: {
    badge: "/ about",
    title: "About this project",
    intro:
      "This isn't a 'portfolio showcase page' — it's an AI toolkit you can actually use. Every tool runs between your browser and my edge functions, no middleman taking a cut. Fully open source, feel free to copy.",
    sections: {
      principles: "Core Principles",
      stack: "Tech Stack",
      architecture: "Architecture",
      contact: "Contact",
    },
    principles: [
      {
        key: "byok",
        title: "BYOK first",
        desc: "Your API keys stay in localStorage — they never reach my server. The author's default key is just a fallback quota.",
      },
      {
        key: "streaming",
        title: "Streaming end-to-end",
        desc: "No 'spinner waiting for a result'. Tokens stream from provider all the way to the browser; first token < 2s.",
      },
      {
        key: "privacy",
        title: "Zero tracking",
        desc: "No user content collected, no analytics events, no history stored. Only an anonymous counter in Vercel KV, for the public /stats page.",
      },
      {
        key: "lighthouse",
        title: "Lighthouse 95+",
        desc: "All four scores ≥ 95 (Performance · A11y · Best Practices · SEO), usable on mobile 3G.",
      },
    ],
    stack: [
      { name: "Next.js 16", desc: "App Router · Turbopack · React Server Components" },
      { name: "TypeScript 5", desc: "strict mode · no `any` · Zod runtime validation" },
      { name: "Tailwind CSS 4", desc: "@theme inline · OKLCH colors · zero-runtime CSS" },
      {
        name: "shadcn/ui (base-nova)",
        desc: "Copy-pasteable components + @base-ui/react primitives",
      },
      { name: "Vercel AI SDK", desc: "Unified multi-provider interface · native streaming" },
      { name: "cmdk + sonner", desc: "Command palette + toast, keyboard-accessibility first" },
    ],
    architecture: [
      {
        key: "edge",
        title: "Edge first",
        desc: "API routes run on Vercel Edge, close to the user. Article fetching + Readability extraction happen at edge nodes.",
      },
      {
        key: "kv",
        title: "Vercel KV, two uses",
        desc: "Cache (URL digest reuses for 24h) + counter (public /stats transparency about real costs).",
      },
      {
        key: "rsc",
        title: "Server Components first",
        desc: "Entire site is RSC; only interactive bits (theme, command palette, streaming) are client islands.",
      },
    ],
    contact: {
      title: "Want source code or a chat about implementation?",
      body: "Read the code on GitHub, or just email me — I do reply.",
      githubBtn: "GitHub",
      emailBtn: "Email",
    },
  },
  commands: {
    placeholder: "Search tools, navigate, switch theme...",
    triggerSearch: "Search tools",
    open: "Open command palette",
    empty: "No matches",
    groups: { tools: "Tools", navigate: "Navigate", theme: "Theme" },
    tools: {
      online: "online",
      coming: "Coming",
      comingToast: "Coming soon",
      comingToastBody: "Phases 4-6 will bring these online — check out the others meanwhile",
    },
    items: {
      github: "GitHub repository",
      email: "Email me",
      theme: { light: "Light mode", dark: "Dark mode", system: "Follow system" },
    },
  },
  tools: {
    byok: {
      needs: "API key required",
      configure: "Configure BYOK",
      needsOpenAi: "OpenAI key required (for Whisper)",
      needsGoogle: "Google Gemini key required",
    },
    actions: {
      generate: "Generate",
      regenerate: "Regenerate",
      cancel: "Cancel",
      retry: "Retry",
      copy: "Copy",
      download: "Download",
      share: "Share",
      history: "History",
      send: "Send",
    },
    forms: {
      modelLabel: "Model",
      languageLabel: "Language",
      historyEmpty: "No records yet",
      historyHint: "Last 20 entries stay in your browser's localStorage (never uploaded).",
      historyClearAll: "Clear all",
      historyClearedToast: "History cleared",
      shareCopied: "Share link copied",
      shareFailed: "Copy failed",
      noShareSupport: "This tool doesn't support sharing",
      restoreLabel: "Restore",
      deleteLabel: "Delete",
    },
    sqlExplain: {
      title: "SQL Explainer",
      description:
        "Paste a SQL query — AI explains every clause in plain English + flags perf and correctness issues. 6 dialects.",
      dialectLabel: "Dialect",
      dialects: {
        generic: "Generic SQL",
        postgres: "PostgreSQL",
        mysql: "MySQL / MariaDB",
        sqlite: "SQLite",
        mssql: "SQL Server",
        bigquery: "BigQuery",
      },
      placeholder: "Paste SQL here…",
      explainBtn: "Explain SQL",
      regenerateBtn: "Regenerate",
      outputTitle: "Explanation + review notes",
      outputEmpty:
        "Paste SQL → click Explain SQL, the structured explanation and review notes will appear here",
      examples: { nPlusOne: "N+1 suspect", cte: "Complex JOIN + CTE" },
    },
    screenshotToCode: {
      notePlaceholder: 'e.g. "use dark mode", "glass cards"',
      noteLabel: "Extra notes",
      noteOptional: "(optional)",
      modelLabel: "Vision model",
      generateBtn: "Generate code",
      regenerateBtn: "Regenerate",
      shareCopied: "Share link copied",
      shareCopiedDesc: "Open the link to see the code + live Sandpack preview",
      shareFallback: "Link written to address bar",
      shareFallbackDesc: "Clipboard write failed — copy the URL manually",
      errorTitle: "Generation failed",
    },
    urlDigest: {
      placeholder: "https://news.ycombinator.com/item?id=...",
      languageZh: "Chinese",
      languageEn: "English",
      languageAria: "Output language",
      submitBtn: "Digest",
      submitLoadingBtn: "Analyzing",
      cacheHitTitle: "Cache hit",
      cacheHitBody: "Same URL within 24h reuses the previous result",
      pipelineCaption: "fetching → readability → ai summary",
      cachedBadge: "cached",
      tabs: { summary: "Key points", mindmap: "Mindmap", meta: "Metadata" },
      meta: {
        title: "Title",
        author: "Author",
        publishedAt: "Published",
        wordCount: "Words",
        readingTime: "Reading time",
      },
      readingMinutes: (n) => `~${n} min`,
      errorTitle: "Digest failed",
      a11yAnalyzing: "Analyzing URL",
    },
    modelCompare: {
      description: (max) =>
        `One prompt, up to ${max} models streaming in parallel — side-by-side output + latency + tokens + estimated cost.`,
      selectModelsLabel: "Select models",
      selectedHint: (n, max) => `${n} / ${max} selected`,
      promptPlaceholder: "Enter prompt — all selected models will run in parallel...",
      advancedToggle: "Advanced (system prompt / temperature)",
      systemPlaceholder: "Optional system prompt...",
      temperatureLabel: "Temperature",
      runBtn: (n) => `Run ${n} models in parallel`,
      cancelBtn: "Cancel all",
      configureMissingKeyBtn: "Add missing key",
      maxModelsToast: (max) => `Maximum ${max} models per comparison`,
      leaderboardLabel: "Latency ranking",
      waitingLabel: "Waiting for response…",
      footer: { firstToken: "first token", totalTime: "total", tokens: "tokens", cost: "est. cost" },
      status: {
        idle: "idle",
        streaming: "streaming",
        done: "done",
        error: "error",
        aborted: "aborted",
      },
    },
    codeExplain: {
      placeholder:
        "Paste code…\n\nfunction quickSort(arr) {\n  if (arr.length <= 1) return arr\n  ...",
      languages: {
        auto: "Auto-detect",
        typescript: "TypeScript",
        javascript: "JavaScript",
        tsx: "TSX / React",
        python: "Python",
        go: "Go",
        rust: "Rust",
        java: "Java",
        sql: "SQL",
        bash: "Bash / Shell",
      },
      explainBtn: "Explain",
      regenerateBtn: "Regenerate",
      cancelBtn: "Cancel",
      outputTitle: "Explanation",
      outputEmpty:
        "Paste code, click Explain — the streamed Markdown explanation will appear here",
      charCount: (n) => `${n.toLocaleString()} / 20,000 chars`,
      errorTitle: "Explanation failed",
    },
    mermaidGen: {
      typeLabel: "Diagram type",
      types: {
        flowchart: { label: "Flowchart", hint: "Algorithm / business flow" },
        sequence: { label: "Sequence", hint: "API calls / interactions" },
        class: { label: "Class", hint: "OOP / data model" },
        state: { label: "State", hint: "State machine / UI states" },
        er: { label: "ER", hint: "Database schema" },
        mindmap: { label: "Mindmap", hint: "Knowledge / decision tree" },
        gantt: { label: "Gantt", hint: "Project timeline" },
        git: { label: "Git", hint: "Branching demo" },
      },
      promptPlaceholder:
        'e.g. "Full user login flow with retry and account lockout" / "Stripe payment state machine: created → processing → succeeded/failed"',
      generateBtn: "Generate",
      regenerateBtn: "Regenerate",
      generateLoadingBtn: "Generating…",
      previewLabel: "Preview",
      copySuccess: "Mermaid source copied",
      copyError: "Copy failed",
      loadingEngine: "Loading render engine…",
      charCount: (n) => `${n} / 4,000`,
      errorTitle: "Generation failed",
    },
    pdfQa: {
      questionPlaceholder: "Ask this PDF anything…",
      questionPlaceholderEmpty: "Upload a PDF first",
      questionAria: "Question",
      modelAria: "Model",
      askBtn: "Ask",
      cancelBtn: "Cancel",
      readingHint: "Reading the PDF…",
      suggested: [
        "Summarize this document in 5 bullets",
        "What's the core argument? Quote supporting passages",
        "Extract every date and number into a table",
        "Explain this document to a 5th grader in one paragraph",
      ],
      errorTitle: "Question failed",
    },
    apiDebug: {
      urlPlaceholder: "https://api.example.com/...",
      sendBtn: "Send",
      cancelBtn: "Cancel",
      headersToggle: (n) => `Headers · ${n} active`,
      addHeaderBtn: "Add header",
      headerEnableAria: "Enable header",
      headerKeyPlaceholder: "Header",
      headerValuePlaceholder: "Value",
      deleteHeaderAria: "Delete header",
      bodyPlaceholderPost: '{"key":"value"}',
      bodyPlaceholderOther: "Request body (optional)",
      generateTitle: "Generate code snippet",
      generateBtn: "AI generate",
      generatingBtn: "Generating",
      generateHint:
        "Fill the request → pick target language → click AI generate. Includes auth / Content-Type / error handling.",
      copyBodySuccess: "Response body copied",
      copyError: "Copy failed",
      networkErrorMessage: "Request failed — possibly CORS / network error",
      responseHeaders: (n) => `Headers · ${n}`,
      copyResponseAria: "Copy response body",
      generationFailed: "Code generation failed",
    },
    meetingNotes: {
      audioLanguageLabel: "Audio language",
      languages: { auto: "Auto-detect", zh: "Chinese", en: "English" },
      submitBtn: "Generate notes",
      loadingBtn: "Processing…",
      regenerateBtn: "Regenerate",
      pipelineCaption: "whisper transcription → claude summary",
      tabs: { summary: "Summary", actions: "TODOs", transcript: "Transcript" },
      sectionPoints: "Discussion points",
      sectionDecisions: "Decisions reached",
      noActionItems: "No action items came out of this meeting",
      transcriptToggle: "Raw Whisper transcript (click to expand)",
      errorTitle: "Processing failed",
      errorTitleKey: "OpenAI key required (for Whisper)",
      a11yProcessing: "Processing audio",
    },
    formGen: {
      placeholder:
        "e.g. registration form — email, password (≥8 chars, letters + numbers), name, DOB, accept terms checkbox",
      examples: [
        "Registration: email, password (8+ chars, letters + digits), confirm, name, DOB, 'accept terms' checkbox",
        "Product feedback: rating 1-5 radio, text (≤500 chars), email (optional), 'OK to follow-up' checkbox",
        "Company contact: company name, website, size (select: 1-10, 11-50, 51-200, 200+), needs description",
      ],
      submitBtn: "Generate form",
      loadingBtn: "Generating…",
      regenerateBtn: "Regenerate",
      copySuccess: "Code copied",
      copyError: "Copy failed",
      filesCount: (n) => `App.tsx · ${n} fields`,
      previewLabel: "Live preview",
      errorTitle: "Generation failed",
      loadingEngine: "Loading preview engine…",
    },
    videoNotes: {
      outputLanguageLabel: "Output language",
      languages: { auto: "Auto-detect", zh: "Chinese", en: "English" },
      submitBtn: "Generate notes",
      loadingBtn: "Gemini reading…",
      regenerateBtn: "Regenerate",
      pipelineCaption: "uploading video → gemini 2.5 pro analysis",
      tabs: { chapters: "Chapters", points: "Key points", actions: "TODOs" },
      noActionItems: "No clear action items in this video",
      errorTitle: "Processing failed",
      errorTitleKey: "Google Gemini key required",
    },
    bgRemove: {
      uploadHint: "Drop or paste an image (JPG / PNG / WEBP, ≤10MB)",
      uploadPickBtn: "Pick image",
      removeBtn: "Remove background",
      regenerateBtn: "Regenerate",
      processingBtn: "AI working…",
      cancelBtn: "Cancel",
      originalLabel: "Original",
      resultLabel: "Background removed",
      downloadBtn: "Download PNG",
      downloadFilename: "removed-bg.png",
      errorTitle: "Background removal failed",
      errorTitleKey: "Replicate API key required",
      keyNote:
        "Needs a Replicate key (not in the BYOK dialog). Set REPLICATE_API_KEY in .env or pass x-byok-replicate header.",
      modelHint: "Replicate · 851-labs/background-remover",
      tooLarge: (mb) => `Image exceeds ${mb}MB limit`,
      invalidImage: "Please upload a JPG / PNG / WEBP image",
    },
    jsonConvert: {
      placeholder: '{\n  "id": 1,\n  "name": "Ada",\n  "tags": ["admin", "active"]\n}',
      targetLabel: "Target format",
      targets: { typescript: "TypeScript type", zod: "Zod schema", yaml: "YAML", json5: "Formatted JSON" },
      rootNameLabel: "Root name",
      copyBtn: "Copy",
      downloadBtn: "Download",
      copySuccess: "Copied",
      copyError: "Copy failed",
      parseError: "Parse error: ",
      outputEmpty: "Paste JSON → pick a target format. Result appears here.",
      examples: { simple: "Simple object", nested: "Nested", arrays: "Arrays" },
      charCount: (n) => `${n.toLocaleString()} chars`,
    },
    regexTester: {
      patternLabel: "Regex pattern",
      patternPlaceholder: "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}",
      flagsLabel: "Flags",
      flagsHint: "g · i · m · s · u · y",
      sampleLabel: "Sample text",
      samplePlaceholder: "Paste the text you want to match…",
      examples: {
        email: "Email",
        url: "URL",
        date: "Date YYYY-MM-DD",
        chinese: "Chinese chars",
      },
      summary: (n) => `${n} matches`,
      noMatch: "No matches",
      invalidRegex: "Invalid regex",
      replaceLabel: "Replace with",
      replacePlaceholder: "Replacement (supports $1 $2 back-references)",
      replaceResultLabel: "Replace result",
      groupsLabel: "Capture groups",
      groupIndex: (i) => `Group ${i}`,
      copyResult: "Copy result",
    },
    imagePalette: {
      uploadHint: "Drop or paste an image (JPG / PNG / WEBP, ≤ 5MB)",
      uploadPickBtn: "Pick image",
      generateBtn: "Extract palette",
      regenerateBtn: "Regenerate",
      processingBtn: "AI reading…",
      cancelBtn: "Cancel",
      moodLabel: "Mood / Vibe",
      paletteLabel: "Palette (6)",
      fontsLabel: "Font picks",
      copyHexBtn: "Copy hex array",
      copyTailwindBtn: "Copy Tailwind config",
      copyCssBtn: "Copy CSS variables",
      copyConfirm: "Copied",
      tooLarge: (mb) => `Image exceeds ${mb}MB limit`,
      invalidImage: "Please upload a JPG / PNG / WEBP image",
      errorTitle: "Extraction failed",
      googleFontsLink: "Google Fonts",
    },
    states: { streaming: "streaming", loading: "Processing…", idle: "Waiting" },
    errors: {
      generic: "Request failed",
      network: "Network error, please check your connection",
    },
    byName: {
      "screenshot-to-code": {
        name: "Screenshot to Code",
        description:
          "Upload a UI screenshot — AI streams runnable React + Tailwind code with a live Sandpack preview.",
      },
      "url-digest": {
        name: "URL Digest",
        description:
          "Paste a link — AI extracts the key points + a Mermaid mindmap. Same URL is cached for 24h.",
      },
      "model-compare": {
        name: "Model Compare",
        description:
          "One prompt, 4 models in parallel — compare speed, tokens, and estimated cost side by side.",
      },
      "code-explain": {
        name: "Code Explainer",
        description:
          "Paste code in any language — AI streams a Markdown explanation: what it does, why, and how to improve.",
      },
      "mermaid-gen": {
        name: "Mermaid Generator",
        description:
          "Describe a diagram in plain English — AI produces valid Mermaid source + live preview. 8 chart types.",
      },
      "pdf-qa": {
        name: "PDF Q&A",
        description:
          "Upload a PDF (≤15MB). Gemini 2.5 Pro reads it natively and answers any question, citing page numbers.",
      },
      "api-debug": {
        name: "API Debugger",
        description:
          "Fire HTTP requests from your browser + AI generates curl / fetch / Python / axios snippets.",
      },
      "meeting-notes": {
        name: "Meeting Notes",
        description:
          "Upload audio — Whisper transcribes + Claude distills into bullets, decisions, and action items.",
      },
      "form-gen": {
        name: "Form Generator",
        description:
          "Describe a form in plain English — AI generates React Hook Form + Zod schema + live Sandpack preview.",
      },
      "sql-explain": {
        name: "SQL Explainer",
        description:
          "Paste a SQL query — AI explains every clause in plain English + flags perf and correctness issues.",
      },
      "video-notes": {
        name: "Video Notes",
        description:
          "Upload a video (≤60MB). Gemini 2.5 Pro processes it natively — timestamped chapters + key points + action items, no transcribe step.",
      },
      "bg-remove": {
        name: "Background Remover",
        description:
          "Upload an image — Replicate 851-labs/background-remover wipes the background, side-by-side compare + PNG download.",
      },
      "json-convert": {
        name: "JSON Converter",
        description:
          "Paste JSON — instantly get TypeScript types / Zod schemas / YAML / pretty JSON. Zero backend, zero latency.",
      },
      "regex-tester": {
        name: "Regex Tester",
        description:
          "Paste a pattern + sample — highlights every match in real time, shows capture groups, instant feedback on invalid syntax. Replace mode included.",
      },
      "image-palette": {
        name: "Image Palette",
        description:
          "Upload an image — a vision model extracts a 6-color palette + font picks + mood description. One-click copy to Tailwind / CSS / hex.",
      },
    },
  },
  playground: {
    badge: "/ playground",
    title: "Playground",
    description: "Open call console for interviewers: any prompt + any model + any parameters.",
    promptPlaceholder: "Write your prompt here…",
    systemPlaceholder: "Optional system prompt…",
    advancedToggle: "Advanced (system / temperature)",
    temperature: "Temperature",
    run: "Run",
    cancel: "Cancel",
    output: "Output",
    awaitingOutput: "Write a prompt on the left and hit run — the AI output will stream here.",
  },
  stats: {
    badge: "/ stats",
    title: "Transparent stats",
    intro:
      "Public dashboard: every tool call + token spent is counted in Vercel KV. The author pays for that quota out of pocket. ISR — refreshes once a minute.",
    kvOffline: {
      headline: "Vercel KV not connected",
      body: "When running locally without KV_REST_API_URL + KV_REST_API_TOKEN, all counters read 0. Production deploys with KV start recording automatically.",
    },
    sections: {
      cumulative: "/ cumulative",
      trend: "/ 7-day-trend",
      perTool: "/ per-tool",
      perModel: "/ per-model",
      perfTargets: "/ performance-targets",
    },
    cards: {
      totalCalls: "Total calls",
      totalTokens: "Total tokens",
      outOfPocket: "Out of pocket",
      activeModels: "Active models",
    },
    trend: {
      empty: "No calls in the last 7 days yet (will populate once KV is connected)",
      noKv: "No calls in the last 7 days yet (KV not connected)",
      lastNDays: (n) => `Last ${n} days`,
      total: (n) => `· ${n} total`,
    },
    perfTargetsNote:
      "See the Lighthouse screenshot in the README for real scores. CI-integrated scoring is on the v2 roadmap.",
    perfLabels: {
      lighthousePerf: "Lighthouse Performance",
      lighthouseOthers: "Lighthouse A11y / BP / SEO",
      lcp: "First-screen LCP",
      firstToken: "AI first token",
    },
    emptyModelUsage:
      "No token records yet. Per-model cost breakdown will appear here after the first real call.",
    generated: (ts, status) => `Generated at ${ts} · Vercel KV · ${status}`,
    statusActive: "active",
    statusOffline: "offline (no KV creds)",
  },
  notFound: {
    code: "404 · NOT_FOUND",
    title: "Nothing here (yet)",
    body: "This page hasn't been built. Head back home for the working tools.",
    cta: "Back home",
  },
  lab: {
    badge: "/ lab",
    title: "Lab",
    intro:
      "Pure frontend demos · no network, no AI, no data collection. Three little toys showing what a browser can do today.",
    sections: {
      particles: {
        index: "01",
        title: "Particle field",
        desc: "80 particles · connecting lines · soft cursor repel · requestAnimationFrame 60fps · 200 lines of Canvas 2D.",
      },
      keyboard: {
        index: "02",
        title: "Web Audio keyboard",
        desc: "13 keys (C major) · click or press A-K to play · OscillatorNode + short fade in/out · 4 waveforms.",
      },
      terminal: {
        index: "03",
        title: "Terminal emulator",
        desc: "`help` to list commands · ↑/↓ history · try `theme dark` or `rm -rf /` for Easter eggs.",
      },
    },
    terminal: {
      welcome: (siteName) => `Welcome to ${siteName}. Type \`help\` to begin.`,
      help: `Available commands:
  help                show this help
  whoami              who am I
  ls projects         list tool projects
  cat README          show README summary
  tools               jump to /tools
  github              open GitHub repository
  theme [dark|light|system]  switch theme
  date                current time
  echo <text>         echo back
  clear               clear screen
  rm -rf /            ...(try it)`,
      whoami: "guest@ai-toolbox · you're sitting in front of my portfolio",
      lsDefault: "projects/  README",
      catNotFound: (file) => `cat: ${file}: no such file`,
      catEmpty: "(empty)",
      readmeTagline: "Tools:",
      readmeToolsLabel: "Tools",
      readmeStackLabel: "Stack",
      readmePrinciplesLabel: "Principles",
      readmeStackValue: "Next.js 16 · TypeScript · Tailwind 4 · shadcn/ui · Vercel AI SDK",
      readmePrinciplesValue: "BYOK · streaming · zero tracking",
      readmeFooter: (url) => `Full README on GitHub: ${url}`,
      toolsJumping: "Jumping to /tools...",
      themeChanged: (theme) => `Theme switched → ${theme}`,
      themeUsage: "Usage: theme [dark|light|system]",
      rmJoke:
        "nice try. This isn't your server, rm can't delete my code.\n→ Want the real code? `github` takes you there.",
      rmDenied: (path) => `rm: ${path}: permission denied (frontend read-only)`,
      sudoers: "guest is not in the sudoers file.",
      exit: "Ctrl+C ... can't close this demo either 😉",
      notFound: (cmd) => `${cmd}: command not found. Try \`help\``,
      inputAria: "Terminal input",
    },
  },
  byokDialog: {
    trigger: "Set Key",
    title: "BYOK · Bring Your Own API Key",
    descriptionMain: "Keys stay in your browser's localStorage — ",
    descriptionEmphasis: "never uploaded to any server",
    descriptionTail:
      ". Forwarded to each Provider via HTTP header at request time. Leave blank to use the author's default quota (rate-limited).",
    clearAll: "Clear all keys",
    cancel: "Cancel",
    save: "Save",
    getKey: "Get key",
    placeholderTemplate: (label) => `${label} API Key (sk-... / ...)`,
    savedConfigured: (n) => `${n} provider${n === 1 ? "" : "s"} configured, using your own quota`,
    savedNoKeys: "Switched back to the author's default quota (rate-limited)",
    clearedTitle: "All BYOK keys cleared",
    clearedBody: "Requests will fall back to the author's default quota",
    keyUpdatedTitle: "Keys updated",
  },
  footer: {
    builtWith: "Built with Next.js, Tailwind & Vercel AI SDK",
    about: "About",
    stats: "Stats",
    contact: "Contact",
  },
  common: {
    switchLocale: "Switch language",
    close: "Close",
  },
}

const messages: Record<Locale, Messages> = { zh, en }

export function getMessages(locale: Locale): Messages {
  return messages[locale]
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value)
}
