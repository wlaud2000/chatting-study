package com.study.chattingstudy.domain.chat.converter;

import com.study.chattingstudy.domain.chat.dto.request.ChatReqDTO;
import com.study.chattingstudy.domain.chat.dto.response.ChatResDTO;
import com.study.chattingstudy.domain.chat.dto.response.ChatRoomResDTO;
import com.study.chattingstudy.domain.chat.entity.ChatMessage;
import com.study.chattingstudy.domain.chat.entity.ChatRoom;
import com.study.chattingstudy.domain.chat.enums.ChatType;
import com.study.chattingstudy.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class ChatConverter {

    /**
     * 새로운 1:1 채팅방 생성
     * @param sender 채팅방 생성자
     * @param receiver 채팅 상대방
     * @return 새로 생성된 ChatRoom 엔티티
     */
    public static ChatRoom toPrivateChatRoom(User sender, User receiver) {
        ChatRoom chatRoom = ChatRoom.builder()
                .chatId(UUID.randomUUID().toString())
                .type(ChatType.PRIVATE)
                .participants(new ArrayList<>())
                .createdUser(sender)
                .build();

        // 참여자 추가
        chatRoom.addParticipant(sender, true);  // 방장으로 생성자 추가
        chatRoom.addParticipant(receiver, false);  // 상대방은 일반 참여자

        return chatRoom;
    }

    /**
     * ChatRoom 엔티티를 ChatRoomResDTO로 변환
     * @param chatRoom 변환할 ChatRoom 엔티티
     * @return 변환된 ChatRoomResDTO 객체
     */
    public static ChatRoomResDTO.ChatRoomResponseDTO toChatRoomResDTO(ChatRoom chatRoom) {
        // 참여자 정보를 DTO로 변환
        Set<ChatRoomResDTO.ChatRoomResponseDTO.ParticipantDTO> participants = chatRoom.getParticipants().stream()
                .map(participant -> ChatRoomResDTO.ChatRoomResponseDTO.ParticipantDTO.builder()
                        .userId(participant.getUser().getId())
                        .username(participant.getUser().getUsername())
                        .email(participant.getUser().getEmail())
                        .build())
                .collect(Collectors.toSet());

        // 채팅방 정보를 DTO로 변환
        return ChatRoomResDTO.ChatRoomResponseDTO.builder()
                .chatId(chatRoom.getChatId())
                .type(chatRoom.getType().toString())
                .name(chatRoom.getName())
                .description(chatRoom.getDescription())
                .createdAt(chatRoom.getCreatedAt())
                .participants(participants)
                .build();
    }

    /**
     * ChatRoom과 참여자 정보를 ChatRoomListResDTO로 변환
     * @param chatRoom 변환할 ChatRoom 엔티티
     * @param otherUser 상대방 참여자
     * @param lastMessage 마지막 메시지 (없을 수 있음)
     * @param unreadCount 읽지 않은 메시지 수
     * @return 변환된 ChatRoomListResDTO 객체
     */
    public static ChatRoomResDTO.ChatRoomListResDTO toChatRoomListResDTO(
            ChatRoom chatRoom,
            User otherUser,
            ChatMessage lastMessage,
            int unreadCount) {

        // 상대방 정보 DTO 생성
        ChatRoomResDTO.ChatRoomListResDTO.ParticipantDTO otherUserDTO =
                ChatRoomResDTO.ChatRoomListResDTO.ParticipantDTO.builder()
                        .userId(otherUser.getId())
                        .username(otherUser.getUsername())
                        .email(otherUser.getEmail())
                        .build();

        // 마지막 메시지 DTO 생성 (없을 수 있음)
        ChatRoomResDTO.ChatRoomListResDTO.LastMessageDTO lastMessageDTO = null;
        if (lastMessage != null) {
            lastMessageDTO = ChatRoomResDTO.ChatRoomListResDTO.LastMessageDTO.builder()
                    .messageId(lastMessage.getMessageId())
                    .content(lastMessage.getContent())
                    .senderId(lastMessage.getSender().getId())
                    .createdAt(lastMessage.getCreatedAt())
                    .read(lastMessage.isRead())
                    .build();
        }

        // 채팅방 목록 항목 DTO 생성
        return ChatRoomResDTO.ChatRoomListResDTO.builder()
                .chatId(chatRoom.getChatId())
                .type(chatRoom.getType().toString())
                .otherUser(otherUserDTO)
                .lastMessage(lastMessageDTO)
                .unreadCount(unreadCount)
                .build();
    }

    /**
     * 메시지 전송 요청 DTO와 발신자로 ChatMessage 엔티티 생성
     * @param chatRoom 메시지가 속한 채팅방
     * @param sender 메시지 발신자
     * @param reqDTO 메시지 전송 요청 DTO
     * @return 생성된 ChatMessage 엔티티
     */
    public static ChatMessage toChatMessage(ChatRoom chatRoom, User sender, ChatReqDTO.MessageSendReqDTO reqDTO) {
        return ChatMessage.builder()
                .messageId(UUID.randomUUID().toString())
                .chatRoom(chatRoom)
                .sender(sender)
                .content(reqDTO.content())
                .read(false)
                .build();
    }

    /**
     * ChatMessage 엔티티를 MessageResDTO로 변환
     * @param message 변환할 ChatMessage 엔티티
     * @return 변환된 MessageResDTO 객체
     */
    public static ChatResDTO.MessageResDTO toMessageResDTO(ChatMessage message) {
        return ChatResDTO.MessageResDTO.builder()
                .messageId(message.getMessageId())
                .content(message.getContent())
                .senderId(message.getSender().getId())
                .senderUsername(message.getSender().getUsername())
                .createdAt(message.getCreatedAt())
                .read(message.isRead())
                .build();
    }

    /**
     * ChatMessage 엔티티 목록을 MessageListResDTO로 변환
     * @param messages 변환할 ChatMessage 엔티티 목록
     * @param hasMore 추가 메시지 존재 여부
     * @return 변환된 MessageListResDTO 객체
     */
    public static ChatResDTO.MessageListResDTO toMessageListResDTO(
            java.util.List<ChatMessage> messages,
            boolean hasMore) {

        // 메시지 목록을 DTO로 변환
        java.util.List<ChatResDTO.MessageResDTO> messageResDTOs = messages.stream()
                .map(ChatConverter::toMessageResDTO)
                .collect(Collectors.toList());

        return ChatResDTO.MessageListResDTO.builder()
                .messages(messageResDTOs)
                .hasMore(hasMore)
                .build();
    }
}
