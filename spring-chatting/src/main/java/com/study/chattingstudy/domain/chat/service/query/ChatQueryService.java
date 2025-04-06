package com.study.chattingstudy.domain.chat.service.query;

import com.study.chattingstudy.domain.chat.converter.ChatConverter;
import com.study.chattingstudy.domain.chat.dto.response.ChatResDTO;
import com.study.chattingstudy.domain.chat.dto.response.ChatRoomResDTO;
import com.study.chattingstudy.domain.chat.entity.ChatMessage;
import com.study.chattingstudy.domain.chat.entity.ChatRoom;
import com.study.chattingstudy.domain.chat.entity.ChatRoomParticipant;
import com.study.chattingstudy.domain.chat.enums.ChatType;
import com.study.chattingstudy.domain.chat.exception.ChatErrorCode;
import com.study.chattingstudy.domain.chat.exception.ChatException;
import com.study.chattingstudy.domain.chat.repository.ChatMessageRepository;
import com.study.chattingstudy.domain.chat.repository.ChatRoomParticipantRepository;
import com.study.chattingstudy.domain.chat.repository.ChatRoomRepository;
import com.study.chattingstudy.domain.user.entity.User;
import com.study.chattingstudy.domain.user.exception.UserErrorCode;
import com.study.chattingstudy.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatQueryService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomParticipantRepository chatRoomParticipantRepository;
    private final UserRepository userRepository;

    /**
     * 사용자의 모든 1:1 채팅방 목록 조회 (최적화 버전)
     */
    public List<ChatRoomResDTO.ChatRoomListResDTO> getUserPrivateChats(Long userId) {
        log.info("사용자의 1:1 채팅방 목록 조회: userId={}", userId);

        // 사용자 정보 조회 (캐싱 가능)
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ChatException(UserErrorCode.USER_NOT_FOUND_404));

        // 1. 사용자가 참여한 모든 1:1 채팅방 가져오기 (FetchJoin 사용)
        List<ChatRoom> chatRooms = chatRoomRepository.findPrivateChatRoomsByUserId(userId);

        if (chatRooms.isEmpty()) {
            return new ArrayList<>();
        }

        log.info("사용자가 참여한 1:1 채팅방 수: {}", chatRooms.size());

        // 2. 채팅방 ID 목록 추출
        List<Long> roomIds = chatRooms.stream()
                .map(ChatRoom::getId)
                .collect(Collectors.toList());

        // 3. 모든 채팅방의 상대방 참여자 정보를 한 번에 조회
        List<ChatRoomParticipant> allOtherParticipants = chatRoomParticipantRepository
                .findByRoomIdsAndUserIdNot(roomIds, userId);

        // 채팅방 ID를 키로 하는 맵으로 변환 (채팅방 -> 상대방 참여자)
        Map<Long, ChatRoomParticipant> otherParticipantMap = allOtherParticipants.stream()
                .collect(Collectors.toMap(
                        p -> p.getChatRoom().getId(),
                        p -> p
                ));

        // 4. 모든 채팅방의 마지막 메시지를 한 번에 조회
        List<ChatMessage> lastMessages = chatMessageRepository.findLastMessagesByRoomIds(roomIds);
        Map<Long, ChatMessage> lastMessageMap = lastMessages.stream()
                .collect(Collectors.toMap(
                        m -> m.getChatRoom().getId(),
                        m -> m,
                        (m1, m2) -> m1.getCreatedAt().isAfter(m2.getCreatedAt()) ? m1 : m2
                ));

        // 5. 모든 채팅방의 읽지 않은 메시지 수를 한 번에 조회
        List<Object[]> unreadCountsRaw = chatMessageRepository.countUnreadMessagesByRoomIdsRaw(roomIds, userId);
        Map<Long, Integer> unreadCountMap = new HashMap<>();
        for (Object[] result : unreadCountsRaw) {
            Long roomId = (Long) result[0];
            Long count = (Long) result[1];
            unreadCountMap.put(roomId, count.intValue());
        }

        // 6. DTO 변환 및 반환
        List<ChatRoomResDTO.ChatRoomListResDTO> result = new ArrayList<>();

        for (ChatRoom chatRoom : chatRooms) {
            Long roomId = chatRoom.getId();

            // 상대방 참여자 가져오기
            ChatRoomParticipant otherParticipant = otherParticipantMap.get(roomId);
            if (otherParticipant == null) {
                log.warn("상대방 참여자를 찾을 수 없음: chatRoomId={}", roomId);
                continue; // 상대방이 없는 채팅방은 건너뛰기
            }

            User otherUser = otherParticipant.getUser();
            ChatMessage lastMessage = lastMessageMap.get(roomId);
            int unreadCount = unreadCountMap.getOrDefault(roomId, 0);

            // DTO 생성 및 추가
            ChatRoomResDTO.ChatRoomListResDTO dto =
                    ChatConverter.toChatRoomListResDTO(chatRoom, otherUser, lastMessage, unreadCount);
            result.add(dto);
        }

        return result;
    }

    /**
     * 특정 채팅방의 메시지 목록 조회 (최적화)
     */
    public ChatResDTO.MessageListResDTO getChatMessages(Long userId, String chatId, Integer limit, Long before) {
        log.info("채팅방 메시지 목록 조회: userId={}, chatId={}, limit={}, before={}", userId, chatId, limit, before);

        // 사용자 정보 조회 (캐싱 가능)
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ChatException(UserErrorCode.USER_NOT_FOUND_404));

        // 채팅방 조회 (FetchJoin 사용)
        ChatRoom chatRoom = chatRoomRepository.findWithParticipantsByChatId(chatId)
                .orElseThrow(() -> new ChatException(ChatErrorCode.CHAT_ROOM_NOT_FOUND));

        // 사용자가 채팅방 참여자인지 확인
        boolean isParticipant = chatRoom.getParticipants().stream()
                .anyMatch(p -> p.getUser().getId().equals(userId));

        if (!isParticipant) {
            log.warn("사용자가 채팅방에 참여하지 않음: userId={}, chatId={}", userId, chatId);
            throw new ChatException(ChatErrorCode.USER_NOT_IN_CHAT_ROOM);
        }

        // 페이징 설정
        int pageSize = limit != null && limit > 0 ? limit : 50;

        // 메시지 조회 (FetchJoin으로 N+1 문제 해결)
        Page<ChatMessage> messages = chatMessageRepository.findByChatRoomWithSender(
                chatRoom, PageRequest.of(0, pageSize));

        log.info("조회된 메시지 수: {}", messages.getContent().size());

        // DTO 변환
        return ChatConverter.toMessageListResDTO(messages.getContent(), messages.hasNext());
    }
}
