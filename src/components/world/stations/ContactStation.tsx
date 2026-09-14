"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { profile } from "@/data/profile";
import { frame } from "@/lib/experience-store";
import { MAX_FRAME_DELTA } from "@/lib/utils";

import { fadeMaterials, withBaseOpacity } from "../shared/fade";
import { DataStream, Glow, Label, WireRing } from "../shared/primitives";
import { useFadeGroup } from "../shared/useFadeGroup";
import { useStation } from "../shared/useStation";

/* ============================================================================
   CONTACT — "the portal"
   The end of the corridor. Everything the visitor has travelled through
   converges into a single ring of light, which is the visual argument that the
   whole page has been one journey rather than a stack of sections.
   ========================================================================= */

const BLUE = "#2f6fdb";
const INDIGO = "#5a61e0";

export function ContactStation() {
  const root = useRef<THREE.Group>(null);
  const portal = useRef<THREE.Group>(null);

  const resources = useMemo(() => {
    const ring = withBaseOpacity(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(BLUE),
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        toneMapped: false,
      }),
      0.6,
    );

    const iris = withBaseOpacity(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(INDIGO),
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        toneMapped: false,
      }),
      0.4,
    );

    const core = withBaseOpacity(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#1e3a6e"),
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        toneMapped: false,
      }),
      0.9,
    );

    return { ring, iris, core };
  }, []);

  useEffect(
    () => () => {
      resources.ring.dispose();
      resources.iris.dispose();
      resources.core.dispose();
    },
    [resources],
  );

  const { presence } = useStation("contact", {
    ref: root,
    hold: 12,
    fade: 34,
    cull: 60,
  });

  useFadeGroup(root, presence);

  useFrame((state, delta) => {
    const dt = Math.min(delta, MAX_FRAME_DELTA);
    fadeMaterials([resources.ring, resources.iris, resources.core], presence.current);

    if (portal.current) {
      portal.current.rotation.z += dt * 0.09;
      portal.current.rotation.y +=
        (frame.pointerNX * 0.18 - portal.current.rotation.y) * (1 - Math.exp(-1.8 * dt));
    }

    // The core breathes; the halo behind it swells on a slower cycle, so the
    // portal never resolves into a single repeating beat.
    const time = state.clock.elapsedTime;
    resources.core.opacity =
      (resources.core.userData.baseOpacity as number) *
      presence.current *
      (0.8 + Math.sin(time * 1.7) * 0.2);
  });

  return (
    <group ref={root} name="station-contact">
      <Glow color={BLUE} scale={30} opacity={0.14} position={[0, 0, -3]} />
      <Glow color={INDIGO} scale={16} opacity={0.16} position={[2.5, 1.5, -1]} />

      <group ref={portal}>
        <WireRing radius={4.2} tube={0.05} color={BLUE} opacity={0.6} />
        <WireRing radius={5.2} tube={0.02} color={INDIGO} opacity={0.35} rotation={[0, 0, 0.6]} />
        <WireRing radius={3.1} tube={0.03} color={BLUE} opacity={0.4} rotation={[0.4, 0.3, 0]} />
        <WireRing radius={6.4} tube={0.015} color={INDIGO} opacity={0.22} rotation={[-0.5, 0.2, 0]} />

        <mesh material={resources.core}>
          <icosahedronGeometry args={[0.9, 2]} />
        </mesh>
        <Glow color="#5a7cba" scale={7} opacity={0.3} />
      </group>

      {/* Everything converges here */}
      <DataStream from={[-16, 6, -8]} to={[0, 0, 0]} count={20} color={BLUE} speed={0.16} spread={0.4} size={0.12} curvature={1.6} />
      <DataStream from={[16, -5, -10]} to={[0, 0, 0]} count={18} color={INDIGO} speed={0.14} spread={0.4} size={0.11} curvature={-1.4} />
      <DataStream from={[0, 9, -14]} to={[0, 0, 0]} count={14} color="#8aa5d2" speed={0.18} spread={0.3} size={0.1} curvature={0.9} />

      <Label
        text="Let's Build Something Meaningful"
        sub={profile.availability}
        accent={BLUE}
        position={[0, 7.4, 2]}
        scale={7}
      />
    </group>
  );
}
