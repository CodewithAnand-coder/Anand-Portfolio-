"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { education } from "@/data/education";
import { ACCENT_HEX } from "@/data/skills";
import { frame } from "@/lib/experience-store";
import { MAX_FRAME_DELTA } from "@/lib/utils";

import { fadeEmissive, fadeMaterials, withBaseEmissive, withBaseOpacity } from "../shared/fade";
import { Glow, Label, WireRing } from "../shared/primitives";
import { useStation } from "../shared/useStation";

/* ============================================================================
   EDUCATION — "the ascent"
   Three slabs climbing away from the viewer, one per qualification, oldest at
   the front. Each carries a progress arc drawn to the actual result (90%, 83%,
   77%) so the academic record is legible inside the 3D scene rather than only
   in the HTML beneath it.
   ========================================================================= */

const STEP_HEIGHT = 2.35;
const STEP_X = 1.45;
const PLATFORM_Y = -3.1;

export function EducationStation() {
  const root = useRef<THREE.Group>(null);
  const ascent = useRef<THREE.Group>(null);

  const accents = useMemo(() => education.map((entry) => ACCENT_HEX[entry.accent]), []);

  const materials = useMemo(() => {
    const decks = accents.map((accent) =>
      withBaseOpacity(
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(accent),
          transparent: true,
          blending: THREE.NormalBlending,
          depthWrite: false,
          toneMapped: false,
          side: THREE.DoubleSide,
        }),
        0.16,
      ),
    );

    const edges = accents.map((accent) =>
      withBaseOpacity(
        new THREE.LineBasicMaterial({
          color: new THREE.Color(accent),
          transparent: true,
          blending: THREE.NormalBlending,
          depthWrite: false,
          toneMapped: false,
        }),
        0.85,
      ),
    );

    const beacons = accents.map((accent) =>
      withBaseEmissive(
        new THREE.MeshStandardMaterial({
          color: new THREE.Color("#16305b"),
          emissive: new THREE.Color(accent),
          emissiveIntensity: 0.25,
          roughness: 0.35,
          metalness: 0.3,
          flatShading: true,
        }),
        0.25,
      ),
    );

    return { decks, edges, beacons };
  }, [accents]);

  // One slab geometry shared by all three platforms, plus its edge outline.
  const deckGeometry = useMemo(() => new THREE.BoxGeometry(4.6, 0.09, 3), []);
  const deckEdges = useMemo(() => new THREE.EdgesGeometry(deckGeometry), [deckGeometry]);

  useEffect(
    () => () => {
      materials.decks.forEach((m) => m.dispose());
      materials.edges.forEach((m) => m.dispose());
      materials.beacons.forEach((m) => m.dispose());
      deckGeometry.dispose();
      deckEdges.dispose();
    },
    [materials, deckGeometry, deckEdges],
  );

  const fading = useMemo(
    () => [...materials.decks, ...materials.edges],
    [materials],
  );

  useStation("education", {
    ref: root,
    onFrame: (value, delta) => {
      fadeMaterials(fading, value);
      fadeEmissive(materials.beacons, value);
      const dt = Math.min(delta, MAX_FRAME_DELTA);
      if (ascent.current) {
        // A slow drift around Y so the staircase reads in three dimensions, and
        // a counter-lean against the cursor.
        ascent.current.rotation.y += dt * 0.075;
        ascent.current.rotation.x +=
          (frame.pointerNY * 0.09 - ascent.current.rotation.x) * (1 - Math.exp(-1.5 * dt));
      }
    },
  });

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    materials.beacons.forEach((material, index) => {
      material.emissiveIntensity =
        (material.userData.baseEmissive as number) * (1 + Math.sin(time * 1.2 + index) * 0.18);
    });
  });

  return (
    <group ref={root} name="station-education">
      <Glow color={accents[0]} scale={19} opacity={0.12} position={[1, 1, -3]} />

      <group ref={ascent} position={[0, 0, 0]}>
        {education.map((entry, index) => {
          const y = PLATFORM_Y + (education.length - 1 - index) * STEP_HEIGHT;
          const x = (education.length - 1 - index) * STEP_X - STEP_X;
          const accent = accents[index];
          const arc = Math.max(0.02, entry.resultValue) * Math.PI * 2;

          return (
            <group key={entry.id} position={[x, y, 0]}>
              {/* Slab */}
              <mesh material={materials.decks[index]} geometry={deckGeometry} />
              <lineSegments material={materials.edges[index]} geometry={deckEdges} />

              {/* Result arc, drawn to scale */}
              <WireRing
                radius={1.35}
                tube={0.045}
                color={accent}
                opacity={0.9}
                arc={arc}
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.14, 0]}
              />
              {/* Track showing the full circle the arc fills */}
              <WireRing
                radius={1.35}
                tube={0.012}
                color={accent}
                opacity={0.22}
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.13, 0]}
              />

              {/* Beacon */}
              <mesh material={materials.beacons[index]} position={[0, 0.72, 0]}>
                <octahedronGeometry args={[0.3, 0]} />
              </mesh>

              <Label
                text={entry.short}
                sub={entry.result}
                accent={accent}
                position={[0, 1.5, 0]}
                scale={3.1}
              />

              <Glow color={accent} scale={6} opacity={0.14} position={[0, 0.1, 0]} />
            </group>
          );
        })}
      </group>
    </group>
  );
}
