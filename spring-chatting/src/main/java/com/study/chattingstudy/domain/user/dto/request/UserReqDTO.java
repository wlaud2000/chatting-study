package com.study.chattingstudy.domain.user.dto.request;

public class UserReqDTO {

    public record SignUpReqDTO(
            String email,
            String password,
            String username
    ){
    }

    public record LoginReqDTO(
            String email,
            String password
    ) {
    }
}
