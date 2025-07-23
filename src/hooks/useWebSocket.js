// src/hooks/useWebSocket.js
import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

/**
 * 방 단위 WebSocket 연결 Hook
 * @param {number} roomId - 현재 토론방 ID
 * @param {function} onMessageReceived - 메시지 수신 시 실행 함수
 */
const useWebSocket = (roomId, onMessageReceived) => {
  const clientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(1);

  useEffect(() => {
    console.log('[WebSocket] 🔌 Initializing WebSocket for room:', roomId);

    let chatSubscription = null;
    let participantSubscription = null;

    const socket = new SockJS('http://localhost:8080/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => console.log('[WebSocket]', str),
      onConnect: () => {
        console.log(`[WebSocket] ✅ Connected: /topic/debate/${roomId}`);
        setIsConnected(true);
        clientRef.current = client;

        // 채팅 메시지 구독
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

        // 참가자 수 구독
        participantSubscription = client.subscribe(`/topic/debate/${roomId}/participants`, (message) => {
          const count = parseInt(message.body, 10);
          if (!isNaN(count)) {
            console.log('[WebSocket] 👥 참가자 수 수신:', count);
            setParticipantsCount(count);
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

    client.activate();

    return () => {
      console.log('[WebSocket] 🧹 Cleaning up WebSocket connection...');

      chatSubscription?.unsubscribe();
      participantSubscription?.unsubscribe();

      if (clientRef.current?.active) {
        clientRef.current.deactivate().then(() => {
          console.log('[WebSocket] 🧼 Disconnected cleanly');
          clientRef.current = null;
          setIsConnected(false);
        });
      }
    };
  }, [roomId, onMessageReceived]);

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

  return { sendMessage, isConnected, participantsCount };
};

export default useWebSocket;
