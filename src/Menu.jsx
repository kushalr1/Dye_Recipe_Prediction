import React, { useState } from "react";
import Login from "./Login.jsx";
import ColorMatcher from "./colorMatcher.jsx";
import DyeRecipePredictor from "./DyeRecipePredictor.jsx";
import MenuCard from "./MenuCard.jsx";
import Header from "./Header.jsx";

export default function Menu() {
  const [token, setToken] = useState(
    () => localStorage.getItem("adminToken") || ""
  );
  const [currentView, setCurrentView] = useState("menu");

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

  if (currentView === "colorMatcher") {
    return (
      <>
        <Header
          title="🎨 Color Matcher"
          onBack={() => setCurrentView("menu")}
          onLogout={() => {
            setToken("");
            setCurrentView("menu");
          }}
        />
        <ColorMatcher />
      </>
    );
  }

  if (currentView === "dyeRecipePredictor") {
    return (
      <>
        <Header
          title="🧪 Dye Recipe Predictor"
          onBack={() => setCurrentView("menu")}
          onLogout={() => {
            setToken("");
            setCurrentView("menu");
          }}
        />
        <DyeRecipePredictor />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-100 text-gray-900">
      <Header title="🎨 DRP- Project Menu" onLogout={() => setToken("")} />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-6 sm:grid-cols-2">
          <MenuCard
            title="Color Matcher"
            description="Match your color and get hex codes."
            icon="🎨"
            onClick={() => setCurrentView("colorMatcher")}
          />
          <MenuCard
            title="Dye Recipe Predictor"
            description="Predict optimal dye recipes for your target color."
            icon="🧪"
            onClick={() => setCurrentView("dyeRecipePredictor")}
          />
        </div>
      </main>
    </div>
  );
}
