/**
 * Info Card Module
 * DOM-based floating info card and tooltip - NO THREE imports
 * Communicates via uiState.js
 */

import { setCardOpen, setCardClosed } from './uiState.js';
import { CLUSTERING } from '../config/visual.js';

let tooltip = null;
let overlay = null;
let closeBtn = null;
let onCloseCallback = null;
let clusterLayer = null;

// TWEAK: tooltip offset (pixels)
const TOOLTIP_OFFSET_X = 15;
const TOOLTIP_OFFSET_Y = -15;

/**
 * Initialize info card DOM elements
 */
export function initInfoCard(onClose) {
    onCloseCallback = onClose;

    // Get tooltip element
    tooltip = document.getElementById('city-tooltip');

    // Get overlay element
    overlay = document.getElementById('photo-overlay');

    // Cluster marker layer
    clusterLayer = document.getElementById('cluster-layer');

    // Setup close button
    closeBtn = document.getElementById('close-overlay');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideInfoCard);
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay?.classList.contains('visible')) {
            hideInfoCard();
        }
    });
}

/**
 * Show tooltip at position
 */
export function showTooltip(city, screenPos) {
    if (!tooltip) return;

    tooltip.innerHTML = `
        <div class="tooltip-content">
            <span class="city-name">${city.name}</span>
            <span class="country-name">${city.country}</span>
        </div>
    `;

    setTooltipPosition(screenPos);
    tooltip.classList.add('visible');
}

/**
 * Show cluster tooltip at position (multiple cities)
 */
export function showClusterTooltip(cities, screenPos) {
    if (!tooltip) return;

    const maxShow = CLUSTERING.maxNamesInTooltip;
    const showCities = cities.slice(0, maxShow);
    const remaining = cities.length - maxShow;

    let namesHtml = showCities.map(c => `<span class="city-name">${c.name}</span>`).join('');
    if (remaining > 0) {
        namesHtml += `<span class="country-name">+${remaining}</span>`;
    }

    tooltip.innerHTML = `
        <div class="tooltip-content cluster-tooltip">
            <span class="cluster-count">${cities.length}</span>
            ${namesHtml}
        </div>
    `;

    setTooltipPosition(screenPos);
    tooltip.classList.add('visible');
}

/**
 * Update tooltip position only
 */
export function setTooltipPosition(screenPos) {
    if (!tooltip) return;
    tooltip.style.left = `${screenPos.x + TOOLTIP_OFFSET_X}px`;
    tooltip.style.top = `${screenPos.y + TOOLTIP_OFFSET_Y}px`;
}

/**
 * Render cluster markers (count badges)
 */
export function renderClusterMarkers(clusters) {
    if (!clusterLayer) return;

    clusterLayer.innerHTML = '';
    clusters.forEach((cluster) => {
        if (cluster.cities.length <= 1) return;

        const marker = document.createElement('div');
        marker.className = 'cluster-marker';
        marker.textContent = String(cluster.cities.length);
        marker.style.left = `${cluster.screenX}px`;
        marker.style.top = `${cluster.screenY}px`;
        clusterLayer.appendChild(marker);
    });
}

/**
 * Hide tooltip
 */
export function hideTooltip() {
    if (tooltip) {
        tooltip.classList.remove('visible');
    }
}

/**
 * Show info card for a city
 */
export function showInfoCard(city) {
    const title = document.getElementById('overlay-title');
    const meta = document.getElementById('overlay-meta');

    if (title) title.textContent = city.name;
    if (meta) meta.textContent = city.country;

    if (overlay) {
        overlay.classList.add('visible');
    }

    setCardOpen(city);
}

/**
 * Hide info card
 */
export function hideInfoCard() {
    if (overlay) {
        overlay.classList.remove('visible');
    }

    setCardClosed();

    // Notify callback (for controls auto-rotate)
    if (onCloseCallback) {
        onCloseCallback();
    }
}

/**
 * Check if overlay is visible
 */
export function isOverlayVisible() {
    return overlay?.classList.contains('visible') ?? false;
}
