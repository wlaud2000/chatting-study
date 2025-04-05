import axios from 'axios';
import { LoginRequest, LoginResponse, SignupRequest, SignupResponse, User } from '../models/userModel';

const API_BASE_URL = 'http://localhost:8081/api';

// 인증 관련 API 함수
export const authService = {
	// 로그인
	login: async (loginData: LoginRequest): Promise<LoginResponse> => {
		try {
			const response = await axios.post<{ result: LoginResponse }>(
				`${API_BASE_URL}/users/login`,
				loginData
			);
			
			const { accessToken, refreshToken } = response.data.result;
			
			// 토큰을 로컬 스토리지에 저장
			localStorage.setItem('accessToken', accessToken);
			localStorage.setItem('refreshToken', refreshToken);
			
			return response.data.result;
		} catch (error) {
			console.error('Login error:', error);
			throw error;
		}
	},

	// 회원가입
	signup: async (signupData: SignupRequest): Promise<SignupResponse> => {
		try {
			const response = await axios.post<{ result: SignupResponse }>(
				`${API_BASE_URL}/users/signup`,
				signupData
			);
			return response.data.result;
		} catch (error) {
			console.error('Signup error:', error);
			throw error;
		}
	},

    // 유저 정보 조회
    getCurrentUser: async (): Promise<User> => {
        try {
            const response = await axios.get<{ result: User }>(
                `${API_BASE_URL}/users`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
                    }
                }
            );
            return response.data.result;
        } catch (error) {
            console.error('Failed to get current user:', error);
            throw error;
        }
    },

	// 로그아웃
	logout: (): void => {
		localStorage.removeItem('accessToken');
		localStorage.removeItem('refreshToken');
	},

	// 로그인 상태 확인
	isAuthenticated: (): boolean => {
		return !!localStorage.getItem('accessToken');
	},
};

export default authService;