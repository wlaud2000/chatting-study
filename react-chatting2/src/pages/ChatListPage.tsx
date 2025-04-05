import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useChat from '../hooks/useChat';
import ChatList from '../components/chat/ChatList';
import './ChatListPage.css';

const ChatListPage: React.FC = () => {
	const { user, isAuthenticated, logout } = useAuth();
	const { chatRooms, loadChatRooms, loading, error, createPrivateChat } = useChat();
	const navigate = useNavigate();
	const [receiverId, setReceiverId] = useState<string>('');
	const [showNewChatForm, setShowNewChatForm] = useState<boolean>(false);

	// 로그인 상태 확인 및 채팅방 목록 로드
	useEffect(() => {
		if (!isAuthenticated) {
			navigate('/login');
			return;
		}

		loadChatRooms();
	}, [isAuthenticated, loadChatRooms, navigate]);

	// 채팅방 선택 처리
	const handleChatSelect = (chatId: string) => {
		navigate(`/chats/${chatId}`);
	};

	// 새 채팅방 생성 처리
	const handleCreateChat = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!receiverId || isNaN(Number(receiverId))) {
			alert('유효한 사용자 ID를 입력해주세요.');
			return;
		}
		
		const chatRoom = await createPrivateChat(Number(receiverId));
		if (chatRoom) {
			setReceiverId('');
			setShowNewChatForm(false);
			navigate(`/chats/${chatRoom.chatId}`);
		}
	};

	return (
		<div className="chat-list-page">
			<header className="chat-header">
				<h1>채팅</h1>
				<div className="header-actions">
					<button 
						className="new-chat-button"
						onClick={() => setShowNewChatForm(!showNewChatForm)}
					>
						{showNewChatForm ? '취소' : '새 채팅'}
					</button>
					<button className="logout-button" onClick={logout}>로그아웃</button>
				</div>
			</header>
			
			{showNewChatForm && (
				<div className="new-chat-form">
					<form onSubmit={handleCreateChat}>
						<input
							type="text"
							value={receiverId}
							onChange={(e) => setReceiverId(e.target.value)}
							placeholder="채팅할 사용자 ID를 입력하세요"
						/>
						<button type="submit" disabled={loading || !receiverId}>
							{loading ? '처리 중...' : '시작'}
						</button>
					</form>
				</div>
			)}
			
			{error && <div className="error-message">{error}</div>}
			
			{loading && chatRooms.length === 0 ? (
				<div className="loading-message">채팅방 목록을 불러오는 중...</div>
			) : (
				<ChatList 
					chatRooms={chatRooms} 
					onChatSelect={handleChatSelect} 
					selectedChatId={null}
				/>
			)}
		</div>
	);
};

export default ChatListPage;