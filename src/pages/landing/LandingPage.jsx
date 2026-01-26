import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { authApi } from "../../lib/api";
import AuthModal from "../auth/AuthModal.jsx";
import "../../styles/landing/LandingPage.css";

export default function LandingPage({ onLogin, initialAuthOpen = false }) {
    const [showAuthModal, setShowAuthModal] = useState(initialAuthOpen);
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [authError, setAuthError] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAuthError("");

        if (!email || !password) {
            setAuthError("이메일과 비밀번호를 입력해주세요.");
            return;
        }

        if (!isLoginMode && password !== passwordConfirm) {
            setAuthError("비밀번호가 일치하지 않습니다.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = { email, password };
            const data = isLoginMode
                ? await authApi.login(payload)
                : await authApi.signup(payload);

            const token = data?.access_token;
            if (token) {
                localStorage.setItem("auth_token", token);
            }
            localStorage.setItem("auth_user", JSON.stringify(data));
            onLogin?.();
        } catch (error) {
            setAuthError(error?.message || "로그인에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = () => {
        setAuthError("");
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
            setAuthError("Google Client ID가 설정되어 있지 않습니다.");
            return;
        }

        if (!window.google?.accounts?.id) {
            setAuthError("Google 로그인 스크립트 로드 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        window.google.accounts.id.initialize({
            client_id: clientId,
            ux_mode: "popup",
            callback: async (response) => {
                try {
                    const idToken = response.credential;
                    const data = await authApi.googleLogin(idToken);
                    localStorage.setItem("auth_token", idToken);
                    localStorage.setItem("auth_user", JSON.stringify(data));
                    onLogin?.();
                } catch (error) {
                    setAuthError(error?.message || "Google 로그인에 실패했습니다.");
                }
            },
        });

        window.google.accounts.id.prompt();
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
                    <h1 className="landing-title">Photo-X</h1>
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

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                isLoginMode={isLoginMode}
                onSwitchMode={() => setIsLoginMode((prev) => !prev)}
                onSubmit={handleSubmit}
                onGoogleLogin={handleGoogleLogin}
                authError={authError}
                isSubmitting={isSubmitting}
                email={email}
                onEmailChange={setEmail}
                password={password}
                onPasswordChange={setPassword}
                passwordConfirm={passwordConfirm}
                onPasswordConfirmChange={setPasswordConfirm}
            />
        </div>
    );
}
