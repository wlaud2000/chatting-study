import axios from 'axios';
import { ChatRoom, Message, MessageSendRequest } from '../models/chatModel';

// API 기본 URL 설정
const API_BASE_URL = 'http://localhost:8081/api';

// axios 인스턴스 생성
const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

// 요청 인터셉터 설정 - JWT 토큰을 헤더에 추가
api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('accessToken'); // 수정된 키 이름
        console.log('토큰 존재 여부:', !!accessToken); // 토큰 존재 여부 확인
        console.log('토큰 값:', accessToken); // 실제 토큰 값 확인 (보안상 위험할 수 있으니 실제 환경에서는 제거)
        
        if (accessToken) {
			config.headers['Authorization'] = `Bearer ${accessToken}`;
			console.log('Authorization 헤더 설정:', `Bearer ${accessToken.substring(0, 10)}...`); // 토큰 일부만 출력
		} else {
			console.warn('토큰이 없어 Authorization 헤더를 설정할 수 없습니다.');
		}
		
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// 채팅 API 함수들
export const chatApi = {
	// 1:1 채팅방 생성 또는 조회
	createPrivateChat: async (receiverId: number): Promise<ChatRoom> => {
		const response = await api.post('/chats/private', { receiverId });
		return response.data.result;
	},

	// 메시지 읽음 상태 업데이트
	markMessageAsRead: async (chatId: string, messageId?: string): Promise<void> => {
		await api.post(`/chats/${chatId}/read`, null, {
			params: { messageId },
		});
	},

	// 사용자의 1:1 채팅방 목록 조회
	getPrivateChats: async (): Promise<ChatRoom[]> => {
		const response = await api.get('/chats/private');
		return response.data.result;
	},

	// 특정 채팅방의 메시지 목록 조회
	getChatMessages: async (chatId: string, limit?: number, before?: number): Promise<{ messages: Message[], hasMore: boolean }> => {
		const response = await api.get(`/chats/${chatId}/messages`, {
			params: { limit, before },
		});
		return response.data.result;
	},
};

export default chatApi;