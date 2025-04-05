import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import './LoginPage.css';

const LoginPage: React.FC = () => {
	const { login, loading, error } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
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

		await login({ email, password });
	};

	return (
		<div className="auth-container">
			<div className="auth-card">
				<h1>로그인</h1>
				
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
					
					{(formError || error) && (
						<div className="error-message">{formError || error}</div>
					)}
					
					<button type="submit" className="submit-button" disabled={loading}>
						{loading ? '로그인 중...' : '로그인'}
					</button>
				</form>
				
				<div className="auth-footer">
					<p>계정이 없으신가요? <Link to="/signup">회원가입</Link></p>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;