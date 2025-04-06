// 전역 상태 관리
const state = {
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    user: null,
    stompClient: null,
    currentChatRoom: null,
    chatRooms: [],
    subscriptions: {}
  };
  
  // API URL 설정
  const API_BASE_URL = 'http://localhost:8081/api';
  const WS_ENDPOINT = 'http://localhost:8081/ws-stomp'; // 명시적으로 정의
  
  // 요소 선택
  const authContainer = document.getElementById('auth-container');
  const chatContainer = document.getElementById('chat-container');
  const loginTab = document.getElementById('login-tab');
  const signupTab = document.getElementById('signup-tab');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const loginButton = document.getElementById('login-button');
  const signupButton = document.getElementById('signup-button');
  const logoutButton = document.getElementById('logout-button');
  const newChatButton = document.getElementById('new-chat-button');
  const chatRoomsList = document.getElementById('chat-rooms-list');
  const chatRoomInfo = document.getElementById('chat-room-info');
  const messagesContainer = document.getElementById('messages-container');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const newChatModal = document.getElementById('new-chat-modal');
  const closeModalButton = document.querySelector('.close-modal');
  const createChatButton = document.getElementById('create-chat-button');
  
  // 앱 초기화
  function initApp() {
    // API URL 설정 확인 및 로그
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('WS_ENDPOINT:', WS_ENDPOINT);
    
    // 저장된 토큰 확인
    const savedAccessToken = localStorage.getItem('accessToken');
    const savedRefreshToken = localStorage.getItem('refreshToken');
    
    if (savedAccessToken && savedRefreshToken) {
      state.accessToken = savedAccessToken;
      state.refreshToken = savedRefreshToken;
      state.isAuthenticated = true;
      
      // 유저 정보 가져오기
      fetchUserInfo()
        .then(() => {
          showChatInterface();
          connectWebSocket();
          fetchChatRooms();
        })
        .catch((error) => {
          // 토큰이 만료되었거나 유효하지 않은 경우
          console.error('User info fetch error:', error);
          logout();
        });
    } else {
      showAuthInterface();
    }
    
    // 이벤트 리스너 등록
    registerEventListeners();
  }
  
  // 이벤트 리스너 등록
  function registerEventListeners() {
    // 탭 전환
    loginTab.addEventListener('click', () => switchTab('login'));
    signupTab.addEventListener('click', () => switchTab('signup'));
    
    // 로그인 및 회원가입
    loginButton.addEventListener('click', handleLogin);
    signupButton.addEventListener('click', handleSignup);
    
    // 로그아웃
    logoutButton.addEventListener('click', logout);
    
    // 새 채팅 모달
    newChatButton.addEventListener('click', showNewChatModal);
    closeModalButton.addEventListener('click', hideNewChatModal);
    createChatButton.addEventListener('click', createNewChat);
    
    // 메시지 전송 - 한글 입력 처리를 위한 이벤트 추가
    let isComposing = false; // 한글 조합 중인지 여부
    
    messageInput.addEventListener('compositionstart', () => {
      isComposing = true;
    });
    
    messageInput.addEventListener('compositionend', () => {
      isComposing = false;
    });
    
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    sendButton.addEventListener('click', sendMessage);
    
    // 윈도우 클릭으로 모달 닫기
    window.addEventListener('click', (e) => {
      if (e.target === newChatModal) {
        hideNewChatModal();
      }
    });
  }
  
  // 탭 전환
  function switchTab(tab) {
    if (tab === 'login') {
      loginTab.classList.add('active');
      signupTab.classList.remove('active');
      loginForm.classList.remove('hidden');
      signupForm.classList.add('hidden');
    } else {
      loginTab.classList.remove('active');
      signupTab.classList.add('active');
      loginForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
    }
  }
  
  // 로그인 처리
  async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');
    
    if (!email || !password) {
      errorElement.textContent = '이메일과 비밀번호를 모두 입력해주세요.';
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.isSuccess) {
        // 토큰 저장
        state.accessToken = data.result.accessToken;
        state.refreshToken = data.result.refreshToken;
        localStorage.setItem('accessToken', state.accessToken);
        localStorage.setItem('refreshToken', state.refreshToken);
        state.isAuthenticated = true;
        
        // 유저 정보 가져오기
        await fetchUserInfo();
        
        // 채팅 인터페이스 표시
        showChatInterface();
        
        // WebSocket 연결
        connectWebSocket();
        
        // 채팅방 목록 가져오기
        fetchChatRooms();
        
      } else {
        errorElement.textContent = data.message || '로그인에 실패했습니다.';
      }
    } catch (error) {
      console.error('Login error:', error);
      errorElement.textContent = '서버 연결에 실패했습니다.';
    }
  }
  
  // 회원가입 처리
  async function handleSignup() {
    const email = document.getElementById('signup-email').value;
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const errorElement = document.getElementById('signup-error');
    const successElement = document.getElementById('signup-success');
    
    errorElement.textContent = '';
    successElement.textContent = '';
    
    if (!email || !username || !password) {
      errorElement.textContent = '모든 필드를 입력해주세요.';
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, username, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.isSuccess) {
        successElement.textContent = '회원가입이 완료되었습니다. 로그인해주세요.';
        // 로그인 탭으로 전환
        setTimeout(() => {
          switchTab('login');
          document.getElementById('login-email').value = email;
        }, 1500);
      } else {
        errorElement.textContent = data.message || '회원가입에 실패했습니다.';
      }
    } catch (error) {
      console.error('Signup error:', error);
      errorElement.textContent = '서버 연결에 실패했습니다.';
    }
  }
  
  // 유저 정보 가져오기
  async function fetchUserInfo() {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${state.accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }
      
      const data = await response.json();
      
      if (data.isSuccess) {
        state.user = data.result;
      } else {
        throw new Error(data.message || 'Failed to fetch user info');
      }
    } catch (error) {
      console.error('Fetch user info error:', error);
      throw error;
    }
  }
  
  // 채팅방 목록 가져오기
  async function fetchChatRooms() {
    try {
      const response = await fetch(`${API_BASE_URL}/chats/private`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${state.accessToken}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.isSuccess) {
        state.chatRooms = data.result;
        renderChatRooms();
      } else if (response.status === 403) {
        // 403 에러(채팅방에 참여하지 않음)의 경우 빈 목록으로 처리
        console.log('아직 참여한 채팅방이 없습니다.');
        state.chatRooms = [];
        renderChatRooms();
      } else {
        console.error('Failed to fetch chat rooms:', data.message);
      }
    } catch (error) {
      console.error('Fetch chat rooms error:', error);
      // 네트워크 오류 등 발생 시 빈 목록으로 처리
      state.chatRooms = [];
      renderChatRooms();
    }
  }
  
  // 채팅방 목록 렌더링
  function renderChatRooms() {
    chatRoomsList.innerHTML = '';
    
    if (!state.chatRooms || state.chatRooms.length === 0) {
      chatRoomsList.innerHTML = '<div class="empty-list-message">채팅방이 없습니다<br>새 채팅을 시작해보세요</div>';
      return;
    }
    
    state.chatRooms.forEach(room => {
      const chatRoomItem = document.createElement('div');
      chatRoomItem.className = 'chat-room-item';
      chatRoomItem.dataset.chatId = room.chatId;
      
      if (state.currentChatRoom && state.currentChatRoom.chatId === room.chatId) {
        chatRoomItem.classList.add('active');
      }
      
      const lastMessageTime = room.lastMessage ? new Date(room.lastMessage.createdAt) : null;
      const formattedTime = lastMessageTime ? formatTime(lastMessageTime) : '';
      
      chatRoomItem.innerHTML = `
        <div class="chat-room-item-header">
          <span class="chat-room-item-username">${room.otherUser.username}</span>
          <span class="chat-room-item-time">${formattedTime}</span>
        </div>
        <div class="chat-room-item-last-message">
          ${room.lastMessage ? room.lastMessage.content : '새로운 채팅방'}
          ${room.unreadCount > 0 ? `<span class="unread-count">${room.unreadCount}</span>` : ''}
        </div>
      `;
      
      chatRoomItem.addEventListener('click', () => {
        selectChatRoom(room);
      });
      
      chatRoomsList.appendChild(chatRoomItem);
    });
  }
  
  // 채팅방 선택
  function selectChatRoom(room) {
    state.currentChatRoom = room;
    
    // 채팅방 목록에서 활성화 상태 업데이트
    document.querySelectorAll('.chat-room-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.chatId === room.chatId) {
        item.classList.add('active');
      }
    });
    
    // 채팅방 정보 업데이트
    chatRoomInfo.innerHTML = `
      <h4>${room.otherUser.username}</h4>
      <p>${room.otherUser.email}</p>
    `;
    
    // 메시지 입력 활성화
    messageInput.disabled = false;
    sendButton.disabled = false;
    
    // 현재 구독 취소 후 새로운 채팅방 구독
    unsubscribeFromCurrentChatRoom();
    subscribeToChatRoom(room.chatId);
    
    // 메시지 로드
    fetchMessages(room.chatId);
    
    // 채팅방의 모든 메시지를 읽음 처리
    markMessagesAsRead(room.chatId);
  }
  
  // 메시지 가져오기
  async function fetchMessages(chatId, before = null, limit = 50) {
    try {
      let url = `${API_BASE_URL}/chats/${chatId}/messages?limit=${limit}`;
      if (before) {
        url += `&before=${before}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${state.accessToken}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.isSuccess) {
        renderMessages(data.result.messages);
      } else {
        console.error('Failed to fetch messages:', data.message);
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  }
  
  // 메시지 렌더링
  function renderMessages(messages) {
    messagesContainer.innerHTML = '';
    
    if (!messages || messages.length === 0) {
      messagesContainer.innerHTML = '<div class="empty-messages">메시지가 없습니다.</div>';
      return;
    }
    
    // 메시지를 생성 시간 순으로 정렬
    const sortedMessages = [...messages].sort((a, b) => {
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    
    sortedMessages.forEach(message => {
      const isSentByMe = message.senderId === state.user.id;
      const messageElement = document.createElement('div');
      messageElement.className = isSentByMe ? 'message message-sent' : 'message message-received';
      messageElement.dataset.messageId = message.messageId;
      
      const messageTime = new Date(message.createdAt);
      const formattedTime = formatTime(messageTime);
      
      messageElement.innerHTML = `
        <div class="message-content">${message.content}</div>
        <div class="message-info">
          ${isSentByMe ? '' : `${message.senderUsername} · `}${formattedTime}
          ${isSentByMe ? message.read ? ' · 읽음' : '' : ''}
        </div>
      `;
      
      messagesContainer.appendChild(messageElement);
    });
    
    // 스크롤을 최신 메시지로 이동
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // 메시지 읽음 처리
  async function markMessagesAsRead(chatId, messageId = null) {
    try {
      // API 요청을 통해 읽음 상태 업데이트
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}/read${messageId ? `?messageId=${messageId}` : ''}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark messages as read');
      }
      
      // WebSocket을 통해 읽음 상태 업데이트 알림
      if (state.stompClient && state.stompClient.connected) {
        state.stompClient.send('/pub/chat/read', {}, JSON.stringify({
          chatId: chatId,
          messageId: messageId
        }));
      }
      
      // 채팅방 목록 새로고침
      fetchChatRooms();
    } catch (error) {
      console.error('Mark messages as read error:', error);
    }
  }
  
  // 새 채팅방 생성
  async function createNewChat() {
    const recipientEmail = document.getElementById('recipient-email').value;
    const errorElement = document.getElementById('create-chat-error');
    
    if (!recipientEmail) {
      errorElement.textContent = '상대방 ID를 입력해주세요.';
      return;
    }
    
    try {
      // 입력값이 숫자인지 확인
      let receiverId;
      if (/^\d+$/.test(recipientEmail)) {
        // 숫자로 입력한 경우 그대로 사용
        receiverId = Number(recipientEmail);
      } else {
        errorElement.textContent = '유효한 사용자 ID(숫자)를 입력해주세요.';
        return;
      }
      
      // 자기 자신에게 채팅을 생성하는지 확인
      if (receiverId === state.user.id) {
        errorElement.textContent = '자기 자신에게는 채팅을 보낼 수 없습니다.';
        return;
      }
      
      console.log(`채팅방 생성 시도: 받는 사람 ID = ${receiverId}`);
      
      const response = await fetch(`${API_BASE_URL}/chats/private`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ receiverId })
      });
      
      const data = await response.json();
      console.log('채팅방 생성 응답:', data);
      
      if (response.ok && data.isSuccess) {
        hideNewChatModal();
        
        // 성공적으로 채팅방이 생성되었을 때
        const chatRoom = data.result;
        console.log('생성된 채팅방:', chatRoom);
        
        // 채팅방 목록 새로고침
        await fetchChatRooms();
        
        // 성공적으로 목록을 가져왔다면, 새로 생성된 채팅방 선택
        if (state.chatRooms && state.chatRooms.length > 0) {
          // chatId로 새 채팅방 찾기
          const newRoom = state.chatRooms.find(room => room.chatId === chatRoom.chatId);
          if (newRoom) {
            selectChatRoom(newRoom);
          } else {
            // 첫 번째 채팅방 선택
            selectChatRoom(state.chatRooms[0]);
          }
        }
      } else {
        errorElement.textContent = data.message || '채팅방 생성에 실패했습니다.';
      }
    } catch (error) {
      console.error('Create chat error:', error);
      errorElement.textContent = '서버 연결에 실패했습니다.';
    }
  }
  
  // WebSocket 연결
  function connectWebSocket() {
    if (state.stompClient) {
      try {
        state.stompClient.disconnect();
      } catch (error) {
        console.warn('Disconnect error:', error);
      }
      state.stompClient = null;
    }
    
    console.log('WebSocket 연결 시도... URL:', WS_ENDPOINT);
    
    // SockJS와 STOMP 클라이언트 초기화
    const socket = new SockJS(WS_ENDPOINT);
    state.stompClient = Stomp.over(socket);
    
    // 디버그 로그 활성화 (문제 해결 시에만)
    state.stompClient.debug = function(message) {
      console.log('STOMP DEBUG:', message);
    };
    
    // STOMP 헤더 설정 - Bearer 접두사 확인
    const headers = {
      'Authorization': `Bearer ${state.accessToken}`
    };
    
    console.log('WebSocket 연결 시도 - 헤더:', headers);
    
    // 연결 시도 - 타임아웃 설정 추가
    const connectTimeout = setTimeout(() => {
      console.log('WebSocket 연결 타임아웃 - 재시도');
      if (state.stompClient && !state.stompClient.connected) {
        connectWebSocket();
      }
    }, 10000); // 10초 타임아웃
    
    // 연결
    state.stompClient.connect(
      headers,
      frame => {
        clearTimeout(connectTimeout);
        console.log('Connected to WebSocket:', frame);
        
        // 현재 채팅방이 있다면 구독
        if (state.currentChatRoom) {
          // 약간의 딜레이를 주어 연결이 완전히 설정되도록 함
          setTimeout(() => {
            subscribeToChatRoom(state.currentChatRoom.chatId);
          }, 500);
        }
      },
      error => {
        clearTimeout(connectTimeout);
        console.error('WebSocket connection error:', error);
        state.stompClient = null;
        
        // 5초 후 재연결 시도
        setTimeout(connectWebSocket, 5000);
      }
    );
  }
  
  // 채팅방 구독
  function subscribeToChatRoom(chatId) {
    console.log('채팅방 구독 시도:', chatId);
    
    if (!state.stompClient) {
      console.warn('WebSocket not connected. Unable to subscribe.');
      console.log('WebSocket 재연결 시도...');
      connectWebSocket();
      return;
    }
  
    if (!state.stompClient.connected) {
      console.warn('WebSocket connecting... Waiting before subscribing.');
      setTimeout(() => subscribeToChatRoom(chatId), 1000);
      return;
    }
    
    try {
      // 메시지 구독
      state.subscriptions[chatId] = state.stompClient.subscribe(
        `/sub/chat/private/${chatId}`,
        message => {
          const receivedMessage = JSON.parse(message.body);
          console.log('Received message:', receivedMessage);
          
          // 현재 보고있는 채팅방의 메시지라면 UI에 추가
          if (state.currentChatRoom && state.currentChatRoom.chatId === chatId) {
            const messages = document.querySelectorAll('.message');
            const existingMessage = Array.from(messages).find(
              el => el.dataset.messageId === receivedMessage.messageId
            );
            
            if (!existingMessage) {
              const messageElement = document.createElement('div');
              const isSentByMe = receivedMessage.senderId === state.user.id;
              messageElement.className = isSentByMe ? 'message message-sent' : 'message message-received';
              messageElement.dataset.messageId = receivedMessage.messageId;
              
              const messageTime = new Date(receivedMessage.createdAt);
              const formattedTime = formatTime(messageTime);
              
              messageElement.innerHTML = `
                <div class="message-content">${receivedMessage.content}</div>
                <div class="message-info">
                  ${isSentByMe ? '' : `${receivedMessage.senderUsername} · `}${formattedTime}
                  ${isSentByMe ? receivedMessage.read ? ' · 읽음' : '' : ''}
                </div>
              `;
              
              messagesContainer.appendChild(messageElement);
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
              
              // 자신이 보낸 메시지가 아니라면 읽음 처리
              if (!isSentByMe) {
                markMessagesAsRead(chatId, receivedMessage.messageId);
              }
            }
          }
          
          // 채팅방 목록 새로고침
          fetchChatRooms();
        }
      );
      
      console.log('채팅방 구독 성공:', chatId);
      
      // 읽음 상태 구독
      state.subscriptions[`${chatId}/read`] = state.stompClient.subscribe(
        `/sub/chat/private/${chatId}/read`,
        message => {
          const readStatus = JSON.parse(message.body);
          console.log('Read status update:', readStatus);
          
          // 읽음 표시 업데이트
          if (state.currentChatRoom && state.currentChatRoom.chatId === chatId) {
            const messages = document.querySelectorAll('.message.message-sent');
            messages.forEach(message => {
              const messageInfo = message.querySelector('.message-info');
              if (!messageInfo.textContent.includes('읽음')) {
                messageInfo.textContent += ' · 읽음';
              }
            });
          }
          
          // 채팅방 목록 새로고침
          fetchChatRooms();
        }
      );
    } catch (error) {
      console.error('Subscribe error:', error);
      
      // 연결이 끊어졌다면 재연결 시도
      if (!state.stompClient.connected) {
        setTimeout(() => {
          console.log('WebSocket 재연결 시도 (구독 실패)');
          connectWebSocket();
        }, 2000);
      }
    }
  }
  
  // 현재 채팅방 구독 취소
  function unsubscribeFromCurrentChatRoom() {
    if (state.currentChatRoom) {
      const chatId = state.currentChatRoom.chatId;
      
      if (state.subscriptions[chatId]) {
        state.subscriptions[chatId].unsubscribe();
        delete state.subscriptions[chatId];
      }
      
      if (state.subscriptions[`${chatId}/read`]) {
        state.subscriptions[`${chatId}/read`].unsubscribe();
        delete state.subscriptions[`${chatId}/read`];
      }
    }
  }
  
  // 메시지 전송 - 한글 입력 문제 해결
  function sendMessage() {
    // 한글 조합 완료를 위한 작은 지연 추가
    setTimeout(() => {
      const content = messageInput.value.trim();
      
      if (!content || !state.currentChatRoom) {
        return;
      }
      
      if (!state.stompClient) {
        console.warn('WebSocket not connected. Unable to send message.');
        // 연결 시도
        connectWebSocket();
        return;
      }
      
      if (!state.stompClient.connected) {
        console.warn('WebSocket connecting... Please try again in a moment.');
        messageInput.value = content; // 메시지 유지
        return;
      }
      
      try {
        const message = {
          chatId: state.currentChatRoom.chatId,
          content: content
        };
        
        console.log('메시지 전송 시도:', message);
        
        state.stompClient.send('/pub/chat/private', {}, JSON.stringify(message));
        console.log('메시지 전송 성공');
        
        messageInput.value = '';
      } catch (error) {
        console.error('Message send error:', error);
        alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
        
        // 연결이 끊어졌다면 재연결 시도
        if (!state.stompClient.connected) {
          setTimeout(connectWebSocket, 1000);
        }
      }
    }, 10); // 매우 짧은 지연 적용
  }
  
  // 인증 인터페이스 표시
  function showAuthInterface() {
    authContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
    switchTab('login');
  }
  
  // 채팅 인터페이스 표시
  function showChatInterface() {
    authContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
  }
  
  // 로그아웃 처리
  function logout() {
    state.isAuthenticated = false;
    state.accessToken = null;
    state.refreshToken = null;
    state.user = null;
    state.currentChatRoom = null;
    state.chatRooms = [];
    
    // WebSocket 연결 종료
    if (state.stompClient) {
      state.stompClient.disconnect();
      state.stompClient = null;
    }
    
    // 구독 정보 초기화
    state.subscriptions = {};
    
    // 로컬 스토리지에서 토큰 제거
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // 인터페이스 전환
    showAuthInterface();
  }
  
  // 새 채팅 모달 표시
  function showNewChatModal() {
    document.getElementById('recipient-email').value = '';
    document.getElementById('create-chat-error').textContent = '';
    newChatModal.classList.remove('hidden');
  }
  
  // 새 채팅 모달 숨기기
  function hideNewChatModal() {
    newChatModal.classList.add('hidden');
  }
  
  // 시간 포맷팅 (HH:MM)
  function formatTime(date) {
    if (!date) return '';
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
  }
  
  // 앱 시작
  document.addEventListener('DOMContentLoaded', () => {
    // 기본 탭 설정
    loginTab.classList.add('active');
    
    // 앱 초기화
    initApp();
  });