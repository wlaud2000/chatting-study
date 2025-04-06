import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import './styles/App.css';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-container">로딩 중...</div>;
  }

  return isAuthenticated ? <ChatPage /> : <AuthPage />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ChatProvider>
        <div className="app-container">
          <AppContent />
        </div>
      </ChatProvider>
    </AuthProvider>
  );
};

export default App;