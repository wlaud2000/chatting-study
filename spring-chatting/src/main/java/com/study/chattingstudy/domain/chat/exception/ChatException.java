package com.study.chattingstudy.domain.chat.exception;

import com.study.chattingstudy.global.apiPayload.code.BaseErrorCode;
import com.study.chattingstudy.global.apiPayload.exception.CustomException;
import lombok.Getter;

@Getter
public class ChatException extends CustomException {

    public ChatException(BaseErrorCode errorCode) {
        super(errorCode);
    }
}
