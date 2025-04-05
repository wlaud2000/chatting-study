package com.study.chattingstudy.domain.chat.service.command;

import com.study.chattingstudy.domain.chat.converter.ChatConverter;
import com.study.chattingstudy.domain.chat.dto.request.ChatReqDTO;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class ChatCommandService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomParticipantRepository chatRoomParticipantRepository;
    private final UserRepository userRepository;

    /**
     * 1:1 채팅방 생성 또는 조회
     */
    public ChatRoomResDTO.ChatRoomResponseDTO createOrGetPrivateChat(Long userId, ChatReqDTO.PrivateChatCreateReqDTO reqDTO) {
        log.info("1:1 채팅방 생성 또는 조회 요청: userId={}, receiverId={}", userId, reqDTO.receiverId());

        // 사용자 정보 조회
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ChatException(UserErrorCode.USER_NOT_FOUND_404));

        User receiverUser = userRepository.findById(reqDTO.receiverId())
                .orElseThrow(() -> new ChatException(UserErrorCode.USER_NOT_FOUND_404));

        // 이미 존재하는 1:1 채팅방 확인
        ChatRoom chatRoom = chatRoomRepository.findPrivateChatByParticipants(userId, reqDTO.receiverId())
                .orElseGet(() -> {
                    log.info("새로운 1:1 채팅방 생성: sender={}, receiver={}", userId, reqDTO.receiverId());
                    // Converter를 사용하여 채팅방 생성
                    ChatRoom newChatRoom = ChatConverter.toPrivateChatRoom(currentUser, receiverUser);
                    return chatRoomRepository.save(newChatRoom);
                });

        // Converter를 사용하여 DTO 변환
        return ChatConverter.toChatRoomResDTO(chatRoom);
    }

    /**
     * 채팅 메시지 전송
     */
    public ChatResDTO.MessageResDTO sendMessage(Long userId, ChatReqDTO.MessageSendReqDTO reqDTO) {
        log.info("메시지 전송 요청: userId={}, chatId={}", userId, reqDTO.chatId());

        // 사용자 정보 조회
        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new ChatException(UserErrorCode.USER_NOT_FOUND_404));

        // 채팅방 조회
        ChatRoom chatRoom = chatRoomRepository.findWithParticipantsByChatId(reqDTO.chatId())
                .orElseThrow(() -> new ChatException(ChatErrorCode.CHAT_ROOM_NOT_FOUND));

        // 사용자가 채팅방 참여자인지 확인
        if (!chatRoomParticipantRepository.existsByChatRoomAndUser(chatRoom, sender)) {
            throw new ChatException(ChatErrorCode.USER_NOT_IN_CHAT_ROOM);
        }

        // Converter를 사용하여 ChatMessage 생성
        ChatMessage chatMessage = ChatConverter.toChatMessage(chatRoom, sender, reqDTO);
        ChatMessage savedMessage = chatMessageRepository.save(chatMessage);

        log.info("메시지 저장 완료: messageId={}", savedMessage.getMessageId());

        // Converter를 사용하여 DTO 변환
        return ChatConverter.toMessageResDTO(savedMessage);
    }

    /**
     * 메시지 읽음 상태 업데이트
     * - 특정 메시지 또는 채팅방의 모든 메시지를 읽음 상태로 변경
     */
    public void markMessageAsRead(Long userId, ChatReqDTO.MessageReadReqDTO reqDTO) {
        log.info("메시지 읽음 상태 업데이트 요청: userId={}, chatId={}, messageId={}",
                userId, reqDTO.chatId(), reqDTO.messageId());

        // 채팅방 조회
        ChatRoom chatRoom = chatRoomRepository.findWithParticipantsByChatId(reqDTO.chatId())
                .orElseThrow(() -> new ChatException(ChatErrorCode.CHAT_ROOM_NOT_FOUND));

        // 사용자 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ChatException(UserErrorCode.USER_NOT_FOUND_404));

        // 사용자 참여 정보 조회
        ChatRoomParticipant participant = chatRoomParticipantRepository.findByChatRoomAndUser(chatRoom, user)
                .orElseThrow(() -> new ChatException(ChatErrorCode.USER_NOT_IN_CHAT_ROOM));

        // 특정 메시지 읽음 처리
        if (reqDTO.messageId() != null) {
            ChatMessage message = chatMessageRepository.findByMessageId(reqDTO.messageId())
                    .orElseThrow(() -> new ChatException(ChatErrorCode.MESSAGE_NOT_FOUND));

            // 자신이 보낸 메시지가 아닌 경우에만 읽음 처리
            if (!message.getSender().getId().equals(userId)) {
                // 마지막 읽은 메시지 ID 업데이트
                participant.updateLastReadMessageId(message.getMessageId());
                chatRoomParticipantRepository.save(participant);

                // 메시지 읽음 표시
                message.markAsRead();
                chatMessageRepository.save(message);

                log.info("메시지 읽음 처리 완료: messageId={}", message.getMessageId());
            }
        } else {
            // 채팅방의 모든 메시지 읽음 처리 (자신이 보낸 메시지 제외)
            int updatedCount = chatMessageRepository.markAllAsReadInChatRoom(chatRoom.getId(), userId);

            // 가장 최근 메시지 ID를 마지막 읽은 메시지로 설정
            chatMessageRepository.findByChatRoomWithSender(chatRoom, PageRequest.of(0, 1))
                    .stream()
                    .findFirst()
                    .ifPresent(message -> {
                        participant.updateLastReadMessageId(message.getMessageId());
                        chatRoomParticipantRepository.save(participant);
                    });

            log.info("채팅방 전체 메시지 읽음 처리 완료: {}개 메시지 업데이트", updatedCount);
        }
    }
}
