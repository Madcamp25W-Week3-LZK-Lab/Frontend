/**
 * UI State Module
 * Shared UI state - NO THREE imports
 * Communication layer between Three.js and DOM
 */

// UI State
const state = {
    isCardOpen: false,
    selectedCity: null,
    isHovering: false,
    hoveredCity: null,
};

// State change listeners
const listeners = [];

/**
 * Subscribe to state changes
 */
export function subscribe(callback) {
    listeners.push(callback);
    return () => {
        const index = listeners.indexOf(callback);
        if (index > -1) listeners.splice(index, 1);
    };
}

/**
 * Notify all listeners of state change
 */
function notifyListeners() {
    listeners.forEach(callback => callback(state));
}

/**
 * Set card open state
 */
export function setCardOpen(city) {
    state.isCardOpen = true;
    state.selectedCity = city;
    notifyListeners();
}

/**
 * Set card closed state
 */
export function setCardClosed() {
    state.isCardOpen = false;
    state.selectedCity = null;
    notifyListeners();
}

/**
 * Set hover state
 */
export function setHovering(city) {
    state.isHovering = true;
    state.hoveredCity = city;
    notifyListeners();
}

/**
 * Clear hover state
 */
export function clearHovering() {
    state.isHovering = false;
    state.hoveredCity = null;
    notifyListeners();
}

/**
 * Get current state (read-only copy)
 */
export function getState() {
    return { ...state };
}

/**
 * Check if card is open
 */
export function isCardOpen() {
    return state.isCardOpen;
}

/**
 * Get selected city
 */
export function getSelectedCity() {
    return state.selectedCity;
}
