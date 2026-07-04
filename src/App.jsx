import React, { useRef, useState, useEffect } from "react";
import Login from "./Login.jsx";
import axios from "axios";

function App() {
  const inputRef = useRef(null);
  const [token, setToken] = useState(
    () => localStorage.getItem("adminToken") || ""
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [colorOverride, setColorOverride] = useState("");
  const [samples, setSamples] = useState([]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  useEffect(() => {
    // Load sample CSV files
    axios
      .get("/samples")
      .then((res) => setSamples(res.data.samples || []))
      .catch(() => setSamples([]));
  }, []);

  function handleFileChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setErrorMessage("");
    setPrediction(null);
  }

  function handleClear() {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setErrorMessage("");
    setPrediction(null);
  }

  async function handlePredict() {
    if (!selectedFile) return;
    setIsLoading(true);
    setErrorMessage("");
    setPrediction(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await axios.post("/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPrediction(response.data);
      setColorOverride("");
    } catch (error) {
      let message = "An error occurred";
      if (error?.response) {
        const status = error.response.status;
        const serverMessage =
          error.response.data?.message || error.response.data?.detail;
        if (status >= 500) {
          message = `Server error (${status}). Please ensure the backend is running and check server logs.`;
        } else if (status === 404) {
          message = "Endpoint /predict not found on the backend.";
        } else {
          message = serverMessage || `Request failed (${status}).`;
        }
      } else if (error?.request) {
        message =
          "Cannot reach backend (http://localhost:8000). Is the server running?";
      } else if (error?.message) {
        message = error.message;
      }
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  function normalizeHex(hex) {
    if (typeof hex !== "string") return "";
    let h = hex.trim();
    if (h.startsWith("#")) h = h.slice(1);
    if (h.length === 3) {
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (/^[0-9a-fA-F]{6}$/.test(h)) return "#" + h.toLowerCase();
    return "";
  }

  function handleLogout() {
    localStorage.removeItem("adminToken");
    setToken("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setPrediction(null);
    setErrorMessage("");
  }

  if (!token) {
    return (
      <Login
        onSuccess={(t) => {
          localStorage.setItem("adminToken", t);
          setToken(t);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            🎨 Dye Recipe Predictor
          </h1>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 ease-in-out hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-medium">Upload an image or CSV</h2>

          {samples.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-gray-700">
                Sample CSV Files:
              </h3>
              <div className="flex flex-wrap gap-2">
                {samples.map((sample) => (
                  <button
                    key={sample.name}
                    onClick={() =>
                      window.open(`/samples/${sample.name}`, "_blank")
                    }
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    📄 {sample.display_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <label
              htmlFor="file"
              className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 transition-colors duration-200 ease-in-out hover:bg-gray-100"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-gray-700 ring-1 ring-gray-200">
                  📁
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {selectedFile ? "Change file" : "Click to choose a file"}
                  </span>
                  <span className="text-xs text-gray-500">
                    Accepted: .jpg, .jpeg, .png, .csv
                  </span>
                </div>
              </div>
              <input
                id="file"
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,.csv"
                className="sr-only"
                onChange={handleFileChange}
              />
              <span className="text-sm text-gray-600">Browse</span>
            </label>

            {selectedFile && (
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-medium text-gray-900"
                    title={selectedFile.name}
                  >
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB ·{" "}
                    {selectedFile.type || "unknown type"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 ease-in-out hover:bg-gray-50"
                >
                  Clear File
                </button>
              </div>
            )}

            {previewUrl && (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <img
                  src={previewUrl}
                  alt="Selected preview"
                  className="h-56 w-full object-cover"
                />
              </div>
            )}

            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handlePredict}
                disabled={!selectedFile || isLoading}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors duration-200 ease-in-out hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Predict Recipe
              </button>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <svg
                  className="h-6 w-6 animate-spin text-indigo-600"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
              </div>
            )}

            {errorMessage && (
              <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-500">
                {errorMessage}
              </div>
            )}

            {prediction && (
              <div className="mt-6 space-y-4">
                <h3 className="text-base font-semibold text-gray-800">
                  Prediction
                </h3>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Dyes Table */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-md">
                    <h4 className="mb-3 text-sm font-medium text-gray-700">
                      Dyes
                    </h4>
                    <div className="overflow-hidden rounded-md border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">
                              Name
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {(prediction?.dyes || []).map((dye, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-gray-900">
                                {dye?.name ?? "-"}
                              </td>
                              <td className="px-3 py-2 text-gray-700">
                                {dye?.amount ?? "-"}
                              </td>
                            </tr>
                          ))}
                          {(!prediction?.dyes ||
                            prediction?.dyes?.length === 0) && (
                            <tr>
                              <td
                                className="px-3 py-3 text-gray-500"
                                colSpan={2}
                              >
                                No dyes in response
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Delta E */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-md">
                    <h4 className="mb-3 text-sm font-medium text-gray-700">
                      ΔE
                    </h4>
                    <p className="text-2xl font-semibold text-gray-900">
                      {prediction?.deltaE ?? prediction?.delta_e ?? "-"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Color difference (lower is better)
                    </p>
                  </div>

                  {/* Predicted Color */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-md">
                    <h4 className="mb-3 text-sm font-medium text-gray-700">
                      Predicted Color
                    </h4>
                    <div className="flex items-center gap-4">
                      <div
                        className="h-16 w-16 rounded-md border border-gray-200"
                        style={{
                          backgroundColor:
                            normalizeHex(colorOverride) ||
                            prediction?.predictedColor ||
                            prediction?.predicted_color ||
                            "#ffffff",
                        }}
                        aria-label="Predicted color preview"
                        title={
                          normalizeHex(colorOverride) ||
                          prediction?.predictedColor ||
                          prediction?.predicted_color
                        }
                      />
                      <div className="text-sm">
                        <div className="text-gray-700">
                          {normalizeHex(colorOverride) ||
                            prediction?.predictedColor ||
                            prediction?.predicted_color ||
                            "-"}
                        </div>
                        <div className="text-xs text-gray-500">Hex</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="#rrggbb"
                        value={colorOverride}
                        onChange={(e) => setColorOverride(e.target.value)}
                        className="w-32 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setColorOverride("")}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                {/* Combinations */}
                {Array.isArray(prediction?.combinations) &&
                  prediction.combinations.length > 0 && (
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-md">
                      <h4 className="mb-3 text-sm font-medium text-gray-700">
                        Combinations
                      </h4>
                      <div className="overflow-auto rounded-md border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">
                                Name
                              </th>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">
                                Concentration
                              </th>
                              {/* Render up to first 6 K/S columns */}
                              {Object.keys(prediction.combinations[0]?.ks || {})
                                .slice(0, 6)
                                .map((key) => (
                                  <th
                                    key={key}
                                    className="px-3 py-2 text-left font-medium text-gray-700"
                                  >
                                    {key}
                                  </th>
                                ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {prediction.combinations.map((c, idx) => {
                              const ksKeys = Object.keys(c?.ks || {}).slice(
                                0,
                                6
                              );
                              return (
                                <tr key={idx}>
                                  <td className="px-3 py-2 text-gray-900">
                                    {c?.name ?? "-"}
                                  </td>
                                  <td className="px-3 py-2 text-gray-700">
                                    {c?.concentration ?? "-"}
                                  </td>
                                  {ksKeys.map((k) => (
                                    <td
                                      key={k}
                                      className="px-3 py-2 text-gray-700"
                                    >
                                      {c?.ks?.[k] ?? "-"}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                {/* Spectrum Chart - temporarily disabled */}
                {false && (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-md">
                    <h4 className="mb-3 text-sm font-medium text-gray-700">
                      Spectrum Comparison
                    </h4>
                    <p>Chart temporarily disabled</p>
                  </div>
                )}

                {/* Raw JSON (debug) */}
                <details className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">
                    Show raw JSON
                  </summary>
                  <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-gray-800">
                    {JSON.stringify(prediction, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
