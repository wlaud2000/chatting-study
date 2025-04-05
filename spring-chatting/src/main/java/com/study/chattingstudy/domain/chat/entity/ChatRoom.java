package com.study.chattingstudy.domain.chat.entity;

import com.study.chattingstudy.domain.chat.enums.ChatType;
import com.study.chattingstudy.domain.user.entity.User;
import com.study.chattingstudy.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "chat_rooms")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
@Getter
public class ChatRoom extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_user_id")
    private User createdUser;

    @Column(name = "chat_id", unique = true, nullable = false)
    private String chatId; // UUID 등을 사용한 고유 식별자(채팅방 ID)

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private ChatType type;

    @Column(name = "name")
    private String name;

    @Column(name = "description")
    private String description;

    @OneToMany(mappedBy = "chatRoom", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChatRoomParticipant> participants = new ArrayList<>();

    // 참여자 추가 메서드
    public void addParticipant(User user, boolean isAdmin) {
        // 이미 참여자인 경우 추가하지 않음
        if (hasParticipant(user)) {
            return;
        }

        // 새로운 참여자 정보 생성
        ChatRoomParticipant participant = ChatRoomParticipant.builder()
                .chatRoom(this)
                .user(user)
                .isAdmin(isAdmin)
                .build();

        // 참여자 목록에 추가
        this.participants.add(participant);
    }

    // 특정 사용자가 참여자인지 확인하는 메서드
    public boolean hasParticipant(User user) {
        return this.participants.stream()
                .anyMatch(p -> p.getUser().getId().equals(user.getId()));
    }

    // 특정 사용자의 참여 정보를 찾는 메서드
    public ChatRoomParticipant getParticipant(User user) {
        return this.participants.stream()
                .filter(p -> p.getUser().getId().equals(user.getId()))
                .findFirst()
                .orElse(null);
    }
}
