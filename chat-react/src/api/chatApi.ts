import { ApiResponse, ChatRoom, Message } from '../types';
import ApiClient from './apiClient';

const apiClient = ApiClient.getInstance();

export const fetchChatRooms = async (): Promise<ApiResponse<ChatRoom[]>> => {
    return await apiClient.get<ApiResponse<ChatRoom[]>>('/chats/private');
};

export const fetchMessages = async (
    chatId: string,
    before?: number,
    limit: number = 50
): Promise<ApiResponse<{ messages: Message[], hasMore: boolean }>>  => {
    let url = `/chats/${chatId}/messages?limit=${limit}`;
    if (before) {
        url += `&before=${before}`;
    }
    return await apiClient.get<ApiResponse<{ messages: Message[], hasMore: boolean }>>(url);
};

export const createPrivateChat = async (receiverId: number): Promise<ApiResponse<any>> => {
    return await apiClient.post<ApiResponse<any>>('/chats/private', { receiverId });
};

export const markMessagesAsRead = async (chatId: string, messageId?: string): Promise<ApiResponse<void>> => {
    const url = messageId
        ? `/chats/${chatId}/read?messageId=${messageId}`
        : `/chats/${chatId}/read`;
    return await apiClient.post<ApiResponse<void>>(url);
};