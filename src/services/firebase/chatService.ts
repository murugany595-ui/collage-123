import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import { ChatMessage } from "../chatbotService";

export interface StoredChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  createdAt: string;
  actions?: Array<{ label: string; target: string }>;
  fromFallback?: boolean;
}

export interface StoredChatConversation {
  userId: string;
  userName?: string;
  userEmail?: string;
  role?: string;
  department?: string;
  lastMessage?: string;
  lastSender?: "user" | "bot";
  createdAt: string;
  updatedAt: string;
}

export const chatService = {
  /**
   * Save a user or bot message in chat_conversations/{userId}/messages/{messageId}
   * and update the parent conversation doc.
   */
  async saveMessage(params: {
    userId: string;
    sender: "user" | "bot";
    text: string;
    actions?: Array<{ label: string; target: string }>;
    fromFallback?: boolean;
    userMeta?: {
      name?: string;
      email?: string;
      role?: string;
      department?: string;
    };
  }): Promise<ChatMessage> {
    const { userId, sender, text, actions, fromFallback, userMeta } = params;
    const cleanUid = auth.currentUser?.uid || userId;
    if (!cleanUid) {
      throw new Error("User must be authenticated to save chat messages.");
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const displayTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const messageData: StoredChatMessage = {
      id: messageId,
      sender,
      text,
      timestamp: displayTime,
      createdAt: nowIso,
      actions: actions || [],
      fromFallback: !!fromFallback,
    };

    const convRef = doc(db, "chat_conversations", cleanUid);
    const msgRef = doc(db, "chat_conversations", cleanUid, "messages", messageId);

    try {
      // 1. Update parent conversation metadata
      await setDoc(
        convRef,
        {
          userId: cleanUid,
          userName: userMeta?.name || auth.currentUser?.displayName || "User",
          userEmail: userMeta?.email || auth.currentUser?.email || "",
          role: userMeta?.role || "student",
          department: userMeta?.department || "",
          lastMessage: text.slice(0, 300),
          lastSender: sender,
          updatedAt: nowIso,
          createdAt: nowIso,
        },
        { merge: true }
      );

      // 2. Save individual message into messages subcollection
      await setDoc(msgRef, messageData);

      // Cache locally
      try {
        const cacheKey = `chat_history_${cleanUid}`;
        const raw = localStorage.getItem(cacheKey);
        const existing = raw ? JSON.parse(raw) : [];
        existing.push(messageData);
        localStorage.setItem(cacheKey, JSON.stringify(existing.slice(-100)));
      } catch {}

      return {
        id: messageId,
        sender,
        text,
        timestamp: displayTime,
        actions,
        fromFallback,
      };
    } catch (err) {
      console.warn(`[ChatService] Firestore save error for chat_conversations/${cleanUid}:`, err);
      // Even if Firestore returns permission denied, preserve in local cache for session
      try {
        const cacheKey = `chat_history_${cleanUid}`;
        const raw = localStorage.getItem(cacheKey);
        const existing = raw ? JSON.parse(raw) : [];
        existing.push(messageData);
        localStorage.setItem(cacheKey, JSON.stringify(existing.slice(-100)));
      } catch {}

      return {
        id: messageId,
        sender,
        text,
        timestamp: displayTime,
        actions,
      };
    }
  },

  /**
   * Load previous chat history for the user from Firestore
   */
  async loadChatHistory(userId: string): Promise<ChatMessage[]> {
    const cleanUid = auth.currentUser?.uid || userId;
    if (!cleanUid) return [];

    const path = `chat_conversations/${cleanUid}/messages`;
    try {
      const msgsRef = collection(db, "chat_conversations", cleanUid, "messages");
      let snap;
      try {
        const q = query(msgsRef, orderBy("createdAt", "asc"));
        snap = await getDocs(q);
      } catch (orderErr) {
        console.warn("[ChatService] Ordered query fallback:", orderErr);
        snap = await getDocs(msgsRef);
      }

      if (!snap.empty) {
        const list = snap.docs.map((d) => {
          const data = d.data() as StoredChatMessage;
          return {
            id: d.id,
            sender: data.sender,
            text: data.text,
            timestamp: data.timestamp || new Date(data.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            createdAt: data.createdAt || "",
            actions: data.actions || [],
            fromFallback: data.fromFallback,
          };
        });

        const sorted = list.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
        try {
          localStorage.setItem(`chat_history_${cleanUid}`, JSON.stringify(sorted));
        } catch {}
        return sorted;
      }
    } catch (err: any) {
      console.warn("[ChatService] Could not load chat history from Firestore:", err?.message || err);
    }

    // Fallback to local cache if Firestore is pending rules propagation or offline
    try {
      const raw = localStorage.getItem(`chat_history_${cleanUid}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    return [];
  },

  /**
   * Real-time listener for user's chat messages
   */
  subscribeToChatHistory(
    userId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    const cleanUid = auth.currentUser?.uid || userId;
    if (!cleanUid) {
      callback([]);
      return () => {};
    }

    const path = `chat_conversations/${cleanUid}/messages`;
    const msgsRef = collection(db, "chat_conversations", cleanUid, "messages");
    const q = query(msgsRef, orderBy("createdAt", "asc"));

    return onSnapshot(
      q,
      (snap) => {
        const msgs = snap.docs.map((d) => {
          const data = d.data() as StoredChatMessage;
          return {
            id: d.id,
            sender: data.sender,
            text: data.text,
            timestamp: data.timestamp || new Date(data.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            actions: data.actions || [],
            fromFallback: data.fromFallback,
          };
        });
        callback(msgs);
      },
      (err) => {
        console.warn(`[ChatService] Remote subscription notice for ${path}:`, err?.message || err);
        // Graceful fallback to local cache
        try {
          const raw = localStorage.getItem(`chat_history_${cleanUid}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              callback(parsed);
            }
          }
        } catch {}
      }
    );
  },

  /**
   * Clear chat history for the user
   */
  async clearChatHistory(userId: string): Promise<void> {
    const cleanUid = auth.currentUser?.uid || userId;
    if (!cleanUid) return;

    try {
      try {
        localStorage.removeItem(`chat_history_${cleanUid}`);
      } catch {}

      const msgsRef = collection(db, "chat_conversations", cleanUid, "messages");
      const snap = await getDocs(msgsRef);
      const batch = writeBatch(db);
      snap.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();

      // Reset lastMessage on parent
      await setDoc(
        doc(db, "chat_conversations", cleanUid),
        {
          lastMessage: "",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn(`[ChatService] Failed to delete Firestore messages for ${cleanUid}:`, err);
    }
  },
};
