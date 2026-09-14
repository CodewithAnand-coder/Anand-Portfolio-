import type * as THREE from "three";

/**
 * Station-level dissolve helpers.
 *
 * Fog handles depth, but it is not aggressive enough to hide a neighbouring
 * station 26 units down the corridor, so each station also fades its own
 * materials against its presence value. Registering the *base* opacity on the
 * material once means the per-frame work is a single multiply per material
 * instead of a scene-graph traversal.
 */

export function withBaseOpacity<T extends THREE.Material>(material: T, base: number): T {
  material.transparent = true;
  material.opacity = base;
  material.userData.baseOpacity = base;
  return material;
}

/** Scale a registered set of materials against a station presence value. */
export function fadeMaterials(materials: readonly THREE.Material[], presence: number) {
  for (const material of materials) {
    const base = (material.userData.baseOpacity as number | undefined) ?? 1;
    material.opacity = base * presence;
  }
}

/**
 * Same treatment for emissive strength: an emissive surface that keeps glowing
 * at full power while its body fades looks like a bug rather than a dissolve.
 */
export function withBaseEmissive<T extends THREE.MeshStandardMaterial>(
  material: T,
  base: number,
): T {
  material.userData.baseEmissive = base;
  return material;
}

export function fadeEmissive(
  materials: readonly THREE.MeshStandardMaterial[],
  presence: number,
) {
  for (const material of materials) {
    const base = (material.userData.baseEmissive as number | undefined) ?? 1;
    material.emissiveIntensity = base * presence;
  }
}
