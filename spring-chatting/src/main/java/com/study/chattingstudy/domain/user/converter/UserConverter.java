package com.study.chattingstudy.domain.user.converter;

import com.study.chattingstudy.domain.user.dto.request.UserReqDTO;
import com.study.chattingstudy.domain.user.dto.response.UserResDTO;
import com.study.chattingstudy.domain.user.entity.User;
import com.study.chattingstudy.domain.user.enums.UserRole;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;

@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserConverter {

    // User -> SignUpResDTO
    public static UserResDTO.SignUpResDTO toSignUpResDTO(User user) {
        return UserResDTO.SignUpResDTO.builder()
                .id(user.getId())
                .createdAt(user.getCreatedAt())
                .build();
    }

    // SignUpReqDTO -> User
    public static User toUser(UserReqDTO.SignUpReqDTO reqDTO, PasswordEncoder passwordEncoder) {
        return User.builder()
                .email(reqDTO.email())
                .username(reqDTO.username())
                .password(passwordEncoder.encode(reqDTO.password()))
                .roles(UserRole.USER)
                .deletedAt(null)
                .build();
    }

    // User -> UserResponseDTO
    public static UserResDTO.UserResponseDTO toUserResponseDTO(User user) {
        return UserResDTO.UserResponseDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .build();
    }
}
