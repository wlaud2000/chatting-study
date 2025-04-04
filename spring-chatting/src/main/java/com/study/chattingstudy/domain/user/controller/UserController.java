package com.study.chattingstudy.domain.user.controller;

import com.study.chattingstudy.domain.user.dto.request.UserReqDTO;
import com.study.chattingstudy.domain.user.dto.response.UserResDTO;
import com.study.chattingstudy.domain.user.service.command.UserCommandService;
import com.study.chattingstudy.global.apiPayload.CustomResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "유저 관련 API", description = "유저 관련 API입니다.")
public class UserController {

    private final UserCommandService userCommandService;

    // 회원가입
    @PostMapping("/signup")
    @Operation(summary = "회원가입", description = "request로 넘긴 email과 password로 유저를 생성합니다.")
    public CustomResponse<UserResDTO.SignUpResDTO> signUp(@RequestBody @Valid UserReqDTO.SignUpReqDTO reqDTO) {
        UserResDTO.SignUpResDTO resDTO = userCommandService.signUp(reqDTO);
        return CustomResponse.onSuccess(HttpStatus.CREATED, resDTO);
    }

    // 로그인(Swagger 용 컨트롤러)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserReqDTO.LoginReqDTO reqDTO) {
        return null;
    }
}
