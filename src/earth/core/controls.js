/**
 * Controls Module
 * Handles OrbitControls setup and interaction policies
 * Reads configuration from config/visual.js
 */

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONTROLS } from '../config/visual.js';
import { INTERACTION } from '../config/timings.js';

let controls = null;
let autoRotateTimeout = null;

/**
 * Create and configure OrbitControls
 */
export function createControls(camera, domElement) {
    controls = new OrbitControls(camera, domElement);

    controls.enableDamping = true;
    controls.dampingFactor = CONTROLS.dampingFactor;
    controls.minDistance = CONTROLS.minDistance;
    controls.maxDistance = CONTROLS.maxDistance;
    controls.enablePan = CONTROLS.enablePan;
    controls.autoRotate = false;
    controls.autoRotateSpeed = CONTROLS.autoRotateSpeed;
    controls.enabled = false; // Disabled during intro

    return controls;
}

/**
 * Enable controls (after intro)
 */
export function enableControls() {
    if (!controls) return;
    controls.enabled = true;
    controls.autoRotate = true;
}

/**
 * Disable controls
 */
export function disableControls() {
    if (!controls) return;
    controls.enabled = false;
    controls.autoRotate = false;
}

/**
 * Set auto-rotate state
 */
export function setAutoRotate(enabled) {
    if (!controls) return;
    controls.autoRotate = enabled;
}

/**
 * Handle user interaction start - slow down rotation
 */
export function onInteractionStart() {
    if (!controls) return;

    if (autoRotateTimeout) {
        clearTimeout(autoRotateTimeout);
        autoRotateTimeout = null;
    }

    controls.autoRotateSpeed = CONTROLS.slowRotateSpeed;
}

/**
 * Handle user interaction end - resume normal rotation
 */
export function onInteractionEnd() {
    if (!controls) return;

    autoRotateTimeout = setTimeout(() => {
        controls.autoRotateSpeed = CONTROLS.autoRotateSpeed;
    }, INTERACTION.autoRotateDelay);
}

/**
 * Update controls (call in render loop)
 */
export function updateControls() {
    if (controls) {
        controls.update();
    }
}

/**
 * Get controls instance
 */
export function getControls() {
    return controls;
}
