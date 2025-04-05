package com.study.chattingstudy.domain.chat.repository;

import com.study.chattingstudy.domain.chat.entity.ChatRoom;
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

    // 특정 사용자가 참여한 채팅방 목록 찾기 (중간 테이블 조인)
    @Query("SELECT DISTINCT cr FROM ChatRoom cr JOIN cr.participants p WHERE p.user.id = :userId")
    List<ChatRoom> findByParticipantId(@Param("userId") Long userId);

    // 두 사용자 간의 1:1 채팅방 찾기
    // 1. 1:1 채팅방 타입인지 확인
    // 2. 참여자가 정확히 2명인지 확인
    // 3. 두 명의 사용자가 모두 참여자인지 확인
    @Query("SELECT cr FROM ChatRoom cr " +
            "WHERE cr.type = 'PRIVATE' " +
            "AND (SELECT COUNT(p) FROM cr.participants p) = 2 " +
            "AND EXISTS (SELECT p FROM cr.participants p WHERE p.user.id = :userId1) " +
            "AND EXISTS (SELECT p FROM cr.participants p WHERE p.user.id = :userId2)")
    Optional<ChatRoom> findPrivateChatByParticipants(
            @Param("userId1") Long userId1,
            @Param("userId2") Long userId2);
}
