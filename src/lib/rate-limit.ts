import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import { headers } from "next/headers";

export const MAX_REQUESTS = 10; // 10 requests per minute

// Create a new ratelimiter that allows 10 requests per 60 seconds
const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(MAX_REQUESTS, "60 s"),
  analytics: true,
  prefix: "ratelimit",
});

export async function checkRateLimit(): Promise<{
  success: boolean;
  response?: Response;
  remaining?: number;
  reset?: number;
}> {
  const headersList = await headers();
  const ip = getClientIp(headersList);

  const { success, limit, reset, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          remaining,
          reset,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      ),
    };
  }

  return {
    success: true,
    remaining,
    reset,
  };
}

function getClientIp(headersList: Headers): string {
  // Common headers for client IP, in order of preference
  const ipHeaders = [
    "x-forwarded-for", // Most common, contains comma-separated list of IPs
    "x-real-ip", // Direct client IP
    "cf-connecting-ip", // Cloudflare
    "true-client-ip", // Akamai and Cloudflare
    "x-forwarded", // Alternative format
    "forwarded-for", // Alternative format
    "forwarded", // Standard Forwarded header
  ];

  for (const header of ipHeaders) {
    const value = headersList.get(header);
    if (value) {
      // For x-forwarded-for, take the first IP (client IP)
      if (header === "x-forwarded-for") {
        return value.split(",")[0].trim();
      }
      return value;
    }
  }

  return "unknown";
}
