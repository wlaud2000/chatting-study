package com.study.chattingstudy.domain.chat.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public class ChatResDTO {

    // 메시지 응답 DTO
    @Builder
    public record MessageResDTO(
            String messageId,
            String content,
            Long senderId,
            String senderUsername,
            LocalDateTime createdAt,
            boolean read
    ) {
    }

    // 메시지 목록 응답 DTO
    @Builder
    public record MessageListResDTO(
            List<MessageResDTO> messages,
            boolean hasMore
    ) {
    }
}
