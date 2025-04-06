import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_ENDPOINT } from '../utils/constants';

export default class WebSocketService {
  private static instance: WebSocketService;
  private client: Client | null = null;
  private subscriptions: Record<string, StompSubscription> = {};

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public connect(accessToken: string, onConnectCallback?: () => void): void {
    if (this.client) {
      this.disconnect();
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_ENDPOINT),
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      debug: (msg) => console.log('STOMP DEBUG:', msg),
      onConnect: () => {
        console.log('Connected to WebSocket');
        if (onConnectCallback) {
          onConnectCallback();
        }
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
      onWebSocketClose: () => {
        console.log('WebSocket connection closed');
        // 자동 재연결 시도
        setTimeout(() => this.reconnect(accessToken), 5000);
      },
      reconnectDelay: 5000,
    });

    this.client.activate();
  }

  private reconnect(accessToken: string): void {
    if (this.client && !this.client.active) {
      this.connect(accessToken);
    }
  }

  public disconnect(): void {
    if (this.client) {
      Object.values(this.subscriptions).forEach(subscription => {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.warn('Unsubscribe error:', error);
        }
      });
      this.subscriptions = {};

      try {
        this.client.deactivate();
      } catch (error) {
        console.warn('Disconnect error:', error);
      }
      this.client = null;
    }
  }

  public subscribe(
    destination: string,
    callback: (message: any) => void,
    subscriptionId?: string
  ): string {
    if (!this.client || !this.client.active) {
      console.warn('WebSocket not connected. Unable to subscribe.');
      return '';
    }

    const id = subscriptionId || destination;
    try {
      const subscription = this.client.subscribe(destination, (message: IMessage) => {
        try {
          const body = JSON.parse(message.body);
          callback(body);
        } catch (error) {
          console.error('Message parsing error:', error);
        }
      });
      this.subscriptions[id] = subscription;
      return id;
    } catch (error) {
      console.error('Subscribe error:', error);
      return '';
    }
  }

  public unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions[subscriptionId];
    if (subscription) {
      try {
        subscription.unsubscribe();
        delete this.subscriptions[subscriptionId];
      } catch (error) {
        console.warn('Unsubscribe error:', error);
      }
    }
  }

  public send(destination: string, body: any): void {
    if (!this.client || !this.client.active) {
      console.warn('WebSocket not connected. Unable to send message.');
      return;
    }

    try {
      this.client.publish({
        destination,
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error('Message send error:', error);
    }
  }

  public isConnected(): boolean {
    return !!this.client && this.client.active;
  }
}