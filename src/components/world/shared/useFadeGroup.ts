"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import type * as THREE from "three";

type Entry = { material: THREE.Material; base: number };

/**
 * Dissolves a whole subtree against a station presence value.
 *
 * For scenes made of many small parts — the project worlds, each built from
 * dozens of instanced cubes, panel quads and points — wiring every material into
 * a hand-maintained array is unmaintainable, and traversing the graph every
 * frame is wasteful.
 *
 * So: walk the subtree **once** after mount, cache the material list with each
 * material's authored opacity, then do nothing per frame but multiply. Materials
 * that already registered their own base opacity (via `withBaseOpacity`) are
 * skipped so a station's explicit fade list always wins.
 */
export function useFadeGroup(
  ref: RefObject<THREE.Object3D | null>,
  presenceRef: RefObject<number>,
) {
  const entries = useRef<Entry[]>([]);
  const built = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const collected: Entry[] = [];
    node.traverse((child) => {
      const material = (child as THREE.Mesh).material;
      if (!material) return;
      const list = Array.isArray(material) ? material : [material];
      for (const entry of list) {
        if (!entry || entry.userData.baseOpacity !== undefined) continue;
        collected.push({ material: entry, base: entry.opacity ?? 1 });
      }
    });

    for (const entry of collected) {
      entry.material.transparent = true;
      entry.material.needsUpdate = true;
    }

    entries.current = collected;
    built.current = true;

    return () => {
      built.current = false;
      entries.current = [];
    };
  }, [ref]);

  useFrame(() => {
    if (!built.current) return;
    const presence = presenceRef.current;
    for (const entry of entries.current) {
      entry.material.opacity = entry.base * presence;
    }
  });
}
