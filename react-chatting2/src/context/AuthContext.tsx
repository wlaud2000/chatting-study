import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { LoginRequest, SignupRequest, User } from '../models/userModel';
import authService from '../services/authService';

// AuthContext의 타입 정의
interface AuthContextType {
	user: User | null;
	loading: boolean;
	error: string | null;
	login: (data: LoginRequest) => Promise<boolean>;
	signup: (data: SignupRequest) => Promise<boolean>;
	logout: () => void;
	isAuthenticated: boolean;
}

// AuthContext 생성
export const AuthContext = createContext<AuthContextType>({
	user: null,
	loading: false,
	error: null,
	login: async () => false,
	signup: async () => false,
	logout: () => {},
	isAuthenticated: false,
});

// AuthProvider props 타입 정의
interface AuthProviderProps {
	children: ReactNode;
}

// AuthProvider 컴포넌트
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	// 앱 시작 시 인증 상태 확인
	useEffect(() => {
        const checkAuth = async () => {
          try {
            setLoading(true);
            // 로컬 스토리지에 토큰이 있는지 확인
            const isLoggedIn = authService.isAuthenticated();
            
            if (isLoggedIn) {
              try {
                // 실제 API를 호출하여 사용자 정보 가져오기
                const userInfo = await authService.getCurrentUser();
                setUser(userInfo);
              } catch (error) {
                // API 호출 실패 시 로그아웃 처리
                console.error('Failed to get user info:', error);
                authService.logout();
                setUser(null);
              }
            } else {
              setUser(null);
            }
          } catch (err) {
            console.error('Authentication check failed:', err);
            setError('인증 확인에 실패했습니다.');
            setUser(null);
          } finally {
            setLoading(false);
          }
        };
      
        checkAuth();
      }, []);

	// 로그인 함수
	const login = async (data: LoginRequest): Promise<boolean> => {
        try {
          setLoading(true);
          setError(null);
          await authService.login(data);
          
          // 로그인 성공 후 사용자 정보 가져오기
          const userInfo = await authService.getCurrentUser();
          setUser(userInfo);
          
          return true;
        } catch (err: any) {
          console.error('Login failed:', err);
          setError(err?.response?.data?.message || '로그인에 실패했습니다.');
          return false;
        } finally {
          setLoading(false);
        }
      };

	// 회원가입 함수
	const signup = async (data: SignupRequest): Promise<boolean> => {
		try {
			setLoading(true);
			setError(null);
			await authService.signup(data);
			return true;
		} catch (err: any) {
			console.error('Signup failed:', err);
			setError(err?.response?.data?.message || '회원가입에 실패했습니다.');
			return false;
		} finally {
			setLoading(false);
		}
	};

	// 로그아웃 함수
	const logout = () => {
		authService.logout();
		setUser(null);
	};

	// Context 값 정의
	const value = {
		user,
		loading,
		error,
		login,
		signup,
		logout,
		isAuthenticated: !!user,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;