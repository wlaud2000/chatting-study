package com.study.chattingstudy.domain.user.dto.response;

import java.time.LocalDateTime;

public class UserResDTO {

    public record SignUpResDTO(
            Long id,
            LocalDateTime createdAt
    ){
    }
}
