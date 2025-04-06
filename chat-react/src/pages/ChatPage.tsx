import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import ChatRoomItem from '../components/chat/ChatRoomItem';
import MessageItem from '../components/chat/MessageItem';
import NewChatModal from '../components/chat/NewChatModal';

const ChatPage: React.FC = () => {
  const { logout } = useAuth();
  const { 
    chatRooms, 
    currentChatRoom, 
    messages, 
    selectChatRoom, 
    sendMessage,
    createNewChat
  } = useChat();
  
  const [newMessage, setNewMessage] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isComposing, setIsComposing] = useState<boolean>(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 메시지가 변경될 때마다 스크롤 맨 아래로 이동
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !isComposing) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>채팅</h2>
        <button id="logout-button" onClick={logout}>로그아웃</button>
      </div>
      
      <div className="chat-content">
        {/* 채팅방 목록 */}
        <div className="chat-rooms">
          <div className="chat-rooms-header">
            <h3>채팅방 목록</h3>
            <button id="new-chat-button" onClick={() => setIsModalOpen(true)}>
              새 채팅
            </button>
          </div>
          <div className="chat-rooms-list">
            {chatRooms.length === 0 ? (
              <div className="empty-list-message">
                채팅방이 없습니다<br />새 채팅을 시작해보세요
              </div>
            ) : (
              chatRooms.map(room => (
                <ChatRoomItem
                  key={room.chatId}
                  room={room}
                  isActive={currentChatRoom?.chatId === room.chatId}
                  onClick={() => selectChatRoom(room)}
                />
              ))
            )}
          </div>
        </div>
        
        {/* 채팅 영역 */}
        <div className="chat-area">
          <div className="chat-room-info">
            {currentChatRoom ? (
              <>
                <h4>{currentChatRoom.otherUser.username}</h4>
                <p>{currentChatRoom.otherUser.email}</p>
              </>
            ) : (
              <p>채팅방을 선택하거나 새 채팅을 시작하세요.</p>
            )}
          </div>
          
          <div className="messages-container">
            {currentChatRoom ? (
              messages.length > 0 ? (
                <>
                  {messages.map(message => (
                    <MessageItem key={message.messageId} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="empty-messages">메시지가 없습니다.</div>
              )
            ) : (
              <div className="select-chat-prompt">채팅방을 선택해주세요.</div>
            )}
          </div>
          
          <form className="message-input-container" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder="메시지를 입력하세요..."
              disabled={!currentChatRoom}
            />
            <button
              type="submit"
              disabled={!currentChatRoom || !newMessage.trim()}
            >
              전송
            </button>
          </form>
        </div>
      </div>
      
      {/* 새 채팅 모달 */}
      <NewChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateChat={createNewChat}
      />
    </div>
  );
};

export default ChatPage;