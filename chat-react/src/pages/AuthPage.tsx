import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';

const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  return (
    <div className="auth-container">
      <h1>채팅 애플리케이션</h1>
      
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'login' ? 'active' : ''}`}
          onClick={() => setActiveTab('login')}
        >
          로그인
        </div>
        <div 
          className={`tab ${activeTab === 'signup' ? 'active' : ''}`}
          onClick={() => setActiveTab('signup')}
        >
          회원가입
        </div>
      </div>
      
      {activeTab === 'login' ? (
        <LoginForm onSwitchTab={() => setActiveTab('signup')} />
      ) : (
        <SignupForm onSwitchTab={() => setActiveTab('login')} />
      )}
    </div>
  );
};

export default AuthPage;