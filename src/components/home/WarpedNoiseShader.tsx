"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface WarpedNoiseShaderProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: number;
  scale?: number;
  warpStrength?: number;
  colorIntensity?: number;
  noiseDetail?: number;
  contrast?: number;
  colorDark?: string;
  colorLight?: string;
}

const VS = `
  attribute vec2 a_pos;
  void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

const FS = `
  precision highp float;

  uniform float iTime;
  uniform vec2  iResolution;
  uniform float u_speed;
  uniform float u_scale;
  uniform float u_warpStrength;
  uniform float u_colorIntensity;
  uniform float u_noiseDetail;
  uniform float u_contrast;
  uniform vec3  u_colorDark;
  uniform vec3  u_colorLight;

  vec4 colormap(float x) {
    vec3 c = mix(u_colorDark, u_colorLight, x);
    return vec4(c, 1.0);
  }

  float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 u  = fract(p);
    u = u*u*(3.0 - 2.0*u);
    float res = mix(
      mix(rand(ip),              rand(ip + vec2(1.0, 0.0)), u.x),
      mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x),
      u.y
    );
    return res * res;
  }

  float fbm(vec2 p) {
    mat2 mtx = mat2(0.80, 0.60, -0.60, 0.80);
    float f = 0.0;
    f += 0.500000 * noise(p + vec2(0.0, iTime * u_speed));  p = mtx * p * 2.02;
    f += 0.031250 * noise(p);                    p = mtx * p * 2.01;
    f += 0.250000 * noise(p);                    p = mtx * p * 2.03;
    f += 0.125000 * noise(p);                    p = mtx * p * 2.01;
    f += 0.062500 * noise(p);                    p = mtx * p * 2.04;
    f += 0.015625 * noise(p + vec2(0.0, sin(iTime * u_speed)));
    return f / 0.96875;
  }

  float pattern(vec2 p) {
    return fbm(p + fbm(p + fbm(p)) * u_warpStrength);
  }

  void main() {
    vec2 uv   = gl_FragCoord.xy / iResolution.x * u_scale;
    float shade = pattern(uv * u_noiseDetail);

    // S-curve contrast pivot around 0.5
    shade = clamp((shade - 0.5) * u_contrast + 0.5, 0.0, 1.0);

    vec4 color = colormap(shade);
    // colorIntensity scales the smoke strength (alpha), not the RGB — preserves color saturation
    gl_FragColor = vec4(color.rgb, shade * u_colorIntensity);
  }
`;

// Resolves any CSS color string (hex, rgb, oklch, lab, var(--...), etc.)
// DOM element resolves the variable, then canvas converts any color space → RGB bytes.
function resolveCSSColor(value: string): [number, number, number] {
  const el = document.createElement("div");
  el.style.cssText = `position:absolute;width:0;height:0;color:${value}`;
  document.body.appendChild(el);
  const computed = getComputedStyle(el).color; // may be lab(), oklch(), etc.
  document.body.removeChild(el);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = computed;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export default function WarpedNoiseShader({
  className,
  speed = 1.0,
  scale = 12.0,
  warpStrength = 1.0,
  colorIntensity = 1.0,
  noiseDetail = 1.0,
  contrast = 1.0,
  colorDark = "var(--color-gray-900)",
  colorLight = "var(--color-gray-100)",
  ...props
}: WarpedNoiseShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VS);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uTime          = gl.getUniformLocation(prog, "iTime");
    const uResolution    = gl.getUniformLocation(prog, "iResolution");
    const uSpeed         = gl.getUniformLocation(prog, "u_speed");
    const uScale         = gl.getUniformLocation(prog, "u_scale");
    const uWarpStrength  = gl.getUniformLocation(prog, "u_warpStrength");
    const uColorIntensity= gl.getUniformLocation(prog, "u_colorIntensity");
    const uNoiseDetail   = gl.getUniformLocation(prog, "u_noiseDetail");
    const uContrast      = gl.getUniformLocation(prog, "u_contrast");
    const uColorDark     = gl.getUniformLocation(prog, "u_colorDark");
    const uColorLight    = gl.getUniformLocation(prog, "u_colorLight");

    gl.uniform1f(uSpeed,          speed);
    gl.uniform1f(uScale,          scale);
    gl.uniform1f(uWarpStrength,   warpStrength);
    gl.uniform1f(uColorIntensity, colorIntensity);
    gl.uniform1f(uNoiseDetail,    noiseDetail);
    gl.uniform1f(uContrast,       contrast);

    // Resolve CSS colors → RGB floats and upload
    const dark  = resolveCSSColor(colorDark);
    const light = resolveCSSColor(colorLight);
    gl.uniform3f(uColorDark,  ...dark);
    gl.uniform3f(uColorLight, ...light);

    const start = performance.now();

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width  = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const draw = (now: number) => {
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      gl.deleteProgram(prog);
    };
  }, [speed, scale, warpStrength, colorIntensity, noiseDetail, contrast, colorDark, colorLight]);

  return (
    <div className={cn("w-full h-full", className)} {...props}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
