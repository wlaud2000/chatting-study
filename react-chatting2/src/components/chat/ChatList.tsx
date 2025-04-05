import React from 'react';
import { ChatRoom } from '../../models/chatModel';
import './ChatList.css';

interface ChatListProps {
	chatRooms: ChatRoom[];
	onChatSelect: (chatId: string) => void;
	selectedChatId: string | null;
}

const ChatList: React.FC<ChatListProps> = ({ chatRooms, onChatSelect, selectedChatId }) => {
	// 날짜 포맷팅 함수
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		
		if (diffDays === 0) {
			// 오늘이면 시간만 표시
			return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
		} else if (diffDays < 7) {
			// 일주일 이내면 요일 표시
			return date.toLocaleDateString('ko-KR', { weekday: 'short' });
		} else {
			// 일주일 이상이면 날짜 표시
			return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
		}
	};

	return (
		<div className="chat-list">
			<h2>채팅 목록</h2>
			{chatRooms.length === 0 ? (
				<div className="no-chats">채팅방이 없습니다.</div>
			) : (
				<ul>
					{chatRooms.map((chatRoom) => (
						<li 
							key={chatRoom.chatId} 
							className={`chat-item ${selectedChatId === chatRoom.chatId ? 'selected' : ''}`}
							onClick={() => onChatSelect(chatRoom.chatId)}
						>
							<div className="chat-profile">
								{/* 프로필 이미지 대신 이니셜 사용 */}
								<div className="avatar">
									{chatRoom.otherUser?.username.charAt(0).toUpperCase()}
								</div>
							</div>
							<div className="chat-info">
								<div className="chat-header">
									<h3>{chatRoom.otherUser?.username}</h3>
									{chatRoom.lastMessage && (
										<span className="chat-time">
											{formatDate(chatRoom.lastMessage.createdAt)}
										</span>
									)}
								</div>
								<div className="chat-preview">
									{chatRoom.lastMessage ? (
										<p>{chatRoom.lastMessage.content}</p>
									) : (
										<p className="no-messages">메시지가 없습니다</p>
									)}
									{chatRoom.unreadCount && chatRoom.unreadCount > 0 && (
										<span className="unread-count">{chatRoom.unreadCount}</span>
									)}
								</div>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

export default ChatList;