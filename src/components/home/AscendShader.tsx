"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  OrthographicCamera,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
  Vector3,
  Scene,
  Mesh,
  WebGLRenderTarget,
  LinearFilter,
  RGBAFormat,
  UnsignedByteType,
  WebGLRenderer,
  NoBlending,
  CustomBlending,
  OneFactor,
  OneMinusSrcAlphaFactor,
} from "three";

export interface AscendShaderProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: number;
  scale?: number;
  rocketScale?: number;
  density?: number;
  warmColor?: string;
  coolColor?: string;
  pulse?: boolean;
  pulseSize?: number;
  drift?: number;
  interactive?: boolean;
  interactiveStrength?: number;
  pulseRate?: number;
  pulseGap?: number;
  offsetX?: number;
  offsetY?: number;
  highpower?: boolean;
}

function resolveCSSColor(value: string): [number, number, number] {
  const el = document.createElement("div");
  el.style.cssText = `position:absolute;width:0;height:0;color:${value}`;
  document.body.appendChild(el);
  const computed = getComputedStyle(el).color;
  document.body.removeChild(el);

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = computed;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

const RENDER_SCALE = 0.5;

// ─── Raymarch GLSL (ported from WGSL) ───────────────────────────────────────
const marchVertexShader = /* glsl */ `
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

const marchFragmentShader = /* glsl */ `
precision highp float;

uniform float iTime;
uniform float u_speed;
uniform vec2 iResolution;
uniform vec3 u_warmColor;
uniform float u_rocketScale;
uniform vec3 u_coolColor;
uniform float u_scale;
uniform float u_density;
uniform float u_pulse;
uniform float u_pulseSize;
uniform float u_drift;
uniform float u_mouse_x;
uniform float u_mouse_y;
uniform float u_interactive;
uniform float u_mouse_strength;
uniform float u_pulse_rate;
uniform float u_pulse_gap;
uniform float u_offset_x;
uniform float u_offset_y;

// tanh polyfill for WebGL1 compatibility
vec3 tanhv(vec3 x) {
  vec3 e = exp(2.0 * x);
  return (e - 1.0) / (e + 1.0);
}

float N(vec3 p, float a, float x, float y) {
  return abs(dot(sin(p * (x / a)), vec3(a * y)));
}

void main() {
  vec2 P_raw = gl_FragCoord.xy;
  vec2 R = iResolution;
  float T = iTime * u_speed;

  vec2 P = P_raw - vec2(u_offset_x, -u_offset_y) * R;

  vec3 hdrWarm = u_warmColor * 3.0;
  vec3 hdrCool = u_coolColor * 3.0;

  vec3 o = vec3(0.0);
  float k = 0.0;

  vec3 dir = normalize(vec3(P * 2.0 - R, R.y));
  float camZ = 3.0 / u_scale;

  float beaconFlash = 0.0;
  if (u_pulse > 0.5) {
    float phase = fract(iTime * u_pulse_rate);
    float f1 = exp(-pow((phase - 0.04) * 7.0, 2.0));
    float f2 = exp(-pow((phase - (0.04 + u_pulse_gap)) * 7.0, 2.0));
    beaconFlash = max(f1, f2);
  }

  for (float i = 1.0; i <= 100.0; i += 1.0) {
    vec3 p = dir * i * 0.05;
    p.z -= camZ;

    vec3 q = p - vec3(1.5, 0.7, 0.0);
    float s = length(q);
    q.y = p.y - min(p.y, 0.7);
    float lv = length(q) / u_rocketScale;

    if (u_interactive > 0.5) {
      float pFactor = (1.0 - i / 100.0) * (1.0 - i / 100.0) * u_mouse_strength;
      p.x -= u_mouse_x * 0.5 * pFactor;
      p.y -= u_mouse_y * 0.3 * pFactor;
    }

    p.y += T;
    p.x += T * u_drift;

    float d = min(length(p.xz), 1.0 - p.z) / u_rocketScale;

    float a = 0.01;
    for (int j = 0; j < 9; j++) {
      float pz = p.z;
      float py = p.y;
      p.z = 0.1 * ( 8.0 * pz + 6.0 * py);
      p.y = 0.1 * (-6.0 * pz + 8.0 * py);
      d  -= N(p, a, 4.0, 0.2);
      lv -= N(p, a, 5.0, 0.01);
      a  *= 2.0;
    }

    float x = max(2.0 - lv, 0.0) * 0.8;
    vec3 cloudColor = mix(hdrCool, hdrWarm, x);

    d       = min(d, 0.0);
    float ac = d * k - d;
    k      += ac;
    o      += ac * exp(-s * 1.3) * (cloudColor + cloudColor * ac);

    d       = lv;
    d       = min(d, 0.0);
    float ar = d * k - d;
    k      += ar;
    o      += ar * exp(-s * 1.3) * (hdrWarm * 20.0 + hdrWarm * 20.0 * ar);

    o += (x - x * k) / s / 400.0;

    if (k > 0.99) break;
  }

  vec3 rgb = tanhv(o * u_density);

  if (beaconFlash > 0.0001) {
    vec3 rocketOffset = vec3(1.5, 0.7, camZ);
    float minDist = length(rocketOffset - dot(rocketOffset, dir) * dir);
    float nd = minDist / (u_rocketScale * u_pulseSize);
    float glow = exp(-nd * nd * 0.4) * 0.8;
    rgb = clamp(rgb + glow * beaconFlash, vec3(0.0), vec3(1.0));
  }

  float maxC = max(rgb.r, max(rgb.g, rgb.b));
  float alpha = clamp(maxC * 2.5, 0.0, 1.0);

  gl_FragColor = vec4(rgb * alpha, alpha);
}
`;

// ─── Blit / upscale shader ──────────────────────────────────────────────────
const blitVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const blitFragmentShader = /* glsl */ `
precision highp float;
uniform sampler2D tDiffuse;
varying vec2 vUv;
void main() {
  gl_FragColor = texture2D(tDiffuse, vUv);
}
`;

export default function AscendShader({
  className,
  speed = 0.3,
  scale = 1.0,
  rocketScale = 1.0,
  density = 1.0,
  warmColor = "var(--color-orange-400)",
  coolColor = "var(--color-blue-500)",
  pulse = false,
  pulseSize = 1.0,
  drift = 0.2,
  interactive = false,
  interactiveStrength = 1.0,
  pulseRate = 0.7,
  pulseGap = 0.14,
  offsetX = 0,
  offsetY = 0,
  highpower = false,
  ...props
}: AscendShaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;
    let isVisible = true;
    let frameCount = 0;
    const MARCH_EVERY = highpower ? 1 : 3;
    const start = performance.now();

    // Mouse parallax state
    let mouseTarget = { x: 0, y: 0 };
    let mouseSmoothed = { x: 0, y: 0 };

    const onMouseMove = (e: MouseEvent) => {
      if (!isVisible) return;
      mouseTarget.x = e.clientX / window.innerWidth - 0.5;
      mouseTarget.y = e.clientY / window.innerHeight - 0.5;
    };
    if (interactive) window.addEventListener("mousemove", onMouseMove);

    // Resolve CSS colors once
    const warm = resolveCSSColor(warmColor);
    const cool = resolveCSSColor(coolColor);

    // ── Three.js setup ────────────────────────────────────────────────────────
    const canvas = document.createElement("canvas");
    canvas.className = "w-full h-full";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.appendChild(canvas);

    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new PlaneGeometry(2, 2);

    // ── March material (raymarch shader) ──────────────────────────────────────
    const uniforms = {
      iTime: { value: 0 },
      u_speed: { value: speed },
      iResolution: { value: new Vector2(1, 1) },
      u_warmColor: { value: new Vector3(warm[0], warm[1], warm[2]) },
      u_rocketScale: { value: rocketScale },
      u_coolColor: { value: new Vector3(cool[0], cool[1], cool[2]) },
      u_scale: { value: scale },
      u_density: { value: density },
      u_pulse: { value: pulse ? 1.0 : 0.0 },
      u_pulseSize: { value: pulseSize },
      u_drift: { value: drift },
      u_mouse_x: { value: 0 },
      u_mouse_y: { value: 0 },
      u_interactive: { value: interactive ? 1.0 : 0.0 },
      u_mouse_strength: { value: interactiveStrength },
      u_pulse_rate: { value: pulseRate },
      u_pulse_gap: { value: pulseGap },
      u_offset_x: { value: offsetX },
      u_offset_y: { value: offsetY },
    };

    const marchMaterial = new ShaderMaterial({
      uniforms,
      vertexShader: marchVertexShader,
      fragmentShader: marchFragmentShader,
      depthTest: false,
      depthWrite: false,
      blending: NoBlending,
    });

    const marchScene = new Scene();
    marchScene.add(new Mesh(geometry, marchMaterial));

    // ── Render target (half-res offscreen) ────────────────────────────────────
    let renderTarget = new WebGLRenderTarget(1, 1, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      type: UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
    });

    // ── Blit material (upscale to canvas) ─────────────────────────────────────
    const blitMaterial = new ShaderMaterial({
      uniforms: { tDiffuse: { value: renderTarget.texture } },
      vertexShader: blitVertexShader,
      fragmentShader: blitFragmentShader,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      blending: CustomBlending,
      blendSrc: OneFactor,
      blendDst: OneMinusSrcAlphaFactor,
      blendSrcAlpha: OneFactor,
      blendDstAlpha: OneMinusSrcAlphaFactor,
    });

    const blitScene = new Scene();
    blitScene.add(new Mesh(geometry, blitMaterial));

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
    });
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1));

    // ── Resize ────────────────────────────────────────────────────────────────
    const resize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h, false);

      const pixelW = Math.max(1, Math.round(w * Math.min(devicePixelRatio, 1)));
      const pixelH = Math.max(1, Math.round(h * Math.min(devicePixelRatio, 1)));
      const rtW = Math.max(1, Math.round(pixelW * RENDER_SCALE));
      const rtH = Math.max(1, Math.round(pixelH * RENDER_SCALE));

      renderTarget.dispose();
      renderTarget = new WebGLRenderTarget(rtW, rtH, {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBAFormat,
        type: UnsignedByteType,
        depthBuffer: false,
        stencilBuffer: false,
      });
      blitMaterial.uniforms.tDiffuse.value = renderTarget.texture;
      uniforms.iResolution.value.set(rtW, rtH);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const io = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0 });
    io.observe(container);

    // ── Draw ──────────────────────────────────────────────────────────────────
    const draw = (now: number) => {
      if (destroyed) return;
      rafRef.current = requestAnimationFrame(draw);
      if (!isVisible) return;

      frameCount++;
      const shouldMarch = frameCount % MARCH_EVERY === 0;

      if (shouldMarch) {
        const t = (now - start) / 1000;
        uniforms.iTime.value = t;

        if (interactive) {
          const LERP = 0.07;
          mouseSmoothed.x += (mouseTarget.x - mouseSmoothed.x) * LERP;
          mouseSmoothed.y += (mouseTarget.y - mouseSmoothed.y) * LERP;
          uniforms.u_mouse_x.value = mouseSmoothed.x;
          uniforms.u_mouse_y.value = mouseSmoothed.y;
        }

        renderer.setRenderTarget(renderTarget);
        renderer.clear();
        renderer.render(marchScene, camera);
      }

      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(blitScene, camera);
    };

    resize();
    rafRef.current = requestAnimationFrame(draw);

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      destroyed = true;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      renderTarget.dispose();
      marchMaterial.dispose();
      blitMaterial.dispose();
      geometry.dispose();
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, [speed, scale, rocketScale, density, warmColor, coolColor, pulse, pulseSize, drift, interactive, interactiveStrength, pulseRate, pulseGap, offsetX, offsetY, highpower]);

  return (
    <div ref={containerRef} className={cn("w-full h-full relative", className)} {...props} />
  );
}
