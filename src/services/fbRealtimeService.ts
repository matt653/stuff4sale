import { FBNotification } from "../types";

type NotificationCallback = (notification: FBNotification) => void;
type StatusCallback = (connected: boolean) => void;

class FBRealtimeService {
  private eventSource: EventSource | null = null;
  private notificationListeners: Set<NotificationCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private isConnected = false;
  private reconnectTimer: any = null;

  public connect() {
    if (this.eventSource) {
      return;
    }

    try {
      this.eventSource = new EventSource("/api/fb/stream");

      this.eventSource.onopen = () => {
        console.log("🟢 Connected to Facebook Real-Time Notification Stream (SSE)");
        this.isConnected = true;
        this.notifyStatus(true);
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "ping") {
            return;
          }

          if (data.type === "fb_notification" && data.notification) {
            this.notifyNotification(data.notification);
          }
        } catch (err) {
          console.error("Error parsing SSE event data:", err);
        }
      };

      this.eventSource.onerror = (err) => {
        console.warn("⚠️ Facebook Real-Time Stream disconnected or lost connection:", err);
        this.isConnected = false;
        this.notifyStatus(false);
        this.disconnect();
        
        // Attempt reconnect after 5s
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 5000);
        }
      };
    } catch (e) {
      console.error("Failed to establish SSE connection:", e);
      this.isConnected = false;
      this.notifyStatus(false);
    }
  }

  public disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
    this.notifyStatus(false);
  }

  public onNotification(callback: NotificationCallback): () => void {
    this.notificationListeners.add(callback);
    return () => {
      this.notificationListeners.delete(callback);
    };
  }

  public onStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    // Send immediate initial state
    callback(this.isConnected);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private notifyNotification(notification: FBNotification) {
    this.notificationListeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (err) {
        console.error("Error in notification listener:", err);
      }
    });
  }

  private notifyStatus(status: boolean) {
    this.statusListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (err) {
        console.error("Error in status listener:", err);
      }
    });
  }

  public async simulateEvent(payload: {
    type: "message" | "comment" | "lead";
    senderName: string;
    messageText: string;
    itemTitle?: string;
    itemId?: string;
  }) {
    try {
      const response = await fetch("/api/fb/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch (err: any) {
      console.error("Failed to trigger simulated FB event:", err);
      throw err;
    }
  }
}

export const fbRealtimeService = new FBRealtimeService();
