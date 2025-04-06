package com.study.chattingstudy.global.config.handler;

import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketSessionRegistry {
    // 사용자 ID -> 웹소켓 세션 저장
    private final Map<String, StompHeaderAccessor> sessions = new ConcurrentHashMap<>();

    // 세션 ID -> 사용자 ID 매핑
    private final Map<String, String> sessionToUserIdMap = new ConcurrentHashMap<>();

    public void registerSession(String userId, StompHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        sessions.put(userId, accessor);
        sessionToUserIdMap.put(sessionId, userId);
    }

    public void removeSession(String sessionId) {
        String userId = sessionToUserIdMap.get(sessionId);
        if (userId != null) {
            sessions.remove(userId);
            sessionToUserIdMap.remove(sessionId);
        }
    }

    public boolean hasActiveSession(String userId) {
        return sessions.containsKey(userId);
    }

    public StompHeaderAccessor getSession(String userId) {
        return sessions.get(userId);
    }
}
