import React from 'react';
import { Message } from '../../types';
import { formatTime } from '../../utils/timeFormat';
import { useAuth } from '../../contexts/AuthContext';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const { user } = useAuth();
  const isSentByMe = user && message.senderId === user.id;
  const messageTime = formatTime(message.createdAt);

  return (
    <div className={`message ${isSentByMe ? 'message-sent' : 'message-received'}`}>
      <div className="message-content">{message.content}</div>
      <div className="message-info">
        {!isSentByMe && `${message.senderUsername} · `}
        {messageTime}
        {isSentByMe && message.read && ' · 읽음'}
      </div>
    </div>
  );
};

export default MessageItem;