import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import './LoginPage.css'; // 로그인 페이지와 같은 스타일 사용

const SignupPage: React.FC = () => {
	const { signup, loading, error } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [username, setUsername] = useState('');
	const [formError, setFormError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFormError(null);

		// 유효성 검사
		if (!email) {
			setFormError('이메일을 입력해주세요.');
			return;
		}
		if (!password) {
			setFormError('비밀번호를 입력해주세요.');
			return;
		}
		if (password !== confirmPassword) {
			setFormError('비밀번호가 일치하지 않습니다.');
			return;
		}
		if (!username) {
			setFormError('사용자 이름을 입력해주세요.');
			return;
		}

		await signup({ email, password, username });
	};

	return (
		<div className="auth-container">
			<div className="auth-card">
				<h1>회원가입</h1>
				
				<form onSubmit={handleSubmit}>
					<div className="form-group">
						<label htmlFor="email">이메일</label>
						<input
							type="email"
							id="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="이메일을 입력하세요"
							disabled={loading}
						/>
					</div>
					
					<div className="form-group">
						<label htmlFor="username">사용자 이름</label>
						<input
							type="text"
							id="username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="사용자 이름을 입력하세요"
							disabled={loading}
						/>
					</div>
					
					<div className="form-group">
						<label htmlFor="password">비밀번호</label>
						<input
							type="password"
							id="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="비밀번호를 입력하세요"
							disabled={loading}
						/>
					</div>
					
					<div className="form-group">
						<label htmlFor="confirmPassword">비밀번호 확인</label>
						<input
							type="password"
							id="confirmPassword"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="비밀번호를 다시 입력하세요"
							disabled={loading}
						/>
					</div>
					
					{(formError || error) && (
						<div className="error-message">{formError || error}</div>
					)}
					
					<button type="submit" className="submit-button" disabled={loading}>
						{loading ? '처리 중...' : '회원가입'}
					</button>
				</form>
				
				<div className="auth-footer">
					<p>이미 계정이 있으신가요? <Link to="/login">로그인</Link></p>
				</div>
			</div>
		</div>
	);
};

export default SignupPage;