/**
 * Scene Module
 * Handles scene, camera, renderer setup
 * Reads configuration from config/visual.js
 */

import * as THREE from 'three';
import { COLORS, CAMERA } from '../config/visual.js';

let scene = null;
let camera = null;
let renderer = null;

/**
 * Create and configure the Three.js scene
 */
export function createScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.background);
    return scene;
}

/**
 * Create and configure the camera
 */
export function createCamera() {
    camera = new THREE.PerspectiveCamera(
        CAMERA.fov,
        window.innerWidth / window.innerHeight,
        CAMERA.near,
        CAMERA.far
    );
    camera.position.z = CAMERA.startZ;
    return camera;
}

/**
 * Create and configure the renderer
 */
export function createRenderer(canvas) {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    return renderer;
}

/**
 * Handle window resize
 */
export function onResize() {
    if (!camera || !renderer) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Get scene instance
 */
export function getScene() {
    return scene;
}

/**
 * Get camera instance
 */
export function getCamera() {
    return camera;
}

/**
 * Get renderer instance
 */
export function getRenderer() {
    return renderer;
}
