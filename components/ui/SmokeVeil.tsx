import React, { useEffect, useState } from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Canvas, Fill, Shader, Skia, useClock } from '@shopify/react-native-skia';
import type { SkRuntimeEffect } from '@shopify/react-native-skia';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';

// Fumaça procedural: fbm (fractal noise) com domain warp, deslocando para cima
// lentamente. Alpha pré-multiplicado para compor sobre qualquer fundo.
const SMOKE_SKSL = `
uniform float u_time;
uniform float2 u_res;
uniform float u_intensity;
uniform float3 u_tint;

float hash(float2 p) {
  return fract(sin(dot(p, float2(127.1, 311.7))) * 43758.5453123);
}

float noise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  float2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + float2(1.0, 0.0)), u.x),
    mix(hash(i + float2(0.0, 1.0)), hash(i + float2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(float2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + float2(13.7, 7.3);
    a *= 0.5;
  }
  return v;
}

half4 main(float2 xy) {
  float2 uv = xy / u_res;
  // escala anisotrópica: véus mais alongados na vertical
  float2 p = uv * float2(2.6, 3.8);
  float t = u_time;

  // domain warp em duas camadas — é o que dá o aspecto orgânico de fumaça
  float2 q = float2(
    fbm(p + float2(0.0, -t * 0.34)),
    fbm(p + float2(5.2, -t * 0.26))
  );
  float2 r = float2(
    fbm(p + 2.4 * q + float2(1.7, -t * 0.55)),
    fbm(p + 2.4 * q + float2(8.3, -t * 0.42))
  );
  float smoke = fbm(p + 2.0 * r + float2(-t * 0.08, -t * 0.5));

  // recorte suave: só os véus mais densos aparecem
  smoke = smoothstep(0.42, 0.88, smoke);

  // bordas da tela esvaem para não parecer um retângulo
  float edge = smoothstep(0.0, 0.10, uv.x) * smoothstep(1.0, 0.90, uv.x)
             * smoothstep(0.0, 0.08, uv.y) * smoothstep(1.0, 0.92, uv.y);

  float alpha = smoke * edge * u_intensity;
  return half4(half3(u_tint * alpha), half(alpha));
}
`;

// Compilação preguiçosa: no web o CanvasKit (wasm) carrega assíncrono e o
// objeto Skia não existe no momento do import — compilar no render, com cache.
let cachedEffect: SkRuntimeEffect | null = null;
function getSmokeEffect(): SkRuntimeEffect | null {
  if (cachedEffect) return cachedEffect;
  try {
    cachedEffect = Skia.RuntimeEffect.Make(SMOKE_SKSL) ?? null;
    if (!cachedEffect && __DEV__) {
      console.warn('[SmokeVeil] shader não compilou — fumaça desabilitada');
    }
  } catch {
    return null; // Skia ainda não carregou; tenta de novo no próximo render
  }
  return cachedEffect;
}

// Cinza-quente com um toque do dourado da marca (#EF9F27 a ~8%).
const DEFAULT_TINT: [number, number, number] = [0.78, 0.74, 0.68];

interface SmokeVeilProps {
  /** Densidade global 0-1. SharedValue para animar sem re-render. */
  intensity: SharedValue<number>;
  tint?: [number, number, number];
  width: number;
  height: number;
  /** Multiplicador da velocidade do drift (1 = padrão). */
  speed?: number;
  style?: StyleProp<ViewStyle>;
}

class SmokeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    // Se o shader/canvas falhar (ex.: web sem CanvasKit), a fumaça some mas a
    // coreografia de fade em volta continua — nunca prende o usuário.
    return this.state.failed ? null : this.props.children;
  }
}

function SmokeCanvas({
  intensity,
  tint = DEFAULT_TINT,
  width,
  height,
  speed = 1,
  style,
}: SmokeVeilProps) {
  const [effect, setEffect] = useState<SkRuntimeEffect | null>(() => getSmokeEffect());
  const clock = useClock();

  useEffect(() => {
    if (effect) return;
    // CanvasKit ainda carregando (web): tenta de novo até compilar ou desmontar.
    const timer = setInterval(() => {
      const e = getSmokeEffect();
      if (e) {
        setEffect(e);
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [effect]);

  const uniforms = useDerivedValue(() => ({
    u_time: (clock.value / 1000) * speed,
    u_res: [width, height],
    u_intensity: intensity.value,
    u_tint: tint,
  }));

  if (!effect) return null;

  return (
    // flatten: o Canvas do Skia no web repassa o style direto ao DOM e não
    // aceita array de estilos (quebra com CSSStyleDeclaration indexado).
    <Canvas style={StyleSheet.flatten([{ width, height }, style])} pointerEvents="none">
      <Fill>
        <Shader source={effect} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
}

export function SmokeVeil(props: SmokeVeilProps) {
  return (
    <SmokeErrorBoundary>
      <SmokeCanvas {...props} />
    </SmokeErrorBoundary>
  );
}
