import type { Metadata } from "next"

import { GalaxyClient } from "./galaxy-client"

export const metadata: Metadata = {
  title: "Galaxy · 实验室",
  description:
    "8 万粒子 + 自定义 GLSL shader 实时绘制的螺旋星系，鼠标驱动旋转，60fps。Three.js + WebGL。",
}

export default function Page() {
  return <GalaxyClient />
}
