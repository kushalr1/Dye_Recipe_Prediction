import React from "react";
export default function MenuCard({
  icon,
  title,
  description,
  onClick,
  disabled,
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`group relative flex flex-col items-center justify-center gap-5 rounded-3xl border px-10 py-14 text-center shadow-sm transition-all duration-200 text-base
        ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-100/70 text-slate-400"
            : "cursor-pointer border-slate-200 bg-white/80 hover:-translate-y-1 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100"
        }`}
    >
      <span className="text-6xl drop-shadow-sm">{icon}</span>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-3 text-base text-slate-500">{description}</p>
      </div>
    </button>
  );
}
