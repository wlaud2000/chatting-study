package com.study.chattingstudy.domain.user.service.query;

import com.study.chattingstudy.domain.user.converter.UserConverter;
import com.study.chattingstudy.domain.user.dto.response.UserResDTO;
import com.study.chattingstudy.domain.user.entity.User;
import com.study.chattingstudy.domain.user.exception.UserErrorCode;
import com.study.chattingstudy.domain.user.exception.UserException;
import com.study.chattingstudy.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserQueryService {

    private final UserRepository userRepository;

    public UserResDTO.UserResponseDTO getUserInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND_404));

        return UserConverter.toUserResponseDTO(user);
    }
}
