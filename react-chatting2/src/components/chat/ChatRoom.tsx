import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../../models/chatModel';
import MessageItem from './MessageItem';
import './ChatRoom.css';

interface ChatRoomProps {
	messages: Message[];
	currentUserId: number;
	chatPartnerName: string;
	onSendMessage: (content: string) => void;
	onLoadMore: () => void;
	hasMore: boolean;
	loading: boolean;
}

const ChatRoom: React.FC<ChatRoomProps> = ({
	messages,
	currentUserId,
	chatPartnerName,
	onSendMessage,
	onLoadMore,
	hasMore,
	loading
}) => {
	const [message, setMessage] = useState<string>('');
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const messagesContainerRef = useRef<HTMLDivElement>(null);
	const [isScrollToBottomNeeded, setIsScrollToBottomNeeded] = useState(true);

	// 스크롤 감지 및 이전 메시지 로드
	useEffect(() => {
		const handleScroll = () => {
			if (!messagesContainerRef.current) return;
			
			const { scrollTop } = messagesContainerRef.current;
			
			// 스크롤이 최상단에 도달하면 이전 메시지 로드
			if (scrollTop === 0 && hasMore && !loading) {
				// 현재 스크롤 위치 저장
				const scrollHeight = messagesContainerRef.current.scrollHeight;
				
				// 이전 메시지 로드
				onLoadMore();
				
				// 스크롤 위치 조정 (이전 스크롤 높이를 유지)
				setTimeout(() => {
					if (messagesContainerRef.current) {
						const newScrollHeight = messagesContainerRef.current.scrollHeight;
						messagesContainerRef.current.scrollTop = newScrollHeight - scrollHeight;
					}
				}, 100);
			}
			
			// 스크롤이 최하단에서 100px 이내면 자동 스크롤 활성화
			const isNearBottom = messagesContainerRef.current.scrollHeight - scrollTop - messagesContainerRef.current.clientHeight < 100;
			setIsScrollToBottomNeeded(isNearBottom);
		};
		
		const container = messagesContainerRef.current;
		if (container) {
			container.addEventListener('scroll', handleScroll);
		}
		
		return () => {
			if (container) {
				container.removeEventListener('scroll', handleScroll);
			}
		};
	}, [hasMore, loading, onLoadMore]);

	// 새 메시지가 추가되면 스크롤을 아래로 이동
	useEffect(() => {
		if (isScrollToBottomNeeded && messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [messages, isScrollToBottomNeeded]);

	// 메시지 전송 함수
	const handleSendMessage = (e: React.FormEvent) => {
		e.preventDefault();
		
		if (message.trim()) {
			onSendMessage(message.trim());
			setMessage('');
			setIsScrollToBottomNeeded(true); // 메시지 전송 후 자동 스크롤 활성화
		}
	};

	// 메시지 그룹화 (같은 사용자의 연속 메시지)
	const groupedMessages = messages.reduce((groups: Message[][], message, index) => {
		// 첫 메시지이거나 이전 메시지와 발신자가 다르면 새 그룹 시작
		if (index === 0 || messages[index - 1].senderId !== message.senderId) {
			groups.push([message]);
		} else {
			// 같은 발신자면 현재 그룹에 추가
			groups[groups.length - 1].push(message);
		}
		return groups;
	}, []);

	return (
		<div className="chat-room">
			<div className="chat-header">
				<h2>{chatPartnerName}</h2>
			</div>
			
			<div className="messages-container" ref={messagesContainerRef}>
				{loading && hasMore && (
					<div className="loading-indicator">메시지 불러오는 중...</div>
				)}
				
				{groupedMessages.map((group, groupIndex) => (
					<div 
						key={`group-${groupIndex}`} 
						className={`message-group ${group[0].senderId === currentUserId ? 'own-message-group' : ''}`}
					>
						{group.map((msg, index) => (
							<MessageItem 
								key={msg.messageId}
								message={msg}
								isOwnMessage={msg.senderId === currentUserId}
								isFirstInGroup={index === 0}
								showTimestamp={index === group.length - 1}
							/>
						))}
					</div>
				))}
				
				<div ref={messagesEndRef} />
			</div>
			
			<form className="message-input" onSubmit={handleSendMessage}>
				<input
					type="text"
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					placeholder="메시지를 입력하세요..."
				/>
				<button type="submit" disabled={!message.trim()}>전송</button>
			</form>
		</div>
	);
};

export default ChatRoom;