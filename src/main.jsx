import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./pages/App/App.jsx";
import LandingPage from "./pages/LandingPage/LandingPage.jsx";
import "./styles/index.css";

// Root component with simple routing
function Root() {
  const [showApp, setShowApp] = useState(() => Boolean(localStorage.getItem("auth_token")));

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
