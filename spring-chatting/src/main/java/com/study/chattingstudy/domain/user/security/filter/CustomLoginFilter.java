package com.study.chattingstudy.domain.user.security.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.study.chattingstudy.domain.user.dto.request.UserReqDTO;
import com.study.chattingstudy.domain.user.security.dto.JwtDTO;
import com.study.chattingstudy.domain.user.security.exception.SecurityErrorCode;
import com.study.chattingstudy.domain.user.security.userdetails.CustomUserDetails;
import com.study.chattingstudy.domain.user.security.util.JwtUtil;
import com.study.chattingstudy.global.apiPayload.CustomResponse;
import com.study.chattingstudy.global.utils.HttpResponseUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;

@Slf4j
@RequiredArgsConstructor
public class CustomLoginFilter extends UsernamePasswordAuthenticationFilter {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @Override
    public Authentication attemptAuthentication(@NonNull HttpServletRequest request,
                                                @NonNull HttpServletResponse response) throws AuthenticationException {

        log.info("[ Login Filter ]  로그인 시도: Custom Login Filter 작동 ");
        ObjectMapper objectMapper = new ObjectMapper();
        UserReqDTO.LoginReqDTO requestBody;

        try {
            // Request Body를 읽어 DTO로 변환
            requestBody = objectMapper.readValue(request.getInputStream(), UserReqDTO.LoginReqDTO.class);
        } catch (IOException e) {
            log.error("[ Login Filter ] Request Body 파싱 중 IOException 발생: {}", e.getMessage());
            throw new AuthenticationServiceException("Request Body 파싱 중 오류가 발생하였습니다.");
        }

        // Request Body에서 이메일과 비밀번호 추출
        String email = requestBody.email();
        String password = requestBody.password();

        log.info("[ Login Filter ] Email ---> {} ", email);
        log.info("[ Login Filter ] Password ---> {} ", password);

        // UserNamePasswordToken 생성 (인증용 객체)
        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(email, password, null);

        log.info("[ Login Filter ] 인증용 객체 UsernamePasswordAuthenticationToken 이 생성되었습니다. ");
        log.info("[ Login Filter ] 인증을 시도합니다.");

        // 인증 시도
        return authenticationManager.authenticate(authToken);
    }

    @Override
    protected void successfulAuthentication(@NonNull HttpServletRequest request,
                                            @NonNull HttpServletResponse response,
                                            @NonNull FilterChain chain,
                                            @NonNull Authentication authentication) throws IOException {

        log.info("[ Login Filter ] 로그인에 성공하였습니다.");

        CustomUserDetails customUserDetails = (CustomUserDetails) authentication.getPrincipal();

        // JWT 토큰 생성
        JwtDTO jwtDto = JwtDTO.builder()
                .accessToken(jwtUtil.createJwtAccessToken(customUserDetails))
                .refreshToken(jwtUtil.createJwtRefreshToken(customUserDetails))
                .build();

        // 성공 응답 처리
        HttpResponseUtil.setSuccessResponse(response, HttpStatus.OK, jwtDto);
    }

    @Override
    protected void unsuccessfulAuthentication(@NonNull HttpServletRequest request,
                                              @NonNull HttpServletResponse response,
                                              @NonNull AuthenticationException failed) throws IOException {

        log.info("[ Login Filter ] 로그인에 실패하였습니다.");

        SecurityErrorCode errorCode = getErrorCode(failed);

        log.error("[ Login Filter ] 인증 실패: {}", errorCode.getMessage());

        // 실패 응답 처리
        HttpResponseUtil.setErrorResponse(response, errorCode.getHttpStatus(),
                CustomResponse.onFailure(errorCode.getCode(), errorCode.getMessage()));
    }

    private SecurityErrorCode getErrorCode(AuthenticationException failed) {
        if (failed instanceof BadCredentialsException) {
            return SecurityErrorCode.BAD_CREDENTIALS;
        } else if (failed instanceof LockedException || failed instanceof DisabledException) {
            return SecurityErrorCode.FORBIDDEN;
        } else if (failed instanceof UsernameNotFoundException) {
            return SecurityErrorCode.USER_NOT_FOUND;
        } else if (failed instanceof AuthenticationServiceException) {
            return SecurityErrorCode.INTERNAL_SECURITY_ERROR;
        } else {
            return SecurityErrorCode.UNAUTHORIZED;
        }
    }
}
