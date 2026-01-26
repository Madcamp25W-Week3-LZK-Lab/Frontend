import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import "../../styles/onboarding/OnboardingOverlay.css";

export default function OnboardingOverlay({
  onComplete,
  people = [],
  interests = [],
  onRenamePerson,
  onUpdatePinned,
  onDriveStart,
  onStartAnalysis,
  driveImported,
  driveImportSummary,
  drivePreviewPhotos = [],
  resolvePhotoUrl,
  aiStatus,
  aiError,
  skipDriveStep = false,
}) {
  const [step, setStep] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState("사진을 분석하는 중...");
  const [faces, setFaces] = useState(people);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [isExiting, setIsExiting] = useState(false);
  const autoAdvanceRef = useRef(false);

  // Step 1: Analysis messages rotation (until AI finishes)
  useEffect(() => {
    if (step !== 1) return;

    const messages = [
      "사진을 분석하는 중...",
      "인물을 식별하는 중입니다...",
      "객체를 분류하는 중입니다...",
      "카테고리를 정리하는 중입니다...",
    ];

    let index = 0;
    const messageInterval = setInterval(() => {
      index = (index + 1) % messages.length;
      setAnalysisMessage(messages[index]);
    }, 900);

    return () => {
      clearInterval(messageInterval);
    };
  }, [step]);

  useEffect(() => {
    if (step !== 1) return;
    if (aiStatus?.status === "done") {
      setStep(2);
    }
    if (aiStatus?.status === "error" && aiError) {
      setAnalysisMessage(`분석에 실패했습니다: ${aiError}`);
    }
  }, [step, aiStatus, aiError]);

  useEffect(() => {
    setFaces(people);
  }, [people]);

  useEffect(() => {
    if (!skipDriveStep) return;
    if (step !== 0) return;
    if (autoAdvanceRef.current) return;
    autoAdvanceRef.current = true;
    setStep(1);
  }, [skipDriveStep, step]);

  const handleFaceNameChange = (tagName, nextName) => {
    setFaces((prev) =>
      prev.map((f) => (f.tagName === tagName ? { ...f, displayName: nextName } : f))
    );
  };

  const handleFaceHide = (tagName) => {
    setFaces((prev) => prev.filter((f) => f.tagName !== tagName));
  };

  const handleInterestToggle = (id) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleComplete = () => {
    setIsExiting(true);
    setTimeout(() => {
      onUpdatePinned?.(selectedInterests);
      onComplete?.();
    }, 600);
  };

  const handleStartAnalysis = () => {
    onStartAnalysis?.();
    setStep(1);
  };

  return (
    <motion.div
      className={`onboarding-overlay ${isExiting ? "onboarding-overlay--exiting" : ""}`}
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
        {/* Step 0: Drive Connect */}
        {step === 0 && (
          <div className="onboarding-step onboarding-drive">
            <h2>Google Drive 연동</h2>
            <p className="onboarding-subtitle">
              사진을 불러오기 위해 Google Drive 권한이 필요합니다.
            </p>
            {driveImported ? (
              <p className="onboarding-subtitle">
                {driveImportSummary || "사진 불러오기가 완료되었습니다."}
              </p>
            ) : (
              <p className="onboarding-subtitle">
                연동 팝업에서 가져올 폴더를 선택하세요.
              </p>
            )}
            {driveImported && drivePreviewPhotos.length > 0 && (
              <div className="onboarding-drive-preview">
                {drivePreviewPhotos.slice(0, 5).map((photo) => (
                  <div
                    key={photo.id}
                    className="onboarding-drive-thumb"
                    style={{ backgroundImage: `url(${resolvePhotoUrl(photo)})` }}
                  />
                ))}
              </div>
            )}
            <button className="onboarding-next" onClick={onDriveStart}>
              Drive 연동 팝업 열기
            </button>
            <button className="onboarding-next" onClick={handleStartAnalysis} disabled={!driveImported}>
              다음
            </button>
          </div>
        )}

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
              {faces.map((face) => (
                <motion.div
                  key={face.tagName}
                  className="face-card"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.08 }}
                >
                  <div
                    className="face-photo"
                    style={{ backgroundImage: `url(${resolvePhotoUrl(face.photo)})` }}
                  />
                  <input
                    type="text"
                    placeholder="이름 입력..."
                    value={face.displayName}
                    onChange={(e) => handleFaceNameChange(face.tagName, e.target.value)}
                    onBlur={(e) => {
                      const nextName = e.target.value.trim();
                      if (nextName && nextName !== face.tagName) {
                        onRenamePerson?.(face.tagName, nextName);
                        setFaces((prev) =>
                          prev.map((f) =>
                            f.tagName === face.tagName
                              ? { ...f, tagName: nextName, displayName: nextName }
                              : f
                          )
                        );
                      }
                    }}
                    className="face-input"
                  />
                  <button className="face-hide" onClick={() => handleFaceHide(face.tagName)}>
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
              {interests.map((cat) => (
                <motion.button
                  key={cat.id}
                  className={`bubble ${selectedInterests.includes(cat.id) ? "bubble--active" : ""}`}
                  style={{
                    fontSize: cat.count > 100 ? "16px" : cat.count > 50 ? "14px" : "13px",
                    padding: cat.count > 100 ? "12px 20px" : "10px 16px",
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
          <motion.div className="onboarding-step onboarding-complete" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
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
      </motion.div>
    </motion.div>
  );
}
