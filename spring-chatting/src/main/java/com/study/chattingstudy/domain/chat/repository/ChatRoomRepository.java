package com.study.chattingstudy.domain.chat.repository;

import com.study.chattingstudy.domain.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    // 채팅방 ID로 채팅방 찾기
    Optional<ChatRoom> findByChatId(String chatId);

    // fetch join으로 참여자와 유저 정보까지 한번에 가져오기
    @Query("SELECT cr FROM ChatRoom cr " +
            "LEFT JOIN FETCH cr.participants p " +
            "LEFT JOIN FETCH p.user " +
            "WHERE cr.chatId = :chatId")
    Optional<ChatRoom> findWithParticipantsByChatId(@Param("chatId") String chatId);

    // 특정 사용자가 참여한 채팅방 목록 찾기 (N+1 문제 해결)
    @EntityGraph(attributePaths = {"participants", "participants.user"})
    @Query("SELECT DISTINCT cr FROM ChatRoom cr " +
            "JOIN cr.participants p " +
            "WHERE p.user.id = :userId AND cr.type = 'PRIVATE'")
    List<ChatRoom> findPrivateChatRoomsByUserId(@Param("userId") Long userId);

    // 두 사용자 간의 1:1 채팅방 찾기 (최적화)
    @EntityGraph(attributePaths = {"participants", "participants.user"})
    @Query("SELECT cr FROM ChatRoom cr " +
            "WHERE cr.type = 'PRIVATE' " +
            "AND (SELECT COUNT(p) FROM cr.participants p) = 2 " +
            "AND EXISTS (SELECT p FROM cr.participants p WHERE p.user.id = :userId1) " +
            "AND EXISTS (SELECT p FROM cr.participants p WHERE p.user.id = :userId2)")
    Optional<ChatRoom> findPrivateChatByParticipants(
            @Param("userId1") Long userId1,
            @Param("userId2") Long userId2);
}
