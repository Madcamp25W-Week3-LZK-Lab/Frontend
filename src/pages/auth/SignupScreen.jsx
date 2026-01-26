export default function SignupScreen({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  passwordConfirm,
  onPasswordConfirmChange,
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
        autoComplete="new-password"
        placeholder="비밀번호"
        className="auth-input"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
      />
      <input
        type="password"
        id="auth-password-confirm"
        name="passwordConfirm"
        autoComplete="new-password"
        placeholder="비밀번호 확인"
        className="auth-input"
        value={passwordConfirm}
        onChange={(e) => onPasswordConfirmChange(e.target.value)}
      />
    </>
  );
}
