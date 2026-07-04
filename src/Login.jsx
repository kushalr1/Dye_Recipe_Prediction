import React, { useState } from "react";
import axios from "axios";

export default function Login({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("/login", { username, password });
      onSuccess?.(res.data?.token);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-100 px-8">
      <div className="w-full max-w-[95rem] min-h-[750px] rounded-[2.75rem] border border-slate-200 bg-white/80 shadow-[0_40px_140px_rgba(15,23,42,0.12)] backdrop-blur-3xl overflow-hidden grid grid-cols-1 md:grid-cols-[1.25fr_1fr]">
        {/* Left: brand / info */}
        <div className="relative hidden md:flex flex-col justify-between border-r border-slate-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-300/60 bg-sky-100/80 px-4 py-1.5 text-sm font-medium uppercase tracking-[0.18em] text-sky-700">
              Secure Admin Console
            </p>
            <h1 className="mt-8 text-5xl font-semibold tracking-tight text-slate-900">
              Dye Recipe Prediction Platform
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-700/90">
              Restricted access area for authorized personnel only. All actions
              are logged and monitored to protect sensitive color and recipe
              data.
            </p>
          </div>

          {/* <div className="mt-12 flex items-center justify-between text-sm text-slate-600/80">
            <div>
              <p className="font-semibold text-base text-slate-800/90">Environment</p>
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-sky-100/80 border border-sky-200/70 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-sky-700">
                ● Internal Use Only
              </p>
            </div> */}
          {/* <div className="text-right">
              <p className="font-semibold text-base text-slate-800/90">Last Security Audit</p>
              <p className="mt-2 text-sm text-slate-600/80">
                All access attempts are recorded.
              </p>
            </div> */}
          {/* </div> */}
        </div>

        {/* Right: login form */}
        <div className="flex flex-col justify-center bg-white/70 px-12 py-16 md:px-16">
          <div className="mb-8">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-800">
              Admin Login
            </h2>
            <p className="mt-2 text-sm text-slate-600/90">
              Sign in with your administrator credentials to access DRP
              projects.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700/90">
                Username
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sky-500 text-base">
                  👤
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-sky-200/70 bg-white/90 px-10 py-3 text-base text-slate-800 placeholder-slate-400/70 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300/50"
                  placeholder="admin"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700/90">
                Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-emerald-500 text-base">
                  🔒
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-emerald-200/70 bg-white/90 px-10 py-3 pr-24 text-base text-slate-800 placeholder-slate-400/70 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/50"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center rounded-md px-3 text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-orange-300/60 bg-orange-50/80 px-4 py-3 text-sm text-orange-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative mt-4 w-full overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-900/40 transition-all duration-300 hover:from-indigo-700 hover:via-blue-700 hover:to-indigo-800 hover:shadow-xl hover:shadow-indigo-900/50 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Verifying access…
                  </>
                ) : (
                  <>
                    <svg
                      className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                    Sign In
                  </>
                )}
              </span>
              <div className="absolute inset-0 -z-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            </button>

            <p className="mt-4 text-xs text-slate-500/80">
              By signing in you confirm that you are an authorized operator and
              agree to monitoring and logging for security purposes.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
