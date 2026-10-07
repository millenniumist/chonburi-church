"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Stars } from "@react-three/drei";
import * as THREE from "three";

// Glowing point sprites. Additive blending + gaussian falloff gives a
// bloom-like halo without a postprocessing pass.
const glowVertex = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  uniform float uPixelRatio;
  uniform float uPulse;
  attribute float aSize;
  attribute float aPhase;
  attribute float aReveal;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float twinkle = 0.55 + 0.45 * sin(uTime * (1.2 + aPhase * 2.4) + aPhase * 40.0);
    float reveal = smoothstep(aReveal, aReveal + 0.08, uProgress);
    vAlpha = twinkle * reveal * (1.0 + uPulse * 1.6);
    vColor = aColor;
    gl_PointSize = aSize * uPixelRatio * (0.7 + 0.3 * twinkle) * (1.0 + uPulse * 0.6) * (18.0 / -mv.z);
  }
`;

const glowFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = exp(-d * d * 60.0);
    float halo = exp(-d * d * 9.0) * 0.35;
    float a = (core + halo) * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor * (core * 1.6 + halo), a);
  }
`;

const snowVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSpeed;
  attribute float aPhase;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float h = 16.0;
    p.y = mod(p.y - uTime * aSpeed + h * 0.5, h) - h * 0.5;
    p.x += sin(uTime * 0.6 + aPhase * 6.28) * 0.35;
    p.z += cos(uTime * 0.45 + aPhase * 6.28) * 0.25;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vAlpha = smoothstep(7.5, 4.0, abs(p.y)) * (0.35 + aPhase * 0.5);
    gl_PointSize = (3.0 + aPhase * 5.0) * uPixelRatio * (10.0 / -mv.z);
  }
`;

const snowFragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vec3(0.85, 0.9, 1.0), a);
  }
`;

const haloFragment = /* glsl */ `
  uniform float uTime;
  uniform float uPulse;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p);
    float ang = atan(p.y, p.x);
    float rays = pow(abs(sin(ang * 4.0 + uTime * 0.25)), 24.0) * 0.6
               + pow(abs(sin(ang * 7.0 - uTime * 0.15)), 40.0) * 0.35;
    float glow = exp(-r * 9.0) * 1.2 + rays * exp(-r * 5.5);
    glow *= 1.0 + uPulse;
    vec3 col = mix(vec3(1.0, 0.72, 0.32), vec3(1.0, 0.96, 0.85), exp(-r * 14.0));
    gl_FragColor = vec4(col * glow, glow);
  }
`;

const HEIGHT = 6.2;
const BASE_R = 2.35;
const GOLD = new THREE.Color("#f6c46a");
const WARM = new THREE.Color("#fff1d6");
const EMBER = new THREE.Color("#ff6a3d");
const PINE = new THREE.Color("#7dd8a8");

function mulberry(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function useGlowMaterial(uniforms) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: glowVertex,
        fragmentShader: glowFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms]
  );
}

// Ribbon spirals of light + a sparse volumetric fill inside the cone.
function LightTree({ uniforms, count }) {
  const geometry = useMemo(() => {
    const rand = mulberry(7);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const phase = new Float32Array(count);
    const reveal = new Float32Array(count);
    const ribbons = 3;
    const ribbonCount = Math.floor(count * 0.62);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      let x, y, z, t;
      if (i < ribbonCount) {
        const ribbon = i % ribbons;
        t = Math.pow(rand(), 0.85);
        const turns = 7.5;
        const a = t * turns * Math.PI * 2 + (ribbon * Math.PI * 2) / ribbons;
        const r = (1 - t) * BASE_R + 0.04;
        const jitter = 0.07 + (1 - t) * 0.06;
        x = Math.cos(a) * r + (rand() - 0.5) * jitter;
        z = Math.sin(a) * r + (rand() - 0.5) * jitter;
        y = t * HEIGHT + (rand() - 0.5) * jitter;
        c.copy(ribbon === 0 ? GOLD : ribbon === 1 ? WARM : GOLD).lerp(WARM, rand() * 0.4);
        size[i] = 1.2 + rand() * 1.8;
      } else {
        t = Math.pow(rand(), 1.4);
        const a = rand() * Math.PI * 2;
        const r = (1 - t) * BASE_R * Math.sqrt(rand()) * 0.95;
        x = Math.cos(a) * r;
        z = Math.sin(a) * r;
        y = t * HEIGHT;
        const k = rand();
        c.copy(k < 0.12 ? EMBER : k < 0.3 ? PINE : GOLD).multiplyScalar(0.55 + rand() * 0.4);
        size[i] = 0.7 + rand() * 1.4;
      }
      pos.set([x, y, z], i * 3);
      col.set([c.r, c.g, c.b], i * 3);
      phase[i] = rand();
      reveal[i] = t * 0.88;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aReveal", new THREE.BufferAttribute(reveal, 1));
    return g;
  }, [count]);
  const material = useGlowMaterial(uniforms);
  return <points geometry={geometry} material={material} />;
}

// A glowing dust disc on the floor that the tree stands on.
function GroundDust({ uniforms }) {
  const geometry = useMemo(() => {
    const rand = mulberry(21);
    const n = 1400;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const phase = new Float32Array(n);
    const reveal = new Float32Array(n);
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const r = Math.pow(rand(), 0.6) * 5.2;
      pos.set([Math.cos(a) * r, (rand() - 0.5) * 0.05, Math.sin(a) * r], i * 3);
      c.copy(GOLD).multiplyScalar(0.25 + (1 - r / 5.2) * 0.6);
      col.set([c.r, c.g, c.b], i * 3);
      size[i] = 0.5 + rand() * 1.1;
      phase[i] = rand();
      reveal[i] = (r / 5.2) * 0.3;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aReveal", new THREE.BufferAttribute(reveal, 1));
    return g;
  }, []);
  const material = useGlowMaterial(uniforms);
  return <points geometry={geometry} material={material} />;
}

// Glossy baubles placed along the spiral, lit by an in-scene environment.
function Ornaments({ progress }) {
  const ref = useRef();
  const items = useMemo(() => {
    const rand = mulberry(99);
    const palette = ["#d4192b", "#f0bd55", "#fff6e8", "#b8121f", "#e2a845"];
    return Array.from({ length: 34 }, (_, i) => {
      const t = 0.16 + (i / 34) * 0.72 + (rand() - 0.5) * 0.03;
      const a = t * 7.5 * Math.PI * 2 + Math.PI / 3 + rand() * 0.8;
      const r = (1 - t) * BASE_R + 0.12;
      return {
        position: [Math.cos(a) * r, t * HEIGHT, Math.sin(a) * r],
        scale: 0.075 + (1 - t) * 0.08 + rand() * 0.03,
        color: palette[i % palette.length],
        t,
      };
    });
  }, []);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    g.children.forEach((m, i) => {
      const s = THREE.MathUtils.smoothstep(progress.current, items[i].t * 0.9, items[i].t * 0.9 + 0.1);
      m.scale.setScalar(items[i].scale * s);
    });
  });
  return (
    <group ref={ref}>
      {items.map((o, i) => (
        <mesh key={i} position={o.position} scale={0}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial color={o.color} emissive={o.color} emissiveIntensity={0.18} metalness={0.55} roughness={0.18} clearcoat={1} clearcoatRoughness={0.05} envMapIntensity={1.6} />
        </mesh>
      ))}
    </group>
  );
}

function starShape() {
  const shape = new THREE.Shape();
  const spikes = 5;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? 0.42 : 0.17;
    const a = (i / (spikes * 2)) * Math.PI * 2 + Math.PI / 2;
    const p = [Math.cos(a) * r, Math.sin(a) * r];
    if (i === 0) shape.moveTo(...p);
    else shape.lineTo(...p);
  }
  shape.closePath();
  return shape;
}

function Star({ uniforms, progress }) {
  const group = useRef();
  const mesh = useRef();
  const shape = useMemo(starShape, []);
  const haloMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: haloFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms]
  );
  const { camera } = useThree();
  useFrame((state) => {
    const s = THREE.MathUtils.smoothstep(progress.current, 0.82, 1.0);
    group.current.scale.setScalar(s);
    mesh.current.rotation.y = state.clock.elapsedTime * 0.6;
    group.current.children[1].quaternion.copy(camera.quaternion);
  });
  return (
    <group ref={group} position={[0, HEIGHT + 0.32, 0]}>
      <mesh ref={mesh}>
        <extrudeGeometry args={[shape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.03, bevelSegments: 3 }]} />
        <meshStandardMaterial color="#ffd27a" emissive="#ffb547" emissiveIntensity={2.4} metalness={0.6} roughness={0.25} />
      </mesh>
      <mesh material={haloMat}>
        <planeGeometry args={[3.6, 3.6]} />
      </mesh>
    </group>
  );
}

function Snow({ uniforms, count }) {
  const geometry = useMemo(() => {
    const rand = mulberry(3);
    const pos = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos.set([(rand() - 0.5) * 22, (rand() - 0.5) * 16, (rand() - 0.5) * 14 - 2], i * 3);
      speed[i] = 0.25 + rand() * 0.55;
      phase[i] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    return g;
  }, [count]);
  const material = useMemo(
    () => new THREE.ShaderMaterial({ uniforms, vertexShader: snowVertex, fragmentShader: snowFragment, transparent: true, depthWrite: false }),
    [uniforms]
  );
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

function Rig({ layout, children }) {
  const group = useRef();
  const { viewport, size } = useThree();
  useFrame((state, delta) => {
    const wide = size.width >= 1024;
    // Desktop: tree sits in the left column; mobile: centered, nudged up.
    // Scale so the tree (plus star) fills the top ~60% of the view, leaving
    // room for the title underneath.
    const centered = layout === "center";
    const scale = centered
      ? Math.min(0.85, (viewport.height * 0.86) / (HEIGHT + 0.7), viewport.width / (BASE_R * 2 * 1.1))
      : wide
        ? Math.min(0.68, (viewport.height * 0.54) / (HEIGHT + 0.7))
        : Math.min(0.62, viewport.width / (BASE_R * 2 * 1.25));
    const top = centered ? ((HEIGHT + 0.7) * scale) / 2 : viewport.height / 2 - 0.35;
    const targetX = layout === "center" || !wide ? 0 : -Math.min(viewport.width * 0.22, 4.2);
    const targetY = top - (HEIGHT + 0.7) * scale;
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, targetX, 3, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, targetY, 3, delta);
    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, scale, 3, delta));
    group.current.rotation.y += delta * 0.12;
    const px = state.pointer.x * 0.6;
    const py = state.pointer.y * 0.35;
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, px, 2, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, 0.6 + py, 2, delta);
    state.camera.lookAt(state.camera.position.x * 0.5, state.camera.position.y - 0.6, 0);
  });
  return <group ref={group}>{children}</group>;
}

function Experience({ layout, pulse, reducedMotion }) {
  const { gl } = useThree();
  const progress = useRef(reducedMotion ? 1 : 0);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: progress.current },
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
      uPulse: { value: 0 },
    }),
    [gl]
  );
  const snowUniforms = useMemo(() => ({ uTime: { value: 0 }, uPixelRatio: uniforms.uPixelRatio }), [uniforms]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    uniforms.uTime.value = reducedMotion ? 0 : t;
    snowUniforms.uTime.value = reducedMotion ? 0 : t;
    progress.current = Math.min(1, progress.current + delta * 0.32);
    uniforms.uProgress.value = progress.current;
    const target = pulse ? 1 : 0;
    uniforms.uPulse.value = THREE.MathUtils.damp(uniforms.uPulse.value, target, 4, delta);
  });

  return (
    <>
      <Environment resolution={256}>
        <Lightformer form="ring" intensity={3} color="#ffcf8a" position={[0, 5, -6]} scale={6} />
        <Lightformer intensity={1.5} color="#6f8cff" position={[-6, 2, 3]} scale={[4, 8, 1]} />
        <Lightformer intensity={2} color="#ffffff" position={[5, 4, 4]} scale={[3, 3, 1]} />
      </Environment>
      <ambientLight intensity={0.5} color="#9fb4ff" />
      <pointLight position={[0, 6.6, 0]} intensity={8} color="#ffc56b" distance={9} />
      <Stars radius={60} depth={30} count={2500} factor={3} saturation={0} fade speed={reducedMotion ? 0 : 0.6} />
      <Rig layout={layout}>
        <LightTree uniforms={uniforms} count={9000} />
        <GroundDust uniforms={uniforms} />
        <Ornaments progress={progress} />
        <Star uniforms={uniforms} progress={progress} />
      </Rig>
      <Snow uniforms={snowUniforms} count={1600} />
    </>
  );
}

export default function ChristmasScene({ layout = "split", pulse = false }) {
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.6, 11], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      eventPrefix="client"
    >
      <Experience layout={layout} pulse={pulse} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
