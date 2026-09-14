"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { frame } from "@/lib/experience-store";
import { mulberry32, range } from "@/lib/random";
import { MAX_FRAME_DELTA } from "@/lib/utils";

import { fadeEmissive, fadeMaterials, withBaseEmissive, withBaseOpacity } from "../shared/fade";
import { Glow, Panel, WireRing, WireShell } from "../shared/primitives";
import { codeTexture } from "../shared/textures";
import { useStation } from "../shared/useStation";

/* ============================================================================
   HERO — "the data core"
   The opening frame. A faceted navy core wrapped in wireframe shells and three
   independently rotating rings, orbited by satellite nodes and surrounded by
   floating panels of real code from the work this portfolio describes.

   Light theme: the core is solid navy under studio light; panels are white
   paper with navy ink. Nothing glows — the scene reads as a designed object,
   not a hologram.
   ========================================================================= */

const BLUE = "#2f6fdb";
const INDIGO = "#5a61e0";
const NAVY = "#1e3a6e";

type CodePanelSpec = {
  id: string;
  label: string;
  accent: string;
  lines: string[];
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
};

// Real snippets — pandas for the churn work, SQL for the reporting, XGBoost and
// SHAP for the model, embeddings for the RAG assistant. Readable at a glance and
// consistent with the project section three screens down.
const CODE_PANELS: CodePanelSpec[] = [
  {
    id: "churn",
    label: "churn_analysis.py",
    accent: BLUE,
    lines: [
      "import pandas as pd",
      'df = pd.read_csv("telco.csv")',
      'df.groupby("contract").mean()',
    ],
    position: [-7.1, 2.05, 1.2],
    rotation: [0.05, 0.42, 0.012],
    width: 3.5,
  },
  {
    id: "sql",
    label: "retention.sql",
    accent: INDIGO,
    lines: ["SELECT region, SUM(profit)", "FROM sales", "GROUP BY region;"],
    position: [7.2, 2.5, 0.4],
    rotation: [0.03, -0.44, -0.01],
    width: 3.4,
  },
  {
    id: "xgb",
    label: "model.py",
    accent: NAVY,
    lines: ["from xgboost import XGBClassifier", "model = XGBClassifier()", "model.fit(X_train, y_train)"],
    position: [-7.4, -2.25, -0.9],
    rotation: [-0.04, 0.36, 0.02],
    width: 3.6,
  },
  {
    id: "shap",
    label: "explain.py",
    accent: BLUE,
    lines: ["import shap", "explainer = shap.TreeExplainer(model)", "shap_values = explainer(X)"],
    position: [7.0, -1.85, -0.6],
    rotation: [-0.05, -0.34, -0.015],
    width: 3.5,
  },
  {
    id: "rag",
    label: "retrieval.py",
    accent: INDIGO,
    lines: ["emb = embed(chunk)", "hits = store.search(emb, k=5)", "return hits"],
    position: [-3.9, 3.45, -3.6],
    rotation: [0.02, 0.2, 0.01],
    width: 3.1,
  },
  {
    id: "eval",
    label: "evaluate.py",
    accent: NAVY,
    lines: ["from sklearn.metrics import roc_auc_score", "print(roc_auc_score(y, proba))"],
    position: [4.1, -3.5, -3.2],
    rotation: [-0.02, -0.22, -0.01],
    width: 3.2,
  },
];

export function HeroStation() {
  const root = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const outerShell = useRef<THREE.Mesh>(null);
  const satellites = useRef<THREE.Group>(null);

  /* ---- Materials ------------------------------------------------------- */
  const materials = useMemo(() => {
    const core = withBaseEmissive(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#1e3a6e"),
        emissive: new THREE.Color("#5a7cba"),
        emissiveIntensity: 0.18,
        roughness: 0.32,
        metalness: 0.35,
        flatShading: true,
      }),
      0.18,
    );

    const innerGlow = withBaseOpacity(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#dfe9f9"),
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        toneMapped: false,
      }),
      0.5,
    );

    const shellNear = withBaseOpacity(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(BLUE),
        wireframe: true,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
      0.3,
    );

    const shellFar = withBaseOpacity(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#8aa5d2"),
        wireframe: true,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
      0.16,
    );

    const ring = withBaseOpacity(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(BLUE),
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        toneMapped: false,
      }),
      0.55,
    );

    const ringAlt = withBaseOpacity(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(INDIGO),
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        toneMapped: false,
      }),
      0.35,
    );

    const satellite = withBaseOpacity(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#2c4a86"),
        transparent: true,
        toneMapped: false,
      }),
      0.9,
    );

    // Panels fade as one group, plus a faint accent frame behind each.
    const panelMaterials = CODE_PANELS.map((panel) =>
      withBaseOpacity(
        new THREE.MeshBasicMaterial({
          map: codeTexture(panel.id, panel.lines, panel.accent, panel.label),
          transparent: true,
          depthWrite: false,
          toneMapped: false,
          side: THREE.DoubleSide,
        }),
        1,
      ),
    );

    const frameMaterials = CODE_PANELS.map((panel) =>
      withBaseOpacity(
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(panel.accent),
          transparent: true,
          blending: THREE.NormalBlending,
          depthWrite: false,
          toneMapped: false,
          side: THREE.DoubleSide,
        }),
        0.35,
      ),
    );

    return {
      core,
      innerGlow,
      shellNear,
      shellFar,
      ring,
      ringAlt,
      satellite,
      panelMaterials,
      frameMaterials,
    };
  }, []);

  useEffect(
    () => () => {
      for (const material of Object.values(materials)) {
        if (Array.isArray(material)) {
          for (const entry of material) entry.dispose();
        } else {
          (material as THREE.Material).dispose();
        }
      }
    },
    [materials],
  );

  /** Everything that dissolves with the station. */
  const fading = useMemo(
    () => [
      materials.innerGlow,
      materials.shellNear,
      materials.shellFar,
      materials.ring,
      materials.ringAlt,
      ...materials.panelMaterials,
      ...materials.frameMaterials,
    ],
    [materials],
  );

  /* ---- Orbiting satellite positions ----------------------------------- */
  const orbits = useMemo(() => {
    const random = mulberry32(77123);
    return Array.from({ length: 12 }, (_, index) => ({
      radius: range(random, 3.3, 5.6),
      angle: (index / 12) * Math.PI * 2 + random() * 0.5,
      y: range(random, -1.5, 1.5),
      speed: range(random, 0.06, 0.17) * (index % 2 === 0 ? 1 : -1),
      size: range(random, 0.05, 0.11),
    }));
  }, []);

  const { presence } = useStation("home", {
    ref: root,
    // The hero should dissolve fairly promptly as the About network arrives 26
    // units down the corridor, rather than ghosting behind it.
    hold: 8,
    fade: 22,
    cull: 60,
    onFrame: (value, delta) => {
      fadeMaterials(fading, value);
      fadeEmissive([materials.core], value);

      const dt = Math.min(delta, MAX_FRAME_DELTA);
      const node = root.current;
      if (node) {
        // Subtle counter-rotation against the cursor: the scene feels like it
        // has mass rather than being glued to the mouse.
        node.rotation.y += (frame.pointerNX * 0.16 - node.rotation.y) * (1 - Math.exp(-2 * dt));
        node.rotation.x += (frame.pointerNY * 0.1 - node.rotation.x) * (1 - Math.exp(-2 * dt));
      }

      if (rings.current) {
        rings.current.rotation.y += dt * 0.14;
        rings.current.rotation.z += dt * 0.05;
      }
      if (outerShell.current) {
        outerShell.current.rotation.y -= dt * 0.06;
        outerShell.current.rotation.x += dt * 0.03;
      }
      if (satellites.current) {
        satellites.current.rotation.y += dt * 0.1;
      }
    },
  });

  useFrame((state) => {
    if (presence.current < 0.01) return;
    const time = state.clock.elapsedTime;
    materials.core.emissiveIntensity =
      materials.core.userData.baseEmissive * presence.current * (1 + Math.sin(time * 1.6) * 0.12);
    materials.innerGlow.opacity =
      materials.innerGlow.userData.baseOpacity * presence.current * (0.85 + Math.sin(time * 2.1) * 0.15);
  });

  return (
    <group ref={root} name="station-home">
      {/* Ambient halos behind the core */}
      <Glow color={BLUE} scale={17} opacity={0.16} position={[0, 0, -1.5]} />
      <Glow color={INDIGO} scale={9} opacity={0.12} position={[1.2, -1, -2.4]} />

      {/* The core */}
      <mesh material={materials.core}>
        <icosahedronGeometry args={[1.5, 1]} />
      </mesh>
      <mesh material={materials.innerGlow} scale={1.06}>
        <icosahedronGeometry args={[1.5, 1]} />
      </mesh>

      <WireShell radius={2.55} detail={1} color={BLUE} opacity={0.3} />
      <mesh ref={outerShell} material={materials.shellFar}>
        <icosahedronGeometry args={[3.6, 0]} />
      </mesh>

      {/* Rings */}
      <group ref={rings}>
        <WireRing radius={3.25} color={BLUE} opacity={0.55} rotation={[Math.PI / 2.1, 0.2, 0]} />
        <WireRing radius={4.05} color={INDIGO} opacity={0.35} rotation={[Math.PI / 2.6, -0.6, 0.4]} />
        <WireRing radius={4.85} color="#8aa5d2" opacity={0.22} rotation={[Math.PI / 1.7, 0.9, -0.3]} />
      </group>

      {/* Satellites on independent orbits */}
      <group ref={satellites}>
        {orbits.map((orbit, index) => (
          <mesh
            key={index}
            material={materials.satellite}
            position={[
              Math.cos(orbit.angle) * orbit.radius,
              orbit.y,
              Math.sin(orbit.angle) * orbit.radius,
            ]}
          >
            <sphereGeometry args={[orbit.size, 10, 10]} />
          </mesh>
        ))}
      </group>

      {/* Floating code */}
      {CODE_PANELS.map((panel, index) => (
        <Panel
          key={panel.id}
          texture={materials.panelMaterials[index].map as THREE.Texture}
          material={materials.panelMaterials[index]}
          frameMaterial={materials.frameMaterials[index]}
          width={panel.width}
          height={panel.width * (640 / (78 + panel.lines.length * 46 + 33))}
          position={panel.position}
          rotation={panel.rotation}
        />
      ))}
    </group>
  );
}
