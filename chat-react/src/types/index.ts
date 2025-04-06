export interface User {
    id: number;
    email: string;
    username: string;
}

export interface Message {
    messageId: string;
    content: string;
    senderId: number;
    senderUsername: string;
    createdAt: string;
    read: boolean;
}

export interface ChatRoom {
    chatId: string;
    type: string;
    otherUser: {
        userId: number;
        username: string;
        email: string;
    };
    lastMessage?: {
        messageId: string;
        content: string;
        senderId: number;
        createdAt: string;
        read: boolean;
    };
    unreadCount: number;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface SignupRequest {
    email: string;
    username: string;
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
}

export interface ApiResponse<T> {
    isSuccess: boolean;
    code: string;
    message: string;
    result: T;
}