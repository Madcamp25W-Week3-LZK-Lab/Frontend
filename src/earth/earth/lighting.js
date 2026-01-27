/**
 * Lighting Module
 * Sun direction, intensity, ambient light ONLY - no mesh creation
 * Reads configuration from config/visual.js
 */

import * as THREE from 'three';
import { LIGHTING } from '../config/visual.js';

let ambientLight = null;
let sunLight = null;

/**
 * Create all scene lighting
 */
export function createLighting(scene) {
    // Very low ambient for deep shadows (day/night contrast)
    ambientLight = new THREE.AmbientLight(
        LIGHTING.ambient.color,
        LIGHTING.ambient.intensity
    );
    scene.add(ambientLight);

    // Strong directional "sun" light
    sunLight = new THREE.DirectionalLight(
        LIGHTING.sun.color,
        LIGHTING.sun.intensity
    );
    sunLight.position.set(
        LIGHTING.sun.position.x,
        LIGHTING.sun.position.y,
        LIGHTING.sun.position.z
    );
    scene.add(sunLight);

    return { ambientLight, sunLight };
}

/**
 * Update sun position
 */
export function setSunPosition(x, y, z) {
    if (sunLight) {
        sunLight.position.set(x, y, z);
    }
}

/**
 * Update sun intensity
 */
export function setSunIntensity(intensity) {
    if (sunLight) {
        sunLight.intensity = intensity;
    }
}

/**
 * Update ambient intensity
 */
export function setAmbientIntensity(intensity) {
    if (ambientLight) {
        ambientLight.intensity = intensity;
    }
}

/**
 * Get lights
 */
export function getLights() {
    return { ambientLight, sunLight };
}
