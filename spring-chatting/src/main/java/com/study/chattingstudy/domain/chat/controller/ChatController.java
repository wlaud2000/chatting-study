package com.study.chattingstudy.domain.chat.controller;

import com.study.chattingstudy.domain.chat.dto.request.ChatReqDTO;
import com.study.chattingstudy.domain.chat.dto.response.ChatResDTO;
import com.study.chattingstudy.domain.chat.dto.response.ChatRoomResDTO;
import com.study.chattingstudy.domain.chat.service.command.ChatCommandService;
import com.study.chattingstudy.domain.chat.service.query.ChatQueryService;
import com.study.chattingstudy.domain.user.security.annotation.CurrentUser;
import com.study.chattingstudy.domain.user.security.userdetails.AuthUser;
import com.study.chattingstudy.domain.user.security.userdetails.CustomUserDetails;
import com.study.chattingstudy.global.apiPayload.CustomResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "채팅 관련 API", description = "채팅 관련 API입니다.")
public class ChatController {

    private final ChatCommandService chatCommandService;
    private final ChatQueryService chatQueryService;

    /**
     * 1:1 채팅방 생성 API
     * - 새로운 1:1 채팅방을 생성하거나 기존 채팅방을 조회
     */
    @PostMapping("/private")
    @Operation(summary = "1:1 채팅방 생성", description = "다른 사용자와의 1:1 채팅방을 생성하거나 기존 채팅방을 반환합니다.")
    public CustomResponse<ChatRoomResDTO.ChatRoomResponseDTO> createPrivateChat(
            @CurrentUser AuthUser authUser,
            @RequestBody ChatReqDTO.PrivateChatCreateReqDTO reqDTO) {
        log.info("1:1 채팅방 생성 요청: userId={}, receiverId={}", authUser.getUserId(), reqDTO.receiverId());
        ChatRoomResDTO.ChatRoomResponseDTO resDTO = chatCommandService.createOrGetPrivateChat(authUser.getUserId(), reqDTO);

        return CustomResponse.onSuccess(HttpStatus.CREATED, resDTO);
    }

    /**
     * 채팅 메시지 읽음 상태 업데이트 API
     * - 특정 채팅방의 특정 메시지 또는 모든 메시지를 읽음 상태로 변경
     */
    @PostMapping("/{chatId}/read")
    @Operation(summary = "메시지 읽음 상태 업데이트", description = "특정 채팅방의 메시지를 읽음 상태로 변경합니다.")
    public CustomResponse<Void> markMessagesAsRead(@CurrentUser CustomUserDetails userDetails,
                                                   @PathVariable String chatId,
                                                   @RequestParam(required = false) String messageId) {
        log.info("메시지 읽음 상태 업데이트 요청: userId={}, chatId={}, messageId={}", userDetails.getUserId(), chatId, messageId);

        ChatReqDTO.MessageReadReqDTO reqDTO = new ChatReqDTO.MessageReadReqDTO(chatId, messageId);
        chatCommandService.markMessageAsRead(userDetails.getUserId(), reqDTO);

        return CustomResponse.onSuccess(HttpStatus.OK, null);
    }

    /**
     * 1:1 채팅방 목록 조회 API
     * - 사용자가 참여한 모든 1:1 채팅방 목록 조회
     */
    @GetMapping("/private")
    @Operation(summary = "1:1 채팅방 목록 조회", description = "사용자의 모든 1:1 채팅방 목록을 조회합니다.")
    public CustomResponse<List<ChatRoomResDTO.ChatRoomListResDTO>> getPrivateChats(@CurrentUser AuthUser authUser) {
        log.info("1:1 채팅방 목록 조회 요청: userId={}", authUser.getUserId());
        List<ChatRoomResDTO.ChatRoomListResDTO> resDTO = chatQueryService.getUserPrivateChats(
                authUser.getUserId());

        return CustomResponse.onSuccess(resDTO);
    }

    /**
     * 채팅 메시지 목록 조회 API
     * - 특정 채팅방의 메시지 목록 조회 (페이징 지원)
     */
    @GetMapping("/{chatId}/messages")
    @Operation(summary = "채팅 메시지 목록 조회", description = "특정 채팅방의 메시지 목록을 조회합니다.")
    public CustomResponse<ChatResDTO.MessageListResDTO> getChatMessages(@CurrentUser AuthUser authUser,
                                                                        @PathVariable String chatId,
                                                                        @RequestParam(required = false) Integer limit,
                                                                        @RequestParam(required = false) Long before) {
        log.info("채팅 메시지 목록 조회 요청: userId={}, chatId={}, limit={}, before={}", authUser.getUserId(), chatId, limit, before);

        ChatResDTO.MessageListResDTO resDTO = chatQueryService.getChatMessages(
                authUser.getUserId(), chatId, limit, before);

        return CustomResponse.onSuccess(resDTO);
    }

}
