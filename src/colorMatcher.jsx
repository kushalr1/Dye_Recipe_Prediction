import React, { useEffect, useMemo, useState } from "react";

// ---------- Utility Functions ----------
const hexToRgb = (hex) => {
  if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) return null;
  let c = hex.substring(1).split("");
  if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  c = "0x" + c.join("");
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
};

const rgbToXyz = (rgb) => {
  let [r, g, b] = rgb.map((v) => {
    v = v / 255;
    return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
  });
  r *= 100;
  g *= 100;
  b *= 100;
  return {
    x: r * 0.4124 + g * 0.3576 + b * 0.1805,
    y: r * 0.2126 + g * 0.7152 + b * 0.0722,
    z: r * 0.0193 + g * 0.1192 + b * 0.9505,
  };
};

const xyzToLab = ({ x, y, z }) => {
  let refX = 95.047,
    refY = 100.0,
    refZ = 108.883;
  x = x / refX;
  y = y / refY;
  z = z / refZ;

  [x, y, z] = [x, y, z].map((v) =>
    v > 0.008856 ? Math.pow(v, 1 / 3) : 7.787 * v + 16 / 116
  );

  return {
    L: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z),
  };
};

const deltaE = (lab1, lab2) => {
  return Math.sqrt(
    Math.pow(lab1.L - lab2.L, 2) +
      Math.pow(lab1.a - lab2.a, 2) +
      Math.pow(lab1.b - lab2.b, 2)
  );
};

function ColorChip({ hex, size = 40 }) {
  return (
    <div
      className="rounded-md border border-slate-200 shadow-sm"
      style={{ width: size, height: size, backgroundColor: hex }}
      aria-label={`Color ${hex}`}
      title={hex}
    />
  );
}

// ---------- Main Component ----------
export default function ColorMatcher() {
  const [colorToMatch, setColorToMatch] = useState("#ff0000");
  const [samples, setSamples] = useState(["#00ff00"]);
  const [results, setResults] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isComputing, setIsComputing] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const baseRgb = useMemo(() => hexToRgb(colorToMatch), [colorToMatch]);
  const baseXyz = useMemo(
    () => (baseRgb ? rgbToXyz(baseRgb) : null),
    [baseRgb]
  );
  const baseLab = useMemo(
    () => (baseXyz ? xyzToLab(baseXyz) : null),
    [baseXyz]
  );

  // Warning timer
  useEffect(() => {
    if (showWarning) {
      setProgress(100);
      const interval = setInterval(
        () => setProgress((p) => (p > 0 ? p - 2 : 0)),
        100
      );
      const timer = setTimeout(() => setShowWarning(false), 3000);
      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [showWarning]);

  const addSample = () => setSamples((prev) => [...prev, "#00ff00"]);
  const removeSample = (index) => {
    if (samples.length === 1) return;
    setSamples((prev) => prev.filter((_, i) => i !== index));
  };
  const handleSampleChange = (index, hex) => {
    setSamples((prev) => prev.map((c, i) => (i === index ? hex : c)));
  };

  const computeDeltaE = () => {
    const allHexes = [colorToMatch, ...samples];
    const anyInvalid = allHexes.some((hex) => !hexToRgb(hex));
    if (anyInvalid) {
      setShowWarning(true);
      return;
    }

    setIsComputing(true);
    setTimeout(() => {
      const base = xyzToLab(rgbToXyz(hexToRgb(colorToMatch)));
      const computed = samples.map((hex, i) => {
        const rgb = hexToRgb(hex);
        const xyz = rgbToXyz(rgb);
        const lab = xyzToLab(xyz);
        const dE = deltaE(base, lab);
        return {
          sampleIndex: i + 1,
          hex,
          deltaE: +dE.toFixed(2),
          rgb,
          xyz: {
            x: xyz.x.toFixed(2),
            y: xyz.y.toFixed(2),
            z: xyz.z.toFixed(2),
          },
          lab: {
            L: lab.L.toFixed(2),
            a: lab.a.toFixed(2),
            b: lab.b.toFixed(2),
          },
        };
      });

      computed.sort((a, b) => a.deltaE - b.deltaE);
      setResults(computed);
      setIsComputing(false);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-100 text-slate-900">
      {/* Toasts */}
      {showWarning && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[320px] rounded-xl border border-amber-300/70 bg-amber-50/90 px-5 py-4 shadow-lg backdrop-blur">
          <div className="text-sm font-semibold text-amber-900">
            Invalid HEX value
          </div>
          <div className="mt-1 text-xs text-amber-800/80">
            Please use `#rrggbb` (or a valid color picker value).
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-amber-200">
            <div
              className="h-1.5 rounded-full bg-amber-600 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {isComputing && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-56 rounded-xl bg-emerald-700 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg animate-pulse">
          Computing ΔE…
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-10 space-y-6">
        {/* Header Card */}
        <section className="rounded-3xl border border-slate-200 bg-white/80 shadow-[0_40px_140px_rgba(15,23,42,0.10)] backdrop-blur-3xl">
          <div className="p-8 sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                  Color Matcher
                </h2>
                <p className="text-sm text-slate-600">
                  Compare a target color against samples using CIE76 ΔE (lower
                  is closer).
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={addSample}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-900/20 hover:bg-indigo-700"
                >
                  Add sample
                </button>
                <button
                  type="button"
                  onClick={computeDeltaE}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-900/20 hover:bg-emerald-700"
                >
                  Compute ΔE
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {/* Target */}
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Target color
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Pick a color or paste a hex code.
                    </div>
                  </div>
                  <ColorChip hex={colorToMatch} size={48} />
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-4 sm:items-center">
                  <input
                    type="color"
                    value={colorToMatch}
                    onChange={(e) => setColorToMatch(e.target.value)}
                    className="h-12 w-20 rounded-lg border border-slate-200 bg-white cursor-pointer"
                    aria-label="Pick target color"
                  />
                  <input
                    type="text"
                    value={colorToMatch}
                    onChange={(e) => setColorToMatch(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300/60"
                    placeholder="#rrggbb"
                    spellCheck={false}
                  />
                </div>

                {baseRgb && baseXyz && baseLab && (
                  <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <dt className="text-xs font-medium text-slate-500">
                        RGB
                      </dt>
                      <dd className="mt-1 font-semibold text-slate-900">
                        ({baseRgb.join(", ")})
                      </dd>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <dt className="text-xs font-medium text-slate-500">
                        LAB
                      </dt>
                      <dd className="mt-1 font-semibold text-slate-900">
                        (
                        {Object.values(baseLab)
                          .map((v) => v.toFixed(2))
                          .join(", ")}
                        )
                      </dd>
                    </div>
                  </dl>
                )}
              </div>

              {/* Samples */}
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Sample colors
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Add samples and compute to rank them by closeness.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExpanded((v) => !v)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    {isExpanded ? "Wrap layout" : "Horizontal scroll"}
                  </button>
                </div>

                <div
                  className={`mt-6 flex gap-4 ${
                    isExpanded
                      ? "overflow-x-auto pb-2"
                      : "flex-wrap overflow-hidden"
                  }`}
                >
                  {samples.map((hex, idx) => (
                    <div
                      key={idx}
                      className="relative min-w-[190px] flex-shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold text-slate-700">
                          Sample {idx + 1}
                        </div>
                        {samples.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSample(idx)}
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                            aria-label={`Remove sample ${idx + 1}`}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="mt-4 flex items-center gap-4">
                        <input
                          type="color"
                          value={hex}
                          onChange={(e) =>
                            handleSampleChange(idx, e.target.value)
                          }
                          className="h-12 w-20 rounded-lg border border-slate-200 bg-white cursor-pointer"
                          aria-label={`Pick color for sample ${idx + 1}`}
                        />
                        <input
                          type="text"
                          value={hex}
                          onChange={(e) =>
                            handleSampleChange(idx, e.target.value)
                          }
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300/60"
                          placeholder="#rrggbb"
                          spellCheck={false}
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addSample}
                    className="min-w-[190px] flex-shrink-0 rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 p-4 text-left text-sm font-semibold text-slate-700 hover:bg-white"
                  >
                    + Add another sample
                    <div className="mt-1 text-xs font-medium text-slate-500">
                      Click to append a new swatch
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="rounded-3xl border border-slate-200 bg-white/80 shadow-[0_40px_140px_rgba(15,23,42,0.08)] backdrop-blur-3xl">
          <div className="p-8 sm:p-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">
                  Results
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Ranked by lowest ΔE.
                </p>
              </div>
              <div className="text-xs text-slate-500">
                Click a row for details
              </div>
            </div>

            {results.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                No results yet. Add sample colors and click “Compute ΔE”.
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Sample</th>
                      <th className="px-5 py-3 font-semibold">HEX</th>
                      <th className="px-5 py-3 font-semibold">ΔE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.map((res, idx) => {
                      const isGood = res.deltaE < 1;
                      const isOpen = expandedRow === idx;
                      return (
                        <React.Fragment key={idx}>
                          <tr
                            onClick={() =>
                              setExpandedRow((v) => (v === idx ? null : idx))
                            }
                            className={`cursor-pointer hover:bg-slate-50 ${
                              isOpen ? "bg-slate-50" : "bg-white"
                            }`}
                          >
                            <td className="px-5 py-4 font-semibold text-slate-900">
                              <div className="flex items-center gap-3">
                                <ColorChip hex={res.hex} size={28} />
                                <span>Sample {res.sampleIndex}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 font-mono text-slate-700">
                              {res.hex}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  isGood
                                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                    : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                                }`}
                              >
                                {res.deltaE}
                              </span>
                            </td>
                          </tr>

                          {expandedRow === idx && (
                            <tr className="bg-white">
                              <td colSpan={3} className="px-5 pb-5">
                                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-xs font-medium text-slate-500">
                                      RGB
                                    </div>
                                    <div className="mt-1 font-semibold text-slate-900">
                                      ({res.rgb.join(", ")})
                                    </div>
                                  </div>
                                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-xs font-medium text-slate-500">
                                      XYZ
                                    </div>
                                    <div className="mt-1 font-semibold text-slate-900">
                                      ({res.xyz.x}, {res.xyz.y}, {res.xyz.z})
                                    </div>
                                  </div>
                                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-xs font-medium text-slate-500">
                                      LAB
                                    </div>
                                    <div className="mt-1 font-semibold text-slate-900">
                                      ({res.lab.L}, {res.lab.a}, {res.lab.b})
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
