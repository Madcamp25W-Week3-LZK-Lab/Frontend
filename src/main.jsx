import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import LandingPage from "./LandingPage.jsx";
import "./index.css";

// Root component with simple routing
function Root() {
  const [showApp, setShowApp] = useState(false);

  if (showApp) {
    return <App onBack={() => setShowApp(false)} />;
  }

  return <LandingPage onLogin={() => setShowApp(true)} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
