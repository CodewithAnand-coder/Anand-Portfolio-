"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { glowTexture, labelTexture } from "./textures";

/* ============================================================================
   SHARED PRIMITIVES
   A deliberately small vocabulary of shapes reused by every station. Keeping
   the palette and the material treatment identical across scenes is what makes
   the portfolio read as one environment rather than nine effects stitched
   together.
   ========================================================================= */

/** Soft additive halo. Cheaper and softer than a real light. */
export function Glow({
  color,
  scale = 8,
  opacity = 0.45,
  position = [0, 0, 0],
  rotation,
}: {
  color: string;
  scale?: number | [number, number];
  opacity?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const texture = useMemo(() => glowTexture(), []);
  const [width, height] = Array.isArray(scale) ? scale : [scale, scale];

  return (
    <sprite position={position} rotation={rotation} scale={[width, height, 1]}>
      <spriteMaterial
        map={texture}
        color={color}
        transparent
        opacity={opacity}
        blending={THREE.NormalBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );
}

/**
 * A thin ring. Used for orbits, portals and the education progress arcs —
 * `arc` below 2π turns it into a progress indicator.
 */
export function WireRing({
  radius,
  tube = 0.014,
  color,
  opacity = 0.5,
  rotation = [0, 0, 0],
  position = [0, 0, 0],
  arc = Math.PI * 2,
  segments = 128,
  additive = false,
}: {
  radius: number;
  tube?: number;
  color: string;
  opacity?: number;
  rotation?: [number, number, number];
  position?: [number, number, number];
  arc?: number;
  segments?: number;
  additive?: boolean;
}) {
  const geometry = useMemo(
    () => new THREE.TorusGeometry(radius, tube, 6, segments, arc),
    [radius, tube, segments, arc],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} rotation={rotation} position={position}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending}
        depthWrite={false}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/** Wireframe shell — the recurring "structure" motif. */
export function WireShell({
  radius,
  detail = 1,
  color,
  opacity = 0.22,
  position = [0, 0, 0],
  scale,
}: {
  radius: number;
  detail?: number;
  color: string;
  opacity?: number;
  position?: [number, number, number];
  scale?: [number, number, number];
}) {
  return (
    <mesh position={position} scale={scale}>
      <icosahedronGeometry args={[radius, detail]} />
      <meshBasicMaterial
        color={color}
        wireframe
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/** Sprite text label. Always faces the viewer, always legible. */
export function Label({
  text,
  sub,
  accent = "#3ce4c4",
  position = [0, 0, 0],
  scale = 3.2,
  opacity = 1,
  renderOrder = 2,
}: {
  text: string;
  sub?: string;
  accent?: string;
  position?: [number, number, number];
  scale?: number;
  opacity?: number;
  renderOrder?: number;
}) {
  const texture = useMemo(() => labelTexture(text, accent, sub), [text, accent, sub]);
  // Source canvas is 768×224, so the sprite keeps that aspect.
  const height = scale * (224 / 768);

  return (
    <sprite position={position} scale={[scale, height, 1]} renderOrder={renderOrder}>
      <spriteMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
        sizeAttenuation
      />
    </sprite>
  );
}

/**
 * A flat holographic panel textured with a generated canvas.
 * `doubleSide` matters: panels are viewed from both directions as the camera
 * travels past them.
 */
export function Panel({
  texture,
  width,
  height,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  opacity = 1,
  accent,
  renderOrder = 1,
  material,
  frameMaterial,
}: {
  texture: THREE.Texture;
  width: number;
  height: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  opacity?: number;
  accent?: string;
  renderOrder?: number;
  /**
   * Optional externally-owned material. Stations that fade their contents pass
   * one in so the same instance can be registered for presence fading without
   * the station having to walk the scene graph.
   */
  material?: THREE.Material;
  frameMaterial?: THREE.Material;
}) {
  const frame = useMemo(
    () => new THREE.PlaneGeometry(width + 0.07, height + 0.07),
    [width, height],
  );
  useEffect(() => () => frame.dispose(), [frame]);

  return (
    <group position={position} rotation={rotation}>
      {accent || frameMaterial ? (
        <mesh geometry={frame} position={[0, 0, -0.012]} renderOrder={renderOrder - 1}>
          {frameMaterial ? (
            <primitive object={frameMaterial} attach="material" />
          ) : (
            <meshBasicMaterial
              color={accent}
              transparent
              opacity={opacity * 0.35}
              blending={THREE.NormalBlending}
              depthWrite={false}
              toneMapped={false}
              side={THREE.DoubleSide}
            />
          )}
        </mesh>
      ) : null}
      <mesh renderOrder={renderOrder}>
        <planeGeometry args={[width, height]} />
        {material ? (
          <primitive object={material} attach="material" />
        ) : (
          <meshBasicMaterial
            map={texture}
            transparent
            opacity={opacity}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>
    </group>
  );
}

/** Instanced field of small cubes — used for customer / transaction grids. */
export function InstancedCubes({
  count,
  colors,
  positions,
  sizes,
  opacity = 1,
}: {
  count: number;
  colors: Float32Array;
  positions: Float32Array;
  sizes: Float32Array;
  opacity?: number;
}) {
  const mesh = useMemo(() => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    // NOTE: no `vertexColors` here. Per-instance tint comes from
    // `instanceColor`, which three enables via USE_INSTANCING_COLOR. Setting
    // vertexColors without a geometry colour attribute would bind an undefined
    // attribute and render every instance black.
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity,
      toneMapped: false,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    const instance = new THREE.InstancedMesh(geometry, material, count);
    instance.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i += 1) {
      const size = sizes[i];
      matrix.makeScale(size, size, size);
      matrix.setPosition(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      instance.setMatrixAt(i, matrix);
    }
    instance.instanceMatrix.needsUpdate = true;
    return instance;
  }, [count, colors, positions, sizes, opacity]);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      mesh.dispose();
    },
    [mesh],
  );

  return <primitive object={mesh} />;
}

/**
 * A glowing "packet" travelling along +X between two points. The RAG pipeline
 * and the fraud stream both use these; one component keeps their motion
 * language identical.
 */
export function DataStream({
  from,
  to,
  count = 18,
  color,
  speed = 0.35,
  spread = 0.6,
  size = 0.09,
  curvature = 0,
}: {
  from: [number, number, number];
  to: [number, number, number];
  count?: number;
  color: string;
  speed?: number;
  spread?: number;
  size?: number;
  curvature?: number;
}) {
  const offsets = useMemo(
    () => Array.from({ length: count }, (_, i) => i / count),
    [count],
  );

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const points = useMemo(() => {
    const mat = new THREE.PointsMaterial({
      color: new THREE.Color(color),
      size,
      transparent: true,
      opacity: 0.9,
      blending: THREE.NormalBlending,
      depthWrite: false,
      toneMapped: false,
      sizeAttenuation: true,
    });
    return new THREE.Points(geometry, mat);
  }, [geometry, color, size]);

  useEffect(
    () => () => {
      (points.material as THREE.Material).dispose();
    },
    [points],
  );

  const delta = useMemo(
    () => [to[0] - from[0], to[1] - from[1], to[2] - from[2]] as [number, number, number],
    [from, to],
  );

  // Driven by the R3F frame loop rather than a private rAF: one loop means the
  // stream is sampled at the same clock the camera moves on, so packets never
  // drift ahead of the world during a scroll.
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const attribute = geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = attribute.array as Float32Array;

    for (let i = 0; i < count; i += 1) {
      const t = (time * speed + offsets[i]) % 1;
      const arc = Math.sin(t * Math.PI) * curvature;
      array[i * 3] = from[0] + delta[0] * t;
      array[i * 3 + 1] = from[1] + delta[1] * t + arc;
      array[i * 3 + 2] = from[2] + delta[2] * t + Math.cos(offsets[i] * 12.9) * spread * 0.35;
    }
    attribute.needsUpdate = true;
  });

  return <primitive object={points} />;
}
