import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (receiverId: number) => Promise<boolean>;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onCreateChat }) => {
  const [receiverId, setReceiverId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!receiverId.trim()) {
      setError('상대방 ID를 입력해주세요.');
      return;
    }
    
    // 입력값이 숫자인지 확인
    if (!/^\d+$/.test(receiverId)) {
      setError('유효한 사용자 ID(숫자)를 입력해주세요.');
      return;
    }
    
    const id = Number(receiverId);
    
    // 자기 자신에게 채팅을 생성하는지 확인
    if (user && id === user.id) {
      setError('자기 자신에게는 채팅을 보낼 수 없습니다.');
      return;
    }
    
    setLoading(true);
    const success = await onCreateChat(id);
    setLoading(false);
    
    if (success) {
      setReceiverId('');
      onClose();
    } else {
      setError('채팅방 생성에 실패했습니다. 유효한 사용자 ID인지 확인해주세요.');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal" onClick={handleBackdropClick}>
      <div className="modal-content">
        <span className="close-modal" onClick={onClose}>&times;</span>
        <h3>새 채팅 시작</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            placeholder="상대방 ID 입력 (숫자)"
            required
          />
          <small className="input-help">백엔드 API 제한으로 인해 상대방의 ID(숫자)를 입력해주세요.</small>
          <button type="submit" disabled={loading}>
            {loading ? '처리 중...' : '채팅 시작'}
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default NewChatModal;