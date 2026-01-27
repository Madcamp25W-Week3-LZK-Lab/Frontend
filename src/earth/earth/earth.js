/**
 * Earth Module
 * Creates Earth mesh ONLY - no animation logic
 * Reads configuration from config/visual.js
 */

import * as THREE from 'three';
import { EARTH, COLORS } from '../config/visual.js';

let earth = null;
let earthGroup = null;

/**
 * Convert lat/lng to 3D position
 */
export function latLngToVector3(lat, lng, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

/**
 * Create Earth group container
 */
export function createEarthGroup() {
    earthGroup = new THREE.Group();
    return earthGroup;
}

/**
 * Create Earth mesh with shader material
 */
export function createEarth() {
    const geometry = new THREE.SphereGeometry(
        EARTH.radius,
        EARTH.segments,
        EARTH.segments
    );

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(EARTH.textureUrl);

    // Shader material for cinematic desaturation
    const material = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
            earthTexture: { value: texture },
            opacity: { value: 0 },
            desaturation: { value: EARTH.desaturation },
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D earthTexture;
            uniform float opacity;
            uniform float desaturation;
            varying vec2 vUv;
            varying vec3 vNormal;
            
            void main() {
                vec4 texColor = texture2D(earthTexture, vUv);
                
                // Natural colors with slight desaturation for cinematic feel
                float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
                vec3 desaturated = mix(texColor.rgb, vec3(gray), desaturation);
                
                gl_FragColor = vec4(desaturated, opacity);
            }
        `,
    });

    earth = new THREE.Mesh(geometry, material);
    earth.rotation.y = -Math.PI / 2;

    if (earthGroup) {
        earthGroup.add(earth);
    }

    return earth;
}

/**
 * Update Earth opacity (called from loop.js)
 */
export function updateEarthOpacity(value) {
    if (earth && earth.material.uniforms) {
        earth.material.uniforms.opacity.value = value;
    }
}

/**
 * Get Earth mesh
 */
export function getEarth() {
    return earth;
}

/**
 * Get Earth group
 */
export function getEarthGroup() {
    return earthGroup;
}
