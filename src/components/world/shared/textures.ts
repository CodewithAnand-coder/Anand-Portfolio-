import * as THREE from "three";

/* ============================================================================
   PROCEDURAL TEXTURES
   Every texture in this portfolio is drawn at runtime on a 2D canvas. That keeps
   the payload tiny (no atlases to download), lets the interface and the WebGL
   world share one palette, and means the code fragments on the floating panels
   are real, readable code rather than a screenshot of some.

   Everything is memoised: a texture is generated once per unique key and reused
   across station re-mounts.

   Light theme: panels are white paper with navy ink and blue accents, matching
   the business UI around the canvas.
   ========================================================================= */

const cache = new Map<string, THREE.Texture>();

function memo(key: string, build: () => THREE.Texture) {
  const hit = cache.get(key);
  if (hit) return hit;
  const texture = build();
  cache.set(key, texture);
  return texture;
}

/** Retina-ish canvas without going overboard on texture memory. */
function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");
  return { canvas, ctx };
}

function finish(canvas: HTMLCanvasElement, anisotropy = 4) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

/* ---------------------------------------------------------------------------
   Soft radial glow — used for sprites, halos and particle billboards.
   ------------------------------------------------------------------------ */

export function glowTexture() {
  return memo("glow", () => {
    const { canvas, ctx } = createCanvas(256, 256);
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.16, "rgba(255,255,255,0.72)");
    gradient.addColorStop(0.42, "rgba(255,255,255,0.18)");
    gradient.addColorStop(0.72, "rgba(255,255,255,0.04)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    return finish(canvas, 1);
  });
}

/** Wide, soft horizontal band — used for haze / depth planes. */
export function nebulaTexture() {
  return memo("nebula", () => {
    const { canvas, ctx } = createCanvas(512, 512);
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, "rgba(255,255,255,0.55)");
    gradient.addColorStop(0.35, "rgba(255,255,255,0.22)");
    gradient.addColorStop(0.7, "rgba(255,255,255,0.06)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    // Squash vertically so it reads as a cloud rather than a dot.
    ctx.setTransform(1, 0, 0, 0.55, 0, 256 * 0.45);
    ctx.fillRect(0, 0, 512, 512);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return finish(canvas, 2);
  });
}

/* ---------------------------------------------------------------------------
   Code panels — real snippets from the work this portfolio describes.
   ------------------------------------------------------------------------ */

const KEYWORDS = new Set([
  "import", "from", "as", "def", "return", "for", "in", "if", "else", "elif",
  "SELECT", "FROM", "WHERE", "GROUP", "BY", "ORDER", "JOIN", "ON", "AS", "SUM",
  "DESC", "ASC", "LIMIT", "CREATE", "TABLE", "AND", "OR", "NOT", "NULL",
]);

const BUILTINS = new Set([
  "pd", "np", "df", "model", "X", "y", "print", "pd.read_csv", "plt", "sns",
  "shap", "explainer", "vectorstore", "embed", "chunk", "proba",
]);

function paintCode(ctx: CanvasRenderingContext2D, lines: string[], accent: string) {
  const font = '30px "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace';
  ctx.font = font;
  ctx.textBaseline = "middle";

  lines.forEach((line, row) => {
    const y = 78 + row * 46;
    let x = 44;

    // Tokenise just enough to look like a syntax-aware editor.
    const tokens = line.split(/(\s+|[(),.:\[\]=]|'[^']*'|"[^"]*"|#.*$)/g).filter(Boolean);

    for (const token of tokens) {
      if (/^\s+$/.test(token)) {
        x += ctx.measureText(token).width;
        continue;
      }

      let colour = "#33436b"; // default: navy ink
      if (token.startsWith("#")) colour = "#90a0bd";
      else if (/^['"]/.test(token)) colour = "#b45309";
      else if (KEYWORDS.has(token)) colour = accent;
      else if (BUILTINS.has(token)) colour = "#5a61e0";
      else if (/^\d+(\.\d+)?$/.test(token)) colour = "#174aa3";
      else if (/^[(),.:\[\]=]$/.test(token)) colour = "#7386ac";

      ctx.fillStyle = colour;
      ctx.fillText(token, x, y);
      x += ctx.measureText(token).width;
    }
  });
}

export function codeTexture(id: string, lines: string[], accent: string, label: string) {
  return memo(`code:${id}`, () => {
    const width = 640;
    const height = 78 + lines.length * 46 + 33;
    const { canvas, ctx } = createCanvas(width, height);

    // Panel body — white paper
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "rgba(255,255,255,0.97)");
    bg.addColorStop(1, "rgba(242,245,250,0.97)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Accent edge
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, 5, height);

    // Window chrome
    ctx.fillStyle = "rgba(15,39,87,0.05)";
    ctx.fillRect(0, 0, width, 46);
    ["#dc2626", "#d97706", "#2f6fdb"].forEach((dot, index) => {
      ctx.beginPath();
      ctx.fillStyle = dot;
      ctx.globalAlpha = 0.8;
      ctx.arc(28 + index * 22, 23, 5.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.font = '500 19px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = "rgba(91,108,146,0.9)";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 108, 24);

    paintCode(ctx, lines, accent);

    // Border
    ctx.strokeStyle = "rgba(15,39,87,0.16)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    return finish(canvas);
  });
}

/* ---------------------------------------------------------------------------
   Label sprites — readable text inside the 3D scene.
   ------------------------------------------------------------------------ */

export function labelTexture(text: string, accent: string, sub?: string) {
  return memo(`label:${text}:${accent}:${sub ?? ""}`, () => {
    const { canvas, ctx } = createCanvas(768, 224);

    ctx.font = '600 62px "Sora", system-ui, sans-serif';
    ctx.textBaseline = "middle";

    // Pill background — white card with accent edge
    const padding = 20;
    const textWidth = Math.min(ctx.measureText(text).width, 700);
    const pillWidth = textWidth + padding * 2;
    const pillX = (768 - pillWidth) / 2;

    const radius = 24;
    ctx.beginPath();
    ctx.roundRect(pillX, 44, pillWidth, 92, radius);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.65;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#102444";
    ctx.fillText(text, pillX + padding - 4, 92);

    if (sub) {
      ctx.font = '400 34px "Inter", system-ui, sans-serif';
      ctx.fillStyle = "rgba(68,85,124,0.95)";
      const subWidth = ctx.measureText(sub).width;
      ctx.fillText(sub, (768 - subWidth) / 2, 172);
    }

    return finish(canvas);
  });
}

/* ---------------------------------------------------------------------------
   Dashboard panels — charts drawn from generated data.
   ------------------------------------------------------------------------ */

export type ChartKind = "bars" | "line" | "donut" | "kpi" | "table";

export function chartTexture(
  id: string,
  kind: ChartKind,
  accent: string,
  seed: number,
  heading: string,
) {
  return memo(`chart:${id}`, () => {
    const width = 512;
    const height = 340;
    const { canvas, ctx } = createCanvas(width, height);

    ctx.fillStyle = "rgba(255,255,255,0.97)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, width, 4);
    ctx.strokeStyle = "rgba(15,39,87,0.14)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    ctx.font = '500 20px "Sora", system-ui, sans-serif';
    ctx.fillStyle = "rgba(16,36,68,0.92)";
    ctx.textBaseline = "middle";
    ctx.fillText(heading.toUpperCase(), 28, 40);
    ctx.font = '500 15px "JetBrains Mono", monospace';
    ctx.fillStyle = accent;
    ctx.fillText("LIVE", 452, 40);

    // Deterministic pseudo-random so charts look identical across reloads.
    const rand = (n: number) => {
      const value = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453;
      return value - Math.floor(value);
    };

    const plotTop = 76;
    const plotBottom = height - 44;
    const plotLeft = 34;
    const plotRight = width - 34;

    // Baseline grid
    ctx.strokeStyle = "rgba(15,39,87,0.09)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const y = plotTop + ((plotBottom - plotTop) / 4) * i;
      ctx.beginPath();
      ctx.moveTo(plotLeft, y);
      ctx.lineTo(plotRight, y);
      ctx.stroke();
    }

    if (kind === "bars") {
      const count = 9;
      const gap = 12;
      const barWidth = (plotRight - plotLeft - gap * (count - 1)) / count;
      for (let i = 0; i < count; i += 1) {
        const value = 0.22 + rand(i) * 0.78;
        const barHeight = (plotBottom - plotTop) * value;
        const x = plotLeft + i * (barWidth + gap);
        const gradient = ctx.createLinearGradient(0, plotBottom - barHeight, 0, plotBottom);
        gradient.addColorStop(0, accent);
        gradient.addColorStop(1, "rgba(47,111,219,0.25)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, plotBottom - barHeight, barWidth, barHeight, [6, 6, 2, 2]);
        ctx.fill();
      }
    }

    if (kind === "line") {
      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = accent;
      ctx.lineJoin = "round";
      for (let i = 0; i <= 28; i += 1) {
        const t = i / 28;
        const value = 0.3 + rand(i) * 0.5 + Math.sin(t * 5) * 0.12;
        const x = plotLeft + t * (plotRight - plotLeft);
        const y = plotBottom - value * (plotBottom - plotTop);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Area fill under the curve
      ctx.lineTo(plotRight, plotBottom);
      ctx.lineTo(plotLeft, plotBottom);
      ctx.closePath();
      const fill = ctx.createLinearGradient(0, plotTop, 0, plotBottom);
      fill.addColorStop(0, `${accent}44`);
      fill.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = fill;
      ctx.fill();
    }

    if (kind === "donut") {
      const cx = width / 2;
      const cy = (plotTop + plotBottom) / 2 + 6;
      const radius = 84;
      let angle = -Math.PI / 2;
      const slices = [0.42, 0.26, 0.18, 0.14];
      const palette = [accent, "#5a61e0", "#d97706", "#90a0bd"];
      slices.forEach((slice, index) => {
        const end = angle + slice * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, angle, end);
        ctx.arc(cx, cy, radius * 0.6, end, angle, true);
        ctx.closePath();
        ctx.fillStyle = palette[index];
        ctx.globalAlpha = 0.92;
        ctx.fill();
        ctx.globalAlpha = 1;
        angle = end;
      });
    }

    if (kind === "kpi") {
      ctx.font = '700 96px "Sora", system-ui, sans-serif';
      ctx.fillStyle = "#102444";
      ctx.fillText(`+${Math.round(rand(3) * 40 + 12)}%`, plotLeft, 168);
      ctx.font = '400 22px "Inter", system-ui, sans-serif';
      ctx.fillStyle = "rgba(68,85,124,0.9)";
      ctx.fillText("vs. previous period", plotLeft, 226);
    }

    if (kind === "table") {
      const rows = 5;
      const rowHeight = (plotBottom - plotTop) / rows;
      ctx.font = '400 18px "JetBrains Mono", monospace';
      for (let i = 0; i < rows; i += 1) {
        const y = plotTop + rowHeight * i + 22;
        ctx.fillStyle = "rgba(15,39,87,0.05)";
        ctx.fillRect(plotLeft, y - 16, plotRight - plotLeft, rowHeight - 10);
        ctx.fillStyle = i === 0 ? accent : "rgba(16,36,68,0.85)";
        ctx.fillText(`${String(i + 1).padStart(2, "0")}`, plotLeft + 14, y);
        ctx.fillStyle = "rgba(115,134,172,0.6)";
        ctx.fillRect(plotLeft + 52, y - 6, 190, 8);
        ctx.fillRect(plotLeft + 262, y - 6, 110, 8);
      }
    }

    return finish(canvas);
  });
}

/* ---------------------------------------------------------------------------
   Certificate plaques
   ------------------------------------------------------------------------ */

export function certificateTexture(options: {
  id: string;
  title: string;
  seal: string;
  strands: string[];
  accent: string;
  kind: "certification" | "award";
}) {
  const { id, title, seal, strands, accent, kind } = options;
  return memo(`cert:${id}`, () => {
    const width = 768;
    const height = 560;
    const { canvas, ctx } = createCanvas(width, height);

    // Paper
    const paper = ctx.createLinearGradient(0, 0, width, height);
    paper.addColorStop(0, "#ffffff");
    paper.addColorStop(0.5, "#fbfcfe");
    paper.addColorStop(1, "#f2f5fa");
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, width, height);

    // Guilloche-ish border
    ctx.strokeStyle = `${accent}55`;
    ctx.lineWidth = 10;
    ctx.strokeRect(24, 24, width - 48, height - 48);
    ctx.strokeStyle = `${accent}30`;
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // Corner ticks
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    const corner = 54;
    const inset = 24;
    const corners: [number, number, number, number][] = [
      [inset, inset, 1, 1],
      [width - inset, inset, -1, 1],
      [inset, height - inset, 1, -1],
      [width - inset, height - inset, -1, -1],
    ];
    corners.forEach(([x, y, sx, sy]) => {
      ctx.beginPath();
      ctx.moveTo(x + sx * corner, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + sy * corner);
      ctx.stroke();
    });

    ctx.textAlign = "center";
    ctx.font = '500 19px "JetBrains Mono", monospace';
    ctx.fillStyle = `${accent}dd`;
    ctx.fillText(kind === "award" ? "AWARD OF RECOGNITION" : "CERTIFICATE OF COMPLETION", width / 2, 112);

    // Title, wrapped to at most two lines
    ctx.font = '600 46px "Sora", system-ui, sans-serif';
    ctx.fillStyle = "#102444";
    const words = title.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width > width - 200 && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);

    const lineHeight = 58;
    const titleTop = 190 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => {
      ctx.fillText(line, width / 2, titleTop + index * lineHeight);
    });

    // Rule
    const ruleY = titleTop + lines.length * lineHeight + 6;
    const ruleGradient = ctx.createLinearGradient(width * 0.2, 0, width * 0.8, 0);
    ruleGradient.addColorStop(0, "rgba(0,0,0,0)");
    ruleGradient.addColorStop(0.5, accent);
    ruleGradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = ruleGradient;
    ctx.fillRect(width * 0.2, ruleY, width * 0.6, 3);

    // Recipient
    ctx.font = '400 20px "Inter", system-ui, sans-serif';
    ctx.fillStyle = "rgba(68,85,124,0.85)";
    ctx.fillText("awarded to", width / 2, ruleY + 62);
    ctx.font = '600 44px "Sora", system-ui, sans-serif';
    ctx.fillStyle = "#1e3a6e";
    ctx.fillText("R N Anand", width / 2, ruleY + 116);

    // Strand chips
    ctx.font = '500 18px "JetBrains Mono", monospace';
    const chipGap = 14;
    const chipPadding = 18;
    const widths = strands.map((strand) => ctx.measureText(strand.toUpperCase()).width + chipPadding * 2);
    const totalWidth = widths.reduce((sum, w) => sum + w, 0) + chipGap * (strands.length - 1);
    let chipX = (width - totalWidth) / 2;
    const chipY = ruleY + 168;
    strands.forEach((strand, index) => {
      const chipWidth = widths[index];
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, chipWidth, 40, 20);
      ctx.fillStyle = `${accent}14`;
      ctx.fill();
      ctx.strokeStyle = `${accent}55`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#33436b";
      ctx.textAlign = "left";
      ctx.fillText(strand.toUpperCase(), chipX + chipPadding, chipY + 22);
      ctx.textAlign = "center";
      chipX += chipWidth + chipGap;
    });

    // Wax seal
    const sealX = width / 2;
    const sealY = height - 92;
    const sealGradient = ctx.createRadialGradient(sealX - 8, sealY - 8, 4, sealX, sealY, 46);
    sealGradient.addColorStop(0, `${accent}`);
    sealGradient.addColorStop(1, `${accent}88`);
    ctx.beginPath();
    ctx.arc(sealX, sealY, 44, 0, Math.PI * 2);
    ctx.fillStyle = sealGradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(15,39,87,0.25)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '700 30px "Sora", system-ui, sans-serif';
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(seal, sealX, sealY + 2);

    return finish(canvas);
  });
}

/* ---------------------------------------------------------------------------
   YouTube channel panel
   ------------------------------------------------------------------------ */

export function channelTexture() {
  return memo("channel", () => {
    const width = 800;
    const height = 460;
    const { canvas, ctx } = createCanvas(width, height);

    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#ffffff");
    bg.addColorStop(0.55, "#f7f9fd");
    bg.addColorStop(1, "#eef3fb");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Player chrome
    ctx.fillStyle = "rgba(15,39,87,0.05)";
    ctx.fillRect(0, height - 74, width, 74);
    ctx.strokeStyle = "rgba(15,39,87,0.16)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Play glyph
    const cx = width / 2;
    const cy = (height - 74) / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 62, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(220,38,38,0.1)";
    ctx.fill();
    ctx.strokeStyle = "rgba(220,38,38,0.7)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 16, cy - 24);
    ctx.lineTo(cx + 26, cy);
    ctx.lineTo(cx - 16, cy + 24);
    ctx.closePath();
    ctx.fillStyle = "#dc2626";
    ctx.fill();

    ctx.textAlign = "center";
    ctx.font = '600 40px "Sora", system-ui, sans-serif';
    ctx.fillStyle = "#102444";
    ctx.fillText("Code with Anand 365", cx, 92);
    ctx.font = '400 20px "JetBrains Mono", monospace';
    ctx.fillStyle = "rgba(68,85,124,0.8)";
    ctx.fillText("EXCEL · ANALYTICS · AI WORKFLOWS", cx, 130);

    // Progress bar
    ctx.fillStyle = "rgba(15,39,87,0.12)";
    ctx.fillRect(60, height - 46, width - 120, 6);
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(60, height - 46, (width - 120) * 0.62, 6);

    return finish(canvas);
  });
}

/** Release every cached texture — called when the world unmounts. */
export function disposeTextures() {
  for (const texture of cache.values()) texture.dispose();
  cache.clear();
}
