/**
 * Loop Module
 * Handles render loop and state machine (INTRO/IDLE/INTERACTING)
 * Visual components do NOT decide state transitions
 */

import { CAMERA } from '../config/visual.js';
import { INTRO, ANIMATION } from '../config/timings.js';
import { getScene, getCamera, getRenderer } from './scene.js';
import { updateControls, enableControls, setAutoRotate } from './controls.js';
import { updateEarthOpacity, getEarthGroup } from '../earth/earth.js';
import { updateAtmosphereOpacity } from '../earth/atmosphere.js';
import { updateMarkerOpacity, getMarkerObjects, computeClusters } from '../markers/markers.js';
import { getHoveredMarker, updateHoverPosition } from '../markers/interaction.js';
import { renderClusterMarkers } from '../ui/infoCard.js';

// ============================================
// STATE MACHINE
// ============================================

export const STATES = {
    INTRO: 'INTRO',
    IDLE: 'IDLE',
    INTERACTING: 'INTERACTING',
};

let currentState = STATES.INTRO;
let introStartTime = null;

/**
 * Get current state
 */
export function getState() {
    return currentState;
}

/**
 * Set state (only loop.js should call this)
 */
export function setState(newState) {
    if (currentState === newState) return;

    const prevState = currentState;
    currentState = newState;

    console.log(`State: ${prevState} → ${newState}`);

    // State transition side effects
    if (newState === STATES.IDLE) {
        enableControls();
        setAutoRotate(true);
        console.log('✓ Earth 2050 - Minimalist interface ready');
    }
}

/**
 * Check if intro is complete
 */
export function isIntroComplete() {
    return currentState !== STATES.INTRO;
}

// ============================================
// EASING FUNCTIONS
// ============================================

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ============================================
// INTRO UPDATE
// ============================================

function updateIntro(elapsed) {
    const camera = getCamera();
    const earthGroup = getEarthGroup();
    const markerObjects = getMarkerObjects();

    const { duration, fadeStart, fadeEnd, markerStart, markerStagger, markerFadeDuration, rotationSpeed } = INTRO;
    const progress = Math.min(elapsed / duration, 1);

    // Camera zoom with easing
    const zoomProgress = easeOutQuart(progress);
    const startZ = CAMERA.startZ;
    const endZ = CAMERA.endZ;
    camera.position.z = startZ + (endZ - startZ) * zoomProgress;

    // Earth fade-in
    if (elapsed >= fadeStart) {
        const fadeProgress = easeInOutCubic(Math.min((elapsed - fadeStart) / (fadeEnd - fadeStart), 1));
        updateEarthOpacity(fadeProgress);
    }

    // Atmosphere fade-in
    if (elapsed >= fadeStart) {
        const fadeProgress = easeOutCubic(Math.min((elapsed - fadeStart) / (fadeEnd - fadeStart), 1));
        updateAtmosphereOpacity(fadeProgress);
    }

    // Markers fade-in (staggered, featured only)
    if (elapsed >= markerStart) {
        markerObjects.forEach((markerGroup, index) => {
            const city = markerGroup.userData;
            if (!city.featured) return;

            const stagger = index * markerStagger;
            const markerElapsed = elapsed - markerStart - stagger;
            if (markerElapsed > 0) {
                const markerProgress = easeOutCubic(Math.min(markerElapsed / markerFadeDuration, 1));
                updateMarkerOpacity(index, markerProgress * city.baseOpacity);
            }
        });
    }

    // Slow rotation during intro
    if (earthGroup) {
        earthGroup.rotation.y += rotationSpeed;
    }

    // Check intro completion
    if (progress >= 1) {
        setState(STATES.IDLE);
    }
}

// ============================================
// IDLE UPDATE
// ============================================

function updateIdle() {
    const markerObjects = getMarkerObjects();
    const hoveredMarker = getHoveredMarker();
    const time = performance.now() * 0.001;
    const camera = getCamera();

    const clusters = computeClusters(camera);
    renderClusterMarkers(clusters);
    updateHoverPosition(clusters);

    // Subtle pulse on featured markers
    markerObjects.forEach((markerGroup, index) => {
        const { featured, baseOpacity } = markerGroup.userData;
        if (featured && markerGroup !== hoveredMarker) {
            const pulse = baseOpacity + Math.sin(time * ANIMATION.pulseSpeed + index * ANIMATION.pulseOffset) * 0.1;
            updateMarkerOpacity(index, pulse);
        }
    });
}

// ============================================
// RENDER LOOP
// ============================================

function animate() {
    requestAnimationFrame(animate);

    const scene = getScene();
    const camera = getCamera();
    const renderer = getRenderer();

    if (!scene || !camera || !renderer) return;

    const elapsed = performance.now() - introStartTime;

    // State-based updates
    switch (currentState) {
        case STATES.INTRO:
            updateIntro(elapsed);
            break;
        case STATES.IDLE:
        case STATES.INTERACTING:
            updateIdle();
            break;
    }

    updateControls();
    renderer.render(scene, camera);
}

/**
 * Start the render loop
 */
export function startLoop() {
    introStartTime = performance.now();
    animate();
}
