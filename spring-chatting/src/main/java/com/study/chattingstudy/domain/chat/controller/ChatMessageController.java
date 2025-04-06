package com.study.chattingstudy.domain.chat.controller;

import com.study.chattingstudy.domain.chat.dto.request.ChatReqDTO;
import com.study.chattingstudy.domain.chat.dto.response.ChatResDTO;
import com.study.chattingstudy.domain.chat.dto.response.ChatRoomResDTO;
import com.study.chattingstudy.domain.chat.service.command.ChatCommandService;
import com.study.chattingstudy.domain.chat.service.query.ChatQueryService;
import com.study.chattingstudy.domain.user.security.userdetails.CustomUserDetails;
import com.study.chattingstudy.global.config.handler.WebSocketSessionRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatMessageController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatCommandService chatCommandService;
    private final ChatQueryService chatQueryService;

    /**
     * 1:1 채팅 메시지 전송 처리
     */
    @MessageMapping("/chat/private")
    public void handlePrivateMessage(ChatReqDTO.MessageSendReqDTO reqDTO, Authentication authentication) {
        log.info("WebSocket으로 메시지 전송 요청 수신: chatId={}", reqDTO.chatId());

        // 인증 정보에서 사용자 정보 추출
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getUserId();

        // 메시지 저장 및 DTO 변환
        ChatResDTO.MessageResDTO messageDTO = chatCommandService.sendMessage(userId, reqDTO);

        // 채팅방 구독자들에게 메시지 전송
        messagingTemplate.convertAndSend("/sub/chat/private/" + reqDTO.chatId(), messageDTO);

        // 채팅방 목록 자동 업데이트 (HTTP 요청 제거)
        refreshChatRooms(userId);

        log.info("WebSocket으로 메시지가 전송되었습니다: messageId={}", messageDTO.messageId());
    }

    /**
     * 메시지 읽음 상태 업데이트 처리
     */
    @MessageMapping("/chat/read")
    public void handleMessageRead(ChatReqDTO.MessageReadReqDTO reqDTO, Authentication authentication) {
        log.info("WebSocket으로 메시지 읽음 상태 업데이트 요청 수신: chatId={}, messageId={}",
                reqDTO.chatId(), reqDTO.messageId());

        // 인증 정보에서 사용자 정보 추출
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getUserId();

        // 읽음 상태 업데이트
        chatCommandService.markMessageAsRead(userId, reqDTO);

        // 읽음 상태 알림을 전송
        messagingTemplate.convertAndSend("/sub/chat/private/" + reqDTO.chatId() + "/read", reqDTO);

        // 채팅방 목록 자동 업데이트 (HTTP 요청 제거)
        refreshChatRooms(userId);

        log.info("WebSocket으로 읽음 상태가 업데이트되었습니다: chatId={}", reqDTO.chatId());
    }

    /**
     * 채팅방 목록 조회 요청 처리 (웹소켓으로 처리)
     */
    @MessageMapping("/chat/rooms")
    public void getChatRooms(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getUserId();

        refreshChatRooms(userId);
    }

    /**
     * 채팅방 목록 갱신 및 전송
     */
    private void refreshChatRooms(Long userId) {
        List<ChatRoomResDTO.ChatRoomListResDTO> chatRooms =
                chatQueryService.getUserPrivateChats(userId);

        // 사용자별 채팅방 목록 전용 주제로 전송
        messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/sub/chat/rooms",
                chatRooms
        );
    }

    /**
     * 새 채팅방 생성 요청 처리 (웹소켓으로 처리)
     */
    @MessageMapping("/chat/create")
    public void createChatRoom(ChatReqDTO.PrivateChatCreateReqDTO reqDTO, Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getUserId();

        // 채팅방 생성
        ChatRoomResDTO.ChatRoomResponseDTO chatRoom =
                chatCommandService.createOrGetPrivateChat(userId, reqDTO);

        // 생성된 채팅방 정보 전송
        messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/sub/chat/room/created",
                chatRoom
        );

        // 채팅방 목록 갱신
        refreshChatRooms(userId);

        // 상대방에게도 채팅방 목록 갱신 알림
        refreshChatRooms(reqDTO.receiverId());
    }
}
