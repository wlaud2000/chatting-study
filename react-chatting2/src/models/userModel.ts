// 사용자 관련 타입 정의

// 사용자 정보
export interface User {
	id: number;
	email: string;
	username: string;
}

// 로그인 요청 DTO
export interface LoginRequest {
	email: string;
	password: string;
}

// 로그인 응답 DTO
export interface LoginResponse {
	accessToken: string;
	refreshToken: string;
}

// 회원가입 요청 DTO
export interface SignupRequest {
	email: string;
	password: string;
	username: string;
}

// 회원가입 응답 DTO
export interface SignupResponse {
	id: number;
	createdAt: string;
}