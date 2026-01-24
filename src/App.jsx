import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, User, MapPin, Sparkles, Search, Plus, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, Eye, EyeOff, Send, MessageSquare } from "lucide-react";

// Sample photos data
const SAMPLE_PHOTOS = {
  dog: ["/inputs/KakaoTalk_20260123_134329349.jpg", "/inputs/KakaoTalk_20260123_134351085.jpg"],
  cat: ["/inputs/KakaoTalk_20260123_134431651.jpg", "/inputs/KakaoTalk_20260123_134500794.jpg"],
  car: ["/inputs/KakaoTalk_20260123_134517943.jpg"],
  cake: ["/inputs/KakaoTalk_20260123_134607527.jpg"],
  friendA: ["/inputs/KakaoTalk_20260123_134329349.jpg", "/inputs/KakaoTalk_20260123_134431651.jpg", "/inputs/KakaoTalk_20260123_134517943.jpg"],
  friendB: ["/inputs/KakaoTalk_20260123_134351085.jpg", "/inputs/KakaoTalk_20260123_134500794.jpg"],
  friendC: ["/inputs/KakaoTalk_20260123_134607527.jpg", "/inputs/KakaoTalk_20260123_134626212.jpg"],
  tokyo: ["/inputs/KakaoTalk_20260123_134329349.jpg", "/inputs/KakaoTalk_20260123_134351085.jpg", "/inputs/KakaoTalk_20260123_134431651.jpg", "/inputs/KakaoTalk_20260123_134500794.jpg"],
  barcode: ["/inputs/KakaoTalk_20260123_134517943.jpg"],
  flower: ["/inputs/KakaoTalk_20260123_134607527.jpg", "/inputs/KakaoTalk_20260123_134626212.jpg"],
  moon: ["/inputs/KakaoTalk_20260123_134659646.jpg"],
};

// Category structure with Lucide icons
const CATEGORIES = {
  객체: {
    icon: Box,
    items: [
      { id: "dog", label: "개" },
      { id: "cat", label: "고양이" },
      { id: "car", label: "자동차" },
      { id: "cake", label: "케이크" },
    ]
  },
  인물: {
    icon: User,
    items: [
      { id: "friendA", label: "친구 A" },
      { id: "friendB", label: "친구 B" },
      { id: "friendC", label: "친구 C" },
    ]
  },
  장소: {
    icon: MapPin,
    items: [
      { id: "tokyo", label: "도쿄" },
    ]
  },
  "사용자 지정": {
    icon: Sparkles,
    items: [
      { id: "barcode", label: "바코드" },
      { id: "flower", label: "꽃" },
      { id: "moon", label: "달" },
    ]
  },
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

// Expanded Folder View - Popover only (backdrop handled by parent)
const ExpandedFolder = ({ stack, onClose }) => {
  const photos = stack?.photos || [];

  return (
    <motion.div
      className="folder-popover"
      style={{
        position: 'absolute',
        left: stack?.x || 0,
        top: stack?.y || 0,
      }}
      initial={{ scale: 0.9, opacity: 0, y: -10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: -10 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Compact Header with hierarchy */}
      <div className="folder-popover-header">
        <div className="folder-popover-title">
          <span className="folder-popover-name">{stack?.label}</span>
          <span className="folder-popover-count">{photos.length}장</span>
        </div>
        <button className="folder-popover-close" onClick={onClose}>✕</button>
      </div>

      {/* Photo Grid */}
      <div className="folder-masonry">
        {photos.map((photo, index) => (
          <motion.div
            key={index}
            className="folder-masonry-item"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              delay: index * 0.03
            }}
            style={{ backgroundImage: `url(${photo})` }}
          />
        ))}
      </div>
    </motion.div>
  );
};

// Photo Stack Component with Dynamic Grid
const PhotoStack = ({
  stack,
  onPositionChange,
  onDragEnd,
  onDelete,
  onClick,
  isPreview,
  isIntersection,
  isMagnetic,
  isGlowing
}) => {
  const photos = stack.photos || [];
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, stackX: 0, stackY: 0, hasMoved: false });

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

  const gridClass = getGridClass(photos.length);

  return (
    <motion.div
      className={classNames}
      style={{
        position: 'absolute',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
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
        opacity: isPreview ? 0.7 : 1,
        zIndex: isDragging ? 100 : 1,
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

      {/* Stack Container with Dynamic Grid */}
      <div className={`stack-container ${gridClass}`}>
        {photos.length === 1 && (
          <div
            className="stack-photo stack-photo-full"
            style={{ backgroundImage: `url(${photos[0]})` }}
          />
        )}
        {photos.length === 2 && (
          <>
            <div className="stack-photo stack-photo-half" style={{ backgroundImage: `url(${photos[0]})` }} />
            <div className="stack-photo stack-photo-half" style={{ backgroundImage: `url(${photos[1]})` }} />
          </>
        )}
        {photos.length === 3 && (
          <>
            <div className="stack-photo stack-photo-main" style={{ backgroundImage: `url(${photos[0]})` }} />
            <div className="stack-photo stack-photo-sub" style={{ backgroundImage: `url(${photos[1]})` }} />
            <div className="stack-photo stack-photo-sub" style={{ backgroundImage: `url(${photos[2]})` }} />
          </>
        )}
        {photos.length >= 4 && (
          <>
            <div className="stack-photo stack-photo-quad" style={{ backgroundImage: `url(${photos[0]})` }} />
            <div className="stack-photo stack-photo-quad" style={{ backgroundImage: `url(${photos[1]})` }} />
            <div className="stack-photo stack-photo-quad" style={{ backgroundImage: `url(${photos[2]})` }} />
            <div className="stack-photo stack-photo-quad" style={{ backgroundImage: `url(${photos[3]})` }} />
          </>
        )}

        {/* Photo Count Badge - Softer color */}
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
  const stackIdRef = useRef(0);

  const handleItemToggle = useCallback((itemId, label) => {
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
          x: 60 + (existingCount % 3) * 180,
          y: 60 + Math.floor(existingCount / 3) * 220,
        };
        setStacks(s => [...s, newStack]);
        return [...prev, itemId];
      }
    });
  }, []);

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

  const handleCloseAllExpanded = useCallback(() => {
    setExpandedStacks([]);
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
    const GRID_START_X = 40;
    const GRID_START_Y = 40;
    const GRID_GAP_X = 160;
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

  return (
    <div className="app-layout">
      <CategoryPanel
        isOpen={leftPanelOpen}
        onToggle={() => setLeftPanelOpen(!leftPanelOpen)}
        checkedItems={checkedItems}
        onItemToggle={handleItemToggle}
      />

      <main className="workspace">
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

        {/* Arrange Button */}
        <motion.button
          className="arrange-button"
          onClick={handleArrangeStacks}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <span className="arrange-icon">⊞</span>
          정렬
        </motion.button>

        {isEmpty && (
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
          {expandedStacks.length > 0 && (
            <motion.div
              className="folder-backdrop-blur"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseAllExpanded}
            />
          )}
          {expandedStacks.map(stack => (
            <ExpandedFolder
              key={`expanded-${stack.id}`}
              stack={stack}
              onClose={() => handleCloseExpanded(stack.id)}
            />
          ))}
        </AnimatePresence>
      </main>

      <ChatPanel
        isOpen={rightPanelOpen}
        onToggle={() => setRightPanelOpen(!rightPanelOpen)}
      />
    </div>
  );
}
