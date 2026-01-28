export default function LoginScreen({
  email,
  onEmailChange,
  password,
  onPasswordChange,
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
          autoComplete="current-password"
          className="auth-input"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
        />
      </div>
    </div>
  );
}
