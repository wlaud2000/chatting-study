// 채팅 관련 타입 정의

// 채팅방 유형
export enum ChatType {
	PRIVATE = 'PRIVATE',
	GROUP = 'GROUP',
}

// 채팅방 참여자 정보
export interface Participant {
	userId: number;
	username: string;
	email: string;
}

// 채팅방 정보
export interface ChatRoom {
	chatId: string;
	type: string;
	name?: string;
	description?: string;
	createdAt: string;
	participants?: Participant[];
	otherUser?: Participant;
	lastMessage?: {
		messageId: string;
		content: string;
		senderId: number;
		createdAt: string;
		read: boolean;
	};
	unreadCount?: number;
}

// 메시지 정보
export interface Message {
	messageId: string;
	content: string;
	senderId: number;
	senderUsername: string;
	createdAt: string;
	read: boolean;
}

// 메시지 전송 요청 DTO
export interface MessageSendRequest {
	chatId: string;
	content: string;
}

// 메시지 읽음 상태 업데이트 요청 DTO
export interface MessageReadRequest {
	chatId: string;
	messageId?: string;
}

// 1:1 채팅방 생성 요청 DTO
export interface PrivateChatCreateRequest {
	receiverId: number;
}