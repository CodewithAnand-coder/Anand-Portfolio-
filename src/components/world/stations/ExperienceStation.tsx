"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { experience } from "@/data/experience";
import { ACCENT_HEX } from "@/data/skills";
import { frame } from "@/lib/experience-store";
import { MAX_FRAME_DELTA } from "@/lib/utils";

import { fadeEmissive, fadeMaterials, withBaseEmissive, withBaseOpacity } from "../shared/fade";
import { Glow, Label, WireRing } from "../shared/primitives";
import { useStation } from "../shared/useStation";

/* ============================================================================
   EXPERIENCE — "the spine"
   A single vertical through-line with one technology node per internship. Each
   node carries its own satellites — the technologies named in the brief — wired
   back to the hub, mirroring the "3D technology node" concept.
   ========================================================================= */

const HUB_Y = [2.75, -2.75] as const;
const SATELLITE_RADIUS = 2.15;

export function ExperienceStation() {
  const root = useRef<THREE.Group>(null);
  const hubs = useRef<THREE.Group>(null);

  const accents = useMemo(
    () => experience.map((entry) => ACCENT_HEX[entry.scene.accent]),
    [],
  );

  /* ---- Hub materials --------------------------------------------------- */
  const materials = useMemo(() => {
    const cores = accents.map((accent) =>
      withBaseEmissive(
        new THREE.MeshStandardMaterial({
          color: new THREE.Color("#16305b"),
          emissive: new THREE.Color(accent),
          emissiveIntensity: 0.22,
          roughness: 0.35,
          metalness: 0.3,
          flatShading: true,
        }),
        0.22,
      ),
    );

    const nodes = accents.map((accent) =>
      withBaseOpacity(
        new THREE.MeshBasicMaterial({ color: new THREE.Color(accent), transparent: true, toneMapped: false }),
        0.95,
      ),
    );

    const wires = accents.map((accent) =>
      withBaseOpacity(
        new THREE.LineBasicMaterial({
          color: new THREE.Color(accent),
          transparent: true,
          blending: THREE.NormalBlending,
          depthWrite: false,
          toneMapped: false,
        }),
        0.45,
      ),
    );

    const spine = withBaseOpacity(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#5a7cba"),
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        toneMapped: false,
      }),
      0.35,
    );

    const plinth = withBaseOpacity(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#8aa5d2"),
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        toneMapped: false,
      }),
      0.3,
    );

    return { cores, nodes, wires, spine, plinth };
  }, [accents]);

  useEffect(
    () => () => {
      materials.cores.forEach((m) => m.dispose());
      materials.nodes.forEach((m) => m.dispose());
      materials.wires.forEach((m) => m.dispose());
      materials.spine.dispose();
      materials.plinth.dispose();
    },
    [materials],
  );

  /* ---- Wire geometry: hub → each satellite ----------------------------- */
  const wireGeometries = useMemo(
    () =>
      experience.map((entry) => {
        const positions: number[] = [];
        const count = entry.scene.satellites.length;
        for (let i = 0; i < count; i += 1) {
          const angle = (i / count) * Math.PI * 2;
          positions.push(0, 0, 0, Math.cos(angle) * SATELLITE_RADIUS, 0, Math.sin(angle) * SATELLITE_RADIUS);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), SATELLITE_RADIUS + 1);
        return geometry;
      }),
    [],
  );

  useEffect(() => () => wireGeometries.forEach((geometry) => geometry.dispose()), [wireGeometries]);

  const fading = useMemo(
    () => [
      ...materials.nodes,
      ...materials.wires,
      materials.spine,
      materials.plinth,
    ],
    [materials],
  );

  useStation("experience", {
    ref: root,
    onFrame: (value, delta) => {
      fadeMaterials(fading, value);
      fadeEmissive(materials.cores, value);
      const dt = Math.min(delta, MAX_FRAME_DELTA);
      if (hubs.current) {
        hubs.current.rotation.y += dt * (0.12 + frame.velocity * 0.06);
      }
    },
  });

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    materials.cores.forEach((material, index) => {
      material.emissiveIntensity =
        (material.userData.baseEmissive as number) * (1 + Math.sin(time * 1.3 + index * 2.1) * 0.16);
    });
  });

  return (
    <group ref={root} name="station-experience">
      <Glow color={accents[0]} scale={17} opacity={0.14} position={[0, HUB_Y[0], -1.5]} />
      <Glow color={accents[1]} scale={16} opacity={0.13} position={[0, HUB_Y[1], -1.5]} />

      {/* Vertical through-line */}
      <mesh material={materials.spine}>
        <cylinderGeometry args={[0.014, 0.014, 11.5, 6]} />
      </mesh>
      <WireRing radius={3.4} color="#5a7cba" opacity={0.18} rotation={[Math.PI / 2, 0, 0]} position={[0, HUB_Y[0], 0]} />
      <WireRing radius={3.1} color={accents[1]} opacity={0.16} rotation={[Math.PI / 2, 0, 0]} position={[0, HUB_Y[1], 0]} />

      <group ref={hubs}>
        {experience.map((entry, index) => (
          <group key={entry.id} position={[0, HUB_Y[index], 0]}>
            {/* Hub body */}
            <mesh material={materials.cores[index]}>
              <octahedronGeometry args={[0.82, 0]} />
            </mesh>
            <Glow color={accents[index]} scale={5.4} opacity={0.34} />

            {/* Technology satellites */}
            {entry.scene.satellites.map((satellite, satelliteIndex) => {
              const angle = (satelliteIndex / entry.scene.satellites.length) * Math.PI * 2;
              const x = Math.cos(angle) * SATELLITE_RADIUS;
              const z = Math.sin(angle) * SATELLITE_RADIUS;
              return (
                <group key={satellite} position={[x, 0, z]}>
                  <mesh material={materials.nodes[index]}>
                    <sphereGeometry args={[0.11, 12, 12]} />
                  </mesh>
                  <Label
                    text={satellite}
                    accent={accents[index]}
                    position={[0, 0.46, 0]}
                    scale={1.5}
                  />
                </group>
              );
            })}

            <lineSegments geometry={wireGeometries[index]} material={materials.wires[index]} />

            {/* Company plate */}
            <Label
              text={entry.company}
              sub={entry.role}
              accent={accents[index]}
              position={[0, 2.05, 0]}
              scale={4.1}
            />
          </group>
        ))}
      </group>
    </group>
  );
}
