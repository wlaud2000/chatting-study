package com.study.chattingstudy.domain.user.controller;

import com.study.chattingstudy.domain.user.dto.request.UserReqDTO;
import com.study.chattingstudy.domain.user.dto.response.UserResDTO;
import com.study.chattingstudy.domain.user.security.annotation.CurrentUser;
import com.study.chattingstudy.domain.user.security.userdetails.AuthUser;
import com.study.chattingstudy.domain.user.service.command.UserCommandService;
import com.study.chattingstudy.domain.user.service.query.UserQueryService;
import com.study.chattingstudy.global.apiPayload.CustomResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "유저 관련 API", description = "유저 관련 API입니다.")
public class UserController {

    private final UserCommandService userCommandService;
    private final UserQueryService userQueryService;

    // 회원가입
    @PostMapping("/signup")
    @Operation(summary = "회원가입", description = "request로 넘긴 email과 password로 유저를 생성합니다.")
    public CustomResponse<UserResDTO.SignUpResDTO> signUp(@RequestBody @Valid UserReqDTO.SignUpReqDTO reqDTO) {
        UserResDTO.SignUpResDTO resDTO = userCommandService.signUp(reqDTO);
        return CustomResponse.onSuccess(HttpStatus.CREATED, resDTO);
    }

    // 로그인(Swagger 용 컨트롤러)
    @PostMapping("/login")
    @Operation(summary = "로그인", description = "request로 넘긴 email과 password로 로그인을 시도합니다.")
    public ResponseEntity<?> login(@RequestBody UserReqDTO.LoginReqDTO reqDTO) {
        return null;
    }


    @GetMapping("")
    @Operation(summary = "유저 정보 조회", description = "현재 사용자의 유저 정보를 조회합니다.")
    public CustomResponse<UserResDTO.UserResponseDTO> getUserInfo(@CurrentUser AuthUser authUser) {
        UserResDTO.UserResponseDTO resDTO = userQueryService.getUserInfo(authUser.getUserId());
        return CustomResponse.onSuccess(resDTO);
    }
}
