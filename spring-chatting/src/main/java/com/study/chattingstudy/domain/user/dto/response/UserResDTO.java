package com.study.chattingstudy.domain.user.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;

public class UserResDTO {

    @Builder
    public record SignUpResDTO(
            Long id,
            LocalDateTime createdAt
    ){
    }
}
