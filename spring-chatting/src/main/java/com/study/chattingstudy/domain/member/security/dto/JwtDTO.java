package com.study.chattingstudy.domain.member.security.dto;

import lombok.Builder;

@Builder
public record JwtDTO (

        String accessToken,

        String refreshToken
){

}
