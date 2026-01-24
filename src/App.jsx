import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

// Category structure
const CATEGORIES = {
  객체: [
    { id: "dog", label: "개" },
    { id: "cat", label: "고양이" },
    { id: "car", label: "자동차" },
    { id: "cake", label: "케이크" },
  ],
  인물: [
    { id: "friendA", label: "친구 A" },
    { id: "friendB", label: "친구 B" },
    { id: "friendC", label: "친구 C" },
  ],
  장소: [
    { id: "tokyo", label: "도쿄" },
  ],
  "사용자 지정": [
    { id: "barcode", label: "바코드" },
    { id: "flower", label: "꽃" },
    { id: "moon", label: "달" },
  ],
};

// Get intersection of photo arrays
const getIntersection = (photos1, photos2) => {
  return photos1.filter(p => photos2.includes(p));
};

// Photo Stack Component
const PhotoStack = ({ stack, onDrag, onDragEnd, onDelete, workspaceRef, isPreview, isIntersection }) => {
  const photos = stack.photos || [];

  return (
    <motion.div
      className={`photo-stack ${isPreview ? 'intersection-preview' : ''} ${isIntersection ? 'photo-stack--intersection' : ''}`}
      style={{ x: stack.x, y: stack.y }}
      drag={!isPreview}
      dragMomentum={false}
      dragConstraints={workspaceRef}
      onDrag={(e, info) => onDrag?.(stack.id, info.point.x, info.point.y)}
      onDragEnd={() => onDragEnd?.(stack.id)}
      whileDrag={{ scale: 1.05, zIndex: 100 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: isPreview ? 0.6 : 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Label at top-left */}
      <span className="stack-label">{stack.label}</span>

      {/* Delete button - appears on hover */}
      {!isPreview && onDelete && (
        <button
          className="stack-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(stack.id, stack.categoryId);
          }}
        >
          ✕
        </button>
      )}

      {/* Spread out photo effect */}
      <div className="stack-photos">
        {[0, 1, 2].map((offset) => (
          <div
            key={offset}
            className="stack-photo"
            style={{
              backgroundImage: photos[offset] ? `url(${photos[offset]})` : undefined,
            }}
          >
            {!photos[offset] && <span>SAMPLE<br />PHOTO</span>}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Category Panel Component
const CategoryPanel = ({ isOpen, onToggle, checkedItems, onItemToggle }) => {
  return (
    <div className={`category-panel ${isOpen ? "category-panel--open" : ""}`}>
      <button className="panel-toggle" onClick={onToggle}>
        {isOpen ? "‹" : "›"}
      </button>

      {isOpen && (
        <div className="panel-content">
          <h2 className="panel-header">카테고리</h2>
          <div className="panel-search">
            <input type="text" placeholder="분류 기준 검색..." />
          </div>

          {Object.entries(CATEGORIES).map(([groupName, items]) => (
            <div key={groupName} className="category-group">
              <h3 className="category-title">{groupName}</h3>
              <ul className="category-list">
                {items.map((item) => (
                  <li key={item.id} className="category-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={checkedItems.includes(item.id)}
                        onChange={() => onItemToggle(item.id, item.label)}
                      />
                      <span>{item.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <button className="add-category-btn">+ 새 카테고리</button>
        </div>
      )}
    </div>
  );
};

// Chat Panel Component
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
      <button className="panel-toggle" onClick={onToggle}>
        {isOpen ? "›" : "‹"}
      </button>

      {isOpen && (
        <div className="panel-content chat-content">
          <h2 className="panel-header" style={{ padding: '0 24px', marginTop: '24px' }}>AI 검색</h2>
          <div className="chat-messages">
            {messages.length === 0 && (
              <p className="chat-empty">AI에게 찾고 싶은 사진을 설명해보세요</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message chat-message--${msg.role}`}>
                {msg.text}
              </div>
            ))}
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="찾고 싶은 사진을 설명하여 요청하세요."
            />
            <button onClick={handleSend}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component
export default function App({ onBack }) {
  const workspaceRef = useRef(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [checkedItems, setCheckedItems] = useState([]);
  const [stacks, setStacks] = useState([]);
  const [intersectionStacks, setIntersectionStacks] = useState([]);
  const [previewIntersection, setPreviewIntersection] = useState(null);
  const stackIdRef = useRef(0);

  // Handle category check/uncheck
  const handleItemToggle = useCallback((itemId, label) => {
    setCheckedItems(prev => {
      if (prev.includes(itemId)) {
        setStacks(s => s.filter(stack => stack.categoryId !== itemId));
        return prev.filter(id => id !== itemId);
      } else {
        const newStack = {
          id: ++stackIdRef.current,
          categoryId: itemId,
          label: label,
          photos: SAMPLE_PHOTOS[itemId] || [],
          x: 100 + Math.random() * 200,
          y: 100 + Math.random() * 200,
        };
        setStacks(s => [...s, newStack]);
        return [...prev, itemId];
      }
    });
  }, []);

  // Delete stack
  const handleDeleteStack = useCallback((stackId, categoryId) => {
    setStacks(prev => prev.filter(s => s.id !== stackId));
    if (categoryId) {
      setCheckedItems(prev => prev.filter(id => id !== categoryId));
    }
  }, []);

  // Delete intersection stack
  const handleDeleteIntersection = useCallback((stackId) => {
    setIntersectionStacks(prev => prev.filter(s => s.id !== stackId));
  }, []);

  // Handle stack drag - check for proximity and show preview
  const handleStackDrag = useCallback((stackId, x, y) => {
    setStacks(prev => {
      const updated = prev.map(s =>
        s.id === stackId ? { ...s, x: x - 350, y: y - 100 } : s
      );

      const dragged = updated.find(s => s.id === stackId);
      if (!dragged) return updated;

      // Check for nearby stacks
      let closestStack = null;
      let minDistance = Infinity;

      updated.forEach(other => {
        if (other.id === stackId) return;
        const dx = (dragged.x || 0) - (other.x || 0);
        const dy = (dragged.y || 0) - (other.y || 0);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 200 && distance < minDistance) {
          minDistance = distance;
          closestStack = other;
        }
      });

      // Show or hide preview
      if (closestStack) {
        const intersectionId = `${dragged.categoryId}-${closestStack.categoryId}`;
        const reverseId = `${closestStack.categoryId}-${dragged.categoryId}`;

        // Don't show preview if intersection already exists
        const exists = intersectionStacks.some(i =>
          i.id === intersectionId || i.id === reverseId
        );

        if (!exists) {
          const commonPhotos = getIntersection(dragged.photos, closestStack.photos);
          if (commonPhotos.length > 0) {
            setPreviewIntersection({
              id: intersectionId,
              label: `${dragged.label} ∩ ${closestStack.label}`,
              photos: commonPhotos,
              x: ((dragged.x || 0) + (closestStack.x || 0)) / 2,
              y: Math.min(dragged.y || 0, closestStack.y || 0) - 220,
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
        setPreviewIntersection(null);
      }

      return updated;
    });
  }, [intersectionStacks]);

  // Create intersection when drag ends if preview exists
  const handleStackDragEnd = useCallback((stackId) => {
    if (previewIntersection && previewIntersection.sourceId === stackId) {
      setIntersectionStacks(prev => [...prev, {
        ...previewIntersection,
        id: previewIntersection.id,
      }]);
    }
    setPreviewIntersection(null);
  }, [previewIntersection]);

  return (
    <div className="app-layout">
      {/* Left: Category Panel */}
      <CategoryPanel
        isOpen={leftPanelOpen}
        onToggle={() => setLeftPanelOpen(!leftPanelOpen)}
        checkedItems={checkedItems}
        onItemToggle={handleItemToggle}
      />

      {/* Center: Workspace */}
      <main className="workspace" ref={workspaceRef}>
        <AnimatePresence>
          {stacks.map(stack => (
            <PhotoStack
              key={stack.id}
              stack={stack}
              onDrag={handleStackDrag}
              onDragEnd={handleStackDragEnd}
              onDelete={handleDeleteStack}
              workspaceRef={workspaceRef}
            />
          ))}
          {intersectionStacks.map(stack => (
            <PhotoStack
              key={`intersection-${stack.id}`}
              stack={stack}
              onDrag={() => { }}
              onDragEnd={() => { }}
              onDelete={handleDeleteIntersection}
              workspaceRef={workspaceRef}
              isIntersection={true}
            />
          ))}
          {previewIntersection && (
            <PhotoStack
              key="preview"
              stack={previewIntersection}
              workspaceRef={workspaceRef}
              isPreview={true}
            />
          )}
        </AnimatePresence>

        {stacks.length === 0 && intersectionStacks.length === 0 && (
          <div className="workspace-empty">
            <p>왼쪽 패널에서 카테고리를 선택하세요</p>
          </div>
        )}
      </main>

      {/* Right: Chat Panel */}
      <ChatPanel
        isOpen={rightPanelOpen}
        onToggle={() => setRightPanelOpen(!rightPanelOpen)}
      />
    </div>
  );
}
