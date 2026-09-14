"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { certifications } from "@/data/certifications";
import { ACCENT_HEX } from "@/data/skills";
import { useHoveredObject } from "@/lib/experience-store";
import { MAX_FRAME_DELTA, damp } from "@/lib/utils";

import { fadeMaterials, withBaseOpacity } from "../shared/fade";
import { Glow, Label, Panel } from "../shared/primitives";
import { certificateTexture } from "../shared/textures";
import { useFadeGroup } from "../shared/useFadeGroup";
import { useStation } from "../shared/useStation";

/* ============================================================================
   CERTIFICATES — "the gallery"
   Five plaques on a shallow arc, each a real 3D object with a backing slab,
   displayed on its own pedestal.

   They respond to hover *and* to keyboard focus, because the DOM controls laid
   over this scene are ordinary focusable buttons. That is the whole reason there
   is no raycasting anywhere in this project: the accessible interaction layer is
   also the input layer.

   No certificate images were supplied, so rather than fake a scanned document
   the plaque artwork is generated from the credential's own title, seal and
   strands. The original document is offered on request in the HTML viewer.
   ========================================================================= */

const ARC_RADIUS = 9.4;
const ARC_STEP = 0.4;
const PLAQUE_WIDTH = 3.1;
/** Source canvas is 768×560. */
const PLAQUE_ASPECT = 768 / 560;

export function CertificatesStation() {
  const root = useRef<THREE.Group>(null);
  const plaques = useRef<(THREE.Group | null)[]>([]);
  const hovered = useHoveredObject();
  const hoveredRef = useRef<string | null>(null);
  hoveredRef.current = hovered;

  const layout = useMemo(
    () =>
      certifications.map((certification, index) => {
        const angle = (index - (certifications.length - 1) / 2) * ARC_STEP;
        const y = Math.abs(angle) * 0.55;
        return {
          certification,
          accent: ACCENT_HEX[certification.accent],
          x: Math.sin(angle) * ARC_RADIUS,
          y,
          z: -Math.cos(angle) * ARC_RADIUS + ARC_RADIUS,
          rotationY: -angle,
        };
      }),
    [],
  );

  /* ---- Shared geometry and materials (created once, disposed once) ------ */
  const resources = useMemo(() => {
    const slab = new THREE.BoxGeometry(PLAQUE_WIDTH + 0.18, PLAQUE_WIDTH / PLAQUE_ASPECT + 0.18, 0.14);
    // Registered so the dissolve below covers it: materials handed to a mesh
    // through the `material` prop are outside R3F's ownership and would
    // otherwise stay fully opaque as the station fades out.
    const slabMaterial = withBaseOpacity(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#dbe4f4"),
        transparent: true,
        toneMapped: false,
      }),
      0.95,
    );
    const pedestal = new THREE.CylinderGeometry(0.5, 0.62, 0.06, 20);
    const pedestalMaterials = certifications.map(() =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#2f6fdb"),
        transparent: true,
        opacity: 0.5,
        blending: THREE.NormalBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    const stem = new THREE.BoxGeometry(0.014, 1.6, 0.014);
    return { slab, slabMaterial, pedestal, pedestalMaterials, stem };
  }, []);

  useEffect(
    () => () => {
      resources.slab.dispose();
      resources.slabMaterial.dispose();
      resources.pedestal.dispose();
      resources.stem.dispose();
      resources.pedestalMaterials.forEach((material) => material.dispose());
    },
    [resources],
  );

  const { presence } = useStation("certificates", {
    ref: root,
    hold: 6,
    fade: 20,
    cull: 42,
  });

  useFadeGroup(root, presence);

  // Hover / focus response: transform only, so the fade-group's cached material
  // list stays valid and nothing needs re-registering mid-flight.
  useFrame((state, delta) => {
    const dt = Math.min(delta, MAX_FRAME_DELTA);
    const lambda = 9;

    layout.forEach((entry, index) => {
      const node = plaques.current[index];
      if (!node) return;

      const active = hoveredRef.current === `cert:${entry.certification.id}`;
      const idle = Math.sin(state.clock.elapsedTime * 0.7 + index * 1.1) * 0.045;

      node.position.y = damp(node.position.y, entry.y + (active ? 0.45 : 0) + idle, lambda, dt);
      node.position.z = damp(node.position.z, entry.z + (active ? 1.2 : 0), lambda, dt);
      node.scale.setScalar(damp(node.scale.x, active ? 1.13 : 1, lambda, dt));
      node.rotation.y = damp(node.rotation.y, entry.rotationY * (active ? 0.42 : 1), lambda, dt);
      node.rotation.x = damp(node.rotation.x, active ? -0.07 : 0, lambda, dt);
    });
  });

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    fadeMaterials([resources.slabMaterial], presence.current);
    resources.pedestalMaterials.forEach((material, index) => {
      const active = hoveredRef.current === `cert:${layout[index].certification.id}`;
      const pulse = 0.42 + Math.sin(time * 1.5 + index) * 0.12;
      material.opacity = (active ? 0.95 : pulse) * presence.current;
    });
  });

  return (
    <group ref={root} name="station-certificates">
      <Glow color="#2f6fdb" scale={27} opacity={0.1} position={[0, 0, -4]} />

      <Label
        text="Certifications & Awards"
        sub="Hover or tab through each credential"
        accent={ACCENT_HEX.signal}
        position={[0, 4.5, 3.4]}
        scale={5.4}
      />

      {layout.map((entry, index) => (
        <group
          key={entry.certification.id}
          ref={(node) => {
            plaques.current[index] = node;
          }}
          position={[entry.x, entry.y, entry.z]}
          rotation={[0, entry.rotationY, 0]}
        >
          {/* Backing slab gives the plaque physical thickness */}
          <mesh geometry={resources.slab} material={resources.slabMaterial} position={[0, 0, -0.1]} />

          <Panel
            texture={certificateTexture({
              id: entry.certification.id,
              title: entry.certification.title,
              seal: entry.certification.seal,
              strands: entry.certification.strands,
              accent: entry.accent,
              kind: entry.certification.kind,
            })}
            width={PLAQUE_WIDTH}
            height={PLAQUE_WIDTH / PLAQUE_ASPECT}
            accent={entry.accent}
          />

          {/* Pedestal: stem, disc and a soft pool of light beneath */}
          <group position={[0, -(PLAQUE_WIDTH / PLAQUE_ASPECT) / 2 - 1.1, 0]}>
            <mesh geometry={resources.stem}>
              <meshBasicMaterial
                color={entry.accent}
                transparent
                opacity={0.4}
                blending={THREE.NormalBlending}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
            <mesh geometry={resources.pedestal} material={resources.pedestalMaterials[index]} />
            <Glow color={entry.accent} scale={3.2} opacity={0.2} position={[0, 0.1, 0]} />
          </group>
        </group>
      ))}
    </group>
  );
}
