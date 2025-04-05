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

import java.util.List;
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
     * 사용자의 모든 1:1 채팅방 목록 조회
     */
    public List<ChatRoomResDTO.ChatRoomListResDTO> getUserPrivateChats(Long userId) {
        log.info("사용자의 1:1 채팅방 목록 조회: userId={}", userId);

        // 사용자 정보 조회
        userRepository.findById(userId).orElseThrow(() -> new ChatException(UserErrorCode.USER_NOT_FOUND_404));

        // 사용자의 1:1 채팅방 목록 조회
        List<ChatRoom> chatRooms = chatRoomRepository.findByParticipantId(userId)
                .stream()
                .filter(room -> room.getType() == ChatType.PRIVATE)
                .toList();

        log.info("사용자가 참여한 1:1 채팅방 수: {}", chatRooms.size());

        // DTO 변환
        return chatRooms.stream().map(chatRoom -> {
            // 상대방 사용자 정보 추출
            List<ChatRoomParticipant> otherParticipants = chatRoomParticipantRepository.findOtherParticipants(chatRoom.getId(), userId);

            if (otherParticipants.isEmpty()) {
                log.warn("상대방 참여자를 찾을 수 없음: chatRoomId={}", chatRoom.getId());
                throw new ChatException(ChatErrorCode.USER_NOT_IN_CHAT_ROOM);
            }

            ChatRoomParticipant otherParticipant = otherParticipants.get(0);
            User otherUser = otherParticipant.getUser();

            // 마지막 메시지 조회
            Page<ChatMessage> lastMessages = chatMessageRepository.findByChatRoomOrderByCreatedAtDesc(
                    chatRoom, PageRequest.of(0, 1));

            ChatMessage lastMessage = lastMessages.isEmpty() ? null : lastMessages.getContent().get(0);

            // 읽지 않은 메시지 수 조회
            int unreadCount = (int) chatMessageRepository.countUnreadMessages(chatRoom.getId(), userId);

            // Converter를 사용하여 DTO 변환
            return ChatConverter.toChatRoomListResDTO(chatRoom, otherUser, lastMessage, unreadCount);
        }).collect(Collectors.toList());
    }

    /**
     * 특정 채팅방의 메시지 목록 조회
     */
    public ChatResDTO.MessageListResDTO getChatMessages(Long userId, String chatId, Integer limit, Long before) {
        log.info("채팅방 메시지 목록 조회: userId={}, chatId={}, limit={}, before={}", userId, chatId, limit, before);

        // 사용자 정보 조회
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ChatException(UserErrorCode.USER_NOT_FOUND_404));

        // 채팅방 조회
        ChatRoom chatRoom = chatRoomRepository.findByChatId(chatId)
                .orElseThrow(() -> new ChatException(ChatErrorCode.CHAT_ROOM_NOT_FOUND));

        // 사용자가 채팅방 참여자인지 확인
        if (!chatRoomParticipantRepository.existsByChatRoomAndUser(chatRoom, currentUser)) {
            log.warn("사용자가 채팅방에 참여하지 않음: userId={}, chatId={}", userId, chatId);
            throw new ChatException(ChatErrorCode.USER_NOT_IN_CHAT_ROOM);
        }

        // 페이징 설정
        int pageSize = limit != null && limit > 0 ? limit : 50;

        // 메시지 조회
        Page<ChatMessage> messages;
        messages = chatMessageRepository.findByChatRoomOrderByCreatedAtDesc(
                chatRoom, PageRequest.of(0, pageSize));

        log.info("조회된 메시지 수: {}", messages.getContent().size());

        // Converter를 사용하여 DTO 변환
        return ChatConverter.toMessageListResDTO(messages.getContent(), messages.hasNext());
    }
}
