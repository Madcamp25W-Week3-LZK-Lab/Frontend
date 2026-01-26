import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, User, MapPin, Sparkles, Search, Plus, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, Eye, EyeOff, Send, MessageSquare, LayoutGrid, Layers } from "lucide-react";
import { aiApi, boardApi, driveApi, photosApi, promptsApi, tagsApi } from "../../lib/api";
import OnboardingOverlay from "../onboarding/OnboardingOverlay.jsx";

const CATEGORY_ICONS = {
  object: Box,
  person: User,
  location: MapPin,
  other: Sparkles,
};

const resolvePhotoUrl = (photo) =>
  photo?.thumbnail_url ||
  photo?.thumbnailLink ||
  photo?.drive?.thumbnail_url ||
  photo?.drive?.thumbnailLink ||
  photo?.original_url ||
  photo?.drive?.original_url ||
  "";

const resolveFullPhotoUrl = (photo) =>
  photo?.original_url ||
  photo?.drive?.original_url ||
  photo?.thumbnail_url ||
  photo?.thumbnailLink ||
  photo?.drive?.thumbnail_url ||
  photo?.drive?.thumbnailLink ||
  "";

const resolveOriginalProxyUrl = (photo, accessToken, authToken) => {
  if (!photo?.id) return "";
  const apiBase = import.meta.env.VITE_API_BASE || "/api";
  const params = new URLSearchParams();
  if (accessToken) {
    params.set("access_token", accessToken);
  }
  if (authToken) {
    params.set("auth_token", authToken);
  }
  const query = params.toString();
  return `${apiBase}/photos/${photo.id}/original${query ? `?${query}` : ""}`;
};

// New Category Modal Component
const NewCategoryModal = ({ isOpen, onClose, onCreate }) => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('input'); // 'input' | 'analyzing' | 'complete'
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!query.trim()) return;

    setStatus('analyzing');
    setProgress(0);
    setError("");

    // Simulate AI analysis with progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      const data = await onCreate?.(query.trim());
      clearInterval(interval);
      setProgress(100);
      if (data) {
        setResult(data);
        setStatus('complete');
      } else {
        setStatus('input');
      }
    } catch (err) {
      clearInterval(interval);
      setStatus('input');
      setError(err?.message || "카테고리 생성에 실패했습니다.");
    }
  };

  const handleConfirm = () => {
    if (result) {
      onClose();
    }
    handleReset();
  };

  const handleReset = () => {
    setQuery('');
    setStatus('input');
    setProgress(0);
    setResult(null);
    setError("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="new-category-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="new-category-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Input State */}
        {status === 'input' && (
          <>
            <div className="new-category-icon">🔍</div>
            <h3 className="new-category-title">무엇을 찾고 싶나요?</h3>
            <p className="new-category-subtitle">AI가 사진에서 해당 항목을 찾아드립니다</p>

            <input
              type="text"
              className="new-category-input"
              placeholder="예: 커피잔, 노트북, 바다..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              autoFocus
            />
            {error && <p className="auth-error">{error}</p>}

            <div className="new-category-actions">
              <button className="new-category-btn new-category-btn--cancel" onClick={handleClose}>
                취소
              </button>
              <button
                className="new-category-btn new-category-btn--primary"
                onClick={handleAnalyze}
                disabled={!query.trim()}
              >
                분석 시작
              </button>
            </div>
          </>
        )}

        {/* Analyzing State */}
        {status === 'analyzing' && (
          <>
            <div className="new-category-analyzing">
              <motion.div
                className="analyzing-icon"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              >
                🔍
              </motion.div>
              <h3 className="new-category-title">AI가 분석 중...</h3>
              <p className="new-category-subtitle">"{query}"를 찾고 있습니다</p>

              <div className="analyzing-progress">
                <div
                  className="analyzing-progress-bar"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="analyzing-status">{Math.floor(progress)}% 완료</p>
            </div>
          </>
        )}

        {/* Complete State */}
        {status === 'complete' && result && (
          <>
            <motion.div
              className="new-category-complete-icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              ✨
            </motion.div>
            <h3 className="new-category-title">"{result.label}" 발견!</h3>
            <p className="new-category-subtitle">
              <strong>{result.count}장</strong>의 사진에서 발견되었습니다
            </p>

            {/* Preview thumbnails */}
            <div className="new-category-preview">
              {result.photos.slice(0, 4).map((photo, i) => (
                <div
                  key={i}
                  className="new-category-preview-item"
                  style={{ backgroundImage: `url(${resolvePhotoUrl(photo)})` }}
                />
              ))}
              {result.count > 4 && (
                <div className="new-category-preview-more">
                  +{result.count - 4}
                </div>
              )}
            </div>

            <div className="new-category-actions">
              <button className="new-category-btn new-category-btn--cancel" onClick={handleReset}>
                다시 시도
              </button>
              <button className="new-category-btn new-category-btn--primary" onClick={handleConfirm}>
                카테고리 추가
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};


// Get intersection of photo arrays
const getIntersection = (photos1, photos2) => {
  const set = new Set(photos2.map((p) => p.id));
  return photos1.filter((p) => set.has(p.id));
};

// Get grid class based on photo count
const getGridClass = (count) => {
  if (count <= 1) return 'grid-1';
  if (count === 2) return 'grid-2';
  if (count === 3) return 'grid-3';
  return 'grid-4';
};

const getStackSeed = (id) => {
  if (typeof id === "number" && Number.isFinite(id)) return id;
  if (typeof id === "string") {
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
      hash = (hash * 31 + id.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }
  return 0;
};

// Photo Viewer Lightbox Component
const PhotoViewer = ({
  photo,
  photos,
  onClose,
  onNavigate,
  showDetectionsDefault,
  onToggleDetections,
  driveAccessToken,
  authToken,
}) => {
  const currentIndex = photos.findIndex((item) => item.id === photo?.id);
  const [detections, setDetections] = useState([]);
  const [showDetections, setShowDetections] = useState(false);
  const [imageSize, setImageSize] = useState({ w: 0, h: 0, cw: 0, ch: 0 });
  const [imageSrc, setImageSrc] = useState(() =>
    resolveOriginalProxyUrl(photo, driveAccessToken, authToken)
  );
  const imgRef = useRef(null);

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      onNavigate(photos[currentIndex - 1]);
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (currentIndex < photos.length - 1) {
      onNavigate(photos[currentIndex + 1]);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(photos[currentIndex - 1]);
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNavigate(photos[currentIndex + 1]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photos, onClose, onNavigate]);

  useEffect(() => {
    let isActive = true;
    if (!photo?.id) {
      setDetections([]);
      return () => {};
    }
    photosApi.getDetections(photo.id)
      .then((res) => {
        if (isActive) {
          setDetections(res?.detections || []);
        }
      })
      .catch(() => {
        if (isActive) {
          setDetections([]);
        }
      });
    return () => {
      isActive = false;
    };
  }, [photo?.id]);

  useEffect(() => {
    const proxyUrl = resolveOriginalProxyUrl(photo, driveAccessToken, authToken);
    setImageSrc(proxyUrl || resolvePhotoUrl(photo));
  }, [photo?.id, driveAccessToken, authToken]);

  useEffect(() => {
    if (typeof showDetectionsDefault === "boolean") {
      setShowDetections(showDetectionsDefault);
    }
  }, [showDetectionsDefault, photo?.id]);

  const updateImageSize = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    setImageSize({
      w: img.naturalWidth || 0,
      h: img.naturalHeight || 0,
      cw: rect.width || 0,
      ch: rect.height || 0,
    });
  }, []);

  const handleImageLoad = () => {
    updateImageSize();
  };

  useEffect(() => {
    const handleResize = () => {
      updateImageSize();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateImageSize, photo?.id]);

  const mapDetection = (det) => {
    if (!det?.bbox) return null;
    const normalized = det.normalized === true;
    const format = det.bbox_format || (det.bbox?.x1 !== undefined ? "xyxy" : "xywh");
    if (typeof det.confidence === "number" && det.confidence < 0.5) {
      return null;
    }
    let x1;
    let y1;
    let x2;
    let y2;

    if (format === "xyxy") {
      x1 = det.bbox.x1;
      y1 = det.bbox.y1;
      x2 = det.bbox.x2;
      y2 = det.bbox.y2;
    } else {
      x1 = det.bbox.x;
      y1 = det.bbox.y;
      x2 = x1 + det.bbox.w;
      y2 = y1 + det.bbox.h;
    }

    if ([x1, y1, x2, y2].some((v) => typeof v !== "number")) {
      return null;
    }

    if (!imageSize.w || !imageSize.h || !imageSize.cw || !imageSize.ch) {
      return null;
    }
    const baseW = imageSize.w;
    const baseH = imageSize.h;
    if (normalized) {
      x1 *= baseW;
      x2 *= baseW;
      y1 *= baseH;
      y2 *= baseH;
    }

    const scaleX = (imageSize.cw || 1) / baseW;
    const scaleY = (imageSize.ch || 1) / baseH;

    return {
      x: x1 * scaleX,
      y: y1 * scaleY,
      w: (x2 - x1) * scaleX,
      h: (y2 - y1) * scaleY,
      label: det.person_tag || det.label || det.type || "",
      type: det.type || "object",
      confidence: det.confidence,
    };
  };

  const formatConfidence = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) return null;
    const percent = Math.round(value * 100);
    return `${percent}%`;
  };

  return (
    <motion.div
      className="photo-viewer-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Navigation - Left */}
      {currentIndex > 0 && (
        <button className="photo-viewer-nav photo-viewer-nav--prev" onClick={handlePrev}>
          ‹
        </button>
      )}

      {/* Photo */}
      <div className="photo-viewer-media" onClick={(e) => e.stopPropagation()}>
        <motion.img
          ref={imgRef}
          src={imageSrc}
          alt=""
          className="photo-viewer-image"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onLoad={handleImageLoad}
          onAnimationComplete={updateImageSize}
          onError={() => {
            const fallback = resolvePhotoUrl(photo);
            if (fallback && fallback !== imageSrc) {
              setImageSrc(fallback);
            }
          }}
        />
        {showDetections && detections.length > 0 && (
          <div className="photo-viewer-detections">
            {detections.map((det, index) => {
              const box = mapDetection(det);
              if (!box) return null;
              return (
                <div
                  key={`${det.label || det.type}-${index}`}
                  className={`photo-viewer-box photo-viewer-box--${box.type}`}
                  style={{
                    left: `${box.x}px`,
                    top: `${box.y}px`,
                    width: `${box.w}px`,
                    height: `${box.h}px`,
                  }}
                >
                  <span className="photo-viewer-box-label">
                    {box.label || box.type}
                    {formatConfidence(box.confidence)
                      ? ` · ${formatConfidence(box.confidence)}`
                      : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation - Right */}
      {currentIndex < photos.length - 1 && (
        <button className="photo-viewer-nav photo-viewer-nav--next" onClick={handleNext}>
          ›
        </button>
      )}

      {/* Counter */}
      <div className="photo-viewer-counter">
        {currentIndex + 1} / {photos.length}
      </div>

      {detections.length > 0 && (
        <button
          className="photo-viewer-toggle"
          onClick={(e) => {
            e.stopPropagation();
            const next = !showDetections;
            setShowDetections(next);
            onToggleDetections?.(next);
          }}
        >
          {showDetections ? "박스 숨기기" : "박스 보기"}
        </button>
      )}

      {/* Close Button */}
      <button className="photo-viewer-close" onClick={onClose}>✕</button>
    </motion.div>
  );
};

// Expanded Folder View - Photos spread from stack and reassemble on close
const ExpandedFolder = ({ stack, onClose, onPhotoClick, onMove }) => {
  const photos = stack?.photos || [];
  const [isClosing, setIsClosing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, baseX: 0, baseY: 0 });
  const stackSize = 120;
  const cellSize = 120;
  const cellGap = 8;

  const handleClose = () => {
    setIsClosing(true);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      onClose();
    }, 520);
  };

  const columns = Math.min(4, photos.length || 1);
  const rows = Math.ceil((photos.length || 1) / 4);
  const innerGridWidth = columns * cellSize + (columns - 1) * cellGap;
  const innerGridHeight = rows * cellSize + (rows - 1) * cellGap;
  const containerPadding = 14;
  const headerSpace = 44;
  const containerWidth = innerGridWidth + containerPadding * 2;
  const containerHeight = innerGridHeight + containerPadding * 2 + headerSpace;
  const maxContainerHeight = Math.min(containerHeight, 640);
  const isScrollable = containerHeight > maxContainerHeight;

  const baseX = (stack?.x || 0) - (containerWidth - stackSize) / 2;
  const baseY = (stack?.y || 0) - (maxContainerHeight - stackSize) / 2;
  const stackOffsetX = (containerWidth - stackSize) / 2;
  const stackOffsetY = (maxContainerHeight - stackSize) / 2;
  const startScale = stackSize / cellSize;
  const stackSeed = getStackSeed(stack?.id);
  const stackOrder = photos.slice(0, 4).map((photo) => photo.id).reverse();

  const handlePointerDown = (e) => {
    if (isClosing) return;
    if (e.target.closest(".folder-expanded-close")) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: stack?.x || 0,
      baseY: stack?.y || 0,
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    onMove?.(stack?.id, dragRef.current.baseX + dx, dragRef.current.baseY + dy);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
  };

  return (
    <motion.div
      className="folder-expanded"
      style={{
        position: 'absolute',
        left: baseX,
        top: baseY,
        width: containerWidth,
        height: maxContainerHeight,
        overflowY: isScrollable ? "auto" : "hidden",
        overflowX: "hidden",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Minimal header */}
      <div className="folder-expanded-header">
        <span className="folder-expanded-label">{stack?.label}</span>
        <span className="folder-expanded-count">{photos.length}장</span>
        <button
          className="folder-expanded-close"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleClose}
        >
          ✕
        </button>
      </div>

      {/* Photo Grid - transparent container */}
      <div
        className="folder-expanded-grid"
        style={{
          width: containerWidth,
          height: containerHeight,
        }}
      >
        {photos.map((photo, index) => {
          const col = index % 4;
          const row = Math.floor(index / 4);
          const targetX = containerPadding + col * (cellSize + cellGap);
          const targetY = containerPadding + headerSpace + row * (cellSize + cellGap);

          // Initial position with random rotation (stacked look)
          const seed1 = (stackSeed * 137 + index * 47) % 100;
          const seed2 = (stackSeed * 89 + index * 31) % 100;
          const seed3 = (stackSeed * 61 + index * 23) % 100;
          const initRotation = index === 0 ? 0 : (seed1 % 17) - 8;
          const initOffsetX = index === 0 ? 0 : (seed2 % 13) - 6;
          const initOffsetY = index === 0 ? 0 : (seed3 % 13) - 6;
          const startX = stackOffsetX + (stackSize - cellSize) / 2 + initOffsetX;
          const startY = stackOffsetY + (stackSize - cellSize) / 2 + initOffsetY;

          return (
            <motion.div
              key={photo.id || index}
              className="folder-expanded-photo"
              style={{
                backgroundImage: `url(${resolvePhotoUrl(photo)})`,
                width: cellSize,
                height: cellSize,
                zIndex: (() => {
                  const stackRank = stackOrder.indexOf(photo.id);
                  if (stackRank !== -1) {
                    return photos.length + (stackOrder.length - stackRank);
                  }
                  return photos.length - index;
                })(),
              }}
              initial={{
                x: startX,
                y: startY,
                scale: startScale,
                opacity: 1,
                rotate: initRotation
              }}
              animate={isClosing ? {
                x: startX,
                y: startY,
                scale: startScale,
                opacity: 1,
                rotate: initRotation
              } : {
                x: targetX,
                y: targetY,
                scale: 1,
                opacity: 1,
                rotate: 0
              }}
              transition={{
                duration: 0.45,
                delay: isClosing ? (photos.length - index) * 0.02 : index * 0.025,
                ease: [0.4, 0, 0.2, 1]
              }}
              whileHover={!isClosing ? { scale: 1.05, zIndex: 10 } : {}}
              onClick={() => !isClosing && onPhotoClick?.(photo)}
            />
          );
        })}
      </div>
    </motion.div>
  );
};

// Photo Grid Component - Simple Grid Layout
const PhotoGrid = ({ photos, onPhotoClick }) => {
  return (
    <div className="photo-grid">
      {photos.length === 0 ? (
        <div className="photo-grid-empty">
          <span className="photo-grid-empty-icon">🖼️</span>
          <p>왼쪽 패널에서 카테고리를 선택하세요</p>
          <p className="photo-grid-empty-hint">선택한 카테고리의 사진만 표시됩니다</p>
        </div>
      ) : (
        <div className="photo-grid-container">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id || index}
              className="photo-grid-item"
              style={{ backgroundImage: `url(${resolvePhotoUrl(photo)})` }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.02, type: "spring", stiffness: 400, damping: 25 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => onPhotoClick?.(photo)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Photo Stack Component - Stacked Polaroid Style
const PhotoStack = ({
  stack,
  onPositionChange,
  onDragEnd,
  onDelete,
  onClick,
  isPreview,
  isIntersection,
  isMagnetic,
  isGlowing,
  isHidden
}) => {
  const photos = stack.photos || [];
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, stackX: 0, stackY: 0, hasMoved: false });

  // Generate random rotations and offsets for each photo (stable across re-renders)
  const photoTransforms = useMemo(() => {
    const seedBase = getStackSeed(stack.id);
    return photos.slice(0, 4).map((_, index) => {
      if (index === 0) return { rotation: 0, offsetX: 0, offsetY: 0 }; // Top photo centered
      // Generate pseudo-random values based on stack id and index
      const seed1 = (seedBase * 137 + index * 47) % 100;
      const seed2 = (seedBase * 89 + index * 31) % 100;
      const seed3 = (seedBase * 61 + index * 23) % 100;
      // Rotation: -8 to +8 degrees
      const rotation = (seed1 % 17) - 8;
      // Offset: -6 to +6 pixels in each direction
      const offsetX = (seed2 % 13) - 6;
      const offsetY = (seed3 % 13) - 6;
      return { rotation, offsetX, offsetY };
    });
  }, [photos.length, stack.id]);

  const handlePointerDown = (e) => {
    if (isPreview) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      stackX: stack.x,
      stackY: stack.y,
      hasMoved: false,
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragRef.current.hasMoved = true;
    }

    const newX = dragRef.current.stackX + dx;
    const newY = dragRef.current.stackY + dy;
    onPositionChange?.(stack.id, newX, newY, true);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newX = dragRef.current.stackX + dx;
    const newY = dragRef.current.stackY + dy;

    if (!dragRef.current.hasMoved) {
      onClick?.(stack);
    } else {
      onDragEnd?.(stack.id, newX, newY);
    }
  };

  const classNames = [
    'photo-stack',
    isDragging ? 'photo-stack--dragging' : '',
    isPreview ? 'intersection-preview' : '',
    isIntersection ? 'photo-stack--intersection' : '',
    isMagnetic ? 'photo-stack--magnetic' : '',
    isGlowing ? 'photo-stack--glowing' : '',
  ].filter(Boolean).join(' ');

  // Show max 4 photos in the stack
  const displayPhotos = photos.slice(0, 4).reverse(); // Reverse so first photo renders on top

  const resolvedOpacity = isHidden ? 0 : isPreview ? 0.7 : 1;

  return (
    <motion.div
      className={classNames}
      style={{
        position: 'absolute',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        pointerEvents: isHidden ? 'none' : 'auto',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      initial={{ scale: 0, opacity: 0, left: stack.x, top: stack.y }}
      animate={{
        left: stack.x,
        top: stack.y,
        scale: isDragging ? 1.05 : 1,
        opacity: resolvedOpacity,
        zIndex: isHidden ? 0 : isDragging ? 100 : 1,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        left: isDragging ? { duration: 0 } : { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
        top: isDragging ? { duration: 0 } : { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
        scale: { duration: 0.15 },
        opacity: { type: "spring", stiffness: 400, damping: 28 }
      }}
    >
      {/* Delete Button */}
      {!isPreview && onDelete && (
        <button
          className="stack-delete"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(stack.id, stack.categoryId);
          }}
        >
          ✕
        </button>
      )}

      {/* Stacked Photos Container */}
      <div className="stack-polaroid">
        {displayPhotos.map((photo, index) => {
          const actualIndex = displayPhotos.length - 1 - index;
          const transform = photoTransforms[actualIndex] || { rotation: 0, offsetX: 0, offsetY: 0 };
          const isTop = index === 0;

          return (
            <div
              key={photo.id || index}
              className={`stack-polaroid-photo ${isTop ? 'stack-polaroid-photo--top' : ''}`}
              style={{
                backgroundImage: `url(${resolvePhotoUrl(photo)})`,
                transform: `rotate(${transform.rotation}deg) translate(${transform.offsetX}px, ${transform.offsetY}px)`,
                zIndex: displayPhotos.length - index,
              }}
            />
          );
        })}

        {/* Photo Count Badge */}
        {photos.length > 1 && (
          <span className="stack-count">{photos.length}</span>
        )}
      </div>

      {/* Glass Label */}
      <span className="stack-label">{stack.label}</span>
    </motion.div>
  );
};

// Category Panel Component - Professional Redesign
const CategoryPanel = ({
  isOpen,
  onToggle,
  checkedItems,
  onItemToggle,
  categories = [],
  pinnedItems = [],
  customCategories = [],
  onNewCategory,
  onDriveImport,
  onRenameTag,
  onRenameCustom,
  onDeleteCustom,
}) => {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditingValue(item.label);
  };

  const handleCommitEdit = (item) => {
    const nextName = editingValue.trim();
    setEditingId(null);
    if (!nextName || nextName === item.label) return;
    if (item.kind === "tag") {
      onRenameTag?.(item.name, nextName);
    } else if (item.kind === "custom") {
      onRenameCustom?.(item.albumId, nextName);
    }
  };

  const filterItems = (items) => {
    if (!search.trim()) return items;
    const lowered = search.toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(lowered));
  };

  return (
    <div className={`category-panel ${isOpen ? "category-panel--open" : ""}`}>
      {!isOpen && (
        <button className="panel-toggle" onClick={onToggle}>
          <PanelLeft size={18} />
        </button>
      )}

      {isOpen && (
        <div className="panel-content">
          {/* Header with integrated toggle */}
          <div className="panel-header-row">
            <h2 className="panel-header">카테고리</h2>
            <button className="panel-header-toggle" onClick={onToggle}>
              <PanelLeftClose size={18} />
            </button>
          </div>

          {/* Search Input - Clean design */}
          <div className="panel-search">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category List - Clean, no boxes */}
          <div className="category-scroll">
            {pinnedItems.length > 0 && (
              <div className="category-group">
                <h3 className="category-title">
                  <Sparkles size={14} className="category-title-icon" />
                  고정
                </h3>
                <ul className="category-list">
                  {filterItems(pinnedItems).map((item) => {
                    const isChecked = checkedItems.includes(item.id);
                    return (
                      <li
                        key={item.id}
                        className={`category-item ${isChecked ? 'category-item--selected' : ''}`}
                        onClick={() => onItemToggle(item.id, item.label)}
                      >
                        {editingId === item.id ? (
                          <input
                            className="category-item-input"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleCommitEdit(item)}
                            onKeyDown={(e) => e.key === "Enter" && handleCommitEdit(item)}
                            autoFocus
                          />
                        ) : (
                          <span
                            className="category-item-label"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(item);
                            }}
                          >
                            {item.label}
                          </span>
                        )}
                        <span className="category-item-count">{item.count}장</span>
                        <span className="category-item-toggle">
                          {isChecked ? <Eye size={14} /> : <EyeOff size={14} />}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {categories.map((group) => {
              const IconComponent = group.icon;
              return (
                <div key={group.title} className="category-group">
                  <h3 className="category-title">
                    <IconComponent size={14} className="category-title-icon" />
                    {group.title}
                  </h3>
                  <ul className="category-list">
                    {filterItems(group.items).map((item) => {
                      const isChecked = checkedItems.includes(item.id);
                      return (
                        <li
                          key={item.id}
                          className={`category-item ${isChecked ? 'category-item--selected' : ''}`}
                          onClick={() => onItemToggle(item.id, item.label)}
                        >
                          {editingId === item.id ? (
                            <input
                              className="category-item-input"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onBlur={() => handleCommitEdit(item)}
                              onKeyDown={(e) => e.key === "Enter" && handleCommitEdit(item)}
                              autoFocus
                            />
                          ) : (
                            <span
                              className="category-item-label"
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(item);
                              }}
                            >
                              {item.label}
                            </span>
                          )}
                          <span className="category-item-count">{item.count}장</span>
                          <span className="category-item-toggle">
                            {isChecked ? <Eye size={14} /> : <EyeOff size={14} />}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}

            {/* 사용자 지정 카테고리 */}
            {customCategories.length > 0 && (
              <div className="category-group">
                <h3 className="category-title">
                  <Sparkles size={14} className="category-title-icon" />
                  사용자 지정
                </h3>
                <ul className="category-list">
                  {filterItems(customCategories).map((item) => {
                    const isChecked = checkedItems.includes(item.id);
                    return (
                      <li
                        key={item.id}
                        className={`category-item ${isChecked ? 'category-item--selected' : ''}`}
                        onClick={() => onItemToggle(item.id, item.label)}
                      >
                        {editingId === item.id ? (
                          <input
                            className="category-item-input"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleCommitEdit(item)}
                            onKeyDown={(e) => e.key === "Enter" && handleCommitEdit(item)}
                            autoFocus
                          />
                        ) : (
                          <span
                            className="category-item-label"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(item);
                            }}
                          >
                            {item.label}
                          </span>
                        )}
                        <span className="category-item-count">{item.count}장</span>
                        <button
                          className="category-item-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCustom?.(item.albumId);
                          }}
                        >
                          ✕
                        </button>
                        <span className="category-item-toggle">
                          {isChecked ? <Eye size={14} /> : <EyeOff size={14} />}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Drive Import Button */}
          <button className="add-category-btn" onClick={onDriveImport}>
            <Plus size={14} />
            <span>드라이브 가져오기</span>
          </button>

          {/* Add Button - Ghost style */}
          <button className="add-category-btn" onClick={onNewCategory}>
            <Plus size={14} />
            <span>새 카테고리</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Chat Panel Component - Professional Redesign
const ChatPanel = ({ isOpen, onToggle, onPrompt, onPhotoClick }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const prompt = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: prompt }]);
    setInput("");
    setIsSending(true);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", text: "해당 설명에 맞는 사진을 찾고 있습니다..." },
    ]);

    try {
      const result = await onPrompt?.(prompt);
      if (result?.count !== undefined) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: `"${result.label}" 결과 ${result.count}장 발견되었습니다.`,
            photos: result.photos || [],
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: error?.message || "AI 검색에 실패했습니다." },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`chat-panel ${isOpen ? "chat-panel--open" : ""}`}>
      {!isOpen && (
        <button className="panel-toggle" onClick={onToggle}>
          <PanelRight size={18} />
        </button>
      )}

      {isOpen && (
        <div className="panel-content chat-content">
          {/* Header with integrated toggle */}
          <div className="panel-header-row">
            <h2 className="panel-header">
              <Sparkles size={16} className="panel-header-icon" />
              AI 검색
            </h2>
            <button className="panel-header-toggle" onClick={onToggle}>
              <PanelRightClose size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty-state">
                <div className="chat-empty-icon">
                  <MessageSquare size={32} />
                </div>
                <p className="chat-empty-title">AI 사진 검색</p>
                <p className="chat-empty-desc">찾고 싶은 사진을 자연어로 설명해보세요</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message chat-message--${msg.role}`}>
                {msg.text}
                {msg.photos?.length > 0 && (
                  <div className="chat-photo-grid">
                    {msg.photos.map((photo) => (
                      <button
                        key={photo.id}
                        type="button"
                        className="chat-photo-thumb"
                        style={{ backgroundImage: `url(${resolvePhotoUrl(photo)})` }}
                        onClick={() => onPhotoClick?.(photo)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="사진을 설명해주세요..."
            />
            <button onClick={handleSend} className="chat-send-btn" disabled={isSending}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DriveImportModal = ({
  isOpen,
  onClose,
  onProceed,
  accessToken,
  folders,
  selectedFolderId,
  onSelectFolder,
  onRequestToken,
  onRefreshFolders,
  onImport,
  isBusy,
  error,
  importSummary,
  importPreview = [],
  includeSubfolders,
  onToggleIncludeSubfolders,
  driveImported,
  importTotal = 0,
}) => {
  if (!isOpen) return null;
  const isComplete = Boolean(driveImported && importTotal > 0);
  const handlePrimary = () => {
    if (isComplete) {
      onProceed?.();
      return;
    }
    if (accessToken) {
      onImport?.();
    } else {
      onRequestToken?.();
    }
  };
  const remainingCount = Math.max(0, (importTotal || 0) - importPreview.length);

  return (
    <motion.div
      className="drive-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="drive-modal"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{isComplete ? "Google Drive 연동 완료" : "Google Drive 연동"}</h3>
        <p className="drive-modal-desc">
          {isComplete
            ? "사진을 성공적으로 불러왔어요."
            : "사진을 불러오기 위해 Google Drive 접근 권한이 필요합니다."}
        </p>

        {!isComplete && accessToken && (
          <>
            <div className="drive-modal-row">
              <label htmlFor="drive-folder">폴더</label>
              <select
                id="drive-folder"
                value={selectedFolderId}
                onChange={(e) => onSelectFolder(e.target.value)}
              >
                <option value="">전체</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.path || `${"—".repeat(folder.depth || 0)} ${folder.name}`}
                  </option>
                ))}
              </select>
              <button className="drive-modal-refresh" onClick={onRefreshFolders} disabled={isBusy}>
                새로고침
              </button>
            </div>
            <label className="drive-modal-checkbox">
              <input
                type="checkbox"
                checked={includeSubfolders}
                onChange={(e) => onToggleIncludeSubfolders?.(e.target.checked)}
              />
              하위 폴더 포함
            </label>
          </>
        )}

        {isComplete && importPreview.length > 0 && (
          <div className="drive-modal-preview">
            {importPreview.slice(0, 5).map((photo, index) => {
              const isLast = index === Math.min(importPreview.length, 5) - 1;
              return (
                <div
                  key={photo.id}
                  className="drive-modal-thumb"
                  style={{ backgroundImage: `url(${photo.thumbnail_url || photo.original_url})` }}
                >
                  {isLast && remainingCount > 0 && (
                    <span className="drive-modal-thumb-overlay">+{remainingCount}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isComplete && importTotal > 0 && (
          <p className="drive-modal-summary">사진 {importTotal}장 불러옴 · 모두 보기</p>
        )}

        <button className="drive-modal-btn" onClick={handlePrimary} disabled={isBusy}>
          {isComplete ? "다음" : "Google Drive 연결하기"}
        </button>

        {isComplete && (
          <button className="drive-modal-link" onClick={onRequestToken} disabled={isBusy}>
            다른 계정으로 다시 연결
          </button>
        )}

        {error && <p className="auth-error">{error}</p>}
        {!isComplete && (
          <button className="drive-modal-close" onClick={onClose}>
            닫기
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};

// Main App Component
export default function App({ onBack }) {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [checkedItems, setCheckedItems] = useState([]);
  const [stacks, setStacks] = useState([]);
  const [intersectionStacks, setIntersectionStacks] = useState([]);
  const [previewIntersection, setPreviewIntersection] = useState(null);
  const [magneticStackIds, setMagneticStackIds] = useState([]);
  const [glowingStackIds, setGlowingStackIds] = useState([]);
  const [expandedStacks, setExpandedStacks] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'canvas'
  const [showOnboarding, setShowOnboarding] = useState(true); // Show onboarding for new users
  const [viewerPhoto, setViewerPhoto] = useState(null); // Photo lightbox
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [tagsSummary, setTagsSummary] = useState([]);
  const [peopleTags, setPeopleTags] = useState([]);
  const [boardState, setBoardState] = useState({ albums: [], pinned_tags: [] });
  const [allPhotos, setAllPhotos] = useState([]);
  const [categoryPhotosMap, setCategoryPhotosMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveAccessToken, setDriveAccessToken] = useState("");
  const [driveFolders, setDriveFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [driveImported, setDriveImported] = useState(false);
  const [driveImportSummary, setDriveImportSummary] = useState("");
  const [driveImportPreview, setDriveImportPreview] = useState([]);
  const [driveImportTotal, setDriveImportTotal] = useState(0);
  const [includeSubfolders, setIncludeSubfolders] = useState(false);
  const [aiStatus, setAiStatus] = useState({ status: "idle" });
  const [aiError, setAiError] = useState("");
  const [showDetectionBoxes, setShowDetectionBoxes] = useState(false);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const authToken = localStorage.getItem("auth_token") || "";
  const onboardingDriveStartedRef = useRef(false);
  const checkedItemsRef = useRef(checkedItems);
  const stackIdRef = useRef(0);
  const workspaceRef = useRef(null);
  const toolbarRef = useRef(null);
  const driveTokenClientRef = useRef(null);
  const wsRef = useRef(null);
  const wsConnectedRef = useRef(false);
  const pendingPromptRef = useRef(new Map());

  useEffect(() => {
    const toolbarGap = 10;

    const updateToolbarOffset = () => {
      if (!workspaceRef.current || !toolbarRef.current) return;
      const workspaceRect = workspaceRef.current.getBoundingClientRect();
      const toolbarRect = toolbarRef.current.getBoundingClientRect();
      const offset = toolbarRect.bottom - workspaceRect.top + toolbarGap;
      workspaceRef.current.style.setProperty("--toolbar-offset", `${offset}px`);
    };

    updateToolbarOffset();
    window.addEventListener("resize", updateToolbarOffset);
    return () => window.removeEventListener("resize", updateToolbarOffset);
  }, []);

  useEffect(() => {
    checkedItemsRef.current = checkedItems;
  }, [checkedItems]);

  const buildWsUrl = useCallback(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return null;
    const apiBase = import.meta.env.VITE_API_BASE || "/api";
    const encoded = encodeURIComponent(token);

    if (apiBase.startsWith("http")) {
      const url = new URL(apiBase);
      const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
      const path = url.pathname.replace(/\/$/, "");
      return `${wsProtocol}//${url.host}${path}/ws?token=${encoded}`;
    }

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const path = apiBase.replace(/\/$/, "");
    return `${wsProtocol}//${window.location.host}${path}/ws?token=${encoded}`;
  }, []);

  useEffect(() => {
    let isActive = true;
    let reconnectTimer;

    const connect = () => {
      const wsUrl = buildWsUrl();
      if (!wsUrl) return;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        wsConnectedRef.current = true;
      };

      ws.onmessage = (event) => {
        let payload;
        try {
          payload = JSON.parse(event.data);
        } catch (error) {
          return;
        }

        if (!payload?.prompt_id) return;
        const entry = pendingPromptRef.current.get(payload.prompt_id);
        if (!entry) return;

        if (payload.type === "prompt_error") {
          entry.reject(new Error(payload.error || "AI 분석에 실패했습니다."));
        } else if (payload.type === "prompt_done") {
          entry.resolve(payload);
        }
        pendingPromptRef.current.delete(payload.prompt_id);
      };

      ws.onclose = () => {
        wsConnectedRef.current = false;
        if (isActive) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      isActive = false;
      wsConnectedRef.current = false;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [buildWsUrl]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return;
    }
    const existing = document.querySelector('script[data-google-identity="true"]');
    if (existing) {
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!showOnboarding) return;
    if (driveImported) return;
    if (showDriveModal) return;
    if (onboardingDriveStartedRef.current) return;
    onboardingDriveStartedRef.current = true;
    setShowDriveModal(true);
  }, [showOnboarding, driveImported, showDriveModal]);

  useEffect(() => {
    if (!showDriveModal) return;
    setAnalysisStarted(false);
  }, [showDriveModal]);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const [tags, people, board, photos] = await Promise.all([
          tagsApi.listSummary(),
          tagsApi.listPeople(),
          boardApi.get(),
          photosApi.listAll(),
        ]);
        setTagsSummary(tags || []);
        setPeopleTags(people || []);
        setBoardState({
          albums: board?.albums || [],
          pinned_tags: board?.pinned_tags || [],
        });
        const loadedPhotos = photos || [];
        setAllPhotos(loadedPhotos);
        setDriveImported(loadedPhotos.length > 0);
      } catch (error) {
        setLoadError(error?.message || "데이터를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const customAlbums = useMemo(() => boardState.albums || [], [boardState.albums]);

  const tagItems = useMemo(() => {
    return tagsSummary.map((tag) => ({
      id: `tag:${tag.name}`,
      name: tag.name,
      label: tag.name,
      count: tag.count || 0,
      type: tag.type || "other",
      kind: "tag",
    }));
  }, [tagsSummary]);

  const customCategoryItems = useMemo(() => {
    return customAlbums
      .filter((album) => !String(album.id || "").startsWith("ai-"))
      .map((album) => ({
        id: `custom:${album.id}`,
        albumId: album.id,
        label: album.title || "사용자 정의",
        count: categoryPhotosMap[`custom:${album.id}`]?.length || album.photo_ids?.length || album.count || 0,
        kind: "custom",
        tags: album.tags || [],
        photoIds: album.photo_ids || [],
      }));
  }, [customAlbums, categoryPhotosMap]);

  const categoryMap = useMemo(() => {
    const map = new Map();
    tagItems.forEach((item) => map.set(item.id, item));
    customCategoryItems.forEach((item) => map.set(item.id, item));
    return map;
  }, [tagItems, customCategoryItems]);

  const pinnedItems = useMemo(() => {
    const pinned = new Set(boardState.pinned_tags || []);
    return tagItems.filter((item) => pinned.has(item.name));
  }, [tagItems, boardState.pinned_tags]);

  const categories = useMemo(() => {
    const groups = {
      object: { title: "객체", type: "object" },
      person: { title: "인물", type: "person" },
      location: { title: "장소", type: "location" },
      other: { title: "기타", type: "other" },
    };
    Object.values(groups).forEach((group) => {
      group.items = [];
      group.icon = CATEGORY_ICONS[group.type] || Sparkles;
    });
    tagItems.forEach((item) => {
      const key = groups[item.type] ? item.type : "other";
      groups[key].items.push(item);
    });
    return Object.values(groups).filter((group) => group.items.length > 0);
  }, [tagItems]);

  const filteredPhotos = useMemo(() => {
    if (checkedItems.length === 0) {
      return allPhotos;
    }
    const seen = new Map();
    checkedItems.forEach((itemId) => {
      const photos = categoryPhotosMap[itemId] || [];
      photos.forEach((photo) => {
        if (!seen.has(photo.id)) {
          seen.set(photo.id, photo);
        }
      });
    });
    return Array.from(seen.values());
  }, [checkedItems, categoryPhotosMap, allPhotos]);

  const refreshTags = useCallback(async () => {
    const [tags, people] = await Promise.all([
      tagsApi.listSummary(),
      tagsApi.listPeople(),
    ]);
    setTagsSummary(tags || []);
    setPeopleTags(people || []);
  }, []);

  const fetchAiStatus = useCallback(async () => {
    try {
      const status = await aiApi.status();
      setAiStatus(status || { status: "idle" });
      setAiError("");
    } catch (error) {
      setAiError(error?.message || "AI 상태를 확인하지 못했습니다.");
    }
  }, []);

  const startAiCategorize = useCallback(async () => {
    setAiError("");
    try {
      const result = await aiApi.categorize({ force: false });
      setAiStatus(result || { status: "queued" });
      return result;
    } catch (error) {
      setAiError(error?.message || "AI 분석 요청에 실패했습니다.");
      return null;
    }
  }, []);

  const saveBoard = useCallback(async (nextAlbums, nextPinned) => {
    const payload = {
      albums: nextAlbums,
      pinned_tags: nextPinned ?? boardState.pinned_tags,
    };
    const res = await boardApi.update(payload);
    setBoardState({
      albums: res?.albums || payload.albums,
      pinned_tags: res?.pinned_tags || payload.pinned_tags,
    });
  }, [boardState.pinned_tags]);

  const ensureCategoryPhotos = useCallback(
    async (item) => {
      if (!item) return [];
      const cached = categoryPhotosMap[item.id];
      if (cached) return cached;
      let photos = [];
      if (item.kind === "tag") {
        photos = await photosApi.listByTags([item.name]);
      } else if (item.kind === "custom") {
        if (item.photoIds?.length) {
          photos = await photosApi.batch(item.photoIds);
        } else if (item.tags?.length) {
          photos = await photosApi.listByTags(item.tags);
        }
      }
      setCategoryPhotosMap((prev) => ({ ...prev, [item.id]: photos || [] }));
      return photos || [];
    },
    [categoryPhotosMap]
  );

  const handleCreatePromptAlbum = useCallback(
    async (prompt, limit = 12) => {
      const created = await promptsApi.create(prompt);
      const promptId = created?.prompt_id;
      if (!promptId) {
        throw new Error("AI 요청을 생성하지 못했습니다.");
      }

      let result;
      if (wsConnectedRef.current) {
        result = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            pendingPromptRef.current.delete(promptId);
            reject(new Error("AI 응답 시간이 초과되었습니다."));
          }, 60000);

          pendingPromptRef.current.set(promptId, {
            resolve: (payload) => {
              clearTimeout(timeoutId);
              resolve(payload);
            },
            reject: (error) => {
              clearTimeout(timeoutId);
              reject(error);
            },
          });
        });
      } else {
        const startedAt = Date.now();
        while (Date.now() - startedAt < 60000) {
          result = await promptsApi.getResult(promptId);
          if (result?.status === "done" || result?.job_status === "done") {
            break;
          }
          if (result?.status === "error" || result?.job_status === "error") {
            throw new Error("AI 분석에 실패했습니다.");
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        if (!result || result?.status !== "done") {
          throw new Error("AI 응답 시간이 초과되었습니다.");
        }
      }

      const photoIds = result?.selected_photos || [];
      const photos = photoIds.length ? await photosApi.batch(photoIds) : [];
      const albumId = promptId;
      const albumTitle = prompt;
      const album = {
        id: albumId,
        title: albumTitle,
        tags: [],
        photo_ids: photoIds,
      };
      const nextAlbums = [...customAlbums, album];
      await saveBoard(nextAlbums, boardState.pinned_tags);
      setCategoryPhotosMap((prev) => ({
        ...prev,
        [`custom:${albumId}`]: photos,
      }));
      return {
        label: album.title,
        count: photos.length,
        photos,
      };
    },
    [boardState.pinned_tags, customAlbums, saveBoard]
  );

  const handleDeleteCustomAlbum = useCallback(
    async (albumId) => {
      const nextAlbums = customAlbums.filter((album) => album.id !== albumId);
      await saveBoard(nextAlbums, boardState.pinned_tags);
      setCheckedItems((prev) => prev.filter((id) => id !== `custom:${albumId}`));
      setStacks((prev) => prev.filter((stack) => stack.categoryId !== `custom:${albumId}`));
      setCategoryPhotosMap((prev) => {
        const next = { ...prev };
        delete next[`custom:${albumId}`];
        return next;
      });
    },
    [boardState.pinned_tags, customAlbums, saveBoard]
  );

  const handleRenameCustomAlbum = useCallback(
    async (albumId, nextTitle) => {
      const nextAlbums = customAlbums.map((album) =>
        album.id === albumId ? { ...album, title: nextTitle } : album
      );
      await saveBoard(nextAlbums, boardState.pinned_tags);
    },
    [boardState.pinned_tags, customAlbums, saveBoard]
  );

  const handleRenameTag = useCallback(
    async (oldName, nextName) => {
      await tagsApi.rename(oldName, nextName);
      setCheckedItems((prev) =>
        prev.map((id) => (id === `tag:${oldName}` ? `tag:${nextName}` : id))
      );
      setCategoryPhotosMap((prev) => {
        const next = { ...prev };
        const oldKey = `tag:${oldName}`;
        if (next[oldKey]) {
          next[`tag:${nextName}`] = next[oldKey];
          delete next[oldKey];
        }
        return next;
      });
      await refreshTags();
    },
    [refreshTags]
  );

  const handleUpdatePinned = useCallback(
    async (nextPinned) => {
      await saveBoard(customAlbums, nextPinned);
      try {
        await aiApi.mockAlbums({ mode: "person", save_to_board: true });
        await aiApi.mockAlbums({ mode: "object", save_to_board: true });
        const board = await boardApi.get();
        setBoardState({
          albums: board?.albums || [],
          pinned_tags: board?.pinned_tags || [],
        });
      } catch (error) {
        console.warn("Failed to sync AI albums", error);
      }
    },
    [customAlbums, saveBoard]
  );

  const requestDriveAccessToken = useCallback(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return Promise.reject(new Error("Google Client ID가 설정되어 있지 않습니다."));
    }
    if (!window.google?.accounts?.oauth2) {
      return Promise.reject(new Error("Google OAuth 스크립트를 불러오지 못했습니다."));
    }

    if (!driveTokenClientRef.current) {
      driveTokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/drive.readonly",
        callback: () => {},
      });
    }

    return new Promise((resolve, reject) => {
      driveTokenClientRef.current.callback = (resp) => {
        if (resp?.error) {
          reject(new Error(resp.error));
        } else {
          resolve(resp.access_token);
        }
      };
      driveTokenClientRef.current.requestAccessToken({ prompt: "" });
    });
  }, []);

  const handleLoadDriveFolders = useCallback(async () => {
    if (!driveAccessToken) return;
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await driveApi.listFolders(driveAccessToken, null, includeSubfolders);
      setDriveFolders(data?.folders || []);
    } catch (error) {
      setLoadError(error?.message || "폴더를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [driveAccessToken]);

  const handleImportDrive = useCallback(async () => {
    if (!driveAccessToken) return;
    setIsLoading(true);
    setLoadError("");
    try {
      const result = await photosApi.importDrive(driveAccessToken, selectedFolderId, includeSubfolders);
      const [photos, tags, people] = await Promise.all([
        photosApi.listAll(),
        tagsApi.listSummary(),
        tagsApi.listPeople(),
      ]);
      const fetchedPhotos = photos || [];
      setAllPhotos(fetchedPhotos);
      setTagsSummary(tags || []);
      setPeopleTags(people || []);
      const hasPhotos = fetchedPhotos.length > 0;
      setDriveImported(hasPhotos);
      if (result) {
        const imported = result.imported ?? 0;
        const skipped = result.skipped ?? 0;
        const totalFound = imported + skipped;
        setDriveImportSummary(`총 ${totalFound}장 · 신규 ${imported}장, 기존 ${skipped}장`);
        setDriveImportPreview(result.preview || []);
        setDriveImportTotal(totalFound);
        if (!hasPhotos) {
          setLoadError("선택한 폴더에서 이미지를 찾지 못했습니다.");
        }
      }
    } catch (error) {
      setLoadError(error?.message || "드라이브 가져오기에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [driveAccessToken, selectedFolderId, includeSubfolders]);

  const handleDriveProceed = useCallback(async () => {
    setShowDriveModal(false);
    setAnalysisStarted(true);
    await startAiCategorize();
  }, [startAiCategorize]);

  const handleRequestDriveToken = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const token = await requestDriveAccessToken();
      setDriveAccessToken(token);
      setSelectedFolderId("");
    } catch (error) {
      setLoadError(error?.message || "Drive 권한 연결에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [requestDriveAccessToken]);

  // Handle item toggle differently based on view mode
  const handleItemToggle = useCallback((itemId, label) => {
    const item = categoryMap.get(itemId);
    if (!item) return;

    if (viewMode === 'grid') {
      setCheckedItems(prev =>
        prev.includes(itemId)
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId]
      );
    } else {
      setCheckedItems(prev => {
        if (prev.includes(itemId)) {
          setStacks(s => s.filter(stack => stack.categoryId !== itemId));
          return prev.filter(id => id !== itemId);
        }

        const existingCount = prev.length;
        ensureCategoryPhotos(item).then((photos) => {
          const newStack = {
            id: ++stackIdRef.current,
            categoryId: itemId,
            label: label,
            photos,
            x: 80 + (existingCount % 4) * 165,
            y: 80 + Math.floor(existingCount / 4) * 180,
          };
          setStacks((current) => {
            if (!checkedItemsRef.current.includes(itemId)) {
              return current;
            }
            if (current.some((stack) => stack.categoryId === itemId)) {
              return current;
            }
            return [...current, newStack];
          });
        });
        return [...prev, itemId];
      });
    }
  }, [viewMode, categoryMap, ensureCategoryPhotos]);

  // Handle view mode change - sync stacks with checked items
  const handleViewModeChange = useCallback((newMode) => {
    if (newMode === viewMode) return;

    if (newMode === 'canvas' && checkedItems.length > 0) {
      setStacks([]);
      checkedItems.forEach((itemId, index) => {
        const item = categoryMap.get(itemId);
        if (!item) return;
        ensureCategoryPhotos(item).then((photos) => {
          setStacks((prev) => {
            if (!checkedItemsRef.current.includes(itemId)) {
              return prev;
            }
            if (prev.some((stack) => stack.categoryId === itemId)) {
              return prev;
            }
            return [
              ...prev,
              {
                id: ++stackIdRef.current,
                categoryId: itemId,
                label: item.label,
                photos,
                x: 80 + (index % 4) * 165,
                y: 80 + Math.floor(index / 4) * 180,
              },
            ];
          });
        });
      });
    }

    setViewMode(newMode);
  }, [viewMode, checkedItems, categoryMap, ensureCategoryPhotos]);

  const handleDeleteStack = useCallback((stackId, categoryId) => {
    setStacks(prev => prev.filter(s => s.id !== stackId));
    if (categoryId) {
      setCheckedItems(prev => prev.filter(id => id !== categoryId));
    }
  }, []);

  const handleDeleteIntersection = useCallback((stackId) => {
    setIntersectionStacks(prev => prev.filter(s => s.id !== stackId));
  }, []);

  const handleStackClick = useCallback((stack) => {
    // Toggle: if already expanded, close it; otherwise, add to expanded list
    setExpandedStacks(prev => {
      const isExpanded = prev.some(s => s.id === stack.id);
      if (isExpanded) {
        return prev.filter(s => s.id !== stack.id);
      } else {
        return [...prev, stack];
      }
    });
  }, []);

  const handleCloseExpanded = useCallback((stackId) => {
    setExpandedStacks(prev => prev.filter(s => s.id !== stackId));
  }, []);

  const handleExpandedMove = useCallback((stackId, nextX, nextY) => {
    setStacks(prev => prev.map(s => (s.id === stackId ? { ...s, x: nextX, y: nextY } : s)));
    setIntersectionStacks(prev => prev.map(s => (s.id === stackId ? { ...s, x: nextX, y: nextY } : s)));
    setExpandedStacks(prev => prev.map(s => (s.id === stackId ? { ...s, x: nextX, y: nextY } : s)));
  }, []);

  const handlePositionChange = useCallback((stackId, newX, newY, isDragging) => {
    setStacks(prev => prev.map(s =>
      s.id === stackId ? { ...s, x: newX, y: newY } : s
    ));

    if (!isDragging) return;

    const draggedStack = stacks.find(s => s.id === stackId);
    if (!draggedStack) return;

    let closestStack = null;
    let minDistance = Infinity;

    stacks.forEach(other => {
      if (other.id === stackId) return;
      const dx = newX - other.x;
      const dy = newY - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 180 && distance < minDistance) {
        minDistance = distance;
        closestStack = other;
      }
    });

    if (closestStack) {
      setMagneticStackIds([stackId, closestStack.id]);

      const intersectionId = `${draggedStack.categoryId}-${closestStack.categoryId}`;
      const reverseId = `${closestStack.categoryId}-${draggedStack.categoryId}`;

      const exists = intersectionStacks.some(i =>
        i.id === intersectionId || i.id === reverseId
      );

      if (!exists) {
        const commonPhotos = getIntersection(draggedStack.photos, closestStack.photos);
        if (commonPhotos.length > 0) {
          setPreviewIntersection({
            id: intersectionId,
            label: `${draggedStack.label} X ${closestStack.label}`,
            photos: commonPhotos,
            x: (newX + closestStack.x) / 2,
            y: Math.min(newY, closestStack.y) - 180,
            sourceId: stackId,
            targetId: closestStack.id,
          });
        } else {
          setPreviewIntersection(null);
        }
      } else {
        setPreviewIntersection(null);
      }
    } else {
      setMagneticStackIds([]);
      setPreviewIntersection(null);
    }
  }, [stacks, intersectionStacks]);

  const handleDragEnd = useCallback((stackId, finalX, finalY) => {
    setStacks(prev => prev.map(s =>
      s.id === stackId ? { ...s, x: finalX, y: finalY } : s
    ));

    if (previewIntersection && previewIntersection.sourceId === stackId) {
      setGlowingStackIds([stackId, previewIntersection.targetId]);
      setTimeout(() => setGlowingStackIds([]), 1200);

      setIntersectionStacks(prev => [...prev, { ...previewIntersection }]);
    }

    setMagneticStackIds([]);
    setPreviewIntersection(null);
  }, [previewIntersection]);

  const handleIntersectionPositionChange = useCallback((stackId, newX, newY) => {
    setIntersectionStacks(prev => prev.map(s =>
      s.id === stackId ? { ...s, x: newX, y: newY } : s
    ));
  }, []);

  useEffect(() => {
    checkedItems.forEach((itemId) => {
      const item = categoryMap.get(itemId);
      if (item) {
        ensureCategoryPhotos(item);
      }
    });
  }, [checkedItems, categoryMap, ensureCategoryPhotos]);

  useEffect(() => {
    if (showDriveModal && driveAccessToken) {
      handleLoadDriveFolders();
    }
  }, [showDriveModal, driveAccessToken, handleLoadDriveFolders]);

  useEffect(() => {
    if (!analysisStarted) return;
    fetchAiStatus();
  }, [analysisStarted, fetchAiStatus]);

  useEffect(() => {
    if (!analysisStarted) return;
    if (!["queued", "running"].includes(aiStatus?.status)) return;
    const interval = setInterval(() => {
      fetchAiStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, [analysisStarted, aiStatus?.status, fetchAiStatus]);

  useEffect(() => {
    if (!analysisStarted) return;
    if (aiStatus?.status !== "done") return;
    refreshTags();
    boardApi.get().then((board) => {
      setBoardState({
        albums: board?.albums || [],
        pinned_tags: board?.pinned_tags || [],
      });
    });
  }, [analysisStarted, aiStatus?.status, refreshTags]);

  // Arrange stacks to grid (like phone icons)
  const handleArrangeStacks = useCallback(() => {
    const GRID_START_X = 80;
    const GRID_START_Y = 80;
    const GRID_GAP_X = 165;
    const GRID_GAP_Y = 180;
    const COLS = 4;

    // Arrange regular stacks
    setStacks(prev => prev.map((stack, index) => ({
      ...stack,
      x: GRID_START_X + (index % COLS) * GRID_GAP_X,
      y: GRID_START_Y + Math.floor(index / COLS) * GRID_GAP_Y,
    })));

    // Arrange intersection stacks after regular stacks
    const regularCount = stacks.length;
    setIntersectionStacks(prev => prev.map((stack, index) => ({
      ...stack,
      x: GRID_START_X + ((regularCount + index) % COLS) * GRID_GAP_X,
      y: GRID_START_Y + Math.floor((regularCount + index) / COLS) * GRID_GAP_Y,
    })));
  }, [stacks.length]);

  const isEmpty = stacks.length === 0 && intersectionStacks.length === 0;
  const expandedStackIds = useMemo(
    () => new Set(expandedStacks.map((stack) => stack.id)),
    [expandedStacks]
  );

  return (
    <div
      className={[
        "app-layout",
        leftPanelOpen ? "app-layout--left-open" : "",
        rightPanelOpen ? "app-layout--right-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <CategoryPanel
        isOpen={leftPanelOpen}
        onToggle={() => setLeftPanelOpen(!leftPanelOpen)}
        checkedItems={checkedItems}
        onItemToggle={handleItemToggle}
        categories={categories}
        pinnedItems={pinnedItems}
        customCategories={customCategoryItems}
        onNewCategory={() => setShowNewCategoryModal(true)}
        onDriveImport={() => setShowDriveModal(true)}
        onRenameTag={handleRenameTag}
        onRenameCustom={handleRenameCustomAlbum}
        onDeleteCustom={handleDeleteCustomAlbum}
      />

      <main className="workspace" ref={workspaceRef}>
        {loadError && (
          <div className="workspace-error">
            {loadError}
          </div>
        )}
        {/* Canvas Mode: Stacks */}
        {viewMode === 'canvas' && (
          <AnimatePresence>
            {stacks.map(stack => (
              <PhotoStack
                key={stack.id}
                stack={stack}
                onPositionChange={handlePositionChange}
                onDragEnd={handleDragEnd}
                onDelete={handleDeleteStack}
                onClick={handleStackClick}
                isMagnetic={magneticStackIds.includes(stack.id)}
                isGlowing={glowingStackIds.includes(stack.id)}
                isHidden={expandedStackIds.has(stack.id)}
              />
            ))}
            {intersectionStacks.map(stack => (
              <PhotoStack
                key={`intersection-${stack.id}`}
                stack={stack}
                onPositionChange={handleIntersectionPositionChange}
                onDragEnd={(id, x, y) => handleIntersectionPositionChange(id, x, y)}
                onDelete={handleDeleteIntersection}
                onClick={handleStackClick}
                isIntersection={true}
                isHidden={expandedStackIds.has(stack.id)}
              />
            ))}
            {previewIntersection && (
              <PhotoStack
                key="preview"
                stack={previewIntersection}
                isPreview={true}
              />
            )}
          </AnimatePresence>
        )}

        {/* View Mode Toggle + Arrange Button */}
        <div className="workspace-toolbar" ref={toolbarRef}>
          <div className="view-mode-toggle">
            <button
              className={`view-mode-btn ${viewMode === 'grid' ? 'view-mode-btn--active' : ''}`}
              onClick={() => handleViewModeChange('grid')}
            >
              <LayoutGrid size={16} />
              그리드
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'canvas' ? 'view-mode-btn--active' : ''}`}
              onClick={() => handleViewModeChange('canvas')}
            >
              <Layers size={16} />
              캔버스
            </button>
          </div>
          <div className="item-count-block">
            <div className="item-count">
              {filteredPhotos.length}개의 항목
            </div>
            <button
              className="item-count-toggle"
              onClick={() => setShowDetectionBoxes((prev) => !prev)}
              type="button"
            >
              {showDetectionBoxes ? "박스 숨기기" : "박스 보기"}
            </button>
          </div>

          {viewMode === 'canvas' && (
            <motion.button
              className="arrange-button"
              onClick={handleArrangeStacks}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="arrange-icon">⊞</span>
              정렬
            </motion.button>
          )}
        </div>

        {/* Grid Mode: Photo Gallery */}
        {viewMode === 'grid' && (
          <PhotoGrid photos={filteredPhotos} onPhotoClick={setViewerPhoto} />
        )}

        {/* Canvas Mode: Empty State */}
        {viewMode === 'canvas' && isEmpty && (
          <div className="workspace-empty">
            <span className="workspace-empty-icon">📂</span>
            <p>왼쪽 패널에서 카테고리를 선택하세요</p>
            <p className="workspace-empty-hint">
              두 카테고리를 가까이 드래그하면<br />교집합을 만들 수 있어요
            </p>
          </div>
        )}

        {/* Expanded Folder Popovers */}
        <AnimatePresence>
          {expandedStacks.map(stack => (
            <ExpandedFolder
              key={`expanded-${stack.id}`}
              stack={stack}
              onClose={() => handleCloseExpanded(stack.id)}
              onPhotoClick={setViewerPhoto}
              onMove={handleExpandedMove}
            />
          ))}
        </AnimatePresence>
      </main>

      <ChatPanel
        isOpen={rightPanelOpen}
        onToggle={() => setRightPanelOpen(!rightPanelOpen)}
        onPrompt={handleCreatePromptAlbum}
        onPhotoClick={setViewerPhoto}
      />

      {/* Photo Viewer Lightbox */}
      <AnimatePresence>
        {viewerPhoto && (
          <PhotoViewer
            photo={viewerPhoto}
            photos={filteredPhotos}
            onClose={() => setViewerPhoto(null)}
            onNavigate={setViewerPhoto}
            showDetectionsDefault={showDetectionBoxes}
            onToggleDetections={setShowDetectionBoxes}
            driveAccessToken={driveAccessToken}
            authToken={authToken}
          />
        )}
      </AnimatePresence>

      {/* Onboarding Overlay */}
      <AnimatePresence>
        {showOnboarding && analysisStarted && driveImported && !showDriveModal && (
          <OnboardingOverlay
            onComplete={() => setShowOnboarding(false)}
            people={peopleTags.map((person) => ({
              tagName: person.name,
              displayName: person.name,
              photo: person.photo,
            }))}
            interests={tagItems.slice(0, 12).map((tag) => ({
              id: tag.name,
              label: tag.label,
              icon: tag.type === "person" ? "👤" : tag.type === "location" ? "📍" : "🏷️",
              count: tag.count || 0,
            }))}
            onRenamePerson={handleRenameTag}
            onUpdatePinned={handleUpdatePinned}
            onDriveStart={() => setShowDriveModal(true)}
            onStartAnalysis={startAiCategorize}
            driveImported={driveImported}
            driveImportSummary={driveImportSummary}
            drivePreviewPhotos={allPhotos}
            resolvePhotoUrl={resolvePhotoUrl}
            aiStatus={aiStatus}
            aiError={aiError}
            skipDriveStep={true}
          />
        )}
      </AnimatePresence>

      {/* Drive Import Modal */}
      <AnimatePresence>
        {showDriveModal && (
          <DriveImportModal
            isOpen={showDriveModal}
            onClose={() => setShowDriveModal(false)}
            onProceed={handleDriveProceed}
            accessToken={driveAccessToken}
            folders={driveFolders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onRequestToken={handleRequestDriveToken}
            onRefreshFolders={handleLoadDriveFolders}
            onImport={handleImportDrive}
            isBusy={isLoading}
            error={loadError}
            importSummary={driveImportSummary}
            importPreview={driveImportPreview}
            includeSubfolders={includeSubfolders}
            onToggleIncludeSubfolders={setIncludeSubfolders}
            driveImported={driveImported}
            importTotal={driveImportTotal}
          />
        )}
      </AnimatePresence>

      {/* New Category Modal */}
      <AnimatePresence>
        {showNewCategoryModal && (
          <NewCategoryModal
            isOpen={showNewCategoryModal}
            onClose={() => setShowNewCategoryModal(false)}
            onCreate={handleCreatePromptAlbum}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
