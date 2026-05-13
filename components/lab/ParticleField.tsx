"use client"

import { useEffect, useRef } from "react"

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
}

const COUNT = 80
const MAX_DISTANCE = 140

function createParticles(width: number, height: number): Particle[] {
  return Array.from({ length: COUNT }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    size: Math.random() * 1.5 + 0.8,
  }))
}

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    let particles: Particle[] = []
    let mouse = { x: -1000, y: -1000 }
    let dpr = window.devicePixelRatio || 1

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (particles.length === 0) {
        particles = createParticles(rect.width, rect.height)
      }
    }

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const onLeave = () => {
      mouse = { x: -1000, y: -1000 }
    }

    const tick = () => {
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      // Update positions, push away from mouse softly.
      for (const p of particles) {
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.hypot(dx, dy)
        if (dist < MAX_DISTANCE && dist > 0) {
          const force = (MAX_DISTANCE - dist) / MAX_DISTANCE
          p.vx -= (dx / dist) * force * 0.08
          p.vy -= (dy / dist) * force * 0.08
        }
        // Gentle friction.
        p.vx *= 0.985
        p.vy *= 0.985
        p.x += p.vx
        p.y += p.vy
        // Wrap around edges.
        if (p.x < 0) p.x = rect.width
        if (p.x > rect.width) p.x = 0
        if (p.y < 0) p.y = rect.height
        if (p.y > rect.height) p.y = 0
      }

      // Draw connection lines.
      ctx.strokeStyle = "oklch(0.541 0.281 293.009 / 0.18)"
      ctx.lineWidth = 0.5
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < 90) {
            ctx.globalAlpha = 1 - d / 90
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
      ctx.globalAlpha = 1

      // Draw particle dots.
      ctx.fillStyle = "oklch(0.541 0.281 293.009 / 0.7)"
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(tick)
    }

    resize()
    raf = requestAnimationFrame(tick)
    window.addEventListener("resize", resize)
    canvas.addEventListener("pointermove", onPointer)
    canvas.addEventListener("pointerleave", onLeave)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      canvas.removeEventListener("pointermove", onPointer)
      canvas.removeEventListener("pointerleave", onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-label="鼠标互动粒子动画"
      className="bg-card/30 border-border/60 block size-full min-h-[320px] cursor-crosshair rounded-lg border"
    />
  )
}
