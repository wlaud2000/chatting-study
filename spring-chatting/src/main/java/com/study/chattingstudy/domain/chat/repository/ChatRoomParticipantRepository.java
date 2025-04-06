package com.study.chattingstudy.domain.chat.repository;

import com.study.chattingstudy.domain.chat.entity.ChatRoom;
import com.study.chattingstudy.domain.chat.entity.ChatRoomParticipant;
import com.study.chattingstudy.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomParticipantRepository extends JpaRepository<ChatRoomParticipant, Long> {

    // 특정 사용자의 모든 채팅방 참여 정보 조회
    List<ChatRoomParticipant> findByUser(User user);

    // 특정 채팅방에서 특정 사용자의 참여 정보 조회
    Optional<ChatRoomParticipant> findByChatRoomAndUser(ChatRoom chatRoom, User user);

    // 특정 사용자가 특정 채팅방에 참여하고 있는지 확인
    boolean existsByChatRoomAndUser(ChatRoom chatRoom, User user);

    // 특정 채팅방의 다른 참여자들 조회(현재 사용자 제회)
    @Query("SELECT p FROM ChatRoomParticipant p WHERE p.chatRoom.id = :chatRoomId AND p.user.id <> :userId")
    List<ChatRoomParticipant> findOtherParticipants(@Param("chatRoomId") Long chatRoomId, @Param("userId") Long userId);

    // NEW: 여러 채팅방의 다른 참여자들 한 번에 조회
    @Query("SELECT p FROM ChatRoomParticipant p JOIN FETCH p.user " +
            "WHERE p.chatRoom.id IN :roomIds AND p.user.id <> :userId")
    List<ChatRoomParticipant> findByRoomIdsAndUserIdNot(
            @Param("roomIds") List<Long> roomIds,
            @Param("userId") Long userId);
}
