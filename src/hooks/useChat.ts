"use client";

import { useMutation } from "@tanstack/react-query";
import { useState, useCallback } from "react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  documentIds?: string[];
  processingTimeMs?: number;
  timestamp: Date;
};

type ChatResponse = {
  answer: string;
  documentIds: string[];
  chunkCount: number;
  processingTimeMs: number;
};

async function sendMessage(question: string): Promise<ChatResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to send message");
  }

  return res.json();
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const mutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: (data, question) => {
      // Add assistant response
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer,
          documentIds: data.documentIds,
          processingTimeMs: data.processingTimeMs,
          timestamp: new Date(),
        },
      ]);
    },
  });

  const send = useCallback(
    (question: string) => {
      // Add user message immediately
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: question,
          timestamp: new Date(),
        },
      ]);

      // Send to API
      mutation.mutate(question);
    },
    [mutation]
  );

  const clear = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    send,
    clear,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
