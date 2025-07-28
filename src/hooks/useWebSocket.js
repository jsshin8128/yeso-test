import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

/**
 * 고유한 브라우저 ID를 생성하거나 기존 ID를 반환
 * @returns {string} 고유한 참가자 ID
 */
const getOrCreateParticipantId = () => {
  let id = localStorage.getItem("participantId");
  if (!id) {
    id = crypto.randomUUID();  // UUID 생성
    localStorage.setItem("participantId", id);
  }
  return id;
};

/**
 * 방 단위 WebSocket 연결 Hook
 * @param {number} roomId - 현재 토론방 ID
 * @param {function} onMessageReceived - 메시지 수신 시 실행 함수
 * @param {object} user - 현재 사용자 정보
 */
const useWebSocket = (roomId, onMessageReceived, user) => {
  const clientRef = useRef(null);
  const joinSentRef = useRef(false); // ✅ 중복 방지용 ref 추가
  const [isConnected, setIsConnected] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(0);

  useEffect(() => {
    console.log('[WebSocket] 🔌 Initializing WebSocket for room:', roomId);

    let chatSubscription = null;
    let participantSubscription = null;
    let typingSubscription = null;

    // prevent duplicate connections
    if (clientRef.current && clientRef.current.connected) {
      console.warn('[WebSocket] ⚠️ Already connected. Skipping duplicate connection.');
      return;
    }

    const socket = new SockJS('http://localhost:8080/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => console.log('[WebSocket]', str),
      onConnect: () => {
        console.log(`[WebSocket] ✅ Connected: /topic/debate/${roomId}`);
        setIsConnected(true);
        clientRef.current = client;

        // 연결 직후 JOIN 메시지 전송
        // ✅ JOIN 메시지는 한 번만 보내게 차단
        if (user && !joinSentRef.current) {
          const participantId = getOrCreateParticipantId();
          console.log('[WebSocket] 👋 Sending join message for user:', user.name);
          client.publish({
            destination: `/app/debate/${roomId}/join`,
            body: JSON.stringify({
              senderId: participantId,
              sender: user.name
            }),
          });
          joinSentRef.current = true; // ✅ 다시 보내지 않도록 마킹
        }

        chatSubscription = client.subscribe(`/topic/debate/${roomId}`, (message) => {
          console.log('[WebSocket] 📥 Received message:', message.body);
          try {
            const payload = JSON.parse(message.body);
            if (onMessageReceived) {
              console.log('[WebSocket] 🔔 Triggering onMessageReceived callback');
              onMessageReceived(payload);
            }
          } catch (e) {
            console.error('[WebSocket] ❌ Failed to parse message body', e);
          }
        });

        participantSubscription = client.subscribe(`/topic/debate/${roomId}/participants`, (message) => {
          const count = parseInt(message.body, 10);
          if (!isNaN(count)) {
            console.log('[WebSocket] 👥 참가자 수 수신:', count);
            setParticipantsCount(count);
          }
        });

        // 타이핑 수신 처리
        typingSubscription = client.subscribe(`/topic/debate/${roomId}/typing`, (message) => {
          try {
            const payload = JSON.parse(message.body);
            if (payload.senderId) {
              onMessageReceived({ type: "typing", senderId: payload.senderId, sender: payload.sender });
            }
          } catch (e) {
            console.error('[WebSocket] ❌ Failed to parse typing message', e);
          }
        });
      },
      onDisconnect: () => {
        console.log('[WebSocket] 🔌 Disconnected');
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('[WebSocket] ❗ STOMP error:', frame);
      },
    });

    clientRef.current = client;
    client.activate();

    const handleBeforeUnload = () => {
      console.log('[WebSocket] 🔒 beforeunload triggered');
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      console.log('[WebSocket] 🧹 Cleaning up WebSocket connection...');

      if (chatSubscription) {
        chatSubscription.unsubscribe();
        chatSubscription = null;
      }
      if (participantSubscription) {
        participantSubscription.unsubscribe();
        participantSubscription = null;
      }
      if (typingSubscription) {
        typingSubscription.unsubscribe();
        typingSubscription = null;
      }

      if (clientRef.current) {
        clientRef.current.deactivate().then(() => {
          console.log('[WebSocket] 🧼 Disconnected cleanly');
          clientRef.current = null;
          setIsConnected(false);
        });
      }

      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomId, onMessageReceived, user]);

  /**
   * 서버에 메시지 전송
   * @param {object} message - 메시지 내용
   */
  const sendMessage = (message) => {
    console.log('[WebSocket] sendMessage called');
    if (!isConnected || !clientRef.current) {
      console.warn('[WebSocket] ❌ Message not sent. WebSocket not connected.');
      return;
    }

    console.log('[WebSocket] 📤 Sending message:', message);
    clientRef.current.publish({
      destination: `/app/debate/${roomId}/send`,
      body: JSON.stringify(message),
    });
  };

  /**
   * 타이핑 상태 전송
   * @param {object} typingData - 타이핑 데이터
   */
  const sendTyping = (typingData) => {
    console.log('[WebSocket] sendTyping called');
    if (!isConnected || !clientRef.current) {
      console.warn('[WebSocket] ❌ Typing message not sent. WebSocket not connected.');
      return;
    }

    console.log('[WebSocket] 📤 Sending typing message:', typingData);
    clientRef.current.publish({
      destination: `/app/debate/${roomId}/typing`,
      body: JSON.stringify(typingData),
    });
  };

  /**
   * 방 참여 메시지 전송
   * @param {object} joinData - 참여 데이터
   */
  const sendJoin = (joinData) => {
    console.log('[WebSocket] sendJoin called');
    if (!isConnected || !clientRef.current) {
      console.warn('[WebSocket] ❌ Join message not sent. WebSocket not connected.');
      return;
    }

    console.log('[WebSocket] 📤 Sending join message:', joinData);
    clientRef.current.publish({
      destination: `/app/debate/${roomId}/join`,
      body: JSON.stringify(joinData),
    });
  };

  return { sendMessage, sendTyping, sendJoin, isConnected, participantsCount };
};

export default useWebSocket;
