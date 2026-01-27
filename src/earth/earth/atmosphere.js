/**
 * Atmosphere Module
 * Creates atmosphere glow ONLY - no lighting logic
 * Reads configuration from config/visual.js
 */

import * as THREE from 'three';
import { EARTH, COLORS, ATMOSPHERE } from '../config/visual.js';

let atmosphere = null;

/**
 * Create atmosphere glow mesh
 */
export function createAtmosphere(earthGroup) {
    const geometry = new THREE.SphereGeometry(
        EARTH.radius * EARTH.atmosphereScale,
        EARTH.segments,
        EARTH.segments
    );

    const material = new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        uniforms: {
            glowColor: { value: new THREE.Color(COLORS.atmosphereGlow) },
            opacity: { value: 0 },
            intensity: { value: ATMOSPHERE.glowIntensity },
            falloffPower: { value: ATMOSPHERE.falloffPower },
            falloffBase: { value: ATMOSPHERE.falloffBase },
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPositionNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            uniform float opacity;
            uniform float intensity;
            uniform float falloffPower;
            uniform float falloffBase;
            varying vec3 vNormal;
            varying vec3 vPositionNormal;
            void main() {
                float glow = pow(falloffBase - dot(vNormal, vPositionNormal), falloffPower);
                gl_FragColor = vec4(glowColor, glow * opacity * intensity);
            }
        `,
    });

    atmosphere = new THREE.Mesh(geometry, material);

    if (earthGroup) {
        earthGroup.add(atmosphere);
    }

    return atmosphere;
}

/**
 * Update atmosphere opacity (called from loop.js)
 */
export function updateAtmosphereOpacity(value) {
    if (atmosphere && atmosphere.material.uniforms) {
        atmosphere.material.uniforms.opacity.value = value;
    }
}

/**
 * Get atmosphere mesh
 */
export function getAtmosphere() {
    return atmosphere;
}
