package com.study.chattingstudy.global.config.handler;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;


/**
 * 채팅방 ID에 따라 WebSocket 세션을 분리 관리하는 Handler
 */
@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    // 채팅방 ID -> (세션 ID -> WebSocketSession)
    private static final Map<String, Map<String, WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

    // 채팅방 ID를 세션에 저장할 키
    private static final String CHAT_ROOM_ID = "chatRoomId";

    /**
     * 연결 성공 시 세션에 채팅방 ID 저장 및 해당 방에 세션 추가
     */
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String roomId = getRoomIdFromUri(session.getUri());

        if (roomId == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        session.getAttributes().put(CHAT_ROOM_ID, roomId); // 세션에 채팅방 ID 저장

        roomSessions.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>()).put(session.getId(), session);

        System.out.println("[+] 연결됨 :: 세션ID=" + session.getId() + ", 채팅방ID=" + roomId);
    }

    /**
     * 메시지를 같은 채팅방에 있는 사용자에게만 전송
     */
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String roomId = (String) session.getAttributes().get(CHAT_ROOM_ID);

        if (roomId == null) return;

        Map<String, WebSocketSession> sessionsInRoom = roomSessions.get(roomId);
        if (sessionsInRoom == null) return;

        for (WebSocketSession otherSession : sessionsInRoom.values()) {
            if (!otherSession.getId().equals(session.getId()) && otherSession.isOpen()) {
                try {
                    otherSession.sendMessage(message);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    /**
     * 연결 종료 시 해당 채팅방의 세션 제거
     */
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws IOException {
        String roomId = (String) session.getAttributes().get(CHAT_ROOM_ID);

        if (roomId != null) {
            Map<String, WebSocketSession> sessionsInRoom = roomSessions.get(roomId);
            if (sessionsInRoom != null) {
                sessionsInRoom.remove(session.getId());

                if (sessionsInRoom.isEmpty()) {
                    roomSessions.remove(roomId);
                }
            }
        }

        System.out.println("[+] 연결 종료 :: 세션ID=" + session.getId() + ", 채팅방ID=" + roomId + ", 상태=" + status);
    }

    /**
     * URI에서 채팅방 ID 추출 (예: /ws/chat/{roomId})
     */
    private String getRoomIdFromUri(URI uri) {
        if (uri == null) return null;

        String path = uri.getPath(); // 예: /ws/chat/abc123
        String[] segments = path.split("/");

        if (segments.length >= 3) {
            return segments[segments.length - 1]; // 마지막 segment가 roomId
        }

        return null;
    }
}

