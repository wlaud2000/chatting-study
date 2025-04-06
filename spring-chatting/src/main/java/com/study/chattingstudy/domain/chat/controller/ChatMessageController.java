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

        log.info("WebSocket으로 메시지가 전송되었습니다: messageId={}", messageDTO.messageId());
    }

    /**
     * 메시지 읽음 상태 업데이트 처리 (WebSocket 방식으로만 지원)
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

        log.info("WebSocket으로 읽음 상태가 업데이트되었습니다: chatId={}", reqDTO.chatId());
    }
}
