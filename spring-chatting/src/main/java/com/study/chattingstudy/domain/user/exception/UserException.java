package com.study.chattingstudy.domain.user.exception;

import com.study.chattingstudy.global.apiPayload.code.BaseErrorCode;
import com.study.chattingstudy.global.apiPayload.exception.CustomException;
import lombok.Getter;

@Getter
public class UserException extends CustomException {

    public UserException(BaseErrorCode errorCode) {
        super(errorCode);
    }
}
