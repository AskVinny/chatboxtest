import { kv } from "@vercel/kv";

// FYI: https://github.com/vercel/storage/issues/281

const cache = {
  async get(key: string): Promise<string | null> {
    try {
      return await kv.get(key);
    } catch (error) {
      console.error("KV get error:", error);
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    try {
      await kv.set(key, value);
    } catch (error) {
      console.error("KV set error:", error);
    }
  },
};

export default cache;
