import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, User, MapPin, Sparkles, Search, Plus, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, Eye, EyeOff, Send, MessageSquare, LayoutGrid, Layers } from "lucide-react";

// Sample photos data - organized by person and category
const SAMPLE_PHOTOS = {
  // 객체
  goat: ["/inputs/goat-1.png", "/inputs/goat-2.jpg", "/inputs/goat-3.jpg", "/inputs/goat-4.jpg", "/inputs/goat-5.png", "/inputs/goat-6.jpg", "/inputs/goat-7.jpg", "/inputs/goat-8.jpg", "/inputs/goat-9.jpg", "/inputs/goat-10.jpg", "/inputs/goat-11.png", "/inputs/goat-12.jpg"],
  car: ["/inputs/Wonyoung-3.jpg", "/inputs/V-3.jpg"], // 더미 데이터
  flower: ["/inputs/Mina-3.jpg", "/inputs/chuu-3.png"], // 더미 데이터
  food: ["/inputs/Jin-3.jpg", "/inputs/Woobin-3.jpg"], // 더미 데이터
  coffee: ["/inputs/onew-3.png", "/inputs/seolyoon-3.jpg"], // 더미 데이터
  // 인물
  wonyoung: ["/inputs/Wonyoung-1.jpg", "/inputs/Wonyoung-2.jpg", "/inputs/Wonyoung-3.jpg", "/inputs/Wonyoung-4.png", "/inputs/Wonyoung-6.jpg", "/inputs/Wonyoung-7.jpg", "/inputs/Wonyoung-8.png", "/inputs/Wonyoung-9.png", "/inputs/Wonyoung-10.jpg"],
  v: ["/inputs/V-1.jpeg", "/inputs/V-2.jpg", "/inputs/V-3.jpg", "/inputs/V-4.jpg", "/inputs/V-5.jpg", "/inputs/V-6.jpg", "/inputs/V-7.jpg", "/inputs/V-8.jpg", "/inputs/V-9.jpg", "/inputs/V-10.png"],
  mina: ["/inputs/Mina-1.jpg", "/inputs/Mina-2.jpeg", "/inputs/Mina-3.jpg", "/inputs/Mina-4.jpg", "/inputs/Mina-5.png", "/inputs/Mina-6.jpeg", "/inputs/Mina-7.jpg"],
  chuu: ["/inputs/chuu-1.png", "/inputs/chuu-2.png", "/inputs/chuu-3.png", "/inputs/chuu-4.png", "/inputs/chuu-5.png", "/inputs/chuu-6.png", "/inputs/chuu-7.jpg", "/inputs/chuu-8.png", "/inputs/chuu-9.jpg", "/inputs/chuu-10.jpg"],
  jin: ["/inputs/Jin-1.png", "/inputs/Jin-2.jpeg", "/inputs/Jin-3.jpg", "/inputs/Jin-4.jpg", "/inputs/Jin-5.jpg", "/inputs/Jin-6.jpg", "/inputs/Jin-7.jpeg", "/inputs/Jin-8.jpg", "/inputs/Jin-9.jpeg"],
  woobin: ["/inputs/Woobin-1.jpeg", "/inputs/Woobin-2.jpg", "/inputs/Woobin-3.jpg", "/inputs/Woobin-4.jpg", "/inputs/Woobin-6.jpg", "/inputs/Woobin-7.jpg", "/inputs/Woobin-8.jpeg", "/inputs/Woobin-9.jpg", "/inputs/Woobin-10.png"],
  onew: ["/inputs/onew-1.png", "/inputs/onew-2.png", "/inputs/onew-3.png", "/inputs/onew-4.png", "/inputs/onew-5.png", "/inputs/onew-6.png", "/inputs/onew-7.png", "/inputs/onew-8.png", "/inputs/onew-9.png", "/inputs/onew-10.png"],
  seolyoon: ["/inputs/seolyoon-1.jpg", "/inputs/seolyoon-2.jpg", "/inputs/seolyoon-3.jpg", "/inputs/seolyoon-4.png", "/inputs/seolyoon-5.png", "/inputs/seolyoon-6.jpg", "/inputs/seolyoon-7.jpg", "/inputs/seolyoon-8.jpg"],
  chovy: ["/inputs/chovy-1.jpg", "/inputs/chovy-2.jpg", "/inputs/chovy-3.jpg", "/inputs/chovy-4.jpg", "/inputs/chovy-5.jpg", "/inputs/chovy-6.jpg", "/inputs/chovy-7.png", "/inputs/chovy-8.jpg", "/inputs/chovy-9.jpg", "/inputs/chovy-10.jpg"],
};

// Category structure with Lucide icons
const CATEGORIES = {
  객체: {
    icon: Box,
    items: [
      { id: "goat", label: "염소" },
      { id: "car", label: "자동차" },
      { id: "flower", label: "꽃" },
      { id: "food", label: "음식" },
      { id: "coffee", label: "커피" },
    ]
  },
  인물: {
    icon: User,
    items: [
      { id: "wonyoung", label: "장원영" },
      { id: "v", label: "뷔" },
      { id: "mina", label: "미나" },
      { id: "chuu", label: "츄" },
      { id: "jin", label: "진" },
      { id: "woobin", label: "김우빈" },
      { id: "onew", label: "온유" },
      { id: "seolyoon", label: "설윤" },
      { id: "chovy", label: "쵸비" },
    ]
  },
};

// Dummy data for onboarding (VIP faces)
const DUMMY_FACES = [
  { id: 1, name: "", photo: "/inputs/Wonyoung-1.jpg" },
  { id: 2, name: "", photo: "/inputs/V-1.jpeg" },
  { id: 3, name: "", photo: "/inputs/Mina-1.jpg" },
  { id: 4, name: "", photo: "/inputs/chuu-1.png" },
  { id: 5, name: "", photo: "/inputs/Jin-1.png" },
];

const INTEREST_CATEGORIES = [
  { id: "wonyoung", label: "장원영", icon: "👩", count: 10 },
  { id: "v", label: "뷔", icon: "🧑", count: 10 },
  { id: "mina", label: "미나", icon: "👩", count: 7 },
  { id: "chuu", label: "츄", icon: "👩", count: 10 },
  { id: "jin", label: "진", icon: "🧑", count: 9 },
  { id: "woobin", label: "김우빈", icon: "🧑", count: 10 },
  { id: "onew", label: "온유", icon: "🧑", count: 10 },
  { id: "seolyoon", label: "설윤", icon: "👩", count: 8 },
  { id: "chovy", label: "쵸비", icon: "🧑", count: 10 },
  { id: "goat", label: "염소", icon: "🐐", count: 12 },
];

// Onboarding Overlay Component
const OnboardingOverlay = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [analysisMessage, setAnalysisMessage] = useState("사진을 분석하는 중...");
  const [faces, setFaces] = useState(DUMMY_FACES);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [isExiting, setIsExiting] = useState(false);

  // Step 1: Analysis messages rotation
  useEffect(() => {
    if (step !== 1) return;

    const messages = [
      "사진 12,403장을 분석 중입니다...",
      "인물을 식별하는 중입니다...",
      "객체를 분류하는 중입니다...",
      "카테고리를 정리하는 중입니다..."
    ];

    let index = 0;
    const messageInterval = setInterval(() => {
      index = (index + 1) % messages.length;
      setAnalysisMessage(messages[index]);
    }, 800);

    const timer = setTimeout(() => {
      clearInterval(messageInterval);
      setStep(2);
    }, 3000);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(timer);
    };
  }, [step]);

  const handleFaceNameChange = (id, name) => {
    setFaces(prev => prev.map(f => f.id === id ? { ...f, name } : f));
  };

  const handleFaceHide = (id) => {
    setFaces(prev => prev.filter(f => f.id !== id));
  };

  const handleInterestToggle = (id) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleComplete = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete?.();
    }, 600);
  };

  return (
    <motion.div
      className={`onboarding-overlay ${isExiting ? 'onboarding-overlay--exiting' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Blur Backdrop */}
      <div className="onboarding-backdrop" />

      {/* Glass Panel */}
      <motion.div
        className="onboarding-panel"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: isExiting ? 1.1 : 1, opacity: isExiting ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Step 1: AI Analysis */}
        {step === 1 && (
          <div className="onboarding-step onboarding-analysis">
            <motion.div
              className="breathing-logo"
              animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              Photo-X
            </motion.div>
            <p className="analysis-message">{analysisMessage}</p>
            <div className="analysis-dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        {/* Step 2: VIP People */}
        {step === 2 && (
          <div className="onboarding-step onboarding-people">
            <h2>이 사람들은 누구인가요?</h2>
            <p className="onboarding-subtitle">앨범에 자주 등장하는 인물들입니다</p>

            <div className="people-grid">
              {faces.map(face => (
                <motion.div
                  key={face.id}
                  className="face-card"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: face.id * 0.1 }}
                >
                  <div
                    className="face-photo"
                    style={{ backgroundImage: `url(${face.photo})` }}
                  />
                  <input
                    type="text"
                    placeholder="이름 입력..."
                    value={face.name}
                    onChange={(e) => handleFaceNameChange(face.id, e.target.value)}
                    className="face-input"
                  />
                  <button
                    className="face-hide"
                    onClick={() => handleFaceHide(face.id)}
                  >
                    숨기기
                  </button>
                </motion.div>
              ))}
            </div>

            <button className="onboarding-next" onClick={() => setStep(3)}>
              다음
            </button>
          </div>
        )}

        {/* Step 3: Interest Categories */}
        {step === 3 && (
          <div className="onboarding-step onboarding-interests">
            <h2>관심 카테고리를 선택하세요</h2>
            <p className="onboarding-subtitle">선택한 카테고리가 사이드바에 고정됩니다</p>

            <div className="bubble-cloud">
              {INTEREST_CATEGORIES.map(cat => (
                <motion.button
                  key={cat.id}
                  className={`bubble ${selectedInterests.includes(cat.id) ? 'bubble--active' : ''}`}
                  style={{
                    fontSize: cat.count > 100 ? '16px' : cat.count > 50 ? '14px' : '13px',
                    padding: cat.count > 100 ? '12px 20px' : '10px 16px'
                  }}
                  onClick={() => handleInterestToggle(cat.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="bubble-icon">{cat.icon}</span>
                  {cat.label}
                </motion.button>
              ))}
            </div>

            <button className="onboarding-next" onClick={() => setStep(4)}>
              완료
            </button>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 4 && (
          <motion.div
            className="onboarding-step onboarding-complete"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            <motion.div
              className="complete-icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              ✨
            </motion.div>
            <h2>설정 완료!</h2>
            <p>Photo-X가 준비되었습니다</p>
            <motion.button
              className="onboarding-start"
              onClick={handleComplete}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              시작하기
            </motion.button>
          </motion.div>
        )}

        {/* Step Indicator */}
        {step > 1 && step < 4 && (
          <div className="onboarding-steps">
            {[2, 3].map(s => (
              <div
                key={s}
                className={`step-dot ${step >= s ? 'step-dot--active' : ''}`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Get intersection of photo arrays
const getIntersection = (photos1, photos2) => {
  return photos1.filter(p => photos2.includes(p));
};

// Get grid class based on photo count
const getGridClass = (count) => {
  if (count <= 1) return 'grid-1';
  if (count === 2) return 'grid-2';
  if (count === 3) return 'grid-3';
  return 'grid-4';
};

// Photo Viewer Lightbox Component
const PhotoViewer = ({ photo, photos, onClose, onNavigate }) => {
  const currentIndex = photos.indexOf(photo);

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
      <motion.img
        src={photo}
        alt=""
        className="photo-viewer-image"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      />

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

      {/* Close Button */}
      <button className="photo-viewer-close" onClick={onClose}>✕</button>
    </motion.div>
  );
};

// Expanded Folder View - Photos spread from stack and reassemble on close
const ExpandedFolder = ({ stack, onClose, onPhotoClick }) => {
  const photos = stack?.photos || [];
  const [isClosing, setIsClosing] = useState(false);
  const stackSize = 120;
  const cellSize = 84;
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

  const baseX = (stack?.x || 0) - (containerWidth - stackSize) / 2;
  const baseY = (stack?.y || 0) - (containerHeight - stackSize) / 2;
  const stackOffsetX = (containerWidth - stackSize) / 2;
  const stackOffsetY = (containerHeight - stackSize) / 2;
  const startScale = stackSize / cellSize;
  const stackOrder = photos.slice(0, 4).reverse();

  return (
    <motion.div
      className="folder-expanded"
      style={{
        position: 'absolute',
        left: baseX,
        top: baseY,
        width: containerWidth,
        height: containerHeight,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Minimal header */}
      <div className="folder-expanded-header">
        <span className="folder-expanded-label">{stack?.label}</span>
        <span className="folder-expanded-count">{photos.length}장</span>
        <button className="folder-expanded-close" onClick={handleClose}>✕</button>
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
          const seed1 = ((stack?.id || 0) * 137 + index * 47) % 100;
          const seed2 = ((stack?.id || 0) * 89 + index * 31) % 100;
          const seed3 = ((stack?.id || 0) * 61 + index * 23) % 100;
          const initRotation = index === 0 ? 0 : (seed1 % 17) - 8;
          const initOffsetX = index === 0 ? 0 : (seed2 % 13) - 6;
          const initOffsetY = index === 0 ? 0 : (seed3 % 13) - 6;
          const startX = stackOffsetX + (stackSize - cellSize) / 2 + initOffsetX;
          const startY = stackOffsetY + (stackSize - cellSize) / 2 + initOffsetY;

          return (
            <motion.div
              key={index}
              className="folder-expanded-photo"
              style={{
                backgroundImage: `url(${photo})`,
                width: cellSize,
                height: cellSize,
                zIndex: (() => {
                  const stackRank = stackOrder.indexOf(photo);
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
              key={`${photo}-${index}`}
              className="photo-grid-item"
              style={{ backgroundImage: `url(${photo})` }}
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
    return photos.slice(0, 4).map((_, index) => {
      if (index === 0) return { rotation: 0, offsetX: 0, offsetY: 0 }; // Top photo centered
      // Generate pseudo-random values based on stack id and index
      const seed1 = (stack.id * 137 + index * 47) % 100;
      const seed2 = (stack.id * 89 + index * 31) % 100;
      const seed3 = (stack.id * 61 + index * 23) % 100;
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
              key={`${photo}-${index}`}
              className={`stack-polaroid-photo ${isTop ? 'stack-polaroid-photo--top' : ''}`}
              style={{
                backgroundImage: `url(${photo})`,
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
const CategoryPanel = ({ isOpen, onToggle, checkedItems, onItemToggle }) => {
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
            <input type="text" placeholder="검색..." />
          </div>

          {/* Category List - Clean, no boxes */}
          <div className="category-scroll">
            {Object.entries(CATEGORIES).map(([groupName, group]) => {
              const IconComponent = group.icon;
              return (
                <div key={groupName} className="category-group">
                  <h3 className="category-title">
                    <IconComponent size={14} className="category-title-icon" />
                    {groupName}
                  </h3>
                  <ul className="category-list">
                    {group.items.map((item) => {
                      const isChecked = checkedItems.includes(item.id);
                      return (
                        <li
                          key={item.id}
                          className={`category-item ${isChecked ? 'category-item--selected' : ''}`}
                          onClick={() => onItemToggle(item.id, item.label)}
                        >
                          <span className="category-item-label">{item.label}</span>
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
          </div>

          {/* Add Button - Ghost style */}
          <button className="add-category-btn">
            <Plus size={14} />
            <span>새 카테고리</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Chat Panel Component - Professional Redesign
const ChatPanel = ({ isOpen, onToggle }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", text: input }]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "해당 설명에 맞는 사진을 찾고 있습니다..."
      }]);
    }, 1000);
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
            <button onClick={handleSend} className="chat-send-btn">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
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
  const stackIdRef = useRef(0);

  // Calculate filtered photos for Grid mode (with deduplication)
  const filteredPhotos = useMemo(() => {
    let photos;
    if (checkedItems.length === 0) {
      // Show all photos if nothing selected
      photos = Object.values(SAMPLE_PHOTOS).flat();
    } else {
      // Show only photos from selected categories
      photos = checkedItems.flatMap(itemId => SAMPLE_PHOTOS[itemId] || []);
    }
    // Remove duplicates using Set
    return [...new Set(photos)];
  }, [checkedItems]);

  // Handle item toggle differently based on view mode
  const handleItemToggle = useCallback((itemId, label) => {
    if (viewMode === 'grid') {
      // Grid mode: just toggle filter
      setCheckedItems(prev =>
        prev.includes(itemId)
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId]
      );
    } else {
      // Canvas mode: spawn/remove stacks
      setCheckedItems(prev => {
        if (prev.includes(itemId)) {
          setStacks(s => s.filter(stack => stack.categoryId !== itemId));
          return prev.filter(id => id !== itemId);
        } else {
          const existingCount = prev.length;
          const newStack = {
            id: ++stackIdRef.current,
            categoryId: itemId,
            label: label,
            photos: SAMPLE_PHOTOS[itemId] || [],
            x: 80 + (existingCount % 4) * 165,
            y: 80 + Math.floor(existingCount / 4) * 180,
          };
          setStacks(s => [...s, newStack]);
          return [...prev, itemId];
        }
      });
    }
  }, [viewMode]);

  // Handle view mode change - sync stacks with checked items
  const handleViewModeChange = useCallback((newMode) => {
    if (newMode === viewMode) return;

    if (newMode === 'canvas' && checkedItems.length > 0) {
      // Create stacks for checked items when switching to canvas
      const newStacks = checkedItems.map((itemId, index) => {
        const categoryItem = Object.values(CATEGORIES)
          .flatMap(g => g.items)
          .find(item => item.id === itemId);
        return {
          id: ++stackIdRef.current,
          categoryId: itemId,
          label: categoryItem?.label || itemId,
          photos: SAMPLE_PHOTOS[itemId] || [],
          x: 80 + (index % 4) * 165,
          y: 80 + Math.floor(index / 4) * 180,
        };
      });
      setStacks(newStacks);
    }

    setViewMode(newMode);
  }, [viewMode, checkedItems]);

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
            label: `${draggedStack.label} ∩ ${closestStack.label}`,
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
      />

      <main className="workspace">
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
        <div className="workspace-toolbar">
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
            />
          ))}
        </AnimatePresence>
      </main>

      <ChatPanel
        isOpen={rightPanelOpen}
        onToggle={() => setRightPanelOpen(!rightPanelOpen)}
      />

      {/* Photo Viewer Lightbox */}
      <AnimatePresence>
        {viewerPhoto && (
          <PhotoViewer
            photo={viewerPhoto}
            photos={filteredPhotos}
            onClose={() => setViewerPhoto(null)}
            onNavigate={setViewerPhoto}
          />
        )}
      </AnimatePresence>

      {/* Onboarding Overlay */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingOverlay onComplete={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
