/**
 * Automated browser check for the portfolio.
 *
 * A WebGL page cannot be verified by looking at its HTML — the interesting state
 * lives inside a render loop. So this drives a real Chrome instance against the
 * production build and reports the things that actually indicate breakage:
 *
 *   • console errors and page exceptions (the highest-signal failure mode)
 *   • failed network requests
 *   • per-station camera depth against the station's expected depth, which proves
 *     the scroll -> corridor mapping is aligned
 *   • which stations are genuinely visible, draw calls, triangles, program count
 *   • frame timings (see the caveat below)
 *   • the reduced-motion path, which must render the page with NO canvas at all
 *
 * CAVEAT ON FPS: this runs headless on SwiftShader (a software rasteriser), so
 * the frame rates are far below any real GPU. They are useful only for spotting
 * catastrophic regressions. Draw-call, triangle and program counts are hardware
 * independent and are the metrics worth trusting here.
 *
 * Usage: node scripts/diagnose.mjs [--url http://localhost:3111] [--shots]
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { existsSync } from "node:fs";
import process from "node:process";

import puppeteer from "puppeteer-core";

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

const args = process.argv.slice(2);
const readArg = (name, fallback) => {
  const index = args.indexOf(name);
  return index !== -1 && args[index + 1] ? args[index + 1] : fallback;
};

const BASE_URL = readArg("--url", "http://localhost:3111");
const SHOTS = args.includes("--shots");
const OUT_DIR = "diagnostics";

/** Stations worth deep-inspecting (the rest are sampled for alignment only). */
const executablePath = CHROME_CANDIDATES.find((path) => existsSync(path));
if (!executablePath) {
  console.error("No Chrome/Chromium binary found.");
  process.exit(1);
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Luminance statistics for a captured frame.
 *
 * Draw-call counts prove the renderer was asked to draw; they do not prove the
 * visitor saw anything. A scene that renders into a black frame, or a camera
 * pointed at empty space, still issues plenty of draw calls. So each station's
 * frame is decoded and reduced to mean luminance, standard deviation and the
 * share of clearly-bright pixels:
 *
 *   • a blank or all-black frame gives mean < 6 and sd < 4
 *   • a real scene of emissive geometry in fog plus lit text sits far above that
 *
 * Decoding happens inside the page (an <img> into a 2D canvas) so no image
 * library is needed on the Node side.
 */
async function analyseFrame(page, buffer) {
  const base64 = Buffer.from(buffer).toString("base64");
  return page.evaluate(async (encoded) => {
    const image = new Image();
    image.src = `data:image/jpeg;base64,${encoded}`;
    await image.decode();

    // Downsample: enough samples to be statistically meaningful, cheap to read.
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 160;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let sum = 0;
    let sumSquares = 0;
    let bright = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
      const luminance = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      sum += luminance;
      sumSquares += luminance * luminance;
      if (luminance > 60) bright += 1;
      count += 1;
    }

    const mean = sum / count;
    const sd = Math.sqrt(Math.max(0, sumSquares / count - mean * mean));
    return {
      mean: Number(mean.toFixed(1)),
      sd: Number(sd.toFixed(1)),
      brightPct: Number(((100 * bright) / count).toFixed(2)),
    };
  }, base64);
}

const findings = [];
const note = (level, message) => findings.push({ level, message });

/* --------------------------------------------------------------------------- */

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-gpu-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--hide-scrollbars",
    "--mute-audio",
  ],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
});

const report = { url: BASE_URL, desktop: null, mobile: null, reducedMotion: null, errors: {}, warnings: {} };

try {
  /* ==========================================================================
     PASS 1 — Desktop, full corridor
     ======================================================================== */

  const page = await browser.newPage();

  const consoleErrors = [];
  const consoleWarnings = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error") consoleErrors.push(text);
    else if (message.type() === "warning") consoleWarnings.push(text);
  });
  page.on("pageerror", (error) => pageErrors.push(error?.stack ?? String(error)));
  page.on("requestfailed", (request) =>
    failedRequests.push(`${request.url()} :: ${request.failure()?.errorText ?? "unknown"}`),
  );

  await page.goto(`${BASE_URL}/?debug=1`, { waitUntil: "networkidle2", timeout: 90_000 });

  // Wait for the world to report a real drawn frame.
  const ready = await page
    .waitForFunction(() => window.__world?.ready === true, { timeout: 45_000 })
    .then(() => true)
    .catch(() => false);

  if (!ready) note("error", "World never reported a drawn frame within 45s (window.__world.ready stayed false).");

  const glInfo = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return { canvas: false };
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    const debugInfo = gl?.getExtension("WEBGL_debug_renderer_info");
    return {
      canvas: true,
      backingSize: [canvas.width, canvas.height],
      renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "unknown",
      isWebGL2: typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext,
    };
  });

  if (!glInfo.canvas) note("error", "No <canvas> mounted — the WebGL world did not initialise.");

  // Preloader must have handed over.
  // Give the preloader its minimum display window (MIN_VISIBLE_MS) plus a
  // generous margin for the fade-out animation before asserting it is gone.
  await wait(2500);
  const preloaderGone = await page.evaluate(
    () => !document.querySelector('[role="status"][aria-live="polite"]'),
  );
  if (!preloaderGone) note("error", "Preloader curtain is still on screen after the world reported ready.");

  const stations = await page.evaluate(() => [...(window.__world?.stations ?? [])]);
  const declaredZ = new Map(
    (await page.evaluate(() => window.__world.corridor())).map((span) => [span.id, span.z]),
  );
  const perStation = [];

  for (const station of stations) {
    await page.evaluate((id) => window.__world.snapTo(id), station);
    await wait(SHOTS ? 900 : 350);

    const snap = await page.evaluate(() => window.__world.snapshot());
    const expectedZ = declaredZ.get(station) ?? NaN;
    perStation.push({ ...snap, requested: station, expectedZ });

    // 1. Snapping to a station's measured document centre must land the camera on
    //    that station's declared depth. This is the check that proves the
    //    scroll -> corridor mapping is genuinely aligned, not approximately so.
    const drift = Math.abs(snap.stationZ - expectedZ);
    if (!(drift <= 1.5)) {
      note(
        "error",
        `Camera misaligned at "${station}": declared depth ${expectedZ}, camera at ${snap.stationZ} (drift ${drift.toFixed(2)}).`,
      );
    }

    // 2. The station we asked for must be the one the app reports as active, and
    //    must actually be in the render tree and visible.
    if (snap.activeStation !== station) {
      note("error", `Active station mismatch: asked for "${station}", app reports "${snap.activeStation}".`);
    }
    if (!snap.visibleStations.includes(`station-${station}`)) {
      note(
        "error",
        `Station "${station}" is not visible when centred (visible: ${
          snap.visibleStations.join(", ") || "none"
        }).`,
      );
    }

    // 3. The station that is centred must actually be issuing draw calls.
    if (snap.drawCalls <= 2) {
      note(
        "error",
        `Only ${snap.drawCalls} draw call(s) at "${station}" — the scene is not rendering (postprocessing passes alone would exceed this).`,
      );
    }
    if (snap.drawCalls > 320) {
      note("warn", `High draw-call count at "${station}": ${snap.drawCalls}.`);
    }

    // Always capture a frame for analysis; only persist it when asked.
    const frameShot = await page.screenshot({ type: "jpeg", quality: 72 });
    const pixels = await analyseFrame(page, frameShot);
    perStation[perStation.length - 1].pixels = pixels;

    if (pixels.sd < 4) {
      note(
        "error",
        `Frame at "${station}" is visually flat (luminance sd ${pixels.sd}, mean ${pixels.mean}) — the station may be rendering empty space.`,
      );
    }

    if (SHOTS) {
      mkdirSync(OUT_DIR, { recursive: true });
      writeFileSync(
        `${OUT_DIR}/${String(stations.indexOf(station)).padStart(2, "0")}-${station}.jpg`,
        frameShot,
      );
    }
  }

  /* ---- Does the WebGL layer actually contribute visible pixels? ---------- */

  await page.evaluate(() => window.__world.snapTo("skills"));
  const withCanvas = await analyseFrame(page, await page.screenshot({ type: "jpeg", quality: 72 }));

  await page.evaluate(() => {
    const style = document.createElement("style");
    style.id = "__diag-no-gl";
    style.textContent = "canvas{display:none !important}";
    document.head.appendChild(style);
  });
  const withoutCanvas = await analyseFrame(page, await page.screenshot({ type: "jpeg", quality: 72 }));
  await page.evaluate(() => document.getElementById("__diag-no-gl")?.remove());

  report.canvasContribution = { withCanvas, withoutCanvas };

  // If hiding the canvas barely changes the frame, the 3D scene is not actually
  // visible to the visitor — the single most important thing to catch.
  // On a light page the 3D layer is an accent over white, so the mean-luminance
  // delta is small by design. Structure (sd) and the textured-pixel share are
  // the honest signals: geometry adds high-frequency detail the flat page lacks.
  const luminanceDelta = Math.abs(withCanvas.mean - withoutCanvas.mean);
  const textureDelta = withCanvas.sd - withoutCanvas.sd;
  const brightDelta = withoutCanvas.brightPct - withCanvas.brightPct;

  if (textureDelta < 0.8 && brightDelta < 0.08) {
    note(
      "error",
      `Hiding the WebGL canvas barely changes the frame (sd delta ${textureDelta.toFixed(2)}, bright-share delta ${brightDelta.toFixed(2)}pp) — the 3D world is not visibly contributing.`,
    );
  }

  // Does scrolling past the end still progress the camera to the final station?
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" }));
  await wait(1200);
  const atEnd = await page.evaluate(() => window.__world.snapshot());
  if (atEnd.progress < 0.99) {
    note("warn", `Scroll progress only reached ${atEnd.progress} at the bottom of the document.`);
  }

  // Idle frame pacing at the last station.
  const idle = await page.evaluate(async () => {
    const samples = [];
    let last = performance.now();
    await new Promise((resolve) => {
      let count = 0;
      const tick = () => {
        const now = performance.now();
        samples.push(now - last);
        last = now;
        if (++count >= 90) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    samples.sort((a, b) => a - b);
    return {
      median: samples[Math.floor(samples.length / 2)],
      p95: samples[Math.floor(samples.length * 0.95)],
      worst: samples[samples.length - 1],
    };
  });

  const worstStation = perStation.reduce(
    (worst, snap) => (snap.drawCalls > (worst?.drawCalls ?? -1) ? snap : worst),
    null,
  );

  report.desktop = {
    glInfo,
    ready,
    preloaderGone,
    stations: perStation.map((snap) => ({
      requested: snap.requested,
      active: snap.activeStation,
      depth: snap.stationZ,
      declaredZ: snap.expectedZ,
      visible: snap.visibleStations.length,
      visibleNames: snap.visibleStations,
      drawCalls: snap.drawCalls,
      triangles: snap.triangles,
      programs: snap.programs,
      textures: snap.textures,
      fps: snap.fps,
      pixels: snap.pixels,
    })),
    peak: {
      drawCalls: worstStation?.drawCalls ?? 0,
      atStation: worstStation?.activeStation ?? "n/a",
      triangles: Math.max(...perStation.map((snap) => snap.triangles)),
      geometries: Math.max(...perStation.map((snap) => snap.geometries)),
      textures: Math.max(...perStation.map((snap) => snap.textures)),
      dpr: perStation[0]?.dpr ?? 0,
    },
    idleFrameMs: idle,
  };

  if (pageErrors.length) pageErrors.forEach((error) => note("error", `Page exception: ${error.split("\n")[0]}`));
  if (consoleErrors.length)
    consoleErrors.forEach((error) => note("error", `Console error: ${error.slice(0, 300)}`));
  if (failedRequests.length)
    failedRequests.forEach((request) => note("error", `Failed request: ${request}`));
  if (consoleWarnings.length)
    consoleWarnings.slice(0, 10).forEach((warning) => note("warn", `Console warning: ${warning.slice(0, 250)}`));

  report.errors = { consoleErrors, pageErrors, failedRequests };
  report.warnings = { consoleWarnings };

  await page.close();

  /* ==========================================================================
     PASS 2 — Mobile viewport
     ======================================================================== */

  const mobile = await browser.newPage();
  const mobileErrors = [];
  mobile.on("pageerror", (error) => mobileErrors.push(error?.stack ?? String(error)));
  mobile.on("console", (message) => {
    if (message.type() === "error") mobileErrors.push(message.text());
  });

  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobile.goto(`${BASE_URL}/?debug=1`, { waitUntil: "networkidle2", timeout: 90_000 });
  await mobile
    .waitForFunction(() => window.__world !== undefined, { timeout: 45_000 })
    .catch(() => note("error", "Mobile: world diagnostics never appeared."));
  await mobile.evaluate(() => window.__world.snapTo("skills")).catch(() => {});
  await wait(1500);

  const mobileSnap = await mobile.evaluate(() => window.__world?.snapshot?.() ?? null).catch(() => null);

  if (mobileSnap) {
    report.mobile = {
      viewport: mobileSnap.viewport,
      dpr: mobileSnap.dpr,
      drawCalls: mobileSnap.drawCalls,
      triangles: mobileSnap.triangles,
      visibleStations: mobileSnap.visibleStations.length,
    };
    if (mobileSnap.dpr > 1.6) {
      note("warn", `Mobile dpr is ${mobileSnap.dpr}; the low/mid tier should cap this below 1.6.`);
    }
    if (mobileSnap.drawCalls > 260) {
      note("warn", `Mobile draw calls are high (${mobileSnap.drawCalls}); consider a lower tier on phones.`);
    }
  }

  // Horizontal overflow is the classic mobile failure for a full-bleed 3D page.
  const overflow = await mobile.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (overflow.scrollWidth > overflow.clientWidth + 1) {
    note("error", `Horizontal overflow on mobile: ${overflow.scrollWidth}px content in ${overflow.clientWidth}px viewport.`);
  }
  report.mobile = { ...(report.mobile ?? {}), overflow, errors: mobileErrors };
  mobileErrors.forEach((error) => note("error", `Mobile error: ${error.split("\n")[0]}`));

  await mobile.close();

  /* ==========================================================================
     PASS 3 — Reduced motion (must render the page with NO canvas)
     ======================================================================== */

  const reduced = await browser.newPage();
  await reduced.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await reduced.setViewport({ width: 1440, height: 900 });
  await reduced.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 90_000 });
  await wait(4000);

  const reducedState = await reduced.evaluate(() => ({
    canvas: document.querySelectorAll("canvas").length,
    preloader: Boolean(document.querySelector('[role="status"][aria-live="polite"]')),
    sections: document.querySelectorAll("[data-station]").length,
    h1: document.querySelector("h1")?.textContent?.trim() ?? null,
    bodyHeight: document.body.scrollHeight,
  }));

  report.reducedMotion = reducedState;

  if (reducedState.canvas !== 0) {
    note("error", `Reduced motion still mounted ${reducedState.canvas} canvas element(s); it should mount none.`);
  }
  if (reducedState.sections !== 15) {
    note("error", `Reduced motion: expected 15 stations, found ${reducedState.sections}.`);
  }
  if (reducedState.preloader) {
    note("error", "Reduced motion: preloader never dismissed (a visitor could be stuck behind it).");
  }
  if (!reducedState.h1) {
    note("error", "Reduced motion: the <h1> did not render.");
  }

  if (SHOTS) {
    mkdirSync(OUT_DIR, { recursive: true });
    await reduced.screenshot({ path: `${OUT_DIR}/reduced-motion.jpg`, type: "jpeg", quality: 72 });
  }

  await reduced.close();
} finally {
  await browser.close();
}

/* --------------------------------------------------------------------------- */

const selfTest = await fetch(`${BASE_URL}/resume`)
  .then((response) => response.status)
  .catch(() => 0);
if (selfTest !== 200) note("error", `GET /resume returned ${selfTest}.`);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(`${OUT_DIR}/report.json`, JSON.stringify({ report, findings }, null, 2));

const colour = { error: "\x1b[31m", warn: "\x1b[33m", ok: "\x1b[32m", dim: "\x1b[2m", reset: "\x1b[0m" };

console.log(`\n${colour.dim}renderer:${colour.reset} ${report.desktop?.glInfo?.renderer ?? "n/a"}`);
console.log(
  `${colour.dim}canvas:${colour.reset} ${JSON.stringify(report.desktop?.glInfo?.backingSize)}  webgl2=${
    report.desktop?.glInfo?.isWebGL2
  }`,
);console.log(`\n${colour.dim}station alignment & load${colour.reset}`);
console.log(
  `${"requested".padEnd(13)}${"depth".padStart(9)}${"drift".padStart(7)}${`${"vis".padStart(5)}`}${"calls".padStart(7)}${"tris".padStart(8)}${"lum".padStart(6)}${"sd".padStart(6)}${"bright%".padStart(8)}`,
);
for (const snap of report.desktop?.stations ?? []) {
  const drift = Math.abs(snap.depth - snap.declaredZ).toFixed(2);
  console.log(
    `${snap.requested.padEnd(13)}${String(snap.depth).padStart(9)}${drift.padStart(7)}${String(snap.visible).padStart(
      5,
    )}${String(snap.drawCalls).padStart(7)}${String(snap.triangles).padStart(8)}${String(snap.pixels.mean).padStart(
      6,
    )}${String(snap.pixels.sd).padStart(6)}${String(snap.pixels.brightPct).padStart(8)}`,
  );
}

console.log(`\n${colour.dim}canvas contribution @skills${colour.reset}`);
console.log(`  with canvas    : ${JSON.stringify(report.canvasContribution.withCanvas)}`);
console.log(`  canvas hidden  : ${JSON.stringify(report.canvasContribution.withoutCanvas)}`);

console.log(`\n${colour.dim}peaks${colour.reset}`);
console.log(`  draw calls : ${report.desktop?.peak.drawCalls} (at ${report.desktop?.peak.atStation})`);
console.log(`  triangles  : ${report.desktop?.peak.triangles}`);
console.log(`  geometries : ${report.desktop?.peak.geometries}`);
console.log(`  textures   : ${report.desktop?.peak.textures}`);
console.log(`  dpr        : ${report.desktop?.peak.dpr}`);
console.log(
  `  frame ms   : median ${report.desktop?.idleFrameMs.median.toFixed(1)} / p95 ${report.desktop?.idleFrameMs.p95.toFixed(1)} ${colour.dim}(software rasteriser — not indicative of GPU)${colour.reset}`,
);

console.log(`\n${colour.dim}mobile @390x844${colour.reset}`);
console.log(`  ${JSON.stringify(report.mobile)}`);

console.log(`\n${colour.dim}reduced motion${colour.reset}`);
console.log(`  ${JSON.stringify(report.reducedMotion)}`);

console.log(`\n${colour.dim}findings${colour.reset}`);
if (findings.length === 0) {
  console.log(`${colour.ok}  none — no errors, no misalignment, no overflow.${colour.reset}`);
} else {
  for (const finding of findings) {
    const tag = finding.level === "error" ? `${colour.error}ERROR${colour.reset}` : `${colour.warn}WARN ${colour.reset}`;
    console.log(`  ${tag} ${finding.message}`);
  }
}

const errorCount = findings.filter((finding) => finding.level === "error").length;
console.log(
  `\n${errorCount === 0 ? colour.ok : colour.error}${errorCount} error(s), ${
    findings.length - errorCount
  } warning(s)${colour.reset} — full report at ${OUT_DIR}/report.json\n`,
);

// Set the code rather than calling process.exit(): exiting while Chrome's pipes
// are still closing trips a libuv assertion on Windows.
process.exitCode = errorCount > 0 ? 1 : 0;
