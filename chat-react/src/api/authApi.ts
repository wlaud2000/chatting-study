import { ApiResponse, AuthResponse, LoginRequest, SignupRequest, User } from '../types';
import ApiClient from './apiClient';

const apiClient = ApiClient.getInstance();

export const login = async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    return await apiClient.post<ApiResponse<AuthResponse>>('/users/login', data);
};

export const signup = async (data: SignupRequest): Promise<ApiResponse<any>> => {
    return await apiClient.post<ApiResponse<any>>('/users/signup', data);
};

export const fetchUserInfo = async (): Promise<ApiResponse<User>> => {
    return await apiClient.get<ApiResponse<User>>('/users');
};
