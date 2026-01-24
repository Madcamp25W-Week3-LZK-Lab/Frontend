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
                            <div className="auth-divider">
                                <span>또는</span>
                            </div>
                            <button type="button" className="auth-google">
                                <span className="google-icon" aria-hidden="true">
                                    <svg viewBox="0 0 48 48" role="img" focusable="false">
                                        <path
                                            fill="#EA4335"
                                            d="M24 9.5c3.54 0 6.28 1.53 7.72 2.82l5.62-5.62C33.58 3.58 29.2 1.5 24 1.5 14.64 1.5 6.58 6.86 2.64 14.68l6.86 5.32C11.3 13.1 17.1 9.5 24 9.5z"
                                        />
                                        <path
                                            fill="#4285F4"
                                            d="M46.5 24.5c0-1.5-.14-2.94-.4-4.33H24v8.2h12.7c-.55 2.96-2.2 5.46-4.66 7.14l7.1 5.5c4.14-3.82 6.36-9.44 6.36-16.5z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M9.5 28.06a14.5 14.5 0 0 1 0-8.12l-6.86-5.32a23.99 23.99 0 0 0 0 18.76l6.86-5.32z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M24 46.5c5.2 0 9.58-1.7 12.78-4.62l-7.1-5.5c-1.98 1.34-4.52 2.14-5.68 2.14-6.9 0-12.7-3.6-14.5-9.5l-6.86 5.32C6.58 41.14 14.64 46.5 24 46.5z"
                                        />
                                    </svg>
                                </span>
                                Google로 계속하기
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
