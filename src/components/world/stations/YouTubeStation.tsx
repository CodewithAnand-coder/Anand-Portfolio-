"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { youtube, youtubeTopics } from "@/data/youtube";
import { frame } from "@/lib/experience-store";
import { MAX_FRAME_DELTA } from "@/lib/utils";

import { fadeMaterials, withBaseOpacity } from "../shared/fade";
import { Glow, Label, Panel, WireRing } from "../shared/primitives";
import { channelTexture } from "../shared/textures";
import { useFadeGroup } from "../shared/useFadeGroup";
import { useStation } from "../shared/useStation";

/* ============================================================================
   YOUTUBE — "the studio"
   A laptop in space: screen, base and hinge, with the channel's topic list
   orbiting it as labelled nodes and a growth curve rising behind. It is the
   section where the personal brand lives, so it gets an object rather than a
   wall of text.
   ========================================================================= */

const SCREEN_WIDTH = 6.6;
/** Source canvas is 800×460. */
const SCREEN_ASPECT = 800 / 460;
const TOPIC_RADIUS = 8.2;

export function YouTubeStation() {
  const root = useRef<THREE.Group>(null);
  const topics = useRef<THREE.Group>(null);
  const playRing = useRef<THREE.Group>(null);

  const resources = useMemo(() => {
    const baseMaterial = withBaseOpacity(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#1e3a6e"),
        transparent: true,
        toneMapped: false,
      }),
      0.95,
    );

    const edgeMaterial = withBaseOpacity(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#dc2626"),
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        toneMapped: false,
      }),
      0.4,
    );

    const base = new THREE.BoxGeometry(SCREEN_WIDTH + 0.9, 0.14, 1.7);
    const wedge = new THREE.CylinderGeometry(0.08, 0.08, SCREEN_WIDTH + 0.9, 8);

    return { base, wedge, baseMaterial, edgeMaterial };
  }, []);

  const screenTexture = useMemo(() => channelTexture(), []);

  useEffect(
    () => () => {
      resources.base.dispose();
      resources.wedge.dispose();
      resources.baseMaterial.dispose();
      resources.edgeMaterial.dispose();
    },
    [resources],
  );

  const { presence } = useStation("youtube", {
    ref: root,
    hold: 6,
    fade: 20,
    cull: 42,
  });

  useFadeGroup(root, presence);

  useFrame((state, delta) => {
    const dt = Math.min(delta, MAX_FRAME_DELTA);
    fadeMaterials([resources.baseMaterial, resources.edgeMaterial], presence.current);

    if (topics.current) {
      topics.current.rotation.y += dt * (0.07 + frame.velocity * 0.05);
    }
    if (playRing.current) {
      // A slow breathing pulse on the play glyph ring.
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.1) * 0.05;
      playRing.current.scale.setScalar(pulse);
    }
  });

  /** Topics split across two arcs so ten labels never overlap. */
  const topicLayout = useMemo(
    () =>
      youtubeTopics.map((topic, index) => {
        const arc = index % 2; // 0 = front arc, 1 = back arc
        const itemsInArc = Math.ceil(youtubeTopics.length / 2);
        const positionInArc = Math.floor(index / 2);
        const angle =
          (positionInArc / Math.max(1, itemsInArc - 1)) * Math.PI * 1.25 -
          Math.PI * 0.625 +
          (arc === 1 ? Math.PI / itemsInArc : 0);
        const radius = arc === 0 ? TOPIC_RADIUS : TOPIC_RADIUS - 1.9;
        return {
          topic,
          position: [
            Math.sin(angle) * radius,
            arc === 0 ? -1.5 : 1.5,
            -Math.cos(angle) * radius,
          ] as [number, number, number],
          accent: arc === 0 ? "#dc2626" : "#2f6fdb",
        };
      }),
    [],
  );

  const screenHeight = SCREEN_WIDTH / SCREEN_ASPECT;

  return (
    <group ref={root} name="station-youtube">
      <Glow color="#dc2626" scale={24} opacity={0.08} position={[0, 1, -4]} />

      <Label
        text={youtube.channel}
        sub={`${youtube.handle} · Excel · Analytics · AI workflows`}
        accent="#dc2626"
        position={[0, 5.2, 2.4]}
        scale={6}
      />

      {/* The laptop */}
      <group position={[0, 0.3, 0]}>
        <Panel
          texture={screenTexture}
          width={SCREEN_WIDTH}
          height={screenHeight}
          accent="#dc2626"
          renderOrder={3}
        />

        {/* Hinge line + base */}
        <mesh geometry={resources.base} material={resources.baseMaterial} position={[0, -screenHeight / 2 - 0.34, 0.5]} />
        <mesh
          geometry={resources.wedge}
          material={resources.edgeMaterial}
          rotation={[0, 0, Math.PI / 2]}
          position={[0, -screenHeight / 2 - 0.26, 0.55]}
        />

        {/* Play glyph ring, pulsing in front of the screen */}
        <group position={[0, 0, 0.06]} ref={playRing}>
          <WireRing radius={1.5} tube={0.02} color="#dc2626" opacity={0.5} />
        </group>

        {/* Keyboard pool */}
        <mesh position={[0, -screenHeight / 2 - 0.28, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[SCREEN_WIDTH + 0.6, 1.5]} />
          <meshBasicMaterial
            color="#2f6fdb"
            transparent
            opacity={0.06}
            blending={THREE.NormalBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Topic constellation */}
      <group ref={topics}>
        {topicLayout.map((entry) => (
          <group key={entry.topic.id} position={entry.position}>
            <mesh>
              <sphereGeometry args={[0.09, 10, 10]} />
              <meshBasicMaterial color={entry.accent} transparent opacity={0.9} toneMapped={false} />
            </mesh>
            <Glow color={entry.accent} scale={1.3} opacity={0.4} />
            <Label text={entry.topic.label} accent={entry.accent} position={[0, 0.44, 0]} scale={2.3} />
          </group>
        ))}
      </group>
    </group>
  );
}
