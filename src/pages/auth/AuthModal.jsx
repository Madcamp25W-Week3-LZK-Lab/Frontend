import { motion } from "framer-motion";
import LoginScreen from "./LoginScreen.jsx";
import SignupScreen from "./SignupScreen.jsx";
import "../../styles/auth/AuthModal.css";

export default function AuthModal({
  isOpen,
  onClose,
  isLoginMode,
  onSwitchMode,
  onSubmit,
  onGoogleLogin,
  authError,
  isSubmitting,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  passwordConfirm,
  onPasswordConfirmChange,
}) {
  if (!isOpen) return null;

  return (
    <motion.div
      className="auth-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        className="auth-modal"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{isLoginMode ? "로그인" : "회원가입"}</h2>

        <form onSubmit={onSubmit}>
          {isLoginMode ? (
            <LoginScreen
              email={email}
              onEmailChange={onEmailChange}
              password={password}
              onPasswordChange={onPasswordChange}
            />
          ) : (
            <SignupScreen
              email={email}
              onEmailChange={onEmailChange}
              password={password}
              onPasswordChange={onPasswordChange}
              passwordConfirm={passwordConfirm}
              onPasswordConfirmChange={onPasswordConfirmChange}
            />
          )}

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isLoginMode ? "로그인" : "가입하기"}
          </button>
          <div className="auth-divider">
            <span>또는</span>
          </div>
          <button type="button" className="auth-google" onClick={onGoogleLogin}>
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
          {authError && (
            <p className="auth-error" role="alert">
              {authError}
            </p>
          )}
        </form>

        <p className="auth-switch">
          {isLoginMode ? "계정이 없으신가요? " : "이미 계정이 있으신가요? "}
          <button type="button" onClick={onSwitchMode}>
            {isLoginMode ? "회원가입" : "로그인"}
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}
