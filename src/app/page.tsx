"use client";
import { useState, useRef, useEffect } from "react";
import * as yup from "yup";

interface UserPreferences {
  favoriteCountry: string;
  favoriteContinent: string;
  favoriteDestination: string;
}

interface PreferencesResponse extends UserPreferences {
  suggestions: string[];
}

const preferencesSchema = yup.object().shape({
  favoriteCountry: yup.string().required("Favorite country is required"),
  favoriteContinent: yup
    .string()
    .oneOf(
      [
        "Africa",
        "Antarctica",
        "Asia",
        "Europe",
        "North America",
        "South America",
        "Oceania",
      ],
      "Favorite continent must be a valid continent. Valid continents are: Africa, Antarctica, Asia, Europe, North America, South America, Oceania"
    )
    .required("Favorite continent is required"),
  favoriteDestination: yup
    .string()
    .required("Favorite destination is required"),
});

export default function Home() {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UserPreferences>({
    favoriteCountry: "",
    favoriteContinent: "",
    favoriteDestination: "",
  });
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof UserPreferences, string>>
  >({});
  const endRef = useRef<HTMLDivElement>(null);

  // Fetch preferences and suggestions from server
  useEffect(() => {
    fetch("/api/preferences")
      .then((res) => res.json())
      .then((data: PreferencesResponse) => {
        // If preferences are not set, redirect to onboarding
        if (
          !data.favoriteCountry &&
          !data.favoriteContinent &&
          !data.favoriteDestination
        ) {
          window.location.href = "/onboarding";
          return;
        }
        setUserPreferences(data);
        setForm(data);
        setSuggestions(data.suggestions || []);
        setMessages([
          {
            role: "assistant",
            content: `Welcome to Geography Chat! I see you're interested in ${data.favoriteCountry}, ${data.favoriteContinent}, and ${data.favoriteDestination}.`,
          },
        ]);
      });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView();
  }, [messages]);

  async function send() {
    if (!input.trim() || !userPreferences) return;

    const userMessage = { role: "user" as const, content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const res = await fetch("/api/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: input.trim(),
      }),
    });

    if (!res.body) return;
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
  }

  // Handle preferences form
  const handleFormChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    try {
      await preferencesSchema.validateAt(name, { ...form, [name]: value });
      setFormErrors((errors) => ({ ...errors, [name]: "" }));
    } catch (err: any) {
      setFormErrors((errors) => ({ ...errors, [name]: err.message }));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await preferencesSchema.validate(form, { abortEarly: false });
      setFormErrors({});
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const updated = await res.json();
      setUserPreferences(updated);
      setEditing(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: `Preferences updated! Now your favorite country is ${updated.favoriteCountry}, continent is ${updated.favoriteContinent}, and destination is ${updated.favoriteDestination}.`,
        },
      ]);
    } catch (err: any) {
      if (err.inner) {
        // Yup validation error with multiple fields
        const errors: Partial<Record<keyof UserPreferences, string>> = {};
        err.inner.forEach((e: any) => {
          errors[e.path as keyof UserPreferences] = e.message;
        });
        setFormErrors(errors);
      } else {
        // Single field error
        setFormErrors({ [err.path]: err.message });
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  if (!userPreferences) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] flex flex-col rounded-lg shadow-lg border bg-white dark:bg-gray-900">
      <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Geography Chat
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ask me anything about world geography!
          </p>
        </div>
        <button
          onClick={() => setEditing((e) => !e)}
          className="text-xs text-blue-600 underline"
        >
          Edit Preferences
        </button>
      </div>
      {editing && (
        <form
          onSubmit={handleFormSubmit}
          className="p-3 space-y-2 border-b dark:border-gray-700"
        >
          <div>
            <input
              name="favoriteCountry"
              value={form.favoriteCountry}
              onChange={handleFormChange}
              placeholder="Favorite Country"
              className="w-full px-2 py-1 rounded border"
            />
            {formErrors.favoriteCountry && (
              <div className="text-xs text-red-500 mt-1">
                {formErrors.favoriteCountry}
              </div>
            )}
          </div>
          <div>
            <input
              name="favoriteContinent"
              value={form.favoriteContinent}
              onChange={handleFormChange}
              placeholder="Favorite Continent"
              className="w-full px-2 py-1 rounded border"
            />
            {formErrors.favoriteContinent && (
              <div className="text-xs text-red-500 mt-1">
                {formErrors.favoriteContinent}
              </div>
            )}
          </div>
          <div>
            <input
              name="favoriteDestination"
              value={form.favoriteDestination}
              onChange={handleFormChange}
              placeholder="Favorite Destination"
              className="w-full px-2 py-1 rounded border"
            />
            {formErrors.favoriteDestination && (
              <div className="text-xs text-red-500 mt-1">
                {formErrors.favoriteDestination}
              </div>
            )}
          </div>
          <button
            type="submit"
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            Save
          </button>
        </form>
      )}
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
          className="flex-1 rounded-md border px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600"
          placeholder="Ask about world geography..."
        />
        <button
          onClick={send}
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Send
        </button>
      </div>
    </div>
  );
}
