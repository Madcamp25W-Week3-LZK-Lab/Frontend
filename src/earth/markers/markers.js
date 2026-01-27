/**
 * Markers Module
 * Marker creation and update - no interaction logic
 * Reads configuration from config/visual.js
 */

import * as THREE from 'three';
import { MARKERS, COLORS, EARTH, CLUSTERING } from '../config/visual.js';
import { CITIES } from '../config/cities.js';
import { latLngToVector3 } from '../earth/earth.js';

let markerObjects = [];
let markerDots = [];
let clusters = [];  // computed clusters for current frame

/**
 * Create all city markers
 */
export function createMarkers(earthGroup) {
    markerObjects = [];
    markerDots = [];

    CITIES.forEach((city, index) => {
        const surfacePos = latLngToVector3(
            city.lat,
            city.lng,
            EARTH.radius * MARKERS.surfaceOffset
        );

        // Create marker group
        const markerGroup = new THREE.Group();

        // Single small dot at surface
        const dotGeometry = new THREE.SphereGeometry(MARKERS.size, MARKERS.segments, MARKERS.segments);
        const dotMaterial = new THREE.MeshBasicMaterial({
            color: COLORS.accent,
            transparent: true,
            opacity: 0,
        });
        const dot = new THREE.Mesh(dotGeometry, dotMaterial);
        dot.position.copy(surfacePos);
        markerGroup.add(dot);

        // Store references
        markerGroup.userData = {
            ...city,
            dot,
            index,
            baseOpacity: city.featured ? MARKERS.featuredOpacity : MARKERS.unfeaturedOpacity,
            clusterHidden: false,
        };

        earthGroup.add(markerGroup);
        markerObjects.push(markerGroup);
        markerDots.push(dot);
    });

    return { markerObjects, markerDots };
}

/**
 * Update marker opacity by index
 */
export function updateMarkerOpacity(index, value) {
    const markerGroup = markerObjects[index];
    if (markerGroup && markerGroup.userData.dot) {
        if (markerGroup.userData.clusterHidden) {
            markerGroup.userData.dot.material.opacity = 0;
            return;
        }
        markerGroup.userData.dot.material.opacity = value;
    }
}

/**
 * Highlight a marker (on hover)
 */
export function highlightMarker(markerGroup, highlight) {
    const { dot, baseOpacity } = markerGroup.userData;

    if (highlight) {
        if (dot) {
            dot.scale.setScalar(MARKERS.hoverScale);
            dot.material.opacity = MARKERS.hoverOpacity;
        }
    } else {
        if (dot) {
            dot.scale.setScalar(1);
            dot.material.opacity = baseOpacity;
        }
    }
}

/**
 * Get all marker groups
 */
export function getMarkerObjects() {
    return markerObjects;
}

/**
 * Get all marker dots (for raycasting)
 */
export function getMarkerDots() {
    return markerDots;
}

/**
 * Compute clusters based on screen positions
 * Returns array of { screenX, screenY, cities: [...], representative: markerGroup }
 */
export function computeClusters(camera) {
    const screenPositions = [];
    markerObjects.forEach((markerGroup) => {
        markerGroup.userData.clusterHidden = false;
    });

    // Get screen positions for all featured markers
    markerObjects.forEach((markerGroup) => {
        const city = markerGroup.userData;
        if (!city.featured) return;

        const worldPos = new THREE.Vector3();
        markerGroup.userData.dot.getWorldPosition(worldPos);

        // Check if marker is facing camera (not on back side)
        const cameraDir = camera.position.clone().normalize();
        const markerDir = worldPos.clone().normalize();
        if (cameraDir.dot(markerDir) < 0) return;  // behind globe

        const screenPos = worldPos.clone().project(camera);
        const screenX = (screenPos.x + 1) / 2 * window.innerWidth;
        const screenY = -(screenPos.y - 1) / 2 * window.innerHeight;

        screenPositions.push({
            markerGroup,
            city,
            screenX,
            screenY,
            clustered: false
        });
    });

    // Simple clustering: group markers within threshold
    clusters = [];
    const threshold = CLUSTERING.threshold;

    screenPositions.forEach((pos, i) => {
        if (pos.clustered) return;

        const cluster = {
            screenX: pos.screenX,
            screenY: pos.screenY,
            cities: [pos.city],
            markerGroups: [pos.markerGroup],
            representative: pos.markerGroup
        };
        pos.clustered = true;

        // Find nearby markers
        screenPositions.forEach((other, j) => {
            if (i === j || other.clustered) return;
            const dx = pos.screenX - other.screenX;
            const dy = pos.screenY - other.screenY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < threshold) {
                cluster.cities.push(other.city);
                cluster.markerGroups.push(other.markerGroup);
                other.clustered = true;
            }
        });

        clusters.push(cluster);
    });

    clusters.forEach((cluster) => {
        cluster.markerGroups.forEach((markerGroup, idx) => {
            if (idx > 0) {
                markerGroup.userData.clusterHidden = true;
                if (markerGroup.userData.dot) {
                    markerGroup.userData.dot.material.opacity = 0;
                    markerGroup.userData.dot.scale.setScalar(1);
                }
            }
        });
    });

    return clusters;
}

/**
 * Get current clusters
 */
export function getClusters() {
    return clusters;
}
