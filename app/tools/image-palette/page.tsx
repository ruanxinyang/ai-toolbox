import type { Metadata } from "next"

import { ImagePaletteClient } from "./image-palette-client"

export const metadata: Metadata = {
  title: "图像调色板",
  description:
    "上传图片，视觉模型抽 6 色主调 + 配字体推荐 + mood 描述。一键复制 Tailwind palette。",
}

export default function Page() {
  return <ImagePaletteClient />
}
