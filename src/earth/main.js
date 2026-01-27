/**
 * ================================================
 * EARTH 2050 - STYLIZED NEON GLOBE
 * ================================================
 * 
 * Visual style: https://2050.earth/
 * - Dark globe surface
 * - Continent outlines as glowing neon green lines
 * - No photorealistic textures
 * - No atmosphere, clouds, or blue glow
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ================================================
// CONFIGURATION
// ================================================
const CONFIG = {
    // Camera
    fov: 45,
    near: 0.1,
    far: 1000,
    startDistance: 25,
    endDistance: 12,
    minDistance: 8,
    maxDistance: 20,

    // Earth
    radius: 5,
    segments: 128,
    rotationSpeed: 0.0002,

    // Neon styling
    neonColor: new THREE.Color(0x00ff9a),
    neonIntensity: 2.0,
    edgeWidth: 0.15,  // Higher value = thinner lines
    globeBaseColor: new THREE.Color(0x050508),

    // Lighting
    ambientIntensity: 0.1,

    // Controls
    dampingFactor: 0.05,
    autoRotateSpeed: 0.12,
    resumeDelay: 2000,

    // Intro
    introDuration: 4500,

    // Orbit rings
    orbitRingCount: 4,
    orbitRingRadius: 7.5,
    orbitRingSpeed: 0.0005,

    // Star field
    starShellRadius: 60,
};

// ================================================
// VISUAL TUNING (centralized to avoid magic numbers)
// ================================================
const TUNING = {
    intro: {
        markerFadeStart: 0.6,
        markerFadeScale: 2.5,
    },
    beamFlash: {
        inMs: 160,
        holdMs: 200,
        fadeMs: 800,
        min: 0.35,
    },
};

// ================================================
// STATE
// ================================================
let state = 'INTRO';
const introStartTime = performance.now();
let resumeTimer = null;

// UI interaction state (separate from intro/controls flow)
const UI_STATE = {
    IDLE: 'IDLE',
    HOVER: 'HOVER',
    ALBUM_OPEN: 'ALBUM_OPEN',
};
let uiState = UI_STATE.IDLE;

// Album state
let activeAlbum = null;
let isAlbumOpen = false;
let targetCameraPosition = null;
let targetLookAt = null;
let cameraTransitionProgress = 1;
let photoDataLoaded = false;
let orbitRingGroup = null;
let starFieldGroup = null;

// ================================================
// SCENE SETUP
// ================================================
const canvas = document.getElementById('canvas');

const scene = new THREE.Scene();
scene.background = null;  // Disable clearColor, use shader background

const camera = new THREE.PerspectiveCamera(
    CONFIG.fov,
    window.innerWidth / window.innerHeight,
    CONFIG.near,
    CONFIG.far
);
camera.position.z = CONFIG.startDistance;

const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ================================================
// LAYER: BACKGROUND (BackSide sphere)
// Render policy: depthWrite=false, renderOrder=-1000
// ================================================
const spaceBackgroundMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        
        void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPos.xyz;
            vNormal = normalize(normalMatrix * normal);
            vViewDirection = normalize(cameraPosition - worldPos.xyz);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        
        // Simplex-style noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
            
            vec3 i = floor(v + dot(v, C.yyy));
            vec3 x0 = v - i + dot(i, C.xxx);
            
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);
            
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy;
            vec3 x3 = x0 - D.yyy;
            
            i = mod289(i);
            vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            
            float n_ = 0.142857142857;
            vec3 ns = n_ * D.wyz - D.xzx;
            
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_);
            
            vec4 x = x_ * ns.x + ns.yyyy;
            vec4 y = y_ * ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            
            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);
            
            vec4 s0 = floor(b0) * 2.0 + 1.0;
            vec4 s1 = floor(b1) * 2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            
            vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
            vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
            
            vec3 p0 = vec3(a0.xy, h.x);
            vec3 p1 = vec3(a0.zw, h.y);
            vec3 p2 = vec3(a1.xy, h.z);
            vec3 p3 = vec3(a1.zw, h.w);
            
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;
            
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }
        
        void main() {
            // Normalize world position for consistent gradient
            vec3 worldDir = normalize(vWorldPosition);
            
            // Vertical gradient (y-axis based depth)
            float verticalGradient = worldDir.y * 0.5 + 0.5;
            
            // Radial distance from camera center (creates depth illusion)
            float radialDist = length(worldDir.xz);
            
            // View-dependent gradient (back of sphere is darker)
            float viewAngle = dot(vNormal, vViewDirection);
            float depthFactor = smoothstep(-0.5, 0.8, viewAngle);
            
            // Core colors - Earth 2050 palette
            vec3 deepSpace = vec3(0.0, 0.0, 0.0);           // Pure black center
            vec3 darkBlue = vec3(0.008, 0.022, 0.04);       // Lift midtones to keep nebula visible
            vec3 tealEdge = vec3(0.02, 0.06, 0.09);         // Stronger edge gradient
            vec3 greenTint = vec3(0.008, 0.03, 0.025);      // Subtle green lift
            
            // Multi-layer gradient
            float gradient1 = smoothstep(0.0, 0.6, radialDist);
            float gradient2 = smoothstep(0.3, 1.0, radialDist);
            float verticalMix = smoothstep(0.2, 0.8, verticalGradient);
            
            // Base color mixing
            vec3 color = mix(deepSpace, darkBlue, gradient1);
            color = mix(color, tealEdge, gradient2 * 0.5);
            color = mix(color, greenTint, verticalMix * 0.3);
            
            // Apply depth factor (darker behind globe)
            color *= mix(0.3, 1.0, depthFactor);
            
            // Subtle procedural noise for nebula/dust effect
            vec3 noiseCoord = worldDir * 3.0;  // Scale for noise frequency
            float noise1 = snoise(noiseCoord) * 0.5 + 0.5;
            float noise2 = snoise(noiseCoord * 2.0 + vec3(100.0)) * 0.5 + 0.5;
            float combinedNoise = noise1 * 0.7 + noise2 * 0.3;
            
            // Very subtle noise modulation (barely visible)
            // Boost dust/noise so background doesn't collapse to black
            color += vec3(0.008, 0.016, 0.022) * combinedNoise * 0.28;
            
            // Subtle vignette at horizon
            float horizonDist = abs(worldDir.y);
            float horizonGlow = smoothstep(0.0, 0.3, horizonDist);
            color = mix(color * 1.1, color, horizonGlow);
            
            // Ensure we never go too bright
            color = clamp(color, vec3(0.0), vec3(0.18));
            
            gl_FragColor = vec4(color, 1.0);
        }
    `,
    side: THREE.BackSide,
    depthWrite: false,
});

// Large sphere for background (always behind everything)
const spaceBackgroundGeometry = new THREE.SphereGeometry(500, 64, 64);
const spaceBackground = new THREE.Mesh(spaceBackgroundGeometry, spaceBackgroundMaterial);
spaceBackground.renderOrder = -1000;  // Render first (behind everything)
scene.add(spaceBackground);

// ================================================
// LIGHTING - Minimal
// ================================================
const ambientLight = new THREE.AmbientLight(0xffffff, CONFIG.ambientIntensity);
scene.add(ambientLight);

// ================================================
// EARTH GROUP
// ================================================
const earthGroup = new THREE.Group();
scene.add(earthGroup);

// ================================================
// 3D PHOTO ALBUM SYSTEM
// ================================================
const albumGroup = new THREE.Group();
scene.add(albumGroup);

// ================================================
// UTILITIES
// ================================================
function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

// Album class - manages preview and open states
class Album {
    constructor(data, surfacePosition) {
        this.data = data;  // { id, city, country, lat, lon, photos: [{url, title}...] }
        this.surfacePosition = surfacePosition.clone();
        this.state = 'PREVIEW';  // 'PREVIEW' | 'OPEN' | 'TRANSITIONING'
        this.group = new THREE.Group();
        this.previewPhoto = null;
        this.openPhotos = [];
        this.loadedTextures = [];
        this.scrollOffset = 0;
        this.columns = 4;
        this.layoutDistance = 6.0;
        this.layoutGap = 0.2;

        // Position album slightly above surface
        const normal = surfacePosition.clone().normalize();
        this.group.position.copy(surfacePosition).add(normal.multiplyScalar(0.3));
        this.group.userData = { album: this, cityData: data };

        albumGroup.add(this.group);
    }

    // Create preview photo plane (representative image)
    async createPreview() {
        if (this.data.photos.length === 0) return;

        const previewUrl = this.data.photos[0].url || this.data.photos[0];
        const texture = await this.loadTexture(previewUrl);

        // Calculate aspect ratio
        const aspect = texture.image ? texture.image.width / texture.image.height : 16 / 9;
        const height = 0.6;
        const width = height * aspect;

        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.95,
            side: THREE.DoubleSide,
            depthWrite: false,
        });

        this.previewPhoto = new THREE.Mesh(geometry, material);
        this.previewPhoto.userData = { album: this, isPreview: true };
        this.previewPhoto.renderOrder = 8;

        // Make preview face outward from globe center
        const lookDir = this.surfacePosition.clone().normalize();
        this.previewPhoto.position.copy(lookDir.multiplyScalar(0.1));
        this.previewPhoto.lookAt(this.previewPhoto.position.clone().add(this.surfacePosition.clone().normalize()));

        this.group.add(this.previewPhoto);
    }

    // Load texture with error handling
    loadTexture(url) {
        return new Promise((resolve) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                url,
                (texture) => {
                    texture.colorSpace = THREE.SRGBColorSpace;
                    this.loadedTextures.push(texture);
                    resolve(texture);
                },
                undefined,
                () => {
                    // On error, create placeholder texture
                    const canvas = document.createElement('canvas');
                    canvas.width = 320;
                    canvas.height = 180;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#0a1a12';
                    ctx.fillRect(0, 0, 320, 180);
                    ctx.strokeStyle = '#00ff9a';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(4, 4, 312, 172);
                    ctx.fillStyle = '#00ff9a';
                    ctx.font = '14px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('Loading...', 160, 95);

                    const placeholderTexture = new THREE.CanvasTexture(canvas);
                    resolve(placeholderTexture);
                }
            );
        });
    }

    // Open album - display all photos in arc
    async open() {
        if (this.state === 'OPEN') return;
        this.state = 'TRANSITIONING';

        // Hide preview
        if (this.previewPhoto) {
            this.previewPhoto.visible = false;
        }

        // Load and create all photo planes
        const photos = this.data.photos;
        const count = photos.length;

        for (let i = 0; i < count; i++) {
            const photoData = photos[i];
            const url = photoData.url || photoData;
            const texture = await this.loadTexture(url);

            // Larger photos for open state
            const aspect = texture.image ? texture.image.width / texture.image.height : 16 / 9;
            const height = 1.8;
            const width = height * aspect;

            const geometry = new THREE.PlaneGeometry(width, height);
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 0,  // Start invisible for fade-in
                side: THREE.DoubleSide,
                depthWrite: false,
            });

            const photo = new THREE.Mesh(geometry, material);
            const rotationZ = THREE.MathUtils.degToRad((Math.random() - 0.5) * 10);
            const offset = new THREE.Vector2(
                (Math.random() - 0.5) * 0.04,
                (Math.random() - 0.5) * 0.04
            );
            photo.userData = {
                album: this,
                photoIndex: i,
                photoData,
                stackRotationZ: rotationZ,
                stackOffset: offset,
                baseWidth: width,
                baseHeight: height,
            };
            photo.renderOrder = 10;
            this.openPhotos.push(photo);
            this.group.add(photo);
        }

        // Arrange in arc
        this.arrangeInArc();

        // Animate fade in
        this.openPhotos.forEach((photo, i) => {
            setTimeout(() => {
                this.animateOpacity(photo.material, 0.95, 300);
            }, i * 100);
        });

        this.state = 'OPEN';
    }

    // Arrange photos in arc formation
    arrangeInArc() {
        const count = this.openPhotos.length;
        if (count === 0) return;

        const arcRadius = 3.5;
        const arcAngle = Math.min(Math.PI * 0.7, count * 0.25);  // Wider arc for more photos
        const startAngle = -arcAngle / 2;

        // Get forward direction (away from globe center)
        const forward = this.surfacePosition.clone().normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(up, forward).normalize();

        this.openPhotos.forEach((photo, i) => {
            const t = count === 1 ? 0.5 : i / (count - 1);
            const angle = startAngle + arcAngle * t;

            // Position in arc
            const x = Math.sin(angle) * arcRadius;
            const z = Math.cos(angle) * arcRadius - arcRadius + 0.5 + i * 0.002;
            const y = (i % 2 === 0 ? 0.1 : -0.1);

            // Transform to world space
            const offset = photo.userData?.stackOffset || new THREE.Vector2(0, 0);
            const localPos = new THREE.Vector3(x + offset.x, y + offset.y, z);
            photo.position.copy(localPos);

            // Face camera
            photo.lookAt(new THREE.Vector3(0, 0, arcRadius * 2));
            // Apply stack rotation after billboard orientation
            if (photo.userData?.stackRotationZ) {
                photo.rotateZ(photo.userData.stackRotationZ);
            }
        });
    }

    // Close album - return to preview
    close() {
        if (this.state === 'PREVIEW') return;
        this.state = 'TRANSITIONING';

        // Fade out and remove open photos
        this.openPhotos.forEach((photo, i) => {
            setTimeout(() => {
                this.animateOpacity(photo.material, 0, 200, () => {
                    this.group.remove(photo);
                    photo.geometry.dispose();
                    photo.material.dispose();
                });
            }, i * 50);
        });

        // Clear after animation
        setTimeout(() => {
            this.openPhotos = [];
            if (this.previewPhoto) {
                this.previewPhoto.visible = true;
            }
            this.state = 'PREVIEW';
        }, this.openPhotos.length * 50 + 300);
    }

    // Animate material opacity
    animateOpacity(material, targetOpacity, duration, callback) {
        const startOpacity = material.opacity;
        const startTime = performance.now();

        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);  // easeOutCubic

            material.opacity = startOpacity + (targetOpacity - startOpacity) * eased;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (callback) {
                callback();
            }
        };
        animate();
    }

    // Update album each frame
    update(camera) {
        // Make preview always face camera
        if (this.previewPhoto && this.state === 'PREVIEW') {
            this.previewPhoto.lookAt(camera.position);
        }

        // Make open photos face camera
        if (this.state === 'OPEN') {
            this.updateAlbumLayout(camera);
        }
    }

    updateAlbumLayout(camera) {
        const count = this.openPhotos.length;
        if (!count) return;

        const distance = this.layoutDistance;
        const fovRad = THREE.MathUtils.degToRad(CONFIG.fov);
        const viewHeight = 2 * Math.tan(fovRad * 0.5) * distance;
        const viewWidth = viewHeight * camera.aspect;
        const columns = this.columns;
        const gap = this.layoutGap;
        const cellWidth = (viewWidth - gap * (columns - 1)) / columns;
        const cellHeight = cellWidth * 0.75;
        const rows = Math.ceil(count / columns);
        const totalHeight = rows * cellHeight + (rows - 1) * gap;
        const maxScroll = Math.max(0, totalHeight - viewHeight);
        this.scrollOffset = THREE.MathUtils.clamp(this.scrollOffset, -maxScroll, 0);

        const startX = -viewWidth * 0.5 + cellWidth * 0.5;
        const startY = viewHeight * 0.5 - cellHeight * 0.5;

        this.openPhotos.forEach((photo, i) => {
            const col = i % columns;
            const row = Math.floor(i / columns);
            const x = startX + col * (cellWidth + gap);
            const y = startY - row * (cellHeight + gap) + this.scrollOffset;
            const target = new THREE.Vector3(x, y, -distance).applyMatrix4(camera.matrixWorld);

            photo.position.lerp(target, 0.12);
            photo.quaternion.slerp(camera.quaternion, 0.2);

            const scale = Math.min(
                cellWidth / photo.userData.baseWidth,
                cellHeight / photo.userData.baseHeight
            );
            photo.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.15);
            photo.rotation.z = THREE.MathUtils.lerp(photo.rotation.z, 0, 0.12);
        });
    }

    applyScroll(deltaY) {
        this.scrollOffset -= deltaY * 0.002;
    }
}

// Store all albums
const albums = [];

// Create photo plane helper (standalone)
function createPhotoPlane(imageUrl, width = 1.2, height = 0.9) {
    const geometry = new THREE.PlaneGeometry(width, height);
    const texture = new THREE.TextureLoader().load(imageUrl);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
    });

    return new THREE.Mesh(geometry, material);
}

// Camera transition to album
function animateCameraToAlbum(album) {
    const albumPos = album.group.position.clone();
    const normal = albumPos.clone().normalize();

    // Camera position: in front of album, looking at it
    targetCameraPosition = albumPos.clone().add(normal.multiplyScalar(5));
    targetLookAt = albumPos.clone();
    cameraTransitionProgress = 0;
}

// Camera transition back to default
function animateCameraToDefault() {
    targetCameraPosition = new THREE.Vector3(0, 0, CONFIG.endDistance);
    targetLookAt = new THREE.Vector3(0, 0, 0);
    cameraTransitionProgress = 0;
}

// Open album handler
function openAlbum(album) {
    if (activeAlbum === album) return;

    // Close previous album if any
    if (activeAlbum) {
        activeAlbum.close();
    }

    activeAlbum = album;
    isAlbumOpen = true;
    uiState = UI_STATE.ALBUM_OPEN;
    hideHoverPanel();
    if (hoveredMarker) resetMarkerHover();

    // Stop earth rotation and auto-rotate
    controls.autoRotate = false;
    targetCameraPosition = null; // Keep camera steady for 3D->2D album transition.
    targetLookAt = null;
    cameraTransitionProgress = 1;

    // Open the album
    album.open();
}

// Close album handler
function closeAlbum() {
    if (!activeAlbum) return;

    activeAlbum.close();
    activeAlbum = null;
    isAlbumOpen = false;
    uiState = UI_STATE.IDLE;

    // Resume earth rotation
    controls.autoRotate = true;

    // Return camera to default
    animateCameraToDefault();
}

// Update camera transition
function updateCameraTransition(deltaTime) {
    if (cameraTransitionProgress >= 1) return;

    cameraTransitionProgress += deltaTime * 1.5;  // Speed
    cameraTransitionProgress = Math.min(cameraTransitionProgress, 1);

    const eased = 1 - Math.pow(1 - cameraTransitionProgress, 3);  // easeOutCubic

    if (targetCameraPosition) {
        camera.position.lerp(targetCameraPosition, eased * 0.1);
    }
}

// Initialize albums from photo locations
function initializeAlbums(dataList) {
    dataList.forEach((cityData) => {
        if (cityData.photos && cityData.photos.length > 0) {
            const surfacePos = latLonToVector3(cityData.lat, cityData.lon, CONFIG.radius * 1.15);
            const album = new Album(cityData, surfacePos);
            album.createPreview();
            albums.push(album);
        }
    });
}

// ================================================
// GEOJSON VECTOR LINE RENDERING
// Clean continent outlines from TopoJSON data
// ================================================
import * as topojson from 'topojson-client';

// Load and render TopoJSON as vector lines
async function loadCountryBorders() {
    const response = await fetch('/data/countries.json');
    const topology = await response.json();

    // Convert TopoJSON to GeoJSON
    const countries = topojson.feature(topology, topology.objects.countries);

    // Create line geometry from GeoJSON
    const positions = [];

    countries.features.forEach(feature => {
        const geometry = feature.geometry;
        if (geometry.type === 'Polygon') {
            addPolygonToLines(geometry.coordinates, positions);
        } else if (geometry.type === 'MultiPolygon') {
            geometry.coordinates.forEach(polygon => {
                addPolygonToLines(polygon, positions);
            });
        }
    });

    // Create BufferGeometry for lines
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    // Dimmed continent line material - lower in visual hierarchy
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x1a6b4a,  // Darker teal/green
        transparent: true,
        opacity: 0.4,     // Much dimmer
        linewidth: 1,
        depthWrite: false,
    });

    const countryLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    earthGroup.add(countryLines);

    // Subtle glow layer
    const glowMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff9a,
        transparent: true,
        opacity: 0.15,
        linewidth: 1,
        depthWrite: false,
    });

    const glowLines = new THREE.LineSegments(lineGeometry.clone(), glowMaterial);
    glowLines.scale.setScalar(1.001);
    earthGroup.add(glowLines);

    return countryLines;
}

// Convert polygon coordinates to line segments on sphere
function addPolygonToLines(coordinates, positions) {
    coordinates.forEach(ring => {
        for (let i = 0; i < ring.length - 1; i++) {
            const [lon1, lat1] = ring[i];
            const [lon2, lat2] = ring[i + 1];

            // Convert to 3D positions on sphere
            const pos1 = latLonToVector3(lat1, lon1, CONFIG.radius * 1.001);
            const pos2 = latLonToVector3(lat2, lon2, CONFIG.radius * 1.001);

            positions.push(pos1.x, pos1.y, pos1.z);
            positions.push(pos2.x, pos2.y, pos2.z);
        }
    });
}

// ================================================
// PHOTO SOURCES (backend /photos/map)
// ================================================
function getApiBase() {
    return import.meta.env.VITE_API_BASE || '/api';
}

function getAuthToken() {
    return localStorage.getItem('auth_token');
}

async function loadPhotoAlbumsFromApi() {
    const token = getAuthToken();
    if (!token) return [];
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/photos/map`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const groups = new Map();
    data.forEach((photo) => {
        const lat = photo.lat;
        const lon = photo.lng;
        if (lat == null || lon == null) return;
        const city = photo.city || photo.file_name || 'Unknown';
        const country = photo.country || '';
        const key = `${city}|${country}|${lat}|${lon}`;
        if (!groups.has(key)) {
            groups.set(key, {
                id: key,
                city,
                country,
                lat,
                lon,
                photos: [],
            });
        }
        const entry = groups.get(key);
        const url = photo.thumbnail_url || photo.original_url;
        if (!url) return;
        entry.photos.push({
            id: photo.id,
            url,
            title: photo.file_name || photo.id,
        });
    });
    return Array.from(groups.values());
}

async function initializePhotoData() {
    if (photoDataLoaded) return;
    photoDataLoaded = true;
    photoLocations = await loadPhotoAlbumsFromApi();
    if (photoLocations.length === 0) {
        console.warn('No location data found from /photos/map.');
        return;
    }
    createMarkers(photoLocations);
    initializeAlbums(photoLocations);
}

// ================================================
// LAYER: EARTH SURFACE - Dot grid + borders
// Render policy: depthWrite=false, renderOrder defaults (earthGroup)
// ================================================
function createDotGrid() {
    const dotPositions = [];
    const latStep = 8;   // Degrees between dots
    const lonStep = 8;

    for (let lat = -80; lat <= 80; lat += latStep) {
        // Adjust longitude step based on latitude to keep dots evenly spaced
        const adjustedLonStep = lonStep / Math.cos(lat * Math.PI / 180);
        for (let lon = -180; lon < 180; lon += Math.max(adjustedLonStep, lonStep)) {
            const pos = latLonToVector3(lat, lon, CONFIG.radius * 0.998);
            dotPositions.push(pos.x, pos.y, pos.z);
        }
    }

    const dotGeometry = new THREE.BufferGeometry();
    dotGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));

    const dotMaterial = new THREE.PointsMaterial({
        color: 0x0d4d35,  // Very dark green
        size: 0.02,
        transparent: true,
        opacity: 0.3,
        sizeAttenuation: true,
        depthWrite: false,
    });

    const dots = new THREE.Points(dotGeometry, dotMaterial);
    earthGroup.add(dots);

    return dots;
}

// ================================================
// LAYER: EARTH SURFACE - Orbit grid (lat/long)
// Render policy: depthWrite=false, low opacity
// ================================================
function createOrbitGrid() {
    const orbitPositions = [];
    const segments = 64;

    // Add latitude circles (horizontal)
    const latitudes = [-60, -30, 0, 30, 60];
    latitudes.forEach(lat => {
        for (let i = 0; i < segments; i++) {
            const lon1 = (i / segments) * 360 - 180;
            const lon2 = ((i + 1) / segments) * 360 - 180;

            const pos1 = latLonToVector3(lat, lon1, CONFIG.radius * 0.999);
            const pos2 = latLonToVector3(lat, lon2, CONFIG.radius * 0.999);

            orbitPositions.push(pos1.x, pos1.y, pos1.z);
            orbitPositions.push(pos2.x, pos2.y, pos2.z);
        }
    });

    // Add longitude lines (vertical)
    const longitudes = [-120, -60, 0, 60, 120, 180];
    longitudes.forEach(lon => {
        for (let i = 0; i < segments; i++) {
            const lat1 = (i / segments) * 180 - 90;
            const lat2 = ((i + 1) / segments) * 180 - 90;

            const pos1 = latLonToVector3(lat1, lon, CONFIG.radius * 0.999);
            const pos2 = latLonToVector3(lat2, lon, CONFIG.radius * 0.999);

            orbitPositions.push(pos1.x, pos1.y, pos1.z);
            orbitPositions.push(pos2.x, pos2.y, pos2.z);
        }
    });

    const orbitGeometry = new THREE.BufferGeometry();
    orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPositions, 3));

    const orbitMaterial = new THREE.LineBasicMaterial({
        color: 0x0a3d28,  // Very dark green
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
    });

    const orbits = new THREE.LineSegments(orbitGeometry, orbitMaterial);
    earthGroup.add(orbits);

    return orbits;
}

// ================================================
// LAYER: ORBIT RINGS (independent of earth rotation)
// Render policy: depthWrite=false, depthTest=false, renderOrder=4
// ================================================
function createOrbitRings() {
    const group = new THREE.Group();
    group.name = 'orbitRings';

    const orbitMaterialTemplate = new THREE.ShaderMaterial({
        uniforms: {
            uColor: { value: new THREE.Color(0x18c9a3) },
            uInner: { value: 1.0 },
            uOuter: { value: 1.0 },
            uIntensity: { value: 0.3 },
        },
        vertexShader: `
            varying vec2 vPos;
            void main() {
                vPos = position.xy;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uColor;
            uniform float uInner;
            uniform float uOuter;
            uniform float uIntensity;
            varying vec2 vPos;

            void main() {
                float r = length(vPos);
                float t = (r - uInner) / (uOuter - uInner);
                if (t < 0.0 || t > 1.0) discard;

                // Radial neon gradient: bright core, soft inner/outer falloff.
                float core = 1.0 - abs(t - 0.5) * 2.0;
                core = pow(smoothstep(0.0, 1.0, core), 1.6);
                float edge = smoothstep(0.0, 0.28, t) * smoothstep(1.0, 0.72, t);
                float alpha = core * edge * uIntensity;

                vec3 color = uColor * (0.45 + 0.35 * core);
                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
    });

    for (let i = 0; i < CONFIG.orbitRingCount; i++) {
        const radius = CONFIG.orbitRingRadius * (1 + (Math.random() * 2 - 1) * 0.05); // Subtle radius variance for depth without altitude shift.
        const thickness = radius * 0.02;
        const innerRadius = radius - thickness * 0.5;
        const outerRadius = radius + thickness * 0.5;
        const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 192);

        const ringGroup = new THREE.Group();
        ringGroup.userData.baseTiltX = THREE.MathUtils.degToRad((Math.random() * 2 - 1) * 12);
        ringGroup.userData.baseTiltZ = THREE.MathUtils.degToRad((Math.random() * 2 - 1) * 10);
        ringGroup.userData.phase = THREE.MathUtils.degToRad((Math.random() * 2 - 1) * 25);
        ringGroup.userData.orbitSpeed = CONFIG.rotationSpeed; // Match earth spin speed when orbit is allowed to keep moving.
        ringGroup.userData.keepRotatingOnPause = i % 2 === 1; // Deterministic split: half stay live during interaction.
        ringGroup.userData.wobblePhase = Math.random() * Math.PI * 2;
        ringGroup.userData.wobbleSpeed = 0.35 + Math.random() * 0.2;
        ringGroup.userData.wobbleAmp = THREE.MathUtils.degToRad(0.6);

        const ringMaterial = orbitMaterialTemplate.clone();
        ringMaterial.uniforms.uInner.value = innerRadius;
        ringMaterial.uniforms.uOuter.value = outerRadius;
        ringMaterial.uniforms.uColor.value = new THREE.Color(0x18c9a3);
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.renderOrder = 5;
        ringGroup.add(ringMesh);

        // Equator baseline + limited tilt to avoid a single shared plane.
        ringGroup.rotation.set(Math.PI / 2 + ringGroup.userData.baseTiltX, ringGroup.userData.phase, ringGroup.userData.baseTiltZ);

        group.add(ringGroup);
    }

    group.renderOrder = 4;

    earthGroup.add(group); // Keep rings in earth space so they stop when earth stops.
    return group;
}

// ================================================
// LAYER: STAR FIELD (shell around earth)
// Render policy: depthWrite=false, renderOrder negative
// ================================================
function createStarField() {
    const group = new THREE.Group();
    group.name = 'starField';

    const points = [];
    const glowPoints = [];
    const streakPositions = [];
    const seeds = [];
    const glowSeeds = [];
    const pointCount = 900;
    const glowCount = 140;
    const streakCount = 80;

    const camDir = camera.position.clone().normalize();

    for (let i = 0; i < pointCount; i++) {
        const dir = new THREE.Vector3().randomDirection();
        const radius = CONFIG.starShellRadius * (0.85 + Math.random() * 0.35);
        const dot = dir.dot(camDir);
        const edge = 1.0 - Math.min(Math.abs(dot), 1.0);
        const keepChance = 0.2 + edge * 0.9;
        if (Math.random() > keepChance) continue;
        points.push(dir.x * radius, dir.y * radius, dir.z * radius);
        seeds.push(Math.random());
    }

    for (let i = 0; i < glowCount; i++) {
        const dir = new THREE.Vector3().randomDirection();
        const radius = CONFIG.starShellRadius * (0.9 + Math.random() * 0.25);
        glowPoints.push(dir.x * radius, dir.y * radius, dir.z * radius);
        glowSeeds.push(Math.random());
    }

    for (let i = 0; i < streakCount; i++) {
        const dir = new THREE.Vector3().randomDirection();
        const radius = CONFIG.starShellRadius * (0.9 + Math.random() * 0.2);
        const base = dir.clone().multiplyScalar(radius);
        const streakDir = new THREE.Vector3().randomDirection().multiplyScalar(1.2);
        streakPositions.push(base.x, base.y, base.z);
        streakPositions.push(base.x + streakDir.x, base.y + streakDir.y, base.z + streakDir.z);
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    starGeometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1));

    const starMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uSize: { value: 2.0 },
            uTime: { value: 0.0 },
        },
        vertexShader: `
            uniform float uSize;
            uniform float uTime;
            varying float vViewDot;
            varying float vEdge;
            attribute float aSeed;
            varying float vSeed;

            void main() {
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vec3 dir = normalize(worldPos.xyz);
                vec3 camDir = normalize(cameraPosition);
                vViewDot = dot(dir, camDir);
                vEdge = 1.0 - clamp(vViewDot, 0.0, 1.0);
                vSeed = aSeed;

                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = uSize * (250.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying float vViewDot;
            varying float vEdge;
            varying float vSeed;

            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                float alpha = smoothstep(0.5, 0.1, dist);
                float viewFade = smoothstep(-0.35, 0.5, vViewDot);
                float edgeBoost = mix(0.5, 1.0, vEdge);
                float twinkle = 0.85 + 0.15 * sin(vSeed * 12.0 + uTime * 1.4);
                gl_FragColor = vec4(vec3(0.8, 0.9, 1.0), alpha * viewFade * edgeBoost * 0.7 * twinkle);
            }
        `,
        transparent: true,
        depthWrite: false,
    });

    const starPoints = new THREE.Points(starGeometry, starMaterial);
    starPoints.renderOrder = -900;
    group.add(starPoints);

    const glowGeometry = new THREE.BufferGeometry();
    glowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(glowPoints, 3));
    glowGeometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(glowSeeds, 1));

    const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uSize: { value: 4.5 },
            uTime: { value: 0.0 },
        },
        vertexShader: `
            uniform float uSize;
            uniform float uTime;
            varying float vViewDot;
            attribute float aSeed;
            varying float vSeed;

            void main() {
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vec3 dir = normalize(worldPos.xyz);
                vec3 camDir = normalize(cameraPosition);
                vViewDot = dot(dir, camDir);
                vSeed = aSeed;

                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = uSize * (250.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying float vViewDot;
            varying float vSeed;

            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                float alpha = smoothstep(0.5, 0.0, dist);
                float viewFade = smoothstep(-0.4, 0.6, vViewDot);
                float twinkle = 0.85 + 0.15 * sin(vSeed * 10.0 + uTime * 1.1);
                gl_FragColor = vec4(vec3(0.4, 0.8, 1.0), alpha * viewFade * 0.4 * twinkle);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });

    const glowPointsMesh = new THREE.Points(glowGeometry, glowMaterial);
    glowPointsMesh.renderOrder = -899;
    group.add(glowPointsMesh);

    const streakGeometry = new THREE.BufferGeometry();
    streakGeometry.setAttribute('position', new THREE.Float32BufferAttribute(streakPositions, 3));

    const streakMaterial = new THREE.LineBasicMaterial({
        color: 0x9fd3ff,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
    });

    const streaks = new THREE.LineSegments(streakGeometry, streakMaterial);
    streaks.renderOrder = -898;
    group.add(streaks);

    scene.add(group);
    return group;
}

// Dark base sphere (structural only)
const baseSphereGeometry = new THREE.SphereGeometry(CONFIG.radius * 0.995, 64, 64);
const baseSphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide,
    depthWrite: false,
});
const baseSphere = new THREE.Mesh(baseSphereGeometry, baseSphereMaterial);
earthGroup.add(baseSphere);

// Create orbit grid (lowest layer)
createOrbitGrid();

// Create dot grid layer
createDotGrid();

// Orbit rings live outside the earth group to keep rotating during city selection
orbitRingGroup = createOrbitRings();

// Star field is a separate shell so it doesn't get occluded by the earth
starFieldGroup = createStarField();

// Load country borders
loadCountryBorders();

// ================================================
// CONTROLS
// ================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = CONFIG.dampingFactor;
controls.enablePan = false;
controls.enableZoom = true;
controls.minDistance = CONFIG.minDistance;
controls.maxDistance = CONFIG.maxDistance;
controls.autoRotate = false;
controls.autoRotateSpeed = CONFIG.autoRotateSpeed;
controls.enabled = false;
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 0.8;

controls.addEventListener('start', () => {
    if (state !== 'INTRO') {
        state = 'INTERACTING';
        controls.autoRotate = false;
        if (resumeTimer) clearTimeout(resumeTimer);
    }
});

controls.addEventListener('end', () => {
    if (state === 'INTERACTING') {
        resumeTimer = setTimeout(() => {
            state = 'IDLE';
            controls.autoRotate = true;
        }, CONFIG.resumeDelay);
    }
});

// ================================================
// PHOTO-BASED LOCATIONS (from EXIF)
// ================================================
let photoLocations = [];

// ================================================
// LAYER: CITY MARKERS (ring + beam + streak)
// Render policy: depthWrite=false, additive blending on beams
// ================================================
const markerGroup = new THREE.Group();
earthGroup.add(markerGroup);

const markers = [];
const markerDots = [];

// Color constants
const BEAM_COLOR_DEFAULT = new THREE.Color(0xffffff);  // White beams
const BEAM_COLOR_RECENT = new THREE.Color(0xffcc00);   // Yellow for recent
const RING_COLOR_DEFAULT = new THREE.Color(0xffffff);  // White ring
const RING_COLOR_RECENT = new THREE.Color(0xffcc00);   // Yellow ring

// Animated beam material with pulse effect
function createBeamMaterial(color, {
    opacity = 0.8,
    pulseSpeed = 1.4,
    taper = 1.6,
    tail = 1.4,
    depthTest = true,
} = {}) {
    return new THREE.ShaderMaterial({
        vertexShader: `
            varying vec2 vUv;
            varying float vY;

            void main() {
                vUv = uv;
                vY = uv.y;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            uniform float opacity;
            uniform float time;
            uniform float pulseSpeed;
            uniform float taper;
            uniform float tail;
            uniform float flash;

            varying vec2 vUv;
            varying float vY;

            void main() {
                // Taper: thick at base, narrow at tip
                float width = mix(1.0, 0.05, pow(vY, taper));
                float center = 1.0 - abs(vUv.x - 0.5) * 2.0;
                center = pow(max(center, 0.0), 1.2) * width;

                // Alpha: strong base -> drop -> long tail
                float head = smoothstep(0.0, 0.12, 1.0 - vY);
                float tailFade = pow(1.0 - vY, tail);
                float alpha = (head * 0.85 + tailFade * 0.6) * center;

                // Subtle animated shimmer (no random flicker)
                float pulse = sin(vY * 9.0 - time * pulseSpeed) * 0.08 + 0.92;

                gl_FragColor = vec4(color, alpha * opacity * pulse * flash);
            }
        `,
        uniforms: {
            color: { value: color },
            opacity: { value: opacity },
            time: { value: 0.0 },
            pulseSpeed: { value: pulseSpeed },
            taper: { value: taper },
            tail: { value: tail },
            flash: { value: 1.0 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest,
        side: THREE.DoubleSide,
    });
}

// Create ring geometry for marker
function createRingMarker(radius, isRecent) {
    const ringColor = isRecent ? RING_COLOR_RECENT : RING_COLOR_DEFAULT;
    const accentColor = new THREE.Color(0x00ff9a);

    const markerMesh = new THREE.Group();

    // White-hot core
    const coreGeom = new THREE.CircleGeometry(radius * 0.18, 24);
    const coreMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide,
        depthWrite: false,
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    core.renderOrder = 6;
    markerMesh.add(core);

    // Inner ring (white)
    const innerRingGeom = new THREE.RingGeometry(radius * 0.35, radius * 0.5, 32);
    const innerRingMat = new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
    });
    const innerRing = new THREE.Mesh(innerRingGeom, innerRingMat);
    innerRing.renderOrder = 5;
    markerMesh.add(innerRing);

    // Outer ring (teal)
    const outerRingGeom = new THREE.RingGeometry(radius * 0.65, radius * 0.9, 32);
    const outerRingMat = new THREE.MeshBasicMaterial({
        color: accentColor,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false,
    });
    const outerRing = new THREE.Mesh(outerRingGeom, outerRingMat);
    outerRing.renderOrder = 4;
    markerMesh.add(outerRing);

    // Soft halo
    const haloGeom = new THREE.CircleGeometry(radius * 1.3, 24);
    const haloMat = new THREE.MeshBasicMaterial({
        color: accentColor,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Mesh(haloGeom, haloMat);
    halo.renderOrder = 3;
    markerMesh.add(halo);

    return markerMesh;
}

function seededRandom(seed) {
    let t = seed + 0x6d2b79f5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function createBeamCluster(index, height, radius, isRecent) {
    const group = new THREE.Group();
    group.renderOrder = 7;
    const mainColor = isRecent ? new THREE.Color(0xfff2c0) : new THREE.Color(0xffffff);
    const softColor = isRecent ? new THREE.Color(0xffe2a1) : new THREE.Color(0x9fdcff);

    const mainMat = createBeamMaterial(mainColor, {
        opacity: 0.85,
        pulseSpeed: 1.6,
        taper: 1.8,
        tail: 1.25,
        depthTest: false,
    });
    const softMat = createBeamMaterial(softColor, {
        opacity: 0.35,
        pulseSpeed: 1.1,
        taper: 1.4,
        tail: 1.8,
        depthTest: false,
    });

    const mainHeight = height * 0.55;
    const mainGeom = new THREE.CylinderGeometry(radius * 0.35, radius, mainHeight, 18, 1, true);
    const mainBeam = new THREE.Mesh(mainGeom, mainMat);
    mainBeam.position.y = mainHeight * 0.5; // Align beam base to local origin.
    mainBeam.renderOrder = 8;
    group.add(mainBeam);

    const softHeight = height * 0.9;
    const softGeom = new THREE.CylinderGeometry(radius * 0.2, radius * 1.6, softHeight, 12, 1, true);
    const softBeam = new THREE.Mesh(softGeom, softMat);
    softBeam.position.y = softHeight * 0.5; // Align beam base to local origin.
    softBeam.renderOrder = 7;
    group.add(softBeam);

    const trailCount = 3 + Math.floor(seededRandom(index) * 5);
    for (let i = 0; i < trailCount; i++) {
        const seed = seededRandom(index * 10 + i);
        const offsetAngle = (seed - 0.5) * 0.6;
        const offsetRadius = radius * (0.2 + seed * 0.4);

        const trailHeight = height * 1.05;
        const trailGeom = new THREE.CylinderGeometry(radius * 0.05, radius * 0.12, trailHeight, 8, 1, true);
        const trailMat = createBeamMaterial(softColor.clone(), {
            opacity: 0.2,
            pulseSpeed: 0.8 + seed * 0.6,
            taper: 1.6,
            tail: 2.2,
            depthTest: false,
        });

        const trail = new THREE.Mesh(trailGeom, trailMat);
        trail.position.y = trailHeight * 0.5; // Align trail base to local origin.
        trail.position.x = Math.cos(offsetAngle) * offsetRadius;
        trail.position.z = Math.sin(offsetAngle) * offsetRadius;
        trail.renderOrder = 6;
        group.add(trail);
    }

    group.userData.startTime = performance.now() + seededRandom(index) * 180;
    return group;
}

function createMarkers(dataList) {
    dataList.forEach((cityData, index) => {
        const surfacePos = latLonToVector3(cityData.lat, cityData.lon, CONFIG.radius);
        const normal = surfacePos.clone().normalize();

        const isRecent = index % 3 === 0;

        const baseHeight = 2.0 + Math.min(cityData.photos.length * 0.3, 1.2);
        const beamHeight = baseHeight + Math.random() * 0.3;
        const beamRadius = 0.06;

        const beamCluster = createBeamCluster(index, beamHeight, beamRadius, isRecent);
        beamCluster.position.copy(surfacePos);
        beamCluster.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

        const ringMarker = createRingMarker(0.12, isRecent);
        ringMarker.position.copy(surfacePos);
        ringMarker.lookAt(ringMarker.position.clone().add(normal));
        ringMarker.userData = cityData;

        markerGroup.add(beamCluster);
        markerGroup.add(ringMarker);

        markers.push({
            beam: beamCluster,
            dot: ringMarker,
            data: cityData,
            baseOpacity: 0.7,
            phaseOffset: index * 0.3,
            isRecent,
        });
        markerDots.push(ringMarker);
    });
}

// ================================================
// HOVER PANEL (DOM-based) - Earth 2050 Style
// ================================================
const hoverPanel = document.getElementById('hover-panel');
const hoverCity = document.getElementById('hover-city');
const hoverCountry = document.getElementById('hover-country');
const hoverMainPhoto = document.getElementById('hover-main-photo');
const hoverFlag = document.getElementById('hover-flag');
const hoverPhotoCount = document.getElementById('hover-photo-count');
const hoverThumbnails = document.getElementById('hover-thumbnails');

// Store current hovered city for click handling
let currentHoveredCity = null;

function showHoverPanel(cityData, screenX, screenY) {
    if (!hoverPanel) return;

    currentHoveredCity = cityData;

    // Set city and country
    hoverCity.textContent = cityData.city;
    hoverCountry.textContent = cityData.country;

    // Photo count
    const photoCount = cityData.photos ? cityData.photos.length : 0;
    hoverPhotoCount.textContent = `${photoCount} photo${photoCount !== 1 ? 's' : ''}`;

    // Load main photo (first photo)
    if (cityData.photos && cityData.photos.length > 0) {
        const mainPhotoUrl = cityData.photos[0].url || cityData.photos[0];
        hoverMainPhoto.src = mainPhotoUrl;
        hoverMainPhoto.onload = () => hoverMainPhoto.classList.add('loaded');
        hoverMainPhoto.onerror = () => hoverMainPhoto.classList.remove('loaded');
    } else {
        hoverMainPhoto.classList.remove('loaded');
    }

    // Load flag if available (using country code)
    if (cityData.countryCode) {
        hoverFlag.src = `https://flagcdn.com/w40/${cityData.countryCode.toLowerCase()}.png`;
        hoverFlag.onload = () => hoverFlag.classList.add('loaded');
        hoverFlag.onerror = () => hoverFlag.classList.remove('loaded');
    } else {
        hoverFlag.classList.remove('loaded');
    }

    // Create photo thumbnails (show up to 5)
    hoverThumbnails.innerHTML = '';
    const maxThumbs = Math.min(5, photoCount);

    for (let i = 0; i < maxThumbs; i++) {
        const photo = cityData.photos[i];
        const photoUrl = photo.url || photo;

        const thumb = document.createElement('div');
        thumb.className = 'hover-thumb';
        thumb.style.animationDelay = `${i * 0.05}s`;

        const img = document.createElement('img');
        img.src = photoUrl;
        img.alt = photo.title || `Photo ${i + 1}`;
        img.onerror = () => {
            // Replace with placeholder on error
            thumb.innerHTML = '<div class="hover-thumb-placeholder">📷</div>';
        };

        thumb.appendChild(img);
        hoverThumbnails.appendChild(thumb);
    }

    // Position panel (ensure it stays on screen)
    const panelWidth = 300;
    const panelHeight = 280;
    let posX = screenX + 25;
    let posY = screenY - panelHeight / 2;

    // Keep within viewport
    if (posX + panelWidth > window.innerWidth) {
        posX = screenX - panelWidth - 25;
    }
    if (posY < 10) posY = 10;
    if (posY + panelHeight > window.innerHeight - 10) {
        posY = window.innerHeight - panelHeight - 10;
    }

    hoverPanel.style.left = `${posX}px`;
    hoverPanel.style.top = `${posY}px`;
    hoverPanel.classList.add('visible');
}

function hideHoverPanel() {
    if (hoverPanel) {
        hoverPanel.classList.remove('visible');
        currentHoveredCity = null;
    }
}

// ================================================
// RAYCASTING FOR HOVER
// ================================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredMarker = null;

// Get all raycastable meshes from marker groups
function getRaycastTargets() {
    const targets = [];
    if (uiState === UI_STATE.ALBUM_OPEN) {
        return targets;
    }
    markerDots.forEach(group => {
        group.children.forEach(child => {
            child.userData.parentGroup = group;
            targets.push(child);
        });
    });
    return targets;
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (state === 'INTRO') return;
    if (uiState === UI_STATE.ALBUM_OPEN) return;

    raycaster.setFromCamera(mouse, camera);
    const targets = getRaycastTargets();
    const intersects = raycaster.intersectObjects(targets);

    if (intersects.length > 0) {
        const hit = intersects[0].object;
        const parentGroup = hit.userData.parentGroup;
        if (!parentGroup) {
            if (hoveredMarker) resetMarkerHover();
            hideHoverPanel();
            uiState = UI_STATE.IDLE;
            document.body.style.cursor = 'pointer';
            return;
        }
        const cityData = parentGroup.userData;

        if (hoveredMarker !== parentGroup) {
            // Reset previous
            if (hoveredMarker) resetMarkerHover();

            hoveredMarker = parentGroup;

            // Highlight marker
            const marker = markers.find(m => m.dot === parentGroup);
            if (marker) {
                marker.beam.material.uniforms.opacity.value = 1.0;
                // Highlight ring and dot
                parentGroup.children.forEach(child => {
                    if (child.material) child.material.opacity = 1.0;
                });
            }
        }

        // Update panel position
        const worldPos = new THREE.Vector3();
        parentGroup.getWorldPosition(worldPos);
        const screenPos = worldPos.project(camera);
        const screenX = (screenPos.x + 1) / 2 * window.innerWidth;
        const screenY = -(screenPos.y - 1) / 2 * window.innerHeight;

        showHoverPanel(cityData, screenX, screenY);
        uiState = UI_STATE.HOVER;
        document.body.style.cursor = 'pointer';
    } else {
        if (hoveredMarker) resetMarkerHover();
        hideHoverPanel();
        uiState = UI_STATE.IDLE;
        document.body.style.cursor = 'default';
    }
}

function resetMarkerHover() {
    if (hoveredMarker) {
        const marker = markers.find(m => m.dot === hoveredMarker);
        if (marker) {
            marker.beam.material.uniforms.opacity.value = marker.baseOpacity;
            // Reset ring and dot opacity
            hoveredMarker.children.forEach(child => {
                if (child.material) child.material.opacity = 0.9;
            });
        }
        hoveredMarker = null;
    }
}

window.addEventListener('mousemove', onMouseMove);

// ================================================
// MARKER & ALBUM CLICK HANDLER
// ================================================
function onMarkerClick(event) {
    if (state === 'INTRO') return;

    // If an album is already open, clicking anywhere closes it
    if (isAlbumOpen) {
        closeAlbum();
        return;
    }

    // Check if clicking on a marker
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const clickRaycaster = new THREE.Raycaster();
    clickRaycaster.setFromCamera(mouse, camera);

    const targets = getRaycastTargets();
    const intersects = clickRaycaster.intersectObjects(targets);

    if (intersects.length > 0) {
        const hit = intersects[0].object;
        const parentGroup = hit.userData.parentGroup;
        if (parentGroup) {
            const cityData = parentGroup.userData;
            const album = albums.find(a => a.data.city === cityData.city);
            if (album) {
                hideHoverPanel();
                openAlbum(album);
            }
        }
    }
}

window.addEventListener('click', onMarkerClick);

// ================================================
// KEYBOARD HANDLER (ESC to close album)
// ================================================
function onKeyDown(event) {
    if (event.key === 'Escape' && isAlbumOpen) {
        closeAlbum();
    }
}

window.addEventListener('keydown', onKeyDown);

function onWheel(event) {
    if (uiState !== UI_STATE.ALBUM_OPEN || !activeAlbum) return;
    event.preventDefault();
    activeAlbum.applyScroll(event.deltaY);
}

window.addEventListener('wheel', onWheel, { passive: false });

// ================================================
// STATE HELPERS
// ================================================
function getCitySelectionState() {
    // Refactor: define selection in one place to avoid conditional drift.
    const isCitySelected = uiState === UI_STATE.ALBUM_OPEN;
    const shouldPauseRotation = uiState !== UI_STATE.IDLE; // Interaction: hover or album pauses earth rotation.
    return { isCitySelected, shouldPauseRotation };
}

// ================================================
// EASING
// ================================================
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

// ================================================
// ANIMATION LOOP
// ================================================
let lastTime = performance.now();

function updateIntro(elapsed, time) {
    if (state !== 'INTRO') return;

    const t = Math.min(elapsed / CONFIG.introDuration, 1);
    const ease = easeOutCubic(t);

    camera.position.z = THREE.MathUtils.lerp(
        CONFIG.startDistance,
        CONFIG.endDistance,
        ease
    );

    // Fade in markers during intro
    const markerFade = Math.max(0, (t - TUNING.intro.markerFadeStart) * TUNING.intro.markerFadeScale);
    markers.forEach(({ beam }) => {
        beam.traverse((child) => {
            if (child.material && child.material.uniforms?.opacity) {
                child.material.uniforms.opacity.value = markerFade * 0.8;
                child.material.uniforms.time.value = time;
            }
        });
    });

    if (t >= 1) {
        state = 'IDLE';
        controls.enabled = true;
        controls.autoRotate = true;

        // Initialize photo locations after intro
        initializePhotoData();
    }
}

function updateBeamAnimations(time) {
    markers.forEach(({ beam, phaseOffset }) => {
        const animTime = time + phaseOffset;
        beam.traverse((child) => {
            if (child.material && child.material.uniforms?.time) {
                child.material.uniforms.time.value = animTime;
            }
        });
    });
}

function updateBeamFlash(now) {
    markers.forEach(({ beam }) => {
        const startTime = beam.userData.startTime || introStartTime;
        const elapsedMs = now - startTime;
        const flash = Math.min(Math.max(elapsedMs / TUNING.beamFlash.inMs, 0), 1);
        const fade = 1 - Math.min(Math.max((elapsedMs - TUNING.beamFlash.holdMs) / TUNING.beamFlash.fadeMs, 0), 1);
        const flashValue = Math.min(1, flash) * Math.max(TUNING.beamFlash.min, fade);

        beam.traverse((child) => {
            if (child.material && child.material.uniforms?.flash) {
                child.material.uniforms.flash.value = flashValue;
            }
        });
    });
}

function updateEarthAndControls(shouldPauseRotation) {
    // Refactor: keep rotation and controls in one place for visibility checks.
    if (!shouldPauseRotation) {
        earthGroup.rotation.y += CONFIG.rotationSpeed;
    }

    if (state !== 'INTRO') {
        controls.autoRotate = !shouldPauseRotation && state === 'IDLE';
    }
}

function updateOrbitRings(currentUiState, time, camera) {
    if (!orbitRingGroup) return;
    const zoomT = THREE.MathUtils.clamp(
        (camera.position.length() - CONFIG.minDistance) / (CONFIG.maxDistance - CONFIG.minDistance),
        0,
        1
    );
    let intensity = THREE.MathUtils.lerp(0.22, 0.35, zoomT); // Dimmer when zoomed in.
    if (currentUiState === UI_STATE.ALBUM_OPEN) {
        intensity *= 0.6;
    }
    orbitRingGroup.children.forEach((ringGroup) => {
        const wobble = Math.sin(time * ringGroup.userData.wobbleSpeed + ringGroup.userData.wobblePhase) * ringGroup.userData.wobbleAmp;
        ringGroup.rotation.x = Math.PI / 2 + ringGroup.userData.baseTiltX + wobble; // Subtle breathing tilt.
        ringGroup.rotation.z = ringGroup.userData.baseTiltZ + wobble * 0.6;

        ringGroup.children.forEach((child) => {
            if (child.material && child.material.uniforms?.uIntensity) {
                child.material.uniforms.uIntensity.value = intensity;
            }
        });

        if (currentUiState === UI_STATE.ALBUM_OPEN) {
            ringGroup.rotation.y += ringGroup.userData.orbitSpeed; // Album: all rings keep rotating.
        } else if (currentUiState === UI_STATE.HOVER && ringGroup.userData.keepRotatingOnPause) {
            ringGroup.rotation.y += ringGroup.userData.orbitSpeed; // Hover: only half keep rotating.
        }
    });
}

function updateStarField(time) {
    if (!starFieldGroup) return;
    starFieldGroup.traverse((child) => {
        if (child.material && child.material.uniforms?.uTime) {
            child.material.uniforms.uTime.value = time;
        }
    });
}

/**
 * Debug checklist (visibility issues):
 * 1) Scene graph: object added? (orbitRingGroup/starFieldGroup/earthGroup children)
 * 2) Frustum: camera.near/far vs object radius/position.
 * 3) Scale: geometry size too small? (radius/length)
 * 4) Depth: depthWrite/depthTest/renderOrder blocking visibility.
 * 5) Animation: update functions running? (updateIntro/updateBeamAnimations/updateStarField)
 */
function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const deltaTime = (now - lastTime) / 1000;  // Delta in seconds
    lastTime = now;

    const elapsed = now - introStartTime;
    const time = now * 0.001;  // Convert to seconds for animation

    updateIntro(elapsed, time);
    if (state !== 'INTRO') {
        updateBeamAnimations(time);
    }

    const { shouldPauseRotation } = getCitySelectionState();
    updateEarthAndControls(shouldPauseRotation);
    updateOrbitRings(uiState, time, camera);

    // Update camera transition
    updateCameraTransition(deltaTime);

    // Beam flash/fade timings (one-time per beam cluster)
    updateBeamFlash(now);

    // Star field twinkle
    updateStarField(time);

    // Update all albums (billboard effect)
    albums.forEach(album => album.update(camera));

    controls.update();
    renderer.render(scene, camera);
}

// ================================================
// RESIZE
// ================================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ================================================
// START
// ================================================
animate();
console.log('Earth 2050 - Neon Globe with City Markers loaded');
