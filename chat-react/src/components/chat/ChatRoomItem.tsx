import React from 'react';
import { ChatRoom } from '../../types';
import { formatTime } from '../../utils/timeFormat';

interface ChatRoomItemProps {
  room: ChatRoom;
  isActive: boolean;
  onClick: () => void;
}

const ChatRoomItem: React.FC<ChatRoomItemProps> = ({ room, isActive, onClick }) => {
  const lastMessageTime = room.lastMessage 
    ? formatTime(room.lastMessage.createdAt) 
    : '';

  return (
    <div 
      className={`chat-room-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="chat-room-item-header">
        <span className="chat-room-item-username">{room.otherUser.username}</span>
        <span className="chat-room-item-time">{lastMessageTime}</span>
      </div>
      <div className="chat-room-item-last-message">
        {room.lastMessage ? room.lastMessage.content : '새로운 채팅방'}
        {room.unreadCount > 0 && <span className="unread-count">{room.unreadCount}</span>}
      </div>
    </div>
  );
};

export default ChatRoomItem;