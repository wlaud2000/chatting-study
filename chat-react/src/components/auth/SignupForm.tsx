import React, { useState } from 'react';
import { signup } from '../../api/authApi';

interface SignupFormProps {
  onSwitchTab: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSwitchTab }) => {
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email || !username || !password) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await signup({ email, username, password });
      
      if (response.isSuccess) {
        setSuccess('회원가입이 완료되었습니다. 로그인해주세요.');
        // 1.5초 후 로그인 탭으로 전환
        setTimeout(() => {
          onSwitchTab();
        }, 1500);
      } else {
        setError(response.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
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
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="사용자명"
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
        {loading ? '처리 중...' : '회원가입'}
      </button>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <p className="form-footer">
        이미 계정이 있으신가요? <button type="button" onClick={onSwitchTab} className="text-button">로그인</button>
      </p>
    </form>
  );
};

export default SignupForm;
