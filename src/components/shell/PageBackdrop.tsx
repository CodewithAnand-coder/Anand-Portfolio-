/**
 * The light page backdrop that sits beneath the content and behind the 3D
 * canvas (the canvas is z-0 and transparent over it).
 *
 * Three jobs: paint the page white before WebGL arrives, provide the subtle
 * depth gradients and blueprint texture that keep a white page from feeling
 * flat, and remain the whole visual environment for visitors on reduced-motion
 * or no-WebGL devices.
 */
export function PageBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-white">
      {/* Soft brand-tinted pools — the light-theme equivalent of studio lighting */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 40% at 18% 12%, rgba(47,111,219,0.07), transparent 70%), radial-gradient(50% 38% at 85% 75%, rgba(90,97,224,0.06), transparent 72%), radial-gradient(42% 30% at 60% 4%, rgba(22,48,91,0.05), transparent 70%)",
        }}
      />

      {/* Faint blueprint grid, masked so it fades toward the edges */}
      <div
        className="grid-veil absolute inset-0 opacity-60"
        style={{
          maskImage: "radial-gradient(80% 65% at 50% 38%, rgba(0,0,0,0.8), transparent 80%)",
          WebkitMaskImage: "radial-gradient(80% 65% at 50% 38%, rgba(0,0,0,0.8), transparent 80%)",
        }}
      />
    </div>
  );
}
