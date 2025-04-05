import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useChat from '../hooks/useChat';
import ChatRoom from '../components/chat/ChatRoom';
import './ChatRoomPage.css';

const ChatRoomPage: React.FC = () => {
	const { chatId } = useParams<{ chatId: string }>();
	const { user, isAuthenticated } = useAuth();
	const { 
		messages, 
		selectChatRoom, 
		sendMessage, 
		loadMoreMessages, 
		hasMore, 
		loading, 
		error, 
		chatRooms,
		leaveCurrentChat,
		loadChatRooms
	} = useChat();
	const navigate = useNavigate();

	// 인증 확인 및 채팅방 선택 (변경됨)
	useEffect(() => {
		const initChatRoom = async () => {
			// 명시적으로 토큰 확인
			const token = localStorage.getItem('accessToken');
			console.log('ChatRoom init - token exists:', !!token);
			
			if (!isAuthenticated || !user) {
				console.log('Not authenticated, redirecting to login');
				navigate('/login');
				return;
			}

			if (!chatId) {
				console.log('No chatId, redirecting to chat list');
				navigate('/chats');
				return;
			}

			// 채팅방 목록 로드
			await loadChatRooms();
			
			// 채팅방 선택
			await selectChatRoom(chatId);
		};
		
		initChatRoom();

		return () => {
			// 컴포넌트 언마운트 시 채팅방 구독 해제
			console.log('ChatRoom unmounting, leaving chat');
			leaveCurrentChat();
		};
	}, [chatId, isAuthenticated, user, navigate, selectChatRoom, leaveCurrentChat, loadChatRooms]);

	// 현재 채팅방 정보 찾기
	const currentChatRoom = chatRooms.find(room => room.chatId === chatId);
	
	// 채팅 상대방 이름 찾기
	const chatPartnerName = currentChatRoom?.otherUser?.username || '알 수 없음';

	// 뒤로 가기 처리
	const handleBack = () => {
		navigate('/chats');
	};

	if (!user) return null;

	return (
		<div className="chat-room-page">
			<header className="chat-room-header">
				<button className="back-button" onClick={handleBack}>
					&larr; 뒤로
				</button>
				<h1>{chatPartnerName}</h1>
			</header>
			
			{error && <div className="error-message">{error}</div>}
			
			<div className="chat-room-container">
				<ChatRoom
					messages={messages}
					currentUserId={user.id}
					chatPartnerName={chatPartnerName}
					onSendMessage={sendMessage}
					onLoadMore={loadMoreMessages}
					hasMore={hasMore}
					loading={loading}
				/>
			</div>
		</div>
	);
};

export default ChatRoomPage;