package com.study.chattingstudy.domain.chat.entity;

import com.study.chattingstudy.domain.user.entity.User;
import com.study.chattingstudy.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "chat_room_participants",
        uniqueConstraints = @UniqueConstraint(columnNames = {"chat_room_id", "user_id"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
@Getter
public class ChatRoomParticipant extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id", nullable = false)
    private ChatRoom chatRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "is_admin", nullable = false)
    private boolean isAdmin;

    // 마지막으로 읽은 메시지 ID -> 읽지 않은 메시지 확인에 사용
    @Column(name = "last_read_message_id")
    private String lastReadMessageId;

    // 마지막으로 읽은 메시지 ID 업데이트 메서드
    public void updateLastReadMessageId(String messageId) {
        this.lastReadMessageId = messageId;
    }
}
