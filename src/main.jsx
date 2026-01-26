import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import AppPage from "./pages/app/AppPage.jsx";
import LandingPage from "./pages/landing/LandingPage.jsx";
import "./styles/index.css";

// Root component with simple routing
function Root() {
  const [showApp, setShowApp] = useState(false);

  if (showApp) {
    return <AppPage onBack={() => setShowApp(false)} />;
  }

  return <LandingPage onLogin={() => setShowApp(true)} initialAuthOpen />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
