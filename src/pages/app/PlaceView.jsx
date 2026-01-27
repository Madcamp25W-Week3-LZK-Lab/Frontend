import { useEffect, useRef } from "react";
import "../../styles/earth.css";

export default function PlaceView({ active }) {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!active || initializedRef.current) return;
    initializedRef.current = true;
    import("../../earth/main.js").catch((err) => {
      console.error("Failed to load Earth view", err);
      initializedRef.current = false;
    });
  }, [active]);

  return (
    <div className="earth-view" style={{ display: active ? "block" : "none" }}>
      <canvas id="canvas" />

      <div className="title-overlay">
        <h1>EARTH 2050</h1>
        <p className="subtitle">Quiet Orbit</p>
      </div>

      <div className="instruction">Drag to explore</div>

      <div id="hover-panel" className="hover-panel">
        <button className="hover-panel-close" type="button" aria-label="닫기">✕</button>
        <div className="hover-photo-preview">
          <img id="hover-main-photo" className="hover-main-photo" src="" alt="" />
        </div>
        <div className="hover-content">
          <div className="hover-header">
            <span id="hover-city" className="hover-city">City</span>
            <img id="hover-flag" className="hover-flag" src="" alt="" />
          </div>
          <span id="hover-country" className="hover-country">Country</span>
          <div id="hover-photo-count" className="hover-photo-count">0 photos</div>
          <div id="hover-thumbnails" className="hover-thumbnails" />
        </div>
      </div>

      <div id="marker-tooltip" className="marker-tooltip" />

      <div id="gallery-panel" className="gallery-panel">
        <button id="gallery-close" className="gallery-close">✕</button>
        <h2 id="gallery-title">Location</h2>
        <p id="gallery-count" className="gallery-meta">0 photos</p>
        <div id="gallery-grid" className="gallery-grid" />
      </div>
    </div>
  );
}
