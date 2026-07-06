import React, { useEffect, useRef } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import { SharedValue } from 'react-native-reanimated';

// Versão web: WebGL puro com a MESMA matemática de ruído (fbm + domain warp)
// do shader Skia nativo — o RN Skia no web depende de CanvasKit/wasm e não
// renderiza de forma confiável, então seguimos o padrão do projeto de
// componente .web dedicado (ver AnilhaRating.web.tsx).
const FRAG = `
precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform float u_intensity;
uniform vec3 u_tint;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(13.7, 7.3);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  uv.y = 1.0 - uv.y;
  vec2 p = uv * vec2(2.6, 3.8);
  float t = u_time;

  vec2 q = vec2(
    fbm(p + vec2(0.0, -t * 0.34)),
    fbm(p + vec2(5.2, -t * 0.26))
  );
  vec2 r = vec2(
    fbm(p + 2.4 * q + vec2(1.7, -t * 0.55)),
    fbm(p + 2.4 * q + vec2(8.3, -t * 0.42))
  );
  float smoke = fbm(p + 2.0 * r + vec2(-t * 0.08, -t * 0.5));

  smoke = smoothstep(0.42, 0.88, smoke);

  float edge = smoothstep(0.0, 0.10, uv.x) * smoothstep(1.0, 0.90, uv.x)
             * smoothstep(0.0, 0.08, uv.y) * smoothstep(1.0, 0.92, uv.y);

  float alpha = smoke * edge * u_intensity;
  gl_FragColor = vec4(u_tint * alpha, alpha);
}
`;

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const DEFAULT_TINT: [number, number, number] = [0.78, 0.74, 0.68];

interface SmokeVeilProps {
  intensity: SharedValue<number>;
  tint?: [number, number, number];
  width: number;
  height: number;
  speed?: number;
  style?: StyleProp<ViewStyle>;
}

export function SmokeVeil({
  intensity,
  tint = DEFAULT_TINT,
  width,
  height,
  speed = 1,
}: SmokeVeilProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true });
    if (!gl) return;

    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
        console.warn('[SmokeVeil.web]', gl!.getShaderInfoLog(s));
        return null;
      }
      return s;
    }

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]), // triângulo que cobre a tela
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uIntensity = gl.getUniformLocation(prog, 'u_intensity');
    const uTint = gl.getUniformLocation(prog, 'u_tint');

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform3f(uTint, tint[0], tint[1], tint[2]);
    gl.clearColor(0, 0, 0, 0);

    const start = performance.now();
    let raf = 0;
    const loop = () => {
      gl.uniform1f(uTime, ((performance.now() - start) / 1000) * speed);
      gl.uniform1f(uIntensity, intensity.value);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
    // tint é estável na prática (default constante); width/height/speed regem o setup
  }, [width, height, speed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Meia resolução: fumaça é suave por natureza e o fbm é caro por pixel.
  const dpr = 0.5;
  return (
    <canvas
      ref={canvasRef}
      width={Math.round(width * dpr)}
      height={Math.round(height * dpr)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: 'none',
      }}
    />
  );
}
