import React from 'react';
import { Message } from '../../models/chatModel';
import './MessageItem.css';

interface MessageItemProps {
	message: Message;
	isOwnMessage: boolean;
	isFirstInGroup: boolean;
	showTimestamp: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({
	message,
	isOwnMessage,
	isFirstInGroup,
	showTimestamp
}) => {
	// 시간 포맷팅
	const formatTime = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
	};

	return (
		<div className={`message-item ${isOwnMessage ? 'own-message' : 'other-message'}`}>
			{/* 다른 사용자의 메시지이고 그룹의 첫 메시지일 때만 사용자 이름 표시 */}
			{!isOwnMessage && isFirstInGroup && (
				<div className="message-sender">{message.senderUsername}</div>
			)}
			
			<div className="message-content">
				<div className="message-bubble">{message.content}</div>
				
				{/* 읽음 상태와 시간을 그룹의 마지막 메시지에만 표시 */}
				{showTimestamp && (
					<div className="message-metadata">
						{isOwnMessage && (
							<span className={`read-status ${message.read ? 'read' : 'unread'}`}>
								{message.read ? '읽음' : '안읽음'}
							</span>
						)}
						<span className="message-time">{formatTime(message.createdAt)}</span>
					</div>
				)}
			</div>
		</div>
	);
};

export default MessageItem;