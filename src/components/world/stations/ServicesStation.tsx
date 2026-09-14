"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { services } from "@/data/services";
import { frame } from "@/lib/experience-store";
import { mulberry32, range } from "@/lib/random";
import { MAX_FRAME_DELTA } from "@/lib/utils";

import { fadeMaterials, withBaseOpacity } from "../shared/fade";
import { Glow, Label } from "../shared/primitives";
import { glowTexture } from "../shared/textures";
import { useStation } from "../shared/useStation";

/* ============================================================================
   SERVICES — "the hexad"
   Six white service panels orbit a navy core, one per service offered in the
   section's cards. The slow orbit reads as a working carousel of capabilities
   under studio light — navy/blue/amber accents on white paper, matching the DOM.
   ========================================================================= */

const ACCENTS = ["#2f6fdb", "#5a61e0", "#d97706", "#1e3a6e", "#5a7cba", "#2f6fdb"];

/** Canvas size of the service panel texture. */
const PANEL_W = 420;
const PANEL_H = 190;

function buildServiceTexture(title: string, detail: string, accent: string, index: number) {
  const width = PANEL_W;
  const height = PANEL_H;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  // White paper body
  ctx.fillStyle = "rgba(255,255,255,0.97)";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 5, height);
  ctx.strokeStyle = "rgba(15,39,87,0.16)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Index chip
  ctx.beginPath();
  ctx.roundRect(24, 24, 44, 44, 10);
  ctx.fillStyle = `${accent}14`;
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.font = '600 20px "JetBrains Mono", monospace';
  ctx.fillStyle = accent;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(index + 1).padStart(2, "0"), 46, 47);

  // Title + summary
  ctx.textAlign = "left";
  ctx.font = '600 26px "Sora", system-ui, sans-serif';
  ctx.fillStyle = "#102444";
  ctx.fillText(title, 84, 42);
  ctx.font = '400 18px "Inter", system-ui, sans-serif';
  ctx.fillStyle = "rgba(68,85,124,0.95)";
  ctx.fillText(detail, 84, 78);

  // Bottom rule
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(24, height - 28, width - 48, 3);
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

export function ServicesStation() {
  const root = useRef<THREE.Group>(null);
  const carousel = useRef<THREE.Group>(null);

  /* ---- Panel textures + materials ------------------------------------- */
  const resources = useMemo(() => {
    const textures = services.map((service, index) =>
      buildServiceTexture(service.title, service.summary, ACCENTS[index % ACCENTS.length], index),
    );

    const panelMaterials = textures.map((texture) =>
      withBaseOpacity(
        new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
          toneMapped: false,
          side: THREE.DoubleSide,
        }),
        1,
      ),
    );

    const core = withBaseEmissiveSafe(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#1e3a6e"),
        emissive: new THREE.Color("#5a7cba"),
        emissiveIntensity: 0.2,
        roughness: 0.35,
        metalness: 0.3,
        flatShading: true,
      }),
      0.2,
    );

    const dust = withBaseOpacity(
      new THREE.PointsMaterial({
        map: glowTexture(),
        color: new THREE.Color("#5a7cba"),
        size: 0.2,
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        toneMapped: false,
        sizeAttenuation: true,
      }),
      0.5,
    );

    return { textures, panelMaterials, core, dust };
  }, []);

  useEffect(
    () => () => {
      resources.textures.forEach((texture) => texture.dispose());
      resources.panelMaterials.forEach((material) => material.dispose());
      resources.core.dispose();
      resources.dust.dispose();
    },
    [resources],
  );

  /** Dust cloud positions around the carousel. */
  const dustGeometry = useMemo(() => {
    const random = mulberry32(6060);
    const count = 130;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const radius = range(random, 6.5, 10.5);
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.cos(phi) * radius * 0.5;
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);
    return geometry;
  }, []);

  useEffect(() => () => dustGeometry.dispose(), [dustGeometry]);

  const fading = useMemo(
    () => [...resources.panelMaterials, resources.dust],
    [resources],
  );

  useStation("services", {
    ref: root,
    hold: 7,
    fade: 22,
    onFrame: (value, delta) => {
      fadeMaterials(fading, value);
      const dt = Math.min(delta, MAX_FRAME_DELTA);

      if (carousel.current) {
        carousel.current.rotation.y += dt * (0.09 + frame.velocity * 0.05);
        carousel.current.rotation.x +=
          (frame.pointerNY * 0.1 - carousel.current.rotation.x) * (1 - Math.exp(-1.6 * dt));
      }
    },
  });

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    resources.core.emissiveIntensity =
      (resources.core.userData.baseEmissive as number) * (1 + Math.sin(time * 1.4) * 0.2);
  });

  /** Panel positions: six around a ring, tilted slightly for depth. */
  const panelPositions = useMemo(
    () =>
      services.map((_, index) => {
        const angle = (index / services.length) * Math.PI * 2;
        const radius = 6.2;
        return [
          Math.cos(angle) * radius,
          Math.sin(angle * 2) * 0.85,
          Math.sin(angle) * radius,
        ] as [number, number, number];
      }),
    [],
  );

  return (
    <group ref={root} name="station-services">
      <Glow color="#2f6fdb" scale={22} opacity={0.12} position={[0, 0, -3]} />
      <Glow color="#5a61e0" scale={14} opacity={0.09} position={[-4, 2, -4]} />

      {/* Core */}
      <mesh material={resources.core}>
        <icosahedronGeometry args={[1.05, 1]} />
      </mesh>

      {/* Service carousel */}
      <group ref={carousel}>
        {services.map((service, index) => {
          const position = panelPositions[index];
          const width = 3.4;
          const height = width * (PANEL_H / PANEL_W);
          // Face outward from the ring centre.
          const rotationY = -Math.atan2(position[2], position[0]) + Math.PI / 2;
          return (
            <group key={service.id} position={position} rotation={[0, rotationY, 0]}>
              <mesh material={resources.panelMaterials[index]}>
                <planeGeometry args={[width, height]} />
              </mesh>
              <Glow
                color={ACCENTS[index % ACCENTS.length]}
                scale={4}
                opacity={0.18}
                position={[0, 0, -0.4]}
              />
            </group>
          );
        })}

        <points geometry={dustGeometry} material={resources.dust} />
      </group>

      <Label
        text="What I Do"
        sub="Six services, one standard: practical, documented, delivered"
        accent="#2f6fdb"
        position={[0, 5.4, 2]}
        scale={5.6}
      />
    </group>
  );
}

/** Local alias so the import list stays tidy. */
function withBaseEmissiveSafe<T extends THREE.MeshStandardMaterial>(material: T, base: number): T {
  material.userData.baseEmissive = base;
  return material;
}
