package com.study.chattingstudy.domain.chat.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.Set;

public class ChatRoomResDTO {

    // 채팅방 상세 정보 응답 DTO
    @Builder
    public record ChatRoomResponseDTO(
            String chatId,
            String type,
            String name,
            String description,
            LocalDateTime createdAt,
            Set<ParticipantDTO> participants
    ) {
        // 참여자 정보 DTO
        @Builder
        public record ParticipantDTO(
                Long userId,
                String username,
                String email
        ){
        }
    }

    // 채팅방 목록 조회 응답 DTO
    @Builder
    public record ChatRoomListResDTO(
            String chatId,
            String type,
            ParticipantDTO otherUser,
            LastMessageDTO lastMessage,
            int unreadCount
    ){
        // 참여자 정보 DTO
        @Builder
        public record ParticipantDTO(
                Long userId,
                String username,
                String email
        ){
        }

        // 마지막 메시지 정보 DTO
        @Builder
        public record LastMessageDTO(
                String messageId,       // 메시지 ID
                String content,         // 메시지 내용
                Long senderId,          // 발신자 ID
                LocalDateTime createdAt, // 메시지 생성 시간
                boolean read            // 읽음 여부
        ) {
        }
    }

    @Builder
    public record ChatRoomNotificationDTO(
            String chatId,
            String type,
            Long creatorId,
            String creatorUsername,
            LocalDateTime createdAt
    ) {
    }
}
