package com.study.chattingstudy.domain.user.service.command;

import com.study.chattingstudy.domain.user.converter.UserConverter;
import com.study.chattingstudy.domain.user.dto.request.UserReqDTO;
import com.study.chattingstudy.domain.user.dto.response.UserResDTO;
import com.study.chattingstudy.domain.user.entity.User;
import com.study.chattingstudy.domain.user.exception.UserErrorCode;
import com.study.chattingstudy.domain.user.repository.UserRepository;
import com.study.chattingstudy.global.apiPayload.exception.CustomException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class UserCommandService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; //비밀번호 암호화

    // 회원가입
    public UserResDTO.SignUpResDTO signUp(UserReqDTO.SignUpReqDTO reqDTO) {

        // 이메일 중복 확인
        if(userRepository.existsByEmail(reqDTO.email())) {
            throw new CustomException(UserErrorCode.EMAIL_ALREADY_EXISTS);
        }

        // User 엔티티 생성 및 저장
        User user = UserConverter.toUser(reqDTO, passwordEncoder);

        User savedUser = userRepository.save(user);

        // 저장된 User 엔티티를 DTO로 변환하여 반환
        return UserConverter.toSignUpResDTO(savedUser);
    }
}
