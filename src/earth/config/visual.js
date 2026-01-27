/**
 * Visual Configuration
 * All tunable visual parameters for the Earth Globe
 * Designers: Modify ONLY this file to change colors, sizes, intensities
 */

export const COLORS = {
    // Background & scene
    background: 0x020408,           // Near black-blue

    // Earth atmosphere
    atmosphereGlow: 0x4488aa,       // Subtle blue glow

    // Markers & UI
    accent: 0xffffff,               // Clean white (markers)
    primary: 0x88ccdd,              // Muted cyan
    secondary: 0x6699aa,            // Desaturated blue
};

export const EARTH = {
    radius: 5,
    segments: 64,
    textureUrl: 'https://unpkg.com/three-globe@2.31.3/example/img/earth-blue-marble.jpg',
    desaturation: 0.15,             // Cinematic color desaturation
    atmosphereScale: 1.03,          // Atmosphere thickness multiplier
};

export const CAMERA = {
    fov: 45,
    near: 0.1,
    far: 1000,
    startZ: 40,                     // Intro start position (far)
    endZ: 14,                       // Final position (close)
};

export const CONTROLS = {
    minDistance: 8,
    maxDistance: 25,
    autoRotateSpeed: 0.05,          // Very slow, calm rotation
    slowRotateSpeed: 0.02,          // During interaction
    dampingFactor: 0.05,
    enablePan: false,
};

export const MARKERS = {
    size: 0.04,                     // Dot radius
    segments: 12,
    surfaceOffset: 1.005,           // Slightly above Earth surface
    featuredOpacity: 0.7,
    unfeaturedOpacity: 0.4,
    hoverScale: 2,
    hoverOpacity: 1,
    pulseAmount: 0.1,               // Subtle pulse amplitude
};

export const LIGHTING = {
    ambient: {
        color: 0xffffff,
        intensity: 1.2,             // High ambient for fully visible Earth
    },
    sun: {
        color: 0xffffff,
        intensity: 0.0,             // Non-directional lighting (no day/night shading)
        position: { x: 15, y: 5, z: 10 },
    },
};

export const ATMOSPHERE = {
    glowIntensity: 0.25,
    falloffPower: 3.0,
    falloffBase: 0.65,
};

// Clustering configuration - TWEAK HERE
export const CLUSTERING = {
    threshold: 18,          // pixels - markers within this distance get clustered
    maxNamesInTooltip: 5,   // show max 5 names, then "+N more"
};
