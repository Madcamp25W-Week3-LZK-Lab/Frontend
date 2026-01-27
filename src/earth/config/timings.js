/**
 * Timing Configuration
 * All animation timing values for the Earth Globe
 * Designers: Modify ONLY this file to change animation speeds and durations
 */

export const INTRO = {
    duration: 6000,                 // Total intro duration (ms)
    fadeStart: 1500,                // Earth fade-in starts
    fadeEnd: 4000,                  // Earth fully visible
    markerStart: 4500,              // Markers appear after Earth
    markerStagger: 200,             // Delay between each marker
    markerFadeDuration: 1000,       // Each marker fade duration
    rotationSpeed: 0.0003,          // Slow rotation during intro
};

export const ANIMATION = {
    pulseSpeed: 1.5,                // Marker pulse frequency
    pulseOffset: 0.7,               // Phase offset between markers
};

export const INTERACTION = {
    autoRotateDelay: 2000,          // Resume auto-rotate after interaction (ms)
};

export const EASING = {
    // Easing function names (implemented in loop.js)
    cameraZoom: 'easeOutQuart',
    earthFade: 'easeInOutCubic',
    atmosphereFade: 'easeOutCubic',
    markerFade: 'easeOutCubic',
};
