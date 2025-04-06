package com.study.chattingstudy.domain.chat.repository;

import com.study.chattingstudy.domain.chat.entity.ChatMessage;
import com.study.chattingstudy.domain.chat.entity.ChatRoom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // 메시지 ID로 메시지 찾기
    Optional<ChatMessage> findByMessageId(String messageId);

    // 여러 채팅방의 마지막 메시지를 한 번에 조회 (N+1 문제 해결)
    @Query("SELECT cm FROM ChatMessage cm JOIN FETCH cm.sender " +
            "WHERE cm.id IN (SELECT MAX(m.id) FROM ChatMessage m WHERE m.chatRoom.id IN :roomIds GROUP BY m.chatRoom.id)")
    List<ChatMessage> findLastMessagesByRoomIds(@Param("roomIds") List<Long> roomIds);

    // 여러 채팅방의 읽지 않은 메시지 수를 한 번에 조회 (N+1 문제 해결)
    @Query("SELECT cm.chatRoom.id as roomId, COUNT(cm) as count FROM ChatMessage cm " +
            "WHERE cm.chatRoom.id IN :roomIds AND cm.sender.id <> :userId AND cm.read = false " +
            "GROUP BY cm.chatRoom.id")
    List<Object[]> countUnreadMessagesByRoomIdsRaw(@Param("roomIds") List<Long> roomIds, @Param("userId") Long userId);

    // 특정 채팅방의 모든 메시지를 읽음 상태로 변경 (자신이 보낸 메시지 제외)
    @Modifying
    @Query("UPDATE ChatMessage m SET m.read = true WHERE m.chatRoom.id = :chatRoomId AND m.sender.id <> :userId AND m.read = false")
    int markAllAsReadInChatRoom(@Param("chatRoomId") Long chatRoomId, @Param("userId") Long userId);

    // 특정 채팅방의 읽지 않은 메시지 수 조회 (자신이 보낸 메시지 제외)
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.chatRoom.id = :chatRoomId AND m.sender.id <> :userId AND m.read = false")
    long countUnreadMessages(@Param("chatRoomId") Long chatRoomId, @Param("userId") Long userId);
}
