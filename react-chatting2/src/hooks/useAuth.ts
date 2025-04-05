import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginRequest, SignupRequest, User } from '../models/userModel';
import authService from '../services/authService';

export const useAuth = () => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

	// 로그인 상태 확인
	useEffect(() => {
		const checkAuth = async () => {
            try {
                setLoading(true);
                // 명확한 토큰 존재 여부 확인
                const token = localStorage.getItem('accessToken');
                console.log('Auth check - accessToken exists:', !!token);
                
                // 토큰이 없으면 인증되지 않은 상태로 설정
                if (!token) {
                    console.log('No token found, setting user to null');
                    setUser(null);
                    setLoading(false);
                    return;
                }
                
                const isLoggedIn = authService.isAuthenticated();
                console.log('Auth check - isAuthenticated:', isLoggedIn);
                
                if (isLoggedIn) {
                    try {
                        // 사용자 정보 가져오기
                        const userInfo = await authService.getCurrentUser();
                        console.log('Current user fetched:', userInfo);
                        setUser(userInfo);
                    } catch (userError) {
                        console.error('Failed to fetch user info:', userError);
                        // 사용자 정보를 가져오는데 실패해도 토큰이 있으면 인증 상태 유지
                        // 임시 사용자 객체 설정 (필요한 경우)
                        setUser({ id: 0, email: '', username: '' } as User);
                    }
                } else {
                    console.log('Not authenticated, user set to null');
                    setUser(null);
                }
            } catch (err) {
                console.error('Authentication check failed:', err);
                setError('인증 확인에 실패했습니다.');
                setUser(null);
                // 토큰이 만료되었거나 유효하지 않은 경우 로그아웃 처리
                authService.logout();
            } finally {
                setLoading(false);
            }
        };

		checkAuth();
        
        // 로컬 스토리지 변경 감지
        const handleStorageChange = () => {
            console.log('LocalStorage changed, checking auth again');
            checkAuth();
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
	}, []);

	// 로그인 함수
	const login = async (data: LoginRequest) => {
        try {
            setLoading(true);
            setError(null);
            await authService.login(data);
            
            // 로그인 성공 후 토큰 확인
            const token = localStorage.getItem('accessToken');
            console.log('Login successful, token stored:', !!token);
            
            // 로그인 성공 후 사용자 정보 API 호출
            const userInfo = await authService.getCurrentUser();
            setUser(userInfo);
            
            navigate('/chats');
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
	const signup = async (data: SignupRequest) => {
		try {
			setLoading(true);
			setError(null);
			await authService.signup(data);
			navigate('/login');
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
		navigate('/login');
	};

	return {
		user,
		loading,
		error,
		login,
		signup,
		logout,
		// 명확한 인증 상태 반환
		isAuthenticated: !!user && !!localStorage.getItem('accessToken'),
	};
};

export default useAuth;