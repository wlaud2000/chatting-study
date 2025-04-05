import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ChatListPage from './pages/ChatListPage';
import ChatRoomPage from './pages/ChatRoomPage';
import useAuth from './hooks/useAuth';

// 보호된 라우트를 위한 컴포넌트
const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
	const { isAuthenticated, loading } = useAuth();
	
	console.log('PrivateRoute - isAuthenticated:', isAuthenticated, 'loading:', loading);
	
	// 로딩 중이면 로딩 표시
	if (loading) {
		return <div className="loading">Loading...</div>;
	}
	
	// 인증되지 않았으면 로그인 페이지로 리다이렉트
	return isAuthenticated ? element : <Navigate to="/login" replace />;
};

// 로그인/회원가입 페이지용 컴포넌트 (이미 로그인된 경우 채팅 목록으로 리다이렉트)
const PublicRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
	const { isAuthenticated, loading } = useAuth();
	
	console.log('PublicRoute - isAuthenticated:', isAuthenticated, 'loading:', loading);
	
	// 로딩 중이면 로딩 표시
	if (loading) {
		return <div className="loading">Loading...</div>;
	}
	
	// 이미 로그인되어 있으면 채팅 목록으로 리다이렉트
	return isAuthenticated ? <Navigate to="/chats" replace /> : element;
};

const AppRoutes: React.FC = () => {
	return (
		<Routes>
			{/* 메인 페이지는 채팅 목록으로 리다이렉트 */}
			<Route path="/" element={<Navigate to="/chats" replace />} />
			
			{/* 인증 관련 페이지 */}
			<Route path="/login" element={<PublicRoute element={<LoginPage />} />} />
			<Route path="/signup" element={<PublicRoute element={<SignupPage />} />} />
			
			{/* 채팅 관련 페이지 */}
			<Route path="/chats" element={<PrivateRoute element={<ChatListPage />} />} />
			<Route path="/chats/:chatId" element={<PrivateRoute element={<ChatRoomPage />} />} />
			
			{/* 404 페이지 */}
			<Route path="*" element={<div>Page not found</div>} />
		</Routes>
	);
};

export default AppRoutes;