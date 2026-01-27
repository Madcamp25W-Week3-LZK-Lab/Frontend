/**
 * Interaction Module
 * Raycaster, hover, click handling with clustering support
 * Uses THREE for raycasting only
 */

import * as THREE from 'three';
import { getCamera } from '../core/scene.js';
import { isIntroComplete, setState, STATES } from '../core/loop.js';
import { onInteractionStart, onInteractionEnd } from '../core/controls.js';
import { getMarkerDots, highlightMarker, computeClusters } from './markers.js';
import { showTooltip, hideTooltip, showInfoCard, showClusterTooltip } from '../ui/infoCard.js';
import { CLUSTERING } from '../config/visual.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let hoveredMarker = null;
let hoveredCluster = null;

/**
 * Setup interaction event listeners
 */
export function setupInteraction(domElement) {
    domElement.addEventListener('mousemove', onMouseMove);
    domElement.addEventListener('click', onMouseClick);
}

/**
 * Handle mouse move - hover detection with clustering
 */
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (!isIntroComplete()) return;

    const camera = getCamera();

    // Compute clusters for current view
    const clusters = computeClusters(camera);

    // Find cluster near mouse position
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    let foundCluster = null;

    for (const cluster of clusters) {
        const dx = mouseX - cluster.screenX;
        const dy = mouseY - cluster.screenY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CLUSTERING.threshold) {  // hover detection radius
            foundCluster = cluster;
            break;
        }
    }

    if (foundCluster) {
        if (hoveredCluster !== foundCluster) {
            // Reset previous
            if (hoveredMarker) {
                highlightMarker(hoveredMarker, false);
            }
            hoveredCluster = foundCluster;
            hoveredMarker = foundCluster.representative;
            highlightMarker(hoveredMarker, true);
        }

        // Show appropriate tooltip
        const pos = { x: foundCluster.screenX, y: foundCluster.screenY };

        if (foundCluster.cities.length > 1) {
            // Cluster tooltip
            showClusterTooltip(foundCluster.cities, pos);
        } else {
            // Single city tooltip
            showTooltip(foundCluster.cities[0], pos);
        }

        document.body.style.cursor = 'pointer';
    } else {
        if (hoveredMarker) {
            highlightMarker(hoveredMarker, false);
            hoveredMarker = null;
            hoveredCluster = null;
        }
        hideTooltip();
        document.body.style.cursor = 'default';
    }
}

/**
 * Handle mouse click - open info card
 */
function onMouseClick(event) {
    if (!isIntroComplete()) return;

    if (hoveredCluster && hoveredCluster.cities.length === 1) {
        const city = hoveredCluster.cities[0];
        showInfoCard(city);
        setState(STATES.INTERACTING);
    }
}

/**
 * Keep hovered tooltip aligned with projected position
 */
export function updateHoverPosition(clusters) {
    if (!hoveredCluster || !hoveredMarker) return;

    const match = clusters.find(cluster => cluster.representative === hoveredMarker);
    if (!match) {
        highlightMarker(hoveredMarker, false);
        hoveredMarker = null;
        hoveredCluster = null;
        hideTooltip();
        document.body.style.cursor = 'default';
        return;
    }

    hoveredCluster = match;
    const pos = { x: match.screenX, y: match.screenY };
    if (match.cities.length > 1) {
        showClusterTooltip(match.cities, pos);
    } else {
        showTooltip(match.cities[0], pos);
    }
}

/**
 * Get currently hovered marker
 */
export function getHoveredMarker() {
    return hoveredMarker;
}
