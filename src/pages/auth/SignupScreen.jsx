export default function SignupScreen({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  passwordConfirm,
  onPasswordConfirmChange,
}) {
  return (
    <div className="auth-group">
      <div className="auth-group-row">
        <label className="auth-label" htmlFor="auth-email">이메일</label>
        <input
          type="email"
          id="auth-email"
          name="email"
          autoComplete="email"
          className="auth-input"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
        />
      </div>
      <div className="auth-group-row">
        <label className="auth-label" htmlFor="auth-password">비밀번호</label>
        <input
          type="password"
          id="auth-password"
          name="password"
          autoComplete="new-password"
          className="auth-input"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
        />
      </div>
      <div className="auth-group-row">
        <label className="auth-label" htmlFor="auth-password-confirm">비밀번호 확인</label>
        <input
          type="password"
          id="auth-password-confirm"
          name="passwordConfirm"
          autoComplete="new-password"
          className="auth-input"
          value={passwordConfirm}
          onChange={(e) => onPasswordConfirmChange(e.target.value)}
        />
      </div>
    </div>
  );
}
