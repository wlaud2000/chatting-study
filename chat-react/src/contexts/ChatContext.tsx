import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { ChatRoom, Message } from '../types';
import { createPrivateChat, fetchChatRooms, fetchMessages } from '../api/chatApi';
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
  
  const newChatRoomSubscribed = useRef<boolean>(false);
  
  const { isAuthenticated, user } = useAuth();
  const webSocketService = WebSocketService.getInstance();

  // 채팅방 목록 로드
  useEffect(() => {
    if (isAuthenticated) {
      refreshChatRooms();
      
      // 새 채팅방 알림 구독
      if (webSocketService.isConnected() && !newChatRoomSubscribed.current) {
        subscribeToNewChatRooms();
      }
    } else {
      setChatRooms([]);
      setCurrentChatRoom(null);
      setMessages([]);
      newChatRoomSubscribed.current = false;
    }
  }, [isAuthenticated]);

  // WebSocket 연결 상태 확인
  useEffect(() => {
    // WebSocket 연결 상태가 변경될 때마다 호출
    const handleWebSocketChange = () => {
      if (isAuthenticated && webSocketService.isConnected() && !newChatRoomSubscribed.current) {
        subscribeToNewChatRooms();
      }
    };

    handleWebSocketChange();
    
    // WebSocket 연결 상태를 주기적으로 확인
    const intervalId = setInterval(() => {
      if (isAuthenticated && webSocketService.isConnected() && !newChatRoomSubscribed.current) {
        subscribeToNewChatRooms();
      }
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  // 현재 채팅방이 변경될 때 메시지 로드 및 구독
  useEffect(() => {
    if (currentChatRoom) {
      loadMessages(currentChatRoom.chatId);
      subscribeToRoom(currentChatRoom.chatId);
      markAllMessagesAsRead(currentChatRoom.chatId);
    }

    return () => {
      // 채팅방 관련 구독만 해제 (새 채팅방 알림 구독은 유지)
      subscriptions.forEach(id => {
        if (id !== 'new-chat-room-sub') {
          webSocketService.unsubscribe(id);
        }
      });
      setSubscriptions(prev => prev.filter(id => id === 'new-chat-room-sub'));
    };
  }, [currentChatRoom]);

  // 새 채팅방 알림 구독
  const subscribeToNewChatRooms = (): void => {
    if (!webSocketService.isConnected()) {
      console.log('WebSocket 연결되지 않음. 새 채팅방 알림을 구독할 수 없습니다.');
      return;
    }

    console.log('새 채팅방 알림 구독 시작...');
    
    // 새 채팅방 알림 구독
    const subId = webSocketService.subscribe(
      '/user/sub/chat/rooms/new',
      (notification) => {
        console.log('새 채팅방 알림 수신:', notification);
        // 새 채팅방 알림을 받으면 채팅방 목록 갱신
        refreshChatRooms();
      },
      'new-chat-room-sub'
    );
    
    if (subId) {
      setSubscriptions(prev => [...prev.filter(id => id !== 'new-chat-room-sub'), subId]);
      newChatRoomSubscribed.current = true;
      console.log('새 채팅방 알림 구독 완료:', subId);
    }
  };

  const refreshChatRooms = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetchChatRooms();
      if (response.isSuccess) {
        setChatRooms(response.result || []);
      }
    } catch (error) {
      console.error('채팅방 목록 조회 오류:', error);
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
      console.error('메시지 조회 오류:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRoom = (chatId: string): void => {
    if (!webSocketService.isConnected()) {
      console.log('WebSocket 연결되지 않음. 채팅방을 구독할 수 없습니다.');
      return;
    }

    // 메시지 구독 ID
    const messageSubId = `message-${chatId}`;
    // 읽음 상태 구독 ID
    const readSubId = `read-${chatId}`;
    
    // 기존 구독이 있다면 제거
    if (subscriptions.includes(messageSubId)) {
      webSocketService.unsubscribe(messageSubId);
    }
    
    if (subscriptions.includes(readSubId)) {
      webSocketService.unsubscribe(readSubId);
    }

    // 메시지 구독
    const newMessageSubId = webSocketService.subscribe(
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
          
          // 내가 보낸 메시지가 아니라면 읽음 처리 (WebSocket으로만 처리)
          if (user && receivedMessage.senderId !== user.id && webSocketService.isConnected()) {
            webSocketService.send('/pub/chat/read', {
              chatId: chatId,
              messageId: receivedMessage.messageId
            });
          }
          
          return newMessages;
        });
        
        // 채팅방 목록을 HTTP 요청 없이 로컬에서 업데이트
        updateChatRoomLocally(chatId, receivedMessage);
      },
      messageSubId
    );
    
    // 읽음 상태 구독
    const newReadSubId = webSocketService.subscribe(
      `/sub/chat/private/${chatId}/read`,
      () => {
        // 읽음 상태 업데이트
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            user && msg.senderId === user.id ? { ...msg, read: true } : msg
          )
        );
        
        // 채팅방 목록을 HTTP 요청 없이 로컬에서 업데이트
        updateChatRoomReadStatus(chatId);
      },
      readSubId
    );
    
    // 구독 ID 추가
    if (newMessageSubId) {
      setSubscriptions(prev => [...prev.filter(id => id !== messageSubId), newMessageSubId]);
    }
    
    if (newReadSubId) {
      setSubscriptions(prev => [...prev.filter(id => id !== readSubId), newReadSubId]);
    }
  };

  // 새 메시지가 도착했을 때 로컬에서 채팅방 목록 업데이트
  const updateChatRoomLocally = (chatId: string, receivedMessage: Message): void => {
    setChatRooms(prevRooms => 
      prevRooms.map(room => {
        if (room.chatId === chatId) {
          // 자신이 보낸 메시지인지 확인
          const isSentByMe = user && receivedMessage.senderId === user.id;
          
          return {
            ...room,
            lastMessage: {
              messageId: receivedMessage.messageId,
              content: receivedMessage.content,
              senderId: receivedMessage.senderId,
              createdAt: receivedMessage.createdAt,
              read: isSentByMe ? false : true
            },
            // 자신이 보낸 메시지면 읽지 않은 메시지 수 유지, 아니면 증가
            unreadCount: isSentByMe ? room.unreadCount : room.unreadCount + 1
          };
        }
        return room;
      })
    );
  };

  // 읽음 상태가 업데이트되었을 때 로컬에서 채팅방 목록 업데이트
  const updateChatRoomReadStatus = (chatId: string): void => {
    setChatRooms(prevRooms => 
      prevRooms.map(room => {
        if (room.chatId === chatId && room.lastMessage) {
          return {
            ...room,
            lastMessage: {
              ...room.lastMessage,
              read: true
            },
            unreadCount: 0 // 읽음 처리되면 안 읽은 메시지 수를 0으로 설정
          };
        }
        return room;
      })
    );
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

  const markAllMessagesAsRead = (chatId: string): void => {
    // WebSocket을 통해서만 읽음 처리
    if (webSocketService.isConnected()) {
      webSocketService.send('/pub/chat/read', {
        chatId: chatId,
        messageId: null
      });
      
      // 로컬에서 채팅방의 읽지 않은 메시지 수 업데이트
      updateChatRoomReadStatus(chatId);
    }
  };

  const handleCreateNewChat = async (receiverId: number): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await createPrivateChat(receiverId);
      
      if (response.isSuccess) {
        await refreshChatRooms(); // 채팅방 생성은 HTTP 요청 유지
        
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
      console.error('채팅방 생성 오류:', error);
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