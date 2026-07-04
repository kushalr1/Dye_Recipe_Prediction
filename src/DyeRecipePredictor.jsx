import React, { useMemo, useState } from "react";

// ---------- Mock Data & Utilities ----------

const clothTypes = ["Cotton", "Silk", "Wool", "Polyester", "Linen"];

const hexToRgb = (hex) => {
  const cleaned = hex.replace("#", "");
  const fullHex =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;

  const bigint = parseInt(fullHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// simple helper to slightly lighten/darken a color for the swatches
const adjustColor = (hex, factor) => {
  const { r, g, b } = hexToRgb(hex);
  const adjust = (v) =>
    clamp(Math.round(v * factor + 255 * (1 - factor)), 0, 255);
  const nr = adjust(r);
  const ng = adjust(g);
  const nb = adjust(b);
  const toHex = (v) => v.toString(16).padStart(2, "0");
  return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
};

const rgbToXyz = ({ r, g, b }) => {
  const toLinear = (v) =>
    v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;

  const R = toLinear(r / 255);
  const G = toLinear(g / 255);
  const B = toLinear(b / 255);

  const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) * 100;
  const Y = (R * 0.2126 + G * 0.7152 + B * 0.0722) * 100;
  const Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) * 100;

  return { X, Y, Z };
};

const xyzToLab = ({ X, Y, Z }) => {
  const refX = 95.047;
  const refY = 100.0;
  const refZ = 108.883;

  let x = X / refX;
  let y = Y / refY;
  let z = Z / refZ;

  const epsilon = 0.008856;
  const kappa = 903.3;

  const f = (t) => (t > epsilon ? Math.cbrt(t) : (kappa * t + 16) / 116);

  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return { L, a, b };
};

const format = (num, digits = 1) => num.toFixed(digits);

// generate 4 dye combinations based on the selected base color
const generateCombinations = (hex) => {
  const { r, g, b } = hexToRgb(hex);

  // rough CMY percentages derived from RGB (for demo only)
  const cBase = clamp(100 - (r / 255) * 100, 0, 100);
  const mBase = clamp(100 - (g / 255) * 100, 0, 100);
  const yBase = clamp(100 - (b / 255) * 100, 0, 100);

  const variants = [
    { id: 1, name: "Combination 1", deltaE: 0.8, match: 98, shift: [0, 0, 0], tone: 0.95 },
    { id: 2, name: "Combination 2", deltaE: 1.3, match: 96, shift: [5, -3, -2], tone: 0.9 },
    { id: 3, name: "Combination 3", deltaE: 1.9, match: 94, shift: [-4, 4, 0], tone: 0.85 },
    { id: 4, name: "Combination 4", deltaE: 2.4, match: 91, shift: [-6, 2, 4], tone: 0.8 },
  ];

  return variants.map((v) => {
    const cyan = clamp(cBase + v.shift[0], 0, 100);
    const magenta = clamp(mBase + v.shift[1], 0, 100);
    const yellow = clamp(yBase + v.shift[2], 0, 100);
    const total = cyan + magenta + yellow || 1;

    return {
      id: v.id,
      name: v.name,
      swatchHex: adjustColor(hex, v.tone),
      dyes: [
        { name: "Cyan", percentage: Math.round((cyan / total) * 100) },
        { name: "Magenta", percentage: Math.round((magenta / total) * 100) },
        { name: "Yellow", percentage: Math.round((yellow / total) * 100) },
      ],
      deltaE: v.deltaE,
      matchPercent: v.match,
    };
  });
};

// ---------- Sub Components ----------

const ColorInformationCard = ({ hex }) => {
  const { r, g, b } = useMemo(() => hexToRgb(hex), [hex]);
  const xyz = useMemo(() => rgbToXyz({ r, g, b }), [r, g, b]);
  const lab = useMemo(() => xyzToLab(xyz), [xyz]);

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-slate-800">
          Color Information
        </h3>
        <div
          className="h-8 w-8 rounded border border-slate-200 shadow-inner"
          style={{ backgroundColor: hex }}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 text-xs font-mono text-slate-800 sm:grid-cols-3">
        <div>
          <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
            RGB
          </p>
          <p>R: {r}</p>
          <p>G: {g}</p>
          <p>B: {b}</p>
        </div>
        <div>
          <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
            XYZ
          </p>
          <p>X: {format(xyz.X)}</p>
          <p>Y: {format(xyz.Y)}</p>
          <p>Z: {format(xyz.Z)}</p>
        </div>
        <div>
          <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
            LAB
          </p>
          <p>L: {format(lab.L)}</p>
          <p>a: {format(lab.a)}</p>
          <p>b: {format(lab.b)}</p>
        </div>
      </div>
    </div>
  );
};

const CombinationCard = ({ combination, selected, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`flex w-full items-center justify-between rounded-xl border bg-white p-3 text-left shadow-sm transition-all duration-200 hover:border-indigo-400 hover:shadow-md ${
      selected ? "border-indigo-500 ring-2 ring-indigo-300" : "border-slate-200"
    }`}
  >
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">
        #{combination.id}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">
          {combination.name}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {combination.dyes
            .map((d) => `${d.name} ${d.percentage}%`)
            .join(" · ")}
        </p>
        <p className="mt-1 text-[0.7rem] text-slate-400">
          ΔE {format(combination.deltaE, 2)} · Match {combination.matchPercent}%
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <div
        className="h-10 w-10 rounded-lg border border-slate-200 shadow-inner"
        style={{ backgroundColor: combination.swatchHex }}
        aria-label="Color preview"
      />

      <div className="flex flex-col gap-1 text-slate-500">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-[0.7rem]"
          title="Preview"
        >
          👁
        </span>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full border text-[0.7rem] ${
            selected
              ? "border-indigo-500 bg-indigo-500 text-white"
              : "border-slate-300 bg-slate-50"
          }`}
          title="Select combination"
        >
          ✓
        </span>
      </div>
    </div>
  </button>
);

// ---------- Main Component ----------

export default function DyeRecipePredictor() {
  const [selectedBaseColor, setSelectedBaseColor] = useState("#2b7ac6");
  const [selectedCloth, setSelectedCloth] = useState(clothTypes[0]);
  const [selectedCombinationId, setSelectedCombinationId] = useState(1);

  const combinations = useMemo(
    () => generateCombinations(selectedBaseColor),
    [selectedBaseColor]
  );

  const activeCombination =
    combinations.find((c) => c.id === selectedCombinationId) ??
    combinations[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-100 px-4 py-8 text-slate-900">
      <main className="mx-auto max-w-6xl space-y-6">
        {/* Top layout: Left + Right */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)]">
          {/* Left panel */}
          <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
              Input &amp; Information
            </h2>

            <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row">
              <div className="flex flex-1 flex-col gap-2">
                <label className="text-xs font-medium text-slate-600">
                  Base Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={selectedBaseColor}
                    onChange={(e) => setSelectedBaseColor(e.target.value)}
                    className="h-11 w-16 cursor-pointer rounded-md border border-slate-200 bg-slate-50 shadow-inner"
                  />
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-mono text-slate-700">
                    {selectedBaseColor.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <label className="text-xs font-medium text-slate-600">
                  Cloth Type
                </label>
                <select
                  value={selectedCloth}
                  onChange={(e) => setSelectedCloth(e.target.value)}
                  className="h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {clothTypes.map((type) => (
                    <option value={type} key={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <ColorInformationCard hex={selectedBaseColor} />

            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              The selected base color and cloth type are used to compute dye
              recipes that minimize color difference (ΔE) while maintaining
              manufacturability and cost-efficiency.
            </p>
          </section>

          {/* Right panel */}
          <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                Recommended Dye Combinations
              </h2>
              <p className="text-[0.7rem] text-slate-400">
                Auto-selects best match based on ΔE and match accuracy.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {combinations.map((combination) => (
                <CombinationCard
                  key={combination.id}
                  combination={combination}
                  selected={combination.id === activeCombination.id}
                  onSelect={() => setSelectedCombinationId(combination.id)}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Bottom panel */}
        <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
            Color Preview &amp; Description
          </h2>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
            <div className="flex-1">
              <div
                className="h-40 w-full rounded-xl border border-slate-200 shadow-inner transition-all duration-300 sm:h-48"
                style={{ backgroundColor: activeCombination.swatchHex }}
              />
            </div>

            <div className="flex-1 space-y-2 text-sm text-slate-700">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                Selected Combination
              </p>
              <p className="text-base font-semibold text-slate-900">
                {activeCombination.name} · Match{" "}
                {activeCombination.matchPercent}%
              </p>
              <p className="text-xs text-slate-500">
                ΔE {format(activeCombination.deltaE, 2)} — lower values indicate
                closer visual match to the target color.
              </p>

              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Dye Percentages
                  </p>
                  <ul className="space-y-1 text-sm">
                    {activeCombination.dyes.map((dye) => (
                      <li
                        key={dye.name}
                        className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1"
                      >
                        <span className="text-slate-700">{dye.name}</span>
                        <span className="font-mono text-xs text-slate-900">
                          {dye.percentage}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Summary
                  </p>
                  <p className="text-sm leading-relaxed text-slate-700">
                    This recipe is optimized for{" "}
                    <span className="font-semibold">{selectedCloth}</span>{" "}
                    substrates and targets the selected base color while keeping
                    ΔE within an acceptable industrial tolerance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
