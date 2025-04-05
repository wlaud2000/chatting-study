import { useState, useEffect, useCallback } from 'react';
import { ChatRoom, Message } from '../models/chatModel';
import chatApi from '../api/chatApi';
import chatService from '../services/chatService';

export const useChat = () => {
	const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
	const [currentChatId, setCurrentChatId] = useState<string | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [hasMore, setHasMore] = useState<boolean>(true);

	// WebSocket 연결
	useEffect(() => {
		const connectWebSocket = async () => {
			try {
				await chatService.initializeStompClient();
			} catch (err) {
				console.error('Failed to connect to WebSocket:', err);
				setError('WebSocket 연결에 실패했습니다.');
			}
		};

		connectWebSocket();

		// 컴포넌트 언마운트 시 연결 해제
		return () => {
			chatService.disconnect();
		};
	}, []);

	// 채팅방 목록 로드
	const loadChatRooms = useCallback(async () => {
		try {
			setLoading(true);
			const rooms = await chatApi.getPrivateChats();
			setChatRooms(rooms);
		} catch (err) {
			console.error('Failed to load chat rooms:', err);
			setError('채팅방 목록을 불러오는데 실패했습니다.');
		} finally {
			setLoading(false);
		}
	}, []);

	// 채팅방 선택
	const selectChatRoom = useCallback(async (chatId: string) => {
		try {
			setLoading(true);
			setCurrentChatId(chatId);
			
			// 해당 채팅방의 메시지 로드
			const response = await chatApi.getChatMessages(chatId);
			setMessages(response.messages);
			setHasMore(response.hasMore);
			
			// WebSocket 구독
			chatService.subscribeToChat(chatId, (newMessage) => {
				setMessages(prev => [...prev, newMessage]);
			});
			
			// 읽음 상태 업데이트 구독
			chatService.subscribeToReadStatus(chatId, (messageId) => {
				setMessages(prev => 
					prev.map(msg => 
						msg.messageId === messageId ? { ...msg, read: true } : msg
					)
				);
			});
			
			// 모든 메시지 읽음 상태로 변경
			chatService.markMessageAsRead(chatId);
			
		} catch (err) {
			console.error('Failed to select chat room:', err);
			setError('채팅방을 선택하는데 실패했습니다.');
		} finally {
			setLoading(false);
		}
	}, []);

	// 메시지 로드 (스크롤 시 이전 메시지 로드)
	const loadMoreMessages = useCallback(async () => {
		if (!currentChatId || !hasMore || loading) return;
		
		try {
			setLoading(true);
			const oldestMessage = messages[0];
			const before = oldestMessage ? new Date(oldestMessage.createdAt).getTime() : undefined;
			
			const response = await chatApi.getChatMessages(currentChatId, 20, before);
			setMessages(prev => [...response.messages, ...prev]);
			setHasMore(response.hasMore);
		} catch (err) {
			console.error('Failed to load more messages:', err);
			setError('메시지를 더 불러오는데 실패했습니다.');
		} finally {
			setLoading(false);
		}
	}, [currentChatId, hasMore, loading, messages]);

	// 메시지 전송
	const sendMessage = useCallback((content: string) => {
		if (!currentChatId) return;
		
		try {
			chatService.sendMessage({
				chatId: currentChatId,
				content
			});
		} catch (err) {
			console.error('Failed to send message:', err);
			setError('메시지 전송에 실패했습니다.');
		}
	}, [currentChatId]);

	// 1:1 채팅방 생성
	const createPrivateChat = useCallback(async (receiverId: number) => {
		try {
			setLoading(true);
			const chatRoom = await chatApi.createPrivateChat(receiverId);
			await loadChatRooms(); // 채팅방 목록 새로고침
			return chatRoom;
		} catch (err) {
			console.error('Failed to create private chat:', err);
			setError('채팅방 생성에 실패했습니다.');
			return null;
		} finally {
			setLoading(false);
		}
	}, [loadChatRooms]);

	// 메시지 읽음 상태 업데이트
	const markAsRead = useCallback((messageId?: string) => {
		if (!currentChatId) return;
		
		chatService.markMessageAsRead(currentChatId, messageId);
	}, [currentChatId]);

	// 채팅방 나가기
	const leaveCurrentChat = useCallback(() => {
		if (currentChatId) {
			chatService.unsubscribeFromChat(currentChatId);
			setCurrentChatId(null);
			setMessages([]);
		}
	}, [currentChatId]);

	return {
		chatRooms,
		messages,
		currentChatId,
		loading,
		error,
		hasMore,
		loadChatRooms,
		selectChatRoom,
		loadMoreMessages,
		sendMessage,
		createPrivateChat,
		markAsRead,
		leaveCurrentChat,
	};
};

export default useChat;