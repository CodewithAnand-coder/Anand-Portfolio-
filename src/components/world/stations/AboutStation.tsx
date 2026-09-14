"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { useExperience } from "@/components/providers/ExperienceProvider";
import { focusAreas } from "@/data/profile";
import { frame, useHoveredObject } from "@/lib/experience-store";
import { mulberry32 } from "@/lib/random";
import { MAX_FRAME_DELTA } from "@/lib/utils";

import { fadeMaterials, withBaseOpacity } from "../shared/fade";
import { Glow, Label, WireRing } from "../shared/primitives";
import { glowTexture } from "../shared/textures";
import { useStation } from "../shared/useStation";

/* ============================================================================
   ABOUT — "the network"
   The five focus areas are rendered as five bright, labelled hubs inside a
   cloud of dimmer supporting nodes, wired together by proximity. It is the
   visual argument for the section: these capabilities are connected, not a
   bulleted list.
   ========================================================================= */

const HUB_COLORS = ["#2f6fdb", "#5a61e0", "#d97706", "#1e3a6e", "#5a7cba"];
const CLOUD_RADIUS = 6.6;

export function AboutStation() {
  const root = useRef<THREE.Group>(null);
  const cloud = useRef<THREE.Group>(null);
  const hubNodes = useRef<(THREE.Group | null)[]>([]);

  // The About section's focus-area cards publish `focus:<id>` on hover and on
  // keyboard focus; the matching hub swells in response, so the constellation
  // is legibly the same five things listed in the copy.
  const hovered = useHoveredObject();
  const hoveredRef = useRef<string | null>(null);
  hoveredRef.current = hovered;

  const { quality } = useExperience();
  const nodeCount = quality.networkNodes;
  const networkLinks = quality.networkLinks;

  /* ---- Node cloud ------------------------------------------------------ */
  const { geometry: nodeGeometry, material: nodeMaterial } = useMemo(() => {
    const random = mulberry32(4242);
    const positions = new Float32Array(nodeCount * 3);
    const colors = new Float32Array(nodeCount * 3);

    const palette = [
      new THREE.Color("#2f6fdb"),
      new THREE.Color("#5a61e0"),
      new THREE.Color("#5a7cba"),
      new THREE.Color("#90a0bd"),
    ];

    for (let i = 0; i < nodeCount; i += 1) {
      // Uniform-ish distribution inside a sphere, flattened on Y so the cloud
      // reads as a wide constellation rather than a ball.
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const radius = CLOUD_RADIUS * Math.cbrt(random());
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.cos(phi) * radius * 0.62;
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;

      const color = palette[Math.floor(random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), CLOUD_RADIUS + 2);

    const mat = withBaseOpacity(
      new THREE.PointsMaterial({
        map: glowTexture(),
        size: 0.44,
        vertexColors: true,
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        toneMapped: false,
        sizeAttenuation: true,
      }),
      0.85,
    );

    return { geometry: geo, material: mat };
  }, [nodeCount]);

  /* ---- Proximity wiring ------------------------------------------------ */
  const { geometry: lineGeometry, material: lineMaterial } = useMemo(() => {
    const positions = nodeGeometry.getAttribute("position").array as Float32Array;
    const segments: number[] = [];

    // Connect each node to its two nearest neighbours. Enough to read as a
    // network, sparse enough not to become a grey mass.
    for (let i = 0; i < nodeCount; i += 1) {
      const distances: { index: number; distance: number }[] = [];
      for (let j = 0; j < nodeCount; j += 1) {
        if (i === j) continue;
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        distances.push({ index: j, distance: dx * dx + dy * dy + dz * dz });
      }
      distances.sort((a, b) => a.distance - b.distance);
      for (let k = 0; k < 2; k += 1) {
        const target = distances[k];
        if (!target) continue;
        // Emit each edge once (from the lower index) to halve the vertex count.
        if (i < target.index) {
          segments.push(
            positions[i * 3],
            positions[i * 3 + 1],
            positions[i * 3 + 2],
            positions[target.index * 3],
            positions[target.index * 3 + 1],
            positions[target.index * 3 + 2],
          );
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(segments, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), CLOUD_RADIUS + 2);

    const mat = withBaseOpacity(
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#5a7cba"),
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        toneMapped: false,
      }),
      0.2,
    );

    return { geometry: geo, material: mat };
  }, [nodeGeometry, nodeCount]);

  /* ---- Focus hubs ------------------------------------------------------ */
  const hubMaterials = useMemo(
    () =>
      HUB_COLORS.map((color) =>
        withBaseOpacity(
          new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, toneMapped: false }),
          0.95,
        ),
      ),
    [],
  );

  const hubPositions = useMemo(
    () =>
      focusAreas.map((_, index) => {
        const angle = (index / focusAreas.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 5.1;
        return [
          Math.cos(angle) * radius,
          Math.sin(angle * 2) * 1.35,
          Math.sin(angle) * radius * 0.7,
        ] as [number, number, number];
      }),
    [],
  );

  const fading = useMemo(
    () => [nodeMaterial, lineMaterial, ...hubMaterials],
    [nodeMaterial, lineMaterial, hubMaterials],
  );

  useEffect(
    () => () => {
      nodeGeometry.dispose();
      lineGeometry.dispose();
      nodeMaterial.dispose();
      lineMaterial.dispose();
      for (const material of hubMaterials) material.dispose();
    },
    [nodeGeometry, lineGeometry, nodeMaterial, lineMaterial, hubMaterials],
  );

  useStation("about", {
    ref: root,
    onFrame: (value, delta) => {
      fadeMaterials(fading, value);
      const dt = Math.min(delta, MAX_FRAME_DELTA);
      if (cloud.current) {
        cloud.current.rotation.y += dt * (0.07 + frame.velocity * 0.05);
        cloud.current.rotation.x +=
          (frame.pointerNY * 0.12 - cloud.current.rotation.x) * (1 - Math.exp(-1.6 * dt));
      }
    },
  });

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    hubMaterials.forEach((material, index) => {
      const isHovered = hoveredRef.current === `focus:${focusAreas[index].id}`;
      // Hubs breathe out of phase so the cluster never blinks in unison, and
      // the hovered one sits at full brightness.
      const pulse = isHovered ? 1 : 0.78 + Math.sin(time * 1.1 + index * 1.7) * 0.22;
      material.opacity = material.userData.baseOpacity * pulse;
    });

    focusAreas.forEach((area, index) => {
      const node = hubNodes.current[index];
      if (!node) return;
      const target = hoveredRef.current === `focus:${area.id}` ? 1.5 : 1;
      node.scale.x += (target - node.scale.x) * 0.14;
      node.scale.y += (target - node.scale.y) * 0.14;
      node.scale.z += (target - node.scale.z) * 0.14;
    });
  });

  return (
    <group ref={root} name="station-about">
      <Glow color="#2f6fdb" scale={20} opacity={0.12} />
      <Glow color="#5a61e0" scale={13} opacity={0.1} position={[-3, 2, -3]} />

      <group ref={cloud}>
        <points geometry={nodeGeometry} material={nodeMaterial} />
        {networkLinks ? <lineSegments geometry={lineGeometry} material={lineMaterial} /> : null}

        {/* Orbit guide through the hubs */}
        <WireRing radius={5.1} color="#2f6fdb" opacity={0.2} rotation={[Math.PI / 2, 0, 0]} />

        {focusAreas.map((area, index) => {
          const position = hubPositions[index];
          return (
            <group key={area.id} position={position}>
              <group
                ref={(node) => {
                  hubNodes.current[index] = node;
                }}
              >
                <mesh material={hubMaterials[index]}>
                  <sphereGeometry args={[0.19, 14, 14]} />
                </mesh>
                <Glow color={HUB_COLORS[index]} scale={2.1} opacity={0.5} />
              </group>
              {/* Label sits outside the swelling group so text stays steady. */}
              <Label
                text={area.label}
                accent={HUB_COLORS[index]}
                position={[0, 0.72, 0]}
                scale={2.55}
              />
            </group>
          );
        })}
      </group>
    </group>
  );
}
