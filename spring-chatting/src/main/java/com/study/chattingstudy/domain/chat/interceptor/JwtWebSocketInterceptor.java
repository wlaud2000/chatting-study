package com.study.chattingstudy.domain.chat.interceptor;

import com.study.chattingstudy.domain.user.entity.User;
import com.study.chattingstudy.domain.user.repository.UserRepository;
import com.study.chattingstudy.domain.user.security.userdetails.CustomUserDetails;
import com.study.chattingstudy.domain.user.security.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtWebSocketInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    /**
     * 웹소켓 메시지 전송 전 호출되는 메서드
     * - STOMP CONNECT 명령 시 토큰 유효성 검증 및 인증 정보 설정
     */
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // 1. 헤더에서 토큰 추출 시도
            String authorization = accessor.getFirstNativeHeader("Authorization");
            String token = null;

            // 헤더에서 토큰 추출
            if (authorization != null && authorization.startsWith("Bearer ")) {
                token = authorization.substring(7);
                log.info("WebSocket 연결: Authorization 헤더에서 토큰 추출 성공");
            }
            // 2. URL 파라미터에서 토큰 추출 시도
            else {
                String tokenParam = accessor.getFirstNativeHeader("token");
                if (tokenParam == null) {
                    // SockJS 핸드셰이크의 경우 세션 속성에서 토큰 확인
                    // 이 부분은 SockJS의 첫 번째 핸드셰이크 요청에는 적용되지 않음
                    log.warn("WebSocket 연결: 헤더나 URL에서 토큰을 찾을 수 없음");
                } else {
                    token = tokenParam;
                    log.info("WebSocket 연결: URL 파라미터에서 토큰 추출 성공");
                }
            }

            // 토큰이 추출되었다면 검증 및 인증 진행
            if (token != null) {
                try {
                    jwtUtil.validateToken(token);
                    String email = jwtUtil.getEmail(token);
                    log.info("WebSocket 연결 인증 시도: email={}", email);

                    User user = userRepository.findByEmail(email)
                            .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));

                    CustomUserDetails userDetails = new CustomUserDetails(user);
                    Authentication auth = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());

                    accessor.setUser(auth);
                    log.info("WebSocket 연결 인증 성공: userId={}", userDetails.getUserId());
                } catch (Exception e) {
                    log.error("WebSocket 연결 인증 실패: {}", e.getMessage());
                }
            }
        }

        return message;
    }
}
