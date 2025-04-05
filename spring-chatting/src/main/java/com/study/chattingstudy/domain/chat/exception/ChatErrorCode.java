package com.study.chattingstudy.domain.chat.exception;

import com.study.chattingstudy.global.apiPayload.code.BaseErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ChatErrorCode implements BaseErrorCode {

    // 채팅방 관련 에러
    CHAT_ROOM_NOT_FOUND(HttpStatus.NOT_FOUND, "CHAT404_0", "채팅방을 찾을 수 없습니다."),
    USER_NOT_IN_CHAT_ROOM(HttpStatus.FORBIDDEN, "CHAT403_0", "사용자가 채팅방에 참여하지 않았습니다."),

    // 메시지 관련 에러
    MESSAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "CHAT404_1", "메시지를 찾을 수 없습니다."),
    UNAUTHORIZED_MESSAGE_ACCESS(HttpStatus.FORBIDDEN, "CHAT403_1", "메시지에 접근할 권한이 없습니다."),

    // 기타 에러
    INVALID_CHAT_TYPE(HttpStatus.BAD_REQUEST, "CHAT400_0", "유효하지 않은 채팅 유형입니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
