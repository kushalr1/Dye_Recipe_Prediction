import React from "react";

export default function Header({ title, onLogout, onBack, backLabel }) {
  function handleLogout() {
    localStorage.removeItem("adminToken");
    if (onLogout) onLogout();
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100"
            >
              ← {backLabel || "Back to Menu"}
            </button>
          )}
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            {title}
          </h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-red-600 hover:text-white"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
