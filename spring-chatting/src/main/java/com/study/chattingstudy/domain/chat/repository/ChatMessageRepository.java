package com.study.chattingstudy.domain.chat.repository;

import com.study.chattingstudy.domain.chat.entity.ChatMessage;
import com.study.chattingstudy.domain.chat.entity.ChatRoom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // 메시지 ID로 메시지 찾기
    Optional<ChatMessage> findByMessageId(String messageId);

    // 특정 채팅방의 메시지 목록 조회
    // fetch join을 이용해 sender까지 한 번에 가져오기
    @Query(
            value = "SELECT m FROM ChatMessage m JOIN FETCH m.sender WHERE m.chatRoom = :chatRoom ORDER BY m.createdAt DESC",
            countQuery = "SELECT COUNT(m) FROM ChatMessage m WHERE m.chatRoom = :chatRoom"
    )
    Page<ChatMessage> findByChatRoomWithSender(@Param("chatRoom") ChatRoom chatRoom, Pageable pageable);

    // 특정 채팅방의 모든 메시지를 읽음 상태로 변경 (자신이 보낸 메시지 제외)
    @Modifying
    @Query("UPDATE ChatMessage m SET m.read = true WHERE m.chatRoom.id = :chatRoomId AND m.sender.id <> :userId AND m.read = false")
    int markAllAsReadInChatRoom(@Param("chatRoomId") Long chatRoomId, @Param("userId") Long userId);

    // 특정 채팅방의 읽지 않은 메시지 수 조회 (자신이 보낸 메시지 제외)
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.chatRoom.id = :chatRoomId AND m.sender.id <> :userId AND m.read = false")
    long countUnreadMessages(@Param("chatRoomId") Long chatRoomId, @Param("userId") Long userId);
}
