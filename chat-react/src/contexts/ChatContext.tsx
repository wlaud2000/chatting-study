import React, { createContext, useContext, useEffect, useState } from 'react';
import { ChatRoom, Message } from '../types';
import { createPrivateChat, fetchChatRooms, fetchMessages, markMessagesAsRead } from '../api/chatApi';
import { useAuth } from './AuthContext';
import WebSocketService from '../services/websocketService';

interface ChatContextType {
  chatRooms: ChatRoom[];
  currentChatRoom: ChatRoom | null;
  messages: Message[];
  loading: boolean;
  selectChatRoom: (room: ChatRoom) => void;
  sendMessage: (content: string) => void;
  createNewChat: (receiverId: number) => Promise<boolean>;
  refreshChatRooms: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [currentChatRoom, setCurrentChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  
  const { isAuthenticated, user } = useAuth();
  const webSocketService = WebSocketService.getInstance();

  // 채팅방 목록 로드
  useEffect(() => {
    if (isAuthenticated) {
      refreshChatRooms();
    } else {
      setChatRooms([]);
      setCurrentChatRoom(null);
      setMessages([]);
    }
  }, [isAuthenticated]);

  // 현재 채팅방이 변경될 때 메시지 로드 및 구독
  useEffect(() => {
    if (currentChatRoom) {
      loadMessages(currentChatRoom.chatId);
      subscribeToRoom(currentChatRoom.chatId);
      markAllMessagesAsRead(currentChatRoom.chatId);
    }

    return () => {
      // 기존 구독 해제
      subscriptions.forEach(id => {
        webSocketService.unsubscribe(id);
      });
      setSubscriptions([]);
    };
  }, [currentChatRoom]);

  const refreshChatRooms = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetchChatRooms();
      if (response.isSuccess) {
        setChatRooms(response.result || []);
      }
    } catch (error) {
      console.error('Fetch chat rooms error:', error);
      setChatRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetchMessages(chatId);
      if (response.isSuccess && response.result) {
        // 메시지를 시간순으로 정렬
        const sortedMessages = [...response.result.messages].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(sortedMessages);
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRoom = (chatId: string): void => {
    if (!webSocketService.isConnected()) {
      console.warn('WebSocket not connected. Unable to subscribe to room.');
      return;
    }

    // 메시지 구독
    const messageSubId = webSocketService.subscribe(
      `/sub/chat/private/${chatId}`,
      (receivedMessage: Message) => {
        // 중복 메시지 체크
        setMessages(prevMessages => {
          const exists = prevMessages.some(m => m.messageId === receivedMessage.messageId);
          if (exists) return prevMessages;
          
          // 새 메시지 추가 및 정렬
          const newMessages = [...prevMessages, receivedMessage].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          // 내가 보낸 메시지가 아니라면 읽음 처리
          if (user && receivedMessage.senderId !== user.id) {
            markMessagesAsRead(chatId, receivedMessage.messageId);
          }
          
          return newMessages;
        });
        
        // 채팅방 목록 새로고침
        refreshChatRooms();
      },
      `message-${chatId}`
    );
    
    // 읽음 상태 구독
    const readSubId = webSocketService.subscribe(
      `/sub/chat/private/${chatId}/read`,
      () => {
        // 읽음 상태 업데이트
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            user && msg.senderId === user.id ? { ...msg, read: true } : msg
          )
        );
        
        // 채팅방 목록 새로고침
        refreshChatRooms();
      },
      `read-${chatId}`
    );
    
    setSubscriptions(prev => [...prev, messageSubId, readSubId]);
  };

  const selectChatRoom = (room: ChatRoom): void => {
    setCurrentChatRoom(room);
  };

  const sendMessage = (content: string): void => {
    if (!content.trim() || !currentChatRoom || !webSocketService.isConnected()) {
      return;
    }

    const message = {
      chatId: currentChatRoom.chatId,
      content: content.trim()
    };

    webSocketService.send('/pub/chat/private', message);
  };

  const markAllMessagesAsRead = async (chatId: string): Promise<void> => {
    try {
      await markMessagesAsRead(chatId);
      
      // WebSocket으로 읽음 상태 업데이트 알림
      if (webSocketService.isConnected()) {
        webSocketService.send('/pub/chat/read', {
          chatId: chatId,
          messageId: null
        });
      }
      
      // 채팅방 목록 새로고침
      refreshChatRooms();
    } catch (error) {
      console.error('Mark messages as read error:', error);
    }
  };

  const handleCreateNewChat = async (receiverId: number): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await createPrivateChat(receiverId);
      
      if (response.isSuccess) {
        await refreshChatRooms();
        
        // 새로 생성된 채팅방 찾기
        const newRoom = chatRooms.find(room => 
          room.chatId === response.result.chatId
        );
        
        if (newRoom) {
          selectChatRoom(newRoom);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Create chat error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chatRooms,
        currentChatRoom,
        messages,
        loading,
        selectChatRoom,
        sendMessage,
        createNewChat: handleCreateNewChat,
        refreshChatRooms
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};