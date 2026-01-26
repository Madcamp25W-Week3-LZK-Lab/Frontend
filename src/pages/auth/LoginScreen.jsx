export default function LoginScreen({
  email,
  onEmailChange,
  password,
  onPasswordChange,
}) {
  return (
    <>
      <input
        type="email"
        id="auth-email"
        name="email"
        autoComplete="email"
        placeholder="이메일"
        className="auth-input"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
      />
      <input
        type="password"
        id="auth-password"
        name="password"
        autoComplete="current-password"
        placeholder="비밀번호"
        className="auth-input"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
      />
    </>
  );
}
