import { useState } from "react";
import { motion } from "framer-motion";
import "./LandingPage.css";

export default function LandingPage({ onLogin }) {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isLoginMode, setIsLoginMode] = useState(true);

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin?.();
    };

    return (
        <div className="landing-page">
            {/* Background */}
            <div className="landing-bg" />

            {/* Main Content */}
            <main className="landing-content">
                <motion.div
                    className="landing-intro"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="landing-title">Venn Photo Atlas</h1>
                    <p className="landing-description">
                        사진을 스마트하게 분류하고, 원하는 순간을 쉽게 찾아보세요.
                        <br />
                        인물, 장소, 객체 등 다양한 카테고리의 교집합으로
                        <br />
                        당신만의 특별한 순간들을 발견합니다.
                    </p>

                    <div className="landing-buttons">
                        <motion.button
                            className="landing-btn landing-btn--primary"
                            onClick={() => {
                                setIsLoginMode(true);
                                setShowAuthModal(true);
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            로그인
                        </motion.button>
                        <motion.button
                            className="landing-btn landing-btn--secondary"
                            onClick={() => {
                                setIsLoginMode(false);
                                setShowAuthModal(true);
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            회원가입
                        </motion.button>
                    </div>
                </motion.div>
            </main>

            {/* Auth Modal */}
            {showAuthModal && (
                <motion.div
                    className="auth-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setShowAuthModal(false)}
                >
                    <motion.div
                        className="auth-modal"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>{isLoginMode ? "로그인" : "회원가입"}</h2>

                        <form onSubmit={handleSubmit}>
                            <input
                                type="email"
                                placeholder="이메일"
                                className="auth-input"
                            />
                            <input
                                type="password"
                                placeholder="비밀번호"
                                className="auth-input"
                            />
                            {!isLoginMode && (
                                <input
                                    type="password"
                                    placeholder="비밀번호 확인"
                                    className="auth-input"
                                />
                            )}
                            <button type="submit" className="auth-submit">
                                {isLoginMode ? "로그인" : "가입하기"}
                            </button>
                        </form>

                        <p className="auth-switch">
                            {isLoginMode ? "계정이 없으신가요? " : "이미 계정이 있으신가요? "}
                            <button onClick={() => setIsLoginMode(!isLoginMode)}>
                                {isLoginMode ? "회원가입" : "로그인"}
                            </button>
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
