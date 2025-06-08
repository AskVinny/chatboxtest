import cache from "../cache";

export type Message = { role: "user" | "assistant" | "system"; content: string };

export async function getMessages(userId: string): Promise<Message[]> {
    const raw = await cache.get(`messages:${userId}`);
  
    if (!raw) return [];
  
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.log("error parsing messages", error);
        return [];
      }
    }
    return raw;
  }
  
  export async function setMessages(userId: string, messages: Message[]) {
    await cache.set(`messages:${userId}`, JSON.stringify(messages));
  }