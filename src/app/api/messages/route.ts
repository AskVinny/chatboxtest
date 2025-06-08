import { getMessages, Message, setMessages } from "../../../lib/messages";
import { NextResponse } from "next/server";
import { getUserId } from "@/lib/user";

export async function GET(request: Request) {
  const userId = await getUserId(request);

  const messages: Message[] = await getMessages(userId);

  // If no messages and preferences are missing, add onboarding assistant message
  if (messages.length === 0) {
    const onboardingMsg = {
      role: "assistant" as const,
      content:
        "Welcome to Geography Chat! To personalize your experience, I need to know your favorite country, continent, and destination. Let's start! What is your favorite country?",
    };
    messages.push(onboardingMsg);
    await setMessages(userId, messages);
  }

  return NextResponse.json(messages);
}
