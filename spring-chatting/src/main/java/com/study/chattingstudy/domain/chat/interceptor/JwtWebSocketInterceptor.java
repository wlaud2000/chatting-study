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
            // 연결 요청 시 Authorization 헤더에서 토큰 추출
            String authorization = accessor.getFirstNativeHeader("Authorization");
            log.info("WebSocket 연결 시도: Authorization 헤더 존재 = {}", (authorization != null));

            if (authorization != null && authorization.startsWith("Bearer ")) {
                String token = authorization.substring(7);

                try {
                    // 토큰 유효성 검증
                    jwtUtil.validateToken(token);

                    // 토큰에서 사용자 식별
                    String email = jwtUtil.getEmail(token);
                    log.info("WebSocket 연결 인증 시도: email={}", email);

                    // 사용자 조회
                    User user = userRepository.findByEmail(email)
                            .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));

                    // CustomUserDetails 생성
                    CustomUserDetails userDetails = new CustomUserDetails(user);

                    // 인증 정보 설정 (Spring Security 컨텍스트와 연동)
                    Authentication auth = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());

                    accessor.setUser(auth);
                    log.info("WebSocket 연결이 인증되었습니다: userId={}", userDetails.getUserId());
                } catch (Exception e) {
                    log.error("WebSocket 연결 인증 실패: {}", e.getMessage());
                }
            } else {
                log.warn("WebSocket 연결에 유효한 토큰이 없습니다");
            }
        }

        return message;
    }
}
