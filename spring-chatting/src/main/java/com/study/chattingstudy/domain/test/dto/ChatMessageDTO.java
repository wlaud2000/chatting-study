package com.study.chattingstudy.domain.test.dto;

import lombok.Data;

/**
 * 구독자와 수신자 간의 메시지를 주고받는 형태를 구성한 Object입니다.
 *
 * @author : jonghoon
 * @fileName : ChatMessage
 * @since : 8/16/24
 */
@Data
public class ChatMessageDTO {
    private String content;
    private String sender;

    public ChatMessageDTO(String content, String sender) {
        this.content = content;
        this.sender = sender;
    }
}
