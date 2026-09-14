"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { useExperience } from "@/components/providers/ExperienceProvider";
import { ACCENT_HEX, skillClusters, type SkillCluster } from "@/data/skills";
import { frame, useHoveredObject } from "@/lib/experience-store";
import { mulberry32, range } from "@/lib/random";
import { MAX_FRAME_DELTA } from "@/lib/utils";

import { fadeMaterials, withBaseOpacity } from "../shared/fade";
import { Glow, Label, WireRing } from "../shared/primitives";
import { glowTexture } from "../shared/textures";
import { useStation } from "../shared/useStation";

/* ============================================================================
   SKILLS — "the ecosystem"
   Thirteen clusters in three orbits. Inner ring is the core practice (analytics,
   Python, SQL, ML), the middle ring is the applied toolkit, and the outer ring is
   the surrounding knowledge. Each cluster carries one point per individual skill,
   so the constellation's density is literally the size of that skill group.

   There is no proficiency encoding anywhere in here by design: the brief supplies
   no ratings, and inventing them would be the most damaging kind of fabrication
   a portfolio can make.
   ========================================================================= */

const ORBIT_RADIUS = [3.9, 7.0, 10.1] as const;
/** Tilt of each orbit plane, in radians — keeps the shell from reading as a disc. */
const ORBIT_TILT = [0.0, 0.42, -0.34] as const;
const ORBIT_SPEED = [0.11, -0.07, 0.045] as const;

/**
 * A cluster placed on an orbit.
 *
 * `clusterIndex` is the index into `skillClusters` (which is how the shared
 * material and dust-geometry arrays are ordered). It is deliberately separate
 * from the position within `placed`, which is grouped by orbit — conflating the
 * two silently attaches every cluster to the wrong colour and point cloud.
 */
type Placed = {
  cluster: SkillCluster;
  clusterIndex: number;
  position: [number, number, number];
};

export function SkillsStation() {
  const { quality } = useExperience();
  const hovered = useHoveredObject();
  const root = useRef<THREE.Group>(null);
  const orbitsRef = useRef<(THREE.Group | null)[]>([]);

  /* ---- Place every cluster on its orbit -------------------------------- */
  const placed = useMemo<Placed[]>(() => {
    const random = mulberry32(90210);
    const byOrbit: Record<number, { cluster: SkillCluster; clusterIndex: number }[]> = {
      0: [],
      1: [],
      2: [],
    };
    skillClusters.forEach((cluster, clusterIndex) => {
      byOrbit[cluster.orbit].push({ cluster, clusterIndex });
    });

    const result: Placed[] = [];
    for (const orbit of [0, 1, 2] as const) {
      const members = byOrbit[orbit];
      const radius = ORBIT_RADIUS[orbit];
      const tilt = ORBIT_TILT[orbit];
      members.forEach(({ cluster, clusterIndex }, position) => {
        // Distribute evenly, with a small seeded jitter so the rings do not look
        // machine-stamped.
        const angle = (position / members.length) * Math.PI * 2 + range(random, -0.12, 0.12);
        const wobble = range(random, -0.5, 0.5);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        result.push({
          cluster,
          clusterIndex,
          position: [x, z * Math.sin(tilt) + wobble, z * Math.cos(tilt)],
        });
      });
    }
    return result;
  }, []);

  /* ---- Cluster nodes, skill dust and labels ---------------------------- */
  const materials = useMemo(() => {
    const cores = skillClusters.map((cluster) =>
      withBaseOpacity(
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(ACCENT_HEX[cluster.accent]),
          transparent: true,
          toneMapped: false,
        }),
        0.95,
      ),
    );

    const dust = skillClusters.map((cluster) =>
      withBaseOpacity(
        new THREE.PointsMaterial({
          map: glowTexture(),
          color: new THREE.Color(ACCENT_HEX[cluster.accent]),
          size: 0.15,
          transparent: true,
          blending: THREE.NormalBlending,
          depthWrite: false,
          toneMapped: false,
          sizeAttenuation: true,
        }),
        0.9,
      ),
    );

    const ring = withBaseOpacity(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#2f6fdb"),
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        toneMapped: false,
      }),
      0.18,
    );

    const spokes = withBaseOpacity(
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#5a7cba"),
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        toneMapped: false,
      }),
      0.22,
    );

    return { cores, dust, ring, spokes };
  }, []);

  /* ---- Skill dust geometry: one orbiting point per skill --------------- */
  const dustGeometries = useMemo(
    () =>
      skillClusters.map((cluster) => {
        const random = mulberry32(cluster.id.length * 977 + cluster.skills.length * 31);
        const count = cluster.skills.length;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i += 1) {
          const angle = (i / count) * Math.PI * 2;
          const radius = range(random, 0.42, 0.68);
          positions[i * 3] = Math.cos(angle) * radius;
          positions[i * 3 + 1] = range(random, -0.18, 0.18);
          positions[i * 3 + 2] = Math.sin(angle) * radius;
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1);
        return geometry;
      }),
    [],
  );

  /* ---- Spokes from the origin to each inner cluster -------------------- */
  const spokeGeometry = useMemo(() => {
    const positions: number[] = [];
    placed
      .filter((entry) => entry.cluster.orbit === 0)
      .forEach((entry) => {
        positions.push(0, 0, 0, entry.position[0], entry.position[1], entry.position[2]);
      });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), ORBIT_RADIUS[2] + 2);
    return geometry;
  }, [placed]);

  useEffect(
    () => () => {
      materials.cores.forEach((m) => m.dispose());
      materials.dust.forEach((m) => m.dispose());
      materials.ring.dispose();
      materials.spokes.dispose();
      dustGeometries.forEach((g) => g.dispose());
      spokeGeometry.dispose();
    },
    [materials, dustGeometries, spokeGeometry],
  );

  const fading = useMemo(
    () => [...materials.cores, ...materials.dust, materials.ring, materials.spokes],
    [materials],
  );

  useStation("skills", {
    ref: root,
    hold: 7,
    fade: 22,
    onFrame: (value, delta) => {
      fadeMaterials(fading, value);
      const dt = Math.min(delta, MAX_FRAME_DELTA);
      orbitsRef.current.forEach((orbit, index) => {
        if (!orbit) return;
        orbit.rotation.y += dt * ORBIT_SPEED[index] * (1 + frame.velocity * 0.3);
      });
      if (root.current) {
        root.current.rotation.x +=
          (frame.pointerNY * 0.16 - root.current.rotation.x) * (1 - Math.exp(-1.4 * dt));
        root.current.rotation.z +=
          (-frame.pointerNX * 0.1 - root.current.rotation.z) * (1 - Math.exp(-1.4 * dt));
      }
    },
  });

  // Hover response: the focused cluster swells and brightens, and the rest dim
  // slightly so the eye is pulled to exactly one thing.
  const clusterNodes = useRef<(THREE.Group | null)[]>([]);
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    placed.forEach((entry, index) => {
      const node = clusterNodes.current[index];
      if (!node) return;
      const isHovered = hovered === `skill:${entry.cluster.id}`;
      const target = isHovered ? 1.5 : 1;
      node.scale.x += (target - node.scale.x) * 0.14;
      node.scale.y += (target - node.scale.y) * 0.14;
      node.scale.z += (target - node.scale.z) * 0.14;
      node.rotation.y = time * 0.4 + index;
    });
  });

  return (
    <group ref={root} name="station-skills">
      <Glow color="#2f6fdb" scale={26} opacity={0.1} />
      <Glow color="#5a61e0" scale={18} opacity={0.08} position={[3, -2, -5]} />

      {/* Orbit guides */}
      {ORBIT_RADIUS.map((radius, index) => (
        <WireRing
          key={radius}
          radius={radius}
          color={index === 0 ? "#2f6fdb" : index === 1 ? "#5a61e0" : "#8aa5d2"}
          opacity={0.16}
          rotation={[Math.PI / 2 + ORBIT_TILT[index], 0, 0]}
        />
      ))}

      <lineSegments geometry={spokeGeometry} material={materials.spokes} />

      {[0, 1, 2].map((orbit) => (
        <group
          key={orbit}
          ref={(node) => {
            orbitsRef.current[orbit] = node;
          }}
        >
          {placed
            .filter((entry) => entry.cluster.orbit === orbit)
            .map((entry) => {
              const globalIndex = placed.indexOf(entry);
              const materialIndex = entry.clusterIndex;
              const accent = ACCENT_HEX[entry.cluster.accent];
              return (
                <group key={entry.cluster.id} position={entry.position}>
                  <group
                    ref={(node) => {
                      clusterNodes.current[globalIndex] = node;
                    }}
                  >
                    <mesh material={materials.cores[materialIndex]}>
                      <icosahedronGeometry args={[0.2, quality.networkLinks ? 1 : 0]} />
                    </mesh>
                    <points
                      geometry={dustGeometries[materialIndex]}
                      material={materials.dust[materialIndex]}
                    />
                    <Glow color={accent} scale={1.9} opacity={0.3} />
                  </group>

                  {/* Label sits outside the swell so it never jitters on hover. */}
                  <Label
                    text={entry.cluster.abbr}
                    accent={accent}
                    position={[0, 0.62, 0]}
                    scale={2.05}
                    opacity={0.95}
                  />
                </group>
              );
            })}
        </group>
      ))}
    </group>
  );
}
