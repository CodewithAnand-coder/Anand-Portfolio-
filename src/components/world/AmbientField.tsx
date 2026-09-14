"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { useExperience } from "@/components/providers/ExperienceProvider";
import { frame } from "@/lib/experience-store";
import { mulberry32, range } from "@/lib/random";
import { MAX_FRAME_DELTA, clamp } from "@/lib/utils";

import { nebulaTexture } from "./shared/textures";

/* ============================================================================
   THE AMBIENT FIELD
   The environment the whole corridor lives inside: a drifting particle field
   that stretches the full depth of the journey, soft brand-tinted haze planes,
   and (on capable devices) a faint blueprint grid far below.

   Light-theme note: additive blending disappears against a white page (it only
   brightens toward white), so every layer here uses normal alpha blending with
   navy/blue pigments — the particles read as fine ink dust rather than sparks.
   ========================================================================= */

const FIELD_NEAR_Z = 30;
const FIELD_FAR_Z = -330;
const FIELD_X = 26;
const FIELD_Y = 16;

/** Matches the scene fog so particles obey the same depth cue as the geometry. */
const FOG_DENSITY = 0.02;

const PARTICLE_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uVelocity;
  uniform float uFogDensity;
  uniform vec2 uPointer;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 transformed = position;

    // Slow organic drift, unique per particle.
    transformed.x += sin(uTime * 0.24 + aPhase) * 0.7;
    transformed.y += cos(uTime * 0.19 + aPhase * 1.37) * 0.7;

    // A fast scroll drags the field toward the viewer, which reads as speed.
    transformed.z += uVelocity * 3.4;

    // Cursor parallax, stronger for nearer particles — cheap depth cue.
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    mvPosition.xy += uPointer * (2.2 / max(1.0, -mvPosition.z)) * 8.0;

    gl_Position = projectionMatrix * mvPosition;

    float depth = max(0.001, -mvPosition.z);

    // Exponential-squared fog, matching THREE.FogExp2.
    float fogFactor = 1.0 - exp(-pow(depth * uFogDensity, 2.0));

    float twinkle = 0.45 + 0.55 * sin(uTime * 1.4 + aPhase * 5.0);

    vAlpha = twinkle * (1.0 - fogFactor);
    vColor = aColor;

    gl_PointSize = aSize * uPixelRatio * (240.0 / depth);
  }
`;

const PARTICLE_FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Round, softly-edged sprite drawn in the fragment shader — no texture read.
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;

    float glow = smoothstep(0.5, 0.0, dist);
    glow *= glow;

    gl_FragColor = vec4(vColor, glow * vAlpha);
  }
`;

export function AmbientField() {
  const { quality, tier } = useExperience();
  const pixelRatio = useThree((state) => state.gl.getPixelRatio());

  /* ---- Particle cloud -------------------------------------------------- */
  const geometry = useMemo(() => {
    const count = quality.ambientParticles;
    const random = mulberry32(20260913);

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    const palette = [
      new THREE.Color("#2f6fdb"), // brand blue
      new THREE.Color("#5a61e0"), // indigo
      new THREE.Color("#1e3a6e"), // navy
      new THREE.Color("#5b6c92"), // slate
      new THREE.Color("#8aa5d2"), // light navy — a few soft anchors
    ];
    // Weighted so the field reads blue-first with slate support.
    const weights = [0.34, 0.2, 0.2, 0.16, 0.1];

    const pick = () => {
      let roll = random();
      for (let i = 0; i < weights.length; i += 1) {
        roll -= weights[i];
        if (roll <= 0) return palette[i];
      }
      return palette[0];
    };

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = range(random, -FIELD_X, FIELD_X);
      positions[i * 3 + 1] = range(random, -FIELD_Y, FIELD_Y);
      positions[i * 3 + 2] = range(random, FIELD_FAR_Z, FIELD_NEAR_Z);

      const color = pick();
      const brightness = range(random, 0.55, 1);
      colors[i * 3] = color.r * brightness;
      colors[i * 3 + 1] = color.g * brightness;
      colors[i * 3 + 2] = color.b * brightness;

      // A small population of larger "beacon" particles adds focal variety.
      sizes[i] = random() > 0.94 ? range(random, 4, 7) : range(random, 0.8, 2.6);
      phases[i] = random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    // The camera flies inside the cloud, so frustum culling of the whole object
    // is wrong more often than it is right.
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -150), 260);
    return geo;
  }, [quality.ambientParticles]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uVelocity: { value: 0 },
          uFogDensity: { value: FOG_DENSITY },
          uPointer: { value: new THREE.Vector2(0, 0) },
        },
        vertexShader: PARTICLE_VERTEX,
        fragmentShader: PARTICLE_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  const points = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    const dt = Math.min(delta, MAX_FRAME_DELTA);
    material.uniforms.uTime.value = frame.time;
    material.uniforms.uPixelRatio.value = pixelRatio;
    // Ease the velocity uniform so a scroll spike becomes a surge, not a snap.
    const target = clamp(frame.velocity, -1.4, 1.4);
    material.uniforms.uVelocity.value +=
      (target - material.uniforms.uVelocity.value) * (1 - Math.exp(-4 * dt));
    material.uniforms.uPointer.value.set(frame.pointerNX * 0.5, frame.pointerNY * 0.4);

    // Whole-cloud rotation gives the drift a direction even when parked.
    if (points.current && tier !== "low") {
      points.current.rotation.z += dt * 0.006;
    }
  });

  /* ---- Haze planes --------------------------------------------------- */
  const nebulae = useMemo(
    () => [
      { z: -18, x: -12, y: 6, scale: [120, 62] as const, color: "#96c1f9", opacity: 0.16 },
      { z: -86, x: 16, y: -7, scale: [104, 58] as const, color: "#b4b9fb", opacity: 0.14 },
      { z: -158, x: -18, y: 8, scale: [126, 66] as const, color: "#cbe1fd", opacity: 0.18 },
      { z: -228, x: 14, y: 5, scale: [110, 60] as const, color: "#96c1f9", opacity: 0.15 },
      { z: -296, x: -8, y: -6, scale: [138, 70] as const, color: "#b4b9fb", opacity: 0.16 },
    ],
    [],
  );

  const nebulaMap = useMemo(() => nebulaTexture(), []);

  return (
    <group name="ambient">
      <points ref={points} geometry={geometry} material={material} name="data-field" />

      {nebulae.map((nebula, index) => (
        <mesh key={index} position={[nebula.x, nebula.y, nebula.z]}>
          <planeGeometry args={[nebula.scale[0], nebula.scale[1]]} />
          <meshBasicMaterial
            map={nebulaMap}
            color={nebula.color}
            transparent
            opacity={nebula.opacity}
            blending={THREE.NormalBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {quality.groundGrid ? <DataGrid /> : null}
    </group>
  );
}

/* ============================================================================
   GROUND GRID
   A single plane with a procedural grid in the fragment shader: no texture, no
   geometry, and it fades into the same fog as everything else.
   ========================================================================= */

const GRID_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying float vDistance;

  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDistance = -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const GRID_FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  uniform vec3 uColor;
  uniform float uFogDensity;

  varying vec2 vUv;
  varying float vDistance;

  // No derivatives needed: measure proximity to the cell boundary directly.
  float gridLine(float coord, float cells, float width) {
    float scaled = coord * cells;
    float edge = abs(fract(scaled) - 0.5);
    return smoothstep(0.5 - width, 0.5, edge);
  }

  void main() {
    float line = max(gridLine(vUv.x, 64.0, 0.06), gridLine(vUv.y, 96.0, 0.06));

    // A second, coarser grid gives the floor a sense of scale.
    float major = max(gridLine(vUv.x, 16.0, 0.02), gridLine(vUv.y, 24.0, 0.02)) * 1.6;

    float fogFactor = 1.0 - exp(-pow(vDistance * uFogDensity, 2.0));
    float alpha = (line * 0.55 + major) * uOpacity * (1.0 - fogFactor);

    if (alpha < 0.002) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

function DataGrid() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uOpacity: { value: 0.3 },
          uColor: { value: new THREE.Color("#7386ac") },
          uFogDensity: { value: FOG_DENSITY * 1.15 },
        },
        vertexShader: GRID_VERTEX,
        fragmentShader: GRID_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        side: THREE.DoubleSide,
      }),
    [],
  );

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh position={[0, -11.5, -150]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[180, 420, 1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
