package com.study.chattingstudy.global.config;

import com.study.chattingstudy.domain.chat.interceptor.JwtWebSocketInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketStompBrokerConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtWebSocketInterceptor jwtWebSocketInterceptor;

    /**
     * 메시지 브로커 설정
     * - /sub 접두사: 구독 주제 설정 (클라이언트가 메시지를 받는 토픽)
     * - /pub 접두사: 메시지 발행 주제 설정 (클라이언트가 메시지를 보내는 대상)
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 구독(sub): 클라이언트가 구독할 수 있는 주제 접두사 - '/user' 추가
        config.enableSimpleBroker("/sub", "/user");

        // 사용자 목적지 프리픽스 설정
        config.setUserDestinationPrefix("/user");

        // 발행(pub): 클라이언트가 메시지를 발행할 수 있는 주제 접두사
        config.setApplicationDestinationPrefixes("/pub");
    }

    /**
     * STOMP 엔드포인트 등록
     * - 클라이언트가 WebSocket 연결을 맺는 엔드포인트 설정
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-stomp")
                .setAllowedOriginPatterns("*")  // 테스트를 위해 모든 오리진 허용
                .withSockJS();

        // 로깅 추가
        System.out.println("WebSocket endpoint /ws-stomp registered");
    }

    /**
     * 클라이언트 인바운드 채널 설정
     * - JWT 인증 인터셉터 등록
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // JwtWebSocketInterceptor를 채널 인터셉터로 등록
        registration.interceptors(jwtWebSocketInterceptor);
    }
}
