"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import * as THREE from "three"

import { useI18n } from "@/lib/i18n/client"

const PARTICLE_COUNT = 80_000
const BRANCHES = 5
const MAX_RADIUS = 4.0

// Vertex shader: animates a static buffer of (radius, branch-offset, jitter)
// attributes into a live spiral via the uTime uniform. Inner orbits faster
// than outer (rough Keplerian feel).
const VERT = /* glsl */ `
attribute float aRadius;
attribute float aBranchOffset;
attribute vec3  aJitter;
attribute float aSize;

uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;

varying float vRadius;

void main() {
  float r = aRadius;
  // Differential rotation — inner spins faster
  float spin = uTime * (0.22 / (r * 0.5 + 0.18));
  float a = aBranchOffset + r * 1.2 + spin;

  vec3 pos = vec3(
    cos(a) * r + aJitter.x,
    aJitter.y,
    sin(a) * r + aJitter.z
  );

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPos;
  // Perspective-correct point size
  gl_PointSize = aSize * uSize * uPixelRatio * (1.0 / -mvPos.z);

  vRadius = r;
}
`

// Fragment shader: soft circular falloff + radius-driven color gradient.
// Additive blending in the material gives the glowing core.
const FRAG = /* glsl */ `
varying float vRadius;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float dist = length(uv);
  if (dist > 0.5) discard;
  float alpha = smoothstep(0.5, 0.0, dist);

  vec3 inner = vec3(1.00, 0.62, 0.32);  // hot amber core
  vec3 mid   = vec3(0.92, 0.42, 0.90);  // magenta arms
  vec3 outer = vec3(0.32, 0.50, 1.00);  // cold blue halo

  float t = clamp(vRadius / 4.0, 0.0, 1.0);
  vec3 color = mix(inner, mid, smoothstep(0.0, 0.45, t));
  color = mix(color, outer, smoothstep(0.45, 1.0, t));

  // Brightness multiplier — bloom-ish punch toward center
  float intensity = mix(2.4, 0.55, t);
  gl_FragColor = vec4(color * intensity, alpha * 0.85);
}
`

function makeGalaxy(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()
  const positions = new Float32Array(PARTICLE_COUNT * 3) // unused, we compute in vertex shader, but Three.js requires `position`
  const radii = new Float32Array(PARTICLE_COUNT)
  const branchOffsets = new Float32Array(PARTICLE_COUNT)
  const jitters = new Float32Array(PARTICLE_COUNT * 3)
  const sizes = new Float32Array(PARTICLE_COUNT)

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Density falls off toward the rim (power < 1)
    const r = Math.pow(Math.random(), 0.6) * MAX_RADIUS
    const branchIdx = Math.floor(Math.random() * BRANCHES)
    const branchAngle = (branchIdx / BRANCHES) * Math.PI * 2
    const spread = (Math.random() - 0.5) * 0.18

    // Jitter scaled by radius (chaos grows at the rim)
    const jx = (Math.random() - 0.5) * 0.18 * Math.pow(r, 0.8)
    const jy = (Math.random() - 0.5) * 0.06 * Math.pow(r, 0.4)
    const jz = (Math.random() - 0.5) * 0.18 * Math.pow(r, 0.8)

    radii[i] = r
    branchOffsets[i] = branchAngle + spread
    jitters[i * 3] = jx
    jitters[i * 3 + 1] = jy
    jitters[i * 3 + 2] = jz
    sizes[i] = 0.55 + Math.random() * 1.0
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  geo.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1))
  geo.setAttribute("aBranchOffset", new THREE.BufferAttribute(branchOffsets, 1))
  geo.setAttribute("aJitter", new THREE.BufferAttribute(jitters, 3))
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1))
  return geo
}

export function GalaxyClient() {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const [fps, setFps] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const initialW = container.clientWidth
    const initialH = container.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000007)

    const camera = new THREE.PerspectiveCamera(45, initialW / initialH, 0.1, 100)
    camera.position.set(0, 2.6, 6.8)
    camera.lookAt(0, 0, 0)

    const pixelRatio = Math.min(window.devicePixelRatio, 2)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(pixelRatio)
    renderer.setSize(initialW, initialH)
    container.appendChild(renderer.domElement)

    const geometry = makeGalaxy()
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 16 },
        uPixelRatio: { value: pixelRatio },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const galaxy = new THREE.Points(geometry, material)
    galaxy.rotation.x = -0.42
    scene.add(galaxy)

    // Mouse-driven look-around with damping. We rotate the galaxy mesh itself
    // (instead of moving the camera) so the camera frustum stays consistent.
    let targetRotY = 0
    let targetRotX = -0.42
    let currentRotY = 0
    let currentRotX = -0.42

    const onPointerMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = (e.clientY / window.innerHeight) * 2 - 1
      targetRotY = x * 0.7
      targetRotX = -0.42 + y * 0.35
    }
    window.addEventListener("pointermove", onPointerMove)

    const onResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener("resize", onResize)

    const clock = new THREE.Clock()
    let frameCount = 0
    let lastFpsUpdate = performance.now()
    let rafId = 0

    const tick = () => {
      const time = clock.getElapsedTime()
      material.uniforms.uTime.value = time

      // Damped rotation toward target + slow auto-rotation around Y
      currentRotY += (targetRotY - currentRotY) * 0.04
      currentRotX += (targetRotX - currentRotX) * 0.04
      galaxy.rotation.y = currentRotY + time * 0.025
      galaxy.rotation.x = currentRotX

      renderer.render(scene, camera)

      frameCount++
      const now = performance.now()
      if (now - lastFpsUpdate > 500) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)))
        frameCount = 0
        lastFpsUpdate = now
      }

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("resize", onResize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black">
      <div ref={containerRef} className="absolute inset-0" aria-hidden />

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-8">
        <div className="pointer-events-auto flex max-w-md flex-col gap-1.5">
          <Link
            href="/lab"
            className="inline-flex w-fit items-center gap-1.5 font-mono text-xs text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            {t.lab.galaxy.back}
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
            {t.lab.galaxy.title}
          </h1>
          <p className="text-sm text-balance text-zinc-400">{t.lab.galaxy.intro}</p>
        </div>

        <div className="flex flex-col items-end gap-0.5 self-end font-mono text-[10px] text-zinc-500">
          <span>{t.lab.galaxy.particles(PARTICLE_COUNT)}</span>
          <span>{t.lab.galaxy.fps(fps)}</span>
          <span className="text-zinc-600">{t.lab.galaxy.hint}</span>
        </div>
      </div>
    </div>
  )
}
