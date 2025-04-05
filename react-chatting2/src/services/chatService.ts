import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { ChatRoom, Message, MessageSendRequest } from '../models/chatModel';
import chatApi from '../api/chatApi';

class ChatService {
	private stompClient: Client | null = null;
	private messageCallbacks: Map<string, (message: Message) => void> = new Map();
	private readStatusCallbacks: Map<string, (messageId: string) => void> = new Map();

	// STOMP 클라이언트 초기화
	initializeStompClient(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.stompClient && this.stompClient.connected) {
				console.log('STOMP client already connected');
				resolve();
				return;
			}

            // 토큰 확인 - 연결 직전에 최신 토큰을 가져옴
            const accessToken = localStorage.getItem('accessToken');
            console.log('WebSocket init - token exists:', !!accessToken);
            
            if (!accessToken) {
                console.error('No access token available for WebSocket connection');
                reject(new Error('Authentication required for WebSocket connection'));
                return;
            }

			// STOMP 클라이언트 생성
			this.stompClient = new Client({
				// SockJS를 사용한 WebSocket 연결 (수정됨)
				webSocketFactory: () => {
                    // URL에 토큰을 쿼리 파라미터로 추가
                    const url = `http://localhost:8081/ws-stomp?token=${accessToken}`;
                    console.log('WebSocket 연결 URL(토큰 포함):', url);
                    return new SockJS(url);
                },
				// Heartbeat 설정
				heartbeatIncoming: 4000,
				heartbeatOutgoing: 4000,
				// 재연결 설정 
				reconnectDelay: 5000,
				
                // 연결 헤더에 Authorization 토큰 추가 (STOMP 연결 시 사용)
                connectHeaders: {
                    'Authorization': `Bearer ${accessToken}`
                },
				
				// 연결 성공 시 호출되는 콜백
				onConnect: () => {
					console.log('Connected to STOMP server');
					resolve();
				},
				
				// 연결 오류 시 호출되는 콜백
				onStompError: (frame) => {
                    console.error('STOMP error:', frame.headers['message'], frame.body);
                    // 인증 관련 오류인지 확인
                    if (frame.headers['message'] && frame.headers['message'].includes('Unauthorized')) {
                        console.error('Authentication error with WebSocket');
                    }
                    reject(new Error(`STOMP error: ${frame.headers['message']}`));
                },
				
				// WebSocket 오류 시 호출되는 콜백
				onWebSocketError: (event) => {
					console.error('WebSocket error:', event);
					reject(new Error('WebSocket connection error'));
				}
			});

			// 클라이언트 활성화
			this.stompClient.activate();
		});
	}

	// 특정 채팅방 구독
	subscribeToChat(chatId: string, onMessageReceived: (message: Message) => void): void {
		if (!this.stompClient || !this.stompClient.connected) {
			console.error('STOMP client not connected');
			return;
		}

		// 채팅 메시지 구독
		this.stompClient.subscribe(`/sub/chat/private/${chatId}`, (message: IMessage) => {
			const receivedMessage = JSON.parse(message.body) as Message;
			onMessageReceived(receivedMessage);
		});

		// 콜백 저장
		this.messageCallbacks.set(chatId, onMessageReceived);
	}

	// 읽음 상태 업데이트 구독
	subscribeToReadStatus(chatId: string, onReadStatusUpdate: (messageId: string) => void): void {
		if (!this.stompClient || !this.stompClient.connected) {
			console.error('STOMP client not connected');
			return;
		}

		// 읽음 상태 업데이트 구독
		this.stompClient.subscribe(`/sub/chat/private/${chatId}/read`, (message: IMessage) => {
			const readStatus = JSON.parse(message.body);
			if (readStatus.messageId) {
				onReadStatusUpdate(readStatus.messageId);
			}
		});

		// 콜백 저장
		this.readStatusCallbacks.set(chatId, onReadStatusUpdate);
	}

	// 메시지 전송
	sendMessage(request: MessageSendRequest): void {
		if (!this.stompClient || !this.stompClient.connected) {
			console.error('STOMP client not connected');
			return;
		}

		// 메시지 전송
		this.stompClient.publish({
			destination: '/pub/chat/private',
			body: JSON.stringify(request)
		});
	}

	// 메시지 읽음 상태 업데이트
	markMessageAsRead(chatId: string, messageId?: string): void {
		if (!this.stompClient || !this.stompClient.connected) {
			console.error('STOMP client not connected');
			return;
		}

		// 읽음 상태 업데이트 메시지 발행
		this.stompClient.publish({
			destination: '/pub/chat/read',
			body: JSON.stringify({ chatId, messageId })
		});

		// REST API를 통해서도 읽음 상태 업데이트 (서버에 영구 저장)
		chatApi.markMessageAsRead(chatId, messageId).catch(err => {
			console.error('Error marking message as read:', err);
		});
	}

	// 채팅방 구독 해제
	unsubscribeFromChat(chatId: string): void {
		this.messageCallbacks.delete(chatId);
		this.readStatusCallbacks.delete(chatId);
		// STOMP 클라이언트는 자동으로 구독을 관리하므로 별도 해제 코드는 필요 없음
	}

	// STOMP 클라이언트 연결 종료
	disconnect(): void {
		if (this.stompClient && this.stompClient.connected) {
			this.stompClient.deactivate();
			this.stompClient = null;
			this.messageCallbacks.clear();
			this.readStatusCallbacks.clear();
			console.log('Disconnected from STOMP server');
		}
	}

	// 현재 연결 상태 확인
	isConnected(): boolean {
		return !!this.stompClient && this.stompClient.connected;
	}
}

// 싱글톤 인스턴스 생성 및 내보내기
export const chatService = new ChatService();
export default chatService;