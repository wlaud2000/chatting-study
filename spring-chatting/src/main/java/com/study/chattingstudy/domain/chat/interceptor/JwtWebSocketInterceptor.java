package com.study.chattingstudy.domain.chat.interceptor;

import com.study.chattingstudy.domain.user.entity.User;
import com.study.chattingstudy.domain.user.repository.UserRepository;
import com.study.chattingstudy.domain.user.security.userdetails.CustomUserDetails;
import com.study.chattingstudy.domain.user.security.util.JwtUtil;
import com.study.chattingstudy.global.config.handler.WebSocketSessionRegistry;
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

import java.security.Principal;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtWebSocketInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final WebSocketSessionRegistry sessionRegistry;  // 세션 등록을 위해 추가

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null) {
            // CONNECT 명령에서만 JWT 인증 수행
            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                log.info("WebSocket CONNECT 명령 수신 - JWT 인증 수행");
                authenticateUser(accessor);
            }
            // DISCONNECT 명령 시 세션 제거
            else if (StompCommand.DISCONNECT.equals(accessor.getCommand())) {
                String sessionId = accessor.getSessionId();
                if (sessionId != null) {
                    sessionRegistry.removeSession(sessionId);
                    log.info("WebSocket 연결 종료 - 세션 제거됨: {}", sessionId);
                }
            }
            // 이미 인증된 세션 확인
            else if (StompCommand.SEND.equals(accessor.getCommand()) ||
                    StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                Principal user = accessor.getUser();
                if (user == null) {
                    log.warn("인증되지 않은 WebSocket 명령: {}", accessor.getCommand());
                }
            }
        }
        return message;
    }

    private void authenticateUser(StompHeaderAccessor accessor) {
        // 현재 인증 로직 유지
        String token = extractToken(accessor);

        if (token != null) {
            try {
                jwtUtil.validateToken(token);
                String email = jwtUtil.getEmail(token);

                User user = userRepository.findByEmail(email)
                        .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));

                CustomUserDetails userDetails = new CustomUserDetails(user);
                Authentication auth = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());

                accessor.setUser(auth);

                // 사용자 ID와 세션 정보 등록 - 중요!
                sessionRegistry.registerSession(user.getId().toString(), accessor);

                log.info("WebSocket 연결 인증 성공: userId={}", userDetails.getUserId());
            } catch (Exception e) {
                log.error("WebSocket 연결 인증 실패: {}", e.getMessage());
            }
        }
    }

    private String extractToken(StompHeaderAccessor accessor) {
        String authorization = accessor.getFirstNativeHeader("Authorization");

        if (authorization != null && authorization.startsWith("Bearer ")) {
            return authorization.substring(7);
        }

        String tokenParam = accessor.getFirstNativeHeader("token");
        if (tokenParam != null) {
            return tokenParam;
        }

        return null;
    }
}
