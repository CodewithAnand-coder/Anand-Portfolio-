"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ReactElement, type ReactNode } from "react";
import * as THREE from "three";

import { ACCENT_HEX } from "@/data/skills";
import { projects, type Project } from "@/data/projects";
import { frame } from "@/lib/experience-store";
import { mulberry32, range } from "@/lib/random";
import { MAX_FRAME_DELTA } from "@/lib/utils";

import { DataStream, Glow, InstancedCubes, Label, Panel, WireRing, WireShell } from "../shared/primitives";
import { chartTexture } from "../shared/textures";
import { useFadeGroup } from "../shared/useFadeGroup";
import { useStation } from "../shared/useStation";

/* ============================================================================
   PROJECT WORLDS
   Five miniature environments, one per featured project, entered in sequence as
   the camera travels the corridor. Each is a different *kind* of data picture:

     churn      → a population of customers, coloured by risk, with the model's
                  explanation exposed as SHAP bars beside it
     fraud      → a transaction network with an obvious anomaly cluster and a
                  stream of legitimate flow passing a scanner
     dashboard  → five Business-Intelligence panels hanging in space
     rag        → a literal pipeline: query → embeddings → vector store → LLM → answer
     interview  → a console with an ATS score arc and orbiting question cards

   All five are mounted at once (the geometry is tiny) but only the one inside
   the camera's presence window is ever visible or drawn.
   ========================================================================= */

/* --------------------------------------------------------------------------- */
/* Shared bits                                                                  */
/* --------------------------------------------------------------------------- */

function ChartPanel({
  id,
  kind,
  accent,
  seed,
  heading,
  width,
  position,
  rotation,
  renderOrder = 3,
}: {
  id: string;
  kind: "bars" | "line" | "donut" | "kpi" | "table";
  accent: string;
  seed: number;
  heading: string;
  width: number;
  position: [number, number, number];
  rotation: [number, number, number];
  renderOrder?: number;
}) {
  const texture = useMemo(
    () => chartTexture(id, kind, accent, seed, heading),
    [id, kind, accent, seed, heading],
  );
  return (
    <Panel
      texture={texture}
      width={width}
      height={width * (340 / 512)}
      position={position}
      rotation={rotation}
      accent={accent}
      renderOrder={renderOrder}
    />
  );
}

/** A small proximity-wired node graph, used by the fraud world. */
function useNetwork(count: number, radius: number, seed: number, linksPerNode: number) {
  return useMemo(() => {
    const random = mulberry32(seed);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const r = radius * (0.45 + random() * 0.55);
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.cos(phi) * r * 0.7;
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
    }

    const segments: number[] = [];
    for (let i = 0; i < count; i += 1) {
      const distances: { index: number; distance: number }[] = [];
      for (let j = 0; j < count; j += 1) {
        if (i === j) continue;
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        distances.push({ index: j, distance: dx * dx + dy * dy + dz * dz });
      }
      distances.sort((a, b) => a.distance - b.distance);
      for (let k = 0; k < linksPerNode; k += 1) {
        const target = distances[k];
        if (target && i < target.index) {
          segments.push(
            positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
            positions[target.index * 3], positions[target.index * 3 + 1], positions[target.index * 3 + 2],
          );
        }
      }
    }

    const linkGeometry = new THREE.BufferGeometry();
    linkGeometry.setAttribute("position", new THREE.Float32BufferAttribute(segments, 3));
    linkGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius + 2);

    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    nodeGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius + 2);

    return { positions, linkGeometry, nodeGeometry };
  }, [count, radius, seed, linksPerNode]);
}

/** The station wrapper: presence, culling, dissolve and a slow drift. */
function ProjectStation({ project, children }: { project: Project; children: ReactNode }) {
  const root = useRef<THREE.Group>(null);
  const drift = useRef<THREE.Group>(null);
  const { presence } = useStation(`project-${project.index}`, {
    ref: root,
    hold: 5,
    fade: 17,
    cull: 40,
    onFrame: (value, delta) => {
      const dt = Math.min(delta, MAX_FRAME_DELTA);
      if (drift.current) {
        drift.current.rotation.y += dt * (0.045 + frame.velocity * 0.04);
        drift.current.rotation.x +=
          (frame.pointerNY * 0.1 - drift.current.rotation.x) * (1 - Math.exp(-1.2 * dt));
      }
      void value;
    },
  });

  useFadeGroup(root, presence);

  return (
    <group ref={root} name={`station-project-${project.index}`}>
      <Glow
        color={ACCENT_HEX[project.accent]}
        scale={22}
        opacity={0.16}
        position={[0, 0, -3]}
      />
      <group ref={drift}>{children}</group>
    </group>
  );
}

/* --------------------------------------------------------------------------- */
/* 1 — Customer churn prediction                                                */
/* --------------------------------------------------------------------------- */

function ChurnWorld() {
  const accent = ACCENT_HEX.signal;
  const danger = ACCENT_HEX.rose;

  const { colors, positions, sizes, atRisk } = useMemo(() => {
    const random = mulberry32(5150);
    const columns = 9;
    const rows = 7;
    const count = columns * rows;

    const colors = new Float32Array(count * 3);
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const safe = new THREE.Color(accent);
    const risky = new THREE.Color(danger);
    const mixed = new THREE.Color();

    let atRisk = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const index = row * columns + column;
        positions[index * 3] = (column / (columns - 1) - 0.5) * 11;
        positions[index * 3 + 1] = (row / (rows - 1) - 0.5) * 7.4;
        positions[index * 3 + 2] = range(random, -1.4, 1.4);

        // A skewed risk distribution: most customers are safe, a visible
        // minority are flagged. Mirrors the shape of a real churn problem.
        const roll = random();
        const risk = roll > 0.78 ? 0.72 + random() * 0.28 : roll * 0.45;
        if (risk > 0.6) atRisk += 1;

        mixed.copy(safe).lerp(risky, risk);
        colors[index * 3] = mixed.r;
        colors[index * 3 + 1] = mixed.g;
        colors[index * 3 + 2] = mixed.b;
        sizes[index] = risk > 0.6 ? 0.19 : 0.11;
      }
    }
    return { colors, positions, sizes, atRisk };
  }, [accent, danger]);

  // SHAP-style explanation bars: six features, signed contributions.
  const shapBars = useMemo(() => {
    const random = mulberry32(881);
    return Array.from({ length: 6 }, (_, index) => {
      const value = range(random, 0.25, 1);
      const positive = random() > 0.45;
      return { value, positive, x: -2.2 + index * 0.88 };
    });
  }, []);

  return (
    <>
      <InstancedCubes
        count={colors.length / 3}
        colors={colors}
        positions={positions}
        sizes={sizes}
      />

      <Label
        text="Customer Churn Prediction"
        sub={`${atRisk} of ${colors.length / 3} flagged at risk`}
        accent={accent}
        position={[0, 5.4, 0]}
        scale={5.6}
      />

      <Label text="High risk" accent={danger} position={[-6.4, 4.6, 0]} scale={2.3} />
      <Label text="Low risk" accent={accent} position={[6.4, 4.6, 0]} scale={2.3} />

      {/* Explanation bars — the SHAP layer made visible */}
      <group position={[0, -4.6, 1.4]}>
        {shapBars.map((bar, index) => (
          <mesh key={index} position={[bar.x, bar.value / 2, 0]}>
            <boxGeometry args={[0.34, bar.value, 0.34]} />
            <meshBasicMaterial
              color={bar.positive ? danger : accent}
              transparent
              opacity={0.85}
              toneMapped={false}
              blending={THREE.NormalBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
        <Label text="Explainable AI" accent={accent} position={[0, -0.9, 0.6]} scale={2.6} />
      </group>

      <ChartPanel
        id="churn-line"
        kind="line"
        accent={accent}
        seed={12}
        heading="Churn probability"
        width={3.3}
        position={[-6.6, -1.4, 3.4]}
        rotation={[0.04, 0.5, 0.01]}
      />
      <ChartPanel
        id="churn-kpi"
        kind="kpi"
        accent={accent}
        seed={31}
        heading="Retention uplift"
        width={2.9}
        position={[6.7, 1.6, 3]}
        rotation={[0.02, -0.5, -0.01]}
      />
    </>
  );
}

/* --------------------------------------------------------------------------- */
/* 2 — Credit card fraud detection                                              */
/* --------------------------------------------------------------------------- */

function FraudWorld() {
  const accent = ACCENT_HEX.iris;
  const danger = ACCENT_HEX.rose;

  const { linkGeometry, nodeGeometry, positions } = useNetwork(26, 4.4, 6161, 2);

  const nodeColors = useMemo(() => {
    const colors = new Float32Array((positions.length / 3) * 3);
    const safe = new THREE.Color(accent);
    const risky = new THREE.Color(danger);
    const random = mulberry32(77);
    // Cluster the anomalies in one hemisphere so the "fraud ring" is obvious.
    for (let i = 0; i < positions.length / 3; i += 1) {
      const isAnomaly = positions[i * 3] > 0.4 && random() > 0.45;
      const color = isAnomaly ? risky : safe;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return colors;
  }, [positions, accent, danger]);

  const nodeMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.34,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.NormalBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );

  const linkMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(accent),
        transparent: true,
        opacity: 0.2,
        blending: THREE.NormalBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [accent],
  );

  useEffect(
    () => () => {
      nodeMaterial.dispose();
      linkMaterial.dispose();
      linkGeometry.dispose();
      nodeGeometry.dispose();
    },
    [nodeMaterial, linkMaterial, linkGeometry, nodeGeometry],
  );

  return (
    <>
      {/* Transaction network with a visible anomaly cluster */}
      <group position={[4.4, -0.4, 0]}>
        <points geometry={nodeGeometry} material={nodeMaterial} />
        <lineSegments geometry={linkGeometry} material={linkMaterial} />
      </group>

      {/* Legitimate flow passing the scanner, and the deflected anomalies */}
      <DataStream from={[-13, 0.6, 0]} to={[0, 0.6, 0]} count={22} color={accent} speed={0.14} spread={0.5} size={0.13} />
      <DataStream from={[0, 0.6, 0]} to={[13, 0.6, 0]} count={16} color={ACCENT_HEX.signal} speed={0.16} spread={0.35} size={0.11} />
      <DataStream from={[0, 0.6, 0]} to={[7, -3.4, 0]} count={7} color={danger} speed={0.1} spread={0.3} size={0.14} curvature={0.8} />

      {/* Scanner gate */}
      <group position={[0, 0.6, 0]}>
        <WireRing radius={2.5} color={accent} opacity={0.55} rotation={[0, 0, 0]} />
        <WireRing radius={3.1} color={accent} opacity={0.22} rotation={[0.4, 0.2, 0]} />
        <WireRing radius={1.9} color={danger} opacity={0.3} rotation={[-0.3, 0, 0.2]} />
        <Glow color={accent} scale={5} opacity={0.25} />
      </group>

      <WireShell radius={5.2} detail={0} color={accent} opacity={0.08} position={[4.4, -0.4, 0]} />

      <Label
        text="Credit Card Fraud Detection"
        sub="Anomaly cluster isolated from legitimate flow"
        accent={accent}
        position={[-2.5, 5.2, 0]}
        scale={5.6}
      />
      <Label text="Scanner" accent={accent} position={[0, -1.1, 0]} scale={2.1} />
      <Label text="Flagged" accent={danger} position={[7, -4.6, 0]} scale={2.1} />

      <ChartPanel
        id="fraud-donut"
        kind="donut"
        accent={accent}
        seed={44}
        heading="Class balance"
        width={3}
        position={[-6.6, 1.8, 3.2]}
        rotation={[0.03, 0.52, 0]}
      />
      <ChartPanel
        id="fraud-bars"
        kind="bars"
        accent={danger}
        seed={91}
        heading="Anomaly signals"
        width={3}
        position={[-6.2, -2.4, 2.4]}
        rotation={[0.02, 0.46, 0]}
      />
    </>
  );
}

/* --------------------------------------------------------------------------- */
/* 3 — Power BI dashboard                                                        */
/* --------------------------------------------------------------------------- */

function DashboardWorld() {
  const accent = ACCENT_HEX.amber;

  // Panels drift independently, so the dashboards read as suspended objects.
  const panels = useMemo(
    () => [
      { id: "dash-kpi", kind: "kpi" as const, seed: 3, heading: "Total sales", width: 2.9, position: [-6.3, 2.3, 2.6] as [number, number, number], rotation: [0.05, 0.46, 0.015] as [number, number, number] },
      { id: "dash-line", kind: "line" as const, seed: 17, heading: "Sales trend", width: 3.7, position: [-0.4, 2.7, 1.2] as [number, number, number], rotation: [0.02, 0.12, 0] as [number, number, number] },
      { id: "dash-bars", kind: "bars" as const, seed: 29, heading: "Profit by region", width: 3.4, position: [5.9, 1.7, 2] as [number, number, number], rotation: [0.04, -0.42, -0.01] as [number, number, number] },
      { id: "dash-donut", kind: "donut" as const, seed: 51, heading: "Customer mix", width: 3, position: [-4.2, -2.4, 2.2] as [number, number, number], rotation: [0.03, 0.4, 0] as [number, number, number] },
      { id: "dash-table", kind: "table" as const, seed: 63, heading: "Top products", width: 3.8, position: [2.6, -2.7, 1.6] as [number, number, number], rotation: [0.02, -0.24, 0] as [number, number, number] },
    ],
    [],
  );

  return (
    <>
      <Label
        text="ClipKart Sales Dashboard"
        sub="Power BI · Power Query · Data modelling"
        accent={accent}
        position={[0, 5.4, 0]}
        scale={5.8}
      />

      {panels.map((panel, index) => (
        <ChartPanel
          key={panel.id}
          id={panel.id}
          kind={panel.kind}
          accent={accent}
          seed={panel.seed}
          heading={panel.heading}
          width={panel.width}
          position={panel.position}
          rotation={panel.rotation}
        />
      ))}

      {/* KPI rails connecting the dashboards */}
      <mesh rotation={[0, 0, 0]} position={[0, 0, 0.4]}>
        <boxGeometry args={[17, 0.012, 0.012]} />
        <meshBasicMaterial color={accent} transparent opacity={0.3} toneMapped={false} blending={THREE.NormalBlending} />
      </mesh>
      <mesh position={[0, 0, 0.4]}>
        <boxGeometry args={[0.012, 9, 0.012]} />
        <meshBasicMaterial color={accent} transparent opacity={0.22} toneMapped={false} blending={THREE.NormalBlending} />
      </mesh>
    </>
  );
}

/* --------------------------------------------------------------------------- */
/* 4 — YouTube playlist RAG assistant                                            */
/* --------------------------------------------------------------------------- */

function RagWorld() {
  const accent = ACCENT_HEX.violet;
  const signal = ACCENT_HEX.signal;

  const stages = useMemo(
    () => [
      { label: "Query", x: -10.5 },
      { label: "Embeddings", x: -5.6 },
      { label: "Vector store", x: -0.7 },
      { label: "LLM", x: 4.2 },
      { label: "Answer", x: 9.1 },
    ],
    [],
  );

  // Embedding lattice: a 6×6 wall of tiny points representing the vector space.
  const embeddingGeometry = useMemo(() => {
    const positions: number[] = [];
    for (let row = 0; row < 6; row += 1) {
      for (let column = 0; column < 6; column += 1) {
        positions.push(
          -5.6,
          (row / 5 - 0.5) * 2.6,
          (column / 5 - 0.5) * 2.6,
        );
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(-5.6, 0, 0), 3);
    return geometry;
  }, []);

  // Vector store: a dense cloud, high-dimensional space visualised as a haze.
  const storeGeometry = useMemo(() => {
    const random = mulberry32(31337);
    const count = 90;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const radius = 1.55 * Math.cbrt(random());
      positions[i * 3] = -0.7 + Math.sin(phi) * Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.cos(phi) * radius;
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(-0.7, 0, 0), 3);
    return geometry;
  }, []);

  const storeMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.13,
        color: new THREE.Color(signal),
        transparent: true,
        opacity: 0.9,
        blending: THREE.NormalBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [signal],
  );

  const embeddingMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.1,
        color: new THREE.Color(accent),
        transparent: true,
        opacity: 0.75,
        blending: THREE.NormalBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [accent],
  );

  useEffect(
    () => () => {
      embeddingGeometry.dispose();
      storeGeometry.dispose();
      storeMaterial.dispose();
      embeddingMaterial.dispose();
    },
    [embeddingGeometry, storeGeometry, storeMaterial, embeddingMaterial],
  );

  return (
    <>
      <Label
        text="YouTube Playlist RAG Assistant"
        sub="Retrieval-augmented generation over an educational playlist"
        accent={accent}
        position={[0, 5.6, 0]}
        scale={6}
      />

      {/* Query node */}
      <group position={[-10.5, 0, 0]}>
        <mesh>
          <icosahedronGeometry args={[0.62, 1]} />
          <meshBasicMaterial color={accent} wireframe transparent opacity={0.85} toneMapped={false} />
        </mesh>
        <Glow color={accent} scale={3.4} opacity={0.5} />
      </group>

      {/* Embedding lattice */}
      <points geometry={embeddingGeometry} material={embeddingMaterial} />

      {/* Vector store */}
      <points geometry={storeGeometry} material={storeMaterial} />
      <WireShell radius={1.9} detail={1} color={signal} opacity={0.16} position={[-0.7, 0, 0]} />

      {/* LLM block */}
      <group position={[4.2, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.7, 1.7, 1.7]} />
          <meshBasicMaterial color={accent} wireframe transparent opacity={0.6} toneMapped={false} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.5, 1]} />
          <meshBasicMaterial color="#2c4a86" transparent opacity={0.85} toneMapped={false} blending={THREE.NormalBlending} />
        </mesh>
        <Glow color={accent} scale={4.4} opacity={0.42} />
      </group>

      {/* Result card */}
      <ChartPanel
        id="rag-result"
        kind="table"
        accent={signal}
        seed={7}
        heading="Ranked videos"
        width={2.7}
        position={[9.1, 0, 0.2]}
        rotation={[0, -1.35, 0]}
      />

      {/* The pipeline itself */}
      <DataStream from={[-10.5, 0, 0]} to={[-5.6, 0, 0]} count={12} color={accent} speed={0.4} spread={0.35} size={0.11} />
      <DataStream from={[-5.6, 0, 0]} to={[-0.7, 0, 0]} count={16} color={signal} speed={0.34} spread={0.4} size={0.1} />
      <DataStream from={[-0.7, 0, 0]} to={[4.2, 0, 0]} count={14} color={accent} speed={0.38} spread={0.35} size={0.11} />
      <DataStream from={[4.2, 0, 0]} to={[9.1, 0, 0]} count={10} color={signal} speed={0.42} spread={0.3} size={0.12} />

      {/* Stage captions */}
      {stages.map((stage) => (
        <Label key={stage.label} text={stage.label} accent={accent} position={[stage.x, -2.5, 0]} scale={2.2} />
      ))}
    </>
  );
}

/* --------------------------------------------------------------------------- */
/* 5 — InterviewReady AI                                                         */
/* --------------------------------------------------------------------------- */

function InterviewWorld() {
  const accent = ACCENT_HEX.iris;
  const amber = ACCENT_HEX.amber;

  const cards = useRef<THREE.Group>(null);

  // Orbiting question cards — a rotating carousel of practice prompts.
  const cardSeeds = useMemo(() => [101, 202, 303, 404, 505, 606], []);

  useFrame((state) => {
    if (cards.current) {
      cards.current.rotation.y = state.clock.elapsedTime * 0.24;
    }
  });

  return (
    <>
      <Label
        text="InterviewReady AI"
        sub="Interview practice · resume analysis · ATS scoring"
        accent={accent}
        position={[0, 5.6, 0]}
        scale={5.8}
      />

      {/* Console */}
      <mesh position={[0, -3.4, 0]} rotation={[0.32, 0, 0]}>
        <boxGeometry args={[7.4, 0.16, 3.2]} />
        <meshBasicMaterial color={accent} transparent opacity={0.18} toneMapped={false} blending={THREE.NormalBlending} />
      </mesh>

      {/* ATS score arc */}
      <group position={[-4.4, 0.6, 1.4]}>
        <WireRing radius={1.5} tube={0.06} color={amber} opacity={0.95} arc={Math.PI * 2 * 0.86} rotation={[0, 0, Math.PI * 0.5]} />
        <WireRing radius={1.5} tube={0.014} color={amber} opacity={0.2} />
        <Glow color={amber} scale={4.2} opacity={0.3} />
        <Label text="ATS match" accent={amber} position={[0, -2.2, 0]} scale={2.2} />
      </group>

      {/* Answer quality panels */}
      <ChartPanel
        id="interview-bars"
        kind="bars"
        accent={accent}
        seed={151}
        heading="Strengths & gaps"
        width={3.2}
        position={[3.6, 1.2, 1.8]}
        rotation={[0.03, -0.34, 0]}
      />
      <ChartPanel
        id="interview-kpi"
        kind="kpi"
        accent={amber}
        seed={171}
        heading="Feedback score"
        width={2.7}
        position={[-2.2, 2.4, 2.6]}
        rotation={[0.04, 0.3, 0]}
      />

      {/* Orbiting practice questions */}
      <group ref={cards}>
        {cardSeeds.map((seed, index) => {
          const angle = (index / cardSeeds.length) * Math.PI * 2;
          const radius = 6.4;
          return (
            <ChartPanel
              key={seed}
              id={`interview-q-${seed}`}
              kind="table"
              accent={accent}
              seed={seed}
              heading={`Question ${index + 1}`}
              width={1.9}
              position={[Math.cos(angle) * radius, 0.4, Math.sin(angle) * radius]}
              rotation={[0, -angle + Math.PI / 2, 0]}
            />
          );
        })}
      </group>
    </>
  );
}

/* --------------------------------------------------------------------------- */
/* Dispatcher                                                                    */
/* --------------------------------------------------------------------------- */

const WORLDS: Record<Project["scene"], () => ReactElement> = {
  churn: ChurnWorld,
  fraud: FraudWorld,
  dashboard: DashboardWorld,
  rag: RagWorld,
  interview: InterviewWorld,
};

export function ProjectStations() {
  return (
    <>
      {projects.map((project) => {
        const World = WORLDS[project.scene];
        return (
          <ProjectStation key={project.id} project={project}>
            <World />
          </ProjectStation>
        );
      })}
    </>
  );
}
