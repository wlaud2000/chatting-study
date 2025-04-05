package com.study.chattingstudy.domain.chat.dto.request;

public class ChatReqDTO {

    // 1:1 채팅방 생성 요청 DTO
    public record PrivateChatCreateReqDTO(
            Long receiverId // 채팅 상대방의 사용자 ID
    ){
    }

    // 메시지 전송 요청 DTO
    public record MessageSendReqDTO(
            String chatId, // 메시지를 보낼 채팅방 ID
            String content
    ){
    }

    // 메시지 읽음 상태 업데이트 요청 DTO
    public record MessageReadReqDTO(
            String chatId, // 채팅방 ID
            String messageId // 읽은 메시지 ID(null인 경우 모든 메시지를 읽음으로 처리)
    ){
    }
}
