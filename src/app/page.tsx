"use client";
import { MAX_MESSAGE_LENGTH } from "../constants/index";
import { useState, useRef, useEffect } from "react";

interface UserPreferences {
  favoriteCountry: string;
  favoriteContinent: string;
  favoriteDestination: string;
}

export default function Home() {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  // Fetch preferences and suggestions from server
  useEffect(() => {
    fetch("/api/messages")
      .then((res) => res.json())
      .then((msgs) => {
        setMessages(msgs);
      });

    fetch("/api/preferences")
      .then((res) => res.json())
      .then((prefs) => {
        if (prefs.suggestions) {
          setSuggestions(prefs.suggestions);
        }
        setUserPreferences(prefs);
      });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView();
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    setLoading(true);
    const userMessage = { role: "user" as const, content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const res = await fetch("/api/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage.content }),
    });

    if (res.status !== 200) {
      const errorMsg = await res.text();
      // Show error to user (replace with your preferred UI)
      alert(errorMsg); // or setError(errorMsg) for inline display
      setLoading(false);
      return;
    }

    if (!res.body) {
      setLoading(false);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let ai = "";
    setMessages((prev) => [
      ...prev,
      { role: "assistant" as const, content: "" },
    ]);
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      ai += decoder.decode(value);
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: ai };
        return copy;
      });
    }
    setLoading(false);
    // After each message, check if preferences have been updated
    const prefsRes = await fetch("/api/preferences");
    const prefsData = await prefsRes.json();
    setUserPreferences(prefsData);
    setSuggestions(prefsData.suggestions || []);
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  // Block sending normal questions if preferences are not set
  const preferencesMissing =
    !userPreferences?.favoriteCountry ||
    !userPreferences?.favoriteContinent ||
    !userPreferences?.favoriteDestination;

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] flex flex-col rounded-lg shadow-lg border bg-white dark:bg-gray-900">
      <div className="p-4 border-b dark:border-gray-700 flex flex-col">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Geography Chat
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ask me anything about world geography!
        </p>
      </div>
      {!preferencesMissing && suggestions.length > 0 && (
        <div className="p-3 flex flex-wrap gap-2 border-b dark:border-gray-700">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(s)}
              className="px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-xs"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 text-sm">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] break-words ${
              m.role === "user"
                ? "self-end bg-blue-600 text-white"
                : "self-start bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-50"
            } rounded-md px-3 py-2`}
          >
            {m.content}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="p-3 flex gap-2 border-t dark:border-gray-700">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          maxLength={MAX_MESSAGE_LENGTH}
          className="flex-1 rounded-md border px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600"
          placeholder={
            preferencesMissing
              ? "Please answer the assistant's questions to set your preferences..."
              : "Ask about world geography..."
          }
          disabled={loading}
        />
        <button
          onClick={send}
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
