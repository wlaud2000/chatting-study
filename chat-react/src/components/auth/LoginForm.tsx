import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onSwitchTab: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchTab }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    setLoading(true);
    const success = await login({ email, password });
    setLoading(false);
    
    if (!success) {
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? '로그인 중...' : '로그인'}
      </button>
      {error && <p className="error-message">{error}</p>}
      <p className="form-footer">
        계정이 없으신가요? <button type="button" onClick={onSwitchTab} className="text-button">회원가입</button>
      </p>
    </form>
  );
};

export default LoginForm;