// 날짜 관련 유틸리티 함수

/**
 * 상대적인 시간 표시 (예: '방금 전', '1시간 전', '어제' 등)
 * @param dateString ISO 형식의 날짜 문자열
 * @returns 상대적 시간 문자열
 */
export const getRelativeTime = (dateString: string): string => {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHour = Math.floor(diffMin / 60);
	const diffDay = Math.floor(diffHour / 24);
	
	if (diffSec < 60) {
		return '방금 전';
	} else if (diffMin < 60) {
		return `${diffMin}분 전`;
	} else if (diffHour < 24) {
		return `${diffHour}시간 전`;
	} else if (diffDay === 1) {
		return '어제';
	} else if (diffDay < 7) {
		return `${diffDay}일 전`;
	} else {
		// 일주일 이상이면 날짜 표시
		return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
	}
};

/**
 * 채팅 목록에서 사용할 시간 형식
 * @param dateString ISO 형식의 날짜 문자열
 * @returns 채팅 목록에 표시할 형식의 시간 문자열
 */
export const formatChatListTime = (dateString: string): string => {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	
	if (diffDays === 0) {
		// 오늘이면 시간만 표시
		return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
	} else if (diffDays < 7) {
		// 일주일 이내면 요일 표시
		return date.toLocaleDateString('ko-KR', { weekday: 'short' });
	} else {
		// 일주일 이상이면 월/일 표시
		return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
	}
};

/**
 * 채팅 메시지에서 사용할 시간 형식 (시:분)
 * @param dateString ISO 형식의 날짜 문자열
 * @returns HH:MM 형식의 시간 문자열
 */
export const formatMessageTime = (dateString: string): string => {
	const date = new Date(dateString);
	return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
};

/**
 * 채팅 메시지 그룹에서 날짜 구분선용 날짜 형식
 * @param dateString ISO 형식의 날짜 문자열
 * @returns YYYY년 M월 D일 형식의 날짜 문자열
 */
export const formatMessageDate = (dateString: string): string => {
	const date = new Date(dateString);
	return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
};

/**
 * 두 날짜가 같은 날인지 확인
 * @param date1 첫 번째 날짜
 * @param date2 두 번째 날짜
 * @returns 같은 날이면 true, 아니면 false
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	);
};